import { useState } from "react";
import type { CommunityTip } from "../lib/types";
import type { User } from "@supabase/supabase-js";

interface Props {
  leaderboardUsers: Array<{
    name: string;
    score: number;
    isUser: boolean;
    userId: string;
  }>;
  collectiveSaved: number;
  communityTips: CommunityTip[];
  loadingCommunity: boolean;
  communityError: string | null;
  user: User | null;
  onShareTip: (category: string, title: string, desc: string, authorName: string) => Promise<void>;
  onDeleteTip: (tipId: string) => Promise<void>;
}

/**
 * Community Hub tab — leaderboard, tip sharing form, and tips feed.
 */
export function CommunityHub({
  leaderboardUsers,
  collectiveSaved,
  communityTips,
  loadingCommunity,
  communityError,
  user,
  onShareTip,
  onDeleteTip,
}: Props) {
  const [tipCategory, setTipCategory] = useState("Mobility");
  const [tipTitle, setTipTitle] = useState("");
  const [tipDesc, setTipDesc] = useState("");
  const [tipAuthorName, setTipAuthorName] = useState("");
  const [tipSuccess, setTipSuccess] = useState<string | null>(null);
  const [sharingTip, setSharingTip] = useState(false);

  const sanitizeText = (text: string, maxLength: number): string => {
    return text.replace(/<[^>]*>/g, "").slice(0, maxLength).trim();
  };

  const handleShareTip = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(tipTitle, 100);
    const cleanDesc = sanitizeText(tipDesc, 500);
    if (!cleanTitle || !cleanDesc) return;
    setSharingTip(true);
    setTipSuccess(null);
    try {
      const author = sanitizeText(
        tipAuthorName.trim() || (user?.email ? user.email.split("@")[0] : "Anonymous"),
        50,
      );
      await onShareTip(tipCategory, cleanTitle, cleanDesc, author);
      setTipTitle("");
      setTipDesc("");
      setTipSuccess("Thank you! Your eco-tip has been shared successfully.");
      setTimeout(() => setTipSuccess(null), 5000);
    } catch (err) {
      console.error("Failed to share tip:", err);
    } finally {
      setSharingTip(false);
    }
  };

  const handleDeleteTip = async (tipId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this eco-tip? This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      await onDeleteTip(tipId);
    } catch (err) {
      console.error("Failed to delete tip:", err);
    }
  };

  return (
    <section className="card" role="region" aria-label="Community Hub">
      <h2>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--primary)" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        EcoMindX Community Hub
      </h2>

      <div className="community-stats-header">
        <div>
          <h3 className="community-stats-title">Total Collective CO₂e Saved</h3>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.85rem" }}>
            All savings combined by the EcoMindX network
          </p>
        </div>
        <div className="community-stats-val">{collectiveSaved.toLocaleString()} kg</div>
      </div>

      <h3
        style={{
          fontFamily: "var(--font-display)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "0.5rem",
          marginBottom: "1.25rem",
        }}
      >
        Global Sustainability Leaderboard
      </h3>
      <div className="leaderboard-container">
        {loadingCommunity && leaderboardUsers.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Loading leaderboard...</p>
        ) : leaderboardUsers.length === 0 ? (
          <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
            No leaderboard data available.
          </p>
        ) : (
          leaderboardUsers.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={`leaderboard-row ${item.isUser ? "current-user" : ""}`}
            >
              <div className={`leaderboard-rank rank-${index + 1}`}>#{index + 1}</div>
              <div className="leaderboard-user">
                <div className="user-avatar-badge">
                  {item.name[0]?.toUpperCase() || "?"}
                </div>
                <span className="leaderboard-name">{item.name}</span>
              </div>
              <div className="leaderboard-score">{item.score} t/yr</div>
            </div>
          ))
        )}
      </div>

      {/* Share an Eco-Tip Form */}
      <div
        className="card tip-sharing-form-card"
        style={{
          marginBottom: "2rem",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px dashed rgba(16, 185, 129, 0.25)",
        }}
      >
        <h4
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--primary-hover)",
            margin: "0 0 1rem 0",
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          Share an Eco-Tip with the Community
        </h4>

        <form
          onSubmit={handleShareTip}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
            className="tip-form-grid"
          >
            <div className="field">
              <label
                htmlFor="tip-category"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Category
              </label>
              <select
                id="tip-category"
                value={tipCategory}
                onChange={(e) => setTipCategory(e.target.value)}
                style={{ marginTop: "0.25rem" }}
              >
                <option value="Mobility">Mobility</option>
                <option value="Home Energy">Home Energy</option>
                <option value="Diet">Diet</option>
                <option value="Consumption">Consumption</option>
              </select>
            </div>

            <div className="field">
              <label
                htmlFor="tip-author"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Your Name / Alias
              </label>
              <input
                id="tip-author"
                type="text"
                placeholder={user?.email ? user.email.split("@")[0] : "Anonymous"}
                value={tipAuthorName}
                onChange={(e) => setTipAuthorName(e.target.value)}
                maxLength={50}
                style={{ marginTop: "0.25rem" }}
              />
            </div>
          </div>

          <div className="field">
            <label
              htmlFor="tip-title"
              style={{
                fontSize: "0.8rem",
                color: "var(--muted)",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Tip Title
            </label>
            <input
              id="tip-title"
              type="text"
              placeholder="e.g., Turn off standby power"
              value={tipTitle}
              onChange={(e) => setTipTitle(e.target.value)}
              required
              maxLength={100}
              style={{ marginTop: "0.25rem" }}
            />
          </div>

          <div className="field">
            <label
              htmlFor="tip-desc"
              style={{
                fontSize: "0.8rem",
                color: "var(--muted)",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Description
            </label>
            <textarea
              id="tip-desc"
              placeholder="Explain how this tip saves carbon or helps the environment..."
              value={tipDesc}
              onChange={(e) => setTipDesc(e.target.value)}
              required
              maxLength={500}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                padding: "0.75rem 1rem",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                background: "#0f162499",
                color: "#fff",
                width: "100%",
                minHeight: "80px",
                resize: "vertical",
                marginTop: "0.25rem",
              }}
            />
          </div>

          {tipSuccess && (
            <div
              role="status"
              aria-live="polite"
              style={{ color: "var(--primary-hover)", fontSize: "0.9rem", fontWeight: 600 }}
            >
              {tipSuccess}
            </div>
          )}
          {communityError && <div className="error">{communityError}</div>}

          <button
            type="submit"
            className="btn"
            disabled={sharingTip}
            style={{
              alignSelf: "flex-start",
              padding: "0.6rem 1.2rem",
              fontSize: "0.85rem",
            }}
          >
            {sharingTip ? "Sharing..." : "Share Tip"}
          </button>
        </form>
      </div>

      <h3
        style={{
          fontFamily: "var(--font-display)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "0.5rem",
          marginBottom: "1.25rem",
        }}
      >
        Eco-Tips Shared by Members
      </h3>
      <div className="tips-feed">
        {loadingCommunity && communityTips.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Loading eco-tips...</p>
        ) : communityTips.length === 0 ? (
          <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
            No eco-tips shared yet. Be the first to share one!
          </p>
        ) : (
          communityTips.map((tip) => (
            <div key={tip.id} className="tip-card">
              <div className="tip-card-header">
                <span className="tip-card-tag">{tip.category}</span>
                {user && tip.user_id === user.id && (
                  <button
                    className="tip-delete-btn"
                    onClick={() => handleDeleteTip(tip.id)}
                    title="Delete this tip"
                    aria-label="Delete this tip"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                )}
              </div>
              <h4 className="tip-card-title">{tip.title}</h4>
              <p className="tip-card-desc">{tip.description}</p>
              <div className="tip-card-footer">
                By {tip.author_name} • {new Date(tip.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
