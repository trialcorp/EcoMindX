import type { CarFuel, DietType } from "../types";

export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;

export const CAR_FACTORS_PER_KM: Record<CarFuel, number> = {
  petrol: 0.17,
  diesel: 0.171,
  hybrid: 0.12,
  electric: 0.047,
};

export const PUBLIC_TRANSIT_PER_KM = 0.06;

export const FLIGHT_SHORT_HAUL_PER_KM = 0.158;
export const FLIGHT_LONG_HAUL_PER_KM = 0.15;

export const SHORT_HAUL_TRIP_KM = 1100.0;
export const LONG_HAUL_TRIP_KM = 6500.0;

export const ELECTRICITY_PER_KWH = 0.45;
export const NATURAL_GAS_PER_KWH = 0.183;

export const DIET_ANNUAL_KG: Record<DietType, number> = {
  heavy_meat: 3300.0,
  medium_meat: 2500.0,
  low_meat: 1900.0,
  pescatarian: 1700.0,
  vegetarian: 1500.0,
  vegan: 1050.0,
};

export const GOODS_PER_USD_MONTHLY = 0.4;
export const WASTE_PER_KG = 0.58;

export const GLOBAL_AVG_ANNUAL_KG = 4800.0;
export const SUSTAINABLE_TARGET_ANNUAL_KG = 2000.0;
