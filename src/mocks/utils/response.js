import { Response } from "miragejs";

export function ok(data, extra = {}) {
  return {
    success: true,
    data,
    ...extra,
  };
}

export function created(data, extra = {}) {
  return new Response(201, {}, ok(data, extra));
}

export function fail(status, message, errors) {
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  return new Response(status, {}, body);
}

export function badRequest(message = "Bad request", errors) {
  return fail(400, message, errors);
}

export function unauthorized(message = "Authentication required") {
  return fail(401, message);
}

export function forbidden(message = "You do not have permission to access this resource") {
  return fail(403, message);
}

export function notFound(message = "Resource not found") {
  return fail(404, message);
}

export function conflict(message = "Conflict", errors) {
  return fail(409, message, errors);
}

export function unprocessable(message = "Validation failed", errors) {
  return fail(422, message, errors);
}

export function serverError(message = "Internal Server Error") {
  return fail(500, message);
}
