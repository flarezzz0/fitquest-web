import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface WorkoutLog {
  date: string;
  activity: string;
  activityId?: string;
  duration?: number;
  distance?: number;
  calories?: number;
  coins: number;
  bonus: string | null;
  verified: boolean;
  imageUri?: string;
  fraudScore?: number;
  riskLevel?: string;
}

export interface UserProfile {
  weight?: number;
  height?: number;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  bio?: string;
}

export interface AppState {
  user: UserInfo | null;
  profile: UserProfile;
  coins: number;
  totalCoinsEarned: number;
  streak: number;
  longestStreak: number;
  frozenUsed: boolean;
  totalWorkouts: number;
  todayCount: number;
  weekCount: number;
  level: number;
  workoutLog: WorkoutLog[];
  questProgress: Record<string, number>;
  questClaimed: string[];
  shopBought: string[];
  backendAvailable: boolean;
  lastVerification: WorkoutLog | null;
  lastDailyReset: string;  // ISO date of last daily quest/shop reset
  lastWeeklyReset: string; // ISO date of last weekly reset
  _hydrated: boolean;
  setUser: (u: UserInfo | null) => void;
  setBackend: (b: boolean) => void;
  setProfile: (p: UserProfile) => void;
  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  addWorkout: (log: WorkoutLog) => void;
  updateStreak: (s: number) => void;
  claimQuest: (id: string) => boolean;
  buyItem: (id: string) => boolean;
  setVerification: (v: WorkoutLog) => void;
  hydrate: () => Promise<void>;
  checkDailyReset: () => void;
  checkWeeklyReset: () => void;
  clearAllData: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  profile: {},
  coins: 0,
  totalCoinsEarned: 0,
  streak: 0,
  longestStreak: 0,
  frozenUsed: false,
  totalWorkouts: 0,
  todayCount: 0,
  weekCount: 0,
  level: 1,
  workoutLog: [],
  questProgress: {},
  questClaimed: [],
  shopBought: [],
  backendAvailable: false,
  lastVerification: null,
  lastDailyReset: "",
  lastWeeklyReset: "",
  _hydrated: false,

  setUser: async (u) => {
    const resetData = { coins: 0, totalCoinsEarned: 0, streak: 0, longestStreak: 0, totalWorkouts: 0, todayCount: 0, weekCount: 0, level: 1, workoutLog: [], questProgress: {}, questClaimed: [], shopBought: [] };
    if (!u) return set({ user: null, ...resetData });
    const raw = await AsyncStorage.getItem(`fitquest_v3_${u.id}`);
    set(raw ? { ...JSON.parse(raw), user: u } : { user: u, ...resetData });
  },
  setBackend: (b) => set({ backendAvailable: b }),
  setProfile: (p) => set({ profile: p }),

  addCoins: (n) => set((s) => ({ coins: s.coins + n, totalCoinsEarned: s.totalCoinsEarned + n })),
  spendCoins: (n) => {
    if (get().coins < n) return false;
    set((s) => ({ coins: s.coins - n }));
    return true;
  },
  addWorkout: (log) =>
    set((s) => {
      const qp = { ...s.questProgress };
      // ✅ d_cardio_20: คาร์ดิโอ 20 นาที
      if (log.activityId === "cardio" && (log.duration || 0) >= 20) {
        qp.d_cardio_20 = (qp.d_cardio_20 || 0) + 1;
      }
      // ✅ d_stretch: ยืดกล้ามเนื้อ 10 นาที
      if (log.activityId === "yoga" && (log.duration || 0) >= 10) {
        qp.d_stretch = (qp.d_stretch || 0) + 1;
      }
      // ✅ d_steps_5k: เดิน (อาศัยระยะทาง)
      if (log.activityId === "walk" && (log.distance || 0) >= 5) {
        qp.d_steps_5k = (qp.d_steps_5k || 0) + 1;
      }

      // Weekly quests
      if (log.activityId === "cardio") {
        qp.w_cardio_3 = (qp.w_cardio_3 || 0) + 1;
      }
      // w_cal_2000: สะสมแคลอรี
      if (log.calories) {
        qp.w_cal_2000 = (qp.w_cal_2000 || 0) + log.calories;
      }
      // w_all_types: จำนวนประเภทกิจกรรมที่ไม่ซ้ำ
      const allIds = [log.activityId || log.activity, ...s.workoutLog.map((l) => l.activityId || l.activity)];
      const unique = new Set(allIds);
      qp.w_all_types = unique.size;

      // w_gym_4: จำนวนวันที่ออกกำลังกายไม่ซ้ำกัน
      const allDates = [log.date.slice(0, 10), ...s.workoutLog.map((l) => l.date.slice(0, 10))];
      const uniqueDays = new Set(allDates);
      qp.w_gym_4 = uniqueDays.size;

      return {
        workoutLog: [log, ...s.workoutLog].slice(0, 100),
        totalWorkouts: s.totalWorkouts + 1,
        todayCount: s.todayCount + 1,
        weekCount: s.weekCount + 1,
        questProgress: qp,
      };
    }),
  updateStreak: (s) => set((st) => ({ streak: s, longestStreak: Math.max(st.longestStreak, s) })),
  claimQuest: (id) => {
    if (get().questClaimed.includes(id)) return false;
    set((state) => ({ questClaimed: [...state.questClaimed, id], questProgress: { ...state.questProgress, [id]: (state.questProgress[id] || 0) + 1 } }));
    return true;
  },
  buyItem: (id) => {
    if (get().shopBought.includes(id)) return false;
    set((s) => ({ shopBought: [...s.shopBought, id] }));
    return true;
  },
  setVerification: (v) => set({ lastVerification: v }),

  checkDailyReset: () => {
    const now = new Date();
    const thaiNow = new Date(now.getTime() + 7 * 3600000);
    const reset = Date.UTC(thaiNow.getUTCFullYear(), thaiNow.getUTCMonth(), thaiNow.getUTCDate(), 22, 0, 0);
    const last = get().lastDailyReset;
    if (!last || new Date(last).getTime() < reset) {
      set({ questClaimed: [], shopBought: [], lastDailyReset: new Date(reset).toISOString() });
    }
  },
  checkWeeklyReset: () => {
    const now = new Date();
    const thaiNow = new Date(now.getTime() + 7 * 3600000);
    const dw = (thaiNow.getUTCDay() + 6) % 7;
    const reset = Date.UTC(thaiNow.getUTCFullYear(), thaiNow.getUTCMonth(), thaiNow.getUTCDate() - dw, 22, 0, 0);
    const last = get().lastWeeklyReset;
    if (!last || new Date(last).getTime() < reset) set({ lastWeeklyReset: new Date(reset).toISOString() });
  },
  clearAllData: () => set({
    user: null,
    coins: 0, totalCoinsEarned: 0, streak: 0, longestStreak: 0,
    totalWorkouts: 0, todayCount: 0, weekCount: 0, level: 1,
    workoutLog: [], questProgress: {}, questClaimed: [], shopBought: [],
  }),

  hydrate: async () => {
    try {
      const lastUserId = await AsyncStorage.getItem("fitquest_last_login");
      if (lastUserId) {
        const raw = await AsyncStorage.getItem(`fitquest_v3_${lastUserId}`);
        if (raw) return set({ ...JSON.parse(raw), _hydrated: true });
      }
      set({ _hydrated: true });
    } catch {
      set({ _hydrated: true });
    }
  },
}));

useStore.subscribe((state) => {
  const { _hydrated, backendAvailable, user, ...data } = state;
  if (user?.id) {
    AsyncStorage.setItem(`fitquest_v3_${user.id}`, JSON.stringify({ user, ...data })).catch(() => {});
    AsyncStorage.setItem("fitquest_last_login", user.id).catch(() => {});
  } else {
    AsyncStorage.removeItem("fitquest_last_login").catch(() => {});
  }
});
