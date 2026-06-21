// Vitest setup: register jest-dom and vitest-axe (accessibility) matchers.
import "@testing-library/jest-dom/vitest";
import * as axeMatchers from "vitest-axe/matchers";
import { expect } from "vitest";

expect.extend(axeMatchers);

// Mock canvas getContext to avoid "Not implemented: HTMLCanvasElement.prototype.getContext" error in jsdom
if (typeof window !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
