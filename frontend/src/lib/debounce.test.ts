import { describe, it, expect, vi, beforeEach } from "vitest";
import { debounce, throttle } from "./debounce";

describe("debounce and throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("debounces a function call", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancels a debounced call", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn.cancel();

    vi.advanceTimersByTime(150);
    expect(fn).not.toHaveBeenCalled();
  });

  it("throttles a function call", () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(150);
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
