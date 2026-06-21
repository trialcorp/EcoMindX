import { describe, expect, it } from "vitest";
import { generateRuleBasedInsights } from "./rules";
import type { CarbonInput, FootprintResult } from "../types";

describe("Rules Engine", () => {
  const baseInput: CarbonInput = {
    transport: {
      car_km_per_week: 0,
      car_fuel: "petrol",
      public_transit_km_per_week: 0,
      short_haul_flights_per_year: 0,
      long_haul_flights_per_year: 0,
    },
    home: { electricity_kwh_per_month: 0, natural_gas_kwh_per_month: 0, household_size: 1 },
    diet: "vegan",
    consumption: { goods_spend_usd_per_month: 0, waste_kg_per_week: 0 },
  };

  const baseResult: FootprintResult = {
    breakdown_kg: { transport: 0, home: 0, diet: 1050, consumption: 0 },
    total_annual_kg: 1050,
    total_annual_tonnes: 1.05,
    comparison: {
      global_average_annual_kg: 4800,
      sustainable_target_annual_kg: 2000,
      ratio_to_global_average: 0.2,
      ratio_to_sustainable_target: 0.5,
    },
  };

  it("generates a positive summary when under the sustainable target", () => {
    const insights = generateRuleBasedInsights(baseInput, baseResult);
    expect(insights.summary).toContain("at or below the sustainable target");
  });

  it("generates a warning summary when over the sustainable target", () => {
    const highResult = { ...baseResult, total_annual_kg: 5000, total_annual_tonnes: 5.0 };
    const insights = generateRuleBasedInsights(baseInput, highResult);
    expect(insights.summary).toContain("above the sustainable target");
  });

  it("prioritizes recommendations based on the largest emission categories", () => {
    const highHomeResult = {
      ...baseResult,
      breakdown_kg: { transport: 500, home: 4000, diet: 1500, consumption: 200 },
      total_annual_kg: 6200,
    };
    const input: CarbonInput = { ...baseInput, diet: "vegetarian" };
    const insights = generateRuleBasedInsights(input, highHomeResult);

    // Should return max 4 recommendations
    expect(insights.recommendations.length).toBeLessThanOrEqual(4);

    // Highest category (home) should be first
    expect(insights.recommendations[0].category).toBe("home");
    expect(insights.recommendations[0].action).toContain("insulation");
  });

  it("suggests electric vehicles if driving petrol/diesel", () => {
    const transportResult = {
      ...baseResult,
      breakdown_kg: { ...baseResult.breakdown_kg, transport: 2000 },
    };
    const input: CarbonInput = {
      ...baseInput,
      transport: { ...baseInput.transport, car_km_per_week: 200, car_fuel: "petrol" },
    };
    const insights = generateRuleBasedInsights(input, transportResult);

    const transportRec = insights.recommendations.find((r) => r.category === "transport");
    expect(transportRec).toBeDefined();
    expect(transportRec?.action).toContain("electric vehicle");
  });

  it("suggests flying less if flights dominate transport emissions", () => {
    const transportResult = {
      ...baseResult,
      breakdown_kg: { ...baseResult.breakdown_kg, transport: 5000 },
    };
    const input: CarbonInput = {
      ...baseInput,
      transport: { ...baseInput.transport, long_haul_flights_per_year: 3 },
    };
    const insights = generateRuleBasedInsights(input, transportResult);

    const transportRec = insights.recommendations.find((r) => r.category === "transport");
    expect(transportRec).toBeDefined();
    expect(transportRec?.action).toContain("flights");
  });
});
