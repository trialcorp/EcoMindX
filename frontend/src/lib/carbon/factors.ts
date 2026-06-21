/**
 * Standardised emission conversion factors used by the carbon calculation engine.
 *
 * Sources:
 * - Transport factors: UK DEFRA 2023 GHG Conversion Factors
 *   https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023
 * - Electricity grid average: IEA World Energy Outlook 2023 (global weighted mean)
 * - Diet baselines: Scarborough et al. (2014) "Dietary greenhouse gas emissions of
 *   meat-eaters, fish-eaters, vegetarians and vegans in the UK", Climatic Change
 * - Goods & waste factors: US EPA Waste Reduction Model (WARM) v15
 *
 * @module factors
 */

import type { CarFuel, DietType } from "../types";

// ── Time Constants ──────────────────────────────────────────────────────────

/** Number of weeks in one calendar year. */
export const WEEKS_PER_YEAR = 52;

/** Number of months in one calendar year. */
export const MONTHS_PER_YEAR = 12;

// ── Transport ───────────────────────────────────────────────────────────────

/** Per-kilometre CO₂e emissions for each car fuel type (kg CO₂e / km). */
export const CAR_FACTORS_PER_KM: Readonly<Record<CarFuel, number>> = {
  petrol: 0.17,
  diesel: 0.171,
  hybrid: 0.12,
  electric: 0.047,
};

/** Per-kilometre CO₂e emissions for public transit (kg CO₂e / km). */
export const PUBLIC_TRANSIT_PER_KM = 0.06;

/** Per-kilometre CO₂e emissions for short-haul flights (kg CO₂e / passenger-km). */
export const FLIGHT_SHORT_HAUL_PER_KM = 0.158;

/** Per-kilometre CO₂e emissions for long-haul flights (kg CO₂e / passenger-km). */
export const FLIGHT_LONG_HAUL_PER_KM = 0.15;

/** Average one-way distance for a short-haul flight in kilometres. */
export const SHORT_HAUL_TRIP_KM = 1100.0;

/** Average one-way distance for a long-haul flight in kilometres. */
export const LONG_HAUL_TRIP_KM = 6500.0;

// ── Home Energy ─────────────────────────────────────────────────────────────

/** Grid electricity emission factor (kg CO₂e / kWh, global weighted average). */
export const ELECTRICITY_PER_KWH = 0.45;

/** Natural gas emission factor (kg CO₂e / kWh). */
export const NATURAL_GAS_PER_KWH = 0.183;

// ── Diet ────────────────────────────────────────────────────────────────────

/** Annual dietary emissions by preference type (kg CO₂e / year). */
export const DIET_ANNUAL_KG: Readonly<Record<DietType, number>> = {
  heavy_meat: 3300.0,
  medium_meat: 2500.0,
  low_meat: 1900.0,
  pescatarian: 1700.0,
  vegetarian: 1500.0,
  vegan: 1050.0,
};

// ── Consumption & Waste ─────────────────────────────────────────────────────

/** Emission factor for consumer goods purchases (kg CO₂e / USD / month). */
export const GOODS_PER_USD_MONTHLY = 0.4;

/** Emission factor for landfill waste (kg CO₂e / kg of waste). */
export const WASTE_PER_KG = 0.58;

// ── Benchmarks ──────────────────────────────────────────────────────────────

/** Global average individual annual emissions in kg CO₂e (4.8 tonnes). */
export const GLOBAL_AVG_ANNUAL_KG = 4800.0;

/**
 * Paris-aligned sustainable individual annual target in kg CO₂e (2.0 tonnes).
 * Derived from the IPCC 1.5°C budget divided by world population.
 */
export const SUSTAINABLE_TARGET_ANNUAL_KG = 2000.0;
