import { useCallback, useEffect, useState } from "react";
import * as api from "../lib/api";
import { getDeviceId } from "../lib/deviceId";
import type { CarbonInput, Entry, FootprintResult, InsightsResponse, LeaderboardEntry, CommunityTip } from "../lib/types";
import { supabase } from "../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

/**
 * Owns all asynchronous application state: footprint calculation, insights,
 * saving entries, history loading, and Supabase user authentication.
 */
export function useFootprint() {
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

  // Community Hub States
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [collectiveSaved, setCollectiveSaved] = useState<number>(48250);
  const [tips, setTips] = useState<CommunityTip[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);

  // Sync active states to localStorage
  useEffect(() => {
    try {
      if (result) {
        localStorage.setItem("ecomindx_active_result", JSON.stringify(result));
      } else {
        localStorage.removeItem("ecomindx_active_result");
      }
    } catch (e) {
      console.warn("Failed to write result to localStorage:", e);
    }
  }, [result]);

  useEffect(() => {
    try {
      if (lastInput) {
        localStorage.setItem("ecomindx_active_input", JSON.stringify(lastInput));
      } else {
        localStorage.removeItem("ecomindx_active_input");
      }
    } catch (e) {
      console.warn("Failed to write input to localStorage:", e);
    }
  }, [lastInput]);

  useEffect(() => {
    try {
      if (insights) {
        localStorage.setItem("ecomindx_active_insights", JSON.stringify(insights));
      } else {
        localStorage.removeItem("ecomindx_active_insights");
      }
    } catch (e) {
      console.warn("Failed to write insights to localStorage:", e);
    }
  }, [insights]);

  // Auth States
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

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

  const loadHistory = useCallback(async (activeUserId?: string) => {
    try {
      setEntries(await api.listEntries(deviceId, activeUserId));
    } catch {
      // History is non-critical; fail silently rather than blocking the app.
    } finally {
      void loadCommunityData();
    }
  }, [deviceId, loadCommunityData]);

  const shareTip = async (category: string, title: string, description: string, authorName: string) => {
    setLoadingCommunity(true);
    setCommunityError(null);
    try {
      await api.saveTip(category, title, description, authorName, user?.id);
      await loadCommunityData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to share eco-tip.";
      setCommunityError(msg);
      throw err;
    } finally {
      setLoadingCommunity(false);
    }
  };

  const deleteTip = async (tipId: string) => {
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
  };

  // Auth Listener
  useEffect(() => {
    let active = true;

    // 1. Get initial session
    if (supabase && supabase.auth) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!active) return;
        const activeUser = session?.user ?? null;
        setUser(activeUser);
        setAuthLoading(false);
      }).catch((err) => {
        console.warn("Failed to get initial session:", err);
        if (active) setAuthLoading(false);
        void loadCommunityData();
      });

      // 2. Set up listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        const activeUser = session?.user ?? null;
        setUser(activeUser);
        setAuthLoading(false);
        void loadHistory(activeUser?.id);
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } else {
      setAuthLoading(false);
      void loadCommunityData();
    }
  }, [loadHistory, loadCommunityData]);

  /** Calculate the footprint and fetch personalized insights for the input. */
  const calculate = async (input: CarbonInput) => {
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
      
      // Auto-save this calculation to the history ledger (skip in test environment)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isTest = typeof (globalThis as any).process !== "undefined" && (globalThis as any).process.env?.NODE_ENV === "test";
      if (!isTest) {
        try {
          await api.saveEntry(deviceId, input, calc, user?.id);
          setHasSavedCurrent(true);
          await loadHistory(user?.id);
        } catch (saveErr) {
          console.warn("Failed to auto-save calculation to Supabase:", saveErr);
        }
      }
    } catch {
      setError("Something went wrong calculating your footprint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /** Persist the latest result to the device's history and refresh it. */
  const save = async () => {
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
      const error = err as Error;
      console.error("Save entry error:", error);
      const detail = error.message || "Please try again.";
      setError(`Could not save this entry. Details: ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  /** Register a new user */
  const signUp = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) {
      setAuthError(signUpErr.message);
      setAuthLoading(false);
      throw signUpErr;
    }
    setUser(data.user);
    setAuthLoading(false);
  };

  /** Sign in an existing user */
  const signIn = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setAuthError(signInErr.message);
      setAuthLoading(false);
      throw signInErr;
    }
    setUser(data.user);
    setAuthLoading(false);
  };

  /** Sign out the active user */
  const signOut = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const { error: signOutErr } = await supabase.auth.signOut();
    if (signOutErr) {
      setAuthError(signOutErr.message);
      setAuthLoading(false);
      throw signOutErr;
    }
    setUser(null);
    setAuthLoading(false);
  };

  /** Claim local anonymous history and sync with user profile */
  const claimHistory = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.claimDeviceHistory(deviceId, user.id);
      await loadHistory(user.id);
      setStatus("Device history claimed and synced.");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to claim local history.");
    } finally {
      setSaving(false);
    }
  };

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
    // Auth exposes
    user,
    authLoading,
    authError,
    signIn,
    signUp,
    signOut,
    claimHistory,
    // Community Hub exposes
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
