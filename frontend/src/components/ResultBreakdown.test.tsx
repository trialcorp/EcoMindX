import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "vitest-axe";
import { ResultBreakdown } from "./ResultBreakdown";
import type { FootprintResult } from "../lib/types";

const result: FootprintResult = {
  breakdown_kg: { transport: 2000, home: 1000, diet: 1500, consumption: 500 },
  total_annual_kg: 5000,
  total_annual_tonnes: 5.0,
  comparison: {
    global_average_annual_kg: 4800,
    sustainable_target_annual_kg: 2000,
    ratio_to_global_average: 1.042,
    ratio_to_sustainable_target: 2.5,
  },
};

describe("ResultBreakdown", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<ResultBreakdown result={result} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the total and a row per category", () => {
    render(<ResultBreakdown result={result} />);
    expect(screen.getByText(/5 t CO₂e/i)).toBeInTheDocument();
    // Category labels appear (in the bar chart and the data table).
    expect(screen.getAllByText("Transport").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Home energy").length).toBeGreaterThan(0);
  });

  it("provides an accessible data table equivalent of the chart", () => {
    render(<ResultBreakdown result={result} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Diet" })).toBeInTheDocument();
  });

  it("shows category analysis when clicking on different categories", async () => {
    render(<ResultBreakdown result={result} input={{
      transport: { car_km_per_week: 100, car_fuel: "petrol", public_transit_km_per_week: 50, short_haul_flights_per_year: 2, long_haul_flights_per_year: 1 },
      home: { electricity_kwh_per_month: 200, natural_gas_kwh_per_month: 100, household_size: 2 },
      diet: "heavy_meat",
      consumption: { goods_spend_usd_per_month: 150, waste_kg_per_week: 10 }
    }} />);

    // Click on Diet
    const dietRow = screen.getByRole("button", { name: /diet/i });
    await userEvent.click(dietRow);
    expect(screen.getByText(/Dietary Preference/i)).toBeInTheDocument();
    expect(screen.getByText(/heavy meat/i)).toBeInTheDocument();

    // Click on Consumption
    const consumptionRow = screen.getByRole("button", { name: /goods/i });
    await userEvent.click(consumptionRow);
    expect(screen.getByText(/Goods & Shopping Spend/i)).toBeInTheDocument();
    expect(screen.getByText(/\$150/i)).toBeInTheDocument();

    // Click on Transport
    const transportRow = screen.getByRole("button", { name: /transport/i });
    await userEvent.click(transportRow);
    expect(screen.getByText(/Private Car Travel/i)).toBeInTheDocument();

    // Click on Home
    const homeRow = screen.getByRole("button", { name: /home/i });
    await userEvent.click(homeRow);
    expect(screen.getByText(/Electricity Usage/i)).toBeInTheDocument();

    // Trigger keydown on Transport
    fireEvent.keyDown(transportRow, { key: "Enter" });
    expect(screen.getByText(/Private Car Travel/i)).toBeInTheDocument();
  });

  it("renders different diet details correctly", () => {
    const diets: Array<"heavy_meat" | "medium_meat" | "low_meat" | "pescatarian" | "vegetarian" | "vegan"> = [
      "heavy_meat", "medium_meat", "low_meat", "pescatarian", "vegetarian", "vegan"
    ];
    for (const diet of diets) {
      const { unmount } = render(<ResultBreakdown result={result} input={{
        transport: { car_km_per_week: 0, car_fuel: "petrol", public_transit_km_per_week: 0, short_haul_flights_per_year: 0, long_haul_flights_per_year: 0 },
        home: { electricity_kwh_per_month: 0, natural_gas_kwh_per_month: 0, household_size: 1 },
        diet,
        consumption: { goods_spend_usd_per_month: 0, waste_kg_per_week: 0 }
      }} />);
      // Click on Diet row to select it
      const dietRow = screen.getByRole("button", { name: /diet/i });
      fireEvent.click(dietRow);

      // Verify the details card contains some specific diet text
      if (diet === "vegan") expect(screen.getByText(/Purely plant-based/i)).toBeInTheDocument();
      if (diet === "vegetarian") expect(screen.getByText(/No meat or fish/i)).toBeInTheDocument();
      if (diet === "pescatarian") expect(screen.getByText(/Fish and plants only/i)).toBeInTheDocument();
      if (diet === "low_meat") expect(screen.getByText(/Reduced meat intake/i)).toBeInTheDocument();
      if (diet === "medium_meat") expect(screen.getByText(/Typical mixed diet/i)).toBeInTheDocument();
      if (diet === "heavy_meat") expect(screen.getByText(/High impact due to/i)).toBeInTheDocument();

      unmount();
    }
  });

  it("renders status when below sustainable target", () => {
    const underResult: FootprintResult = {
      breakdown_kg: { transport: 500, home: 400, diet: 300, consumption: 200 },
      total_annual_kg: 1400,
      total_annual_tonnes: 1.4,
      comparison: {
        global_average_annual_kg: 4800,
        sustainable_target_annual_kg: 2000,
        ratio_to_global_average: 0.29,
        ratio_to_sustainable_target: 0.7,
      },
    };

    render(<ResultBreakdown result={underResult} />);
    expect(screen.getAllByLabelText("Below target").length).toBeGreaterThan(0);
  });

  it("triggers animation timer and clears it on unmount in non-test env", () => {
    const g = globalThis as unknown as { process?: { env?: Record<string, string> } };
    const originalEnv = g.process?.env?.NODE_ENV;
    if (g.process?.env) {
      g.process.env.NODE_ENV = "production";
    }
    
    vi.useFakeTimers();
    const { unmount } = render(<ResultBreakdown result={result} />);
    
    act(() => {
      vi.advanceTimersByTime(50);
    });

    unmount();
    
    if (g.process?.env && originalEnv) {
      g.process.env.NODE_ENV = originalEnv;
    }
    vi.useRealTimers();
  });
});



