import { describe, it, expect } from "vitest";
import { calculateFootprint } from "../lib/carbon/calculator";
import { emptyInput, type CarbonInput } from "../lib/types";

describe("calculateFootprint — edge cases", () => {
  it("returns zero transport for zero-km input", () => {
    const input = emptyInput();
    const result = calculateFootprint(input);
    expect(result.breakdown_kg.transport).toBe(0);
  });

  it("protects against household_size = 0 by using Math.max(1, ...)", () => {
    const input: CarbonInput = {
      ...emptyInput(),
      home: {
        electricity_kwh_per_month: 300,
        natural_gas_kwh_per_month: 100,
        household_size: 0, // Edge case: should be treated as 1
      },
    };
    const result = calculateFootprint(input);
    // With household_size 0, Math.max(1, 0) = 1, so no division by zero
    expect(result.breakdown_kg.home).toBeGreaterThan(0);
    expect(Number.isFinite(result.breakdown_kg.home)).toBe(true);
  });

  it("handles very large input values without overflow", () => {
    const input: CarbonInput = {
      ...emptyInput(),
      transport: {
        ...emptyInput().transport,
        car_km_per_week: 20_000,
        long_haul_flights_per_year: 200,
      },
    };
    const result = calculateFootprint(input);
    expect(Number.isFinite(result.total_annual_kg)).toBe(true);
    expect(result.total_annual_kg).toBeGreaterThan(0);
  });

  it("returns minimum diet emissions for vegan", () => {
    const veganInput: CarbonInput = {
      ...emptyInput(),
      diet: "vegan",
    };
    const meatInput: CarbonInput = {
      ...emptyInput(),
      diet: "heavy_meat",
    };
    const veganResult = calculateFootprint(veganInput);
    const meatResult = calculateFootprint(meatInput);
    expect(veganResult.breakdown_kg.diet).toBeLessThan(meatResult.breakdown_kg.diet);
  });

  it("total_annual_tonnes equals total_annual_kg / 1000", () => {
    const input: CarbonInput = {
      ...emptyInput(),
      transport: {
        ...emptyInput().transport,
        car_km_per_week: 100,
      },
      home: {
        electricity_kwh_per_month: 200,
        natural_gas_kwh_per_month: 50,
        household_size: 2,
      },
      diet: "medium_meat",
      consumption: {
        goods_spend_usd_per_month: 150,
        waste_kg_per_week: 5,
      },
    };
    const result = calculateFootprint(input);
    expect(result.total_annual_tonnes).toBeCloseTo(result.total_annual_kg / 1000, 2);
  });

  it("comparison ratios are correct relative to benchmarks", () => {
    const input: CarbonInput = {
      ...emptyInput(),
      diet: "medium_meat",
    };
    const result = calculateFootprint(input);
    expect(result.comparison.ratio_to_global_average).toBeCloseTo(
      result.total_annual_kg / result.comparison.global_average_annual_kg,
      2,
    );
    expect(result.comparison.ratio_to_sustainable_target).toBeCloseTo(
      result.total_annual_kg / result.comparison.sustainable_target_annual_kg,
      2,
    );
  });

  it("all breakdown values are non-negative", () => {
    const input = emptyInput();
    const result = calculateFootprint(input);
    expect(result.breakdown_kg.transport).toBeGreaterThanOrEqual(0);
    expect(result.breakdown_kg.home).toBeGreaterThanOrEqual(0);
    expect(result.breakdown_kg.diet).toBeGreaterThanOrEqual(0);
    expect(result.breakdown_kg.consumption).toBeGreaterThanOrEqual(0);
  });

  it("electric car produces lower transport emissions than petrol", () => {
    const base = emptyInput();
    const petrolInput: CarbonInput = {
      ...base,
      transport: { ...base.transport, car_km_per_week: 200, car_fuel: "petrol" },
    };
    const electricInput: CarbonInput = {
      ...base,
      transport: { ...base.transport, car_km_per_week: 200, car_fuel: "electric" },
    };
    const petrolResult = calculateFootprint(petrolInput);
    const electricResult = calculateFootprint(electricInput);
    expect(electricResult.breakdown_kg.transport).toBeLessThan(
      petrolResult.breakdown_kg.transport,
    );
  });
});
