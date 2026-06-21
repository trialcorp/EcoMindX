/**
 * Display formatting helpers for emission values, category labels, and dates.
 *
 * All formatters are locale-aware and safe for screen-reader announcements.
 *
 * @module format
 */

/**
 * Format a kilogram CO₂e amount for user-facing display.
 *
 * @param kg - Emission value in kilograms.
 * @returns Locale-formatted string with "kg" suffix (e.g. `"1,235 kg"`).
 */
export function formatKg(kg: number): string {
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg`;
}

/**
 * Format a metric tonnes CO₂e amount for user-facing display.
 *
 * @param tonnes - Emission value in metric tonnes.
 * @returns Locale-formatted string with "t" suffix (e.g. `"2.5 t"`).
 */
export function formatTonnes(tonnes: number): string {
  return `${tonnes.toLocaleString(undefined, { maximumFractionDigits: 2 })} t`;
}

/** Human-friendly labels for each emission category key. */
const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  transport: "Transport",
  home: "Home energy",
  diet: "Diet",
  consumption: "Goods & waste",
};

/**
 * Map an emission category key to its user-friendly label.
 *
 * @param key - The raw category key (e.g. `"transport"`).
 * @returns The display label (e.g. `"Transport"`), falling back to the raw key.
 */
export function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key] ?? key;
}

/**
 * Format an ISO 8601 timestamp in the user's locale.
 *
 * @param iso - An ISO 8601 date string.
 * @returns A locale-formatted date/time string, or the original input if invalid.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}
