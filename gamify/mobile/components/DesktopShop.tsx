import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore } from "../store/useStore";
import { colors } from "../theme/colors";

const CATEGORIES = ["all", "food", "entertain", "rest", "cosmetic"];
const CAT_LABELS: Record<string, string> = { all: "✨ ทั้งหมด", food: "🍕 อาหาร", entertain: "🎮 บันเทิง", rest: "😴 พักผ่อน", cosmetic: "💎 เครื่องประดับ" };
const ITEMS = [
  { id: "milk_tea", icon: "🧋", name: "ชานมไข่มุก", cost: 15, cat: "food" },
  { id: "gaming_night", icon: "🎮", name: "Gaming Night", cost: 18, cat: "entertain", badge: "limited" },
  { id: "special_meal", icon: "🍽️", name: "มื้อพิเศษตามใจ", cost: 25, cat: "food" },
  { id: "movie_day", icon: "🎬", name: "ดูหนัง/วันพักผ่อน", cost: 25, cat: "rest" },
  { id: "pizza", icon: "🍕", name: "พิซซ่า", cost: 30, cat: "food", badge: "weekly" },
  { id: "buffet", icon: "🦐", name: "บุฟเฟต์", cost: 80, cat: "food" },
  { id: "rest_day", icon: "😴", name: "วันพักผ่อนเต็มวัน", cost: 20, cat: "rest" },
  { id: "theme_fire", icon: "🔥", name: "Theme เพลิง", cost: 50, cat: "cosmetic" },
  { id: "theme_ocean", icon: "🌊", name: "Theme สมุทร", cost: 50, cat: "cosmetic" },
  { id: "frame_gold", icon: "🖼️", name: "กรอบทอง", cost: 30, cat: "cosmetic" },
  { id: "avatar_crown", icon: "👑", name: "มงกุฏ Avatar", cost: 40, cat: "cosmetic", badge: "limited" },
];

export default function DesktopShop() {
  const [cat, setCat] = useState("all");
  const { coins, shopBought, spendCoins, buyItem } = useStore();
  const items = cat === "all" ? ITEMS : ITEMS.filter((i) => i.cat === cat);
  const buy = (id: string, cost: number) => {
    if (shopBought.includes(id)) return;
    if (!spendCoins(cost)) { Alert.alert("😅 ไม่พอ!", `ขาด ${cost - coins} 🪙`); return; }
    buyItem(id);
    Alert.alert("🎉 ซื้อสำเร็จ!", "ไปใช้สิทธิ์ได้เลย!");
  };

  return (
    <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <View>
          <Text style={s.pageTitle}>🛒 ร้านค้า</Text>
          <Text style={s.pageSub}>แลกเหรียญเป็นรางวัล</Text>
        </View>
        <View style={s.coinBadge}>
          <Text style={s.coinText}>🪙 {coins}</Text>
        </View>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c} onPress={() => setCat(c)}
              style={[s.catBtn, cat === c && s.catActive]}>
              <Text style={[s.catText, cat === c && { color: "#fff" }]}>{CAT_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Items Grid */}
      <View style={s.grid}>
        {items.map((item) => {
          const owned = shopBought.includes(item.id);
          const canBuy = coins >= item.cost;
          return (
            <View key={item.id} style={[s.card, owned && { opacity: 0.4 }]}>
              {item.badge && (
                <View style={[s.badge, { backgroundColor: item.badge === "limited" ? colors.error : colors.primary }]}>
                  <Text style={s.badgeText}>{item.badge === "limited" ? "⭐ LIMITED" : "📅 WEEKLY"}</Text>
                </View>
              )}
              <Text style={{ fontSize: 40, textAlign: "center", marginBottom: 6 }}>{item.icon}</Text>
              <Text style={s.itemName}>{item.name}</Text>
              <Text style={s.itemCost}>{item.cost} 🪙</Text>
              {owned ? (
                <View style={s.ownedBadge}><Text style={s.ownedText}>✅ มีแล้ว</Text></View>
              ) : (
                <TouchableOpacity disabled={!canBuy} style={[s.buyBtn, !canBuy && { opacity: 0.3 }]} onPress={() => buy(item.id, item.cost)}>
                  <Text style={s.buyText}>{canBuy ? "ซื้อเลย" : "🪙 ไม่พอ"}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 32, maxWidth: 1100, width: "100%" },
  pageTitle: { fontSize: 24, fontWeight: "700", color: colors.text },
  pageSub: { fontSize: 13, color: colors.textDim, marginTop: 4 },
  coinBadge: { backgroundColor: "rgba(255,214,10,0.1)", borderWidth: 1, borderColor: "rgba(255,214,10,0.2)", borderRadius: 9999, paddingHorizontal: 20, paddingVertical: 10 },
  coinText: { fontSize: 16, fontWeight: "700", color: colors.gold },
  catBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 9999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  catActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 13, fontWeight: "500", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  card: {
    flexBasis: "22%", minWidth: 200, flexGrow: 1,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 14, padding: 18, alignItems: "center", position: "relative",
  },
  badge: { position: "absolute", top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#fff" },
  itemName: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: 4 },
  itemCost: { fontSize: 14, fontWeight: "700", color: colors.gold, marginVertical: 6 },
  buyBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 9999 },
  buyText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  ownedBadge: { backgroundColor: "rgba(48,209,88,0.15)", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 9999 },
  ownedText: { fontSize: 12, fontWeight: "500", color: colors.success },
});
