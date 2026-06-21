/**
 * Supabase client singleton.
 *
 * Initialises the Supabase JS client with environment-provided credentials.
 * Falls back to placeholder values during development/build when environment
 * variables are not set, falling back to placeholder values.
 *
 * @module supabaseClient
 */

import { createClient } from "@supabase/supabase-js";

/** Supabase project URL from the Vite environment, or a placeholder. */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-url.supabase.co";

/** Supabase anonymous public key from the Vite environment, or a placeholder. */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

/**
 * Whether the Supabase client has been configured with real credentials.
 *
 * When `false`, database operations will fail silently or return fallback
 * values. The Account panel displays a setup warning in this state.
 */
export const isSupabaseConfigured =
  supabaseUrl !== "https://placeholder-url.supabase.co" && supabaseAnonKey !== "placeholder-key";

// When isSupabaseConfigured is false, the AccountPanel displays a setup warning banner.

/** The global Supabase client instance used by all API functions. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
