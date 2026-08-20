import api from "./axios";

export const getPatients = (params, config) => api.get("/patients", { params, ...config });

export const getPatientById = (id, config) => api.get(`/patients/${id}`, config);

export const createPatient = (payload, config) => api.post("/patients", payload, config);

export const updatePatient = (id, payload, config) =>
  api.put(`/patients/${id}`, payload, config);
