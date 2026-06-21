import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AccountPanel } from "./AccountPanel";
import { axe } from "vitest-axe";
import type { User } from "@supabase/supabase-js";
import type { Entry } from "../lib/types";

describe("AccountPanel", () => {
  const mockOnSignIn = vi.fn();
  const mockOnSignUp = vi.fn();
  const mockOnSignOut = vi.fn();
  const mockOnClaimHistory = vi.fn();

  it("renders sign-in form by default", () => {
    render(
      <AccountPanel
        user={null}
        authLoading={false}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Access Personal Intelligence" }),
    ).toBeInTheDocument();
  });

  it("toggles to sign-up form", () => {
    render(
      <AccountPanel
        user={null}
        authLoading={false}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );
    fireEvent.click(screen.getByText("Register"));
    // We expect the form or header to change, since it toggles mode
    // (You can also check for "Create Account" if that heading appears)
    expect(screen.getByRole("heading", { name: "Create EcoMindX Account" })).toBeInTheDocument();
  });

  it("enforces 8 character password limit", () => {
    render(
      <AccountPanel
        user={null}
        authLoading={false}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "1234567" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(mockOnSignIn).not.toHaveBeenCalled();
  });

  it("renders user profile when logged in", () => {
    render(
      <AccountPanel
        user={{ id: "1", email: "user@test.com" } as unknown as User}
        authLoading={false}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={5.5}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );
    expect(screen.getByText("Your Profile")).toBeInTheDocument();
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
    expect(screen.getByText("5.5 t")).toBeInTheDocument();
  });

  it("shows claim history banner if unlinked entries exist", () => {
    render(
      <AccountPanel
        user={{ id: "1", email: "user@test.com" } as unknown as User}
        authLoading={false}
        authError={null}
        entries={[{ id: "entry-1", user_id: undefined } as unknown as Entry]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );
    expect(screen.getByText("Sync Local History")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Sync History"));
    expect(mockOnClaimHistory).toHaveBeenCalled();
  });

  it("submits sign in form successfully", async () => {
    render(
      <AccountPanel
        user={null}
        authLoading={false}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(mockOnSignIn).toHaveBeenCalledWith("test@test.com", "password123");
    await waitFor(() => {
      expect(screen.getByLabelText("Email Address")).toHaveValue("");
    });
  });

  it("submits sign up form successfully", async () => {
    render(
      <AccountPanel
        user={null}
        authLoading={false}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );

    fireEvent.click(screen.getByText("Register"));
    fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "new@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(mockOnSignUp).toHaveBeenCalledWith("new@test.com", "password123");
    await waitFor(() => {
      expect(screen.getByLabelText("Email Address")).toHaveValue("");
    });
  });

  it("shows spinner when authLoading is true", () => {
    render(
      <AccountPanel
        user={null}
        authLoading={true}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );

    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });

  it("shows authError when provided", () => {
    render(
      <AccountPanel
        user={null}
        authLoading={false}
        authError="Invalid credentials"
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("handles form submission exceptions gracefully", async () => {
    mockOnSignIn.mockRejectedValueOnce(new Error("auth fail"));
    render(
      <AccountPanel
        user={null}
        authLoading={false}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("auth fail")).toBeInTheDocument();
    });
  });

  it("passes accessibility checks", async () => {
    const { container } = render(
      <AccountPanel
        user={null}
        authLoading={false}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("shows error when email or password is empty", () => {
    render(
      <AccountPanel
        user={null}
        authLoading={false}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={mockOnSignIn}
        onSignUp={mockOnSignUp}
        onSignOut={mockOnSignOut}
        onClaimHistory={mockOnClaimHistory}
      />,
    );
    fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);
    expect(screen.getByText("Please provide both email and password.")).toBeInTheDocument();
  });
});
