import type { Entry } from "../lib/types";
import { formatDate, formatTonnes } from "../lib/format";

interface Props {
  entries: Entry[];
}

/** Tracking history ledger: lists past calculation entries and trends. */
export function HistoryPanel({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <section className="card" aria-labelledby="history-heading">
        <h2 id="history-heading">
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
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Your history
        </h2>
        <p style={{ color: "var(--muted)", margin: 0, padding: "1.5rem 0", textAlign: "center" }}>
          No saved entries yet. Calculate and save a footprint to start tracking your progress.
        </p>
      </section>
    );
  }

  const latest = entries[0].result.total_annual_tonnes;
  const previous = entries.length > 1 ? entries[1].result.total_annual_tonnes : null;
  const trend = previous === null ? null : latest - previous;

  return (
    <section className="card" aria-labelledby="history-heading">
      <h2 id="history-heading">
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
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Your history
      </h2>

      {trend !== null && (
        <div
          className={`trend-indicator ${trend < 0 ? "down" : trend > 0 ? "up" : "neutral"}`}
          aria-live="polite"
        >
          {trend < 0 ? (
            <span className="under" style={{ fontWeight: 700 }}>
              ▼ Down {formatTonnes(Math.abs(trend))} since your last entry.
            </span>
          ) : trend > 0 ? (
            <span className="over" style={{ fontWeight: 700 }}>
              ▲ Up {formatTonnes(trend)} since your last entry.
            </span>
          ) : (
            <span style={{ fontWeight: 700 }}>No change since your last entry.</span>
          )}
        </div>
      )}

      <table className="history">
        <caption className="visually-hidden">Saved footprint entries, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Total (t CO₂e / year)</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <th scope="row" style={{ color: "var(--muted)", fontWeight: 500 }}>
                {formatDate(e.created_at)}
              </th>
              <td style={{ fontWeight: 700 }}>{formatTonnes(e.result.total_annual_tonnes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
