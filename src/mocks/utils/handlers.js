import { requireAuth } from "./auth";
import { simulateError } from "./http";

export function withGuards(handler, { auth = false, role } = {}) {
  return (schema, request) => {
    const simulated = simulateError(request);
    if (simulated) {
      return simulated;
    }

    if (auth) {
      const result = requireAuth(schema, request, role);
      if (result.error) {
        return result.error;
      }
      request.authUser = result.user;
    }

    return handler(schema, request);
  };
}
