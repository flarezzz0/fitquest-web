---
name: multi-account-state-management
description: "Multi-Account State Management with Zustand + AsyncStorage — ป้องกันข้อมูลรั่วไหล/ทับซ้อนระหว่างบัญชี Google"
allowed-tools:
  - read
  - write
  - edit
  - exec
user-invocable: false
---

# SKILL: Multi-Account State Management (Zustand + AsyncStorage)

## Context & AI Guidelines

การจัดการระบบหลายบัญชี (Multi-Account) เพื่อป้องกันปัญหาข้อมูลรั่วไหลหรือทับซ้อน (Data Bleeding) ต้องคำนึงถึงโครงสร้างที่ยั่งยืน เพื่อไม่ให้เกิดบั๊กที่ต้องตามแก้ในอนาคต

---

## Core Principles

### ✅ สิ่งที่ควรทำ (DOs — Root Cause Solutions)

| หลักการ | คำอธิบาย | เหตุผล |
|---------|---------|--------|
| **Dynamic Storage Keys** | แยก Key ของ `AsyncStorage` ตาม `user.id` เสมอ (เช่น `app_v1_${user.id}`) | สร้าง Data Isolation — ข้อมูลแต่ละบัญชีแยกกล่องกัน ป้องกันการเขียนทับ |
| **Track Session** | บันทึก `last_login_id` แยกต่างหาก | Hydrate ตอนเปิดแอปจะได้รู้ว่าควรดึงข้อมูลของใครมาแสดง |
| **Soft Reset UI** | Logout → รีเซ็ตเฉพาะ State ใน Zustand (RAM) | เคลียร์หน้าจอ โดยไม่ลบไฟล์เซฟใน AsyncStorage |

### ❌ สิ่งที่ไม่ควรทำ (DON'Ts — Prevent Future Bugs)

| ข้อห้าม | ผลเสีย |
|---------|--------|
| **ห้ามใช้ Static Key** (เช่น `app_data`) | บัญชี B เขียนทับข้อมูลบัญชี A ทันที → ประวัติ A สูญหายถาวร |
| **ห้ามล้างเครื่องตอน Logout** (`AsyncStorage.clear()`, `clearAllData()`) | ทำลายประวัติการสะสมเหรียญของทุกคนในเครื่อง |
| **ห้าม Overwrite Custom Data** (เอาชื่อ Google มาทับชื่อที่ผู้ใช้แก้) | ผู้ใช้โมโหที่แก้ชื่อแล้วหายทุกครั้งที่ล็อกอิน |

### 🔁 สิ่งที่ควรทำซ้ำเป็นมาตรฐาน (Repeatable Patterns)

- ตรวจสอบ `user?.id` ทุกครั้งก่อน `AsyncStorage.setItem` — ถ้าไม่มี ID ให้ **ข้าม** บันทึก
- ใช้ `fitquest_v3_${user.id}` เป็น key pattern
- ใช้ `fitquest_last_login` จำ session

---

## Code Implementation

### 1. setUser — Login / Logout

```typescript
setUser: async (u) => {
  const resetData = {
    coins: 0, totalCoinsEarned: 0, streak: 0, longestStreak: 0,
    totalWorkouts: 0, todayCount: 0, weekCount: 0, level: 1,
    workoutLog: [], questProgress: {}, questClaimed: [], shopBought: [],
  };

  // Logout: เคลียร์ UI เท่านั้น ไม่ลบ AsyncStorage
  if (!u) return set({ user: null, ...resetData });

  // Login: โหลดข้อมูลเก่าของบัญชีนี้ หรือถ้าเป็นบัญชีใหม่ → เริ่มค่าว่าง
  const raw = await AsyncStorage.getItem(`fitquest_v3_${u.id}`);
  set(raw
    ? { ...JSON.parse(raw), user: u }
    : { user: u, ...resetData }
  );
}
```

### 2. Hydrate — กู้คืนข้อมูลตอนเปิดแอป

```typescript
hydrate: async () => {
  try {
    const lastUserId = await AsyncStorage.getItem("fitquest_last_login");
    if (lastUserId) {
      const raw = await AsyncStorage.getItem(`fitquest_v3_${lastUserId}`);
      if (raw) return set({ ...JSON.parse(raw), _hydrated: true });
    }
    set({ _hydrated: true }); // ไม่เคยล็อกอิน หรือไม่มีข้อมูล
  } catch {
    set({ _hydrated: true });
  }
}
```

### 3. Subscribe — Auto-save แยกตามบัญชี

```typescript
useStore.subscribe((state) => {
  const { _hydrated, backendAvailable, user, ...data } = state;

  if (user?.id) {
    // เซฟข้อมูลแยกตาม ID + จำคนล่าสุด
    AsyncStorage.setItem(`fitquest_v3_${user.id}`, JSON.stringify({ user, ...data })).catch(() => {});
    AsyncStorage.setItem("fitquest_last_login", user.id).catch(() => {});
  } else {
    // Logout → ลบประวัติคนล่าสุด (ไม่ลบข้อมูลบัญชี)
    AsyncStorage.removeItem("fitquest_last_login").catch(() => {});
  }
});
```

---

## Data Flow Diagram

```
OPEN APP
  └─ hydrate()
       └─ อ่าน fitquest_last_login
            ├─ มี → โหลด fitquest_v3_USERID → set state
            └─ ไม่มี (หรือไม่เจอ) → หน้าว่าง

LOGIN GOOGLE
  └─ setUser(user)
       ├─ อ่าน fitquest_v3_USERID
       │    ├─ มี → set state จากไฟล์เก่า
       │    └─ ไม่มี → resetData + set user
       └─ subscribe ทำงาน → save + set fitquest_last_login

LOG OUT
  └─ setUser(null)
       └─ set state → resetData (เคลียร์ UI)
       └─ subscribe ทำงาน → ลบ fitquest_last_login
                            (ไม่ลบ fitquest_v3_USERID)

EDIT PROFILE
  └─ setUser({ ...user, name: customName, bio: customBio })
       └─ subscribe ทำงาน → save ทับ fitquest_v3_USERID
```

---

## ข้อควรระวัง (Warnings)

### ⚠️ clearAllData() — ห้ามเรียกตอน Logout!

```typescript
// ❌ ผิด — ลบข้อมูลทุกบัญชีในเครื่อง
clearAllData();

// ✅ ถูก — setUser(null) เคลียร์ UI อย่างเดียว ไม่แตะ AsyncStorage
setUser(null);
```

### ⚠️ Overwrite Custom Data

```typescript
// ❌ ผิด — Google name มาทับชื่อที่ผู้ใช้แก้ไข
setUser(result.user);

// ✅ ถูก — เก็บ custom name/bio ไว้
setUser({ ...result.user, name: user?.name || result.user.name, bio: user?.bio });
```

### ⚠️ Guest Save

```typescript
// ❌ ผิด — user.id เป็น undefined → สร้างไฟล์ขยะ
AsyncStorage.setItem(`fitquest_v3_${user.id}`, ...);

// ✅ ถูก — เช็ค user?.id ก่อน
if (user?.id) {
  AsyncStorage.setItem(`fitquest_v3_${user.id}`, ...);
}
```

---

## UI Integration

### Upload Page — ต้อง Login ก่อน

```typescript
const { user } = useStore();

const submit = async () => {
  if (!user) { Alert.alert("🔒", "กรุณาล็อกอินก่อน"); return; }
  // ...
}
```

### Profile Page — ซ่อนข้อมูลตอน Logout

```tsx
{user ? (
  <> {/* Stats, Calendar, Badges, History */} </>
) : (
  <View style={{ padding: 40, alignItems: "center" }}>
    <Text style={{ fontSize: 16, color: colors.textDim }}>
      🔒 กรุณาล็อกอินเพื่อดูข้อมูลและประวัติของคุณ
    </Text>
  </View>
)}
```

---

## Key Names (Convention)

| Key | ใช้สำหรับ |
|-----|---------|
| `fitquest_v3_${user.id}` | ข้อมูล state ของแต่ละบัญชี (coins, quests, logs, ฯลฯ) |
| `fitquest_last_login` | จำ user.id คนล่าสุดที่ล็อกอิน |
