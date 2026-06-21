import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InsightsPanel } from "./InsightsPanel";
import { axe } from "vitest-axe";

describe("InsightsPanel", () => {
  const mockInsights = {
    summary: "Test Summary",
    recommendations: [
      {
        category: "transport",
        action: "Use public transit",
        estimated_annual_savings_kg: 500,
      },
      {
        category: "home",
        action: "Use LED bulbs",
        estimated_annual_savings_kg: 200,
      },
    ],
    source: "gemini" as const,
  };

  it("shows recommendations after generation delay", async () => {
    render(<InsightsPanel insights={mockInsights} />);

    // Initially shows generation UI
    expect(screen.getByText("AI is analyzing your footprint...")).toBeInTheDocument();

    // Fast-forward or wait for the useEffect timeout
    await screen.findByText("Test Summary", undefined, { timeout: 3000 });

    expect(screen.getByText(/Use public transit/)).toBeInTheDocument();
    expect(screen.getByText(/500 kg/)).toBeInTheDocument();
  });

  it("updates simulation total when commitments are made", async () => {
    render(<InsightsPanel insights={mockInsights} />);
    await screen.findByText("Test Summary", undefined, { timeout: 3000 });

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // Check public transit

    expect(screen.getByText(/-500 kg/)).toBeInTheDocument(); // Potential savings header updates

    fireEvent.click(checkboxes[1]); // Check LED bulbs
    expect(screen.getByText(/-700 kg/)).toBeInTheDocument();
  });

  it("shows eco-pledge card when commitments are > 0", async () => {
    render(<InsightsPanel insights={mockInsights} />);
    await screen.findByText("Test Summary", undefined, { timeout: 3000 });

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText("My Eco-Pledge")).toBeInTheDocument();
  });

  it("calculates financial multiplier for other categories", async () => {
    const mockInsightsExpanded = {
      summary: "Test Summary",
      recommendations: [
        { category: "diet", action: "Eat veggies", estimated_annual_savings_kg: 100 },
        { category: "consumption", action: "Buy less", estimated_annual_savings_kg: 100 },
        { category: "unknown", action: "Do something else", estimated_annual_savings_kg: 100 },
      ],
      source: "rules" as const,
    };
    render(<InsightsPanel insights={mockInsightsExpanded} />);
    await screen.findByText("Test Summary", undefined, { timeout: 3000 });
    
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);
    expect(screen.getByText(/Est. savings: ~\$75\/yr/)).toBeInTheDocument();
  });

  it("passes accessibility checks", async () => {
    const { container } = render(<InsightsPanel insights={mockInsights} />);
    await screen.findByText("Test Summary", undefined, { timeout: 3000 });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
