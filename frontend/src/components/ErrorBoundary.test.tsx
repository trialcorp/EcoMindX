import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "vitest-axe";
import { ErrorBoundary } from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  it("renders children when there is no error", async () => {
    const { container } = render(
      <ErrorBoundary>
        <div data-testid="child">Hello World</div>
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the fallback UI when a child throws an error and reload button works", async () => {
    // Suppress console.error in this test to avoid polluting the test output
    const originalError = console.error;
    console.error = () => {};

    const reloadMock = vi.fn();
    vi.stubGlobal("location", { reload: reloadMock });

    const ThrowingChild = () => {
      throw new Error("Test crash");
    };

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test crash")).toBeInTheDocument();
    
    const reloadBtn = screen.getByRole("button", { name: "Reload Page" });
    expect(reloadBtn).toBeInTheDocument();
    await userEvent.click(reloadBtn);
    expect(reloadMock).toHaveBeenCalledTimes(1);

    // Restore console.error and location stub
    console.error = originalError;
    vi.unstubAllGlobals();
  });
});

