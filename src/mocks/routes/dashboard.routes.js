import { getDoctorStatus, getWorkingHours } from "../domain/doctors";
import { isCompleted, isOngoing } from "../domain/status";
import { getQuery } from "../utils/http";
import { withGuards } from "../utils/handlers";
import { addDays, getWeekRange, todayISO, weekdayLabel } from "../utils/dates";
import { notFound, ok } from "../utils/response";
import { serializeAppointment, serializeDoctorCard } from "../serializers";

function appointmentsOnDate(appointments, date) {
  return appointments.filter((appointment) => appointment.date === date);
}

function countByStatus(appointments, status) {
  return appointments.filter((appointment) => appointment.status === status).length;
}

function percentChange(current, previous) {
  if (!previous) {
    return current ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function sparkline(appointments, fromDate) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(fromDate, index);
    return appointmentsOnDate(appointments, date).length;
  });
}

function nextPatient(appointments) {
  return appointments
    .filter((appointment) => ["scheduled", "confirmed", "checked_in"].includes(appointment.status))
    .sort((a, b) => a.time.localeCompare(b.time))[0];
}

export function registerDashboardRoutes(server) {
  server.get(
    "/doctor/dashboard",
    withGuards(
      (schema, request) => {
        const doctor = request.authUser.doctor;
        if (!doctor) {
          return notFound("Doctor profile not found");
        }

        const selectedDate = getQuery(request, "date", todayISO());
        const clinicAppointments = schema.appointments.all().models;
        const mine = doctor.appointments.models;
        const patients = schema.patients.all().models;
        const todays = appointmentsOnDate(mine, selectedDate);
        const next = nextPatient(todays);
        const { from: thisFrom, to: thisTo } = getWeekRange(selectedDate);
        const previousFrom = addDays(thisFrom, -7);
        const previousTo = addDays(thisTo, -7);

        const thisWeek = clinicAppointments.filter((item) => item.date >= thisFrom && item.date <= thisTo);
        const lastWeek = clinicAppointments.filter((item) => item.date >= previousFrom && item.date <= previousTo);
        const completedThisWeek = thisWeek.filter((item) => isCompleted(item.status));
        const completedLastWeek = lastWeek.filter((item) => isCompleted(item.status));
        const revenueThis = completedThisWeek.reduce((sum, item) => sum + Number(item.doctor?.consultationFee || 0), 0);
        const revenueLast = completedLastWeek.reduce((sum, item) => sum + Number(item.doctor?.consultationFee || 0), 0);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthly = monthNames.map((month, monthIndex) => {
          const items = clinicAppointments.filter((item) => new Date(`${item.date}T00:00:00`).getMonth() === monthIndex);
          if (items.length === 0) {
            return {
              month,
              completed: 18 + monthIndex * 2,
              ongoing: 6 + (monthIndex % 4),
              rescheduled: 3 + (monthIndex % 3),
            };
          }
          return {
            month,
            completed: items.filter((item) => isCompleted(item.status)).length,
            ongoing: items.filter((item) => isOngoing(item.status)).length,
            rescheduled: countByStatus(items, "rescheduled"),
          };
        });

        const popularDoctors = schema.doctors.all().models
          .map((item) => ({
            doctor: item,
            bookings: item.appointments.models.filter((appointment) => appointment.date >= thisFrom && appointment.date <= thisTo).length,
          }))
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 6)
          .map((item) => ({
            ...serializeDoctorCard(item.doctor),
            bookings: item.bookings,
          }));

        const calendarFrom = addDays(selectedDate, -15);
        const calendar = Array.from({ length: 31 }, (_, index) => {
          const date = addDays(calendarFrom, index);
          return {
            date,
            count: appointmentsOnDate(clinicAppointments, date).length,
          };
        });

        return ok({
          todayAppointments: todays.length,
          completedToday: countByStatus(todays, "checked_out"),
          pendingToday: countByStatus(todays, "scheduled"),
          confirmedToday: countByStatus(todays, "confirmed"),
          cancelledToday: countByStatus(todays, "cancelled"),
          checkedInToday: countByStatus(todays, "checked_in"),
          workingHours: getWorkingHours(doctor, selectedDate),
          status: getDoctorStatus(doctor, selectedDate),
          nextPatient: next ? serializeAppointment(next) : null,
          queue: todays
            .filter((appointment) => appointment.status !== "cancelled")
            .sort((a, b) => a.queueNumber - b.queueNumber)
            .map(serializeAppointment),
          stats: {
            patients: {
              total: patients.length,
              changePercent: 12.5,
              sparkline: sparkline(clinicAppointments, addDays(selectedDate, -6)),
            },
            appointments: {
              total: clinicAppointments.length,
              changePercent: percentChange(thisWeek.length, lastWeek.length),
              sparkline: sparkline(clinicAppointments, addDays(selectedDate, -6)),
            },
            revenue: {
              total: revenueThis,
              changePercent: percentChange(revenueThis, revenueLast),
              sparkline: Array.from({ length: 7 }, (_, index) => {
                const date = addDays(selectedDate, index - 6);
                return appointmentsOnDate(clinicAppointments, date)
                  .filter((item) => isCompleted(item.status))
                  .reduce((sum, item) => sum + Number(item.doctor?.consultationFee || 0), 0);
              }),
            },
          },
          appointmentStats: {
            all: clinicAppointments.length,
            cancelled: countByStatus(clinicAppointments, "cancelled"),
            rescheduled: countByStatus(clinicAppointments, "rescheduled"),
            completed: clinicAppointments.filter((item) => isCompleted(item.status)).length,
            monthly,
          },
          popularDoctors,
          calendar,
          agenda: appointmentsOnDate(clinicAppointments, selectedDate)
            .sort((a, b) => a.time.localeCompare(b.time))
            .map(serializeAppointment),
          recentAppointments: clinicAppointments
            .slice()
            .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
            .slice(0, 8)
            .map(serializeAppointment),
        });
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.get(
    "/doctor/popular",
    withGuards(
      (schema, request) => {
        const { from, to } = getWeekRange(getQuery(request, "date", todayISO()));
        const popular = schema.doctors.all().models
          .map((doctor) => ({
            ...serializeDoctorCard(doctor),
            bookings: doctor.appointments.models.filter((item) => item.date >= from && item.date <= to).length,
          }))
          .sort((a, b) => b.bookings - a.bookings);
        return ok(popular);
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.get(
    "/doctor/analytics/daily",
    withGuards(
      (_schema, request) => {
        const doctor = request.authUser.doctor;
        if (!doctor) {
          return notFound("Doctor profile not found");
        }

        const date = getQuery(request, "date", todayISO());
        const dayAppointments = appointmentsOnDate(doctor.appointments.models, date);
        const completed = dayAppointments.filter((item) => isCompleted(item.status));

        const hourlyMap = new Map();
        dayAppointments.forEach((appointment) => {
          const hour = appointment.time.slice(0, 2) + ":00";
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        });

        return ok({
          date,
          appointments: dayAppointments.length,
          completed: completed.length,
          cancelled: countByStatus(dayAppointments, "cancelled"),
          pending: countByStatus(dayAppointments, "scheduled"),
          revenue: completed.length * Number(doctor.consultationFee || 0),
          hourly: Array.from(hourlyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([hour, count]) => ({ hour, count })),
        });
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.get(
    "/doctor/analytics/weekly",
    withGuards(
      (_schema, request) => {
        const doctor = request.authUser.doctor;
        if (!doctor) {
          return notFound("Doctor profile not found");
        }

        const { from, to } = getWeekRange(getQuery(request, "date", todayISO()));
        const days = [];

        for (let offset = 0; offset < 7; offset += 1) {
          const date = addDays(from, offset);
          const dayAppointments = appointmentsOnDate(doctor.appointments.models, date);
          const completed = dayAppointments.filter((item) => isCompleted(item.status)).length;
          days.push({
            date,
            label: weekdayLabel(date),
            appointments: dayAppointments.length,
            completed,
            cancelled: countByStatus(dayAppointments, "cancelled"),
            revenue: completed * Number(doctor.consultationFee || 0),
          });
        }

        return ok({
          from,
          to,
          days,
          totals: {
            appointments: days.reduce((sum, day) => sum + day.appointments, 0),
            completed: days.reduce((sum, day) => sum + day.completed, 0),
            cancelled: days.reduce((sum, day) => sum + day.cancelled, 0),
            revenue: days.reduce((sum, day) => sum + day.revenue, 0),
          },
        });
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.get(
    "/doctor/doctors-status",
    withGuards(
      (schema) => {
        const date = todayISO();
        return ok(
          schema.doctors.all().models.map((doctor) => ({
            ...serializeDoctorCard(doctor, getDoctorStatus(doctor, date)),
            workingHours: getWorkingHours(doctor, date),
          })),
        );
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.get(
    "/doctor/reviews",
    withGuards(
      (_schema, request) => {
        const doctor = request.authUser.doctor;
        if (!doctor) {
          return notFound("Doctor profile not found");
        }

        return ok(doctor.reviews.models.map((review) => ({
          id: Number(review.id),
          rating: review.rating,
          comment: review.comment,
          date: review.date,
          patient: review.patient
            ? { id: Number(review.patient.id), fullName: review.patient.fullName, name: review.patient.fullName }
            : null,
        })));
      },
      { auth: true, role: "doctor" },
    ),
  );
}
