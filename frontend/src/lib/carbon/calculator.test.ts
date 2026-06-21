import { describe, expect, it } from "vitest";
import { calculateFootprint } from "./calculator";
import type { CarbonInput } from "../types";

describe("Carbon Calculator Engine", () => {
  const baseInput: CarbonInput = {
    transport: {
      car_km_per_week: 0,
      car_fuel: "petrol",
      public_transit_km_per_week: 0,
      short_haul_flights_per_year: 0,
      long_haul_flights_per_year: 0,
    },
    home: {
      electricity_kwh_per_month: 0,
      natural_gas_kwh_per_month: 0,
      household_size: 1,
    },
    diet: "vegan",
    consumption: {
      goods_spend_usd_per_month: 0,
      waste_kg_per_week: 0,
    },
  };

  it("calculates a near-zero footprint for minimal inputs", () => {
    const result = calculateFootprint(baseInput);
    // Baseline emissions exist (diet base, footprint base from factors)
    expect(result.total_annual_kg).toBeGreaterThan(0);
    expect(result.breakdown_kg.transport).toBe(0);
    expect(result.breakdown_kg.home).toBe(0);
    expect(result.breakdown_kg.consumption).toBe(0);
    expect(result.breakdown_kg.diet).toBeGreaterThan(1000); // vegan base is ~1050
  });

  it("handles maximum possible inputs without breaking", () => {
    const maxInput: CarbonInput = {
      transport: {
        car_km_per_week: 20000,
        car_fuel: "diesel",
        public_transit_km_per_week: 20000,
        short_haul_flights_per_year: 200,
        long_haul_flights_per_year: 200,
      },
      home: {
        electricity_kwh_per_month: 100000,
        natural_gas_kwh_per_month: 100000,
        household_size: 1,
      },
      diet: "heavy_meat",
      consumption: {
        goods_spend_usd_per_month: 1000000,
        waste_kg_per_week: 1000,
      },
    };
    const result = calculateFootprint(maxInput);
    expect(result.total_annual_kg).toBeGreaterThan(100000); // Should be very large
    expect(result.total_annual_tonnes).toBe(result.total_annual_kg / 1000);
  });

  it("divides home energy emissions by household size", () => {
    const inputForOne: CarbonInput = {
      ...baseInput,
      home: { electricity_kwh_per_month: 500, natural_gas_kwh_per_month: 500, household_size: 1 },
    };
    const resultForOne = calculateFootprint(inputForOne);

    const inputForFour: CarbonInput = {
      ...baseInput,
      home: { electricity_kwh_per_month: 500, natural_gas_kwh_per_month: 500, household_size: 4 },
    };
    const resultForFour = calculateFootprint(inputForFour);

    // Minor rounding differences might occur, but it should be approximately 1/4th
    expect(resultForFour.breakdown_kg.home).toBeCloseTo(resultForOne.breakdown_kg.home / 4, -1);
  });

  it("calculates different car fuel emissions correctly", () => {
    const km = 100;
    const fuels: Array<CarbonInput["transport"]["car_fuel"]> = ["petrol", "diesel", "hybrid", "electric"];
    const results = fuels.map(fuel => {
      const input = { ...baseInput, transport: { ...baseInput.transport, car_km_per_week: km, car_fuel: fuel } };
      return calculateFootprint(input).breakdown_kg.transport;
    });

    // Diesel > Petrol > Hybrid > Electric
    expect(results[1]).toBeGreaterThan(results[0]); // Diesel > Petrol
    expect(results[0]).toBeGreaterThan(results[2]); // Petrol > Hybrid
    expect(results[2]).toBeGreaterThan(results[3]); // Hybrid > Electric
  });
});
