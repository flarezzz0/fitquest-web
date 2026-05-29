import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";

const DQ = [
  { id: "d_exercise", name: "🏃 ออกกำลังกายวันนี้", target: 1, reward: 5 },
  { id: "d_cardio_20", name: "🏃‍♂️ คาร์ดิโอ 20 นาที", target: 20, reward: 5, unit: "นาที" },
  { id: "d_steps_5k", name: "🚶 เดิน 5,000 ก้าว", target: 5000, reward: 8, unit: "ก้าว" },
  { id: "d_water_8", name: "💧 ดื่มน้ำ 8 แก้ว", target: 8, reward: 3, unit: "แก้ว" },
  { id: "d_stretch", name: "🧘 ยืดกล้ามเนื้อ 10 นาที", target: 10, reward: 4, unit: "นาที" },
];
const WQ = [
  { id: "w_cardio_3", name: "🏃 คาร์ดิโอครบ 3 ครั้ง", target: 3, reward: 15 },
  { id: "w_gym_4", name: "🏋️ เข้ายิมครบ 4 วัน", target: 4, reward: 20 },
  { id: "w_all_types", name: "🎯 ครบทุกประเภท", target: 4, reward: 25 },
  { id: "w_cal_2000", name: "🔥 เผาผลาญ 2,000 kcal", target: 2000, reward: 30, unit: "kcal" },
];

export default function QuestsScreen() {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const { questProgress, questClaimed, claimQuest, addCoins, todayCount, checkDailyReset, checkWeeklyReset } = useStore();
  checkDailyReset(); checkWeeklyReset();

  const qs = tab === "daily" ? DQ : WQ;

  const claim = useCallback((id: string, r: number) => {
    if (claimQuest(id)) { addCoins(r); Vibration.vibrate(50); }
  }, [claimQuest, addCoins]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 14 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 8, marginBottom: 10 }}>📅 เควส</Text>
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
          {["daily", "weekly"].map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t as any)}
              style={[ss.t, tab === t && ss.tA]}>
              <Text style={[ss.tt, tab === t && { color: "#111" }]}>{t === "daily" ? "🌞 รายวัน" : "📅 รายสัปดาห์"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}
        style={{ flex: 1 }}
      >
        {qs.map((q) => {
          const p = q.id === "d_exercise" ? todayCount : (questProgress[q.id] || 0);
          const c = questClaimed.includes(q.id);
          const pct = Math.min(100, (p / q.target) * 100);
          const ready = p >= q.target && !c;
          return (
            <View key={q.id} style={ss.qc}>
              {/* Icon + Name */}
              <Text style={{ fontSize: 20, marginBottom: 2 }}>{q.name.split(" ")[0]}</Text>
              <Text style={{ fontSize: 10, fontWeight: "600", color: colors.text, marginBottom: 4, lineHeight: 13 }} numberOfLines={2}>
                {q.name.replace(/^[^\s]+\s/, "")}
              </Text>
              {/* Reward */}
              <Text style={{ fontSize: 10, fontWeight: "700", color: colors.gold, marginBottom: 4 }}>+{q.reward} 🪙</Text>
              {/* Progress bar */}
              <View style={{ width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                <View style={{ height: "100%", backgroundColor: colors.primary, borderRadius: 2, width: `${pct}%` }} />
              </View>
              {/* Progress text + button */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 9, color: colors.textDim }}>{p}/{q.target}{q.unit ? ` ${q.unit}` : ""}</Text>
                {c ? (
                  <Text style={ss.cb}>✅</Text>
                ) : (
                  <TouchableOpacity disabled={!ready} style={[ss.cb, ready && ss.cr]} onPress={() => claim(q.id, q.reward)}>
                    <Text style={{ fontSize: 8, fontWeight: ready ? "700" : "500", color: ready ? "#111" : colors.textMuted }}>{ready ? "🎁" : "🔒"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
const ss = StyleSheet.create({
  t: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: colors.cardBorder },
  tA: { backgroundColor: colors.primary, borderColor: colors.primary },
  tt: { fontSize: 12, fontWeight: "600", color: colors.text },
  qc: { width: 145, height: 130, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 10, justifyContent: "space-between" },
  cb: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  cr: { backgroundColor: colors.success },
});
