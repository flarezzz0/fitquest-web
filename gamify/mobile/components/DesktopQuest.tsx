import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Vibration } from "react-native";
import { useStore } from "../store/useStore";
import { colors } from "../theme/colors";

const DQ = [
  { id: "d_exercise", name: "🏃 ออกกำลังกายวันนี้", target: 1, reward: 5 },
  { id: "d_cardio_20", name: "🏃‍♂️ คาร์ดิโอ 20 นาที", target: 1, reward: 5 },
  { id: "d_steps_5k", name: "🚶 เดิน 5,000 ก้าว", target: 5000, reward: 8 },
  { id: "d_water_8", name: "💧 ดื่มน้ำ 8 แก้ว", target: 8, reward: 3 },
  { id: "d_stretch", name: "🧘 ยืดกล้ามเนื้อ 10 นาที", target: 1, reward: 4 },
];
const WQ = [
  { id: "w_cardio_3", name: "🏃 คาร์ดิโอครบ 3 ครั้ง", target: 3, reward: 15 },
  { id: "w_gym_4", name: "🏋️ เข้ายิมครบ 4 วัน", target: 4, reward: 20 },
  { id: "w_all_types", name: "🎯 ครบทุกประเภท", target: 4, reward: 25 },
  { id: "w_cal_2000", name: "🔥 เผาผลาญ 2,000 kcal", target: 2000, reward: 30 },
];

export default function DesktopQuest() {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const { questProgress, questClaimed, claimQuest, addCoins, todayCount, checkDailyReset, checkWeeklyReset } = useStore();
  checkDailyReset(); checkWeeklyReset();
  const qs = tab === "daily" ? DQ : WQ;
  const claim = useCallback((id: string, r: number) => {
    if (claimQuest(id)) { addCoins(r); Vibration.vibrate(50); }
  }, [claimQuest, addCoins]);

  return (
    <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <View>
          <Text style={s.pageTitle}>📅 เควส</Text>
          <Text style={s.pageSub}>ทำเควสเพื่อรับเหรียญโบนัส</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
        {(["daily", "weekly"] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && { color: "#fff" }]}>{t === "daily" ? "🌞 รายวัน" : "📅 รายสัปดาห์"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.grid2}>
        {qs.map((q) => {
          const p = q.id === "d_exercise" ? todayCount : (questProgress[q.id] || 0);
          const claimed = questClaimed.includes(q.id);
          const pct = Math.min(100, (p / q.target) * 100);
          const ready = p >= q.target && !claimed;
          return (
            <View key={q.id} style={s.questCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={s.questName}>{q.name}</Text>
                <Text style={s.questReward}>+{q.reward} 🪙</Text>
              </View>
              <View style={s.barw}><View style={[s.bar, { width: `${pct}%` }]} /></View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <Text style={{ fontSize: 12, color: colors.textDim }}>{p}/{q.target}</Text>
                {claimed ? (
                  <Text style={s.claimedBtn}>✅ รับแล้ว</Text>
                ) : (
                  <TouchableOpacity disabled={!ready} style={[s.claimBtn, !ready && { opacity: 0.4 }]} onPress={() => claim(q.id, q.reward)}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: ready ? "#fff" : colors.textMuted }}>
                      {ready ? "🎁 รับรางวัล" : "🔒 กำลังทำ"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 32, maxWidth: 1100, width: "100%" },
  pageTitle: { fontSize: 24, fontWeight: "700", color: colors.text },
  pageSub: { fontSize: 13, color: colors.textDim, marginTop: 4 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 9999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.text },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  questCard: { flexBasis: "30%", minWidth: 260, flexGrow: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 18 },
  questName: { fontSize: 13, fontWeight: "600", color: colors.text, flex: 1 },
  questReward: { fontSize: 13, fontWeight: "700", color: colors.gold },
  barw: { height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginTop: 8 },
  bar: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  claimBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 9999 },
  claimedBtn: { fontSize: 12, fontWeight: "500", color: colors.textMuted },
});
