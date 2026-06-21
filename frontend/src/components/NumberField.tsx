import { useState, useEffect, useRef } from "react";

/** Props for the {@link NumberField} component. */
interface NumberFieldProps {
  /** Unique HTML `id` used for label association and `aria-describedby`. */
  id: string;
  /** Visible label text displayed above the input. */
  label: string;
  /** The current numeric value (controlled). */
  value: number;
  /** Callback fired when the user changes the value. */
  onChange: (value: number) => void;
  /** Upper bound — the browser rejects values above this threshold. */
  max: number;
  /** Lower bound (defaults to 0). */
  min?: number;
  /** Increment step for the number input (defaults to `"any"`). */
  step?: number | "any";
  /** Optional helper text, associated with the input via `aria-describedby`. */
  hint?: string;
}

/**
 * A labelled numeric input with consistent accessibility wiring.
 *
 * Features:
 * - Explicit `<label>` association via `htmlFor`.
 * - Optional hint text linked through `aria-describedby` for screen readers.
 * - Browser-level `min`/`max` bounds with a companion range slider.
 * - Smooth typing via a local string state (prevents "0" from sticking
 *   when the user deletes or types decimal values).
 */
export function NumberField({
  id,
  label,
  value,
  onChange,
  max,
  min = 0,
  step = "any",
  hint,
}: NumberFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const sliderStep = step === "any" ? 1 : step;

  // Track the raw text typed by the user to allow empty input and decimals
  const [inputValue, setInputValue] = useState<string>(
    value === 0 && !id.includes("household") ? "" : value.toString(),
  );

  // Use a ref to avoid listing inputValue in the effect dependency array,
  // which would cause an infinite update loop when the external value changes.
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;

  // Keep local input in sync with external changes (e.g. from range slider or parent resets)
  useEffect(() => {
    if (Number(inputValueRef.current) !== value) {
      setInputValue(value === 0 && !id.includes("household") ? "" : value.toString());
    }
  }, [value, id]);

  /** Normalise the raw text on blur: clamp to valid range and reset empty to 0. */
  const handleBlur = () => {
    const parsed = parseFloat(inputValue);
    const finalVal = Number.isNaN(parsed) ? 0 : Math.max(min, Math.min(parsed, max));
    setInputValue(finalVal === 0 && !id.includes("household") ? "" : finalVal.toString());
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="slider-container">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          inputMode={step === "any" ? "decimal" : "numeric"}
          aria-describedby={hintId}
          value={inputValue}
          onChange={(e) => {
            const raw = e.target.value;
            setInputValue(raw);
            if (raw === "") {
              onChange(0);
              return;
            }
            const parsed = parseFloat(raw);
            if (!Number.isNaN(parsed)) onChange(parsed);
          }}
          onBlur={(e) => {
            let parsed = parseFloat(e.target.value);
            if (Number.isNaN(parsed)) parsed = 0;
            parsed = Math.max(min, Math.min(parsed, max));
            onChange(parsed);
            handleBlur();
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={sliderStep}
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value);
            const val = Number.isNaN(next) ? 0 : next;
            onChange(val);
            setInputValue(val.toString());
          }}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      {hint && (
        <span className="hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  );
}
