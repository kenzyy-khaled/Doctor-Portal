import api from "./axios";

export const getDoctorDashboard = (params, config) => {
  if (params?.headers && config === undefined) {
    return api.get("/doctor/dashboard", params);
  }

  return api.get("/doctor/dashboard", { params, ...config });
};

export const getPopularDoctors = (params, config) =>
  api.get("/doctor/popular", { params, ...config });

export const getDailyAnalytics = (params, config) =>
  api.get("/doctor/analytics/daily", { params, ...config });

export const getWeeklyAnalytics = (params, config) =>
  api.get("/doctor/analytics/weekly", { params, ...config });
