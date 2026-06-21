import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountPanel } from "./AccountPanel";

describe("AccountPanel", () => {
  it("shows an error if passwords are too short", async () => {
    const onSignUp = vi.fn();
    render(
      <AccountPanel
        user={null}
        authLoading={false}
        authError={null}
        entries={[]}
        saving={false}
        userEmissions={null}
        onSignIn={vi.fn()}
        onSignUp={onSignUp}
        onSignOut={vi.fn()}
        onClaimHistory={vi.fn()}
      />
    );

    // Switch to register mode
    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    const emailInput = screen.getByLabelText(/email address/i);
    const passInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passInput, "123"); // Too short
    
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    expect(onSignUp).not.toHaveBeenCalled();
  });
});
