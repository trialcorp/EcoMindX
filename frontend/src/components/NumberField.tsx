import { useState, useEffect } from "react";

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Upper bound, mirroring the backend schema so the browser rejects out-of-range values. */
  max: number;
  min?: number;
  step?: number | "any";
  /** Optional helper text, associated with the input via aria-describedby. */
  hint?: string;
}

/**
 * A labelled numeric input with consistent accessibility wiring: explicit
 * label association, optional hint exposed through `aria-describedby`, and
 * browser-level `min`/`max` bounds.
 * Handles typing inputs smoothly by keeping a local string representation,
 * preventing '0' from getting stuck when deleting or typing decimals.
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
  const [inputValue, setInputValue] = useState<string>(value.toString());

  // Keep local input in sync with external changes (e.g. from range slider or parent resets)
  useEffect(() => {
    if (Number(inputValue) !== value) {
      setInputValue(value.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInputChange = (valStr: string) => {
    setInputValue(valStr);

    if (valStr === "") {
      onChange(0);
    } else {
      const next = Number(valStr);
      if (!Number.isNaN(next)) {
        onChange(next);
      }
    }
  };

  const handleBlur = () => {
    // Revert/format local state to the official number value on blur (e.g. converts empty back to "0")
    setInputValue(value.toString());
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
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleBlur}
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
