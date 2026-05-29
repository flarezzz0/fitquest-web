---
name: aicode101
description: "Systematic AI coding workflow — project rules, component isolation, screenshot review, browser testing, think-before-code, design tokens, error memory, and incremental fixes."
allowed-tools:
  - exec
  - read
  - write
  - edit
  - browser
  - image
  - process
user-invocable: false
---

# AI Code 101 — สิ่งที่ควรเพิ่มเพื่อให้ AI ตัวเดียวฉลาดขึ้นจริง

AI ฉลาดไม่ได้มาจาก model อย่างเดียว แต่มาจาก workflow, memory, constraints, feedback loop, browser verification, และ context management

พอมีครบ AI ตัวเดียวก็เริ่มเก่งขึ้นเยอะ

---

## Core Rules

```txt
Rules:
- ห้ามแก้หลายหน้าในครั้งเดียว
- ห้ามเปลี่ยน architecture ทั้งระบบ
- แก้ทีละ component
- ต้อง review ก่อน commit
- ต้อง browser test ทุกครั้ง
- incremental changes เท่านั้น
- surgical fixes
- isolated refactor
- ห้าม rewrite ทั้ง project
- ใช้ design tokens เสมอ — ห้าม hardcode สี/spacing
```

---

## Workflow

### Phase 1: Think Before Code ⚠️

ก่อนแก้ทุกครั้ง:
1. วิเคราะห์ปัญหา
2. อธิบายสาเหตุ
3. เสนอแผน
4. ค่อยแก้

### Phase 2: Project Context

อ่าน `PROJECT_RULES.md` ทุกครั้งก่อนเริ่มงาน — ใช้เป็น ground truth สำหรับ:
- design philosophy
- responsive strategy
- coding style
- layout rules
- UI goals

### Phase 3: Component Isolation 🧩

แก้ทีละ component เท่านั้น ไม่ใช่ทั้งหน้า

โครงสร้างที่ควรมี:
```
components/
  Dashboard/
  Calendar/
  Reward/
  Quest/
```

### Phase 4: Screenshot Review 📸

ทุกครั้งหลังแก้:
1. เปิดเว็บ
2. ถ่าย screenshot (browser screenshot)
3. วิเคราะห์ UI จากภาพจริง
4. อ่าน browser console error ทุกครั้ง (hydration error, CSS conflict, undefined state)

### Phase 5: Error Memory 🚨

ตรวจสอบ Known Issues ก่อนแก้เสมอ:
```txt
Known Issues:
- desktop ใช้ mobile spacing
- heatmap overflow
- tab bar ซ้อน content
```

เมื่อเจอ bug ใหม่ ให้บันทึกเพิ่มใน Known Issues

### Phase 6: Auto Screenshot Compare 🔥

- ถ่าย screenshot ก่อนแก้
- ถ่าย screenshot หลังแก้
- เปรียบเทียบ difference

### Phase 7: Design Token System 🎨

ใช้ design tokens เสมอ:
```
theme/
  colors.ts
  spacing.ts
  radius.ts
  typography.ts
```

ห้าม hardcode สีหรือ spacing โดยเด็ดขาด

---

## Priority Checklist (Top 5 Impact)

- [ ] PROJECT_RULES.md — มี context ถาวร
- [ ] Browser Testing — test ทุกครั้ง
- [ ] Screenshot Review — ดู UI จริง
- [ ] Think Before Code — วางแผนก่อนแก้
- [ ] Component Isolation — แก้ทีละชิ้น

---

## Ultimate Philosophy

AI ฉลาด = workflow + memory + constraints + feedback loop + verification + context management

ไม่ใช่แค่ model ใหญ่ แต่คือระบบที่ดี
