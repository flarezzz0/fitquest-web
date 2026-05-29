import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

const QuestCard = memo(function QuestCard({ name, progress, target, reward, claimed, onClaim }: {
  name: string; progress: number; target: number; reward: number;
  claimed: boolean; onClaim: () => void;
}) {
  const pct = Math.min(100, (progress / target) * 100);
  const ready = progress >= target && !claimed;
  return (
    <View style={s.card}>
      <View style={s.row}>
        <Text style={s.name}>{name}</Text>
        <Text style={s.rw}>+{reward}</Text>
      </View>
      <View style={s.barw}><View style={[s.bar, { width: `${pct}%` }]} /></View>
      <View style={s.row}>
        <Text style={s.pr}>{progress}/{target}</Text>
        {claimed ? (
          <View style={s.claimedBtn}><Text style={s.claimedText}>✅ รับแล้ว</Text></View>
        ) : (
          <TouchableOpacity style={[s.claimBtn, !ready && { opacity: 0.4 }]} onPress={onClaim} disabled={!ready} activeOpacity={0.7}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: ready ? "#fff" : colors.textMuted }}>
              {ready ? "🎁 รับรางวัล" : "🔒 กำลังทำ"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

export default QuestCard;

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 11, padding: 14, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 13, fontWeight: "500", color: colors.text },
  rw: { fontSize: 13, fontWeight: "700", color: colors.gold },
  barw: { height: 5, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2.5, overflow: "hidden" },
  bar: { height: "100%", backgroundColor: colors.primary, borderRadius: 2.5 },
  pr: { fontSize: 11, color: colors.textMuted },
  claimBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 9999 },
  claimedBtn: { backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999 },
  claimedText: { fontSize: 11, fontWeight: "500", color: colors.textMuted },
});
