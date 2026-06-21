import type { CarbonInput, FootprintResult } from "../lib/types";
import { categoryLabel, formatKg, formatTonnes } from "../lib/format";
import { useEffect, useState } from "react";

interface Props {
  result: FootprintResult;
  input?: CarbonInput | null;
}

/**
 * Redesigned Results breakdown with metric cards, circle gauge, and visual charts.
 * Preserves accessibility table and bar-row selectors for test compatibility.
 */
export function ResultBreakdown({ result, input }: Props) {
  const entries = Object.entries(result.breakdown_kg);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  const overTarget = result.comparison.ratio_to_sustainable_target > 1;

  // Sustainability score: percentage showing how close the user is to the Paris sustainable target.
  const ratioToTarget = result.comparison.ratio_to_sustainable_target;
  const sustainabilityScore = Math.round(Math.min(100, (1 / ratioToTarget) * 100));

  // Circular gauge config
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  // State to trigger mount animations
  const [animate, setAnimate] = useState(false);

  // Find the highest emissions category to select by default
  const highestCategory = entries.reduce(
    (prev, curr) => (curr[1] > prev[1] ? curr : prev),
    entries[0],
  )[0];

  const [selectedCategory, setSelectedCategory] = useState<string>(highestCategory);

  useEffect(() => {
    // Sync default category if result changes
    setSelectedCategory(highestCategory);
  }, [result, highestCategory]);

  useEffect(() => {
    // Trigger animations slightly after mounting
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [result]);

  const targetOffset = circumference - (sustainabilityScore / 100) * circumference;
  const dashoffset = animate ? targetOffset : circumference;

  return (
    <section className="card" aria-labelledby="result-heading">
      <h2 id="result-heading">
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
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        Your estimated footprint
      </h2>

      {/* Grid of Key Metrics */}
      <div className="dashboard-metrics-grid">
        <div className="metric-card">
          <span className="label">Annual Emissions</span>
          <span className={`value total ${overTarget ? "over" : "under"}`}>
            {formatTonnes(result.total_annual_tonnes)} CO₂e
            {overTarget ? (
              <span className="colorblind-indicator over" aria-label="Above target">
                ↑
              </span>
            ) : (
              <span className="colorblind-indicator under" aria-label="Below target">
                ✓
              </span>
            )}
          </span>
          <span className="sub">tonnes per year</span>
        </div>

        <div className="metric-card">
          <span className="label">vs Sustainable Target</span>
          <span className={`value ${overTarget ? "over" : "under"}`}>
            {result.comparison.ratio_to_sustainable_target.toFixed(1)}×
            {overTarget ? (
              <span className="colorblind-indicator over" aria-label="Above target">
                ↑
              </span>
            ) : (
              <span className="colorblind-indicator under" aria-label="Below target">
                ✓
              </span>
            )}
          </span>
          <span className="sub">
            Target: {formatTonnes(result.comparison.sustainable_target_annual_kg / 1000)} CO₂e
          </span>
        </div>

        <div className="metric-card">
          <span className="label">vs Global Average</span>
          <span className="value">{result.comparison.ratio_to_global_average.toFixed(1)}×</span>
          <span className="sub">
            Global avg: {formatTonnes(result.comparison.global_average_annual_kg / 1000)} CO₂e
          </span>
        </div>
      </div>

      {/* Visual Circle Gauge & Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          alignItems: "center",
          marginBottom: "2rem",
        }}
        className="gauge-responsive-split"
      >
        <div className="gauge-wrapper">
          <svg className="gauge-svg" width="140" height="140" viewBox="0 0 120 120">
            <circle className="gauge-bg" cx="60" cy="60" r={radius} />
            <circle
              className={`gauge-fill ${overTarget ? "over" : ""}`}
              cx="60"
              cy="60"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
            />
          </svg>
          <div className="gauge-text">
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
              {sustainabilityScore}%
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Sustain Index
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 500 }}>
            Your sustainability index is{" "}
            <strong className={overTarget ? "over" : "under"}>{sustainabilityScore}%</strong>.
          </p>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
            This footprint represents{" "}
            <strong>{result.comparison.ratio_to_sustainable_target.toFixed(1)}×</strong> the
            sustainable climate target and{" "}
            <strong>{result.comparison.ratio_to_global_average.toFixed(1)}×</strong> the global
            individual average emissions.
          </p>
        </div>
      </div>

      <h3
        style={{
          fontFamily: "var(--font-display)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        Breakdown by category
      </h3>
      <div
        aria-label="Bar chart of emissions by category, values listed in the table below"
        style={{ marginBottom: "2rem" }}
      >
        {entries.map(([key, value]) => {
          const fillWidth = animate ? `${(value / max) * 100}%` : "0%";
          const isActive = selectedCategory === key;
          return (
            <div
              className={`bar-row ${isActive ? "active" : ""}`}
              key={key}
              onClick={() => setSelectedCategory(key)}
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedCategory(key);
                }
              }}
              aria-pressed={isActive}
            >
              <span>{categoryLabel(key)}</span>
              <span className="bar-track" aria-hidden="true">
                <span className="bar-fill" style={{ width: fillWidth }} />
              </span>
              <span>{formatKg(value)}</span>
            </div>
          );
        })}
      </div>

      {/* Interactive Detail Card */}
      {input && (
        <div
          className="card category-detail-card"
          style={{
            marginTop: "1.5rem",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px dashed rgba(16, 185, 129, 0.25)",
          }}
        >
          <h4
            style={{
              margin: "0 0 1rem 0",
              color: "var(--primary-hover)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "1.05rem",
              fontFamily: "var(--font-display)",
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
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Selected Category Analysis: {categoryLabel(selectedCategory)}
          </h4>

          <div
            className="detail-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {selectedCategory === "transport" && (
              <>
                <div className="detail-item">
                  <span className="detail-label">Private Car Travel</span>
                  <span className="detail-value">{input.transport.car_km_per_week} km/week</span>
                  <span className="detail-desc">
                    Fuel type:{" "}
                    <strong style={{ textTransform: "capitalize" }}>
                      {input.transport.car_fuel}
                    </strong>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Public Transit</span>
                  <span className="detail-value">
                    {input.transport.public_transit_km_per_week} km/week
                  </span>
                  <span className="detail-desc">Trains, buses, and subways</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Aviation (Flights)</span>
                  <span className="detail-value">
                    {input.transport.short_haul_flights_per_year +
                      input.transport.long_haul_flights_per_year}{" "}
                    flights/year
                  </span>
                  <span className="detail-desc">
                    Short-haul: {input.transport.short_haul_flights_per_year} • Long-haul:{" "}
                    {input.transport.long_haul_flights_per_year}
                  </span>
                </div>
              </>
            )}

            {selectedCategory === "home" && (
              <>
                <div className="detail-item">
                  <span className="detail-label">Electricity Usage</span>
                  <span className="detail-value">
                    {input.home.electricity_kwh_per_month} kWh/month
                  </span>
                  <span className="detail-desc">Household electricity consumption</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Natural Gas Usage</span>
                  <span className="detail-value">
                    {input.home.natural_gas_kwh_per_month} kWh/month
                  </span>
                  <span className="detail-desc">Heating, cooking, and water utilities</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Household Sharing</span>
                  <span className="detail-value">{input.home.household_size} member(s)</span>
                  <span className="detail-desc">Emissions split equally per resident</span>
                </div>
              </>
            )}

            {selectedCategory === "diet" && (
              <>
                <div className="detail-item">
                  <span className="detail-label">Dietary Preference</span>
                  <span className="detail-value" style={{ textTransform: "capitalize" }}>
                    {input.diet.replace("_", " ")}
                  </span>
                  <span className="detail-desc">
                    {input.diet === "heavy_meat" &&
                      "High impact due to carbon-heavy beef and lamb."}
                    {input.diet === "medium_meat" &&
                      "Typical mixed diet with moderate meat consumption."}
                    {input.diet === "low_meat" &&
                      "Reduced meat intake; lower environmental footprint."}
                    {input.diet === "pescatarian" &&
                      "Fish and plants only; no red meat or poultry."}
                    {input.diet === "vegetarian" && "No meat or fish; includes dairy and eggs."}
                    {input.diet === "vegan" &&
                      "Purely plant-based; lowest possible carbon emissions."}
                  </span>
                </div>
              </>
            )}

            {selectedCategory === "consumption" && (
              <>
                <div className="detail-item">
                  <span className="detail-label">Goods & Shopping Spend</span>
                  <span className="detail-value">
                    ${input.consumption.goods_spend_usd_per_month}/month
                  </span>
                  <span className="detail-desc">
                    Purchases of clothes, electronics, furniture, etc.
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Waste Generated</span>
                  <span className="detail-value">
                    {input.consumption.waste_kg_per_week} kg/week
                  </span>
                  <span className="detail-desc">Trash sent to landfills and incineration</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Accessible data table equivalent of the chart. Keep classes for tests. */}
      <table className="history">
        <caption className="visually-hidden">Annual emissions by category in kg CO2e</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">kg CO₂e / year</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <th scope="row" style={{ color: "var(--muted)" }}>
                {categoryLabel(key)}
              </th>
              <td style={{ fontWeight: 600 }}>{formatKg(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
