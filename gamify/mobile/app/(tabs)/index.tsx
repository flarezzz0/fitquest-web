import React, { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import CoinCard from "../../components/CoinCard";
import StreakBanner from "../../components/StreakBanner";
import EmptyState from "../../components/EmptyState";
import { useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";
import { checkHealth } from "../../services/api";

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { coins, level, totalCoinsEarned, streak, frozenUsed, totalWorkouts, todayCount, weekCount, workoutLog, questProgress, setBackend } = useStore();
  useEffect(() => { checkHealth().then(() => setBackend(true)).catch(() => {}); }, []);

  const mult = streak <= 0 ? 1 : streak <= 3 ? 1 : streak <= 7 ? 1.5 : 2;
  const expPct = totalCoinsEarned > 0 ? Math.min(100, totalCoinsEarned % 100) : 0;
  const dailyPct = Math.min(100, (todayCount / 5) * 100);

  const s = isDesktop ? desktop : mobile;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={isDesktop ? { paddingHorizontal: 32, paddingVertical: 20 } : {}} style={{ paddingHorizontal: isDesktop ? 0 : 14 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.hdr}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: isDesktop ? 14 : 10 }}>
            <View style={s.av}><Text style={{ fontSize: isDesktop ? 28 : 20 }}>🏃</Text></View>
            <View>
              <Text style={s.greeting}>สวัสดี! 👋</Text>
              <Text style={s.lvText}>LV.{level} นักผจญภัย</Text>
            </View>
          </View>
          <Text style={s.coinHeader}>🪙 {coins}</Text>
        </View>

        {/* Top row: Coin + Streak side by side on desktop */}
        {isDesktop ? (
          <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
            <View style={{ flex: 1 }}><CoinCard coins={coins} level={level} /></View>
            <View style={{ flex: 1 }}><StreakBanner streak={streak} mult={mult} frozen={frozenUsed} /></View>
          </View>
        ) : (
          <>
            <View style={{ marginBottom: 10 }}><CoinCard coins={coins} level={level} /></View>
            <View style={{ marginBottom: 10 }}><StreakBanner streak={streak} mult={mult} frozen={frozenUsed} /></View>
          </>
        )}

        {/* EXP Bar */}
        <View style={{ marginBottom: isDesktop ? 20 : 10 }}>
          <View style={s.expb}><View style={[s.expf, { width: `${expPct}%` }]} /></View>
          <Text style={s.expText}>LV.{level} — สะสม {totalCoinsEarned} 🪙</Text>
        </View>

        {/* Daily Progress */}
        <View style={s.dc}>
          <View style={s.dcHdr}>
            <Text style={s.dcTitle}>📊 Progress วันนี้</Text>
            <Text style={s.dcCount}><Text style={{ color: colors.primary, fontWeight: "700" }}>{todayCount}</Text> / 5</Text>
          </View>
          <View style={s.dcBar}><View style={[s.dcFill, { width: `${dailyPct}%` }]} /></View>
        </View>

        {/* Stats + Quest grid on desktop */}
        {isDesktop ? (
          <View style={{ flexDirection: "row", gap: 16, marginTop: 16 }}>
            {/* Stats column */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 }}>📊 สถิติ</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { v: totalWorkouts, c: colors.primary, l: "🏋️ ทั้งหมด" },
                  { v: weekCount, c: colors.primary, l: "📅 อาทิตย์นี้" },
                  { v: todayCount, c: colors.primary, l: "📆 วันนี้" },
                ].map((st, i) => (
                  <View key={i} style={s.statBox}>
                    <Text style={s.statVal}>{st.v}</Text>
                    <Text style={s.statLabel}>{st.l}</Text>
                  </View>
                ))}
              </View>
            </View>
            {/* Quest column */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 }}>📅 เควสรายสัปดาห์</Text>
              {[
                { n: "คาร์ดิโอครบ 3 ครั้ง", p: questProgress.w_cardio_3 || 0, t: 3 },
                { n: "เข้ายิมครบ 4 วัน", p: questProgress.w_gym_4 || 0, t: 4 },
              ].map((q, i) => {
                const pct = Math.min(100, (q.p / q.t) * 100);
                return (
                  <View key={i} style={s.questMini}>
                    <Text style={{ fontSize: 16 }}>{q.p >= q.t ? "✅" : "📅"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.qName}>{q.n}</Text>
                      <View style={s.qBarw}><View style={[s.qBar, { width: `${pct}%` }]} /></View>
                    </View>
                    <Text style={s.qCount}>{q.p}/{q.t}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <>
            {/* Mobile stats row */}
            <View style={{ flexDirection: "row", gap: 6, marginVertical: 10 }}>
              {[
                { v: totalWorkouts, c: colors.primary, l: "🏋️ ทั้งหมด" },
                { v: weekCount, c: colors.primary, l: "📅 อาทิตย์นี้" },
                { v: todayCount, c: colors.primary, l: "📆 วันนี้" },
              ].map((st, i) => (
                <View key={i} style={s.statBox}>
                  <Text style={s.statVal}>{st.v}</Text>
                  <Text style={s.statLabel}>{st.l}</Text>
                </View>
              ))}
            </View>

            {/* Quest Preview */ }
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>📅 เควสรายสัปดาห์</Text>
            {[
              { n: "คาร์ดิโอครบ 3 ครั้ง", p: questProgress.w_cardio_3 || 0, t: 3 },
              { n: "เข้ายิมครบ 4 วัน", p: questProgress.w_gym_4 || 0, t: 4 },
            ].map((q, i) => {
              const pct = Math.min(100, (q.p / q.t) * 100);
              return (
                <View key={i} style={s.questMini}>
                  <Text style={{ fontSize: 14 }}>{q.p >= q.t ? "✅" : "📅"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.qName}>{q.n}</Text>
                    <View style={s.qBarw}><View style={[s.qBar, { width: `${pct}%` }]} /></View>
                  </View>
                  <Text style={s.qCount}>{q.p}/{q.t}</Text>
                </View>
              );
            })}
          </>
        )}

        {/* Recent Activities */}
        <Text style={{ fontSize: isDesktop ? 18 : 14, fontWeight: "600", color: colors.text, marginVertical: isDesktop ? 20 : 10 }}>
          📜 กิจกรรมล่าสุด
        </Text>
        <View style={isDesktop ? { flexDirection: "row", flexWrap: "wrap", gap: 10 } : {}}>
          {workoutLog.length === 0 ? (
            <EmptyState icon="🏃" title="ยังไม่มีกิจกรรม" subtitle="เริ่มออกกำลังกายเพื่อรับเหรียญแรกของคุณ" />
          ) : workoutLog.slice(0, isDesktop ? 8 : 5).map((log, i) => (
            <View key={i} style={[s.recentItem, isDesktop && { width: "48%", padding: 14 }]}>
              <Text style={{ fontSize: isDesktop ? 20 : 16 }}>
                {log.activity === "คาร์ดิโอ" ? "🏃" : log.activity === "เวทเทรนนิ่ง" ? "🏋️" : log.activity === "เดินทั่วไป" ? "🚶" : "🧘"}
              </Text>
              <Text style={{ flex: 1, fontSize: isDesktop ? 14 : 12, fontWeight: "500", color: colors.text }}>{log.activity}</Text>
              <Text style={{ fontSize: isDesktop ? 14 : 12, fontWeight: "700", color: colors.gold }}>+{log.coins}🪙</Text>
            </View>
          ))}
        </View>
        <View style={{ height: isDesktop ? 60 : 40 }} />
      </ScrollView>
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
