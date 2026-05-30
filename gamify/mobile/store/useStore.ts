import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";

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

    // 📡 Cloud sync: ดึงข้อมูลจาก Supabase ทับ (ถ้ามี)
    try {
      const { data } = await supabase.from("users").select("*").eq("id", u.id).single();
      if (data) {
        set({
          coins: data.coins ?? get().coins,
          totalCoinsEarned: Math.max(data.total_coins_earned ?? 0, get().totalCoinsEarned),
          streak: Math.max(data.streak ?? 0, get().streak),
          longestStreak: Math.max(data.longest_streak ?? 0, get().longestStreak),
          totalWorkouts: Math.max(data.total_workouts ?? 0, get().totalWorkouts),
          level: Math.max(data.level ?? 1, get().level),
          profile: {
            weight: data.weight ?? get().profile.weight,
            height: data.height ?? get().profile.height,
          },
        });
      } else {
        // user ใหม่ → สร้าง row ใน cloud
        await supabase.from("users").insert({
          id: u.id, email: u.email, name: u.name, picture: u.picture,
        });
      }
    } catch (e) {
      console.warn("Cloud sync failed, using local:", e);
    }
  },
  setBackend: (b) => set({ backendAvailable: b }),
  setProfile: (p) => {
    set({ profile: p });
    // 📡 Cloud sync
    const { user } = get();
    if (user?.id) {
      supabase.from("users").update({ weight: p.weight, height: p.height, updated_at: new Date().toISOString() })
        .eq("id", user.id).then(({ error }) => { if (error) console.warn("profile sync failed:", error); });
    }
  },

  addCoins: (n) => {
    set((s) => ({ coins: s.coins + n, totalCoinsEarned: s.totalCoinsEarned + n }));
    // 📡 Cloud sync
    const { user } = get();
    if (user?.id) {
      supabase.rpc("increment_coins", { uid: user.id, amount: n }).then(({ error }) => {
        if (error) console.warn("coins sync failed:", error);
      });
    }
  },
  spendCoins: (n) => {
    if (get().coins < n) return false;
    set((s) => ({ coins: s.coins - n }));
    // 📡 Cloud sync
    const { user } = get();
    if (user?.id) {
      supabase.from("users").update({ coins: get().coins, updated_at: new Date().toISOString() })
        .eq("id", user.id).then(({ error }) => { if (error) console.warn("spend sync failed:", error); });
    }
    return true;
  },
  addWorkout: (log) => {
    set((s) => {
      const qp = { ...s.questProgress };

      // ===== STACKING LOGIC =====
      // daily quests (สะสมเวลา/ระยะทางไปทุกเควสที่ตรงประเภท)
      if (log.activityId === "cardio") {
        qp.d_cardio_20 = (qp.d_cardio_20 || 0) + (log.duration || 0);
        qp.w_cardio_3 = (qp.w_cardio_3 || 0) + 1; // weekly: นับครั้ง
      }
      if (log.activityId === "yoga") {
        qp.d_stretch = (qp.d_stretch || 0) + (log.duration || 0);
      }
      if (log.activityId === "walk") {
        // แปลง กม → ก้าว (1 กม ≈ 1312 ก้าว)
        const steps = Math.round((log.distance || 0) * 1312);
        qp.d_steps_5k = (qp.d_steps_5k || 0) + steps;
      }
      if (log.activityId === "weights") {
        // weights: increment for w_gym_4 (นับวันที่)
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
    });

    // 📡 Cloud sync: fire & forget
    const { user } = get();
    if (user?.id) {
      supabase.from("workout_logs").insert({
        user_id: user.id, date: log.date, activity: log.activity,
        activity_id: log.activityId, duration: log.duration,
        distance: log.distance, calories: log.calories, coins: log.coins,
        bonus: log.bonus, verified: log.verified, image_uri: log.imageUri,
        fraud_score: log.fraudScore, risk_level: log.riskLevel,
      }).then(({ error }) => {
        if (error) console.warn("workout sync failed:", error);
      });

      // sync user stats
      const st = get();
      supabase.from("users").update({
        coins: st.coins, total_coins_earned: st.totalCoinsEarned,
        streak: st.streak, longest_streak: st.longestStreak,
        total_workouts: st.totalWorkouts,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id).then(({ error }) => {
        if (error) console.warn("user stats sync failed:", error);
      });
    }
  },
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
      // Clear daily quests progress + shop
      const qp = { ...get().questProgress };
      Object.keys(qp).forEach((k) => { if (k.startsWith("d_")) delete qp[k]; });
      set({ questClaimed: [], shopBought: [], questProgress: qp, lastDailyReset: new Date(reset).toISOString() });
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
  clearAllData: () => {
    set((s) => ({
      coins: 0, totalCoinsEarned: 0, streak: 0, longestStreak: 0,
      totalWorkouts: 0, todayCount: 0, weekCount: 0, level: 1,
      workoutLog: [], questProgress: {}, questClaimed: [], shopBought: [],
    }));
    // 📡 sync ขึ้น cloud
    const { user } = get();
    if (user?.id) {
      supabase.from("users").update({
        coins: 0, total_coins_earned: 0,
        streak: 0, longest_streak: 0,
        total_workouts: 0, level: 1,
      }).eq("id", user.id).then(() => {});
    }
  },

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
