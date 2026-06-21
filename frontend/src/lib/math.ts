/**
 * Shared mathematical utilities for the EcoMindX carbon calculation engine.
 *
 * @module math
 */

/**
 * Round a numeric value to a specified number of decimal places using
 * the "round half away from zero" strategy.
 *
 * @param value    - The number to round.
 * @param decimals - The number of decimal places to retain (must be ≥ 0).
 * @returns The rounded number.
 *
 * @example
 * ```ts
 * round(3.14159, 2); // 3.14
 * round(1005, -1);   // 1010
 * ```
 */
export function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Clamp a number within a closed `[min, max]` interval.
 *
 * @param value - The value to clamp.
 * @param min   - Lower bound (inclusive).
 * @param max   - Upper bound (inclusive).
 * @returns The clamped value.
 *
 * @example
 * ```ts
 * clamp(150, 0, 100); // 100
 * clamp(-5, 0, 100);  // 0
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
