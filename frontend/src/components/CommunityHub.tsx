import { useState, useMemo, useEffect, useCallback } from "react";
import type { LeaderboardEntry, CommunityTip } from "../lib/types";
import { formatDate } from "../lib/format";
import type { User } from "@supabase/supabase-js";
import { ConfirmDialog } from "./ConfirmDialog";
import { debounce } from "../lib/debounce";

interface Props {
  leaderboardUsers: (LeaderboardEntry & { isUser?: boolean; name?: string })[];
  collectiveSaved: number;
  communityTips: CommunityTip[];
  loadingCommunity: boolean;
  communityError: string | null;
  user: User | null;
  onShareTip: (
    category: string,
    title: string,
    description: string,
    authorName: string,
  ) => Promise<void>;
  onDeleteTip: (tipId: string) => Promise<void>;
  onSignInClick: () => void;
}

export function CommunityHub({
  leaderboardUsers,
  collectiveSaved,
  communityTips,
  loadingCommunity,
  communityError,
  user,
  onShareTip,
  onDeleteTip,
  onSignInClick,
}: Props) {
  const [tipCategory, setTipCategory] = useState("home");
  const [tipTitle, setTipTitle] = useState("");
  const [tipDesc, setTipDesc] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [sharing, setSharing] = useState(false);

  // Confirm Dialog State
  const [tipToDelete, setTipToDelete] = useState<string | null>(null);

  // Stronger input sanitization using DOMParser
  const sanitizeText = (input: string) => {
    const doc = new DOMParser().parseFromString(input, "text/html");
    return doc.body.textContent || "";
  };

  const submitTip = useCallback(async () => {
    const t = sanitizeText(tipTitle.trim());
    const d = sanitizeText(tipDesc.trim());
    const a =
      sanitizeText(authorName.trim()) ||
      (user ? user.email?.split("@")[0] || "Anonymous" : "Anonymous Eco-Warrior");

    if (!t || !d) return;

    setSharing(true);
    try {
      await onShareTip(tipCategory, t, d, a);
      setTipTitle("");
      setTipDesc("");
      setAuthorName("");
    } catch (err) {
      console.warn("Failed to share tip:", err);
    } finally {
      setSharing(false);
    }
  }, [tipTitle, tipDesc, authorName, user, onShareTip, tipCategory]);

  // Debounced version to prevent rapid-fire spam
  const debouncedSubmit = useMemo(() => debounce(submitTip, 500), [submitTip]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => debouncedSubmit.cancel();
  }, [debouncedSubmit]);

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    debouncedSubmit();
  };

  const requestDelete = (tipId: string) => {
    setTipToDelete(tipId);
  };

  const confirmDelete = async () => {
    if (tipToDelete) {
      await onDeleteTip(tipToDelete);
      setTipToDelete(null);
    }
  };

  return (
    <section className="card" aria-labelledby="community-heading">
      <ConfirmDialog
        open={!!tipToDelete}
        title="Delete Eco-Tip"
        message="Are you sure you want to delete this tip? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setTipToDelete(null)}
      />

      <h2 id="community-heading">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="community-card-title-icon"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Community Hub
      </h2>

      {communityError && (
        <div className="error" role="alert">
          {communityError}
        </div>
      )}

      {loadingCommunity && !leaderboardUsers.length ? (
        <div className="community-spinner-container">
          <svg
            className="spinner"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="community-spinner-note">Loading community data...</p>
        </div>
      ) : (
        <>
          <div className="community-stats-header">
            <div>
              <h3 className="community-stats-title">Collective Impact</h3>
              <p className="community-saved-note">Total CO₂e saved by the EcoMindX community</p>
            </div>
            <div className="community-stats-val">{collectiveSaved.toLocaleString()} kg</div>
          </div>

          <div className="community-grid-split">
            <div>
              <h3 className="community-section-title">Global Leaderboard</h3>
              <div className="leaderboard-container">
                {leaderboardUsers.slice(0, 10).map((u, i) => (
                  <div
                    key={u.user_id || `rank-${i}`}
                    className={`leaderboard-row ${u.isUser ? "current-user" : ""}`}
                  >
                    <div className={`leaderboard-rank ${i < 3 ? `rank-${i + 1}` : ""}`}>
                      #{i + 1}
                    </div>
                    <div className="leaderboard-user">
                      <div className="user-avatar-badge">{u.name?.[0].toUpperCase()}</div>
                      <span className="leaderboard-name">{u.name}</span>
                    </div>
                    <div className="leaderboard-score">{u.score.toFixed(1)} t</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="community-section-title">Share an Eco-Tip</h3>
              {user ? (
                <form className="community-form-card" onSubmit={handleShareSubmit}>
                  <div className="field">
                    <label htmlFor="tip-category">Category</label>
                    <select
                      id="tip-category"
                      value={tipCategory}
                      onChange={(e) => setTipCategory(e.target.value)}
                    >
                      <option value="home">Home Energy</option>
                      <option value="transport">Transportation</option>
                      <option value="diet">Diet & Food</option>
                      <option value="consumption">Shopping & Waste</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="tip-title">Tip Title</label>
                    <input
                      id="tip-title"
                      type="text"
                      required
                      maxLength={60}
                      value={tipTitle}
                      onChange={(e) => setTipTitle(e.target.value)}
                      placeholder="e.g., Wash clothes in cold water"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="tip-desc">How does it help?</label>
                    <input
                      id="tip-desc"
                      type="text"
                      required
                      maxLength={200}
                      value={tipDesc}
                      onChange={(e) => setTipDesc(e.target.value)}
                      placeholder="Saves heating energy and protects fabric."
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn community-form-submit-btn"
                    disabled={sharing}
                  >
                    {sharing ? "Publishing..." : "Publish Tip"}
                  </button>
                </form>
              ) : (
                <div className="community-signin-cta-card">
                  <p className="community-signin-cta-text">
                    Join the EcoMindX community to share your crowd-sourced eco-tips and inspire
                    others.
                  </p>
                  <button className="btn" type="button" onClick={onSignInClick}>
                    Sign In / Register
                  </button>
                </div>
              )}
            </div>
          </div>

          <h3 className="community-feed-header">Community Feed</h3>
          <div className="tips-feed">
            {communityTips.map((tip) => (
              <article key={tip.id} className="tip-card">
                <div className="tip-card-header">
                  <span className="tip-card-tag">{tip.category}</span>
                  {user && user.id === tip.user_id && (
                    <button
                      className="tip-delete-btn"
                      onClick={() => requestDelete(tip.id)}
                      title="Delete your tip"
                      aria-label="Delete this tip"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  )}
                </div>
                <h4 className="tip-card-title">{tip.title}</h4>
                <p className="tip-card-desc">{tip.description}</p>
                <div className="tip-card-footer">
                  By {tip.author_name} • {formatDate(tip.created_at)}
                </div>
              </article>
            ))}
            {communityTips.length === 0 && (
              <div className="community-feed-empty">No tips shared yet. Be the first!</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
