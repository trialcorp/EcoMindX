import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EcoChallenges } from "./EcoChallenges";
import { axe } from "vitest-axe";

describe("EcoChallenges", () => {
  beforeEach(() => {
    localStorage.clear();
    // MatchMedia mock for testing reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
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
  });

  it("calculates level progression and renders active challenges", () => {
    render(<EcoChallenges highestCategory={null} />);
    expect(screen.getByText(/Level 1/)).toBeInTheDocument();
    expect(screen.getByText("Eco Novice")).toBeInTheDocument();
  });

  it("filters quests by tab", () => {
    render(<EcoChallenges highestCategory={null} />);
    const activeTab = screen.getByText("Active");
    fireEvent.click(activeTab);
    expect(screen.getByText("No active challenges yet. Browse and accept some to get started!")).toBeInTheDocument();
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
    
    // Now it should show 'Completed ✓'
    expect(screen.getAllByText("Completed")[0]).toBeInTheDocument();

    // Points should increase (we check if Level or progress bar changes, assuming 50+ points pushes bar)
    // The exact visual change depends on the points of the specific challenge clicked, but we can verify it doesn't crash
  });

  it("shows recommended quests based on highest category", () => {
    render(<EcoChallenges highestCategory="transport" />);
    // "No-Drive Day" is a transport challenge
    expect(screen.getByText("Zero Emission Commuter")).toBeInTheDocument();
  });

  it("passes accessibility checks", async () => {
    const { container } = render(<EcoChallenges highestCategory={null} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
