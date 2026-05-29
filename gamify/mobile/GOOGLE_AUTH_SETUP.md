# Google Login Setup Instructions

## ขั้นตอนที่ 1: สร้าง Google Cloud Project
1. ไปที่ https://console.cloud.google.com
2. กด Select a project → New Project
3. ตั้งชื่อ เช่น "FitQuest"
4. กด Create

## ขั้นตอนที่ 2: เปิดใช้งาน OAuth consent screen
1. ไปที่ APIs & Services → OAuth consent screen
2. เลือก External → Create
3. กรอก App name: FitQuest, User support email: (อีเมลตัวเอง)
4. Developer contact: (อีเมลตัวเอง)
5. Save and Continue
6. ข้าม Scopes (กด Save)
7. ข้าม Test users (กด Save)
8. กลับมา Dashboard

## ขั้นตอนที่ 3: สร้าง Credentials
1. ไปที่ Credentials → Create Credentials → OAuth client ID
2. Application type: Web application
3. Name: FitQuest Web
4. **Authorized redirect URIs** → Add URI:
5. พิมพ์: `http://localhost:8081`
6. กด Create
7. **คัดลอก Client ID ที่ได้** → เอามาใส่ใน `services/auth.ts` บรรทัด:
```ts
const WEB_CLIENT_ID = "YOUR_CLIENT_ID_HERE";
```

## ทดสอบ
1. `npx expo start`
2. เปิด Chrome → Profile → กด "เชื่อมต่อกับ Google" 
3. หน้า Login จะเด้งขึ้นมา
4. เข้าสู่ระบบ → ข้อมูลจะถูกบันทึกใน localStorage (Mac)
