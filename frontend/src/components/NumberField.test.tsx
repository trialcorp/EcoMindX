import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { NumberField } from "./NumberField";

describe("NumberField", () => {
  it("has no accessibility violations (with and without a hint)", async () => {
    const { container } = render(
      <>
        <NumberField id="plain" label="Plain" max={10} value={0} onChange={() => {}} />
        <NumberField
          id="hinted"
          label="Hinted"
          max={10}
          hint="Some help text."
          value={0}
          onChange={() => {}}
        />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("emits numeric values through onChange", async () => {
    const onChange = vi.fn();
    render(<NumberField id="n" label="Amount" max={100} value={0} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Amount"), "7");
    expect(onChange).toHaveBeenLastCalledWith(7);
  });

  it("associates the hint via aria-describedby only when present", () => {
    render(
      <>
        <NumberField id="a" label="With hint" max={10} hint="Hint." value={0} onChange={() => {}} />
        <NumberField id="b" label="No hint" max={10} value={0} onChange={() => {}} />
      </>,
    );
    expect(screen.getByLabelText("With hint")).toHaveAccessibleDescription("Hint.");
    expect(screen.getByLabelText("No hint")).not.toHaveAttribute("aria-describedby");
  });

  it("renders browser-level bounds and integer steps when requested", () => {
    render(
      <NumberField id="i" label="Count" min={1} max={50} step={1} value={1} onChange={() => {}} />,
    );
    const input = screen.getByLabelText("Count");
    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("max", "50");
    expect(input).toHaveAttribute("step", "1");
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("handles empty input and triggers onChange(0)", async () => {
    const onChange = vi.fn();
    render(<NumberField id="n" label="Amount" max={100} value={5} onChange={onChange} />);
    const input = screen.getByLabelText("Amount");
    await userEvent.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("handles range slider change and updates value", () => {
    const onChange = vi.fn();
    const { container } = render(
      <NumberField id="n" label="Amount" max={100} value={10} onChange={onChange} />,
    );
    const rangeInput = container.querySelector('input[type="range"]');
    expect(rangeInput).toBeInTheDocument();

    fireEvent.change(rangeInput!, { target: { value: "50" } });
    expect(onChange).toHaveBeenCalledWith(50);
  });

  it("syncs value with external prop updates", () => {
    const { rerender } = render(
      <NumberField id="n" label="Amount" max={100} value={10} onChange={() => {}} />,
    );
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    expect(input.value).toBe("10");

    rerender(<NumberField id="n" label="Amount" max={100} value={20} onChange={() => {}} />);
    expect(input.value).toBe("20");
  });

  it("handles NaN strings gracefully on blur", () => {
    const onChange = vi.fn();
    render(<NumberField id="test" label="Test" max={100} value={5} onChange={onChange} />);
    const input = screen.getByLabelText("Test");
    
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("handles household id special case for zero value", () => {
    const onChange = vi.fn();
    render(<NumberField id="household_size" label="Household" max={100} value={0} onChange={onChange} />);
    const input = screen.getByLabelText("Household") as HTMLInputElement;
    expect(input.value).toBe("0"); // does not turn into ""
  });

  it("handles range slider NaN gracefully", () => {
    const onChange = vi.fn();
    const { container } = render(<NumberField id="test2" label="Test2" max={100} value={5} onChange={onChange} />);
    const rangeInput = container.querySelector('input[type="range"]');
    
    // Bypass JSDOM's strict HTML5 range sanitization to hit the fallback
    Object.defineProperty(rangeInput, 'value', { get: () => "NaN" });
    fireEvent.change(rangeInput!);
    
    expect(onChange).toHaveBeenCalledWith(0);
  });
});
