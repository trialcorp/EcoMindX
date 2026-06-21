import type { FootprintResult, CarbonInput } from "../lib/types";
import { ResultBreakdown } from "./ResultBreakdown";

interface Props {
  result: FootprintResult | null;
  lastInput: CarbonInput | null;
  saving: boolean;
  onSave: () => void;
}

/**
 * Analytics tab — displays the ResultBreakdown and a "Save to history" button.
 */
export function AnalyticsTab({ result, lastInput, saving, onSave }: Props) {
  if (!result) {
    return (
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
          Please complete your annual footprint assessment first in the Carbon Calculator tab.
        </p>
      </div>
    );
  }

  return (
    <>
      <ResultBreakdown result={result} input={lastInput} />
      <div
        className="card"
        style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}
      >
        <button className="btn secondary" onClick={onSave} disabled={saving} aria-busy={saving}>
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
  );
}
