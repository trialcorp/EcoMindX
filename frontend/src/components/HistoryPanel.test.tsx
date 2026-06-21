import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HistoryPanel } from "./HistoryPanel";
import { axe } from "vitest-axe";
import { emptyInput } from "../lib/types";

describe("HistoryPanel", () => {
  const mockEntries = [
    {
      id: "1",
      created_at: "2026-06-21T12:00:00Z",
      device_id: "dev-1",
      input: emptyInput(),
      result: {
        breakdown_kg: { transport: 1000, home: 1000, diet: 1000, consumption: 1000 },
        total_annual_kg: 4000,
        total_annual_tonnes: 4.0,
        comparison: {
          global_average_annual_kg: 5000,
          sustainable_target_annual_kg: 2000,
          ratio_to_global_average: 0.8,
          ratio_to_sustainable_target: 2.0,
        },
      },
    },
    {
      id: "2",
      created_at: "2026-06-20T12:00:00Z",
      device_id: "dev-1",
      input: emptyInput(),
      result: {
        breakdown_kg: { transport: 1500, home: 1500, diet: 1000, consumption: 1000 },
        total_annual_kg: 5000,
        total_annual_tonnes: 5.0,
        comparison: {
          global_average_annual_kg: 5000,
          sustainable_target_annual_kg: 2000,
          ratio_to_global_average: 1.0,
          ratio_to_sustainable_target: 2.5,
        },
      },
    }
  ];

  it("renders empty state", () => {
    render(<HistoryPanel entries={[]} />);
    expect(screen.getByText(/No saved entries yet/)).toBeInTheDocument();
  });

  it("renders entries and trend indicator", () => {
    render(<HistoryPanel entries={mockEntries} />);
    // Latest is 4.0, previous is 5.0, so trend is -1.0 (Down)
    expect(screen.getByText(/▼ Down/)).toBeInTheDocument();
    expect(screen.getByText("4 t")).toBeInTheDocument();
    expect(screen.getByText("5 t")).toBeInTheDocument();
    
    // Check if the trend chart title rendered
    expect(screen.getByText("Emissions Trend")).toBeInTheDocument();
  });

  it("passes accessibility checks", async () => {
    const { container } = render(<HistoryPanel entries={mockEntries} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
