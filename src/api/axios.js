import axios from "axios";

export const TOKEN_KEY = "preclinicAccessToken";
export const USER_KEY = "preclinicCurrentUser";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isAuthRequest = ["/auth/login", "/auth/register", "/auth/forgot-password"].some((path) =>
      url.includes(path),
    );

    if (status === 401 && !isAuthRequest) {
      clearSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export function setSession({ token, user } = {}) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function withSimulatedError(config = {}, status = 500) {
  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Mock-Error": String(status),
    },
  };
}

export default api;
