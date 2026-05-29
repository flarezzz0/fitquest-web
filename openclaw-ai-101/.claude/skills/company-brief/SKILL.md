# Skill: company-brief

## Trigger
เมื่อชิพิมพ์ `/brief TICKER` หรือ "brief TICKER" หรือ "สรุปหุ้น TICKER"

## ขั้นตอนการทำ

1. **ค้นหาข้อมูล**
   - ใช้ web_search หาข้อมูลล่าสุดเกี่ยวกับ TICKER
   - หา earnings recent, news 7 วัน, financial highlights

2. **สร้าง Brief ตาม template นี้:**

```
# [TICKER] Brief

**Ticker:** [TICKER] (NASDAQ)  
**Date:** [วันที่ปัจจุบัน]

## หุ้นทำอะไร
[2-3 ประโยคสรุป core business]

## Q[ล่าสุด] Earnings (วันที่)
| Metric | Value | YoY |
|--------|-------|-----|
| Revenue | $X | +X% |
| [Segment] | $X | +X% |
| Net Income | $X | +X% |
| EPS | $X | - |

**Highlight:** [สิ่งที่น่าสนใจที่สุดจาก earnings]

## ข่าว 7 วันล่าสุด
1. [ข่าวที่ 1]
2. [ข่าวที่ 2]
3. [ข่าวที่ 3]
4. [ข่าวที่ 4]
5. [ข่าวที่ 5]

## Bull Case 🐂
- [Bull point 1]
- [Bull point 2]
- [Bull point 3]

## Bear Case 🐻
- [Bear point 1]
- [Bear point 2]
- [Bear point 3]

## คำถามก่อนซื้อ
1. [คำถามที่ 1]
2. [คำถามที่ 2]
3. [คำถามที่ 3]
4. [คำถามที่ 4]
5. [คำถามที่ 5]

---

## Debt Check ⚠️
[ถ้า debt/equity สูงกว่า 2 หรือ debt > 50% ของ total capital ให้เตือนชิว่า "หุ้นตัวนี้มี debt สูง เธอเคยบอกว่าไม่ซื้อหุ้น debt สูง ยังไงก็ระวังนะ"]

## vs S&P 500
[เปรียบเทียบง่ายๆ ว่าหุ้นตัวนี้มี growth potential ดีกว่า S&P 500 ยังไง และมี risk อะไรที่ S&P 500 ไม่มี]
```

3. **บันทึกไฟล์**
   - บันทึกลง `openclaw-ai-101/briefs/[TICKER].md`

4. **ส่ง brief ให้ชิ**
   - ส่งใน conversation ปัจจุบัน
   - แจ้งว่าบันทึกไว้ที่ไหน

## Investor Voice (จาก MEMORY.md)
- ชิ DCA S&P 500 อยู่แล้ว รู้สึกสบายใจ
- อยากลองหุ้นเดี่ยวที่มี growth potential สูงกว่า S&P 500
- **ไม่เคยซื้อ:** หุ้นที่มี debt สูงมากๆ
- เน้นๆ ไม่ซีเรียส แต่อยากรู้ว่าต่างจาก S&P 500 ยังไง

## Output
บันทึกไฟล์ + ส่ง brief ใน conversation