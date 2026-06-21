import { useState } from "react";
import { type CarbonInput, type CarFuel, type DietType, emptyInput } from "../lib/types";
import { NumberField } from "./NumberField";

interface Props {
  onSubmit: (input: CarbonInput) => void;
  loading: boolean;
}

const MAX_KM_WEEK = 20_000;
const MAX_KWH_MONTH = 100_000;
const MAX_FLIGHTS = 200;
const MAX_USD_MONTH = 1_000_000;
const MAX_WASTE_WEEK = 1_000;
const MAX_HOUSEHOLD = 50;

const DIET_OPTIONS: { value: DietType; label: string }[] = [
  { value: "heavy_meat", label: "Heavy meat eater" },
  { value: "medium_meat", label: "Average meat eater" },
  { value: "low_meat", label: "Low meat" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

const FUEL_OPTIONS: { value: CarFuel; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
];

/** Redesigned 3-step wizard form for carbon footprint assessment. */
export function CalculatorForm({ onSubmit, loading }: Props) {
  const [input, setInput] = useState<CarbonInput>(emptyInput);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const patchTransport = (patch: Partial<CarbonInput["transport"]>) =>
    setInput((p) => ({ ...p, transport: { ...p.transport, ...patch } }));
  const patchHome = (patch: Partial<CarbonInput["home"]>) =>
    setInput((p) => ({ ...p, home: { ...p.home, ...patch } }));
  const patchConsumption = (patch: Partial<CarbonInput["consumption"]>) =>
    setInput((p) => ({ ...p, consumption: { ...p.consumption, ...patch } }));

  const sanitizeInput = (raw: CarbonInput): CarbonInput => ({
    transport: {
      car_km_per_week: Math.max(0, Math.min(raw.transport.car_km_per_week || 0, MAX_KM_WEEK)),
      car_fuel: raw.transport.car_fuel,
      public_transit_km_per_week: Math.max(
        0,
        Math.min(raw.transport.public_transit_km_per_week || 0, MAX_KM_WEEK),
      ),
      short_haul_flights_per_year: Math.max(
        0,
        Math.min(raw.transport.short_haul_flights_per_year || 0, MAX_FLIGHTS),
      ),
      long_haul_flights_per_year: Math.max(
        0,
        Math.min(raw.transport.long_haul_flights_per_year || 0, MAX_FLIGHTS),
      ),
    },
    home: {
      electricity_kwh_per_month: Math.max(
        0,
        Math.min(raw.home.electricity_kwh_per_month || 0, MAX_KWH_MONTH),
      ),
      natural_gas_kwh_per_month: Math.max(
        0,
        Math.min(raw.home.natural_gas_kwh_per_month || 0, MAX_KWH_MONTH),
      ),
      household_size: Math.max(1, Math.min(raw.home.household_size || 1, MAX_HOUSEHOLD)),
    },
    diet: raw.diet,
    consumption: {
      goods_spend_usd_per_month: Math.max(
        0,
        Math.min(raw.consumption.goods_spend_usd_per_month || 0, MAX_USD_MONTH),
      ),
      waste_kg_per_week: Math.max(
        0,
        Math.min(raw.consumption.waste_kg_per_week || 0, MAX_WASTE_WEEK),
      ),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(sanitizeInput(input));
  };

  return (
    <form className="card" onSubmit={handleSubmit} aria-labelledby="calc-heading">
      <h2 id="calc-heading">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--primary)" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        Estimate your annual footprint
      </h2>

      {/* Step Indicators */}
      <div className="form-steps-nav" role="tablist" aria-label="Calculator steps">
        <button
          type="button"
          id="step1-tab"
          className={`step-tab ${step === 1 ? "active" : ""}`}
          onClick={() => setStep(1)}
          role="tab"
          aria-selected={step === 1}
          aria-current={step === 1 ? "step" : undefined}
          aria-controls="step-transport"
        >
          1. Mobility {step === 1 ? "(Current)" : ""}
        </button>
        <button
          type="button"
          id="step2-tab"
          className={`step-tab ${step === 2 ? "active" : ""}`}
          onClick={() => setStep(2)}
          role="tab"
          aria-selected={step === 2}
          aria-current={step === 2 ? "step" : undefined}
          aria-controls="step-home"
        >
          2. Home Utilities {step === 2 ? "(Current)" : ""}
        </button>
        <button
          type="button"
          id="step3-tab"
          className={`step-tab ${step === 3 ? "active" : ""}`}
          onClick={() => setStep(3)}
          role="tab"
          aria-selected={step === 3}
          aria-current={step === 3 ? "step" : undefined}
          aria-controls="step-lifestyle"
        >
          3. Lifestyle & Diet {step === 3 ? "(Current)" : ""}
        </button>
      </div>

      {/* Step 1: Transport & Mobility */}
      <div className={`step-panel-wrapper ${step === 1 ? "active" : ""}`}>
        <div id="step-transport" className="step-panel" role="tabpanel" aria-labelledby="step1-tab">
          <fieldset>
            <legend>Transport & Mobility</legend>
            <NumberField
              id="car_km"
              label="Car distance per week (km)"
              max={MAX_KM_WEEK}
              value={input.transport.car_km_per_week}
              onChange={(v) => patchTransport({ car_km_per_week: v })}
            />
            <div className="field">
              <label htmlFor="car_fuel">Car fuel type</label>
              <select
                id="car_fuel"
                value={input.transport.car_fuel}
                onChange={(e) => patchTransport({ car_fuel: e.target.value as CarFuel })}
              >
                {FUEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <NumberField
              id="transit_km"
              label="Public transit per week (km)"
              max={MAX_KM_WEEK}
              value={input.transport.public_transit_km_per_week}
              onChange={(v) => patchTransport({ public_transit_km_per_week: v })}
            />
            <NumberField
              id="short_flights"
              label="Short-haul flights per year"
              max={MAX_FLIGHTS}
              step={1}
              value={input.transport.short_haul_flights_per_year}
              onChange={(v) => patchTransport({ short_haul_flights_per_year: v })}
            />
            <NumberField
              id="long_flights"
              label="Long-haul flights per year"
              max={MAX_FLIGHTS}
              step={1}
              value={input.transport.long_haul_flights_per_year}
              onChange={(v) => patchTransport({ long_haul_flights_per_year: v })}
            />
          </fieldset>
        </div>
      </div>

      {/* Step 2: Home Energy */}
      <div className={`step-panel-wrapper ${step === 2 ? "active" : ""}`}>
        <div id="step-home" className="step-panel" role="tabpanel" aria-labelledby="step2-tab">
          <fieldset>
            <legend>Home Energy</legend>
            <NumberField
              id="electricity"
              label="Electricity per month (kWh)"
              max={MAX_KWH_MONTH}
              value={input.home.electricity_kwh_per_month}
              onChange={(v) => patchHome({ electricity_kwh_per_month: v })}
            />
            <NumberField
              id="gas"
              label="Natural gas per month (kWh)"
              max={MAX_KWH_MONTH}
              value={input.home.natural_gas_kwh_per_month}
              onChange={(v) => patchHome({ natural_gas_kwh_per_month: v })}
            />
            <NumberField
              id="household"
              label="People in household"
              min={1}
              max={MAX_HOUSEHOLD}
              step={1}
              hint="Home energy is shared across this many people."
              value={input.home.household_size}
              onChange={(v) => patchHome({ household_size: v })}
            />
          </fieldset>
        </div>
      </div>

      {/* Step 3: Diet & Consumption */}
      <div className={`step-panel-wrapper ${step === 3 ? "active" : ""}`}>
        <div id="step-lifestyle" className="step-panel" role="tabpanel" aria-labelledby="step3-tab">
          <fieldset>
            <legend>Diet &amp; consumption</legend>
            <div className="field">
              <label htmlFor="diet">Diet</label>
              <select
                id="diet"
                value={input.diet}
                onChange={(e) => setInput((p) => ({ ...p, diet: e.target.value as DietType }))}
              >
                {DIET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <NumberField
              id="goods"
              label="Goods spending per month (USD)"
              max={MAX_USD_MONTH}
              value={input.consumption.goods_spend_usd_per_month}
              onChange={(v) => patchConsumption({ goods_spend_usd_per_month: v })}
            />
            <NumberField
              id="waste"
              label="Landfill waste per week (kg)"
              max={MAX_WASTE_WEEK}
              value={input.consumption.waste_kg_per_week}
              onChange={(v) => patchConsumption({ waste_kg_per_week: v })}
            />
          </fieldset>
        </div>
      </div>

      {/* Wizard Footer Controls */}
      <div className="wizard-footer">
        {step > 1 ? (
          <button
            type="button"
            className="btn secondary"
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
          >
            Back
          </button>
        ) : (
          <div /> // Spacer
        )}

        {step < 3 && (
          <button
            type="button"
            className="btn"
            onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
          >
            Continue
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        )}

        <button
          className={`btn ${step === 3 ? "" : "visually-hidden"}`}
          type="submit"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Calculating…" : "Calculate my footprint"}
        </button>
      </div>
    </form>
  );
}
