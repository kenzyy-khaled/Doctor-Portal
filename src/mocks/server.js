
import { createServer } from "miragejs";
import { MOCK_CONFIG, disablePersistence, enablePersistence, isPersistenceEnabled } from "./config";
import { models } from "./models";
import { factories } from "./factories";
import { seedDatabase } from "./seeds";
import { registerAuthRoutes } from "./routes/auth.routes";
import { registerDoctorRoutes } from "./routes/doctor.routes";
import { registerAppointmentRoutes } from "./routes/appointment.routes";
import { registerDashboardRoutes } from "./routes/dashboard.routes";
import { registerPatientRoutes } from "./routes/patient.routes";
import { registerTrainingRoutes } from "./routes/training.routes";

function restoreDatabase(server) {
  if (!isPersistenceEnabled()) {
    return false;
  }

  const raw = globalThis.localStorage?.getItem(MOCK_CONFIG.persistenceDbKey);
  if (!raw) {
    return false;
  }

  try {
    server.db.loadData(JSON.parse(raw));
    return true;
  } catch {
    return false;
  }
}

function persistDatabase(server) {
  if (!isPersistenceEnabled()) {
    return;
  }

  globalThis.localStorage?.setItem(
    MOCK_CONFIG.persistenceDbKey,
    JSON.stringify(server.db.dump()),
  );
}

function exposeMentorTools(server) {
  globalThis.__PRECLINIC_MOCK__ = {
    reset() {
      server.db.emptyData();
      seedDatabase(server);
      persistDatabase(server);
      return server.db.dump();
    },
    dump() {
      return server.db.dump();
    },
    enablePersistence() {
      enablePersistence();
      persistDatabase(server);
    },
    disablePersistence,
    setTiming(ms) {
      server.timing = Number(ms) || 0;
    },
  };
}

export function makeServer({ environment = "development" } = {}) {
  const server = createServer({
    environment,
    models,
    factories,
    seeds(serverInstance) {
      if (!restoreDatabase(serverInstance)) {
        seedDatabase(serverInstance);
      }
    },
    routes() {
      this.namespace = MOCK_CONFIG.namespace;
      this.timing = MOCK_CONFIG.timing;
      this.logging = environment !== "production";

      registerTrainingRoutes(this);
      registerAuthRoutes(this);
      registerDoctorRoutes(this);
      registerPatientRoutes(this);
      registerAppointmentRoutes(this);
      registerDashboardRoutes(this);

      if (this.pretender?.handledRequest) {
        const originalHandled = this.pretender.handledRequest.bind(this.pretender);
        this.pretender.handledRequest = (...args) => {
          originalHandled(...args);
          persistDatabase(this);
        };
      }

      this.passthrough();
      this.passthrough("/src/**", "/@vite/**", "/@fs/**", "/@id/**", "/node_modules/**");
    },
  });

  exposeMentorTools(server);
  return server;
}

export function shouldStartMockServer() {
  return !import.meta.env.VITE_API_BASE_URL;
}
