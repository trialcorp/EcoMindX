import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS = ["http://localhost:5173", "https://ecomindx.vercel.app"];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("Origin");
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
};

// --- Types ---
interface CarbonInput {
  transport: {
    car_km_per_week: number;
    car_fuel: string;
    public_transit_km_per_week: number;
    short_haul_flights_per_year: number;
    long_haul_flights_per_year: number;
  };
  home: {
    electricity_kwh_per_month: number;
    natural_gas_kwh_per_month: number;
    household_size: number;
  };
  diet: string;
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

const round = (val: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
};

// --- Main Handler ---
// Note: Fallback rules engine is handled strictly by the client (api.ts) to avoid DRY violations.
// This edge function only attempts Gemini AI generation and returns 503 if unavailable.
Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Enforce request size limit (100 KB max)
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 102400) {
      return new Response(JSON.stringify({ error: "Request body too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { data, result } = body as { data: CarbonInput; result: FootprintResult };

    if (!data || !result) {
      throw new Error("Missing 'data' or 'result' in request body");
    }

    // Validate required nested fields
    if (!data.transport || !data.home || !data.diet || !data.consumption) {
      throw new Error("Incomplete input data: transport, home, diet, and consumption are required");
    }
    if (!result.breakdown_kg || typeof result.total_annual_kg !== "number") {
      throw new Error("Incomplete result data: breakdown_kg and total_annual_kg are required");
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
    const recommendations = (payload.recommendations || []).map((r: Record<string, unknown>) => ({
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Error in insights generation:", error.message);

    // Return 503 Service Unavailable so the client knows to use its local fallback
    return new Response(JSON.stringify({ error: "Failed to generate insights: " + error.message }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
