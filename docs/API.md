# Preclinic Training API

**Base URL:** `/api`  
**Version:** `2.1.0`  
**Auth:** `Authorization: Bearer <token>`

الدوال الجاهزة في `src/api`. هذا الملف هو العقد: المسار، الـmethod، الصلاحية، والحقول.

الاستجابة العامة: `{ success, data }`. القوائم تضيف `meta`. الخطأ: `{ success, message, errors? }`.

---

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Doctor | `ahmed.hassan@preclinic.test` | `Doctor@123` |
| Patient | `layla.omar@preclinic.test` | `Patient@123` |

---

## Auth

### `POST /auth/login`

بدون auth.

Body: `email`, `password`, `rememberMe?`

### `POST /auth/register`

بدون auth. الافتراضي `role: "doctor"`.

Body: `fullName`, `bio`, `email`, `address`, `lat`, `lng`, `password`, `confirmPassword`, `acceptedTerms`, `departmentId?`

Aliases: `name`, `latitude` / `longitude`, `specialtyId`.

### `POST /auth/forgot-password`

Body: `email`

### `GET /auth/me`

يتطلب auth.

---

## Departments

### `GET /departments`

Alias: `GET /specialties`

---

## Doctors

### `GET /doctors`

بدون auth.

Query: `q`, `departmentId`, `specialtyId`, `status`, `page`, `limit`

### `GET /doctors/:id`

بدون auth. بروفايل الدكتور.

### `PUT /doctors/:id`

Doctor auth. لتعديل بروفايلك فقط.

Alias: `PATCH /doctors/:id`

### `GET /doctors/:id/availability`

Query: `date`, `day`

### `GET /doctors/:id/slots`

Query: `date`

### `GET /doctors/:id/reviews`

Query: `page`, `limit`

---

## Doctor profile

Doctor auth.

### `GET /doctor/profile`

### `PUT /doctor/profile`

Alias: `PATCH /doctor/profile`

Body (اختياري حسب التعديل): `fullName`, `phone`, `email`, `dateOfBirth`, `experienceYears`, `departmentId`, `bio`, `photoUrl`, `address`, `lat`, `lng`, `gender`, `bloodGroup`, `qualifications`, `licenseNumber`, `clinicName`, `availableDays`, `education`, `awards`, `certifications`

`availableDays`: مفاتيح الأيام أو أرقام `dayOfWeek`.  
أو `week: [{ dayOfWeek, from, to, isOff }]`.

`photoUrl` نص. لا يوجد رفع ملفات.

### `PUT /doctor/availability`

نفس حقول الجدول: `availableDays` أو `week`.

---

## Dashboard

Doctor auth.

### `GET /doctor/dashboard`

Query: `date`

### `GET /doctor/popular`

### `GET /doctor/analytics/daily`

Query: `date`

### `GET /doctor/analytics/weekly`

Query: `date`

### `GET /doctor/doctors-status`

### `GET /doctor/reviews`

---

## Appointments

Doctor auth.

### `GET /doctor/appointments`

Query: `q` / `search`, `from` / `startDate`, `to` / `endDate`, `status`, `mode`, `sortBy` (`recent` | `oldest` | `patient`), `page`, `limit`

### `POST /doctor/appointments`

Body: `patientId`, `date`, `time`, `mode?`, `visitType?`, `notes?`

### Status

| Method | Path |
| --- | --- |
| `PUT` | `/doctor/appointments/:id/confirm` |
| `PUT` | `/doctor/appointments/:id/check-in` |
| `PUT` | `/doctor/appointments/:id/check-out` |
| `PUT` | `/doctor/appointments/:id/complete` |
| `PUT` | `/doctor/appointments/:id/cancel` |
| `PUT` | `/doctor/appointments/:id/reschedule` |

Reschedule body: `date`, `time`

`complete` و `check-out` يضبطان `checked_out`.

### Status values

`scheduled` | `confirmed` | `checked_in` | `checked_out` | `cancelled` | `rescheduled`

### Mode values

`in_person` | `online`

الحقول المساعدة في العنصر: `statusLabel`, `modeLabel`, `dateTimeLabel`.

---

## Patients

Doctor auth.

### `GET /patients`

Query: `q` / `search`, `gender`, `page`, `limit`

`meta.totalPatients` هو العدد الكلي.

### `GET /patients/:id`

### `POST /patients`

Body: `fullName`, `email?`, `phone?`, `gender?`, `dateOfBirth?`, `address?`, `photoUrl?`

### `PUT /patients/:id`

---

## Patient booking

Patient auth.

```text
GET  /appointments
POST /appointments
GET  /appointments/:id
```

`POST /appointments` body: `doctorId`, `date`, `time`, `mode?`, `notes?`

---

## Training

```text
GET  /health
POST /training/reset-db
```
