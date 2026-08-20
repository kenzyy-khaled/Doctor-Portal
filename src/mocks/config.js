export const MOCK_CONFIG = {
  namespace: "api",
  timing: 700,
  persistenceFlagKey: "preclinic.persist",
  persistenceDbKey: "preclinic.mirage.db.v2",
  tokenPrefix: "pc",
  tokenTtlMs: 24 * 60 * 60 * 1000,
};

export function isPersistenceEnabled() {
  return globalThis.localStorage?.getItem(MOCK_CONFIG.persistenceFlagKey) !== "false";
}

export function enablePersistence() {
  globalThis.localStorage?.setItem(MOCK_CONFIG.persistenceFlagKey, "true");
}

export function disablePersistence() {
  globalThis.localStorage?.setItem(MOCK_CONFIG.persistenceFlagKey, "false");
  globalThis.localStorage?.removeItem(MOCK_CONFIG.persistenceDbKey);
}
