import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";

const CATS = ["all", "food", "entertain", "rest", "cosmetic"];
const CAT_N: Record<string, string> = { all: "✨ ทั้งหมด", food: "🍕 อาหาร", entertain: "🎮 บันเทิง", rest: "😴 พักผ่อน", cosmetic: "💎 เครื่องประดับ" };
const ITEMS = [
  { id: "milk_tea", icon: "🧋", name: "ชานมไข่มุก", cost: 15, cat: "food" },
  { id: "gaming_night", icon: "🎮", name: "Gaming Night", cost: 18, cat: "entertain", badge: "limited" as const },
  { id: "special_meal", icon: "🍽️", name: "มื้อพิเศษตามใจ", cost: 25, cat: "food" },
  { id: "movie_day", icon: "🎬", name: "ดูหนัง/วันพักผ่อน", cost: 25, cat: "rest" },
  { id: "pizza", icon: "🍕", name: "พิซซ่า", cost: 30, cat: "food", badge: "weekly" as const },
  { id: "buffet", icon: "🦐", name: "บุฟเฟต์", cost: 80, cat: "food" },
  { id: "rest_day", icon: "😴", name: "วันพักผ่อนเต็มวัน", cost: 20, cat: "rest" },
  { id: "theme_fire", icon: "🔥", name: "Theme เพลิง", cost: 50, cat: "cosmetic" },
  { id: "theme_ocean", icon: "🌊", name: "Theme สมุทร", cost: 50, cat: "cosmetic" },
  { id: "frame_gold", icon: "🖼️", name: "กรอบทอง", cost: 30, cat: "cosmetic" },
  { id: "avatar_crown", icon: "👑", name: "มงกุฎ Avatar", cost: 40, cat: "cosmetic", badge: "limited" as const },
];

// คำนวณเวลาที่เหลือจนถึง reset ถัดไป
function getNextReset(badge?: string): { label: string; hours: number; mins: number } | null {
  if (badge === "limited") return null; // LIMITED ไม่มี reset
  const now = new Date();
  const thaiNow = new Date(now.getTime() + 7 * 3600000);
  const todayReset = Date.UTC(thaiNow.getUTCFullYear(), thaiNow.getUTCMonth(), thaiNow.getUTCDate(), 22, 0, 0); // 22:00 UTC = 05:00 TH

  let resetTime: number;
  if (badge === "weekly") {
    // reset หน้าวันจันทร์ 22:00 UTC
    const dw = (thaiNow.getUTCDay() + 6) % 7; // 0 = Mon
    const daysToMon = dw === 0 ? 7 : dw; // ถ้าวันนี้จันทร์ → จันทร์หน้า
    resetTime = todayReset + daysToMon * 86400000;
  } else {
    // daily: ถ้าเลย 22:00 UTC แล้ว → reset พรุ่งนี้
    resetTime = now.getTime() < todayReset ? todayReset : todayReset + 86400000;
  }

  const diffMs = resetTime - now.getTime();
  if (diffMs <= 0) return { label: "เร็วๆ นี้", hours: 0, mins: 0 };
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const label = badge === "weekly" ? "รีเซ็ตวันจันทร์" : "รีเซ็ตพรุ่งนี้";
  return { label, hours, mins };
}

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
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>🛒 ร้านค้า</Text>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.gold }}>🪙 {coins}</Text>
        </View>

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {CATS.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCat(c)} style={[ss.cat, cat === c && ss.catA]}>
                <Text style={[ss.catT, cat === c && { color: "#111" }]}>{CAT_N[c]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Item Grid — 2 columns */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {items.map((item) => {
            const owned = shopBought.includes(item.id);
            const canBuy = coins >= item.cost;
            const reset = owned ? getNextReset(item.badge) : null;
            return (
              <View key={item.id} style={{ width: "47%", marginBottom: 10 }}>
                <View style={[ss.card, owned && { opacity: 0.5 }]}>
                  {/* Badge */}
                  {item.badge && (
                    <View style={[ss.badge, { backgroundColor: item.badge === "limited" ? colors.error : colors.primary }]}>
                      <Text style={ss.badgeT}>{item.badge === "limited" ? "⭐ LIMITED" : "📅 WEEKLY"}</Text>
                    </View>
                  )}
                  {/* Icon */}
                  <View style={ss.iconWrap}>
                    <Text style={{ fontSize: 36 }}>{item.icon}</Text>
                  </View>
                  {/* Name */}
                  <Text style={ss.name}>{item.name}</Text>
                  {/* Price */}
                  <Text style={ss.price}>{item.cost} 🪙</Text>
                  {/* Button */}
                  {owned ? (
                    <View style={ss.owned}>
                      <Text style={ss.ownedT}>✅ มีแล้ว</Text>
                      {reset && (
                        <Text style={ss.resetT}>
                          {reset.hours > 0 ? `${reset.hours}ชม ` : ""}{reset.mins}นาที
                        </Text>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      disabled={!canBuy}
                      style={[ss.buy, !canBuy && { opacity: 0.4 }]}
                      onPress={() => buy(item.id, item.cost)}
                    >
                      <Text style={[ss.buyT, !canBuy && { color: colors.textDim }]}>
                        {canBuy ? "ซื้อเลย" : "🪙 ไม่พอ"}
                      </Text>
                    </TouchableOpacity>
                  )}
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
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, padding: 14, alignItems: "center", position: "relative" },
  badge: { position: "absolute", top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeT: { fontSize: 8, fontWeight: "700", color: "#fff" },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  name: { fontSize: 12, fontWeight: "600", color: colors.text, textAlign: "center" },
  price: { fontSize: 14, fontWeight: "700", color: colors.gold, marginVertical: 6 },
  owned: { alignItems: "center", gap: 2 },
  ownedT: { fontSize: 11, fontWeight: "600", color: colors.success },
  resetT: { fontSize: 9, color: colors.textMuted },
  buy: { backgroundColor: colors.gold, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 9999 },
  buyT: { fontSize: 12, fontWeight: "700", color: "#111" },
});
