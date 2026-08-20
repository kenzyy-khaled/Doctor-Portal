import { getDisplaySlots, getDoctorSlots, getDoctorStatus, getWorkingHours } from "../domain/doctors";
import { applyDoctorUpdates } from "../domain/profile";
import { paginate } from "../utils/pagination";
import { getQuery, requireJsonBody } from "../utils/http";
import { withGuards } from "../utils/handlers";
import { forbidden, notFound, ok, unprocessable } from "../utils/response";
import { dateForWeekday, todayISO, weekdayMeta } from "../utils/dates";
import {
  serializeDoctorCard,
  serializeDoctorProfile,
  serializeReview,
  serializeSpecialty,
} from "../serializers";

function specialtiesPayload(schema) {
  return schema.specialties.all().models.map(serializeSpecialty);
}

function updateOwnDoctor(schema, request, doctor) {
  const parsed = requireJsonBody(request);
  if (parsed.error) {
    return parsed.error;
  }

  applyDoctorUpdates(schema, doctor, request.authUser, parsed.body);
  return ok(serializeDoctorProfile(doctor, getDoctorStatus(doctor)));
}

export function registerDoctorRoutes(server) {
  server.get(
    "/specialties",
    withGuards((schema) => ok(specialtiesPayload(schema))),
  );

  server.get(
    "/departments",
    withGuards((schema) => ok(specialtiesPayload(schema))),
  );

  server.get(
    "/doctors",
    withGuards((schema, request) => {
      const q = getQuery(request, "q").toLowerCase();
      const specialtyId = getQuery(request, "specialtyId") || getQuery(request, "departmentId");
      const specialtySlug = getQuery(request, "specialty") || getQuery(request, "department");
      const statusFilter = getQuery(request, "status");

      let doctors = schema.doctors.all().models;

      if (q) {
        doctors = doctors.filter((doctor) =>
          `${doctor.fullName} ${doctor.clinicName} ${doctor.specialty?.name ?? ""} ${doctor.code ?? ""}`
            .toLowerCase()
            .includes(q),
        );
      }

      if (specialtyId) {
        doctors = doctors.filter((doctor) => String(doctor.specialty?.id) === String(specialtyId));
      }

      if (specialtySlug) {
        doctors = doctors.filter((doctor) => doctor.specialty?.slug === specialtySlug);
      }

      const date = getQuery(request, "date", todayISO());
      const withStatus = doctors.map((doctor) => ({
        doctor,
        status: getDoctorStatus(doctor, date),
      }));

      const filtered = statusFilter
        ? withStatus.filter((item) => item.status === statusFilter)
        : withStatus;

      const page = paginate(filtered, request);
      return ok(
        page.data.map((item) => serializeDoctorCard(item.doctor, item.status)),
        { meta: page.meta },
      );
    }),
  );

  server.get(
    "/doctors/:id",
    withGuards((schema, request) => {
      const doctor = schema.doctors.find(request.params.id);
      if (!doctor) {
        return notFound("Doctor not found");
      }

      return ok(serializeDoctorProfile(doctor, getDoctorStatus(doctor)));
    }),
  );

  const saveDoctorById = withGuards(
    (schema, request) => {
      const doctor = schema.doctors.find(request.params.id);
      if (!doctor) {
        return notFound("Doctor not found");
      }

      if (String(request.authUser.doctor?.id) !== String(doctor.id)) {
        return forbidden("You can only update your own profile");
      }

      return updateOwnDoctor(schema, request, doctor);
    },
    { auth: true, role: "doctor" },
  );

  server.put("/doctors/:id", saveDoctorById);
  server.patch("/doctors/:id", saveDoctorById);

  server.get(
    "/doctors/:id/availability",
    withGuards((schema, request) => {
      const doctor = schema.doctors.find(request.params.id);
      if (!doctor) {
        return notFound("Doctor not found");
      }

      const date = getQuery(request, "date", todayISO());
      const requestedDay = getQuery(request, "day");
      const week = doctor.workingSchedules.models
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        .map((schedule) => {
          const meta = weekdayMeta(schedule.dayOfWeek);
          return {
            key: meta?.key,
            label: meta?.label,
            dayOfWeek: schedule.dayOfWeek,
            from: schedule.from,
            to: schedule.to,
            isOff: schedule.isOff,
          };
        });

      const selected =
        week.find((item) => item.key === requestedDay || String(item.dayOfWeek) === requestedDay) ??
        week.find((item) => !item.isOff) ??
        week[0];

      const slotDate = selected ? dateForWeekday(selected.dayOfWeek, date) : date;

      return ok({
        doctorId: Number(doctor.id),
        date,
        status: getDoctorStatus(doctor, date),
        availabilityStatus: getDoctorStatus(doctor, date) === "working" ? "available" : "unavailable",
        workingHours: getWorkingHours(doctor, date),
        selectedDay: selected?.key ?? null,
        days: week,
        week,
        slots: getDisplaySlots(doctor, slotDate),
        leaves: doctor.leaves.models.map((leave) => ({
          id: Number(leave.id),
          fromDate: leave.fromDate,
          toDate: leave.toDate,
          reason: leave.reason,
        })),
      });
    }),
  );

  server.put(
    "/doctor/availability",
    withGuards(
      (schema, request) => {
        const doctor = request.authUser.doctor;
        if (!doctor) {
          return notFound("Doctor profile not found");
        }

        const parsed = requireJsonBody(request);
        if (parsed.error) {
          return parsed.error;
        }

        applyDoctorUpdates(schema, doctor, request.authUser, parsed.body);
        return ok(serializeDoctorProfile(doctor, getDoctorStatus(doctor)));
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.get(
    "/doctors/:id/slots",
    withGuards((schema, request) => {
      const doctor = schema.doctors.find(request.params.id);
      if (!doctor) {
        return notFound("Doctor not found");
      }

      const date = getQuery(request, "date", todayISO());
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return unprocessable("Validation failed", { date: "Use YYYY-MM-DD" });
      }

      return ok({
        doctorId: Number(doctor.id),
        date,
        status: getDoctorStatus(doctor, date),
        workingHours: getWorkingHours(doctor, date),
        slots: getDoctorSlots(doctor, date),
      });
    }),
  );

  server.get(
    "/doctors/:id/reviews",
    withGuards((schema, request) => {
      const doctor = schema.doctors.find(request.params.id);
      if (!doctor) {
        return notFound("Doctor not found");
      }

      const reviews = doctor.reviews.models.sort((a, b) => (a.date < b.date ? 1 : -1));
      const page = paginate(reviews, request, { defaultLimit: 5 });
      return ok(page.data.map(serializeReview), { meta: page.meta });
    }),
  );

  server.get(
    "/doctor/profile",
    withGuards(
      (_schema, request) => {
        const doctor = request.authUser.doctor;
        if (!doctor) {
          return notFound("Doctor profile not found");
        }
        return ok(serializeDoctorProfile(doctor, getDoctorStatus(doctor)));
      },
      { auth: true, role: "doctor" },
    ),
  );

  const saveProfile = withGuards(
    (schema, request) => {
      const doctor = request.authUser.doctor;
      if (!doctor) {
        return notFound("Doctor profile not found");
      }
      return updateOwnDoctor(schema, request, doctor);
    },
    { auth: true, role: "doctor" },
  );

  server.put("/doctor/profile", saveProfile);
  server.patch("/doctor/profile", saveProfile);
}
