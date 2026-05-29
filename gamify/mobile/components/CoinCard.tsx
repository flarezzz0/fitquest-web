import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

const CoinCard = memo(function CoinCard({ coins, level }: { coins: number; level: number }) {
  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={s.icon}><Text style={{ fontSize: 24 }}>🪙</Text></View>
        <View>
          <Text style={s.amount}>{coins.toLocaleString()}</Text>
          <Text style={s.label}>เหรียญ</Text>
        </View>
      </View>
      <View style={s.lv}><Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>LV.{level}</Text></View>
    </View>
  );
});
export default CoinCard;

const s = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.card, borderWidth: 1,
    borderColor: colors.cardBorder, borderRadius: 11, padding: 14,
  },
  icon: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: "rgba(255,214,10,0.1)", alignItems: "center", justifyContent: "center",
  },
  amount: { fontSize: 24, fontWeight: "700", color: colors.gold },
  label: { fontSize: 11, color: colors.textDim, marginTop: 1 },
  lv: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999,
  },
});
