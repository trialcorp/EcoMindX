import { useState, useEffect, useRef } from "react";
import { categoryLabel } from "../lib/format";

interface Challenge {
  id: string;
  category: "diet" | "transport" | "home" | "consumption";
  title: string;
  desc: string;
  reward: number;
  difficulty: "easy" | "medium" | "hard";
  status: "not_accepted" | "accepted" | "completed";
}

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

function CategoryPill({ category }: { category: "diet" | "transport" | "home" | "consumption" }) {
  const label = categoryLabel(category);

  const renderIcon = () => {
    switch (category) {
      case "diet":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2c5.522 0 10 4.477 10 10S17.522 22 12 22 2 17.522 2 12 6.478 2 12 2z" />
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
            <path d="M12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
        );
      case "transport":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.5 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
            <path d="M18.5 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
            <path d="M12 5v14" />
            <path d="M18.5 12.5H12M5.5 12.5H12" />
            <path d="M12 5h6.5a2.5 2.5 0 0 1 2.5 2.5v1" />
          </svg>
        );
      case "home":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        );
      case "consumption":
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

interface Props {
  highestCategory: string | null;
}

/**
 * Eco-Challenges tab — gamified quests with level progression, filtering, and confetti.
 */
export function EcoChallenges({ highestCategory }: Props) {
  const [questFilter, setQuestFilter] = useState<"all" | "active" | "completed" | "recommended">(
    "all",
  );
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  useEffect(() => {
    try {
      localStorage.setItem("ecomindx_quests_v2", JSON.stringify(challenges));
    } catch (e) {
      console.warn("Failed to save quests to localStorage:", e);
    }
  }, [challenges]);

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
        p.speedY += 0.25;
        p.speedX *= 0.98;
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
    return () => cancelAnimationFrame(animationId);
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
      <section className="card" role="region" aria-label="Eco-Challenges">
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

          <div className="metric-highlight-card">
            <span className="points-label">Total Score</span>
            <div className="points-val">{totalPoints} pts</div>
            <span className="quests-count-label">
              {activeQuestsCount} Active • {completedQuestsCount} Done
            </span>
          </div>
        </div>

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

      <canvas ref={confettiCanvasRef} className="confetti-canvas" />
    </>
  );
}
