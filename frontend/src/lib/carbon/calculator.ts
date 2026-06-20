import type { CarbonInput, FootprintResult } from "../types";
import * as factors from "./factors";

const round = (val: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
};

function _transport_annual_kg(t: CarbonInput["transport"]): number {
  const car = t.car_km_per_week * factors.WEEKS_PER_YEAR * factors.CAR_FACTORS_PER_KM[t.car_fuel];
  const transit =
    t.public_transit_km_per_week * factors.WEEKS_PER_YEAR * factors.PUBLIC_TRANSIT_PER_KM;
  const flights =
    t.short_haul_flights_per_year * factors.SHORT_HAUL_TRIP_KM * factors.FLIGHT_SHORT_HAUL_PER_KM +
    t.long_haul_flights_per_year * factors.LONG_HAUL_TRIP_KM * factors.FLIGHT_LONG_HAUL_PER_KM;
  return car + transit + flights;
}

function _home_annual_kg(h: CarbonInput["home"]): number {
  const electricity =
    h.electricity_kwh_per_month * factors.MONTHS_PER_YEAR * factors.ELECTRICITY_PER_KWH;
  const gas = h.natural_gas_kwh_per_month * factors.MONTHS_PER_YEAR * factors.NATURAL_GAS_PER_KWH;
  return (electricity + gas) / h.household_size;
}

function _consumption_annual_kg(c: CarbonInput["consumption"]): number {
  const goods =
    c.goods_spend_usd_per_month * factors.MONTHS_PER_YEAR * factors.GOODS_PER_USD_MONTHLY;
  const waste = c.waste_kg_per_week * factors.WEEKS_PER_YEAR * factors.WASTE_PER_KG;
  return goods + waste;
}

export function calculateFootprint(data: CarbonInput): FootprintResult {
  const breakdown: Record<string, number> = {
    transport: round(_transport_annual_kg(data.transport), 2),
    home: round(_home_annual_kg(data.home), 2),
    diet: round(factors.DIET_ANNUAL_KG[data.diet], 2),
    consumption: round(_consumption_annual_kg(data.consumption), 2),
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
