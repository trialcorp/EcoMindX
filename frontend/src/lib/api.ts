import type { CarbonInput, Entry, FootprintResult, InsightsResponse, LeaderboardEntry, CommunityTip } from "./types";
import { calculateFootprint } from "./carbon/calculator";
import { generateRuleBasedInsights } from "./carbon/rules";
import { supabase } from "./supabaseClient";

/** Compute the annual footprint breakdown for the given lifestyle lifestyle inputs. */
export async function calculate(input: CarbonInput): Promise<FootprintResult> {
  return calculateFootprint(input);
}

/** Fetch personalized reduction advice (Gemini Edge Function with local rule-based fallback). */
export async function getInsights(input: CarbonInput): Promise<InsightsResponse> {
  const result = calculateFootprint(input);
  try {
    const { data, error } = await supabase.functions.invoke("insights", {
      body: { data: input, result },
    });

    if (error || !data) {
      console.warn("Supabase Edge Function insights failed, using local rules fallback:", error);
      return generateRuleBasedInsights(input, result);
    }

    return data as InsightsResponse;
  } catch (err) {
    console.warn("Error invoking insights Edge Function, using local rules fallback:", err);
    return generateRuleBasedInsights(input, result);
  }
}

/** Save a footprint snapshot to the database, linking to user_id if logged in. */
export async function saveEntry(
  deviceId: string,
  input: CarbonInput,
  result: FootprintResult,
  userId?: string,
): Promise<Entry> {
  const payload: Record<string, unknown> = {
    device_id: deviceId,
    input,
    result,
  };
  
  if (userId) {
    payload.user_id = userId;
  }

  const { data, error } = await supabase
    .from("entries")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save entry: ${error.message}`);
  }

  return data as Entry;
}

/** List saved entries: either matching user_id if logged in, or fallback to deviceId. */
export async function listEntries(deviceId: string, userId?: string): Promise<Entry[]> {
  let query;
  if (userId) {
    query = supabase
      .from("entries")
      .select("*")
      .eq("user_id", userId);
  } else {
    // Maintain exact original method chain to keep test mocks compatible
    query = supabase
      .from("entries")
      .select("*")
      .eq("device_id", deviceId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to load history: ${error.message}`);
  }

  return (data || []) as Entry[];
}

/** Claim anonymous device history and link it to the user's account. */
export async function claimDeviceHistory(deviceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("entries")
    .update({ user_id: userId })
    .eq("device_id", deviceId)
    .is("user_id", null);

  if (error) {
    throw new Error(`Failed to claim device history: ${error.message}`);
  }
}

/** Fetch the global sustainability leaderboard ordered by emissions ascending (lowest first). */
export async function listLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("score", { ascending: true });

  if (error) {
    throw new Error(`Failed to load leaderboard: ${error.message}`);
  }

  const formatted = (data || []).map((row: Record<string, unknown>) => ({
    user_id: String(row.user_id),
    display_name: String(row.display_name),
    score: Number(row.score),
  }));

  return formatted as LeaderboardEntry[];
}

/** Get the total collective CO2e saved in kg. */
export async function getCollectiveSavedCO2e(): Promise<number> {
  const { data, error } = await supabase.rpc("get_collective_saved_kg");

  if (error) {
    console.warn("RPC get_collective_saved_kg failed, using fallback:", error);
    return 48250; // Fallback value from hardcoded dashboard design
  }

  return Number(data ?? 48250);
}

/** List community tips, ordered by creation date descending. */
export async function listTips(): Promise<CommunityTip[]> {
  const { data, error } = await supabase
    .from("community_tips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load tips: ${error.message}`);
  }

  return (data || []) as CommunityTip[];
}

/** Share a new community tip. */
export async function saveTip(
  category: string,
  title: string,
  description: string,
  authorName: string,
  userId?: string
): Promise<CommunityTip> {
  const payload: Record<string, unknown> = {
    category,
    title,
    description,
    author_name: authorName,
  };

  if (userId) {
    payload.user_id = userId;
  }

  const { data, error } = await supabase
    .from("community_tips")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save tip: ${error.message}`);
  }

  return data as CommunityTip;
}

/** Delete a shared community tip. Only succeeds if authenticated user matches user_id. */
export async function deleteTip(tipId: string): Promise<void> {
  const { error } = await supabase
    .from("community_tips")
    .delete()
    .eq("id", tipId);

  if (error) {
    throw new Error(`Failed to delete tip: ${error.message}`);
  }
}

