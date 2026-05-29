import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Image, StyleSheet, Animated, TouchableOpacity, TextInput, Alert, Modal, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";

const LV = [
  { l: 1, title: "นักผจญภัยมือใหม่", badge: "🌱" },
  { l: 2, title: "นักสู้ผู้เริ่มต้น", badge: "⚔️" },
  { l: 3, title: "อัศวินฟิตเนส", badge: "🛡️" },
  { l: 4, title: "จอมพลแห่งยิม", badge: "👑" },
];

const CELL = 20;
const GAP = 5;
const HEAT_LEVELS = ["rgba(0,102,204,0.04)", "rgba(0,102,204,0.12)", "rgba(0,102,204,0.28)", "rgba(0,102,204,0.50)", "rgba(0,102,204,0.72)", "#0066cc"];

function HeatCell({ count, max, index }: { count: number; max: number; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 8, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 40, delay: index * 8, useNativeDriver: true }),
    ]).start();
  }, []);
  const level = max > 0 ? Math.min(5, Math.round((count / max) * 5)) : count > 0 ? 1 : 0;
  const bg = HEAT_LEVELS[level];
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (level >= 4) Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.85, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, [level]);
  return (
    <Animated.View style={{ width: CELL, height: CELL, borderRadius: 5, backgroundColor: bg, opacity, transform: [{ scale: level >= 4 ? pulse : scale }], borderWidth: count > 0 ? 1 : 0, borderColor: level >= 4 ? "rgba(0,102,204,0.4)" : "transparent" }} />
  );
}

export default function ProfileScreen() {
  const { level, totalCoinsEarned, totalWorkouts, longestStreak, workoutLog, streak, todayCount, clearAllData, user, setUser, profile, setProfile } = useStore();
  const lv = LV[level - 1] || LV[LV.length - 1];

  // Edit profile state
  const [showEdit, setShowEdit] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPic, setEditPic] = useState("");
  const [editWt, setEditWt] = useState(String(profile.weight || ""));
  const [editHt, setEditHt] = useState(String(profile.height || ""));

  // Clear data confirmation
  const [showClear, setShowClear] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef<NodeJS.Timeout>(undefined as any);

  useEffect(() => {
    if (showClear) {
      setCountdown(10);
      timerRef.current = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    } else {
      clearInterval(timerRef.current);
      setCountdown(10);
    }
    return () => clearInterval(timerRef.current);
  }, [showClear]);

  // Calendar data
  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const dayCount: Record<string, number> = {};
  workoutLog.forEach((l) => { dayCount[l.date.slice(0, 10)] = (dayCount[l.date.slice(0, 10)] || 0) + 1; });
  const cells = Array.from({ length: dim }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
    return dayCount[d.toISOString().slice(0, 10)] || 0;
  });
  const maxVal = Math.max(...cells, 1);
  const activeDays = Object.keys(dayCount).length;
  const monthPct = Math.round((activeDays / dim) * 100);
  const monthName = now.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  const pageFade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(pageFade, { toValue: 1, duration: 600, useNativeDriver: true }).start(); }, []);

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!r.canceled) setEditPic(r.assets[0].uri);
  };

  const handleClear = () => {
    clearAllData();
    setShowClear(false);
    Alert.alert("✅", "ล้างข้อมูลสำเร็จ");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ paddingHorizontal: 14 }} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner} />

        {/* Avatar & Name */}
        <Animated.View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: -40, marginBottom: 14, opacity: pageFade }}>
          {user ? (
            <>
              <View style={[styles.avatar, { borderColor: colors.primary, overflow: "hidden" }]}>
                {user.picture ? (
                  <Image source={{ uri: user.picture }} style={{ width: 72, height: 72 }} />
                ) : (
                  <Text style={{ fontSize: 28, color: "#fff", fontWeight: "700" }}>{user.name.charAt(0)}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>{user.name}</Text>
                <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>{user.email}</Text>
                {user.bio ? <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, fontStyle: "italic" }}>{user.bio}</Text> : null}
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600", marginTop: 2 }}>LV.{level}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.avatar}><Text style={{ fontSize: 36 }}>{lv.badge}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>{lv.title}</Text>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600", marginTop: 2 }}>LV.{level}</Text>
              </View>
            </>
          )}
          <TouchableOpacity onPress={() => { setDisplayName(user?.name || lv.title); setEditBio(user?.bio || ""); setEditPic(""); setEditWt(String(profile.weight || "")); setEditHt(String(profile.height || "")); setShowEdit(true); }}
            style={{ padding: 8, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ fontSize: 16 }}>✏️</Text>
          </TouchableOpacity>
        </Animated.View>

        {user ? (<>
        {/* Stats Row */}
        <Animated.View style={{ flexDirection: "row", gap: 6, marginBottom: 14, opacity: pageFade }}>
          {[
            { v: totalCoinsEarned, c: colors.gold, l: "🪙 สะสม" },
            { v: totalWorkouts, c: colors.success, l: "🏋️ ครั้ง" },
            { v: longestStreak, c: colors.error, l: "🔥 สูงสุด" },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: "rgba(26,26,46,0.85)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: s.c }}>{s.v}</Text>
              <Text style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>{s.l}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Activity Calendar */}
        <Animated.View style={{ opacity: pageFade }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>📊 Activity Calendar</Text>
            <Text style={{ fontSize: 11, color: colors.primary }}>{monthName}</Text>
          </View>
          <View style={styles.glassCard}>
            {/* Stats row */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 14 }}>
              <View style={{ alignItems: "center" }}><Text style={{ fontSize: 20, fontWeight: "900", color: colors.gold }}>{activeDays}</Text><Text style={{ fontSize: 9, color: colors.textDim }}>Active</Text></View>
              <View style={{ alignItems: "center" }}><Text style={{ fontSize: 20, fontWeight: "900", color: colors.error }}>{streak || 0}</Text><Text style={{ fontSize: 9, color: colors.textDim }}>🔥 Streak</Text></View>
              <View style={{ alignItems: "center" }}><Text style={{ fontSize: 20, fontWeight: "900", color: colors.success }}>{longestStreak}</Text><Text style={{ fontSize: 9, color: colors.textDim }}>Best</Text></View>
              <View style={{ alignItems: "center" }}><Text style={{ fontSize: 20, fontWeight: "900", color: colors.primary }}>{monthPct}%</Text><Text style={{ fontSize: 9, color: colors.textDim }}>Month</Text></View>
            </View>
            {/* Calendar Grid */}
            <View style={{ paddingVertical: 4 }}>
              <View style={{ flexDirection: "row", gap: 4, marginBottom: 6, justifyContent: "center" }}>
                {["อา","จ","อ","พ","พฤ","ศ","ส"].map((d, i) => (
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
                    <View key={i} style={{
                      width: 32, height: 32, borderRadius: 8,
                      backgroundColor: isToday && count === 0 ? "rgba(255,255,255,0.06)" : "transparent",
                      borderWidth: count > 0 ? 2 : (isToday ? 1 : 0),
                      borderColor: count > 0 ? colors.success : (isToday ? "rgba(255,255,255,0.15)" : "transparent"),
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: count > 0 ? "700" : "400", color: count > 0 ? colors.success : (isToday ? colors.text : colors.textDim) }}>{i + 1}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 8 }}>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>วันนี้: {now.toLocaleDateString("th-TH", { weekday: "long" })}{todayCount > 0 ? " ✅ ทำแล้ว" : ""}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Badges */}
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 16, marginBottom: 8 }}>🏆 Badge</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {LV.filter((l) => l.l <= level).map((l) => (
            <View key={l.l} style={{ width: "23%", backgroundColor: "rgba(26,26,46,0.85)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 28 }}>{l.badge}</Text>
              <Text style={{ fontSize: 10, fontWeight: "600", color: colors.text, marginTop: 4, textAlign: "center" }}>{l.title}</Text>
              <Text style={{ fontSize: 9, color: colors.textDim, marginTop: 2 }}>LV.{l.l}</Text>
            </View>
          ))}
        </View>

        </>) : (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: colors.textDim, textAlign: "center" }}>🔒 กรุณาล็อกอินเพื่อดูข้อมูลและประวัติของคุณ</Text>
          </View>
        )}

        {/* Google Login / User Info */}
        <View style={{ marginTop: 16, marginBottom: 8 }}>
          {user ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 16, color: "#fff", fontWeight: "700" }}>{user.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{user.name}</Text>
                <Text style={{ fontSize: 11, color: colors.textDim }}>{user.email}</Text>
              </View>
              <TouchableOpacity onPress={() => { setUser(null); Alert.alert("👋", "ออกจากระบบแล้ว"); }}
                style={{ padding: 8, backgroundColor: "rgba(255,69,58,0.1)", borderRadius: 8 }}>
                <Text style={{ fontSize: 16 }}>🚪</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12 }}
              onPress={async () => {
                const { signInWithGoogle } = await import("../../services/auth");
                const result = await signInWithGoogle();
                if (result.success && result.user) {
                  setUser({ ...result.user, name: (user as any)?.name || result.user.name, bio: (user as any)?.bio });
                  Alert.alert("✅", `ยินดีต้อนรับ ${result.user.name}`);
                } else {
                  Alert.alert("⚠️", result.error || "เชื่อมต่อไม่สำเร็จ");
                }
              }}>
              <Text style={{ fontSize: 20 }}>🔵</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>เชื่อมต่อกับ Google</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Clear Data Button */}
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, backgroundColor: "rgba(255,69,58,0.08)", borderWidth: 1, borderColor: "rgba(255,69,58,0.2)", borderRadius: 12 }}
          onPress={() => { setShowClear(true); }}>
          <Text style={{ fontSize: 16 }}>🗑️</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.error }}>ล้างข้อมูลทั้งหมด</Text>
        </TouchableOpacity>

        {user ? (<>
        {/* Verification History */}
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginVertical: 8 }}>📸 ประวัติการตรวจสอบ</Text>
        {workoutLog.filter((l) => l.imageUri).length === 0 ? (
          <View style={{ padding: 14, backgroundColor: "rgba(26,26,46,0.85)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: colors.textDim }}>ยังไม่มีประวัติ 📸</Text>
          </View>
        ) : workoutLog.filter((l) => l.imageUri).slice(0, 10).map((l, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(26,26,46,0.85)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 8, marginBottom: 4 }}>
            {l.imageUri ? <Image source={{ uri: l.imageUri }} style={{ width: 40, height: 40, borderRadius: 6 }} /> :
              <View style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}><Text>🏃</Text></View>}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>{l.activity}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                <Text style={{ fontSize: 9, color: colors.gold }}>+{l.coins}🪙</Text>
                {l.duration ? <Text style={{ fontSize: 9, color: colors.textDim }}>⏱️{l.duration}น</Text> : null}
                {l.distance ? <Text style={{ fontSize: 9, color: colors.textDim }}>📏{l.distance}กม</Text> : null}
                {l.calories ? <Text style={{ fontSize: 9, color: colors.textDim }}>🔥{l.calories}kcal</Text> : null}
              </View>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 1 }}>
                <Text style={{ fontSize: 9, color: l.fraudScore && l.fraudScore > 20 ? colors.error : colors.success }}>🛡️ {l.fraudScore ?? 0}</Text>
                {l.riskLevel === "high" && <Text style={{ fontSize: 9, color: colors.error }}>⚠️ เสี่ยง</Text>}
              </View>
            </View>
            <Text style={{ fontSize: 16 }}>{l.verified ? "✅" : "⏳"}</Text>
          </View>
        ))}
        </>) : null}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== EDIT PROFILE MODAL ===== */}
      <Modal visible={showEdit} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 }}>✏️ แก้ไขโปรไฟล์</Text>

            <Text style={{ fontSize: 11, color: colors.textDim, marginBottom: 4 }}>ชื่อ</Text>
            <TextInput style={s.modalInput} value={displayName} onChangeText={setDisplayName} placeholder="ชื่อของคุณ" placeholderTextColor={colors.textMuted} />

            <Text style={{ fontSize: 11, color: colors.textDim, marginBottom: 4, marginTop: 12 }}>คำอธิบาย</Text>
            <TextInput style={[s.modalInput, { height: 60 }]} value={editBio} onChangeText={setEditBio} placeholder="คำอธิบายสั้นๆ" placeholderTextColor={colors.textMuted} multiline />

            <TouchableOpacity onPress={pickImage} style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 10, marginTop: 12, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder }}>
              <Text style={{ fontSize: 16 }}>🖼️</Text>
              <Text style={{ fontSize: 13, color: colors.textDim }}>{editPic ? "เปลี่ยนรูปแล้ว ✅" : "เลือกรูปโปรไฟล์"}</Text>
            </TouchableOpacity>

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
              <TouchableOpacity onPress={() => setShowEdit(false)}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textDim }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { if (user) setUser({ ...user, name: displayName, bio: editBio }); setProfile({ weight: parseFloat(editWt) || 0, height: parseFloat(editHt) || 0 }); setShowEdit(false); Alert.alert("✅", "บันทึกโปรไฟล์แล้ว"); }}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== CLEAR DATA MODAL ===== */}
      <Modal visible={showClear} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.error, marginBottom: 4 }}>🗑️ ล้างข้อมูลทั้งหมด</Text>
            <Text style={{ fontSize: 11, color: colors.warning, marginBottom: 16, lineHeight: 18 }}>⚠️ หากล้างข้อมูลแล้วจะไม่สามารถกู้คืนได้อีก</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setShowClear(false)}
                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textDim }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={countdown > 0}
                onPress={handleClear}
                style={{
                  flex: 1, padding: 12, borderRadius: 10, alignItems: "center",
                  backgroundColor: countdown > 0 ? colors.textMuted : colors.error,
                }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                  {countdown > 0 ? `⏳ ยืนยัน (${countdown})` : "🔴 ยืนยันล้าง"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  modalInput: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.cardBorder },
});

const styles = StyleSheet.create({
  banner: { height: 100, marginHorizontal: -14, backgroundColor: "transparent", borderBottomWidth: 1, borderBottomColor: "rgba(0,212,255,0.1)" },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.bg, borderWidth: 3, borderColor: "rgba(0,102,204,0.3)", alignItems: "center", justifyContent: "center" },
  glassCard: { backgroundColor: "rgba(26,26,46,0.75)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 18, padding: 16 },
});
