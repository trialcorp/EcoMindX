import { useState, useEffect } from "react";

const ECO_FACTS = [
  "Did you know? Switching to LED bulbs can reduce your lighting energy use by up to 90%.",
  "A plant-based diet can reduce your food-related carbon footprint by up to 73%.",
  "Carpooling just twice a week can keep 1,500 pounds of greenhouse gases out of the air each year.",
  "Unplugging idle electronics can save you up to $100 a year and reduce phantom energy loads.",
  "Reducing your thermostat by just 1 degree in winter can cut your heating bill by up to 10%."
];

export function InsightsEmptyState() {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % ECO_FACTS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card insights-empty-wrapper" style={{ position: "relative", overflow: "hidden" }}>
      {/* Blurred background mock elements */}
      <div className="blurred-mockup" aria-hidden="true">
        <div className="mock-title"></div>
        <div className="mock-text"></div>
        <div className="mock-text short"></div>
        <div className="mock-list">
          <div className="mock-item"></div>
          <div className="mock-item"></div>
          <div className="mock-item"></div>
        </div>
      </div>
      
      {/* Foreground Content */}
      <div className="empty-state-content" style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "3rem 2rem" }}>
        <div className="scanning-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ color: "var(--primary)" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 21m0-12h.01M21 12h-6m-6 0H3m12.938-3.097L15 3m-9 9.904L5 15m13.062-7.904l.938-3"
            />
          </svg>
        </div>
        <h2 style={{ border: "none", padding: 0, margin: "1rem 0 0.5rem 0", justifyContent: "center", background: "none", color: "#fff" }}>
          Awaiting Your Data
        </h2>
        <p style={{ color: "var(--text)", margin: "0 0 2rem 0" }}>
          Calculate your footprint to unlock your personalized, AI-generated action plan.
        </p>

        <div className="eco-fact-box" aria-live="polite">
          <span className="fact-label">Eco Fact</span>
          <p className="fact-text" key={factIndex}>{ECO_FACTS[factIndex]}</p>
        </div>
      </div>
    </div>
  );
}
