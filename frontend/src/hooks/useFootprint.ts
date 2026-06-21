import { useCallback, useEffect, useState } from "react";
import * as api from "../lib/api";
import { getDeviceId } from "../lib/deviceId";
import type { CarbonInput, Entry, FootprintResult, InsightsResponse } from "../lib/types";
import type { User } from "@supabase/supabase-js";

/**
 * Owns footprint calculation, AI insights generation, entry persistence,
 * and history loading. Auth and community concerns are handled by their
 * respective hooks (`useAuth`, `useCommunity`).
 *
 * @param user - The currently authenticated Supabase user, or `null`.
 * @returns An object containing:
 *   - `result` — The latest calculated footprint result, or `null`.
 *   - `lastInput` — The input data used for the latest calculation.
 *   - `insights` — AI-generated or rule-based insights, or `null`.
 *   - `entries` — Array of saved history entries.
 *   - `loading` — Whether a calculation is in progress.
 *   - `saving` — Whether a save/claim operation is in progress.
 *   - `error` — Error message, or `null`.
 *   - `status` — User-facing status message for screen readers.
 *   - `calculate` — Runs footprint calculation and AI insights.
 *   - `save` — Persists the latest result to history.
 *   - `claimHistory` — Links anonymous device history to user account.
 *   - `loadHistory` — Reloads the entry history.
 */
export function useFootprint(user: User | null) {
  const [deviceId] = useState(getDeviceId);
  const [result, setResult] = useState<FootprintResult | null>(() => {
    try {
      const saved = localStorage.getItem("ecomindx_active_result");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [lastInput, setLastInput] = useState<CarbonInput | null>(() => {
    try {
      const saved = localStorage.getItem("ecomindx_active_input");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [insights, setInsights] = useState<InsightsResponse | null>(() => {
    try {
      const saved = localStorage.getItem("ecomindx_active_insights");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [hasSavedCurrent, setHasSavedCurrent] = useState(false);

  // Sync active states to localStorage
  useEffect(() => {
    try {
      if (result) {
        localStorage.setItem("ecomindx_active_result", JSON.stringify(result));
      } else {
        localStorage.removeItem("ecomindx_active_result");
      }
    } catch {
      // localStorage write is non-critical; silently ignored.
    }
  }, [result]);

  useEffect(() => {
    try {
      if (lastInput) {
        localStorage.setItem("ecomindx_active_input", JSON.stringify(lastInput));
      } else {
        localStorage.removeItem("ecomindx_active_input");
      }
    } catch {
      // localStorage write is non-critical; silently ignored.
    }
  }, [lastInput]);

  useEffect(() => {
    try {
      if (insights) {
        localStorage.setItem("ecomindx_active_insights", JSON.stringify(insights));
      } else {
        localStorage.removeItem("ecomindx_active_insights");
      }
    } catch {
      // localStorage write is non-critical; silently ignored.
    }
  }, [insights]);

  /** Load the entry history for the current device or authenticated user. */
  const loadHistory = useCallback(
    async (activeUserId?: string) => {
      try {
        setEntries(await api.listEntries(deviceId, activeUserId));
      } catch {
        // History is non-critical; fail silently rather than blocking the app.
      }
    },
    [deviceId],
  );

  // Reload history whenever the authenticated user changes
  useEffect(() => {
    void loadHistory(user?.id);
  }, [user, loadHistory]);

  /** Calculate the footprint and fetch personalized insights for the input. */
  const calculate = useCallback(
    async (input: CarbonInput) => {
      setLoading(true);
      setError(null);
      setStatus("");
      setHasSavedCurrent(false);
      try {
        const [calc, ins] = await Promise.all([api.calculate(input), api.getInsights(input)]);
        setResult(calc);
        setInsights(ins);
        setLastInput(input);
        setStatus("Your footprint results and personalized insights are ready below.");

        // Auto-save this calculation to the history ledger
        try {
          await api.saveEntry(deviceId, input, calc, user?.id);
          setHasSavedCurrent(true);
          await loadHistory(user?.id);
        } catch {
          // Auto-save is best-effort; calculation result is still valid.
        }
      } catch {
        setError("Something went wrong calculating your footprint. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [deviceId, user, loadHistory],
  );

  /** Persist the latest result to the device's history and refresh it. */
  const save = useCallback(async () => {
    if (!result || !lastInput) return;
    if (hasSavedCurrent) {
      setStatus("Entry saved to your history.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.saveEntry(deviceId, lastInput, result, user?.id);
      setHasSavedCurrent(true);
      await loadHistory(user?.id);
      setStatus("Entry saved to your history.");
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Please try again.";
      setError(`Could not save this entry. Details: ${detail}`);
    } finally {
      setSaving(false);
    }
  }, [result, lastInput, hasSavedCurrent, deviceId, user, loadHistory]);

  /** Claim local anonymous history and sync with user profile. */
  const claimHistory = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.claimDeviceHistory(deviceId, user.id);
      await loadHistory(user.id);
      setStatus("Device history claimed and synced.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to claim local history.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [user, deviceId, loadHistory]);

  return {
    result,
    lastInput,
    insights,
    entries,
    loading,
    saving,
    error,
    status,
    calculate,
    save,
    claimHistory,
    loadHistory,
  };
}
