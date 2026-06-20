import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Types ---
interface CarbonInput {
  transport: {
    car_km_per_week: number;
    car_fuel: "petrol" | "diesel" | "hybrid" | "electric";
    public_transit_km_per_week: number;
    short_haul_flights_per_year: number;
    long_haul_flights_per_year: number;
  };
  home: {
    electricity_kwh_per_month: number;
    natural_gas_kwh_per_month: number;
    household_size: number;
  };
  diet: "heavy_meat" | "medium_meat" | "low_meat" | "pescatarian" | "vegetarian" | "vegan";
  consumption: {
    goods_spend_usd_per_month: number;
    waste_kg_per_week: number;
  };
}

interface FootprintResult {
  breakdown_kg: Record<string, number>;
  total_annual_kg: number;
  total_annual_tonnes: number;
  comparison: {
    global_average_annual_kg: number;
    sustainable_target_annual_kg: number;
    ratio_to_global_average: number;
    ratio_to_sustainable_target: number;
  };
}

interface Recommendation {
  category: string;
  action: string;
  estimated_annual_savings_kg: number;
}

interface InsightsResponse {
  summary: string;
  recommendations: Recommendation[];
  source: "gemini" | "rules";
}

// --- Rules Fallback Code ---
const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

const CAR_FACTORS_PER_KM = {
  petrol: 0.170,
  diesel: 0.171,
  hybrid: 0.120,
  electric: 0.047,
};

const FLIGHT_SHORT_HAUL_PER_KM = 0.158;
const FLIGHT_LONG_HAUL_PER_KM = 0.150;
const SHORT_HAUL_TRIP_KM = 1100.0;
const LONG_HAUL_TRIP_KM = 6500.0;

const DIET_ANNUAL_KG = {
  heavy_meat: 3300.0,
  medium_meat: 2500.0,
  low_meat: 1900.0,
  pescatarian: 1700.0,
  vegetarian: 1500.0,
  vegan: 1050.0,
};

const SUSTAINABLE_TARGET_ANNUAL_KG = 2000.0;

const _FLIGHT_REDUCTION_SHARE = 0.5;
const _HOME_ENERGY_REDUCTION_SHARE = 0.33;
const _CONSUMPTION_REDUCTION_SHARE = 0.25;
const _GENERIC_TRANSPORT_REDUCTION_SHARE = 0.2;

const _DIET_LADDER = [
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
    t.short_haul_flights_per_year * SHORT_HAUL_TRIP_KM +
    t.long_haul_flights_per_year * LONG_HAUL_TRIP_KM;
  const car_km_year = t.car_km_per_week * WEEKS_PER_YEAR;
  const car_emissions = car_km_year * CAR_FACTORS_PER_KM[t.car_fuel];
  const flying = t.short_haul_flights_per_year + t.long_haul_flights_per_year > 0;

  if (flying && flights_km * FLIGHT_LONG_HAUL_PER_KM > car_emissions) {
    return {
      category: "transport",
      action:
        "Replace one or more flights per year with rail or video calls, and combine trips to halve your aviation emissions.",
      estimated_annual_savings_kg: round(_FLIGHT_REDUCTION_SHARE * amount, 2),
    };
  }

  if (t.car_km_per_week > 0 && t.car_fuel !== "electric") {
    const current = car_km_year * CAR_FACTORS_PER_KM[t.car_fuel];
    const electric = car_km_year * CAR_FACTORS_PER_KM["electric"];
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
  const saving = round(DIET_ANNUAL_KG[current] - DIET_ANNUAL_KG[target as keyof typeof DIET_ANNUAL_KG], 2);
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

function generateRuleBasedInsights(data: CarbonInput, result: FootprintResult): InsightsResponse {
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
  const target = SUSTAINABLE_TARGET_ANNUAL_KG;
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

// --- Main Handler ---
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { data, result } = body as { data: CarbonInput; result: FootprintResult };

    if (!data || !result) {
      throw new Error("Missing 'data' or 'result' in request body");
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.log("No GEMINI_API_KEY environment variable set. Falling back to rules engine.");
      return new Response(JSON.stringify(generateRuleBasedInsights(data, result)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Carbon footprint breakdown (kg CO2e per year):
${JSON.stringify(result.breakdown_kg)}
Total: ${result.total_annual_kg} kg/yr (${result.total_annual_tonnes} t/yr).
Sustainable target: ${result.comparison.sustainable_target_annual_kg} kg/yr.
Diet: ${data.diet}. Car fuel: ${data.transport.car_fuel}.
Give tailored advice to reduce the largest sources.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: "You are a concise, encouraging sustainability coach. Given a person's annual carbon footprint breakdown (kg CO2e), produce a short summary and 2-4 specific, realistic actions that target their largest emission sources. Each action must include an estimated annual saving in kg CO2e. Be practical and non-judgmental.",
          },
        ],
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            summary: { type: "STRING" },
            recommendations: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  category: { type: "STRING" },
                  action: { type: "STRING" },
                  estimated_annual_savings_kg: { type: "NUMBER" },
                },
                required: ["category", "action", "estimated_annual_savings_kg"],
              },
            },
          },
          required: ["summary", "recommendations"],
        },
        temperature: 0.4,
      },
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}: ${await response.text()}`);
    }

    const resJson = await response.json();
    const candidateText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Invalid response format from Gemini API");
    }

    const payload = JSON.parse(candidateText);
    const recommendations = (payload.recommendations || []).map((r: any) => ({
      category: String(r.category),
      action: String(r.action),
      estimated_annual_savings_kg: round(Number(r.estimated_annual_savings_kg), 2),
    }));

    if (recommendations.length === 0) {
      throw new Error("Gemini returned zero recommendations");
    }

    const responsePayload: InsightsResponse = {
      summary: String(payload.summary),
      recommendations: recommendations.slice(0, 4),
      source: "gemini",
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in insights generation, falling back to rule-based engine:", error);
    try {
      const body = await req.json();
      const { data, result } = body as { data: CarbonInput; result: FootprintResult };
      return new Response(JSON.stringify(generateRuleBasedInsights(data, result)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fallbackError) {
      return new Response(JSON.stringify({ error: "Failed to generate insights: " + error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
});
