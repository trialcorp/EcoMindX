import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";
import { axe } from "vitest-axe";

describe("ConfirmDialog", () => {
  it("renders when open is true", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Test Title"
        message="Test Message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Message")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Test Title"
        message="Test Message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("calls onConfirm and onCancel correctly", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Test Title"
        message="Test Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("closes on escape key", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Test"
        message="Test"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("passes accessibility checks", async () => {
    const { container } = render(
      <ConfirmDialog
        open={true}
        title="Test Title"
        message="Test Message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
