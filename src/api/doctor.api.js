import api from "./axios";

export const getSpecialties = (config) => api.get("/specialties", config);

export const getDepartments = (config) => api.get("/departments", config);

export const getDoctors = (params, config) => api.get("/doctors", { params, ...config });

export const getDoctorById = (id, config) => api.get(`/doctors/${id}`, config);

export const updateDoctorById = (id, payload, config) =>
  api.put(`/doctors/${id}`, payload, config);

export const getDoctorAvailability = (id, params, config) =>
  api.get(`/doctors/${id}/availability`, { params, ...config });

export const updateMyAvailability = (payload, config) =>
  api.put("/doctor/availability", payload, config);

export const getDoctorSlots = (id, params, config) =>
  api.get(`/doctors/${id}/slots`, { params, ...config });

export const getDoctorReviews = (id, params, config) =>
  api.get(`/doctors/${id}/reviews`, { params, ...config });

export const getDoctorProfile = (config) => api.get("/doctor/profile", config);

export const updateDoctorProfile = (payload, config) =>
  api.put("/doctor/profile", payload, config);

export const getClinicDoctorsStatus = (config) => api.get("/doctor/doctors-status", config);

export const getMyDoctorReviews = (config) => api.get("/doctor/reviews", config);
