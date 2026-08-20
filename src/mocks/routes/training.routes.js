import { withGuards } from "../utils/handlers";
import { ok } from "../utils/response";
import { DEMO_ACCOUNTS } from "../data/catalog";
import { seedDatabase } from "../seeds";

export function registerTrainingRoutes(server) {
  server.get(
    "/health",
    withGuards(() =>
      ok({
        status: "ok",
        service: "Preclinic Training API",
        version: "2.1.0",
        timingMs: server.timing,
      }),
    ),
  );

  server.post(
    "/training/reset-db",
    withGuards(() => {
      server.db.emptyData();
      seedDatabase(server);
      return ok({
        reset: true,
        message: "Database restored to the original training dataset.",
        demoAccounts: DEMO_ACCOUNTS,
      });
    }),
  );
}
