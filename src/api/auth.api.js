import api from "./axios";

export const login = (payload, config) => api.post("/auth/login", payload, config);

export const register = (payload, config) => api.post("/auth/register", payload, config);

export const forgotPassword = (payload, config) =>
  api.post("/auth/forgot-password", payload, config);

export const getMe = (config) => api.get("/auth/me", config);
