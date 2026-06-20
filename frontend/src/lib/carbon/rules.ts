import type { CarbonInput, FootprintResult, InsightsResponse, Recommendation, DietType } from "../types";
import * as factors from "./factors";

const _FLIGHT_REDUCTION_SHARE = 0.5;
const _HOME_ENERGY_REDUCTION_SHARE = 0.33;
const _CONSUMPTION_REDUCTION_SHARE = 0.25;
const _GENERIC_TRANSPORT_REDUCTION_SHARE = 0.2;

const _DIET_LADDER: DietType[] = [
  "heavy_meat",
  "medium_meat",
  "low_meat",
  "pescatarian",
  "vegetarian",
  "vegan",
];

const round = (val: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
};

function _transport_recommendation(data: CarbonInput, amount: number): Recommendation | null {
  const t = data.transport;
  const flights_km =
    t.short_haul_flights_per_year * factors.SHORT_HAUL_TRIP_KM +
    t.long_haul_flights_per_year * factors.LONG_HAUL_TRIP_KM;
  const car_km_year = t.car_km_per_week * factors.WEEKS_PER_YEAR;
  const car_emissions = car_km_year * factors.CAR_FACTORS_PER_KM[t.car_fuel];
  const flying = t.short_haul_flights_per_year + t.long_haul_flights_per_year > 0;

  if (flying && flights_km * factors.FLIGHT_LONG_HAUL_PER_KM > car_emissions) {
    return {
      category: "transport",
      action:
        "Replace one or more flights per year with rail or video calls, and combine trips to halve your aviation emissions.",
      estimated_annual_savings_kg: round(_FLIGHT_REDUCTION_SHARE * amount, 2),
    };
  }

  if (t.car_km_per_week > 0 && t.car_fuel !== "electric") {
    const current = car_km_year * factors.CAR_FACTORS_PER_KM[t.car_fuel];
    const electric = car_km_year * factors.CAR_FACTORS_PER_KM["electric"];
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
      estimated_annual_savings_kg: round(_GENERIC_TRANSPORT_REDUCTION_SHARE * amount, 2),
    };
  }

  return null;
}

function _home_recommendation(amount: number): Recommendation | null {
  if (amount <= 0) return null;
  return {
    category: "home",
    action:
      "Switch to a renewable electricity tariff and improve insulation/thermostat settings to cut roughly a third of home energy emissions.",
    estimated_annual_savings_kg: round(_HOME_ENERGY_REDUCTION_SHARE * amount, 2),
  };
}

function _diet_recommendation(data: CarbonInput): Recommendation | null {
  const current = data.diet;
  const idx = _DIET_LADDER.indexOf(current);
  if (idx === -1 || idx >= _DIET_LADDER.length - 1) {
    return null;
  }
  const target = _DIET_LADDER[idx + 1];
  const saving = round(factors.DIET_ANNUAL_KG[current] - factors.DIET_ANNUAL_KG[target], 2);
  if (saving <= 0) return null;
  return {
    category: "diet",
    action: `Shift toward a ${target.replace("_", " ")} diet — even a few plant-based days each week meaningfully lowers food emissions.`,
    estimated_annual_savings_kg: saving,
  };
}

function _consumption_recommendation(amount: number): Recommendation | null {
  if (amount <= 0) return null;
  return {
    category: "consumption",
    action:
      "Buy less and choose durable, second-hand or repairable goods, and reduce landfill waste by recycling and composting.",
    estimated_annual_savings_kg: round(_CONSUMPTION_REDUCTION_SHARE * amount, 2),
  };
}

export function generateRuleBasedInsights(data: CarbonInput, result: FootprintResult): InsightsResponse {
  const builders: Record<string, (amt: number) => Recommendation | null> = {
    transport: (amt) => _transport_recommendation(data, amt),
    home: (amt) => _home_recommendation(amt),
    diet: () => _diet_recommendation(data),
    consumption: (amt) => _consumption_recommendation(amt),
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
