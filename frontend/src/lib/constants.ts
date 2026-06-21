/**
 * Application-wide validation constants for carbon footprint input fields.
 *
 * These bounds mirror the constraints enforced at the Supabase Edge Function
 * layer, ensuring consistent validation between the client and server.
 *
 * @module constants
 */

// ── Transport ───────────────────────────────────────────────────────────────

/** Maximum personal car or transit distance per week in kilometres. */
export const MAX_KM_PER_WEEK = 20_000;

/** Maximum number of flights (short-haul or long-haul) per year. */
export const MAX_FLIGHTS_PER_YEAR = 200;

// ── Home Energy ─────────────────────────────────────────────────────────────

/** Maximum electricity or gas consumption per month in kWh. */
export const MAX_KWH_PER_MONTH = 100_000;

/** Maximum household size (persons sharing the home energy bill). */
export const MAX_HOUSEHOLD_SIZE = 50;

// ── Consumption ─────────────────────────────────────────────────────────────

/** Maximum monthly goods spending in USD. */
export const MAX_USD_PER_MONTH = 1_000_000;

/** Maximum weekly landfill waste in kilograms. */
export const MAX_WASTE_KG_PER_WEEK = 1_000;

// ── Community Tips ──────────────────────────────────────────────────────────

/** Maximum length (characters) for a community tip title. */
export const MAX_TIP_TITLE_LENGTH = 60;

/** Maximum length (characters) for a community tip description. */
export const MAX_TIP_DESC_LENGTH = 200;

/** Maximum length (characters) for a community tip author name. */
export const MAX_TIP_AUTHOR_LENGTH = 50;
