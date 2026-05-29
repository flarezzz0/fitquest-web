import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";

const CATS = ["all", "food", "entertain", "rest", "cosmetic"];
const CAT_N = { all: "✨ ทั้งหมด", food: "🍕 อาหาร", entertain: "🎮 บันเทิง", rest: "😴 พักผ่อน", cosmetic: "💎 เครื่องประดับ" };
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

export default function ShopScreen() {
  const [cat, setCat] = useState("all");
  const { coins, shopBought, spendCoins, buyItem, checkDailyReset, checkWeeklyReset } = useStore();
  checkDailyReset(); checkWeeklyReset();
  const items = cat === "all" ? ITEMS : ITEMS.filter((i) => i.cat === cat);
  const buy = (id: string, cost: number) => {
    if (shopBought.includes(id)) return;
    if (!spendCoins(cost)) { Alert.alert("😅 ไม่พอ!", `ขาด ${cost - coins} 🪙`); return; }
    buyItem(id);
    Alert.alert("🎉 ซื้อสำเร็จ!");
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ paddingHorizontal: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>🛒 ร้านค้า</Text>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.gold }}>🪙 {coins}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {CATS.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCat(c)}
                style={[ss.cat, cat === c && ss.catA]}>
                <Text style={[ss.catT, cat === c && { color: "#111" }]}>{(CAT_N as any)[c]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {items.map((item) => {
            const owned = shopBought.includes(item.id);
            const canBuy = coins >= item.cost;
            return (
              <View key={item.id} style={{ width: "48%", marginBottom: 8 }}>
                <View style={[ss.sc, owned && { opacity: 0.4 }]}>
                  {item.badge && <Text style={[ss.bdg, { backgroundColor: item.badge === "limited" ? colors.error : colors.primary }]}>{item.badge === "limited" ? "⭐ LIMITED" : "📅 WEEKLY"}</Text>}
                  <Text style={{ fontSize: 36, textAlign: "center" }}>{item.icon}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, marginTop: 6, textAlign: "center" }}>{item.name}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.gold, marginVertical: 4, textAlign: "center" }}>{item.cost} 🪙</Text>
                  {owned ? <View style={ss.own}><Text style={{fontSize:12,fontWeight:"500",color:colors.success}}>✅ มีแล้ว</Text></View> : <TouchableOpacity disabled={!canBuy} style={[ss.buyBtn, !canBuy && { opacity: 0.4 }]} onPress={() => buy(item.id, item.cost)}><Text style={{fontSize:12,fontWeight:"600",color:"#fff"}}>{canBuy ? "ซื้อเลย" : "🪙 ไม่พอ"}</Text></TouchableOpacity>}
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
const ss = StyleSheet.create({
  cat: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: colors.cardBorder },
  catA: { backgroundColor: colors.primary, borderColor: colors.primary },
  catT: { fontSize: 12, fontWeight: "600", color: colors.text },
  sc: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 14, alignItems: "center", position: "relative" },
  bdg: { position: "absolute", top: 6, right: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: "700", color: "#fff", overflow: "hidden" },
  own: { backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, fontSize: 12, fontWeight: "700", color: "#111", opacity: 0.6, overflow: "hidden" },
  buyBtn: { backgroundColor: colors.gold, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, fontSize: 12, fontWeight: "700", color: "#111", overflow: "hidden" },
});
