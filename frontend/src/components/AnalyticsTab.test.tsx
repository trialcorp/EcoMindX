import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalyticsTab } from "./AnalyticsTab";
import { axe } from "vitest-axe";
import { emptyInput } from "../lib/types";

describe("AnalyticsTab", () => {
  const mockResult = {
    breakdown_kg: { transport: 1000, home: 1000, diet: 1000, consumption: 1000 },
    total_annual_kg: 4000,
    total_annual_tonnes: 4.0,
    comparison: {
      global_average_annual_kg: 5000,
      sustainable_target_annual_kg: 2000,
      ratio_to_global_average: 0.8,
      ratio_to_sustainable_target: 2.0,
    },
  };

  const mockOnSave = vi.fn();

  it("renders empty state when no result", () => {
    render(<AnalyticsTab result={null} lastInput={null} saving={false} onSave={mockOnSave} />);
    expect(screen.getByText(/No Assessment Data/)).toBeInTheDocument();
  });

  it("renders breakdown when result is provided", () => {
    render(<AnalyticsTab result={mockResult} lastInput={emptyInput()} saving={false} onSave={mockOnSave} />);
    expect(screen.getByText(/Your estimated footprint/)).toBeInTheDocument();
  });

  it("calls onSave when save button is clicked", () => {
    render(<AnalyticsTab result={mockResult} lastInput={emptyInput()} saving={false} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText("Save this entry to my history"));
    expect(mockOnSave).toHaveBeenCalled();
  });

  it("passes accessibility checks", async () => {
    const { container } = render(
      <AnalyticsTab result={mockResult} lastInput={emptyInput()} saving={false} onSave={mockOnSave} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
