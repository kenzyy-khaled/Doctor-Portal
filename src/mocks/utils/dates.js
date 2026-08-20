export function toISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(isoDate, amount) {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

export function parseISODate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getWeekday(isoDate) {
  return parseISODate(isoDate).getDay();
}

export function dateForWeekday(dayOfWeek, from = todayISO()) {
  const current = getWeekday(from);
  const delta = (Number(dayOfWeek) - current + 7) % 7;
  return addDays(from, delta);
}

export function getWeekRange(isoDate = todayISO()) {
  const date = parseISODate(isoDate);
  const weekday = date.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const from = addDays(isoDate, mondayOffset);
  const to = addDays(from, 6);
  return { from, to };
}

export function weekdayLabel(isoDate) {
  return parseISODate(isoDate).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

export function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(total) {
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function buildSlots(from, to, step = 30) {
  const slots = [];
  for (let current = timeToMinutes(from); current + step <= timeToMinutes(to); current += step) {
    slots.push(minutesToTime(current));
  }
  return slots;
}

export function isDateInRange(isoDate, from, to) {
  return isoDate >= from && isoDate <= to;
}

export const WEEK_DAYS = [
  { key: "sunday", label: "Sunday", dayOfWeek: 0 },
  { key: "monday", label: "Monday", dayOfWeek: 1 },
  { key: "tuesday", label: "Tuesday", dayOfWeek: 2 },
  { key: "wednesday", label: "Wednesday", dayOfWeek: 3 },
  { key: "thursday", label: "Thursday", dayOfWeek: 4 },
  { key: "friday", label: "Friday", dayOfWeek: 5 },
  { key: "saturday", label: "Saturday", dayOfWeek: 6 },
];

export function weekdayMeta(dayOfWeek) {
  return WEEK_DAYS.find((item) => item.dayOfWeek === Number(dayOfWeek));
}

export function ageFromDob(isoDate) {
  if (!isoDate) {
    return null;
  }

  const dob = parseISODate(isoDate);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function formatTime12(time) {
  if (!time) {
    return "";
  }

  const [hourRaw, minute] = time.split(":");
  const hour = Number(hourRaw);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${minute} ${suffix}`;
}

export function formatDateLabel(isoDate) {
  return parseISODate(isoDate).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTimeLabel(isoDate, time) {
  const datePart = parseISODate(isoDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${datePart} - ${formatTime12(time)}`;
}
