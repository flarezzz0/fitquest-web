import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Image, StyleSheet, Animated, TouchableOpacity, TextInput, Alert, Modal } from "react-native";
import { useStore } from "../store/useStore";
import { colors } from "../theme/colors";

const LV = [{ l: 1, title: "นักผจญภัยมือใหม่", badge: "🌱" }, { l: 2, title: "นักสู้ผู้เริ่มต้น", badge: "⚔️" }, { l: 3, title: "อัศวินฟิตเนส", badge: "🛡️" }, { l: 4, title: "จอมพลแห่งยิม", badge: "👑" }];

export default function DesktopProfile() {
  const { level, totalCoinsEarned, totalWorkouts, longestStreak, workoutLog, streak, todayCount, clearAllData, profile, setProfile } = useStore();
  const lv = LV[level - 1] || LV[LV.length - 1];
  const [showEdit, setShowEdit] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editWt, setEditWt] = useState(String(profile.weight || ""));
  const [editHt, setEditHt] = useState(String(profile.height || ""));
  const [showClear, setShowClear] = useState(false);
  const [clearPassword, setClearPassword] = useState("");

  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const dayCount: Record<string, number> = {};
  workoutLog.forEach((l) => { dayCount[l.date.slice(0, 10)] = (dayCount[l.date.slice(0, 10)] || 0) + 1; });
  const activeDays = Object.keys(dayCount).length;
  const monthPct = Math.round((activeDays / dim) * 100);
  const monthName = now.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  const pageFade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(pageFade, { toValue: 1, duration: 600, useNativeDriver: true }).start(); }, []);

  const handleClear = () => {
    if (clearPassword !== "fitquest") { Alert.alert("❌ รหัสผ่านผิด", 'ใช้ "fitquest"'); return; }
    Alert.alert("⚠️ ล้างข้อมูล", "ยืนยันล้างข้อมูลทั้งหมด?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ยืนยัน", style: "destructive", onPress: () => { clearAllData(); Alert.alert("✅ ล้างแล้ว"); setShowClear(false); setClearPassword(""); } },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.profileHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={s.avatar}><Text style={{ fontSize: 40 }}>{lv.badge}</Text></View>
          <View>
            <Text style={s.profileName}>{lv.title}</Text>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600", marginTop: 2 }}>LV.{level}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity onPress={() => { setDisplayName(lv.title); setEditBio(lv.title); setEditWt(String(profile.weight || "")); setEditHt(String(profile.height || "")); setShowEdit(true); }}
            style={{ padding: 10, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ fontSize: 18 }}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        {[{ v: totalCoinsEarned, c: colors.gold, l: "🪙 สะสม" }, { v: totalWorkouts, c: colors.success, l: "🏋️ ครั้ง" }, { v: longestStreak, c: colors.error, l: "🔥 สูงสุด" }].map((st, i) => (
          <View key={i} style={s.statPill}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: st.c }}>{st.v}</Text>
            <Text style={{ fontSize: 11, color: colors.textDim }}>{st.l}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid — compact */}
      <Text style={[s.sectionTitle, { marginBottom: 8 }]}>📊 Activity Calendar — {monthName}</Text>
      <View style={[s.glassCard, { padding: 14 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 10 }}>
          <View style={{ alignItems: "center" }}><Text style={{ fontSize: 16, fontWeight: "800", color: colors.gold }}>{activeDays}</Text><Text style={{ fontSize: 9, color: colors.textDim }}>วัน</Text></View>
          <View style={{ alignItems: "center" }}><Text style={{ fontSize: 16, fontWeight: "800", color: colors.error }}>{streak || 0}</Text><Text style={{ fontSize: 9, color: colors.textDim }}>🔥</Text></View>
          <View style={{ alignItems: "center" }}><Text style={{ fontSize: 16, fontWeight: "800", color: colors.success }}>{longestStreak}</Text><Text style={{ fontSize: 9, color: colors.textDim }}>Best</Text></View>
          <View style={{ alignItems: "center" }}><Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>{monthPct}%</Text><Text style={{ fontSize: 9, color: colors.textDim }}>เดือน</Text></View>
        </View>
        <View style={{ paddingVertical: 2 }}>
          <View style={{ flexDirection: "row", gap: 4, marginBottom: 6, justifyContent: "center" }}>
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
              <View key={i} style={{ width: 32, alignItems: "center" }}><Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: "600" }}>{d}</Text></View>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "flex-start" }}>
            {Array.from({ length: firstDay }).map((_, i) => <View key={`e${i}`} style={{ width: 32, height: 32 }} />)}
            {Array.from({ length: dim }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
              const key = d.toISOString().slice(0, 10);
              const count = dayCount[key] || 0;
              const isToday = key === now.toISOString().slice(0, 10);
              return (
                <View key={i} style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: isToday && count === 0 ? "rgba(255,255,255,0.06)" : "transparent", borderWidth: count > 0 ? 2 : (isToday ? 1 : 0), borderColor: count > 0 ? colors.success : (isToday ? "rgba(255,255,255,0.15)" : "transparent"), alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 10, fontWeight: count > 0 ? "700" : "400", color: count > 0 ? colors.success : (isToday ? colors.text : colors.textDim) }}>{i + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4 }}>
          <Text style={{ fontSize: 10, color: colors.textMuted }}>วันนี้: {now.toLocaleDateString("th-TH", { weekday: "long" })}{todayCount > 0 ? " ✅" : ""}</Text>
        </View>
      </View>

      {/* Badges */}
      <Text style={s.sectionTitle}>🏆 Badge</Text>
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        {LV.filter((l) => l.l <= level).map((l) => (
          <View key={l.l} style={s.badgeCard}><Text style={{ fontSize: 32 }}>{l.badge}</Text><Text style={s.badgeName}>{l.title}</Text><Text style={{ fontSize: 10, color: colors.textMuted }}>LV.{l.l}</Text></View>
        ))}
      </View>

      {/* Google + Clear */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12 }}
          onPress={() => Alert.alert("🔜", "Google Login จะเพิ่มเร็วๆ นี้")}>
          <Text style={{ fontSize: 20 }}>🔵</Text><Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, backgroundColor: "rgba(255,69,58,0.08)", borderWidth: 1, borderColor: "rgba(255,69,58,0.2)", borderRadius: 12 }}
          onPress={() => { setShowClear(true); setClearPassword(""); }}>
          <Text style={{ fontSize: 16 }}>🗑️</Text><Text style={{ fontSize: 14, fontWeight: "600", color: colors.error }}>ล้างข้อมูล</Text>
        </TouchableOpacity>
      </View>

      {/* Language & Theme Toggles */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12 }}
          onPress={() => {
            const { language, setLanguage } = useStore.getState();
            setLanguage(language === "th" ? "en" : "th");
          }}>
          <Text style={{ fontSize: 18 }}>🌐</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
            {useStore.getState().language === "th" ? "TH" : "EN"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12 }}
          onPress={() => {
            const { themeMode, setThemeMode } = useStore.getState();
            const next = themeMode === "dark" ? "light" : themeMode === "light" ? "system" : "dark";
            setThemeMode(next);
          }}>
          <Text style={{ fontSize: 18 }}>
            {useStore.getState().themeMode === "dark" ? "🌙" : useStore.getState().themeMode === "light" ? "☀️" : "📱"}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
            {useStore.getState().themeMode === "dark" ? "Dark" : useStore.getState().themeMode === "light" ? "Light" : "System"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <Text style={s.sectionTitle}>📸 กิจกรรมล่าสุด</Text>
      {workoutLog.filter((l) => l.imageUri).length === 0 ? (
        <View style={{ padding: 30, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, alignItems: "center" }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🏃</Text>
          <Text style={{ fontSize: 14, color: colors.textDim }}>ยังไม่มีประวัติ</Text></View>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
          {workoutLog.filter((l) => l.imageUri).slice(0, 9).map((l, i) => {
            const statusColor = !l.fraudScore || l.fraudScore < 20 ? "rgba(48,209,88,0.1)" : l.fraudScore < 50 ? "rgba(255,159,10,0.1)" : "rgba(255,69,58,0.1)";
            const statusTxt = !l.fraudScore || l.fraudScore < 20 ? "✅ ผ่าน" : l.fraudScore < 50 ? "⚠️ ปานกลาง" : "❌ สูง";
            const statusTxtColor = !l.fraudScore || l.fraudScore < 20 ? colors.success : l.fraudScore < 50 ? colors.warning : colors.error;
            return (
              <View key={i} style={{ width: "31%", minWidth: 200, backgroundColor: statusColor, borderRadius: 16, padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden" }}>
                    {l.imageUri ? <Image source={{ uri: l.imageUri }} style={{ width: 52, height: 52 }} /> :
                      <View style={{ width: 52, height: 52, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 22 }}>🏃</Text></View>}
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.gold }}>+{l.coins}🪙</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 8 }}>
                  {l.activity === "คาร์ดิโอ" ? "🏃 " : l.activity === "เวทเทรนนิ่ง" ? "🏋️ " : l.activity === "เดินทั่วไป" ? "🚶 " : l.activity === "HIIT" ? "💥 " : l.activity === "ว่ายน้ำ" ? "🏊 " : "🧘 "}{l.activity}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 3 }}>
                  {l.duration ? <Text style={{ fontSize: 11, color: colors.textDim }}>⏱️ {l.duration}น</Text> : null}
                  {l.calories ? <Text style={{ fontSize: 11, color: colors.gold }}>🔥 {l.calories}</Text> : null}
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{new Date(l.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</Text>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: statusColor }}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: statusTxtColor }}>{statusTxt}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Edit Modal */}
      <Modal visible={showEdit} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 }}>✏️ แก้ไขโปรไฟล์</Text>
            <Text style={{ fontSize: 11, color: colors.textDim, marginBottom: 4 }}>ชื่อ</Text>
            <TextInput style={s.modalInput} value={displayName} onChangeText={setDisplayName} placeholder="ชื่อ" placeholderTextColor={colors.textMuted} />
            <Text style={{ fontSize: 11, color: colors.textDim, marginBottom: 4, marginTop: 12 }}>คำอธิบาย</Text>
            <TextInput style={[s.modalInput, { height: 60 }]} value={editBio} onChangeText={setEditBio} placeholder="คำอธิบาย" placeholderTextColor={colors.textMuted} multiline />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textDim, marginBottom: 4 }}>⚖️ น้ำหนัก (กก.)</Text>
                <TextInput style={s.modalInput} value={editWt} onChangeText={setEditWt} keyboardType="decimal-pad" placeholder="65" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textDim, marginBottom: 4 }}>📏 ส่วนสูง (ซม.)</Text>
                <TextInput style={s.modalInput} value={editHt} onChangeText={setEditHt} keyboardType="decimal-pad" placeholder="170" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setShowEdit(false)} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textDim }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setProfile({ weight: parseFloat(editWt) || 0, height: parseFloat(editHt) || 0 }); setShowEdit(false); Alert.alert("✅", "บันทึกโปรไฟล์แล้ว"); }} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear Modal */}
      <Modal visible={showClear} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.error, marginBottom: 4 }}>🗑️ ล้างข้อมูลทั้งหมด</Text>
            <Text style={{ fontSize: 12, color: colors.textDim, marginBottom: 16 }}>กรอกรหัสผ่านเพื่อยืนยัน</Text>
            <TextInput style={s.modalInput} value={clearPassword} onChangeText={setClearPassword} placeholder="รหัสผ่าน (fitquest)" placeholderTextColor={colors.textMuted} secureTextEntry />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setShowClear(false)} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textDim }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClear} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: colors.error, alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>ยืนยันล้าง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 32, maxWidth: 1100, width: "100%" },
  profileHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bg, borderWidth: 3, borderColor: "rgba(0,102,204,0.3)", alignItems: "center", justifyContent: "center" },
  profileName: { fontSize: 22, fontWeight: "800", color: colors.text },
  statPill: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 16, alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 12 },
  glassCard: { backgroundColor: "rgba(26,26,46,0.75)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 18, padding: 20, marginBottom: 24 },
  badgeCard: { width: "23%", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12, padding: 14, alignItems: "center" },
  badgeName: { fontSize: 11, fontWeight: "600", color: colors.text, marginTop: 4, textAlign: "center" },
  historyRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, padding: 10, marginBottom: 6 },
  modalInput: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
});
