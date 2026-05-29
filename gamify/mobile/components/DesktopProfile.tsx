import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Image, StyleSheet, Animated, TouchableOpacity, TextInput, Alert, Modal } from "react-native";
import { useStore } from "../store/useStore";
import { colors } from "../theme/colors";

const LV = [{ l: 1, title: "นักผจญภัยมือใหม่", badge: "🌱" }, { l: 2, title: "นักสู้ผู้เริ่มต้น", badge: "⚔️" }, { l: 3, title: "อัศวินฟิตเนส", badge: "🛡️" }, { l: 4, title: "จอมพลแห่งยิม", badge: "👑" }];

export default function DesktopProfile() {
  const { level, totalCoinsEarned, totalWorkouts, longestStreak, workoutLog, streak, todayCount, clearAllData } = useStore();
  const lv = LV[level - 1] || LV[LV.length - 1];
  const [showEdit, setShowEdit] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
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
          <TouchableOpacity onPress={() => { setDisplayName(lv.title); setEditBio(lv.title); setShowEdit(true); }}
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

      {/* Calendar Grid — matches mobile */}
      <Text style={s.sectionTitle}>📊 Activity Calendar — {monthName}</Text>
      <View style={s.glassCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 16 }}>
          <View style={{ alignItems: "center" }}><Text style={{ fontSize: 22, fontWeight: "900", color: colors.gold }}>{activeDays}</Text><Text style={{ fontSize: 10, color: colors.textDim }}>Active</Text></View>
          <View style={{ alignItems: "center" }}><Text style={{ fontSize: 22, fontWeight: "900", color: colors.error }}>{streak || 0}</Text><Text style={{ fontSize: 10, color: colors.textDim }}>🔥 Streak</Text></View>
          <View style={{ alignItems: "center" }}><Text style={{ fontSize: 22, fontWeight: "900", color: colors.success }}>{longestStreak}</Text><Text style={{ fontSize: 10, color: colors.textDim }}>Best</Text></View>
          <View style={{ alignItems: "center" }}><Text style={{ fontSize: 22, fontWeight: "900", color: colors.primary }}>{monthPct}%</Text><Text style={{ fontSize: 10, color: colors.textDim }}>Month</Text></View>
        </View>
        <View style={{ paddingVertical: 4 }}>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 8, justifyContent: "center" }}>
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
              <View key={i} style={{ width: 36, alignItems: "center" }}><Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: "600" }}>{d}</Text></View>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-start" }}>
            {Array.from({ length: firstDay }).map((_, i) => <View key={`e${i}`} style={{ width: 36, height: 36 }} />)}
            {Array.from({ length: dim }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
              const key = d.toISOString().slice(0, 10);
              const count = dayCount[key] || 0;
              const isToday = key === now.toISOString().slice(0, 10);
              return (
                <View key={i} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: isToday && count === 0 ? "rgba(255,255,255,0.06)" : "transparent", borderWidth: count > 0 ? 2 : (isToday ? 1 : 0), borderColor: count > 0 ? colors.success : (isToday ? "rgba(255,255,255,0.15)" : "transparent"), alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 12, fontWeight: count > 0 ? "700" : "400", color: count > 0 ? colors.success : (isToday ? colors.text : colors.textDim) }}>{i + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 8 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>วันนี้: {now.toLocaleDateString("th-TH", { weekday: "long" })}{todayCount > 0 ? " ✅ ทำแล้ว" : ""}</Text>
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

      {/* Verification History */}
      <Text style={s.sectionTitle}>📸 ประวัติตรวจสอบ</Text>
      {workoutLog.filter((l) => l.imageUri).length === 0 ? (
        <View style={{ padding: 20, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: colors.textDim }}>ยังไม่มีประวัติ 📸</Text></View>
      ) : workoutLog.filter((l) => l.imageUri).slice(0, 8).map((l, i) => (
        <View key={i} style={s.historyRow}>
          {l.imageUri ? <Image source={{ uri: l.imageUri }} style={{ width: 44, height: 44, borderRadius: 8 }} /> :
            <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}><Text>🏃</Text></View>}
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>{l.activity}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Text style={{ fontSize: 10, color: colors.gold }}>+{l.coins}🪙</Text>
              <Text style={{ fontSize: 10, color: l.fraudScore && l.fraudScore > 20 ? colors.error : colors.success }}>🛡️ Fraud: {l.fraudScore ?? 0}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 18 }}>{l.verified ? "✅" : "⏳"}</Text>
        </View>
      ))}
      <View style={{ height: 40 }} />

      {/* Edit Modal */}
      <Modal visible={showEdit} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 }}>✏️ แก้ไขโปรไฟล์</Text>
            <Text style={{ fontSize: 11, color: colors.textDim, marginBottom: 4 }}>ชื่อ</Text>
            <TextInput style={s.modalInput} value={displayName} onChangeText={setDisplayName} placeholder="ชื่อ" placeholderTextColor={colors.textMuted} />
            <Text style={{ fontSize: 11, color: colors.textDim, marginBottom: 4, marginTop: 12 }}>คำอธิบาย</Text>
            <TextInput style={[s.modalInput, { height: 60 }]} value={editBio} onChangeText={setEditBio} placeholder="คำอธิบาย" placeholderTextColor={colors.textMuted} multiline />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setShowEdit(false)} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textDim }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowEdit(false); Alert.alert("✅", "บันทึกโปรไฟล์แล้ว"); }} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center" }}>
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
