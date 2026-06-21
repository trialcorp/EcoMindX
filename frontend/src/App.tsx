import { useState, useEffect, useRef } from "react";
import { CalculatorForm } from "./components/CalculatorForm";
import { ResultBreakdown } from "./components/ResultBreakdown";
import { InsightsPanel } from "./components/InsightsPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { useFootprint } from "./hooks/useFootprint";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import { categoryLabel } from "./lib/format";

type TabType =
  | "calculator"
  | "analytics"
  | "insights"
  | "community"
  | "challenges"
  | "account"
  | "history";

interface Challenge {
  id: string;
  category: "diet" | "transport" | "home" | "consumption";
  title: string;
  desc: string;
  reward: number;
  difficulty: "easy" | "medium" | "hard";
  status: "not_accepted" | "accepted" | "completed";
}

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: "c1",
    category: "diet",
    title: "Meatless Week Challenge",
    desc: "Swap all meats for healthy plant-based alternatives for 7 consecutive days.",
    reward: 250,
    difficulty: "medium",
    status: "not_accepted",
  },
  {
    id: "c2",
    category: "transport",
    title: "Zero Emission Commuter",
    desc: "Walk, bike, or ride public transit to commute instead of driving a personal vehicle for 5 days.",
    reward: 400,
    difficulty: "hard",
    status: "accepted",
  },
  {
    id: "c3",
    category: "consumption",
    title: "Plastic-Free Weekend",
    desc: "Avoid purchasing, accepting, or using any single-use plastics for 48 hours.",
    reward: 150,
    difficulty: "easy",
    status: "not_accepted",
  },
  {
    id: "c4",
    category: "home",
    title: "Power Down Hour",
    desc: "Turn off all electronic appliances, monitors, and non-critical devices for 1 hour every evening for 5 days.",
    reward: 100,
    difficulty: "easy",
    status: "completed",
  },
  {
    id: "c5",
    category: "diet",
    title: "Plant-Powered Hero",
    desc: "Eat only fully vegetarian or vegan meals for 3 consecutive days.",
    reward: 150,
    difficulty: "easy",
    status: "not_accepted",
  },
  {
    id: "c6",
    category: "diet",
    title: "Zero Food Waste Champion",
    desc: "Plan all meals, store food properly, and eat all leftovers without throwing anything away for a week.",
    reward: 200,
    difficulty: "easy",
    status: "not_accepted",
  },
  {
    id: "c7",
    category: "transport",
    title: "Active Commute Starter",
    desc: "Walk or bicycle for any short trip under 3 kilometers instead of driving.",
    reward: 180,
    difficulty: "easy",
    status: "not_accepted",
  },
  {
    id: "c8",
    category: "transport",
    title: "Flight-Free Explorer",
    desc: "Commit to using train or car sharing for your next intercity trip rather than flying.",
    reward: 500,
    difficulty: "hard",
    status: "not_accepted",
  },
  {
    id: "c9",
    category: "home",
    title: "Vampire Power Slayer",
    desc: "Unplug all chargers, media players, and small appliances when they are not actively in use for a week.",
    reward: 120,
    difficulty: "easy",
    status: "not_accepted",
  },
  {
    id: "c10",
    category: "home",
    title: "Thermostat Balancer",
    desc: "Adjust your heating thermostat down by 1°C (or AC up by 1°C) for 7 consecutive days.",
    reward: 180,
    difficulty: "medium",
    status: "not_accepted",
  },
  {
    id: "c11",
    category: "consumption",
    title: "Pre-Loved Fashion Finder",
    desc: "Acquire your next clothing item or household good second-hand rather than buying new.",
    reward: 200,
    difficulty: "medium",
    status: "not_accepted",
  },
  {
    id: "c12",
    category: "consumption",
    title: "Digital De-clutter",
    desc: "Delete 1,000 unneeded emails or cloud files to help reduce energy consumed by global data centers.",
    reward: 100,
    difficulty: "easy",
    status: "not_accepted",
  },
];

interface LevelInfo {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
}

const LEVELS: LevelInfo[] = [
  { level: 1, name: "Eco-Novice", minPoints: 0, maxPoints: 300 },
  { level: 2, name: "Green Guardian", minPoints: 300, maxPoints: 600 },
  { level: 3, name: "Carbon Warrior", minPoints: 600, maxPoints: 1000 },
  { level: 4, name: "Sustainability Champion", minPoints: 1000, maxPoints: 99999 },
];

function getLevelInfo(points: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

function CategoryPill({ category }: { category: "diet" | "transport" | "home" | "consumption" }) {
  const label = categoryLabel(category);

  const renderIcon = () => {
    switch (category) {
      case "diet":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2c5.522 0 10 4.477 10 10S17.522 22 12 22 2 17.522 2 12 6.478 2 12 2z" />
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
            <path d="M12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
        );
      case "transport":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5.5 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
            <path d="M18.5 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
            <path d="M12 5v14" />
            <path d="M18.5 12.5H12M5.5 12.5H12" />
            <path d="M12 5h6.5a2.5 2.5 0 0 1 2.5 2.5v1" />
          </svg>
        );
      case "home":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        );
      case "consumption":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span className={`challenge-category-pill ${category}`}>
      {renderIcon()}
      {label}
    </span>
  );
}

/**
 * EcoMindX Application Shell - Phase 2
 * Overhauled to add Supabase Auth profile forms, Eco-Quests, and a Community Leaderboard.
 */
export default function App() {
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
    // Auth exposures
    user,
    authLoading,
    authError,
    signIn,
    signUp,
    signOut,
    claimHistory,
    // Community Hub exposures
    leaderboard,
    collectiveSaved,
    tips: communityTips,
    loadingCommunity,
    communityError,
    shareTip,
    deleteTip,
  } = useFootprint();

  const [activeTab, setActiveTab] = useState<TabType>("calculator");

  // Auth form credentials state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [localAuthError, setLocalAuthError] = useState<string | null>(null);

  // Tip sharing form state
  const [tipCategory, setTipCategory] = useState("Mobility");
  const [tipTitle, setTipTitle] = useState("");
  const [tipDesc, setTipDesc] = useState("");
  const [tipAuthorName, setTipAuthorName] = useState("");
  const [tipSuccess, setTipSuccess] = useState<string | null>(null);
  const [sharingTip, setSharingTip] = useState(false);

  const handleShareTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipTitle.trim() || !tipDesc.trim()) return;
    setSharingTip(true);
    setTipSuccess(null);
    try {
      const author = tipAuthorName.trim() || (user?.email ? user.email.split("@")[0] : "Anonymous");
      await shareTip(tipCategory, tipTitle.trim(), tipDesc.trim(), author);
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
      !window.confirm("Are you sure you want to delete this eco-tip? This action cannot be undone.")
    ) {
      return;
    }
    try {
      await deleteTip(tipId);
    } catch (err) {
      console.error("Failed to delete tip:", err);
    }
  };

  // Quest filtering state
  const [questFilter, setQuestFilter] = useState<"all" | "active" | "completed" | "recommended">(
    "all",
  );

  // Confetti Canvas Ref
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gamified challenges state loaded from localStorage
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    try {
      const saved = localStorage.getItem("ecomindx_quests_v2");
      if (saved) {
        const parsed = JSON.parse(saved) as Challenge[];
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load quests from localStorage:", e);
    }
    return DEFAULT_CHALLENGES;
  });

  // Save quests state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ecomindx_quests_v2", JSON.stringify(challenges));
    } catch (e) {
      console.warn("Failed to save quests to localStorage:", e);
    }
  }, [challenges]);

  // Sync to Analytics tab when calculation completes
  useEffect(() => {
    if (result) {
      setActiveTab("analytics");
    }
  }, [result]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalAuthError(null);
    if (!email || !password) {
      setLocalAuthError("Please provide both email and password.");
      return;
    }
    if (password.length < 6) {
      setLocalAuthError("Password must be at least 6 characters.");
      return;
    }
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      const error = err as Error;
      setLocalAuthError(error.message || "Authentication failed.");
    }
  };

  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    const colors = ["#10b981", "#34d399", "#059669", "#fbbf24", "#3b82f6", "#60a5fa"];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height + 15,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 16,
        speedY: -Math.random() * 14 - 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    let animationId: number;

    const run = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach((p) => {
        if (p.opacity <= 0) return;

        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.25; // gravity
        p.speedX *= 0.98; // drag
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

        if (p.y < canvas.height && p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;

          if (p.color === "#10b981" || p.color === "#34d399") {
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          }
          ctx.restore();
        }
      });

      if (alive) {
        animationId = requestAnimationFrame(run);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    run();

    return () => {
      cancelAnimationFrame(animationId);
    };
  };

  const toggleChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          let nextStatus: "not_accepted" | "accepted" | "completed" = "not_accepted";
          if (c.status === "not_accepted") {
            nextStatus = "accepted";
          } else if (c.status === "accepted") {
            nextStatus = "completed";
            setTimeout(() => triggerConfetti(), 50);
          } else {
            nextStatus = "not_accepted";
          }
          return { ...c, status: nextStatus };
        }
        return c;
      }),
    );
  };

  // Dynamically calculate user ranking on the leaderboard based on emissions
  const userEmissions = result
    ? result.total_annual_tonnes
    : entries.length > 0
      ? entries[0].result.total_annual_tonnes
      : null;

  const leaderboardUsers = leaderboard.map((item) => ({
    name: item.display_name,
    score: item.score,
    isUser: user ? item.user_id === user.id : false,
    userId: item.user_id,
  }));

  if (userEmissions !== null) {
    const alreadyExists = leaderboardUsers.some(
      (item) => item.isUser || (user && item.userId === user.id),
    );
    if (!alreadyExists) {
      leaderboardUsers.push({
        name: user?.email ? `${user.email.split("@")[0]} (You)` : "You",
        score: Number(userEmissions.toFixed(2)),
        isUser: true,
        userId: user?.id || "anonymous",
      });
    }
  }

  // Sort by score ascending (lowest emissions first)
  leaderboardUsers.sort((a, b) => a.score - b.score);

  // Compute highest emission category from result
  const getHighestEmissionCategory = () => {
    if (!result || !result.breakdown_kg) return null;
    const { transport, home, diet, consumption } = result.breakdown_kg;
    const entriesList = Object.entries({ transport, home, diet, consumption });
    entriesList.sort((a, b) => b[1] - a[1]);
    return entriesList[0][0]; // 'transport' | 'home' | 'diet' | 'consumption'
  };

  const highestCategory = getHighestEmissionCategory();

  // Compute points and level progress
  const totalPoints = challenges
    .filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + c.reward, 0);
  const levelInfo = getLevelInfo(totalPoints);
  const activeQuestsCount = challenges.filter((c) => c.status === "accepted").length;
  const completedQuestsCount = challenges.filter((c) => c.status === "completed").length;

  const pointsInCurrentLevel = totalPoints - levelInfo.minPoints;
  const levelRange = levelInfo.maxPoints - levelInfo.minPoints;
  const progressPercent =
    levelInfo.level === 4
      ? 100
      : Math.min(100, Math.max(0, (pointsInCurrentLevel / levelRange) * 100));
  const pointsToNextLevel = levelInfo.maxPoints - totalPoints;

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
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {user.email?.[0].toUpperCase()}
            </button>
            <button
              className="btn secondary"
              onClick={signOut}
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", fontWeight: 700 }}
              disabled={authLoading}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            className="btn secondary"
            onClick={() => setActiveTab("account")}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", fontWeight: 700 }}
          >
            Sign In / Register
          </button>
        )}
      </header>

      <div className="dashboard-container">
        <aside className="sidebar">
          <nav className="sidebar-nav" aria-label="Dashboard navigation">
            <button
              className={`nav-tab-btn ${activeTab === "calculator" ? "active" : ""}`}
              onClick={() => setActiveTab("calculator")}
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
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                ></path>
              </svg>
              Carbon Calculator
            </button>
            <button
              className={`nav-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
                ></path>
              </svg>
              Sustain Analytics
            </button>
            <button
              className={`nav-tab-btn ${activeTab === "insights" ? "active" : ""}`}
              onClick={() => setActiveTab("insights")}
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
              AI Action Plan
            </button>
            <button
              className={`nav-tab-btn ${activeTab === "community" ? "active" : ""}`}
              onClick={() => setActiveTab("community")}
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              Community Hub
            </button>
            <button
              className={`nav-tab-btn ${activeTab === "challenges" ? "active" : ""}`}
              onClick={() => setActiveTab("challenges")}
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
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                ></path>
              </svg>
              Eco-Challenges
            </button>
            <button
              className={`nav-tab-btn ${activeTab === "account" ? "active" : ""}`}
              onClick={() => setActiveTab("account")}
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              My Account
            </button>
            <button
              className={`nav-tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Tracking History
            </button>
          </nav>
        </aside>

        <main id="main">
          {/* 1. Carbon Calculator */}
          <div className={activeTab === "calculator" ? "tab-content" : "tab-content hidden"}>
            <CalculatorForm onSubmit={calculate} loading={loading} />
          </div>

          <div role="alert" aria-live="assertive">
            {error && <p className="error">{error}</p>}
          </div>
          <p role="status" className="visually-hidden">
            {status}
          </p>

          {/* 2. Sustain Analytics */}
          <div className={activeTab === "analytics" ? "tab-content" : "tab-content hidden"}>
            {result && activeTab === "analytics" ? (
              <>
                <ResultBreakdown result={result} input={lastInput} />
                <div
                  className="card"
                  style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}
                >
                  <button
                    className="btn secondary"
                    onClick={save}
                    disabled={saving}
                    aria-busy={saving}
                  >
                    {saving ? (
                      <>
                        <svg
                          className="spinner"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ marginRight: "0.5rem" }}
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
                        Saving…
                      </>
                    ) : (
                      "Save this entry to my history"
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ color: "var(--muted)", marginBottom: "1rem" }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h2
                  style={{
                    border: "none",
                    padding: 0,
                    margin: "0 0 0.5rem 0",
                    justifyContent: "center",
                  }}
                >
                  No Assessment Data
                </h2>
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  Please complete your annual footprint assessment first in the Carbon Calculator
                  tab.
                </p>
              </div>
            )}
          </div>

          {/* 3. AI Action Plan */}
          <div className={activeTab === "insights" ? "tab-content" : "tab-content hidden"}>
            {result && insights ? (
              <InsightsPanel insights={insights} />
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ color: "var(--muted)", marginBottom: "1rem" }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 21m0-12h.01M21 12h-6m-6 0H3m12.938-3.097L15 3m-9 9.904L5 15m13.062-7.904l.938-3"
                  />
                </svg>
                <h2
                  style={{
                    border: "none",
                    padding: 0,
                    margin: "0 0 0.5rem 0",
                    justifyContent: "center",
                  }}
                >
                  No Insights Available
                </h2>
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  Calculate your carbon footprint first to generate personalized AI recommendations.
                </p>
              </div>
            )}
          </div>

          {/* 4. Community Hub (NEW) */}
          <div className={activeTab === "community" ? "tab-content" : "tab-content hidden"}>
            <section className="card">
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
          </div>

          {/* 5. Eco-Challenges (NEW) */}
          <div className={activeTab === "challenges" ? "tab-content" : "tab-content hidden"}>
            <section className="card">
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
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                Gamified Eco-Quests
              </h2>

              <div className="challenges-summary">
                {/* Level Card */}
                <div className="level-card">
                  <div className="level-info-row">
                    <div className="level-details">
                      <h3>
                        Level {levelInfo.level}: {levelInfo.name}
                      </h3>
                    </div>
                    <span className="level-badge">Rank {levelInfo.level}</span>
                  </div>

                  <div className="level-progress-container">
                    <div className="level-progress-text">
                      <span>Level Progress</span>
                      {levelInfo.level === 4 ? (
                        <span>Max Level Reached!</span>
                      ) : (
                        <span>
                          {pointsToNextLevel} pts to Level {levelInfo.level + 1}
                        </span>
                      )}
                    </div>
                    <div className="level-progress-track">
                      <div
                        className="level-progress-fill"
                        style={{ width: `${progressPercent}%` }}
                        role="progressbar"
                        aria-valuenow={progressPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Level progress"
                      />
                    </div>
                  </div>
                </div>

                {/* Score Widget */}
                <div className="metric-highlight-card">
                  <span className="points-label">Total Score</span>
                  <div className="points-val">{totalPoints} pts</div>
                  <span className="quests-count-label">
                    {activeQuestsCount} Active • {completedQuestsCount} Done
                  </span>
                </div>
              </div>

              {/* Quest Filter Tabs */}
              <div className="quest-filters" role="tablist" aria-label="Filter quests">
                <button
                  className={`quest-filter-btn ${questFilter === "all" ? "active" : ""}`}
                  onClick={() => setQuestFilter("all")}
                  role="tab"
                  aria-selected={questFilter === "all"}
                >
                  All Quests ({challenges.length})
                </button>
                <button
                  className={`quest-filter-btn ${questFilter === "active" ? "active" : ""}`}
                  onClick={() => setQuestFilter("active")}
                  role="tab"
                  aria-selected={questFilter === "active"}
                >
                  Active ({activeQuestsCount})
                </button>
                <button
                  className={`quest-filter-btn ${questFilter === "completed" ? "active" : ""}`}
                  onClick={() => setQuestFilter("completed")}
                  role="tab"
                  aria-selected={questFilter === "completed"}
                >
                  Completed ({completedQuestsCount})
                </button>
                <button
                  className={`quest-filter-btn ${questFilter === "recommended" ? "active" : ""}`}
                  onClick={() => setQuestFilter("recommended")}
                  role="tab"
                  aria-selected={questFilter === "recommended"}
                  disabled={!highestCategory}
                  title={
                    !highestCategory
                      ? "Complete footprint calculation first"
                      : `Recommended based on top emission: ${categoryLabel(highestCategory || "")}`
                  }
                >
                  Recommended{" "}
                  {highestCategory
                    ? `(${challenges.filter((c) => c.category === highestCategory).length})`
                    : ""}
                </button>
              </div>

              {/* Challenges Grid */}
              <div className="challenges-grid">
                {challenges
                  .filter((quest) => {
                    if (questFilter === "all") return true;
                    if (questFilter === "active") return quest.status === "accepted";
                    if (questFilter === "completed") return quest.status === "completed";
                    if (questFilter === "recommended") return quest.category === highestCategory;
                    return true;
                  })
                  .map((quest) => {
                    const isRecommended = highestCategory === quest.category;
                    return (
                      <div key={quest.id} className={`challenge-card ${quest.status}`}>
                        <div className="challenge-card-header">
                          <div className="challenge-tags-group">
                            <CategoryPill category={quest.category} />
                            <span className={`challenge-difficulty-pill ${quest.difficulty}`}>
                              {quest.difficulty}
                            </span>
                          </div>

                          <div className="challenge-reward-status">
                            <span className="challenge-reward-badge" title="Reward points">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ marginRight: "2px" }}
                              >
                                <circle cx="12" cy="12" r="8" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                              </svg>
                              +{quest.reward}
                            </span>
                            {quest.status !== "not_accepted" && (
                              <span className={`challenge-status-indicator ${quest.status}`}>
                                {quest.status === "accepted" ? "Active" : "Done"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="challenge-title-group">
                          {isRecommended && (
                            <span className="challenge-recommended-badge">
                              ✨ Recommended for You
                            </span>
                          )}
                          <h3 className="challenge-title">{quest.title}</h3>
                        </div>

                        <p className="challenge-desc">{quest.desc}</p>

                        <button
                          type="button"
                          className={`btn ${quest.status === "not_accepted" ? "" : "secondary"}`}
                          onClick={() => toggleChallenge(quest.id)}
                          aria-label={`${quest.status === "not_accepted" ? "Accept" : quest.status === "accepted" ? "Mark completed for" : "Abandon"} challenge ${quest.title}`}
                        >
                          {quest.status === "not_accepted"
                            ? "Accept Challenge"
                            : quest.status === "accepted"
                              ? "Mark Completed"
                              : "Abandon Challenge"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>

          {/* 6. My Account / Profile (NEW) */}
          <div className={activeTab === "account" ? "tab-content" : "tab-content hidden"}>
            {user ? (
              <section className="card">
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Your Profile Profile
                </h2>

                <div className="profile-card card">
                  <div className="profile-avatar-large">{user.email?.[0].toUpperCase()}</div>
                  <div className="profile-details">
                    <h3>{user.email}</h3>
                    <p>EcoMindX Member since today</p>
                  </div>
                </div>

                {/* Claim Device History Banner (If local entries exist) */}
                {entries.length > 0 && entries.some((e) => !e.user_id) && (
                  <div className="sync-history-banner">
                    <div className="sync-history-text">
                      <h4>Sync Local History</h4>
                      <p>
                        You have footprint snapshots on this device saved before logging in. Link
                        them to your account now.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn"
                      onClick={claimHistory}
                      disabled={saving}
                      style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                    >
                      {saving ? "Syncing..." : "Sync History"}
                    </button>
                  </div>
                )}

                <div className="dashboard-metrics-grid" style={{ marginBottom: "1.5rem" }}>
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

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={signOut}
                    disabled={authLoading}
                  >
                    {authLoading ? "Logging Out..." : "Sign Out"}
                  </button>
                </div>
              </section>
            ) : (
              <section className="card auth-box">
                <div className="auth-header">
                  <h3>{isSignUp ? "Create EcoMindX Account" : "Access Personal Intelligence"}</h3>
                  <p>
                    {isSignUp ? "Already have an account?" : "New to EcoMindX?"}{" "}
                    <button
                      type="button"
                      className="auth-toggle-link"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setLocalAuthError(null);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        font: "inherit",
                      }}
                    >
                      {isSignUp ? "Sign In" : "Register"}
                    </button>
                  </p>
                </div>

                {localAuthError && <div className="auth-error-alert">{localAuthError}</div>}
                {authError && !localAuthError && (
                  <div className="auth-error-alert">{authError}</div>
                )}

                {!isSupabaseConfigured && (
                  <div className="auth-error-alert" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgb(239, 68, 68)", color: "rgb(252, 165, 165)", marginTop: "1rem", marginBottom: "1rem" }}>
                    <strong>Setup Required:</strong> Vercel is missing your Supabase keys. You must add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your Vercel Project Settings &gt; Environment Variables, and redeploy.
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
                    />
                  </div>

                  <div className="auth-actions">
                    <button type="submit" className="btn" disabled={authLoading}>
                      {authLoading ? (
                        <>
                          <svg
                            className="spinner"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ marginRight: "0.5rem" }}
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
            )}
          </div>

          {/* 7. History Ledger */}
          <div className={activeTab === "history" ? "tab-content" : "tab-content hidden"}>
            <HistoryPanel entries={entries} />
          </div>
        </main>
      </div>

      {/* Confetti Overlay Canvas */}
      <canvas ref={confettiCanvasRef} className="confetti-canvas" />
    </>
  );
}
