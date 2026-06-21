/**
 * Deterministic rule-based recommendation engine.
 *
 * Generates actionable, prioritised carbon reduction advice without relying
 * on external AI services. Used as the primary fallback when the Gemini Edge
 * Function is unavailable, rate-limited, or returns an invalid response.
 *
 * @module rules
 */

import type {
  CarbonInput,
  FootprintResult,
  InsightsResponse,
  Recommendation,
  DietType,
} from "../types";
import { round } from "../math";
import * as factors from "./factors";

/** Share of flight emissions assumed reducible by switching to rail/video calls. */
const FLIGHT_REDUCTION_SHARE = 0.5;

/** Share of home energy assumed reducible via renewable tariffs and insulation. */
const HOME_ENERGY_REDUCTION_SHARE = 0.33;

/** Share of consumption emissions assumed reducible via buying less. */
const CONSUMPTION_REDUCTION_SHARE = 0.25;

/** Generic transport reduction share for minor commute changes. */
const GENERIC_TRANSPORT_REDUCTION_SHARE = 0.2;

/**
 * Ordered progression of diets from highest to lowest emissions.
 * Used to suggest the next-step-down diet change.
 */
const DIET_LADDER: readonly DietType[] = [
  "heavy_meat",
  "medium_meat",
  "low_meat",
  "pescatarian",
  "vegetarian",
  "vegan",
];

/**
 * Generate a transport-specific recommendation based on the user's travel patterns.
 *
 * @param data   - The full carbon input containing transport details.
 * @param amount - The annual transport emission in kg CO₂e.
 * @returns A targeted transport recommendation, or `null` if emissions are zero.
 */
function buildTransportRecommendation(data: CarbonInput, amount: number): Recommendation | null {
  const t = data.transport;
  const flightsKm =
    t.short_haul_flights_per_year * factors.SHORT_HAUL_TRIP_KM +
    t.long_haul_flights_per_year * factors.LONG_HAUL_TRIP_KM;
  const carKmYear = t.car_km_per_week * factors.WEEKS_PER_YEAR;
  const carEmissions = carKmYear * factors.CAR_FACTORS_PER_KM[t.car_fuel];
  const isFlying = t.short_haul_flights_per_year + t.long_haul_flights_per_year > 0;

  if (isFlying && flightsKm * factors.FLIGHT_LONG_HAUL_PER_KM > carEmissions) {
    return {
      category: "transport",
      action:
        "Replace one or more flights per year with rail or video calls, and combine trips to halve your aviation emissions.",
      estimated_annual_savings_kg: round(FLIGHT_REDUCTION_SHARE * amount, 2),
    };
  }

  if (t.car_km_per_week > 0 && t.car_fuel !== "electric") {
    const current = carKmYear * factors.CAR_FACTORS_PER_KM[t.car_fuel];
    const electric = carKmYear * factors.CAR_FACTORS_PER_KM["electric"];
    const saving = round(current - electric, 2);
    if (saving > 0) {
      return {
        category: "transport",
        action:
          "Shift short car trips to walking, cycling or public transit, and consider an electric vehicle for the rest.",
        estimated_annual_savings_kg: saving,
      };
    }
  }

  if (amount > 0) {
    return {
      category: "transport",
      action: "Carpool or use public transit for routine journeys to cut transport emissions.",
      estimated_annual_savings_kg: round(GENERIC_TRANSPORT_REDUCTION_SHARE * amount, 2),
    };
  }

  return null;
}

/**
 * Generate a home energy recommendation.
 *
 * @param amount - Annual home energy emissions in kg CO₂e.
 * @returns A home energy recommendation, or `null` if emissions are zero.
 */
function buildHomeRecommendation(amount: number): Recommendation | null {
  if (amount <= 0) return null;
  return {
    category: "home",
    action:
      "Switch to a renewable electricity tariff and improve insulation/thermostat settings to cut roughly a third of home energy emissions.",
    estimated_annual_savings_kg: round(HOME_ENERGY_REDUCTION_SHARE * amount, 2),
  };
}

/**
 * Generate a dietary recommendation by suggesting the next step down the diet ladder.
 *
 * @param data - The full carbon input containing the current diet type.
 * @returns A diet recommendation, or `null` if the user is already vegan.
 */
function buildDietRecommendation(data: CarbonInput): Recommendation | null {
  const current = data.diet;
  const idx = DIET_LADDER.indexOf(current);
  if (idx === -1 || idx >= DIET_LADDER.length - 1) {
    return null;
  }
  const target = DIET_LADDER[idx + 1];
  const saving = round(factors.DIET_ANNUAL_KG[current] - factors.DIET_ANNUAL_KG[target], 2);
  if (saving <= 0) return null;
  return {
    category: "diet",
    action: `Shift toward a ${target.replace("_", " ")} diet — even a few plant-based days each week meaningfully lowers food emissions.`,
    estimated_annual_savings_kg: saving,
  };
}

/**
 * Generate a consumption and waste recommendation.
 *
 * @param amount - Annual consumption emissions in kg CO₂e.
 * @returns A consumption recommendation, or `null` if emissions are zero.
 */
function buildConsumptionRecommendation(amount: number): Recommendation | null {
  if (amount <= 0) return null;
  return {
    category: "consumption",
    action:
      "Buy less and choose durable, second-hand or repairable goods, and reduce landfill waste by recycling and composting.",
    estimated_annual_savings_kg: round(CONSUMPTION_REDUCTION_SHARE * amount, 2),
  };
}

/**
 * Generate a complete set of rule-based insights by analysing the user's
 * footprint breakdown and producing prioritised recommendations.
 *
 * Recommendations are ranked by the user's highest-emission categories first,
 * ensuring the most impactful actions appear at the top.
 *
 * @param data   - The structured lifestyle input.
 * @param result - The pre-computed footprint result with per-category breakdown.
 * @returns An {@link InsightsResponse} with summary, recommendations, and `source: "rules"`.
 */
export function generateRuleBasedInsights(
  data: CarbonInput,
  result: FootprintResult,
): InsightsResponse {
  const builders: Record<string, (amt: number) => Recommendation | null> = {
    transport: (amt) => buildTransportRecommendation(data, amt),
    home: (amt) => buildHomeRecommendation(amt),
    diet: () => buildDietRecommendation(data),
    consumption: (amt) => buildConsumptionRecommendation(amt),
  };

  const ranked = Object.entries(result.breakdown_kg).sort((a, b) => b[1] - a[1]);

  const recommendations: Recommendation[] = [];
  for (const [category, amount] of ranked) {
    const rec = builders[category](amount);
    if (rec !== null) {
      recommendations.push(rec);
    }
  }

  const total = result.total_annual_kg;
  const target = factors.SUSTAINABLE_TARGET_ANNUAL_KG;
  let summary = "";

  if (total <= target) {
    summary = `Your estimated footprint is ${result.total_annual_tonnes} t CO2e/yr — at or below the sustainable target of ${(target / 1000).toFixed(1)} t. Keep it up, and lock in these habits.`;
  } else {
    const over = round((total - target) / 1000, 2);
    summary = `Your estimated footprint is ${result.total_annual_tonnes} t CO2e/yr, about ${over} t above the sustainable target of ${(target / 1000).toFixed(1)} t. The actions below target your biggest sources first for the fastest reductions.`;
  }

  return {
    summary,
    recommendations: recommendations.slice(0, 4),
    source: "rules",
  };
}
