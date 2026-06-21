import { useState, useEffect, useCallback } from "react";
import { CalculatorForm } from "./components/CalculatorForm";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { InsightsPanel } from "./components/InsightsPanel";
import { InsightsEmptyState } from "./components/InsightsEmptyState";
import { HistoryPanel } from "./components/HistoryPanel";
import { CommunityHub } from "./components/CommunityHub";
import { EcoChallenges } from "./components/EcoChallenges";
import { AccountPanel } from "./components/AccountPanel";
import { useAuth } from "./hooks/useAuth";
import { useCommunity } from "./hooks/useCommunity";
import { useFootprint } from "./hooks/useFootprint";

type TabType =
  | "calculator"
  | "analytics"
  | "insights"
  | "community"
  | "challenges"
  | "account"
  | "history";

/**
 * EcoMindX Application Shell
 *
 * Orchestrates navigation, layout, and delegates each tab to a focused component.
 * Business logic is split across three hooks: useAuth, useCommunity, useFootprint.
 */
export default function App() {
  const { user, authLoading, authError, signIn, signUp, signOut } = useAuth();

  const {
    leaderboard,
    collectiveSaved,
    tips: communityTips,
    loadingCommunity,
    communityError,
    loadCommunityData,
    shareTip,
    deleteTip,
  } = useCommunity();

  const {
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
  } = useFootprint(user);

  const [activeTab, setActiveTab] = useState<TabType>("calculator");

  // Sync to Analytics tab when calculation completes
  useEffect(() => {
    if (result) {
      setActiveTab("analytics");
    }
  }, [result]);

  // Load community data when community tab is first activated (lazy loading)
  const [communityLoaded, setCommunityLoaded] = useState(false);
  useEffect(() => {
    if (activeTab === "community" && !communityLoaded) {
      void loadCommunityData();
      setCommunityLoaded(true);
    }
  }, [activeTab, communityLoaded, loadCommunityData]);

  // Also reload community data when user auth changes and tab is visible
  useEffect(() => {
    if (communityLoaded) {
      void loadCommunityData();
    }
  }, [user, communityLoaded, loadCommunityData]);

  // Dynamically calculate user ranking on the leaderboard based on emissions
  const userEmissions = result
    ? result.total_annual_tonnes
    : entries.length > 0
      ? entries[0].result.total_annual_tonnes
      : null;

  const leaderboardUsers = leaderboard.map((item) => ({
    display_name: item.display_name,
    score: item.score,
    isUser: user ? item.user_id === user.id : false,
    user_id: item.user_id,
    name: item.display_name,
  }));

  if (userEmissions !== null) {
    const alreadyExists = leaderboardUsers.some(
      (item) => item.isUser || (user && item.user_id === user.id),
    );
    if (!alreadyExists) {
      leaderboardUsers.push({
        display_name: user?.email ? `${user.email.split("@")[0]} (You)` : "You",
        score: Number(userEmissions.toFixed(2)),
        isUser: true,
        user_id: user?.id || "anonymous",
        name: user?.email ? `${user.email.split("@")[0]} (You)` : "You",
      });
    }
  }

  leaderboardUsers.sort((a, b) => a.score - b.score);

  // Compute highest emission category from result
  const getHighestEmissionCategory = useCallback(() => {
    if (!result || !result.breakdown_kg) return null;
    const { transport, home, diet, consumption } = result.breakdown_kg;
    const entriesList = Object.entries({ transport, home, diet, consumption });
    entriesList.sort((a, b) => b[1] - a[1]);
    return entriesList[0][0];
  }, [result]);

  const highestCategory = getHighestEmissionCategory();

  // Helper: wrap the tip sharing callback to match the expected signature
  const handleShareTip = async (
    category: string,
    title: string,
    desc: string,
    authorName: string,
  ) => {
    await shareTip(category, title, desc, authorName, user?.id);
  };

  const handleDeleteTip = async (tipId: string) => {
    await deleteTip(tipId);
  };

  // Navigation tab definitions for DRY rendering
  const NAV_TABS: Array<{ id: TabType; label: string; icon: string }> = [
    {
      id: "calculator",
      label: "Carbon Calculator",
      icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    },
    {
      id: "analytics",
      label: "Sustain Analytics",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z",
    },
    { id: "insights", label: "AI Action Plan", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    {
      id: "community",
      label: "Community Hub",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      id: "challenges",
      label: "Eco-Challenges",
      icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
    },
    {
      id: "account",
      label: "My Account",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      id: "history",
      label: "Tracking History",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      {/* Background blobs for premium depth */}
      <div className="bg-glow-blob one" aria-hidden="true" />
      <div className="bg-glow-blob two" aria-hidden="true" />

      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-logo" aria-hidden="true">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <path
                d="M16 2C8.268 2 2 8.268 2 16c0 5.3 2.94 9.92 7.28 12.28.38.2.82-.1.82-.54v-3.48c0-.6.38-1.12.94-1.32A10.02 10.02 0 0116 13a1 1 0 011 1v1.5c0 .83.67 1.5 1.5 1.5h1.5a1 1 0 011 1v2c0 .83.67 1.5 1.5 1.5h.5c.44 0 .74.44.54.82A13.98 13.98 0 0030 16c0-7.732-6.268-14-14-14z"
                fill="url(#logoGrad)"
              />
              <path
                d="M16 8c-4.418 0-8 3.582-8 8 0 2.21 1.34 4.1 2.5 5.5.38.46.96.5 1.5.15.54-.35.5-.95.12-1.4A5.99 5.99 0 0110 16c0-3.314 2.686-6 6-6 1.657 0 3 .895 3 2s-1.343 2-3 2v2c2.761 0 5-1.791 5-4s-2.239-4-5-4z"
                fill="#ffffff"
                opacity="0.9"
              />
            </svg>
          </div>
          <div>
            <h1>EcoMindX</h1>
            <p>Personal Carbon Intelligence Platform</p>
          </div>
        </div>

        {user ? (
          <div className="header-profile-section">
            <span className="header-email-badge">{user.email}</span>
            <button
              className="header-avatar"
              onClick={() => setActiveTab("account")}
              title="Go to Profile"
              aria-label="Go to Profile"
            >
              {user.email?.[0].toUpperCase()}
            </button>
            <button className="btn secondary sm" onClick={signOut} disabled={authLoading}>
              Sign Out
            </button>
          </div>
        ) : (
          <button className="btn secondary sm" onClick={() => setActiveTab("account")}>
            Sign In / Register
          </button>
        )}
      </header>

      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="sidebar-nav" role="tablist" aria-label="Dashboard navigation">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                className={`nav-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={tab.icon}
                  ></path>
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <main id="main">
          <div role="alert" aria-live="assertive">
            {error && <p className="error">{error}</p>}
          </div>
          <p role="status" className="visually-hidden">
            {status}
          </p>

          {/* Conditionally render tabs — only the active tab is mounted */}
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === "calculator" && (
              <CalculatorForm onSubmit={calculate} loading={loading} />
            )}

            {activeTab === "analytics" && (
              <AnalyticsTab result={result} lastInput={lastInput} saving={saving} onSave={save} />
            )}

            {activeTab === "insights" &&
              (result && insights ? <InsightsPanel insights={insights} /> : <InsightsEmptyState />)}

            {activeTab === "community" && (
              <CommunityHub
                leaderboardUsers={leaderboardUsers}
                collectiveSaved={collectiveSaved}
                communityTips={communityTips}
                loadingCommunity={loadingCommunity}
                communityError={communityError}
                user={user}
                onShareTip={handleShareTip}
                onDeleteTip={handleDeleteTip}
                onSignInClick={() => setActiveTab("account")}
              />
            )}

            {activeTab === "challenges" && <EcoChallenges highestCategory={highestCategory} />}

            {activeTab === "account" && (
              <AccountPanel
                user={user}
                authLoading={authLoading}
                authError={authError}
                entries={entries}
                saving={saving}
                userEmissions={userEmissions}
                onSignIn={signIn}
                onSignUp={signUp}
                onSignOut={signOut}
                onClaimHistory={claimHistory}
              />
            )}

            {activeTab === "history" && <HistoryPanel entries={entries} />}
          </div>
        </main>
      </div>
    </>
  );
}
