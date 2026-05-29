# context.md — FitQuest 🎮📱

## 1. Project Overview

FitQuest คือ Fitness Gamification System ที่:
- อัปโหลดกิจกรรมออกกำลังกายพร้อมหลักฐานรูป
- รับการตรวจจาก AI (OCR Tesseract.js + Anti-cheat)
- ได้เหรียญ 🪙 แลกรางวัล ทำ quest รายวัน/รายสัปดาห์

### Stack ปัจจุบัน
- **Mobile App:** Expo SDK 54 + React Native 0.81.5 + expo-router v6
- **Backend:** Node.js + Express + Tesseract.js OCR + 7 AI Agents
- **State:** Zustand + AsyncStorage (localStorage บน web)
- **ดีไซน์:** Apple Design System (Dark mode, SF Pro)

---

## 2. Core Rules

### ❌ ห้าม
- "max-width" / scale เพื่อแก้ responsive
- mutate Zustand state โดยตรง
- rewrite ทั้งไฟล์
- แก้เกิน 1 feature ต่อรอบ

### ✅ ต้อง
- `set()` จาก Zustand เท่านั้น
- patch เฉพาะ section
- `npx tsc --noEmit` ก่อน commit
- `grep -n` หาตำแหน่งก่อน `edit`

---

## 3. Current Architecture (30 May 2026)

```
mobile/
├── app/
│   ├── _layout.tsx          ← Root (Mobile only — Desktop ถูกลบ)
│   └── (tabs)/
│       ├── _layout.tsx      ← Bottom Tab (5 เมนู)
│       ├── index.tsx        ← 🏠 Dashboard
│       ├── upload.tsx       ← 📸 Upload (3 states: form/verifying/result)
│       ├── quests.tsx       ← 📅 Quests (Daily+Weekly reset 05:00 TH)
│       ├── shop.tsx         ← 🛒 Shop (Daily+Weekly reset)
│       └── profile.tsx      ← 👤 Profile (Edit + Calendar + Clear + Google)
│
├── components/              ← 10 components
│   ├── CoinCard, StreakBanner, QuestCard, ActivityCard, RewardCard
│   └── EmptyState, Toast
│   └── Desktop* (5 ไฟล์ — ไม่ได้ใช้แล้ว แต่ยังไม่ลบ)
│
├── services/
│   ├── api.ts               ← Axios → Backend :3456
│   ├── antiCheat.ts         ← Anti-cheat v2 (8 detection layers)
│   └── auth.ts              ← Google OAuth (รอใส่ clientId)
│
├── store/
│   └── useStore.ts          ← Zustand + AsyncStorage persist
│
├── theme/
│   ├── colors.ts            ← Apple colors
│   ├── breakpoints.ts
│   ├── spacing.ts
│   └── radius.ts
│
├── hooks/
│   └── useResponsive.ts     ← isDesktop/isMobile
│
└── backend/ (separate folder)
    ├── server.js            ← Express API
    └── agents/              ← 7 AI Agents + Tools + Event Bus
```

---

## 4. 3-State Pattern (Upload page)

```
Form → กดส่ง → Verifying (full screen loading) → Result (ผ่าน/ไม่ผ่าน)
```

Result แสดง:
- ✅ ผ่าน → +coins + Fraud Score + Risk Level + Streak Bonus
- ❌ ไม่ผ่าน → เหตุผล + ปุ่ม "ลองใหม่"

---

## 5. Anti-Cheat v2 (8 Layers)

| Layer | เช็ค | น้ำหนัก |
|-------|------|---------|
| ⏱️ Duration | ต่ำ/สูงเกินไป | 25/15 |
| 📸 Image Duplicate | URI ตรงกัน | 45 |
| 🔍 Similar filename | รูปชื่อคล้ายกัน | 30 |
| 📋 Daily limit | เกิน per-activity | 20 |
| ⏰ Time proximity | <30s / <2min | 15/8 |
| 🚨 Burst | 3+ ครั้งใน 10นาที | 25 |
| 🤖 Bot pattern | Duration ตรงกันเป๊ะ | 20 |
| 📊 Prior fraud | มีประวัติโกง | 20 |

Score: 0-19 low ✅ | 20-49 medium | 50-74 high | 75+ critical ❌

---

## 6. Quest/Shop Reset Logic

- **Daily reset:** 05:00 น. เวลาไทย
- **Weekly reset:** ทุกวันจันทร์ 05:00 น.
- ตรวจสอบผ่าน `checkDailyReset()` / `checkWeeklyReset()` ใน store
- เรียกจากทุกหน้าที่เกี่ยวข้อง (quests, shop)

---

## 7. State Management (Zustand)

- **Action → API → set() store → subscriber re-render**
- ห้าม `useEffect` fetch ใน component
- Desktop components ถูกลบแล้ว — เหลือแค่ mobile
- AsyncStorage sync อัตโนมัติทุก state change

---

## 8. UI/UX

- ✅ EmptyState component พร้อมใช้
- ✅ Toast system (ToastProvider + useToast)
- ✅ Haptic (Vibration.vibrate 50ms ตอน claim quest)
- ✅ Loading screen (ActivityIndicator)
- ✅ Error banner + error modal
- ❌ Google Login — รอใส่ clientId จาก Google Console

---

## 9. Backend AI Agents (7 ตัว)

```
🧠 MainAgent → Orchestrator
🔍 VerificationAgent → OCR (Tesseract.js)
🚨 AntiCheatAgent → Fraud detection
👮 ModerationAgent → Content check
🪙 RewardAgent → Calculate coins
🎯 RecommendationAgent → Suggest
🧠 MemoryAgent → Remember user
📡 EventBus → Agent-to-agent comm
```

---

## 10. Debugging Rules

ก่อนแก้:
1. อ่าน `context.md` ก่อน
2. `grep -n` หาตำแหน่งที่ต้องแก้
3. `read` เฉพาะ section นั้น
4. `edit` เฉพาะส่วนที่เปลี่ยน
5. `npx tsc --noEmit` verify
6. `pkill -9 -f expo` → `npx expo start` test

---

## 11. Golden Rule

> “ระบบนี้ต้องขยายได้ ไม่ใช่แค่ใช้งานได้”

ทุกการแก้ต้อง:
- maintainable
- scalable
- predictable
