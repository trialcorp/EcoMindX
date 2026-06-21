import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { axe } from "vitest-axe";
import { InsightsPanel } from "./InsightsPanel";
import type { InsightsResponse } from "../lib/types";

const baseInsights: InsightsResponse = {
  summary: "Transport is your biggest source of emissions.",
  recommendations: [
    { category: "transport", action: "Take the train", estimated_annual_savings_kg: 800 },
    { category: "diet", action: "More plant-based meals", estimated_annual_savings_kg: 600 },
  ],
  source: "gemini",
};

describe("InsightsPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Render and fast-forward past the generation loading animation. */
  function renderAndFlush(insights: InsightsResponse) {
    const view = render(<InsightsPanel insights={insights} />);
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    return view;
  }

  it(
    "has no accessibility violations",
    async () => {
      // axe-core relies on real timers internally, so run this test outside fake timers.
      vi.useRealTimers();
      const { container } = render(<InsightsPanel insights={baseInsights} />);
      // Wait for the generation delay to resolve naturally.
      await new Promise((r) => setTimeout(r, 1600));
      expect(await axe(container)).toHaveNoViolations();
    },
    10000,
  );

  it("shows a generating state initially", () => {
    render(<InsightsPanel insights={baseInsights} />);
    expect(screen.getByText(/AI is analyzing your footprint/i)).toBeInTheDocument();
  });

  it("labels AI-generated insights as such", () => {
    renderAndFlush(baseInsights);
    expect(screen.getByText("AI-personalized")).toBeInTheDocument();
  });

  it("labels rule-based insights as smart rules", () => {
    renderAndFlush({ ...baseInsights, source: "rules" });
    expect(screen.getByText("Smart rules")).toBeInTheDocument();
  });

  it("renders the summary and every recommendation with its saving", () => {
    renderAndFlush(baseInsights);
    expect(screen.getByText(baseInsights.summary)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText(/take the train/i)).toBeInTheDocument();
    expect(screen.getByText(/800 kg CO₂e \/ year/i)).toBeInTheDocument();
  });
});
