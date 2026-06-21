import type { Entry } from "../lib/types";
import { formatDate, formatTonnes } from "../lib/format";

/** Props for the {@link HistoryPanel} component. */
interface Props {
  /** Array of saved footprint entries, newest first. */
  entries: Entry[];
}

/**
 * Tracking history ledger: lists past entries with trend indicators and
 * an interactive SVG sparkline chart showing emission changes over time.
 */
export function HistoryPanel({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <section className="card" aria-labelledby="history-heading">
        <h2 id="history-heading">
          <svg aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="history-card-title-icon"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Your history
        </h2>
        <p className="history-empty-note">
          No saved entries yet. Calculate and save a footprint to start tracking your progress.
        </p>
      </section>
    );
  }

  const latest = entries[0].result.total_annual_tonnes;
  const previous = entries.length > 1 ? entries[1].result.total_annual_tonnes : null;
  const trend = previous === null ? null : latest - previous;

  // Prepare data for sparkline chart (chronological order)
  const chartData = [...entries].reverse();
  const maxEmissions = Math.max(...chartData.map((e) => e.result.total_annual_tonnes));
  const minEmissions = Math.min(0, ...chartData.map((e) => e.result.total_annual_tonnes));

  // Chart dimensions
  const svgWidth = 800;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 40;
  const graphWidth = svgWidth - 2 * paddingX;
  const graphHeight = svgHeight - 2 * paddingY;

  // Scale functions
  const xScale = (index: number) =>
    paddingX + (index / Math.max(1, chartData.length - 1)) * graphWidth;
  const yScale = (val: number) =>
    paddingY +
    graphHeight -
    ((val - minEmissions) / Math.max(1, maxEmissions - minEmissions)) * graphHeight;

  // Generate path string
  const pathD = chartData
    .map((e, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(e.result.total_annual_tonnes)}`)
    .join(" ");

  // Generate fill path (area under the curve)
  const fillPathD = `${pathD} L ${xScale(chartData.length - 1)} ${paddingY + graphHeight} L ${paddingX} ${paddingY + graphHeight} Z`;

  return (
    <section className="card" aria-labelledby="history-heading">
      <h2 id="history-heading">
        <svg aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="history-card-title-icon"
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
            <span className="under history-trend-bold">
              ▼ Down {formatTonnes(Math.abs(trend))} since your last entry.
            </span>
          ) : trend > 0 ? (
            <span className="over history-trend-bold">
              ▲ Up {formatTonnes(trend)} since your last entry.
            </span>
          ) : (
            <span className="history-trend-bold">No change since your last entry.</span>
          )}
        </div>
      )}

      {chartData.length > 1 && (
        <div
          className="trend-chart-container"
          aria-label="Line chart showing your emissions trend over time"
        >
          <h3 className="trend-chart-title">Emissions Trend</h3>
          <div className="trend-chart-svg-wrapper">
            <svg aria-hidden="true"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="trend-chart-svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={svgWidth - paddingX}
                y2={paddingY}
                className="chart-grid-line"
              />
              <line
                x1={paddingX}
                y1={paddingY + graphHeight / 2}
                x2={svgWidth - paddingX}
                y2={paddingY + graphHeight / 2}
                className="chart-grid-line"
              />
              <line
                x1={paddingX}
                y1={paddingY + graphHeight}
                x2={svgWidth - paddingX}
                y2={paddingY + graphHeight}
                className="chart-grid-line"
              />

              {/* Data Area */}
              <path d={fillPathD} fill="url(#chartGradient)" />

              {/* Data Line */}
              <path
                d={pathD}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {chartData.map((e, i) => (
                <circle
                  key={e.id}
                  cx={xScale(i)}
                  cy={yScale(e.result.total_annual_tonnes)}
                  r="5"
                  className="chart-point"
                >
                  <title>
                    {formatDate(e.created_at)}: {formatTonnes(e.result.total_annual_tonnes)} t
                  </title>
                </circle>
              ))}

              {/* Labels */}
              <text x={10} y={paddingY + 5} className="chart-label">
                Max
              </text>
              <text x={10} y={paddingY + graphHeight} className="chart-label">
                0
              </text>
            </svg>
          </div>
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
              <th scope="row" className="history-table-rowheader">
                {formatDate(e.created_at)}
              </th>
              <td className="history-table-data-bold">
                {formatTonnes(e.result.total_annual_tonnes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
