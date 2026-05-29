import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function RewardCard({ icon, name, cost, owned, canBuy, badge, onBuy }: {
  icon: string; name: string; cost: number; owned: boolean; canBuy: boolean;
  badge?: string; onBuy: () => void;
}) {
  return (
    <View style={[s.card, owned && { opacity: 0.4 }]}>
      {badge && (
        <View style={[s.badge, { backgroundColor: badge === "limited" ? colors.error : colors.primary }]}>
          <Text style={s.badgeText}>{badge === "limited" ? "⭐ LIMITED" : "📅 WEEKLY"}</Text>
        </View>
      )}
      <Text style={{ fontSize: 36, textAlign: "center" }}>{icon}</Text>
      <Text style={s.name}>{name}</Text>
      <Text style={s.cost}>{cost} 🪙</Text>
      {owned ? (
        <View style={s.ownedBtn}><Text style={s.ownedText}>✅ มีแล้ว</Text></View>
      ) : (
        <TouchableOpacity style={[s.buyBtn, !canBuy && { opacity: 0.3 }]} onPress={onBuy} disabled={!canBuy} activeOpacity={0.7}>
          <Text style={s.buyText}>{canBuy ? "ซื้อเลย" : "🪙 ไม่พอ"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 14, alignItems: "center", position: "relative" },
  badge: { position: "absolute", top: 6, right: 6, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 8, fontWeight: "700", color: "#fff" },
  name: { fontSize: 12, fontWeight: "600", color: colors.text, marginTop: 6, textAlign: "center" },
  cost: { fontSize: 13, fontWeight: "700", color: colors.gold, marginVertical: 4 },
  buyBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 9999 },
  buyText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  ownedBtn: { backgroundColor: "rgba(48,209,88,0.15)", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 9999 },
  ownedText: { fontSize: 12, fontWeight: "500", color: colors.success },
});
