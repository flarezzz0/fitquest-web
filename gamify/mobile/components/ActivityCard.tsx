import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function ActivityCard({ emoji, name, duration, coins, onPress }: {
  emoji: string; name: string; duration: string; coins: number; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <Text style={{ fontSize: 32, textAlign: "center" }}>{emoji}</Text>
      <Text style={s.name}>{name}</Text>
      <Text style={s.duration}>{duration}</Text>
      <Text style={s.coins}>+{coins} 🪙</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 14, padding: 14, alignItems: "center",
  },
  name: { fontSize: 13, fontWeight: "600", color: colors.text, textAlign: "center", marginTop: 4 },
  duration: { fontSize: 11, color: colors.textDim, textAlign: "center", marginTop: 2 },
  coins: { fontSize: 13, fontWeight: "700", color: colors.gold, textAlign: "center", marginTop: 4 },
});
