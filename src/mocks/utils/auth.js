import { MOCK_CONFIG } from "../config";
import { forbidden, unauthorized } from "./response";

export function createToken(user, { rememberMe = false } = {}) {
  const ttl = rememberMe ? 30 * 24 * 60 * 60 * 1000 : MOCK_CONFIG.tokenTtlMs;
  const payload = {
    sub: String(user.id),
    role: user.role,
    email: user.email,
    iat: Date.now(),
    exp: Date.now() + ttl,
  };

  return `${MOCK_CONFIG.tokenPrefix}.${btoa(JSON.stringify(payload))}.signature`;
}

export function parseToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2 || parts[0] !== MOCK_CONFIG.tokenPrefix) {
    return null;
  }

  try {
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

export function readBearerToken(request) {
  const header =
    request.requestHeaders.Authorization ||
    request.requestHeaders.authorization ||
    "";

  return header.replace(/^Bearer\s+/i, "").trim();
}

export function getAuthUser(schema, request) {
  const token = readBearerToken(request);

  if (!token) {
    return { error: unauthorized("Authentication required") };
  }

  const payload = parseToken(token);

  if (!payload) {
    return { error: unauthorized("Invalid token") };
  }

  if (payload.exp && payload.exp < Date.now()) {
    return { error: unauthorized("Token expired") };
  }

  const user = schema.users.find(payload.sub);

  if (!user) {
    return { error: unauthorized("Invalid token") };
  }

  return { user };
}

export function requireAuth(schema, request, role) {
  const result = getAuthUser(schema, request);

  if (result.error) {
    return result;
  }

  if (role && result.user.role !== role) {
    return {
      error: forbidden("You do not have permission to access this resource"),
    };
  }

  return result;
}

export function publicUser(user) {
  const doctor = user.doctor;
  const patient = user.patient;

  return {
    id: Number(user.id),
    name: user.fullName,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    photoUrl: doctor?.photoUrl || patient?.photoUrl || null,
    doctorId: doctor ? Number(doctor.id) : null,
    patientId: patient ? Number(patient.id) : null,
  };
}
