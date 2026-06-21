import { useState } from "react";
import type { Entry } from "../lib/types";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../lib/supabaseClient";

/** Props for the {@link AccountPanel} component. */
interface Props {
  /** The currently authenticated Supabase user, or `null`. */
  user: User | null;
  /** Whether an auth operation is in progress. */
  authLoading: boolean;
  /** The last authentication error message, or `null`. */
  authError: string | null;
  /** Array of saved footprint entries for this user/device. */
  entries: Entry[];
  /** Whether a save/claim operation is in progress. */
  saving: boolean;
  /** The user's current emissions score in tonnes, or `null`. */
  userEmissions: number | null;
  /** Callback to sign in with email and password. */
  onSignIn: (email: string, password: string) => Promise<void>;
  /** Callback to register a new account. */
  onSignUp: (email: string, password: string) => Promise<void>;
  /** Callback to sign out the active user. */
  onSignOut: () => Promise<void>;
  /** Callback to claim anonymous device history. */
  onClaimHistory: () => Promise<void>;
}

/**
 * Account / Authentication panel — sign-in/up forms and profile view.
 */
export function AccountPanel({
  user,
  authLoading,
  authError,
  entries,
  saving,
  userEmissions,
  onSignIn,
  onSignUp,
  onSignOut,
  onClaimHistory,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [localAuthError, setLocalAuthError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalAuthError(null);
    if (!email || !password) {
      setLocalAuthError("Please provide both email and password.");
      return;
    }
    if (password.length < 8) {
      setLocalAuthError("Password must be at least 8 characters.");
      return;
    }
    try {
      if (isSignUp) {
        await onSignUp(email, password);
      } else {
        await onSignIn(email, password);
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      const error = err as Error;
      setLocalAuthError(error.message || "Authentication failed.");
    }
  };

  if (user) {
    return (
      <section className="card" aria-label="User profile">
        <h2>
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon-primary"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Your Profile
        </h2>

        <div className="profile-card card">
          <div className="profile-avatar-large">{user.email?.[0].toUpperCase()}</div>
          <div className="profile-details">
            <h3>{user.email}</h3>
            <p>EcoMindX Member since today</p>
          </div>
        </div>

        {entries.length > 0 && entries.some((e) => !e.user_id) && (
          <div className="sync-history-banner">
            <div className="sync-history-text">
              <h4>Sync Local History</h4>
              <p>
                You have footprint snapshots on this device saved before logging in. Link them to
                your account now.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-small"
              onClick={onClaimHistory}
              disabled={saving}
            >
              {saving ? "Syncing..." : "Sync History"}
            </button>
          </div>
        )}

        <div className="dashboard-metrics-grid mb-l">
          <div className="metric-card">
            <span className="label">Saved Snapshots</span>
            <span className="value">
              {entries.filter((e) => e.user_id === user.id || !e.user_id).length}
            </span>
          </div>
          <div className="metric-card">
            <span className="label">Current Score</span>
            <span className="value">
              {userEmissions !== null ? `${userEmissions.toFixed(1)} t` : "Not Calculated"}
            </span>
          </div>
        </div>

        <div className="flex-end">
          <button
            type="button"
            className="btn secondary"
            onClick={onSignOut}
            disabled={authLoading}
          >
            {authLoading ? "Logging Out..." : "Sign Out"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card auth-box" aria-label="Sign in or register">
      <div className="auth-header">
        <h3>{isSignUp ? "Create EcoMindX Account" : "Access Personal Intelligence"}</h3>
        <p>
          {isSignUp ? "Already have an account?" : "New to EcoMindX?"}{" "}
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setLocalAuthError(null);
            }}
          >
            {isSignUp ? "Sign In" : "Register"}
          </button>
        </p>
      </div>

      {localAuthError && <div className="auth-error-alert">{localAuthError}</div>}
      {authError && !localAuthError && <div className="auth-error-alert">{authError}</div>}

      {!isSupabaseConfigured && (
        <div className="auth-error-alert auth-error-setup">
          <strong>Setup Required:</strong> Vercel is missing your Supabase keys. You must add{" "}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your Vercel
          Project Settings &gt; Environment Variables, and redeploy.
        </div>
      )}

      <form onSubmit={handleAuthSubmit}>
        <div className="field">
          <label htmlFor="auth-email">Email Address</label>
          <input
            id="auth-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />
        </div>

        <div className="auth-actions">
          <button type="submit" className="btn" disabled={authLoading}>
            {authLoading ? (
              <>
                <svg
                  aria-hidden="true"
                  className="spinner mr-s"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeOpacity="0.2"
                  />
                  <path
                    d="M8 1a7 7 0 0 1 7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Processing...
              </>
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
