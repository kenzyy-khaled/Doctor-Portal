import api from "./axios";

export const getDoctorAppointments = (params, config) =>
  api.get("/doctor/appointments", { params, ...config });

export const createDoctorAppointment = (payload, config) =>
  api.post("/doctor/appointments", payload, config);

export const cancelAppointment = (id, config) =>
  api.put(`/doctor/appointments/${id}/cancel`, null, config);

export const completeAppointment = (id, config) =>
  api.put(`/doctor/appointments/${id}/complete`, null, config);

export const checkInAppointment = (id, config) =>
  api.put(`/doctor/appointments/${id}/check-in`, null, config);

export const checkOutAppointment = (id, config) =>
  api.put(`/doctor/appointments/${id}/check-out`, null, config);

export const confirmAppointment = (id, config) =>
  api.put(`/doctor/appointments/${id}/confirm`, null, config);

export const rescheduleAppointment = (id, payload, config) =>
  api.put(`/doctor/appointments/${id}/reschedule`, payload, config);

export const getMyAppointments = (params, config) =>
  api.get("/appointments", { params, ...config });

export const getAppointmentById = (id, config) => api.get(`/appointments/${id}`, config);

export const createAppointment = (payload, config) =>
  api.post("/appointments", payload, config);
