import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

const StreakBanner = memo(function StreakBanner({ streak, mult, frozen }: { streak: number; mult: number; frozen: boolean }) {
  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 20 }}>🔥</Text>
        <View>
          <Text style={s.count}>{streak}</Text>
          <Text style={s.label}>วันติด</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={s.freeze}>❄️ {frozen ? "พักแล้ว" : "พักได้ 1/สัปดาห์"}</Text>
        <View style={s.mult}><Text style={s.multText}>x{mult}</Text></View>
      </View>
    </View>
  );
});

export default StreakBanner;

const s = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.card, borderWidth: 1,
    borderColor: colors.cardBorder, borderRadius: 11, padding: 12,
  },
  count: { fontSize: 18, fontWeight: "700", color: colors.text },
  label: { fontSize: 10, color: colors.textDim },
  freeze: { fontSize: 10, color: colors.textMuted },
  mult: { backgroundColor: "rgba(255,214,10,0.12)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  multText: { fontSize: 11, fontWeight: "700", color: colors.gold },
});
