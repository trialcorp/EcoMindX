import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EcoChallenges } from "./EcoChallenges";

describe("EcoChallenges", () => {
  it("allows accepting and completing a challenge", async () => {
    // Ensure localStorage is clean
    localStorage.removeItem("ecomindx_quests_v2");
    
    render(<EcoChallenges highestCategory="transport" />);
    
    // Initially, there should be some challenges not accepted
    const acceptButtons = screen.getAllByRole("button", { name: /accept challenge/i });
    expect(acceptButtons.length).toBeGreaterThan(0);
    
    // Accept the first challenge
    const firstAcceptBtn = acceptButtons[0];
    await userEvent.click(firstAcceptBtn);
    
    // The button for the first challenge should change to "Mark Completed"
    const markCompletedBtns = screen.getAllByRole("button", { name: /mark completed/i });
    expect(markCompletedBtns.length).toBeGreaterThan(0);
    
    // Complete the challenge
    await userEvent.click(markCompletedBtns[0]);
    
    // The first abandon button is the one we just completed
    const abandonBtns = screen.getAllByRole("button", { name: /abandon challenge/i });
    expect(abandonBtns.length).toBeGreaterThan(0);
  });
});
