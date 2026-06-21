/**
 * Data access layer for Supabase backend operations.
 *
 * Provides typed wrappers around Supabase client calls for footprint
 * calculations, AI insights, entry persistence, community features, and
 * the sustainability leaderboard. All functions throw descriptive errors
 * on failure so callers can display user-friendly messages.
 *
 * @module api
 */

import type {
  CarbonInput,
  Entry,
  FootprintResult,
  InsightsResponse,
  LeaderboardEntry,
  CommunityTip,
} from "./types";
import { calculateFootprint } from "./carbon/calculator";
import { generateRuleBasedInsights } from "./carbon/rules";
import { supabase } from "./supabaseClient";

/**
 * Compute the annual footprint breakdown for the given lifestyle inputs.
 *
 * This is a thin async wrapper around the synchronous calculation engine,
 * maintaining a consistent `Promise`-based API surface for callers.
 *
 * @param input - Structured lifestyle data from the calculator wizard.
 * @returns The computed {@link FootprintResult}.
 */
export async function calculate(input: CarbonInput): Promise<FootprintResult> {
  return calculateFootprint(input);
}

/**
 * Fetch personalised reduction advice from the Gemini-powered Edge Function,
 * falling back to the local deterministic rules engine on any failure.
 *
 * @param input - Structured lifestyle data from the calculator wizard.
 * @returns An {@link InsightsResponse} with summary and recommendations.
 */
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

/**
 * Save a footprint snapshot to the database, optionally linking to a user account.
 *
 * @param deviceId - The anonymous device identifier.
 * @param input    - The original lifestyle input data.
 * @param result   - The calculated footprint result.
 * @param userId   - The authenticated user's ID, if logged in.
 * @returns The persisted {@link Entry} with database-generated fields.
 * @throws {Error} If the Supabase insert fails.
 */
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

  const { data, error } = await supabase.from("entries").insert(payload).select().single();

  if (error) {
    throw new Error(`Failed to save entry: ${error.message}`);
  }

  return data as Entry;
}

/**
 * List saved entries for a user or device, ordered by creation date descending.
 *
 * If a `userId` is provided, entries are filtered by authenticated ownership.
 * Otherwise, entries are matched by anonymous `deviceId`.
 *
 * @param deviceId - The anonymous device identifier (fallback filter).
 * @param userId   - The authenticated user's ID, if logged in.
 * @returns An array of up to 50 {@link Entry} records, newest first.
 * @throws {Error} If the Supabase query fails.
 */
export async function listEntries(deviceId: string, userId?: string): Promise<Entry[]> {
  let query;
  if (userId) {
    query = supabase.from("entries").select("*").eq("user_id", userId);
  } else {
    // Maintain exact original method chain to keep test mocks compatible
    query = supabase.from("entries").select("*").eq("device_id", deviceId);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(50);

  if (error) {
    throw new Error(`Failed to load history: ${error.message}`);
  }

  return (data || []) as Entry[];
}

/**
 * Claim anonymous device history and link it to the user's account.
 *
 * Updates all entries matching the given `deviceId` that currently have
 * `user_id = null`, assigning them to the authenticated user.
 *
 * @param deviceId - The anonymous device identifier to claim.
 * @param userId   - The authenticated user's ID to assign ownership.
 * @throws {Error} If the Supabase update fails.
 */
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

/**
 * Fetch the global sustainability leaderboard, ordered by emissions ascending.
 *
 * Lower scores (fewer emissions) rank higher, incentivising reduction.
 *
 * @returns An array of {@link LeaderboardEntry} records sorted by score.
 * @throws {Error} If the Supabase query fails.
 */
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

/**
 * Get the total collective CO₂e saved by all EcoMindX users in kilograms.
 *
 * Calls the `get_collective_saved_kg` Supabase RPC function. Falls back
 * to a hardcoded baseline value if the RPC is unavailable.
 *
 * @returns The collective CO₂e saved in kilograms.
 */
export async function getCollectiveSavedCO2e(): Promise<number> {
  const { data, error } = await supabase.rpc("get_collective_saved_kg");

  if (error) {
    console.warn("RPC get_collective_saved_kg failed, using fallback:", error);
    return 48250; // Fallback value from hardcoded dashboard design
  }

  return Number(data ?? 48250);
}

/**
 * List community tips, ordered by creation date descending (newest first).
 *
 * @returns An array of {@link CommunityTip} records.
 * @throws {Error} If the Supabase query fails.
 */
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

/**
 * Share a new community tip.
 *
 * @param category    - The emission category this tip relates to.
 * @param title       - Short descriptive title for the tip.
 * @param description - Detailed explanation of the tip.
 * @param authorName  - Display name of the author.
 * @param userId      - The authenticated user's ID, if applicable.
 * @returns The persisted {@link CommunityTip}.
 * @throws {Error} If the Supabase insert fails.
 */
export async function saveTip(
  category: string,
  title: string,
  description: string,
  authorName: string,
  userId?: string,
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

  const { data, error } = await supabase.from("community_tips").insert(payload).select().single();

  if (error) {
    throw new Error(`Failed to save tip: ${error.message}`);
  }

  return data as CommunityTip;
}

/**
 * Delete a shared community tip.
 *
 * Only succeeds if the authenticated user matches the tip's `user_id`
 * (enforced by Supabase RLS policies).
 *
 * @param tipId - The UUID of the tip to delete.
 * @throws {Error} If the Supabase delete fails.
 */
export async function deleteTip(tipId: string): Promise<void> {
  const { error } = await supabase.from("community_tips").delete().eq("id", tipId);

  if (error) {
    throw new Error(`Failed to delete tip: ${error.message}`);
  }
}
