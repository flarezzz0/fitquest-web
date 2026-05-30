# context.md — FitQuest 🎮📱

## 1. Project Overview

FitQuest คือ Fitness Gamification System ที่:
- อัปโหลดกิจกรรมออกกำลังกายพร้อมหลักฐานรูป (📸)
- คำนวณแคลอรีอัตโนมัติตาม MET dynamic + pace + น้ำหนัก
- รับการตรวจจาก AI (OCR Tesseract.js + Anti-cheat)
- ได้เหรียญ 🪙 สะสม XP, ทำเควสรายวัน/รายสัปดาห์
- มีระบบ Streak 🔥, Calendar กรอบเขียว, BMR/BMI/TDEE, Shop
- **Cloud Sync** กับ Supabase (user, workout_logs, quest_progress)

### Deploy
- **Web:** https://fitquest-web-two.vercel.app
- **GitHub:** https://github.com/flarezzz0/fitquest-web

### Stack ปัจจุบัน
- **Frontend:** Expo SDK 54 + React Native 0.81.5 + expo-router v6
- **Platform:** Web (Vercel) + Mobile (Expo Go)
- **Cloud DB:** Supabase (PostgreSQL)
- **Backend:** Node.js + Express + Tesseract.js OCR (local only — ยังไม่ deploy)
- **State:** Zustand + AsyncStorage + **Supabase sync**
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
│   │       ├── index.tsx    ← 🏠 Dashboard (+BMR/TDEE + calorie progress bar)
│   │       ├── upload.tsx   ← 📸 Upload (6 activities, MET dynamic, conditional distance)
│   │       ├── quests.tsx   ← 📅 Quests (horizontal scroll compact cards)
│   │       ├── shop.tsx     ← 🛒 Shop (Daily+Weekly reset)
│   │       └── profile.tsx  ← 👤 Profile (+Calendar+Edit+Weight+Height)
│   │
│   ├── components/
│   │   ├── CoinCard, StreakBanner, ActivityCard, EmptyState, Toast
│   │   ├── DesktopDashboard.tsx  ← Desktop dashboard (+BMR/TDEE + calorie bar)
│   │   ├── DesktopProfile.tsx    ← Desktop profile (+Calendar+Edit+Weight)
│   │   ├── DesktopUpload.tsx     ← Desktop upload (form/result, 6 activities)
│   │   ├── DesktopQuest.tsx      ← Desktop quests (grid layout)
│   │   └── DesktopShop.tsx       ← Desktop shop
│   │
│   ├── services/
│   │   ├── api.ts           ← Axios → Backend :3456 (skip on web, Promise.reject)
│   │   ├── supabase.ts      ← Supabase client (URL + anon key จาก .env)
│   │   ├── antiCheat.ts     ← Anti-cheat v2 (8 detection layers)
│   │   └── auth.ts          ← Google OAuth (redirectUri = Vercel URL)
│   │
│   ├── store/
│   │   └── useStore.ts      ← Zustand + AsyncStorage + Cloud Sync
│   │
│   ├── theme/
│   │   ├── colors.ts        ← Apple Design System colors
│   │   ├── breakpoints.ts, spacing.ts, radius.ts
│   │
│   ├── hooks/
│   │   └── useResponsive.ts ← isDesktop/isMobile
│   │
│   ├── .env                 ← EXPO_PUBLIC_SUPABASE_URL + ANON_KEY
│   ├── vercel.json          ← SPA rewrites (/(.*) → /index.html)
│   └── supabase-schema.sql  ← Migration script for Supabase tables
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
- 📅 **ความคืบหน้าเควส** — เควสไหน progress / ทำสำเร็จแล้ว
- 🛡️ Fraud Score + Risk Level + Streak Bonus
- 📸 **ประวัติล่าสุด** — square image grid (aspectRatio: 1, 3 columns)

---

## 7. Calorie Auto-Calculate (2024 Compendium MET)

### สูตร
```
cal = (MET × 3.5 × weight × duration_min) / 200
if (cardio/walk + distance): cal += 0.75 × weight × distance_km
```

### MET ต่อกิจกรรม
| กิจกรรม | เงื่อนไข pace | MET |
|---------|--------------|:---:|
| 🏃 **Cardio** | pace ≤ 5 min/km | 11.0 |
| | pace 5–7 min/km | 8.3 |
| | pace > 7 min/km | 6.0 |
| | ไม่มี distance | 8.0 |
| 🚶 **Walk** | pace ≥ 15 min/km | 2.5 |
| | pace 12–15 min/km | 3.5 |
| | pace < 12 min/km | 4.3 |
| | ไม่มี distance | 3.5 |
| 🏋️ **Weights** | — | 5.0 |
| 💥 **HIIT** | — | 8.0 |
| 🏊 **Swim** | — | 6.0 |
| 🧘 **Yoga** | — | 3.0 |

### เงื่อนไขอื่น
- ขั้นต่ำ 50 kcal เสมอ
- ใช้น้ำหนักจาก profile (default 65 kg)
- **Auto-calc** เมื่อ activity/duration/distance เปลี่ยน
- ถ้า user **แก้แคลอรีเอง** → หยุด auto-calc จนกว่าจะเปลี่ยน activity
- **Distance field** แสดงเฉพาะ cardio/walk

---

## 8. BMR / BMI / TDEE

### Dashboard (mobile + desktop)
Compact layout — BMR | BMI | TDEE ในแถวเดียว
ด้านล่างมี **Calorie Progress Bar**:
- เป้าหมาย = TDEE (BMR × 1.375)
- ค่าปัจจุบัน = ผลรวม calories วันนี้จาก workoutLog
- 🔥 420 / 1,840 kcal
- **สีตาม %:**
  - < 25% → เทา `#8e8e93` — น้อย
  - 25–60% → เขียว `#30d158` — กำลังดี
  - 60–85% → ส้ม `#ff9f0a` — ใกล้ครบ
  - > 85% → แดง `#ff453a` — เกินเป้าหมาย

### สูตร
- **BMR (Mifflin-St Jeor, female):** `10w + 6.25h - 5×25 - 161`
- **BMI:** `weight / (height/100)²`
- **TDEE:** `BMR × 1.375`

### First-time setup
เมื่อล็อกอินครั้งแรก → modal ถามน้ำหนัก/ส่วนสูง
แก้ไขภายหลังได้ที่หน้า Profile

---

## 9. Quest Stacking System

เปลี่ยนจากนับครั้งเป็น **สะสมเวลา/ระยะทาง**:

| เควส | ระบบ (สะสม) |
|------|-------------|
| 🏃‍♂️ คาร์ดิโอ 20 นาที | สะสมนาที cardio → 20/20 |
| 🧘 ยืดกล้าม 10 นาที | สะสมนาที yoga → 10/10 |
| 🚶 เดิน 5,000 ก้าว | distance(km) × 1312 → steps |
| 🔥 เผาผลาญ 2,000 kcal | สะสม calories จากทุกกิจกรรม |
| 🏃 คาร์ดิโอครบ 3 ครั้ง | นับครั้ง cardio |
| 🎯 ครบทุกประเภท | unique activityIds (รวม hiit/swim) |
| 🏋️ เข้ายิมครบ 4 วัน | unique dates |

**Stacking logic:** ทำ cardio 40 นาที → สะสมทุกเควสพร้อมกัน
- Daily reset: ตี 5 (22:00 UTC+7), clear d_* questProgress
- Weekly reset: จันทร์ 5 โมงเย็น

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

## 11. Cloud Sync (Supabase)

### Tables
```sql
users           — id, email, name, picture, coins, streak, weight, height, ...
workout_logs    — user_id, date, activity, duration, distance, calories, ...
quest_progress  — user_id, quest_id, progress
```

### Sync points
| Action | Local | Cloud |
|--------|-------|-------|
| setUser | load AsyncStorage | upsert users, ใช้ Math.max() |
| addWorkout | stacking logic | insert workout_logs + update users |
| addCoins | increment | increment_coins() RPC |
| spendCoins | decrement | update users.coins |
| setProfile | set weight/height | update users.weight/height |
| clearAllData | reset state (keep user) | update users → 0 |
| addCoins sync | — | increment_coins RPC (ป้องกัน race) |

### Conflict resolution
| field | Strategy |
|-------|----------|
| streak, totalWorkouts, level, totalCoinsEarned | `Math.max(local, cloud)` — monotonically increase |
| coins | `cloud wins` — ลดได้ (ซื้อของ) |
| weight, height | cloud ต่อ local |

---

## 12. Vercel Config

`vercel.json` at mobile root:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
**ต้องมี Env Vars:** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 13. State Management (Zustand)

- **zustand store** + persistance via `AsyncStorage`
- `subscribe` auto-save ทุก state change
- User key: `fitquest_v3_${user.id}`
- Desktop & Mobile components แยกกัน แต่ใช้ store เดียวกัน

---

## 14. UI/UX Features

- ✅ EmptyState component
- ✅ Toast system (ToastProvider + useToast)
- ✅ Haptic (Vibration.vibrate 50ms)
- ✅ Calendar green border
- ✅ Calorie auto-calc (MET dynamic)
- ✅ BMR/BMI/TDEE + Calorie progress bar
- ✅ First-time weight/height setup modal
- ✅ Quest stacking system
- ✅ Result screen → activity info + quest progress
- ✅ Horizontal quest cards (mobile)
- ✅ **Supabase Cloud Sync** ✅
- ✅ vercel.json SPA routing
- ✅ clearAllData (ไม่เด้งออก)
- ❌ Logout function
- ❌ Backend deploy (local เท่านั้น)

---

## 15. Debugging Checklist

ก่อนแก้:
1. อ่าน `context.md` ก่อน
2. `grep -n` หาตำแหน่งที่ต้องแก้
3. `read` เฉพาะ section นั้น
4. `edit` เฉพาะส่วนที่เปลี่ยน
5. `npx tsc --noEmit` verify
6. `git add`, `git commit`, `git push`
7. รอ Vercel build

---

## 16. Golden Rule

> “ระบบนี้ต้องขยายได้ ไม่ใช่แค่ใช้งานได้”

ทุกการแก้ต้อง:
- maintainable
- scalable
- predictable
