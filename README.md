# Preclinic Frontend Training

مشروع تدريب Frontend لبناء **Doctor Dashboard**.

الـBackend جاهز. مهمتك بناء الواجهة والتكامل مع الـAPI.

لا تعدّل مجلد `src/mocks/`.

---

## التشغيل

```bash
npm install
npm run dev
```

ثم افتح `http://localhost:5173`.

الصفحة الافتراضية هي **Login**. الصفحات المحمية لا تُفتح إلا بعد تسجيل الدخول.

اختبر الـAPI من React، أو من Console والمتصفح مفتوح على المشروع. Postman لن يراها؛ الـAPI تعمل داخل المتصفح مع التطبيق.

---

## مهمتك

الصفحات جاهزة كمسارات فقط. **لا يوجد integration على أي صفحة.**

ابنِ الواجهة، اربط كل صفحة بالـAPI من `src/api`، وتعامل مع الحالات بنفسك.

بعد Login ناجح، احفظ الجلسة عبر `signIn` من `useAuth`. بدون ذلك `ProtectedRoute` لن يفتح الداشبورد.

العقد: [`docs/API.md`](docs/API.md).

---

## حسابات التجربة

| Role | Email | Password |
| --- | --- | --- |
| Doctor | `ahmed.hassan@preclinic.test` | `Doctor@123` |
| Patient | `layla.omar@preclinic.test` | `Patient@123` |

باقي الأطباء يستخدمون نفس الباسورد: `Doctor@123`.

---

## Protected Routes

المشروع فيه حماية للصفحات. الفكرة بسيطة:

```text
بدون token
  /login و /register متاحان
  أي صفحة داخل الداشبورد → تحويل إلى /login

بعد Login (وجود accessToken)
  /dashboard والصفحات المحمية متاحة
  /login أو /register → تحويل إلى /dashboard
```

هذا مطبّق في:

| الملف | الدور |
| --- | --- |
| `src/auth/AuthProvider.jsx` | حالة الجلسة: `isAuthenticated`, `signIn`, `signOut` |
| `src/auth/ProtectedRoute.jsx` | يمنع دخول الصفحات المحمية بدون token |
| `src/auth/PublicRoute.jsx` | يمنع فتح Login/Register لو المستخدم داخل بالفعل |
| `src/App.jsx` | تعريف المسارات |

الصفحات المحمية حاليًا داخل `ProtectedRoute` + `MainLayout`:

```text
/dashboard
/patients
/appointments
/settings
```

لما تضيف صفحة جديدة للداشبورد، ضعها داخل نفس المجموعة في `src/App.jsx`. لا تضعها خارج `ProtectedRoute`.

Logout يمسح الجلسة ويعيدك إلى `/login`.  
لو الـAPI رجّعت `401` على طلب محمي، الجلسة تُمسح ويتم التحويل إلى Login.

---

## كيف تستخدم الـAPI

الدوال الجاهزة في `src/api`. استورد منها واستدعِ الـendpoint.

```js
import { login, getDoctorDashboard } from "../api";
```

شكل الاستجابة ثابت: `{ success, data }` وفي القوائم يوجد `meta`.  
تفاصيل كل endpoint موجودة في [`docs/API.md`](docs/API.md).

`src/api/axios.js` يرسل `Authorization` تلقائيًا إذا وُجد `accessToken` في `localStorage`.  
استخدم `localStorage` للجلسة فقط (`accessToken` / `currentUser`)، وليس كقاعدة بيانات.

---

## المجلدات

```text
src/api/          ← استورد من هنا
src/auth/         ← حماية المسارات والجلسة
src/pages/        ← الشاشات
src/components/   ← المكوّنات
src/mocks/        ← لا تلمسه
docs/API.md       ← عقد الـAPI
```

---

## أوامر

```bash
npm run dev
npm run build
npm run preview
```

لو اختلطت البيانات أثناء التجربة: `POST /api/training/reset-db`.
