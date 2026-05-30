# context.md — FitQuest 🎮📱

## 1. Project Overview

FitQuest คือ Fitness Gamification System ที่:
- อัปโหลดกิจกรรมออกกำลังกายพร้อมหลักฐานรูป (📸)
- คำนวณแคลอรีอัตโนมัติตาม MET + น้ำหนักผู้ใช้
- รับการตรวจจาก AI (OCR Tesseract.js + Anti-cheat)
- ได้เหรียญ 🪙 สะสม XP, ทำเควสรายวัน/รายสัปดาห์
- มีระบบ Streak 🔥, Calendar กรอบเขียว, BMR/BMI, Shop

### Deploy
- **Web:** https://fitquest-web-two.vercel.app
- **GitHub:** https://github.com/flarezzz0/fitquest-web

### Stack ปัจจุบัน
- **Frontend:** Expo SDK 54 + React Native 0.81.5 + expo-router v6
- **Platform:** Web (Vercel) + Mobile (Expo Go)
- **Backend:** Node.js + Express + Tesseract.js OCR (local — ยังไม่ deploy)
- **State:** Zustand + AsyncStorage (localStorage บน web)
- **Auth:** Google OAuth (Client ID พร้อม, redirectUri = Vercel URL)
- **ดีไซน์:** Apple Design System (Dark mode, SF Pro)

---

## 2. Core Rules

### ❌ ห้าม
- rewrite ทั้งไฟล์
- mutate Zustand state โดยตรง
- แก้เกิน 1 feature ต่อรอบ

### ✅ ต้อง
- `set()` จาก Zustand เท่านั้น
- patch เฉพาะ section
- `npx tsc --noEmit` ก่อน commit
- `grep -n` หาตำแหน่งก่อน `edit`

---

## 3. Architecture (30 May 2026)

```
gamify/
├── backend/                 ← Express + Tesseract.js (local)
├── mobile/                  ← Expo app (main project)
│   ├── app/
│   │   ├── _layout.tsx      ← Root layout (Google Auth redirect handler)
│   │   └── (tabs)/
│   │       ├── _layout.tsx  ← Bottom Tab (5 เมนู)
│   │       ├── index.tsx    ← 🏠 Dashboard (mobile)
│   │       ├── upload.tsx   ← 📸 Upload (3 states: form/verifying/result)
│   │       ├── quests.tsx   ← 📅 Quests (horizontal scroll cards)
│   │       ├── shop.tsx     ← 🛒 Shop (Daily+Weekly reset)
│   │       └── profile.tsx  ← 👤 Profile (+Calendar+Edit+Weight+Height)
│   │
│   ├── components/
│   │   ├── CoinCard, StreakBanner, ActivityCard, EmptyState, Toast
│   │   ├── DesktopDashboard.tsx  ← Desktop dashboard (BMR + stats)
│   │   ├── DesktopProfile.tsx    ← Desktop profile (+Calendar+Edit+Weight)
│   │   ├── DesktopUpload.tsx     ← Desktop upload (form/result)
│   │   ├── DesktopQuest.tsx      ← Desktop quests (grid layout)
│   │   └── DesktopShop.tsx       ← Desktop shop
│   │
│   ├── services/
│   │   ├── api.ts           ← Axios → Backend :3456
│   │   ├── antiCheat.ts     ← Anti-cheat v2 (8 detection layers)
│   │   └── auth.ts          ← Google OAuth (redirectUri = Vercel URL)
│   │
│   ├── store/
│   │   └── useStore.ts      ← Zustand + AsyncStorage persist
│   │
│   ├── theme/
│   │   ├── colors.ts        ← Apple Design System colors
│   │   ├── breakpoints.ts, spacing.ts, radius.ts
│   │
│   └── hooks/
│       └── useResponsive.ts ← isDesktop/isMobile
```

---

## 4. Auth System

- **Client ID:** `97346646198-q5ac252sm37cjsquugbdav0bbpb2u13b.apps.googleusercontent.com`
- **redirectUri (web):** `https://fitquest-web-two.vercel.app/`
- **redirectUri (mobile):** `https://auth.expo.io/@flarezzz/fitquest`
- Platform check: `Platform.OS === "web"` → ใช้ redirect เต็มหน้า
- มือถือ → ใช้ `expo-web-browser` + `openAuthSessionAsync`
- หลัง Auth → URL มี `#access_token=...` → `useStore.hydrate()` อ่าน token

---

## 5. Calendar (Activity Calendar)

- อยู่ใน `profile.tsx` (mobile) และ `DesktopProfile.tsx` (desktop)
- แสดงเดือนปัจจุบัน
- **วันที่มีออกกำลังกาย → กรอบสีเขียว** (border: 2px, color: colors.success #30d158)
- **วันนี้ที่ยังไม่ออกกำลังกาย → กรอบบางสีขาวโปร่งแสง**
- เลขวันสีเขียว ถ้ามีออกกำลังกาย
- เปลี่ยนจากติ๊กถูก ✅ มาเป็นกรอบสีเขียว

---

## 6. 3-State Pattern (Upload page)

```
Form → กดส่ง → Verifying (full screen loading) → Result (ผ่าน/ไม่ผ่าน)
```

**Result screen แสดง:**
- ✅ ผ่าน → +coins + 🎉
- 📝 **กิจกรรมที่บันทึก** — emoji + name + duration + distance + calories
- 📅 **ความคืบหน้าเควส** — เควสไหนที่ progress / ทำสำเร็จแล้ว
- 🛡️ Fraud Score + Risk Level + Streak Bonus
- 📸 **ประวัติล่าสุด** — square image grid (aspectRatio: 1, 3 columns)

---

## 7. Calorie Auto-Calculate

- **สูตร:** MET-based + distance-based
- cardio: 8 MET / ถ้ามีระยะทาง → `0.75 × weight × distance(km)`
- weights: 5 MET
- walk: 3.5 MET / ถ้ามีระยะทาง → `0.75 × weight × distance(km)`
- yoga: 3 MET
- ขั้นต่ำ 50 kcal
- ใช้น้ำหนักจาก profile (default 65 kg)
- **Auto-calc ทุกครั้งที่เปลี่ยน activity/duration/distance**
- ถ้า user **แก้แคลอรีเอง** → ระบบหยุด auto-calc จนกว่าจะเปลี่ยน activity

---

## 8. BMR / BMI / Recommend

- **BMR (Mifflin-St Jeor, female):** `10w + 6.25h - 5*25 - 161`
- **BMI:** `weight / (height/100)^2`
- **แนะนำ kcal/วัน:** `BMR × 1.375` (light activity TDEE)
- แสดงใน Dashboard (index.tsx + DesktopDashboard.tsx)
- **First-time setup:** เมื่อล็อกอินครั้งแรก → modal ถามน้ำหนัก/ส่วนสูง
- สามารถแก้ไขได้ที่หน้า Profile

---

## 9. Quest Stacking System

เปลี่ยนจากนับครั้งเป็น **สะสมเวลา/ระยะทาง**:

| เควส | ระบบใหม่ (สะสม) |
|------|-----------------|
| 🏃‍♂️ คาร์ดิโอ 20 นาที | สะสมนาที cardio → 20/20 |
| 🧘 ยืดกล้าม 10 นาที | สะสมนาที yoga → 10/10 |
| 🚶 เดิน 5,000 ก้าว | distance(km) × 1312 → steps |
| 🔥 เผาผลาญ 2,000 kcal | สะสม calories จากทุกกิจกรรม |
| 🏃 คาร์ดิโอครบ 3 ครั้ง | นับครั้ง cardio |
| 🎯 ครบทุกประเภท | unique activityIds |
| 🏋️ เข้ายิมครบ 4 วัน | unique dates |

**Stacking logic:** ทำคาร์ดิโอ 40 นาที → สะสมให้ทุกเควสประเภท cardio พร้อมกัน
- Reset รายวัน: ตี 5 (22:00 UTC+7)
- Reset รายสัปดาห์: จันทร์ 5 โมงเย็น
- clear questProgress d_* ทุกครั้งที่ daily reset

---

## 10. Anti-Cheat v2 (8 Layers)

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

## 11. State Management (Zustand)

- **zustand store** + persistance via `AsyncStorage`
- `subscribe` auto-save ทุก state change
- User key: `fitquest_v3_${user.id}`
- **Profile (UserProfile):** `{ weight: number, height: number }`
- **WorkoutLogEntry fields:** date, activity, activityId, duration, distance, calories, coins, bonus, verified, imageUri, fraudScore, riskLevel
- **Quest progress:** `Record<string, number>` (key = quest id → accumulated value)
- Desktop & Mobile components แยกกัน แต่ใช้ store เดียวกัน

---

## 12. UI/UX Features

- ✅ **EmptyState component** พร้อมใช้
- ✅ **Toast system** (ToastProvider + useToast)
- ✅ **Haptic** (Vibration.vibrate 50ms ตอน claim quest)
- ✅ **Loading screen** (ActivityIndicator)
- ✅ **Calendar green border** (แทน checkmark)
- ✅ **Auto-calculate calories**
- ✅ **BMR/BMI display**
- ✅ **First-time weight/height setup modal**
- ✅ **Quest stacking system**
- ✅ **Result screen → activity info + quest progress**
- ✅ **Horizontal quest cards (mobile)**
- ❌ Cloud Sync (ยัง AsyncStorage-only)
- ❌ Logout function
- ❌ Backend deploy (local เท่านั้น)

---

## 13. Debugging Checklist

ก่อนแก้:
1. อ่าน `context.md` ก่อน
2. `grep -n` หาตำแหน่งที่ต้องแก้
3. `read` เฉพาะ section นั้น
4. `edit` เฉพาะส่วนที่เปลี่ยน
5. `npx tsc --noEmit` verify
6. `git add`, `git commit`, `git push`
7. รอ Vercel build

---

## 14. Golden Rule

> “ระบบนี้ต้องขยายได้ ไม่ใช่แค่ใช้งานได้”

ทุกการแก้ต้อง:
- maintainable
- scalable
- predictable
