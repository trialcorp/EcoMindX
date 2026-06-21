import { describe, it, expect } from "vitest";
import { round, clamp } from "../lib/math";

describe("round()", () => {
  it("rounds to 2 decimal places", () => {
    expect(round(3.14159, 2)).toBe(3.14);
  });

  it("rounds up at the midpoint", () => {
    expect(round(2.555, 2)).toBe(2.56);
  });

  it("handles zero decimals", () => {
    expect(round(3.7, 0)).toBe(4);
  });

  it("handles negative values", () => {
    expect(round(-1.555, 2)).toBe(-1.55);
  });

  it("returns 0 for round(0, 2)", () => {
    expect(round(0, 2)).toBe(0);
  });

  it("handles large numbers", () => {
    expect(round(123456.789, 1)).toBe(123456.8);
  });
});

describe("clamp()", () => {
  it("clamps above max", () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it("clamps below min", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it("returns value when within range", () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 100)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(100, 0, 100)).toBe(100);
  });

  it("handles negative ranges", () => {
    expect(clamp(-50, -100, -10)).toBe(-50);
    expect(clamp(0, -100, -10)).toBe(-10);
  });
});
