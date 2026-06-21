/**
 * Anonymous device identity management.
 *
 * Generates and persists a cryptographically random device identifier in
 * `localStorage`. This lets the application track footprint history without
 * requiring user authentication or storing personal data.
 *
 * @module deviceId
 */

/** The `localStorage` key under which the device ID is persisted. */
const STORAGE_KEY = "carbon_device_id";

/**
 * Generate a new random device identifier.
 *
 * Prefers the platform CSPRNG (`crypto.randomUUID`) for strong uniqueness
 * guarantees; falls back to a timestamp-based ID if the Web Crypto API is
 * unavailable.
 *
 * @returns A prefixed device identifier string (e.g. `"dev-a1b2c3d4..."`).
 */
function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `dev-${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `dev-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Retrieve the persistent anonymous device ID, creating and storing a new
 * one if none exists.
 *
 * If `localStorage` is unavailable (e.g. private browsing mode), an
 * ephemeral ID is returned that will not persist across sessions.
 *
 * @returns The current device identifier string.
 */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (e.g. privacy mode) — use an ephemeral id.
    return generateId();
  }
}
