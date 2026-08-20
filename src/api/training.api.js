import api from "./axios";

export const getHealth = (config) => api.get("/health", config);

export const resetTrainingDatabase = (config) =>
  api.post("/training/reset-db", null, config);
