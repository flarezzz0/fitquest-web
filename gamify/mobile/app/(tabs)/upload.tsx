import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../theme/colors";
import { useStore } from "../../store/useStore";
import { uploadActivity } from "../../services/api";
import { runClientAntiCheat } from "../../services/antiCheat";

const ACTIVITIES = [
  { id: "cardio", emoji: "🏃", name: "คาร์ดิโอ", coins: 10 },
  { id: "walk", emoji: "🚶", name: "เดินทั่วไป", coins: 3 },
  { id: "weights", emoji: "🏋️", name: "เวทเทรนนิ่ง", coins: 12 },
  { id: "hiit", emoji: "💥", name: "HIIT", coins: 14 },
  { id: "swim", emoji: "🏊", name: "ว่ายน้ำ", coins: 10 },
  { id: "yoga", emoji: "🧘", name: "โยคะ/ยืด", coins: 6 },
];

// กิจกรรมที่มีระยะทาง (cardio/walk)
const SHOW_DISTANCE = ["cardio", "walk"];

const parseDuration = (s: string): number => {
  if (!s) return 0;
  if (s.includes(":")) { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); }
  return parseInt(s) || 0;
};

// MET-based calorie calculator (2024 Compendium)
function calcCalories(activityId: string, durationMin: number, distanceKm: number, weightKg: number): number {
  if (durationMin <= 0) return 0;
  const w = weightKg || 65;
  let met: number;
  if (activityId === "cardio" && distanceKm > 0) {
    const pace = durationMin / distanceKm;
    met = pace <= 5 ? 11.0 : pace <= 7 ? 8.3 : 6.0;
  } else if (activityId === "cardio") {
    met = 8.0;
  } else if (activityId === "walk" && distanceKm > 0) {
    const pace = durationMin / distanceKm;
    met = pace >= 15 ? 2.5 : pace >= 12 ? 3.5 : 4.3;
  } else if (activityId === "walk") {
    met = 3.5;
  } else if (activityId === "weights") met = 5.0;
  else if (activityId === "yoga") met = 3.0;
  else if (activityId === "hiit") met = 8.0;
  else if (activityId === "swim") met = 6.0;
  else met = 5.0;

  // calories = (MET x 3.5 x weight x duration) / 200
  let cal = Math.round((met * 3.5 * w * durationMin) / 200);
  // cardio/walk ที่มีระยะทาง -> บวก extra
  if ((activityId === "cardio" || activityId === "walk") && distanceKm > 0) {
    cal += Math.round(0.75 * w * distanceKm);
  }
  return Math.max(cal, 50);
}

const validateInputs = (dur: string, dist: string, cal: string): string | null => {
  const mins = parseDuration(dur);
  if (mins < 5) return "⏱️ ระยะเวลาต้องอย่างน้อย 5 นาที";
  if (mins > 1440) return "⏱️ ระยะเวลาต้องไม่เกิน 24 ชั่วโมง (1440 นาที)";
  if (dist) { const d = parseFloat(dist); if (d < 0.1) return "📏 ระยะทางต้องอย่างน้อย 100 เมตร"; if (d > 100) return "📏 ระยะทางต้องไม่เกิน 100 กม."; }
  if (cal) { const c = parseInt(cal); if (c < 50) return "🔥 แคลอรีต้องอย่างน้อย 50 kcal"; }
  return null;
};

// Three states: "form" | "verifying" | "result"
type PageState =
  | { type: "form" }
  | { type: "verifying" }
  | { type: "result"; coins: number; score: number; risk: string; ok: boolean; msg: string; activity?: string; activityId?: string; duration?: number; distance?: number; calories?: number };

export default function UploadScreen() {
  const [act, setAct] = useState("cardio");
  const [uri, setUri] = useState<string | null>(null);
  const [dur, setDur] = useState("30");
  const [dist, setDist] = useState("");
  const [cal, setCal] = useState("");
  const [page, setPage] = useState<PageState>({ type: "form" });
  const calUserEdited = React.useRef(false);
  const { user, streak, addCoins, addWorkout, updateStreak, backendAvailable, setBackend, workoutLog, profile, questProgress } = useStore();

  // Auto-calculate calories when duration/distance/activity changes
  useEffect(() => {
    if (calUserEdited.current) return; // user แก้เองแล้ว ไม่เขียนทับ
    const mins = parseDuration(dur);
    const distKm = parseFloat(dist) || 0;
    if (mins >= 5) {
      const weight = profile.weight || 65;
      const auto = calcCalories(act, mins, distKm, weight);
      setCal(String(auto));
    }
  }, [act, dur, dist]);

  const handleCalChange = (v: string) => {
    calUserEdited.current = true;
    setCal(v);
  };

  useEffect(() => { if (Platform.OS === "web") ImagePicker.requestCameraPermissionsAsync().catch(() => {}); }, []);
  useEffect(() => { import("../../services/api").then(({ checkHealth }) => { checkHealth().then(() => setBackend(true)).catch(() => setBackend(false)); }); }, []);

  const pick = useCallback(async () => { const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 }); if (!r.canceled) setUri(r.assets[0].uri); }, []);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.style.display = "none";
    input.onchange = (e: any) => { const f = e.target?.files?.[0]; if (f) { const reader = new FileReader(); reader.onload = (ev) => setUri(ev.target?.result as string); reader.readAsDataURL(f); } };
    document.body.appendChild(input);
    fileInputRef.current = input;
    return () => { try { document.body.removeChild(input); } catch {} };
  }, []);

  const snap = useCallback(async () => {
    if (Platform.OS === "web") {
      fileInputRef.current?.click();
      return;
    }
    const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) { Alert.alert("⚠️", "ต้องการสิทธิ์กล้อง"); return; }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.8 }); if (!r.canceled) setUri(r.assets[0].uri);
  }, []);

  const submit = async () => {
    if (!user) { Alert.alert("🔒", "กรุณาล็อกอินก่อนบันทึกกิจกรรม"); return; }
    if (!uri) { Alert.alert("📸", "กรุณาเลือกหลักฐาน"); return; }
    const valError = validateInputs(dur, dist, cal);
    if (valError) { Alert.alert("⚠️ ตรวจสอบข้อมูล", valError); return; }

    setPage({ type: "verifying" });
    const a = ACTIVITIES.find((x) => x.id === act);
    const mult = streak <= 0 ? 1 : streak <= 3 ? 1 : streak <= 7 ? 1.5 : 2;
    const base = a?.coins || 0; const bonus = Math.round(base * (mult - 1)); const total = base + bonus;

    try {
      if (backendAvailable) {
        // REAL: use backend OCR
        const fd = new FormData();
        fd.append("image", { uri, name: "workout.jpg", type: "image/jpeg" } as any);
        fd.append("activityId", act); fd.append("duration", String(parseDuration(dur))); fd.append("distance", dist || "0"); fd.append("calories", cal || "0");
        await new Promise(r => setTimeout(r, 1500)); // simulate processing
        const res = await uploadActivity(fd);
        if (res.data.status === "approved") {
          const c = res.data.totalCoins || total; const fs = res.data.antiCheat?.fraudScore || 0; const rl = res.data.antiCheat?.riskLevel || "low";
          addCoins(c); addWorkout({ date: new Date().toISOString(), activity: a?.name || "", activityId: act, duration: parseDuration(dur), distance: parseFloat(dist) || 0, calories: parseInt(cal) || 0, coins: c, bonus: bonus > 0 ? `+${bonus}` : null, verified: true, imageUri: uri, fraudScore: fs, riskLevel: rl }); updateStreak(streak + 1);
          setPage({ type: "result", coins: c, score: fs, risk: rl, ok: true, msg: `✅ AI ตรวจสอบผ่าน!`, activity: a?.name || "", activityId: act, duration: parseDuration(dur), distance: parseFloat(dist) || 0, calories: parseInt(cal) || 0 });
        } else {
          setPage({ type: "result", coins: 0, score: 0, risk: "high", ok: false, msg: res.data.messages?.join("\n") || "❌ ตรวจสอบไม่ผ่าน" });
        }
      } else {
        // LOCAL: client-side anti-cheat
        await new Promise(r => setTimeout(r, 1500));
        const { passed, fraudScore: fs, riskLevel: rl, flags } = runClientAntiCheat({ activityId: act, duration: parseDuration(dur), imageUri: uri || "", workoutLog });
        if (!passed) {
          setPage({ type: "result", coins: 0, score: fs, risk: rl, ok: false, msg: `🚨 ตรวจพบความผิดปกติ\nคะแนน: ${fs}/100\nสาเหตุ: ${flags.map((f: any) => f.code).join(", ")}` });
        } else {
          addCoins(total); addWorkout({ date: new Date().toISOString(), activity: a?.name || "", activityId: act, duration: parseDuration(dur), distance: parseFloat(dist) || 0, calories: parseInt(cal) || 0, coins: total, bonus: bonus > 0 ? `+${bonus}` : null, verified: true, imageUri: uri, fraudScore: fs, riskLevel: rl }); updateStreak(streak + 1);
          setPage({ type: "result", coins: total, score: fs, risk: rl, ok: true, msg: `✅ Local verification passed!`, activity: a?.name || "", activityId: act, duration: parseDuration(dur), distance: parseFloat(dist) || 0, calories: parseInt(cal) || 0 });
        }
      }
    } catch (e: any) {
      setPage({ type: "result", coins: 0, score: 0, risk: "high", ok: false, msg: `❌ เกิดข้อผิดพลาด: ${e.message}` });
    }
  };

  const resetForm = () => { setPage({ type: "form" }); setUri(null); setDur("30"); setDist(""); setCal(""); calUserEdited.current = false; };

  // ===== RESULT SCREEN =====
  if (page.type === "result") {
    const recent = workoutLog.filter((l) => l.imageUri);
    const scoreColor = !page.score || page.score < 20 ? "rgba(48,209,88,0.1)" : page.score < 50 ? "rgba(255,159,10,0.1)" : "rgba(255,69,58,0.1)";
    const scoreTxt = !page.score || page.score < 20 ? "✅ ผ่าน" : page.score < 50 ? "⚠️ ปานกลาง" : "❌ สูง";
    const scoreTxtColor = !page.score || page.score < 20 ? colors.success : page.score < 50 ? colors.warning : colors.error;
    const activityEmoji = page.activityId === "cardio" ? "🏃" : page.activityId === "weights" ? "🏋️" : page.activityId === "walk" ? "🚶" : page.activityId === "hiit" ? "💥" : page.activityId === "swim" ? "🏊" : "🧘";
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 14 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ alignItems: "center", marginTop: 28, marginBottom: 14 }}>
            <Text style={{ fontSize: 48 }}>{page.ok ? "🎉" : "❌"}</Text>
            {page.ok ? (
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.gold, marginTop: 6 }}>+{page.coins} 🪙</Text>
            ) : (
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.error, marginTop: 6 }}>ไม่ผ่านการตรวจสอบ</Text>
            )}
            <Text style={{ fontSize: 12, color: colors.textDim, marginTop: 4, textAlign: "center" }}>{page.msg}</Text>
          </View>

          {page.ok && (<>
            {/* Activity Card — Calldash style */}
            {page.activity && (
              <View style={{ backgroundColor: scoreColor, borderRadius: 16, padding: 14, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 24 }}>{activityEmoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{page.activity}</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                      {page.duration ? <Text style={{ fontSize: 11, color: colors.textDim }}>⏱️ {page.duration}น</Text> : null}
                      {page.distance ? <Text style={{ fontSize: 11, color: colors.textDim }}>📏 {page.distance}กม</Text> : null}
                      {page.calories ? <Text style={{ fontSize: 11, color: colors.gold }}>🔥 {page.calories}</Text> : null}
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.gold }}>+{page.coins}🪙</Text>
                    <View style={{ marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: scoreColor }}>
                      <Text style={{ fontSize: 9, fontWeight: "600", color: scoreTxtColor }}>{scoreTxt}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Quest Progress */}
            {(() => {
              const DQ_MAP: Record<string, { name: string; target: number }> = {
                d_cardio_20: { name: "🏃‍♂️ คาร์ดิโอ 20 นาที", target: 20 },
                d_stretch: { name: "🧘 ยืดกล้ามเนื้อ 10 นาที", target: 10 },
                d_steps_5k: { name: "🚶 เดิน 5,000 ก้าว", target: 5000 },
              };
              const doneQ = Object.entries(DQ_MAP).filter(([id, q]) => (questProgress[id] || 0) >= q.target);
              const progQ = Object.entries(DQ_MAP).filter(([id, q]) => {
                const p = questProgress[id] || 0; return p > 0 && p < q.target;
              });
              if (doneQ.length === 0 && progQ.length === 0) return null;
              return (
                <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 14, marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: 8 }}>📅 ความคืบหน้าเควส</Text>
                  {doneQ.map(([id, q]) => (
                    <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 12 }}>✅</Text>
                      <Text style={{ fontSize: 11, color: colors.success, fontWeight: "600", flex: 1 }}>{q.name}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(48,209,88,0.12)" }}>
                        <Text style={{ fontSize: 9, fontWeight: "600", color: colors.success }}>🎁 รับได้!</Text>
                      </View>
                    </View>
                  ))}
                  {progQ.map(([id, q]) => (
                    <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 12, opacity: 0.5 }}>📅</Text>
                      <Text style={{ fontSize: 11, color: colors.textDim, flex: 1 }}>{q.name}</Text>
                      <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "600" }}>{questProgress[id] || 0}/{q.target}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            {/* Fraud + Stats Card */}
            <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 14, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: 8 }}>🛡️ การตรวจสอบ</Text>
              {[{ l: "Fraud Score", v: `${page.score}/100`, c: page.score > 20 ? colors.error : colors.success },
                { l: "Risk Level", v: page.risk === "high" ? "❌ สูง" : page.risk === "medium" ? "⚠️ ปานกลาง" : "✅ ต่ำ", c: page.risk === "high" ? colors.error : colors.success },
                { l: "Streak Bonus", v: `x${streak <= 3 ? 1 : streak <= 7 ? 1.5 : 2}`, c: colors.gold },
              ].map((r, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: "rgba(255,255,255,0.04)" }}>
                  <Text style={{ fontSize: 11, color: colors.textDim }}>{r.l}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: r.c === colors.gold ? "rgba(255,214,10,0.12)" : "rgba(255,255,255,0.06)" }}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: r.c }}>{r.v}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Recent Images */}
            {recent.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {recent.slice(0, 6).map((l, i) => (
                  <View key={i} style={{ width: "30%", aspectRatio: 1, borderRadius: 12, overflow: "hidden" }}>
                    {l.imageUri ? <Image source={{ uri: l.imageUri }} style={{ width: "100%", height: "100%" }} /> :
                      <View style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" }}><Text>🏃</Text></View>}
                  </View>
                ))}
              </View>
            )}
          </>)}

          {!page.ok && (
            <View style={{ backgroundColor: "rgba(255,69,58,0.08)", borderRadius: 16, padding: 14, marginBottom: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.error, marginBottom: 4 }}>❌ ไม่ผ่านการตรวจสอบ</Text>
              <Text style={{ fontSize: 11, color: colors.textDim }}>{page.msg}</Text>
            </View>
          )}

          <TouchableOpacity onPress={resetForm} style={{ padding: 14, backgroundColor: colors.primary, borderRadius: 14, alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontWeight: "700", color: "#fff" }}>{page.ok ? "📸 บันทึกอีกครั้ง" : "🔄 ลองใหม่"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== VERIFYING SCREEN =====
  if (page.type === "verifying") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 16 }}>🤖 กำลังตรวจสอบ...</Text>
        <Text style={{ fontSize: 12, color: colors.textDim, marginTop: 6 }}>AI Agents กำลังวิเคราะห์หลักฐานของคุณ</Text>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 24 }}>
          {["👮", "🚨", "🔍", "🪙"].map((e, i) => (
            <View key={i} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 20, opacity: i < 2 ? 1 : 0.3 }}>{e}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ===== FORM =====
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ paddingHorizontal: 14 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 8 }}>📸 บันทึกกิจกรรม</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginVertical: 10, backgroundColor: backendAvailable ? "rgba(48,209,88,0.1)" : "rgba(255,159,10,0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, alignSelf: "flex-start" }}>
          <Text style={{ fontSize: 9, color: backendAvailable ? colors.success : colors.warning, fontWeight: "600" }}>{backendAvailable ? "🤖 AI OCR" : "🛡️ Local"}</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {ACTIVITIES.map((a) => (
            <TouchableOpacity key={a.id} onPress={() => { setAct(a.id); calUserEdited.current = false; }} style={[ss.act, act === a.id && ss.actActive]}>
              <Text style={{ fontSize: 28 }}>{a.emoji}</Text><Text style={[ss.actN, act === a.id && { color: colors.primary }]}>{a.name}</Text>
              <Text style={{ fontSize: 11, color: colors.gold }}>+{a.coins} 🪙</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[ss.up, uri && ss.upDone]}>
          {uri ? <Image source={{ uri }} style={{ width: "100%", height: 200, borderRadius: 10 }} /> : (
            <><Text style={{ fontSize: 40 }}>📷</Text><Text style={{ fontSize: 13, color: colors.textDim, marginTop: 8 }}>แตะเพื่อถ่ายรูปหรือเลือกรูป</Text><Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>Apple Health, Strava, Smart Watch</Text></>
          )}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TouchableOpacity onPress={snap} style={ss.bt}><Text style={{ fontSize: 16 }}>📸</Text><Text style={ss.btT}>ถ่ายรูป</Text></TouchableOpacity>
            <TouchableOpacity onPress={pick} style={ss.bt}><Text style={{ fontSize: 16 }}>🖼️</Text><Text style={ss.btT}>เลือกรูป</Text></TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <View style={ss.fl}><Text style={ss.flL}>⏱️ ระยะเวลา (นาที หรือ ชม:นาที เช่น 1:30)</Text>
            <TextInput style={ss.in} value={dur} onChangeText={setDur} keyboardType="default" placeholder="30" placeholderTextColor={colors.textMuted} />
          </View>
          {SHOW_DISTANCE.includes(act) && (
          <View style={[ss.fl, { marginTop: 8 }]}><Text style={ss.flL}>📏 ระยะทาง (กม. เช่น 0.1-100)</Text>
            <TextInput style={ss.in} value={dist} onChangeText={setDist} keyboardType="decimal-pad" placeholder="5.2" placeholderTextColor={colors.textMuted} />
          </View>
          )}
          <View style={[ss.fl, { marginTop: 8 }]}><Text style={ss.flL}>🔥 แคลอรี (50 kcal ขึ้นไป)</Text>
            <TextInput style={ss.in} value={cal} onChangeText={handleCalChange} keyboardType="numeric" placeholder="312" placeholderTextColor={colors.textMuted} />
          </View>
        </View>

        <TouchableOpacity onPress={submit} style={ss.sub}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>📸 ส่งหลักฐาน</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
const ss = StyleSheet.create({
  act: { width: "48%", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12, padding: 14, alignItems: "center" },
  actActive: { borderColor: colors.primary, backgroundColor: "rgba(0,102,204,0.06)" },
  actN: { fontSize: 12, fontWeight: "600", color: colors.text, marginTop: 4 },
  up: { borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 12 },
  upDone: { borderColor: colors.success, backgroundColor: "rgba(48,209,88,0.04)" },
  bt: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  btT: { fontSize: 12, fontWeight: "600", color: colors.text },
  fl: { width: "100%", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.cardBorder },
  flL: { fontSize: 10, color: colors.textDim, marginBottom: 6 },
  in: { fontSize: 16, fontWeight: "600", color: colors.text, padding: 0, height: 32 },
  sub: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center" },
  cheatBox: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12, padding: 14, marginTop: 14 },
});
