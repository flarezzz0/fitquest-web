# OpenCLAW AI 101

**สร้าง `/brief TICKER` บน OpenClaw เครื่องมือสรุปหุ้นที่ใช้ได้จริง ในประมาณ 60-90 นาที**

Version 0.1 | สร้างจาก LTD AI 101 โดย Paint ปรับเป็น OpenClaw โดย มีนา 🦐

---

## BIG IDEA

ถ้าชิเข้าใจ 4 พื้นฐาน (agents, sessions, memory, tools) ชิสร้างเครื่องมือช่วยงานของตัวเองได้โดยไม่ต้องเขียน code เลย

OpenClaw มี AI ที่เชื่อมต่อกับชีวิตจริงของชิ (Discord, memory, calendar) ต่างจาก ChatGPT ตรงที่มันจำข้อมูลได้ และทำงานอัตโนมัติได้

---

## สิ่งที่จะได้หลังจบคอร์ส

คอร์สนี้สร้างของชิ้นเดียวกันต่อยอดใน 5 บท:

- **ของชิ้นนั้นคือ `/brief TICKER`** เครื่องมือสรุปหุ้น 1 ตัว (ทำอะไร, ข่าว 7 วันล่าสุด, bull/bear, ถามอะไรก่อนซื้อ)

- **L1** ทำเวอร์ชั่น 0 เป็น prompt ที่บันทึก markdown ลง folder `briefs/`

- **L2** ยกระดับเป็น **skill** (ทักษะที่มีนาจำได้และใช้ซ้ำได้) + ใส่ "เสียงนักลงทุน" ของชิเข้า memory

- **L3** ใส่ earnings transcript เข้ามาเป็น source ที่มีนาใช้เขียน brief จริง (ไม่ปล่อยให้มีนาเดาจาก training data เก่า) + วิธีคุม cost (model picker, token tracking)

- **L4** แตก research ออกเป็น 3 sub-agent ทำงานขนานกัน (fundamentals อ่าน 10-K, earnings อ่าน transcript, news & sentiment ใช้ websearch)

- **L5** สร้าง showcase ด้วย canvas แล้วปิดด้วยภาพรวมว่า OpenClaw ประกอบจากของพวกนี้ยังไง

---

## คอร์สนี้สำหรับใคร

- คนที่อยากเรียนรู้ AI อย่างเป็นระบบ
- คนที่อยากสร้างเครื่องมือช่วยงานของตัวเอง
- นักลงทุน/นักทำคอนเทนต์ที่อยากเริ่มสร้างระบบช่วยตัวเอง

**ไม่ต้องเขียน code เป็นมาก่อน** มีนาเป็นคนทำงานหนักให้ ชิแค่พิมพ์ภาษาคน

---

## โครงสร้างคอร์ส

| Lesson | สิ่งที่จะสร้าง / เพิ่มเข้า `/brief` | เวลา |
|--------|-----------------------------------|------|
| 1 | โปรเจคแรก + memory + `/brief` v0 (prompt, บันทึก briefs/) | ~20-25 นาที |
| 2 | ยก `/brief` เป็น skill + ใส่เสียงนักลงทุนของชิเข้า memory | ~15-20 นาที |
| 3 | ใส่ earnings transcript เป็น source + คุม cost | ~25 นาที |
| 4 | แตก `/brief` เป็น 3 sub-agent ขนาน | ~15 นาที |
| 5 | สร้าง showcase + ภาพรวม OpenClaw | ~15-20 นาที |

---

## วิธีเริ่ม

ใน chat นี้ พิมพ์:

**Start Lesson 1**

มีนาจะอ่าน lesson 1 แล้วเริ่มสอนชิตามบท หยุดรอชิตอบ หยุดรอชิกด แล้วค่อยไปต่อ

จบ lesson 1 แล้วค่อยพิมพ์ `Start Lesson 2`, `Start Lesson 3`, ตามลำดับ

---

## โครงสร้าง folder

```
openclaw-ai-101/
├── README.md (ไฟล์ที่กำลังอ่านอยู่)
├── CLAUDE.md (บทบาทของมีนาตอน guide ชิ)
├── lesson-modules/
│   ├── 1-foundations/CLAUDE.md
│   ├── 2-skill-and-voice/CLAUDE.md
│   ├── 3-earning-and-cost/CLAUDE.md
│   ├── 4-subagents/CLAUDE.md
│   └── 5-deploy-and-recap/CLAUDE.md
├── briefs/ (ไฟล์ brief ที่สร้าง)
└── sources/ (ไฟล์ source ที่ใส่เข้ามา)
```

---

## พร้อมจะเริ่มยัง

ใน chat พิมพ์:

**Start Lesson 1**