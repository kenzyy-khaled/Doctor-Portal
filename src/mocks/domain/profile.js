import { WEEK_DAYS } from "../utils/dates";

export function applyDoctorUpdates(schema, doctor, user, body) {
  const allowed = [
    "fullName",
    "name",
    "title",
    "bio",
    "clinicName",
    "phone",
    "consultationFee",
    "photoUrl",
    "address",
    "lat",
    "lng",
    "dateOfBirth",
    "experienceYears",
    "qualifications",
    "licenseNumber",
    "bloodGroup",
    "gender",
    "education",
    "awards",
    "certifications",
  ];

  const updates = {};
  allowed.forEach((key) => {
    if (body[key] !== undefined) {
      updates[key === "name" ? "fullName" : key] = body[key];
    }
  });

  if (body.lat !== undefined) updates.lat = Number(body.lat);
  if (body.lng !== undefined) updates.lng = Number(body.lng);
  if (body.latitude !== undefined) updates.lat = Number(body.latitude);
  if (body.longitude !== undefined) updates.lng = Number(body.longitude);

  if (body.workingHours?.from && body.workingHours?.to) {
    updates.workingHours = body.workingHours;
  }

  const departmentId = body.departmentId ?? body.specialtyId;
  if (departmentId) {
    const specialty = schema.specialties.find(departmentId);
    if (specialty) {
      doctor.update({ specialty });
    }
  }

  if (body.email) {
    user.update({ email: String(body.email).trim().toLowerCase() });
  }

  if (updates.fullName) {
    user.update({ fullName: updates.fullName });
  }

  doctor.update(updates);

  if (Array.isArray(body.availableDays) || Array.isArray(body.week)) {
    const week = body.week ?? WEEK_DAYS.map((day) => {
      const selected = body.availableDays.some((value) =>
        String(value).toLowerCase() === day.key || Number(value) === day.dayOfWeek,
      );
      return { dayOfWeek: day.dayOfWeek, isOff: !selected };
    });

    week.forEach((item) => {
      const schedule = doctor.workingSchedules.models.find(
        (entry) => Number(entry.dayOfWeek) === Number(item.dayOfWeek),
      );
      if (schedule) {
        schedule.update({
          from: item.from ?? schedule.from,
          to: item.to ?? schedule.to,
          isOff: Boolean(item.isOff),
        });
      }
    });
  }

  return doctor;
}
