import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from "react-native";
import { useStore } from "../store/useStore";
import { colors } from "../theme/colors";

const weeklyQuestsDef = [
  { id: "w_cardio_3", name: "คาร์ดิโอครบ 3 ครั้ง", target: 3 },
  { id: "w_gym_4", name: "เข้าฟิตเนส 4 วัน", target: 4 },
  { id: "w_all_types", name: "ออกกำลังครบทุกประเภท", target: 4 },
  { id: "w_cal_2000", name: "เผาผลาญ 2,000 kcal", target: 2000 },
];

export default function DesktopDashboard() {
  const { coins, level, totalCoinsEarned, streak, frozenUsed, totalWorkouts, todayCount, weekCount, workoutLog, questProgress, user, profile, setProfile } = useStore();

  const mult = streak <= 0 ? 1 : streak <= 3 ? 1 : streak <= 7 ? 1.5 : 2;
  const dailyPct = Math.min(100, (todayCount / 5) * 100);

  // First-time setup
  const [showSetup, setShowSetup] = useState(false);
  const [setupWt, setSetupWt] = useState("");
  const [setupHt, setSetupHt] = useState("");
  useEffect(() => {
    if (user && !profile.weight) setShowSetup(true);
  }, [user]);

  const calcBMR = (w: number, h: number) => Math.round(10 * w + 6.25 * h - 5 * 25 - 161);
  const calcBMI = (w: number, h: number) => Math.round((w / ((h / 100) * (h / 100))) * 10) / 10;
  const bmr = profile.weight && profile.height ? calcBMR(profile.weight, profile.height) : 0;
  const bmi = profile.weight && profile.height ? calcBMI(profile.weight, profile.height) : 0;
  const dailyRecommend = bmr ? Math.round(bmr * 1.375) : 0;

  // Today's total calories
  const today = new Date().toISOString().slice(0, 10);
  const todayCalories = workoutLog
    .filter((l) => l.date.startsWith(today))
    .reduce((sum, l) => sum + (l.calories || 0), 0);
  const calPct = dailyRecommend > 0 ? Math.min(100, (todayCalories / dailyRecommend) * 100) : 0;
  const calColor = calPct < 25 ? colors.textMuted : calPct < 60 ? colors.success : calPct < 85 ? colors.warning : colors.error;

  const incompleteWeekly = weeklyQuestsDef.filter(q => (questProgress[q.id] || 0) < q.target).slice(0, 2);

  return (
    <>
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.pageHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ fontSize: 24 }}>🏃</Text>
          </View>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>สวัสดี {user?.name || "flare"} 🔥{streak}</Text>
            <Text style={{ fontSize: 13, color: colors.textDim, marginTop: 2 }}>LV.{level}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.gold }}>🪙 {coins}</Text>
      </View>

      {/* Calories */}
      {bmr > 0 && (
        <View style={{ backgroundColor: "rgba(26,26,46,0.75)", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: colors.textDim }}>🔥 Calories</Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: calColor }}>{todayCalories.toLocaleString()} / {dailyRecommend.toLocaleString()} kcal</Text>
          </View>
          <View style={{ width: "100%", height: 10, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden", marginBottom: 8 }}>
            <View style={{ height: "100%", borderRadius: 5, width: `${calPct}%`, backgroundColor: calColor }} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>🔥 BMR {bmr}</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>| 📏 BMI {bmi}</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>| 🎯 TDEE {dailyRecommend}</Text>
          </View>
        </View>
      )}

      {/* Daily Quest */}
      <View style={{ backgroundColor: "rgba(26,26,46,0.75)", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>✅ เควสวันนี้</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>{todayCount} / 5</Text>
        </View>
        <View style={{ width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
          <View style={{ height: "100%", borderRadius: 4, width: `${dailyPct}%`, backgroundColor: colors.primary }} />
        </View>
      </View>

      {/* Weekly Quests */}
      {incompleteWeekly.length > 0 && (
        <View style={{ backgroundColor: "rgba(26,26,46,0.75)", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 10 }}>📅 เควสสัปดาห์</Text>
          {incompleteWeekly.map((q) => {
            const p = questProgress[q.id] || 0;
            const pct = Math.min(100, (p / q.target) * 100);
            return (
              <View key={q.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={{ fontSize: 12, color: colors.textDim }}>{q.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{p}/{q.target}</Text>
                </View>
                <View style={{ width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ height: "100%", width: `${pct}%`, backgroundColor: colors.primary, borderRadius: 3 }} />
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={{ alignSelf: "center", marginTop: 2 }}>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>ดูทั้งหมด →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Activities */}
      {workoutLog.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>📋 กิจกรรมล่าสุด</Text>
          {workoutLog.slice(0, 3).map((log, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: "rgba(255,255,255,0.04)" }}>
              <Text style={{ fontSize: 18 }}>
                {log.activity === "คาร์ดิโอ" ? "🏃" : log.activity === "เวทเทรนนิ่ง" ? "🏋️" : log.activity === "เดินทั่วไป" ? "🚶" : log.activity === "HIIT" ? "💥" : log.activity === "ว่ายน้ำ" ? "🏊" : "🧘"}
              </Text>
              <Text style={{ flex: 1, fontSize: 13, color: colors.text }}>{log.activity}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.gold }}>+{log.coins}🪙</Text>
            </View>
          ))}
          <TouchableOpacity style={{ alignSelf: "center", marginTop: 4 }}>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>ดูทั้งหมด →</Text>
          </TouchableOpacity>
        </View>
      )}
      {workoutLog.length === 0 && (
        <View style={{ padding: 40, alignItems: "center" }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🏃</Text>
          <Text style={{ fontSize: 14, color: colors.textDim }}>ยังไม่มีกิจกรรม</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>เริ่มออกกำลังกายเพื่อรับเหรียญแรกของคุณ</Text>
        </View>
      )}
      {/* Main Content Grid — 2 columns */}
    </ScrollView>

      {/* First-time Setup Modal */}
      <Modal visible={showSetup} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, textAlign: "center" }}>🏃 ยินดีต้อนรับ!</Text>
            <Text style={{ fontSize: 13, color: colors.textDim, textAlign: "center", marginTop: 6, marginBottom: 20 }}>
              กรุณากรอกน้ำหนักและส่วนสูงของคุณ เพื่อคำนวณ BMR
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.textDim, marginBottom: 6 }}>⚖️ น้ำหนัก (กก.)</Text>
                <TextInput style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder, textAlign: "center" }}
                  value={setupWt} onChangeText={setSetupWt} keyboardType="decimal-pad" placeholder="65" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.textDim, marginBottom: 6 }}>📏 ส่วนสูง (ซม.)</Text>
                <TextInput style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder, textAlign: "center" }}
                  value={setupHt} onChangeText={setSetupHt} keyboardType="decimal-pad" placeholder="170" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
            <TouchableOpacity onPress={() => {
              const w = parseFloat(setupWt); const h = parseFloat(setupHt);
              if (!w || !h || w < 20 || w > 300 || h < 50 || h > 250) {
                Alert.alert("⚠️", "กรุณากรอกน้ำหนักและส่วนสูงให้ถูกต้อง"); return;
              }
              setProfile({ weight: w, height: h }); setShowSetup(false);
            }} style={{ marginTop: 20, padding: 16, backgroundColor: colors.primary, borderRadius: 14, alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>✅ บันทึก</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: "center", marginTop: 8 }}>แก้ไขภายหลังได้ที่หน้าโปรไฟล์</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 32, maxWidth: 1200, width: "100%" },
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle: { fontSize: 28, fontWeight: "700", color: colors.text },
  pageSub: { fontSize: 14, color: colors.textDim, marginTop: 4 },
  headerRight: { flexDirection: "row", gap: 12, alignItems: "center" },
  levelPill: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 9999 },
  levelText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  // Stats row
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: { fontSize: 28, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 13, color: colors.textDim, marginTop: 6 },

  // Main 2-column grid
  mainGrid: { flexDirection: "row", gap: 24 },
  leftCol: { flex: 3 },
  rightCol: { flex: 2 },

  // Progress card
  progressCard: {
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 14, padding: 20, marginBottom: 16,
  },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  progressTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  progressCount: { fontSize: 14, color: colors.textDim },
  progressBar: { height: 10, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 5 },

  // Double card row
  doubleRow: { flexDirection: "row", gap: 14, marginBottom: 24 },

  // Section title
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 12 },

  // Empty box
  emptyBox: { padding: 24, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, alignItems: "center" },

  // Recent
  recentRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: "500", color: colors.text },
  recentDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  recentCoins: { fontSize: 14, fontWeight: "700", color: colors.gold },

  // Quests
  questsContainer: { marginBottom: 20 },
  questCard: {
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 14, padding: 16, marginBottom: 10,
  },
  questInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  questName: { fontSize: 13, fontWeight: "500", color: colors.text },
  questProgress: { fontSize: 13, color: colors.gold, fontWeight: "600" },
  questBar: { height: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" },
  questFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },

  // Info card
  infoCard: {
    backgroundColor: "rgba(0,102,204,0.06)",
    borderWidth: 1, borderColor: "rgba(0,102,204,0.15)",
    borderRadius: 14, padding: 20,
  },
  infoTitle: { fontSize: 14, fontWeight: "600", color: colors.primary, marginBottom: 8 },
  infoText: { fontSize: 13, color: colors.textDim, lineHeight: 20 },
});
