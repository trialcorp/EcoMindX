import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { InsightsEmptyState } from "./InsightsEmptyState";
import { axe } from "vitest-axe";
import { act } from "react";

describe("InsightsEmptyState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders awaiting data message", () => {
    render(<InsightsEmptyState />);
    expect(screen.getByText("Awaiting Your Data")).toBeInTheDocument();
  });

  it("cycles through eco facts", () => {
    render(<InsightsEmptyState />);
    const firstFact = screen.getByText(/Did you know\? Switching to LED bulbs/);
    expect(firstFact).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    const secondFact = screen.getByText(/A plant-based diet can reduce/);
    expect(secondFact).toBeInTheDocument();
  });

  it("passes accessibility checks", async () => {
    // vitest-axe does not handle fake timers well
    vi.useRealTimers();
    const { container } = render(<InsightsEmptyState />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
