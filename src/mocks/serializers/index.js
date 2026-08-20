import { getDoctorStatus, getWorkingHours } from "../domain/doctors";
import { modeLabel, statusLabel } from "../domain/status";
import { ageFromDob, formatDateLabel, formatDateTimeLabel, formatTime12 } from "../utils/dates";

function idOf(model) {
  return Number(model.id);
}

export function serializeSpecialty(specialty) {
  if (!specialty) {
    return null;
  }

  return {
    id: idOf(specialty),
    name: specialty.name,
    slug: specialty.slug,
    icon: specialty.icon,
  };
}

export function serializeDepartment(specialty) {
  const item = serializeSpecialty(specialty);
  return item ? { ...item, name: specialty.name } : null;
}

function ratingOf(doctor) {
  const reviews = doctor.reviews?.models ?? [];
  if (reviews.length === 0) {
    return doctor.rating;
  }

  return Number(
    (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1),
  );
}

export function serializeDoctorCard(doctor, status) {
  const specialty = doctor.specialty;
  const computedStatus = status ?? getDoctorStatus(doctor);
  const reviews = doctor.reviews?.models ?? [];

  return {
    id: idOf(doctor),
    code: doctor.code,
    name: doctor.fullName,
    fullName: doctor.fullName,
    title: doctor.title,
    qualifications: doctor.qualifications,
    bio: doctor.bio,
    photoUrl: doctor.photoUrl,
    clinicName: doctor.clinicName,
    phone: doctor.phone,
    email: doctor.user?.email ?? doctor.email ?? null,
    experienceYears: doctor.experienceYears,
    consultationFee: doctor.consultationFee,
    rating: ratingOf(doctor),
    reviewsCount: reviews.length || doctor.reviewsCount,
    address: doctor.address,
    lat: doctor.lat,
    lng: doctor.lng,
    availabilityStatus: computedStatus === "working" ? "available" : "unavailable",
    status: computedStatus,
    specialty: serializeSpecialty(specialty),
    department: serializeDepartment(specialty),
    workingHours: getWorkingHours(doctor),
  };
}

export function serializeDoctorProfile(doctor, status) {
  return {
    ...serializeDoctorCard(doctor, status),
    licenseNumber: doctor.licenseNumber,
    dateOfBirth: doctor.dateOfBirth,
    bloodGroup: doctor.bloodGroup,
    gender: doctor.gender,
    education: doctor.education ?? [],
    awards: doctor.awards ?? [],
    certifications: doctor.certifications ?? [],
    availableDays: (doctor.workingSchedules?.models ?? [])
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map((schedule) => ({
        dayOfWeek: schedule.dayOfWeek,
        from: schedule.from,
        to: schedule.to,
        isOff: Boolean(schedule.isOff),
      })),
  };
}

export function serializePatient(patient) {
  const lastAppointment = (patient.appointments?.models ?? [])
    .slice()
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0];

  return {
    id: idOf(patient),
    name: patient.fullName,
    fullName: patient.fullName,
    email: patient.email,
    phone: patient.phone,
    gender: patient.gender,
    dateOfBirth: patient.dateOfBirth,
    age: ageFromDob(patient.dateOfBirth),
    photoUrl: patient.photoUrl,
    address: patient.address ?? "",
    lastAppointmentDate: lastAppointment?.date ?? null,
    lastAppointmentLabel: lastAppointment ? formatDateLabel(lastAppointment.date) : null,
  };
}

export function serializeAppointment(appointment) {
  return {
    id: idOf(appointment),
    date: appointment.date,
    time: appointment.time,
    timeLabel: formatTime12(appointment.time),
    dateTimeLabel: formatDateTimeLabel(appointment.date, appointment.time),
    duration: appointment.duration,
    status: appointment.status,
    statusLabel: statusLabel(appointment.status),
    mode: appointment.mode || "in_person",
    modeLabel: modeLabel(appointment.mode || "in_person"),
    visitType: appointment.visitType || "General Visit",
    queueNumber: appointment.queueNumber,
    type: appointment.type,
    notes: appointment.notes ?? "",
    doctor: appointment.doctor
      ? {
          id: idOf(appointment.doctor),
          name: appointment.doctor.fullName,
          fullName: appointment.doctor.fullName,
          specialty: appointment.doctor.specialty?.name ?? null,
          photoUrl: appointment.doctor.photoUrl,
        }
      : null,
    patient: appointment.patient ? serializePatient(appointment.patient) : null,
  };
}

export function serializeReview(review) {
  return {
    id: idOf(review),
    rating: review.rating,
    comment: review.comment,
    date: review.date,
    patient: review.patient
      ? {
          id: idOf(review.patient),
          name: review.patient.fullName,
          fullName: review.patient.fullName,
        }
      : null,
  };
}
