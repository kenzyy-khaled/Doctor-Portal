import { getDoctorSlots, getDoctorStatus, nextQueueNumber } from "../domain/doctors";
import { canCancel, canCheckOut } from "../domain/status";
import { paginate } from "../utils/pagination";
import { getQuery, requireJsonBody } from "../utils/http";
import { withGuards } from "../utils/handlers";
import {
  conflict,
  created,
  forbidden,
  notFound,
  ok,
  unprocessable,
} from "../utils/response";
import { serializeAppointment } from "../serializers";

function filterAppointments(appointments, request) {
  const status = getQuery(request, "status");
  const mode = getQuery(request, "mode");
  const date = getQuery(request, "date");
  const from = getQuery(request, "from") || getQuery(request, "startDate");
  const to = getQuery(request, "to") || getQuery(request, "endDate");
  const q = (getQuery(request, "q") || getQuery(request, "search")).toLowerCase();

  return appointments.filter((appointment) => {
    if (status && appointment.status !== status) return false;
    if (mode && (appointment.mode || "in_person") !== mode) return false;
    if (date && appointment.date !== date) return false;
    if (from && appointment.date < from) return false;
    if (to && appointment.date > to) return false;
    if (q) {
      const haystack = `${appointment.patient?.fullName ?? ""} ${appointment.doctor?.fullName ?? ""} ${appointment.notes ?? ""} ${appointment.patient?.phone ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function sortAppointments(appointments, request) {
  const sortBy = getQuery(request, "sortBy") || "recent";
  const cloned = appointments.slice();

  cloned.sort((a, b) => {
    if (sortBy === "oldest") {
      if (a.date === b.date) return a.time.localeCompare(b.time);
      return a.date.localeCompare(b.date);
    }
    if (sortBy === "patient") {
      return (a.patient?.fullName ?? "").localeCompare(b.patient?.fullName ?? "");
    }
    if (a.date === b.date) return b.time.localeCompare(a.time);
    return a.date < b.date ? 1 : -1;
  });

  return cloned;
}

function requireOwnedAppointment(schema, request) {
  const doctor = request.authUser.doctor;
  const appointment = schema.appointments.find(request.params.id);

  if (!appointment) {
    return { error: notFound("Appointment not found") };
  }

  if (String(appointment.doctor.id) !== String(doctor.id)) {
    return { error: forbidden("You can only manage your own appointments") };
  }

  return { appointment, doctor };
}

function createForDoctor(schema, request, { patientId, date, time, notes = "", mode = "in_person", visitType = "General Visit" }) {
  const doctor = request.authUser.doctor;
  const errors = {};
  if (!patientId) errors.patientId = "Patient is required";
  if (!date) errors.date = "Date is required";
  if (!time) errors.time = "Time is required";
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Use YYYY-MM-DD";
  if (mode && !["in_person", "online"].includes(mode)) errors.mode = "Mode must be in_person or online";
  if (Object.keys(errors).length) {
    return unprocessable("Validation failed", errors);
  }

  const patient = schema.patients.find(patientId);
  if (!patient) {
    return notFound("Patient not found");
  }

  const status = getDoctorStatus(doctor, date);
  if (status !== "working") {
    return conflict(`Doctor is ${status.replace("_", " ")} on this date`);
  }

  const slot = getDoctorSlots(doctor, date).find((item) => item.time === time);
  if (!slot) {
    return unprocessable("Validation failed", { time: "Time is outside working hours" });
  }
  if (!slot.available) {
    return conflict("This slot is already booked");
  }

  const appointment = schema.appointments.create({
    doctor,
    patient,
    date,
    time,
    duration: 30,
    status: "scheduled",
    queueNumber: nextQueueNumber(doctor, date),
    type: "consultation",
    visitType,
    mode,
    notes,
  });

  return created(serializeAppointment(appointment));
}

export function registerAppointmentRoutes(server) {
  server.get(
    "/doctor/appointments",
    withGuards(
      (_schema, request) => {
        const doctor = request.authUser.doctor;
        if (!doctor) {
          return notFound("Doctor profile not found");
        }

        const items = sortAppointments(filterAppointments(doctor.appointments.models, request), request);
        const page = paginate(items, request);
        return ok(page.data.map(serializeAppointment), { meta: page.meta });
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.post(
    "/doctor/appointments",
    withGuards(
      (schema, request) => {
        const parsed = requireJsonBody(request);
        if (parsed.error) {
          return parsed.error;
        }
        return createForDoctor(schema, request, parsed.body);
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.put(
    "/doctor/appointments/:id/cancel",
    withGuards(
      (schema, request) => {
        const owned = requireOwnedAppointment(schema, request);
        if (owned.error) return owned.error;
        if (!canCancel(owned.appointment.status)) {
          return conflict("This appointment cannot be cancelled");
        }
        owned.appointment.update({ status: "cancelled" });
        return ok(serializeAppointment(owned.appointment));
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.put(
    "/doctor/appointments/:id/complete",
    withGuards(
      (schema, request) => {
        const owned = requireOwnedAppointment(schema, request);
        if (owned.error) return owned.error;
        if (!canCheckOut(owned.appointment.status)) {
          return conflict("This appointment cannot be checked out");
        }
        owned.appointment.update({ status: "checked_out" });
        return ok(serializeAppointment(owned.appointment));
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.put(
    "/doctor/appointments/:id/check-in",
    withGuards(
      (schema, request) => {
        const owned = requireOwnedAppointment(schema, request);
        if (owned.error) return owned.error;
        if (!["scheduled", "confirmed"].includes(owned.appointment.status)) {
          return conflict("Only scheduled or confirmed appointments can be checked in");
        }
        owned.appointment.update({ status: "checked_in" });
        return ok(serializeAppointment(owned.appointment));
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.put(
    "/doctor/appointments/:id/check-out",
    withGuards(
      (schema, request) => {
        const owned = requireOwnedAppointment(schema, request);
        if (owned.error) return owned.error;
        if (!canCheckOut(owned.appointment.status)) {
          return conflict("This appointment cannot be checked out");
        }
        owned.appointment.update({ status: "checked_out" });
        return ok(serializeAppointment(owned.appointment));
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.put(
    "/doctor/appointments/:id/confirm",
    withGuards(
      (schema, request) => {
        const owned = requireOwnedAppointment(schema, request);
        if (owned.error) return owned.error;
        if (owned.appointment.status !== "scheduled") {
          return conflict("Only scheduled appointments can be confirmed");
        }
        owned.appointment.update({ status: "confirmed" });
        return ok(serializeAppointment(owned.appointment));
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.put(
    "/doctor/appointments/:id/reschedule",
    withGuards(
      (schema, request) => {
        const owned = requireOwnedAppointment(schema, request);
        if (owned.error) return owned.error;
        const parsed = requireJsonBody(request);
        if (parsed.error) return parsed.error;

        const { date, time } = parsed.body;
        if (!date || !time) {
          return unprocessable("Validation failed", {
            date: date ? undefined : "Date is required",
            time: time ? undefined : "Time is required",
          });
        }

        owned.appointment.update({ date, time, status: "rescheduled" });
        return ok(serializeAppointment(owned.appointment));
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.get(
    "/appointments",
    withGuards(
      (_schema, request) => {
        const patient = request.authUser.patient;
        if (!patient) {
          return notFound("Patient profile not found");
        }

        const items = sortAppointments(filterAppointments(patient.appointments.models, request), request);
        const page = paginate(items, request);
        return ok(page.data.map(serializeAppointment), { meta: page.meta });
      },
      { auth: true, role: "patient" },
    ),
  );

  server.get(
    "/appointments/:id",
    withGuards(
      (schema, request) => {
        const appointment = schema.appointments.find(request.params.id);
        if (!appointment) {
          return notFound("Appointment not found");
        }

        const user = request.authUser;
        const doctorId = user.doctor ? String(user.doctor.id) : null;
        const patientId = user.patient ? String(user.patient.id) : null;
        const owns =
          String(appointment.doctor.id) === doctorId ||
          String(appointment.patient.id) === patientId;

        if (!owns) {
          return forbidden("You do not have access to this appointment");
        }

        return ok(serializeAppointment(appointment));
      },
      { auth: true },
    ),
  );

  server.post(
    "/appointments",
    withGuards(
      (schema, request) => {
        const parsed = requireJsonBody(request);
        if (parsed.error) {
          return parsed.error;
        }

        const { doctorId, date, time, notes = "", mode = "in_person", visitType = "General Visit" } = parsed.body;
        const errors = {};
        if (!doctorId) errors.doctorId = "Doctor is required";
        if (!date) errors.date = "Date is required";
        if (!time) errors.time = "Time is required";
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Use YYYY-MM-DD";
        if (Object.keys(errors).length) {
          return unprocessable("Validation failed", errors);
        }

        const doctor = schema.doctors.find(doctorId);
        if (!doctor) {
          return notFound("Doctor not found");
        }

        const patient = request.authUser.patient;
        if (!patient) {
          return notFound("Patient profile not found");
        }

        const status = getDoctorStatus(doctor, date);
        if (status !== "working") {
          return conflict(`Doctor is ${status.replace("_", " ")} on this date`);
        }

        const slot = getDoctorSlots(doctor, date).find((item) => item.time === time);
        if (!slot) {
          return unprocessable("Validation failed", { time: "Time is outside working hours" });
        }
        if (!slot.available) {
          return conflict("This slot is already booked");
        }

        const appointment = schema.appointments.create({
          doctor,
          patient,
          date,
          time,
          duration: 30,
          status: "scheduled",
          queueNumber: nextQueueNumber(doctor, date),
          type: "consultation",
          visitType,
          mode,
          notes,
        });

        return created(serializeAppointment(appointment));
      },
      { auth: true, role: "patient" },
    ),
  );
}
