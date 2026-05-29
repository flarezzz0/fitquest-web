import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useStore } from "../store/useStore";
import { colors } from "../theme/colors";
import CoinCard from "./CoinCard";
import StreakBanner from "./StreakBanner";

export default function DesktopDashboard() {
  const { coins, level, totalCoinsEarned, streak, frozenUsed, totalWorkouts, todayCount, weekCount, workoutLog, questProgress } = useStore();

  const mult = streak <= 0 ? 1 : streak <= 3 ? 1 : streak <= 7 ? 1.5 : 2;
  const dailyPct = Math.min(100, (todayCount / 5) * 100);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>แดชบอร์ด</Text>
          <Text style={styles.pageSub}>ภาพรวมกิจกรรมของคุณวันนี้</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.levelPill}>
            <Text style={styles.levelText}>LV.{level}</Text>
          </View>
        </View>
      </View>

      {/* Stats Row — 4 cards thinner */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>🏋️ ทั้งหมด</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCoinsEarned}</Text>
          <Text style={styles.statLabel}>🪙 สะสม</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>🔥 Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{weekCount}</Text>
          <Text style={styles.statLabel}>📅 อาทิตย์นี้</Text>
        </View>
      </View>

      {/* Main Content Grid — 2 columns */}
      <View style={styles.mainGrid}>
        {/* Left Column */}
        <View style={styles.leftCol}>
          {/* Progress Today */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>📊 Progress วันนี้</Text>
              <Text style={styles.progressCount}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>{todayCount}</Text> / 5
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${dailyPct}%` }]} />
            </View>
          </View>

          {/* Coin + Streak row */}
          <View style={styles.doubleRow}>
            <View style={{ flex: 1 }}>
              <CoinCard coins={coins} level={level} />
            </View>
            <View style={{ flex: 1 }}>
              <StreakBanner streak={streak} mult={mult} frozen={frozenUsed} />
            </View>
          </View>

          {/* Recent Activities */}
          <Text style={styles.sectionTitle}>📜 กิจกรรมล่าสุด</Text>
          {workoutLog.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 14, color: colors.textDim }}>ยังไม่มีประวัติ 💪</Text>
            </View>
          ) : workoutLog.slice(0, 6).map((log, i) => (
            <View key={i} style={styles.recentRow}>
              <Text style={{ fontSize: 20 }}>
                {log.activity === "คาร์ดิโอ" ? "🏃" : log.activity === "เวทเทรนนิ่ง" ? "🏋️" : log.activity === "เดินทั่วไป" ? "🚶" : "🧘"}
              </Text>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{log.activity}</Text>
                <Text style={styles.recentDate}>{new Date(log.date).toLocaleDateString("th-TH", { weekday: "short", month: "short", day: "numeric" })}</Text>
              </View>
              <Text style={styles.recentCoins}>+{log.coins}🪙</Text>
            </View>
          ))}
        </View>

        {/* Right Column */}
        <View style={styles.rightCol}>
          {/* Weekly Quests */}
          <Text style={styles.sectionTitle}>📅 เควสรายสัปดาห์</Text>
          <View style={styles.questsContainer}>
            {[
              { n: "คาร์ดิโอครบ 3 ครั้ง", p: questProgress.w_cardio_3 || 0, t: 3 },
              { n: "เข้ายิมครบ 4 วัน", p: questProgress.w_gym_4 || 0, t: 4 },
              { n: "ครบทุกประเภท", p: questProgress.w_all_types || 0, t: 4 },
            ].map((q, i) => {
              const pct = Math.min(100, (q.p / q.t) * 100);
              return (
                <View key={i} style={styles.questCard}>
                  <View style={styles.questInfo}>
                    <Text style={styles.questName}>{q.n}</Text>
                    <Text style={styles.questProgress}>{q.p}/{q.t}</Text>
                  </View>
                  <View style={styles.questBar}>
                    <View style={[styles.questFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Quick Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 เกร็ดความรู้</Text>
            <Text style={styles.infoText}>
              การออกกำลังกาย 30 นาทีต่อวัน ช่วยลดความเสี่ยงโรคหัวใจได้ถึง 35%
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
