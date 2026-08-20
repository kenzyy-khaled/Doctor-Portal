export const APPOINTMENT_STATUSES = {
  scheduled: "Schedule",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

export const APPOINTMENT_MODES = {
  in_person: "In-person",
  online: "Online",
};

export const COMPLETED_STATUSES = ["checked_out"];
export const ONGOING_STATUSES = ["scheduled", "confirmed", "checked_in"];
export const ACTIVE_STATUSES = ["scheduled", "confirmed", "checked_in", "rescheduled"];

export function statusLabel(status) {
  return APPOINTMENT_STATUSES[status] ?? status;
}

export function modeLabel(mode) {
  return APPOINTMENT_MODES[mode] ?? mode;
}

export function isCompleted(status) {
  return COMPLETED_STATUSES.includes(status);
}

export function isOngoing(status) {
  return ONGOING_STATUSES.includes(status);
}

export function canCancel(status) {
  return !["cancelled", "checked_out"].includes(status);
}

export function canCheckOut(status) {
  return ["scheduled", "confirmed", "checked_in"].includes(status);
}
