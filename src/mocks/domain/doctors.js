import {
  addDays,
  buildSlots,
  formatTime12,
  getWeekday,
  isDateInRange,
  minutesToTime,
  timeToMinutes,
  todayISO,
} from "../utils/dates";

export function getDoctorLeave(doctor, date = todayISO()) {
  return doctor.leaves.models.find((leave) => isDateInRange(date, leave.fromDate, leave.toDate));
}

export function getDoctorSchedule(doctor, date = todayISO()) {
  const weekday = getWeekday(date);
  return doctor.workingSchedules.models.find(
    (schedule) => Number(schedule.dayOfWeek) === weekday,
  );
}

export function getDoctorStatus(doctor, date = todayISO()) {
  if (getDoctorLeave(doctor, date)) {
    return "on_leave";
  }

  const schedule = getDoctorSchedule(doctor, date);
  if (!schedule || schedule.isOff) {
    return "off_day";
  }

  return "working";
}

export function getWorkingHours(doctor, date = todayISO()) {
  const schedule = getDoctorSchedule(doctor, date);
  if (!schedule || schedule.isOff) {
    return doctor.workingHours;
  }

  return { from: schedule.from, to: schedule.to };
}

export function getBusyTimes(doctor, date) {
  return doctor.appointments.models
    .filter((appointment) => appointment.date === date && appointment.status !== "cancelled")
    .map((appointment) => appointment.time);
}

export function getDoctorSlots(doctor, date) {
  const status = getDoctorStatus(doctor, date);
  const hours = getWorkingHours(doctor, date);
  const times = buildSlots(hours.from, hours.to, 30);
  const busy = new Set(getBusyTimes(doctor, date));

  return times.map((time) => ({
    time,
    available: status === "working" && !busy.has(time),
  }));
}

export function getDisplaySlots(doctor, date) {
  const status = getDoctorStatus(doctor, date);
  const hours = getWorkingHours(doctor, date);
  const times = buildSlots(hours.from, hours.to, 60);
  const busy = new Set(getBusyTimes(doctor, date));

  return times.map((from) => {
    const toMinutes = timeToMinutes(from) + 60;
    const to = minutesToTime(toMinutes);
    return {
      from,
      to,
      label: `${formatTime12(from)} - ${formatTime12(to)}`,
      available: status === "working" && !busy.has(from),
    };
  });
}

export function nextQueueNumber(doctor, date) {
  const sameDay = doctor.appointments.models.filter(
    (appointment) => appointment.date === date && appointment.status !== "cancelled",
  );

  return sameDay.length + 1;
}

export function upcomingDates(days = 7) {
  return Array.from({ length: days }, (_, index) => addDays(todayISO(), index));
}
