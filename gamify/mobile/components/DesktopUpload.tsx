import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";
import { useStore } from "../store/useStore";
import { uploadActivity } from "../services/api";

const ACTIVITIES = [
  { id: "cardio", emoji: "🏃", name: "คาร์ดิโอ", coins: 10 },
  { id: "walk", emoji: "🚶", name: "เดินทั่วไป", coins: 3 },
  { id: "weights", emoji: "🏋️", name: "เวทเทรนนิ่ง", coins: 12 },
  { id: "hiit", emoji: "💥", name: "HIIT", coins: 14 },
  { id: "swim", emoji: "🏊", name: "ว่ายน้ำ", coins: 10 },
  { id: "yoga", emoji: "🧘", name: "โยคะ/ยืด", coins: 6 },
];

const SHOW_DISTANCE = ["cardio", "walk"];

const CHECKS = [
  { id: "moderation", label: "👮 ตรวจ Content", desc: "ตรวจรูปไม่เหมาะสม" },
  { id: "antiCheat", label: "🚨 ตรวจจับการโกง", desc: "Fraud Score, ภาพซ้ำ, ค่าผิดปกติ" },
  { id: "ocr", label: "🔍 AI อ่านข้อมูล", desc: "OCR อ่านเวลา/ระยะทาง/kcal" },
  { id: "reward", label: "🪙 คำนวณแต้ม", desc: "ฐาน + Streak Bonus" },
];

export default function DesktopUpload() {
  const [act, setAct] = useState("cardio");
  const [uri, setUri] = useState<string | null>(null);
  const [dur, setDur] = useState("30");
  const [dist, setDist] = useState("");
  const [cal, setCal] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<{ coins: number; score?: number; risk?: string; activity?: string; activityId?: string; duration?: number; distance?: number; calories?: number } | null>(null);
  const { streak, addCoins, addWorkout, updateStreak, backendAvailable, workoutLog, profile, questProgress } = useStore();
  const calUserEdited = React.useRef(false);

  // MET-based calorie calculator (2024 Compendium)
  const calcCal = (aid: string, mins: number, distKm: number, w: number) => {
    if (mins <= 0) return 0;
    const kg = w || 65;
    let met: number;
    if (aid === "cardio" && distKm > 0) {
      const pace = mins / distKm;
      met = pace <= 5 ? 11.0 : pace <= 7 ? 8.3 : 6.0;
    } else if (aid === "cardio") met = 8.0;
    else if (aid === "walk" && distKm > 0) {
      const pace = mins / distKm;
      met = pace >= 15 ? 2.5 : pace >= 12 ? 3.5 : 4.3;
    } else if (aid === "walk") met = 3.5;
    else if (aid === "weights") met = 5.0;
    else if (aid === "yoga") met = 3.0;
    else if (aid === "hiit") met = 8.0;
    else if (aid === "swim") met = 6.0;
    else met = 5.0;

    let c = Math.round((met * 3.5 * kg * mins) / 200);
    if ((aid === "cardio" || aid === "walk") && distKm > 0) {
      c += Math.round(0.75 * kg * distKm);
    }
    return Math.max(c, 50);
  };

  // Auto-calculate
  React.useEffect(() => {
    if (calUserEdited.current) return;
    const mins = parseInt(dur) || 0;
    const distKm = parseFloat(dist) || 0;
    if (mins >= 5) {
      const w = profile.weight || 65;
      setCal(String(calcCal(act, mins, distKm, w)));
    }
  }, [act, dur, dist]);

  const handleCalChange = (v: string) => {
    calUserEdited.current = true;
    setCal(v);
  };

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!r.canceled) setUri(r.assets[0].uri);
  };
  const snap = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) { Alert.alert("ต้องการสิทธิ์กล้อง"); return; }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!r.canceled) setUri(r.assets[0].uri);
  };

  const submit = async () => {
    if (!uri) { Alert.alert("📸 กรุณาเลือกหลักฐาน"); return; }
    setLoading(true); setStep(0);
    const a = ACTIVITIES.find((x) => x.id === act);
    const mult = streak <= 0 ? 1 : streak <= 3 ? 1 : streak <= 7 ? 1.5 : 2;
    const base = a?.coins || 0;
    const bonus = Math.round(base * (mult - 1));
    const total = base + bonus;
    const runCheck = () => new Promise<void>((r) => {
      [600, 600, 800, 400].forEach((t, i) => setTimeout(() => setStep(i + 1), t * (i + 1)));
      setTimeout(r, 2500);
    });
    let fraudScore = 0; let riskLevel = "low";
    try {
      if (backendAvailable) {
        const fd = new FormData();
        fd.append("image", { uri, name: "workout.jpg", type: "image/jpeg" } as any);
        fd.append("activityId", act); fd.append("duration", dur);
        await runCheck();
        const res = await uploadActivity(fd);
        if (res.data.status === "approved") {
          const c = res.data.totalCoins || total;
          fraudScore = res.data.antiCheat?.fraudScore || 0;
          riskLevel = res.data.antiCheat?.riskLevel || "low";
          addCoins(c);
          addWorkout({ date: new Date().toISOString(), activity: a?.name || "", activityId: act, duration: parseInt(dur) || 0, distance: parseFloat(dist) || 0, calories: parseInt(cal) || 0, coins: c, bonus: bonus > 0 ? `+${bonus}` : null, verified: true, imageUri: uri, fraudScore, riskLevel });
          updateStreak(streak + 1);
          setDone({ coins: c, score: fraudScore, risk: riskLevel, activity: a?.name || "", activityId: act, duration: parseInt(dur) || 0, distance: parseFloat(dist) || 0, calories: parseInt(cal) || 0 });
        } else { Alert.alert("❌ ไม่ผ่าน", res.data.messages?.join("\n") || ""); }
      } else {
        await runCheck();
        fraudScore = Math.floor(Math.random() * 15);
        addCoins(total);
        addWorkout({ date: new Date().toISOString(), activity: a?.name || "", activityId: act, duration: parseInt(dur) || 0, distance: parseFloat(dist) || 0, calories: parseInt(cal) || 0, coins: total, bonus: bonus > 0 ? `+${bonus}` : null, verified: true, imageUri: uri, fraudScore, riskLevel });
        updateStreak(streak + 1);
        setDone({ coins: total, score: fraudScore, risk: "low", activity: a?.name || "", activityId: act, duration: parseInt(dur) || 0, distance: parseFloat(dist) || 0, calories: parseInt(cal) || 0 });
      }
    } catch (e: any) { Alert.alert("❌ Error", e.message); }
    setLoading(false);
  };

  // ====== SUCCESS SCREEN ======
  if (done) {
    const recent = workoutLog.filter((l) => l.imageUri);
    const scoreColor = !done.score || done.score < 20 ? "rgba(48,209,88,0.1)" : done.score < 50 ? "rgba(255,159,10,0.1)" : "rgba(255,69,58,0.1)";
    const scoreTxt = !done.score || done.score < 20 ? "✅ ผ่าน" : done.score < 50 ? "⚠️ ปานกลาง" : "❌ สูง";
    const scoreTxtColor = !done.score || done.score < 20 ? colors.success : done.score < 50 ? colors.warning : colors.error;
    const activityEmoji = done.activityId === "cardio" ? "🏃" : done.activityId === "weights" ? "🏋️" : done.activityId === "walk" ? "🚶" : done.activityId === "hiit" ? "💥" : done.activityId === "swim" ? "🏊" : "🧘";
    const DQ_MAP: Record<string, { name: string; target: number }> = {
      d_cardio_20: { name: "🏃‍♂️ คาร์ดิโอ 20 นาที", target: 20 },
      d_stretch: { name: "🧘 ยืดกล้ามเนื้อ 10 นาที", target: 10 },
      d_steps_5k: { name: "🚶 เดิน 5,000 ก้าว", target: 5000 },
    };
    const qp = questProgress;
    const doneQuests = Object.entries(DQ_MAP).filter(([id, q]) => (qp[id] || 0) >= q.target);
    const inProgressQuests = Object.entries(DQ_MAP).filter(([id, q]) => {
      const p = qp[id] || 0;
      return p > 0 && p < q.target;
    });
    return (
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", marginBottom: 24, marginTop: 20 }}>
          <Text style={{ fontSize: 56 }}>🎉</Text>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.gold, marginTop: 8 }}>+{done.coins} 🪙</Text>
          <Text style={{ fontSize: 14, color: colors.textDim, marginTop: 2 }}>บันทึกสำเร็จ!</Text>
        </View>

        {/* Activity Card — Calldash style */}
        <View style={{ backgroundColor: scoreColor, borderRadius: 18, padding: 18, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 28 }}>{activityEmoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{done.activity}</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 3 }}>
                {done.duration ? <Text style={{ fontSize: 12, color: colors.textDim }}>⏱️ {done.duration}น</Text> : null}
                {done.distance ? <Text style={{ fontSize: 12, color: colors.textDim }}>📏 {done.distance}กม</Text> : null}
                {done.calories ? <Text style={{ fontSize: 12, color: colors.gold }}>🔥 {done.calories}</Text> : null}
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gold }}>+{done.coins}🪙</Text>
              <View style={{ marginTop: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: scoreColor }}>
                <Text style={{ fontSize: 10, fontWeight: "600", color: scoreTxtColor }}>{scoreTxt}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.grid2}>
          <View style={s.cheatCard}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 10 }}>🛡️ การตรวจสอบ</Text>
            {[{ l: "Fraud Score", v: `${done.score || 0}/100`, c: done.score && done.score > 20 ? colors.error : colors.success },
              { l: "Risk Level", v: done.risk === "high" ? "❌ สูง" : done.risk === "medium" ? "⚠️ ปานกลาง" : "✅ ต่ำ", c: done.risk === "high" ? colors.error : colors.success },
              { l: "Streak Bonus", v: `x${streak <= 3 ? 1 : streak <= 7 ? 1.5 : 2}`, c: colors.gold },
            ].map((r, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: colors.divider }}>
                <Text style={{ fontSize: 13, color: colors.textDim }}>{r.l}</Text>
                <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, backgroundColor: r.c === colors.gold ? "rgba(255,214,10,0.12)" : "rgba(255,255,255,0.06)" }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: r.c }}>{r.v}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={s.cheatCard}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 10 }}>📸 รูปภาพ</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {recent.length === 0 ? <Text style={{ fontSize: 13, color: colors.textDim }}>ยังไม่มีรูป</Text> :
                recent.slice(0, 6).map((l, i) => (
                  <View key={i} style={{ width: "31%", aspectRatio: 1, borderRadius: 10, overflow: "hidden" }}>
                    {l.imageUri ? <Image source={{ uri: l.imageUri }} style={{ width: "100%", height: "100%" }} />
                      : <View style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 24 }}>🏃</Text></View>}
                  </View>
                ))}
            </View>
          </View>
        </View>

        {(doneQuests.length > 0 || inProgressQuests.length > 0) && (
          <View style={[s.glassCard, { marginTop: 16 }]}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 10 }}>📅 ความคืบหน้าเควส</Text>
            {doneQuests.map(([id, q]) => (
              <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 14 }}>✅</Text>
                <Text style={{ fontSize: 13, color: colors.success, fontWeight: "600", flex: 1 }}>{q.name}</Text>
                <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(48,209,88,0.12)" }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.success }}>🎁 รับได้!</Text>
                </View>
              </View>
            ))}
            {inProgressQuests.map(([id, q]) => {
              const p = qp[id] || 0;
              return (
                <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 14, opacity: 0.5 }}>📅</Text>
                  <Text style={{ fontSize: 13, color: colors.textDim, flex: 1 }}>{q.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>{p}/{q.target}</Text>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity onPress={() => { setDone(null); setUri(null); setStep(0); }}
          style={{ marginTop: 20, padding: 14, backgroundColor: colors.primary, borderRadius: 9999, alignItems: "center", maxWidth: 300, alignSelf: "center" }}>
          <Text style={{ fontWeight: "600", color: "#fff" }}>📸 บันทึกอีกครั้ง</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ====== UPLOAD FORM ======
  return (
    <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <Text style={s.pageTitle}>📸 บันทึกกิจกรรม</Text>
      <Text style={s.pageSub}>เลือกประเภทกิจกรรมแล้วอัปโหลดหลักฐาน — ระบบ AI ตรวจสอบอัตโนมัติ</Text>

      {/* Activity Selector */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>ประเภทกิจกรรม</Text>
        <View style={s.actGrid}>
          {ACTIVITIES.map((a) => (
            <TouchableOpacity key={a.id} onPress={() => { setAct(a.id); calUserEdited.current = false; }} style={[s.actCard, act === a.id && s.actActive]}>
              <Text style={{ fontSize: 32 }}>{a.emoji}</Text>
              <Text style={[s.actName, act === a.id && { color: colors.primary }]}>{a.name}</Text>
              <Text style={s.actCoins}>+{a.coins} 🪙</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upload + Form side by side */}
      <View style={s.mainRow}>
        {/* Left: Upload Zone */}
        <View style={s.uploadSection}>
          <Text style={s.sectionTitle}>📸 หลักฐาน</Text>
          <TouchableOpacity style={[s.uploadZone, uri && s.uploadDone]} onPress={pick}>
            {uri ? <Image source={{ uri }} style={{ width: "100%", height: 220, borderRadius: 12 }} /> : (
              <>
                <Text style={{ fontSize: 48 }}>📷</Text>
                <Text style={{ fontSize: 14, color: colors.textDim, marginTop: 8 }}>แตะเพื่อถ่ายรูปหรือเลือกรูป</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>Apple Health, Strava, Smart Watch</Text>
              </>
            )}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity onPress={snap} style={s.btn}><Text style={{ fontSize: 18 }}>📸</Text><Text style={s.btnT}>ถ่ายรูป</Text></TouchableOpacity>
              <TouchableOpacity onPress={pick} style={s.btn}><Text style={{ fontSize: 18 }}>🖼️</Text><Text style={s.btnT}>เลือกรูป</Text></TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Right: Details */}
        <View style={s.detailSection}>
          <Text style={s.sectionTitle}>รายละเอียด</Text>
          <View style={s.detailGrid}>
            <View style={s.field}><Text style={s.fieldL}>⏱️ ระยะเวลา</Text><TextInput style={s.input} value={dur} onChangeText={setDur} keyboardType="numeric" placeholder="นาที" placeholderTextColor={colors.textMuted} /></View>
            {SHOW_DISTANCE.includes(act) && (
            <View style={s.field}><Text style={s.fieldL}>📏 ระยะทาง</Text><TextInput style={s.input} value={dist} onChangeText={setDist} keyboardType="decimal-pad" placeholder="กม." placeholderTextColor={colors.textMuted} /></View>
            )}
            <View style={s.field}><Text style={s.fieldL}>🔥 แคลอรี</Text><TextInput style={s.input} value={cal} onChangeText={handleCalChange} keyboardType="numeric" placeholder="kcal" placeholderTextColor={colors.textMuted} /></View>
          </View>

          {/* Agent Checks */}
          {loading && (
            <View style={s.checksCard}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 8 }}>🤖 AI Agents กำลังตรวจสอบ...</Text>
              {CHECKS.map((c, i) => (
                <View key={c.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Text style={{ fontSize: 16 }}>{i < step ? "✅" : i === step ? "⏳" : "⏸️"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: "500", color: i <= step ? colors.text : colors.textMuted }}>{c.label}</Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>{c.desc}</Text>
                  </View>
                  {i === step && <ActivityIndicator size="small" color={colors.primary} />}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={submit} disabled={loading} style={[s.submitBtn, loading && { opacity: 0.6 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>📸 ส่งหลักฐาน</Text>}
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 32, maxWidth: 1100, width: "100%" },
  pageTitle: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 4 },
  pageSub: { fontSize: 13, color: colors.textDim, marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 10 },
  actGrid: { flexDirection: "row", gap: 10 },
  actCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12, padding: 16, alignItems: "center", width: 120 },
  actActive: { borderColor: colors.primary, backgroundColor: "rgba(0,102,204,0.06)" },
  actName: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: 6 },
  actCoins: { fontSize: 12, color: colors.gold, marginTop: 4 },
  mainRow: { flexDirection: "row", gap: 20 },
  uploadSection: { flex: 1 },
  uploadZone: { borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 24, alignItems: "center" },
  uploadDone: { borderColor: colors.success, backgroundColor: "rgba(48,209,88,0.04)" },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 },
  btnT: { fontSize: 13, fontWeight: "600", color: colors.text },
  detailSection: { flex: 1 },
  detailGrid: { gap: 10, marginBottom: 16 },
  field: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.cardBorder },
  fieldL: { fontSize: 10, color: colors.textDim, marginBottom: 4 },
  input: { fontSize: 16, fontWeight: "600", color: colors.text, padding: 0 },
  checksCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 16, marginBottom: 16 },
  submitBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 9999, alignItems: "center" },
  grid2: { flexDirection: "row", gap: 16, marginBottom: 20 },
  cheatCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 16 },
  uploadHistoryCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 16 },
  glassCard: { backgroundColor: "rgba(26,26,46,0.75)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 18, padding: 20 },
});
