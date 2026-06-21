import { useCallback, useState } from "react";
import * as api from "../lib/api";
import type { LeaderboardEntry, CommunityTip } from "../lib/types";

/**
 * Manages Community Hub state: leaderboard rankings, collective CO₂e
 * savings, and crowd-sourced eco-tips (CRUD).
 */
export function useCommunity() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [collectiveSaved, setCollectiveSaved] = useState<number>(48250);
  const [tips, setTips] = useState<CommunityTip[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);

  /** Fetch leaderboard, collective savings, and tips in parallel. */
  const loadCommunityData = useCallback(async () => {
    setLoadingCommunity(true);
    setCommunityError(null);
    try {
      const [lb, saved, tps] = await Promise.all([
        api.listLeaderboard(),
        api.getCollectiveSavedCO2e(),
        api.listTips(),
      ]);
      setLeaderboard(lb);
      setCollectiveSaved(saved);
      setTips(tps);
    } catch (err: unknown) {
      console.warn("Failed to load community hub data:", err);
      setCommunityError("Could not load community data. Please try again.");
    } finally {
      setLoadingCommunity(false);
    }
  }, []);

  /** Share a new eco-tip and refresh the feed. */
  const shareTip = useCallback(
    async (category: string, title: string, description: string, authorName: string, userId?: string) => {
      setLoadingCommunity(true);
      setCommunityError(null);
      try {
        await api.saveTip(category, title, description, authorName, userId);
        await loadCommunityData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to share eco-tip.";
        setCommunityError(msg);
        throw err;
      } finally {
        setLoadingCommunity(false);
      }
    },
    [loadCommunityData],
  );

  /** Delete a community tip and refresh the feed. */
  const deleteTip = useCallback(
    async (tipId: string) => {
      setLoadingCommunity(true);
      setCommunityError(null);
      try {
        await api.deleteTip(tipId);
        await loadCommunityData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete eco-tip.";
        setCommunityError(msg);
        throw err;
      } finally {
        setLoadingCommunity(false);
      }
    },
    [loadCommunityData],
  );

  return {
    leaderboard,
    collectiveSaved,
    tips,
    loadingCommunity,
    communityError,
    loadCommunityData,
    shareTip,
    deleteTip,
  };
}
