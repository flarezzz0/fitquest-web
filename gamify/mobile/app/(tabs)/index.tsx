import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Platform, useWindowDimensions, Modal, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import EmptyState from "../../components/EmptyState";
import { useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";
import { checkHealth } from "../../services/api";
import { useTranslation } from "../../hooks/useTranslation";

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { coins, level, totalCoinsEarned, streak, frozenUsed, totalWorkouts, todayCount, weekCount, workoutLog, questProgress, setBackend, user, profile, setProfile } = useStore();
  const { t } = useTranslation();  useEffect(() => { checkHealth().then(() => setBackend(true)).catch(() => {}); }, []);

  // First-time setup
  const [showSetup, setShowSetup] = useState(false);
  const [setupWt, setSetupWt] = useState("");
  const [setupHt, setSetupHt] = useState("");
  useEffect(() => {
    if (user && !profile.weight) setShowSetup(true);
  }, [user]);

  // BMR calculation (Mifflin-St Jeor, female default)
  const calcBMR = (w: number, h: number) => Math.round(10 * w + 6.25 * h - 5 * 25 - 161);
  // BMI
  const calcBMI = (w: number, h: number) => Math.round((w / ((h / 100) * (h / 100))) * 10) / 10;
  const bmr = profile.weight && profile.height ? calcBMR(profile.weight, profile.height) : 0;
  const bmi = profile.weight && profile.height ? calcBMI(profile.weight, profile.height) : 0;
  // Recommended daily burn: TDEE ~ BMR * 1.375 (light activity)
  const dailyRecommend = bmr ? Math.round(bmr * 1.375) : 0;

  // Today's total calories burned
  const today = new Date().toISOString().slice(0, 10);
  const todayCalories = workoutLog
    .filter((l) => l.date.startsWith(today))
    .reduce((sum, l) => sum + (l.calories || 0), 0);
  const calPct = dailyRecommend > 0 ? Math.min(100, (todayCalories / dailyRecommend) * 100) : 0;
  const calColor = calPct < 25 ? colors.textMuted : calPct < 60 ? colors.success : calPct < 85 ? colors.warning : colors.error;

  const mult = streak <= 0 ? 1 : streak <= 3 ? 1 : streak <= 7 ? 1.5 : 2;
  const dailyPct = Math.min(100, (todayCount / 5) * 100);

  // Weekly quest definitions
  const weeklyQuests = [
    { id: "w_cardio_3", name: "คาร์ดิโอครบ 3 ครั้ง", target: 3 },
    { id: "w_gym_4", name: "เข้าฟิตเนส 4 วัน", target: 4 },
    { id: "w_all_types", name: "ออกกำลังครบทุกประเภท", target: 4 },
    { id: "w_cal_2000", name: "เผาผลาญ 2,000 kcal", target: 2000 },
  ];
  const incompleteWeekly = weeklyQuests.filter(q => (questProgress[q.id] || 0) < q.target).slice(0, 2);

  const s = isDesktop ? desktop : mobile;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={isDesktop ? { paddingHorizontal: 32, paddingVertical: 20 } : {}} style={{ paddingHorizontal: isDesktop ? 0 : 14 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.hdr}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: isDesktop ? 14 : 10 }}>
            <View style={s.av}><Text style={{ fontSize: isDesktop ? 28 : 22 }}>🏃</Text></View>
            <View>
              <Text style={s.greeting}>สวัสดี {user?.name || "flare"} 🔥{streak}</Text>
              <Text style={s.lvText}>LV.{level}</Text>
            </View>
          </View>
          <Text style={s.coinHeader}>🪙 {coins}</Text>
        </View>





        {/* Daily Progress */}
        <View style={s.dc}>
          <View style={s.dcHdr}>
            <Text style={s.dcTitle}>📊 Progress วันนี้</Text>
            <Text style={s.dcCount}><Text style={{ color: colors.primary, fontWeight: "700" }}>{todayCount}</Text> / 5</Text>
          </View>
          <View style={s.dcBar}><View style={[s.dcFill, { width: `${dailyPct}%` }]} /></View>
        </View>

        {/* Calories + BMR/BMI/TDEE */}
        {bmr > 0 && (
          <View style={{ marginTop: 8, backgroundColor: "rgba(26,26,46,0.75)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 13, color: colors.textDim }}>🔥 Calories</Text>
              <Text style={{ fontSize: isDesktop ? 20 : 18, fontWeight: "700", color: calColor }}>{todayCalories.toLocaleString()} / {dailyRecommend.toLocaleString()} kcal</Text>
            </View>
            <View style={{ width: "100%", height: 10, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden", marginBottom: 6 }}>
              <View style={{ height: "100%", borderRadius: 5, width: `${calPct}%`, backgroundColor: calColor }} />
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>🔥 BMR {bmr}</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>|</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>📏 BMI {bmi}</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>|</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>🎯 TDEE {dailyRecommend}</Text>
            </View>
          </View>
        )}

        {/* Daily Quest Progress */}
        <View style={{ marginTop: 10, backgroundColor: "rgba(26,26,46,0.75)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{t('dashboard.dailyQuests')}</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>{todayCount} / 5</Text>
          </View>
          <View style={{ width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <View style={{ height: "100%", borderRadius: 3, width: `${dailyPct}%`, backgroundColor: colors.primary }} />
          </View>
        </View>

        {/* Weekly Quests */}
        {incompleteWeekly.length > 0 && (
          <View style={{ marginTop: 10, backgroundColor: "rgba(26,26,46,0.75)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 8 }}>{t('dashboard.weeklyQuests')}</Text>
            {incompleteWeekly.map((q) => {
              const p = questProgress[q.id] || 0;
              const pct = Math.min(100, (p / q.target) * 100);
              return (
                <View key={q.id} style={{ marginBottom: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ fontSize: 11, color: colors.textDim }}>{q.name}</Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>{p}/{q.target}</Text>
                  </View>
                  <View style={{ width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${pct}%`, backgroundColor: colors.primary, borderRadius: 2 }} />
                  </View>
                </View>
              );
            })}
            <TouchableOpacity style={{ alignSelf: "center", marginTop: 4 }}>
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>{t('dashboard.seeAll')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Activities */}
        {workoutLog.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 }}>{t('dashboard.recentActivity')}</Text>
            {workoutLog.slice(0, 3).map((log, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: "rgba(255,255,255,0.04)" }}>
                <Text style={{ fontSize: 16 }}>
                  {log.activity === "คาร์ดิโอ" ? "🏃" : log.activity === "เวทเทรนนิ่ง" ? "🏋️" : log.activity === "เดินทั่วไป" ? "🚶" : log.activity === "HIIT" ? "💥" : log.activity === "ว่ายน้ำ" ? "🏊" : "🧘"}
                </Text>
                <Text style={{ flex: 1, fontSize: 12, color: colors.text }}>{log.activity}</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.gold }}>+{log.coins}🪙</Text>
              </View>
            ))}
            <TouchableOpacity style={{ alignSelf: "center", marginTop: 4 }}>
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>{t('dashboard.seeAll')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {workoutLog.length === 0 && (
          <View style={{ marginTop: 10 }}>
            <EmptyState icon="🏃" title={t('dashboard.noActivity')} subtitle={t('dashboard.noActivitySub')} />
          </View>
        )}
        <View style={{ height: isDesktop ? 40 : 30 }} />
      </ScrollView>

      {/* First-time Setup Modal */}
      <Modal visible={showSetup} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, textAlign: "center" }}>🏃 ยินดีต้อนรับ!</Text>
            <Text style={{ fontSize: 13, color: colors.textDim, textAlign: "center", marginTop: 6, marginBottom: 20 }}>
              กรุณากรอกน้ำหนักและส่วนสูงของคุณ เพื่อคำนวณ BMR และแนะนำแคลอรีที่ควรเผาผลาญในแต่ละวัน
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.textDim, marginBottom: 6 }}>⚖️ น้ำหนัก (กก.)</Text>
                <TextInput
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14,
                    fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder, textAlign: "center"
                  }}
                  value={setupWt} onChangeText={setSetupWt} keyboardType="decimal-pad"
                  placeholder="65" placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.textDim, marginBottom: 6 }}>📏 ส่วนสูง (ซม.)</Text>
                <TextInput
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14,
                    fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder, textAlign: "center"
                  }}
                  value={setupHt} onChangeText={setSetupHt} keyboardType="decimal-pad"
                  placeholder="170" placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                const w = parseFloat(setupWt);
                const h = parseFloat(setupHt);
                if (!w || !h || w < 20 || w > 300 || h < 50 || h > 250) {
                  Alert.alert("⚠️", "กรุณากรอกน้ำหนักและส่วนสูงให้ถูกต้อง");
                  return;
                }
                setProfile({ weight: w, height: h });
                setShowSetup(false);
              }}
              style={{
                marginTop: 20, padding: 16, backgroundColor: colors.primary,
                borderRadius: 14, alignItems: "center"
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>✅ บันทึก</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
              คุณสามารถแก้ไขภายหลังได้ที่หน้าโปรไฟล์
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const mobile = StyleSheet.create({
  hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  av: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cardBorder },
  greeting: { fontSize: 16, fontWeight: "700", color: colors.text },
  lvText: { fontSize: 12, color: colors.textDim, marginTop: 2 },
  coinHeader: { fontSize: 18, fontWeight: "800", color: colors.gold },
  expb: { width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" },
  expf: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  expText: { fontSize: 10, color: colors.textDim, textAlign: "center", marginTop: 3 },
  dc: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 11, padding: 14, marginBottom: 0 },
  dcHdr: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  dcTitle: { fontSize: 13, fontWeight: "600", color: colors.text },
  dcCount: { fontSize: 12, color: colors.textDim },
  dcBar: { width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" },
  dcFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },
  statBox: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 11, padding: 10, alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 10, color: colors.textDim, marginTop: 2 },
  questMini: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 11, padding: 12, marginBottom: 6 },
  qName: { fontSize: 12, fontWeight: "500", color: colors.text },
  qBarw: { width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginTop: 4 },
  qBar: { height: "100%", backgroundColor: colors.primary, borderRadius: 2 },
  qCount: { fontSize: 11, color: colors.gold, fontWeight: "600" },
  recentItem: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 10, marginBottom: 4 },
});

const desktop = StyleSheet.create({
  hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 20 },
  av: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cardBorder },
  greeting: { fontSize: 22, fontWeight: "700", color: colors.text },
  lvText: { fontSize: 14, color: colors.textDim, marginTop: 4 },
  coinHeader: { fontSize: 24, fontWeight: "800", color: colors.gold },
  expb: { width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" },
  expf: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  expText: { fontSize: 12, color: colors.textDim, textAlign: "center", marginTop: 4 },
  dc: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 20, marginBottom: 0 },
  dcHdr: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  dcTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  dcCount: { fontSize: 14, color: colors.textDim },
  dcBar: { width: "100%", height: 10, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" },
  dcFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 5 },
  statBox: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 16, alignItems: "center" },
  statVal: { fontSize: 24, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 12, color: colors.textDim, marginTop: 4 },
  questMini: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 14, marginBottom: 8 },
  qName: { fontSize: 14, fontWeight: "500", color: colors.text },
  qBarw: { width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginTop: 4 },
  qBar: { height: "100%", backgroundColor: colors.primary, borderRadius: 2 },
  qCount: { fontSize: 13, color: colors.gold, fontWeight: "600" },
  recentItem: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12, marginBottom: 6 },
});
