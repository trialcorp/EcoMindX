/**
 * Core carbon footprint calculation engine.
 *
 * Converts structured lifestyle input data into an annual emission breakdown
 * using standardised DEFRA/EPA conversion factors. All calculations run
 * locally in the browser for instant UI feedback.
 *
 * @module calculator
 */

import type { CarbonInput, EmissionBreakdown, FootprintResult } from "../types";
import { round } from "../math";
import * as factors from "./factors";

/**
 * Calculate annual transport emissions from personal car, public transit,
 * and aviation travel.
 *
 * @param t - The user's weekly transport data.
 * @returns Annual transport emissions in kg CO₂e.
 */
function computeTransportAnnualKg(t: CarbonInput["transport"]): number {
  const car = t.car_km_per_week * factors.WEEKS_PER_YEAR * factors.CAR_FACTORS_PER_KM[t.car_fuel];
  const transit =
    t.public_transit_km_per_week * factors.WEEKS_PER_YEAR * factors.PUBLIC_TRANSIT_PER_KM;
  const flights =
    t.short_haul_flights_per_year * factors.SHORT_HAUL_TRIP_KM * factors.FLIGHT_SHORT_HAUL_PER_KM +
    t.long_haul_flights_per_year * factors.LONG_HAUL_TRIP_KM * factors.FLIGHT_LONG_HAUL_PER_KM;
  return car + transit + flights;
}

/**
 * Calculate annual home energy emissions divided by household size.
 *
 * @param h - The user's monthly home energy data.
 * @returns Annual home energy emissions per person in kg CO₂e.
 */
function computeHomeAnnualKg(h: CarbonInput["home"]): number {
  const electricity =
    h.electricity_kwh_per_month * factors.MONTHS_PER_YEAR * factors.ELECTRICITY_PER_KWH;
  const gas = h.natural_gas_kwh_per_month * factors.MONTHS_PER_YEAR * factors.NATURAL_GAS_PER_KWH;
  return (electricity + gas) / Math.max(1, h.household_size);
}

/**
 * Calculate annual emissions from consumer goods and landfill waste.
 *
 * @param c - The user's monthly consumption data.
 * @returns Annual consumption emissions in kg CO₂e.
 */
function computeConsumptionAnnualKg(c: CarbonInput["consumption"]): number {
  const goods =
    c.goods_spend_usd_per_month * factors.MONTHS_PER_YEAR * factors.GOODS_PER_USD_MONTHLY;
  const waste = c.waste_kg_per_week * factors.WEEKS_PER_YEAR * factors.WASTE_PER_KG;
  return goods + waste;
}

/**
 * Compute the complete annual carbon footprint for the given lifestyle inputs.
 *
 * The result includes a per-category breakdown, total emissions, and
 * comparisons against the global average and sustainable Paris-aligned target.
 *
 * @param data - Structured lifestyle input from the calculator wizard.
 * @returns A complete {@link FootprintResult} with breakdown and comparisons.
 *
 * @example
 * ```ts
 * const result = calculateFootprint(emptyInput());
 * console.log(result.total_annual_tonnes); // 2.5
 * ```
 */
export function calculateFootprint(data: CarbonInput): FootprintResult {
  const breakdown: EmissionBreakdown = {
    transport: round(computeTransportAnnualKg(data.transport), 2),
    home: round(computeHomeAnnualKg(data.home), 2),
    diet: round(factors.DIET_ANNUAL_KG[data.diet], 2),
    consumption: round(computeConsumptionAnnualKg(data.consumption), 2),
  };

  const total = round(
    breakdown.transport + breakdown.home + breakdown.diet + breakdown.consumption,
    2,
  );

  const comparison = {
    global_average_annual_kg: factors.GLOBAL_AVG_ANNUAL_KG,
    sustainable_target_annual_kg: factors.SUSTAINABLE_TARGET_ANNUAL_KG,
    ratio_to_global_average: round(total / factors.GLOBAL_AVG_ANNUAL_KG, 3),
    ratio_to_sustainable_target: round(total / factors.SUSTAINABLE_TARGET_ANNUAL_KG, 3),
  };

  return {
    breakdown_kg: breakdown,
    total_annual_kg: total,
    total_annual_tonnes: round(total / 1000, 3),
    comparison,
  };
}
