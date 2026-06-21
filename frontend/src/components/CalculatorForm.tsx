import { useState } from "react";
import type { CarbonInput } from "../lib/types";
import { emptyInput } from "../lib/types";
import {
  MAX_KM_PER_WEEK,
  MAX_KWH_PER_MONTH,
  MAX_FLIGHTS_PER_YEAR,
  MAX_USD_PER_MONTH,
  MAX_WASTE_KG_PER_WEEK,
  MAX_HOUSEHOLD_SIZE,
} from "../lib/constants";
import { StepTransport, StepHome, StepLifestyle } from "./CalculatorSteps";

/** Props for the {@link CalculatorForm} component. */
interface Props {
  /** Callback invoked with sanitised input data when the user submits. */
  onSubmit: (input: CarbonInput) => void;
  /** Whether a calculation is currently in progress. */
  loading: boolean;
}

/**
 * Three-step wizard form for the annual carbon footprint assessment.
 *
 * Separates transport, home energy, and lifestyle/diet into distinct steps
 * to reduce cognitive overload (Fogg Behavior Model — Simplify).
 */
export function CalculatorForm({ onSubmit, loading }: Props) {
  const [input, setInput] = useState<CarbonInput>(emptyInput);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const patchTransport = (patch: Partial<CarbonInput["transport"]>) =>
    setInput((p) => ({ ...p, transport: { ...p.transport, ...patch } }));
  const patchHome = (patch: Partial<CarbonInput["home"]>) =>
    setInput((p) => ({ ...p, home: { ...p.home, ...patch } }));
  const patchConsumption = (patch: Partial<CarbonInput["consumption"]>) =>
    setInput((p) => ({ ...p, consumption: { ...p.consumption, ...patch } }));

  /** Clamp all numeric inputs to their valid ranges and coerce NaN to 0. */
  const sanitizeInput = (raw: CarbonInput): CarbonInput => ({
    transport: {
      car_km_per_week: Math.max(0, Math.min(raw.transport.car_km_per_week || 0, MAX_KM_PER_WEEK)),
      car_fuel: raw.transport.car_fuel,
      public_transit_km_per_week: Math.max(
        0,
        Math.min(raw.transport.public_transit_km_per_week || 0, MAX_KM_PER_WEEK),
      ),
      short_haul_flights_per_year: Math.max(
        0,
        Math.min(raw.transport.short_haul_flights_per_year || 0, MAX_FLIGHTS_PER_YEAR),
      ),
      long_haul_flights_per_year: Math.max(
        0,
        Math.min(raw.transport.long_haul_flights_per_year || 0, MAX_FLIGHTS_PER_YEAR),
      ),
    },
    home: {
      electricity_kwh_per_month: Math.max(
        0,
        Math.min(raw.home.electricity_kwh_per_month || 0, MAX_KWH_PER_MONTH),
      ),
      natural_gas_kwh_per_month: Math.max(
        0,
        Math.min(raw.home.natural_gas_kwh_per_month || 0, MAX_KWH_PER_MONTH),
      ),
      household_size: Math.max(1, Math.min(raw.home.household_size || 1, MAX_HOUSEHOLD_SIZE)),
    },
    diet: raw.diet,
    consumption: {
      goods_spend_usd_per_month: Math.max(
        0,
        Math.min(raw.consumption.goods_spend_usd_per_month || 0, MAX_USD_PER_MONTH),
      ),
      waste_kg_per_week: Math.max(
        0,
        Math.min(raw.consumption.waste_kg_per_week || 0, MAX_WASTE_KG_PER_WEEK),
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
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="icon-primary"
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
          <StepTransport input={input} patchTransport={patchTransport} />
        </div>
      </div>

      {/* Step 2: Home Energy */}
      <div className={`step-panel-wrapper ${step === 2 ? "active" : ""}`}>
        <div id="step-home" className="step-panel" role="tabpanel" aria-labelledby="step2-tab">
          <StepHome input={input} patchHome={patchHome} />
        </div>
      </div>

      {/* Step 3: Diet & Consumption */}
      <div className={`step-panel-wrapper ${step === 3 ? "active" : ""}`}>
        <div id="step-lifestyle" className="step-panel" role="tabpanel" aria-labelledby="step3-tab">
          <StepLifestyle input={input} setInput={setInput} patchConsumption={patchConsumption} />
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
              aria-hidden="true"
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
