import type { FootprintResult, CarbonInput } from "../lib/types";
import { ResultBreakdown } from "./ResultBreakdown";

/** Props for the {@link AnalyticsTab} component. */
interface Props {
  /** The computed footprint result, or `null` if no assessment yet. */
  result: FootprintResult | null;
  /** The original lifestyle input data, or `null`. */
  lastInput: CarbonInput | null;
  /** Whether a save operation is in progress. */
  saving: boolean;
  /** Callback to persist the current result to history. */
  onSave: () => void;
}

/**
 * Analytics tab — displays the ResultBreakdown and a "Save to history" button.
 */
export function AnalyticsTab({ result, lastInput, saving, onSave }: Props) {
  if (!result) {
    return (
      <div className="card text-center py-xl">
        <svg
          aria-hidden="true"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="icon-muted mb-m"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="m-0 text-center border-none p-0">No Assessment Data</h2>
        <p className="text-muted m-0">
          Please complete your annual footprint assessment first in the Carbon Calculator tab.
        </p>
      </div>
    );
  }

  return (
    <>
      <ResultBreakdown result={result} input={lastInput} />
      <div className="card flex-end mt-m">
        <button className="btn secondary" onClick={onSave} disabled={saving} aria-busy={saving}>
          {saving ? (
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
