import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

/**
 * Manages Supabase authentication state: session recovery, sign-in,
 * sign-up, sign-out, and real-time auth state change listening.
 *
 * @returns An object containing:
 *   - `user` — The currently authenticated Supabase user, or `null`.
 *   - `authLoading` — Whether an auth operation is in progress.
 *   - `authError` — The last authentication error message, or `null`.
 *   - `signIn` — Async function to sign in with email and password.
 *   - `signUp` — Async function to register a new account.
 *   - `signOut` — Async function to sign out the active user.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  /** Register a new user. */
  const signUp = useCallback(async (email: string, password: string) => {
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
  }, []);

  /** Sign in an existing user. */
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr) {
      setAuthError(signInErr.message);
      setAuthLoading(false);
      throw signInErr;
    }
    setUser(data.user);
    setAuthLoading(false);
  }, []);

  /** Sign out the active user. */
  const signOut = useCallback(async () => {
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
  }, []);

  /** Subscribe to Supabase auth state changes and recover initial session. */
  useEffect(() => {
    let active = true;

    if (supabase && supabase.auth) {
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (!active) return;
          setUser(session?.user ?? null);
          setAuthLoading(false);
        })
        .catch((err) => {
          console.warn("Failed to get initial session:", err);
          if (active) setAuthLoading(false);
        });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        setAuthLoading(false);
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } else {
      setAuthLoading(false);
    }
  }, []);

  return { user, authLoading, authError, signIn, signUp, signOut };
}
