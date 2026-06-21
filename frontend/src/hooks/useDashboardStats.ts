import { useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import type { FootprintResult, Entry, LeaderboardEntry } from "../lib/types";

/**
 * Custom hook to compute derived dashboard statistics, such as leaderboard
 * rankings and the user's highest emission category.
 *
 * @param user The currently authenticated user.
 * @param result The current footprint result.
 * @param entries The user's historical entries.
 * @param leaderboard The global leaderboard data.
 */
export function useDashboardStats(
  user: User | null,
  result: FootprintResult | null,
  entries: Entry[],
  leaderboard: LeaderboardEntry[],
) {
  // Dynamically calculate user ranking on the leaderboard based on emissions
  const userEmissions = useMemo(() => {
    return result
      ? result.total_annual_tonnes
      : entries.length > 0
        ? entries[0].result.total_annual_tonnes
        : null;
  }, [result, entries]);

  const leaderboardUsers = useMemo(() => {
    const list = leaderboard.map((item) => ({
      display_name: item.display_name,
      score: item.score,
      isUser: user ? item.user_id === user.id : false,
      user_id: item.user_id,
      name: item.display_name,
    }));

    if (userEmissions !== null) {
      const alreadyExists = list.some(
        (item) => item.isUser || (user && item.user_id === user.id),
      );
      if (!alreadyExists) {
        list.push({
          display_name: user?.email ? `${user.email.split("@")[0]} (You)` : "You",
          score: Number(userEmissions.toFixed(2)),
          isUser: true,
          user_id: user?.id || "anonymous",
          name: user?.email ? `${user.email.split("@")[0]} (You)` : "You",
        });
      }
    }

    return [...list].sort((a, b) => a.score - b.score);
  }, [leaderboard, user, userEmissions]);

  // Compute highest emission category from result
  const highestCategory = useMemo(() => {
    if (!result || !result.breakdown_kg) return null;
    const { transport, home, diet, consumption } = result.breakdown_kg;
    const entriesList = Object.entries({ transport, home, diet, consumption });
    entriesList.sort((a, b) => b[1] - a[1]);
    return entriesList[0][0];
  }, [result]);

  return { userEmissions, leaderboardUsers, highestCategory };
}
