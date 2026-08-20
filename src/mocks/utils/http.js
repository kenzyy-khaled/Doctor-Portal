import { badRequest, serverError } from "./response";

export function readBody(request) {
  if (!request.requestBody) {
    return {};
  }

  if (typeof request.requestBody === "object") {
    return request.requestBody;
  }

  try {
    return JSON.parse(request.requestBody);
  } catch {
    return null;
  }
}

export function requireJsonBody(request) {
  const body = readBody(request);

  if (body === null) {
    return { error: badRequest("Invalid JSON body") };
  }

  return { body };
}

export function simulateError(request) {
  const header =
    request.requestHeaders["X-Mock-Error"] ||
    request.requestHeaders["x-mock-error"];
  const query = request.queryParams?.simulateError;
  const code = Number(header || query);

  if (code === 500) {
    return serverError("Simulated server error for training");
  }

  if (code === 401) {
    return null;
  }

  return null;
}

export function getQuery(request, key, fallback = "") {
  const value = request.queryParams?.[key];
  return value == null || value === "" ? fallback : value;
}
