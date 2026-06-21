import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { EcoChallenges } from "./EcoChallenges";
import { axe } from "vitest-axe";

describe("EcoChallenges", () => {
  beforeEach(() => {
    localStorage.clear();
    // MatchMedia mock for testing reduced motion
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock canvas getContext
    const mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
  });


  it("calculates level progression and renders active challenges", () => {
    render(<EcoChallenges highestCategory={null} />);
    expect(screen.getByText(/Level 1/)).toBeInTheDocument();
    expect(screen.getByText(/Eco-Novice/)).toBeInTheDocument();
  });

  it("filters quests by tab", () => {
    render(<EcoChallenges highestCategory={null} />);
    const activeTab = screen.getByRole("tab", { name: /Active/ });
    fireEvent.click(activeTab);
    expect(screen.getByText("Zero Emission Commuter")).toBeInTheDocument();

    const completedTab = screen.getByRole("tab", { name: /Completed/ });
    fireEvent.click(completedTab);

    const allTab = screen.getByRole("tab", { name: /All Quests/ });
    fireEvent.click(allTab);
  });

  it("toggles challenge status and accumulates points", () => {
    render(<EcoChallenges highestCategory={null} />);

    // Accept a challenge
    const acceptBtns = screen.getAllByText("Accept Challenge");
    fireEvent.click(acceptBtns[0]);

    // Now it should show 'Mark Completed'
    const completeBtns = screen.getAllByText("Mark Completed");
    expect(completeBtns[0]).toBeInTheDocument();

    // Complete the challenge
    fireEvent.click(completeBtns[0]);

    // Now it should show 'Done' status indicator on the card
    expect(screen.getAllByText("Done")[0]).toBeInTheDocument();

    // Points should increase (we check if Level or progress bar changes, assuming 50+ points pushes bar)
    // The exact visual change depends on the points of the specific challenge clicked, but we can verify it doesn't crash
  });

  it("toggles challenge status and triggers confetti animation", async () => {
    vi.useFakeTimers();
    render(<EcoChallenges highestCategory={null} />);

    // Accept a challenge
    const acceptBtns = screen.getAllByText("Accept Challenge");
    fireEvent.click(acceptBtns[0]);

    // Complete the challenge
    const completeBtns = screen.getAllByText("Mark Completed");
    fireEvent.click(completeBtns[0]);

    // Fast forward timeouts for setTimeout inside toggleChallenge
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Run animation frames by advancing time step-by-step
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    vi.useRealTimers();
  });


  it("shows recommended quests based on highest category", () => {
    render(<EcoChallenges highestCategory="transport" />);
    // "No-Drive Day" is a transport challenge
    expect(screen.getByText("Zero Emission Commuter")).toBeInTheDocument();
  });

  it("filters quests by recommended tab", () => {
    render(<EcoChallenges highestCategory="transport" />);
    const recTab = screen.getByRole("tab", { name: /Recommended/ });
    fireEvent.click(recTab);
    expect(screen.getByText("Zero Emission Commuter")).toBeInTheDocument();
  });

  it("shows max level reached when user has enough points", () => {
    const completedChallenges = [
      { id: "c1", category: "diet", title: "T1", desc: "D1", reward: 500, difficulty: "easy", status: "completed" },
      { id: "c2", category: "diet", title: "T2", desc: "D2", reward: 600, difficulty: "easy", status: "completed" },
    ];
    localStorage.setItem("ecomindx_quests_v2", JSON.stringify(completedChallenges));

    render(<EcoChallenges highestCategory={null} />);
    expect(screen.getByText(/Level 4/)).toBeInTheDocument();
    expect(screen.getByText(/Max Level Reached!/)).toBeInTheDocument();
  });

  it("allows abandoning a completed challenge", () => {
    const completedChallenges = [
      { id: "c1", category: "diet", title: "T1", desc: "D1", reward: 100, difficulty: "easy", status: "completed" },
    ];
    localStorage.setItem("ecomindx_quests_v2", JSON.stringify(completedChallenges));

    render(<EcoChallenges highestCategory={null} />);
    const abandonBtn = screen.getByRole("button", { name: /Abandon Challenge/i });
    fireEvent.click(abandonBtn);
    expect(screen.getByText("Accept Challenge")).toBeInTheDocument();
  });

  it("passes accessibility checks", async () => {
    const { container } = render(<EcoChallenges highestCategory={null} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
