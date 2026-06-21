/**
 * Library barrel exports — shared utilities, types, and API functions.
 *
 * @module lib
 */

export * from "./types";
export * from "./constants";
export * from "./math";
export * from "./format";
export * from "./debounce";
export { getDeviceId } from "./deviceId";
export { supabase, isSupabaseConfigured } from "./supabaseClient";
