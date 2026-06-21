import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import App from "./App";
import type { FootprintResult, InsightsResponse, CarbonInput } from "./lib/types";
import type { User } from "@supabase/supabase-js";

// Mock the API layer so the integration test runs without a backend.
vi.mock("./lib/api", () => ({
  calculate: vi.fn(),
  getInsights: vi.fn(),
  saveEntry: vi.fn(),
  listEntries: vi.fn(() =>
    Promise.resolve([
      {
        id: "e0",
        created_at: "2026-01-01T00:00:00Z",
        device_id: "dev-123",
        input: {} as unknown as CarbonInput,
        result: {
          total_annual_tonnes: 5.0,
          breakdown_kg: { transport: 2000, home: 1000, diet: 1500, consumption: 500 },
        },
      },
    ]),
  ),
  listLeaderboard: vi.fn(() =>
    Promise.resolve([{ user_id: "other-user", display_name: "Eco Champion", score: 3.4 }]),
  ),
  getCollectiveSavedCO2e: vi.fn(() => Promise.resolve(48250)),
  listTips: vi.fn(() => Promise.resolve([])),
  saveTip: vi.fn(),
  deleteTip: vi.fn(),
}));

const mockUseAuth = vi.fn(() => ({
  user: null as User | null,
  authLoading: false,
  authError: null as string | null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("./hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

import * as api from "./lib/api";

const result: FootprintResult = {
  breakdown_kg: { transport: 2000, home: 1000, diet: 1500, consumption: 500 },
  total_annual_kg: 5000,
  total_annual_tonnes: 5.0,
  comparison: {
    global_average_annual_kg: 4800,
    sustainable_target_annual_kg: 2000,
    ratio_to_global_average: 1.04,
    ratio_to_sustainable_target: 2.5,
  },
};

const insights: InsightsResponse = {
  summary: "Your footprint is above the sustainable target.",
  recommendations: [
    { category: "transport", action: "Drive less", estimated_annual_savings_kg: 400 },
  ],
  source: "rules",
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    user: null as User | null,
    authLoading: false,
    authError: null as string | null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  });
  vi.mocked(api.listEntries).mockResolvedValue([
    {
      id: "e0",
      created_at: "2026-01-01T00:00:00Z",
      device_id: "dev-123",
      input: {} as unknown as CarbonInput,
      result,
    },
  ]);
  vi.mocked(api.calculate).mockResolvedValue(result);
  vi.mocked(api.getInsights).mockResolvedValue(insights);
  vi.mocked(api.saveEntry).mockResolvedValue({
    id: "e1",
    created_at: new Date().toISOString(),
    device_id: "dev-123",
    input: {} as never,
    result,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

/** Render the app and wait for the initial history load to settle. */
async function renderApp() {
  const view = render(<App />);
  await waitFor(() => expect(api.listEntries).toHaveBeenCalled());
  return view;
}

describe("App", () => {
  it("renders with no accessibility violations", async () => {
    const { container } = await renderApp();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("calculates and shows results on the analytics tab", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));

    // After calculation, the app auto-navigates to the analytics tab.
    await waitFor(() => expect(screen.getByText(/your estimated footprint/i)).toBeInTheDocument());
    expect(api.calculate).toHaveBeenCalledTimes(1);
  });

  it("shows personalized insights on the AI Action Plan tab", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));

    await waitFor(() => expect(screen.getByText(/your estimated footprint/i)).toBeInTheDocument());

    // Navigate to the AI Action Plan (insights) tab.
    await userEvent.click(screen.getByRole("tab", { name: /ai action plan/i }));

    // Fast-forward past the 1.5s insights generation animation.
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /personalized insights/i })).toBeInTheDocument(),
    );
    expect(screen.getByText(/drive less/i)).toBeInTheDocument();
  });

  it("announces readiness to screen readers via the status live region", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/results .* are ready below/i),
    );
  });

  it("saves an entry and reloads history", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));
    await waitFor(() => screen.getByRole("button", { name: /save this entry/i }));
    await userEvent.click(screen.getByRole("button", { name: /save this entry/i }));

    await waitFor(() => expect(api.saveEntry).toHaveBeenCalledTimes(1));
    // listEntries: once on mount, once after save.
    expect(api.listEntries).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/entry saved/i));
  });

  it("shows an error message when calculation fails", async () => {
    vi.mocked(api.calculate).mockRejectedValueOnce(new Error("boom"));
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i),
    );
  });

  it("shows an error message when saving fails", async () => {
    vi.mocked(api.saveEntry).mockRejectedValue(new Error("boom"));
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));
    await waitFor(() => screen.getByRole("button", { name: /save this entry/i }));
    await userEvent.click(screen.getByRole("button", { name: /save this entry/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/could not save/i));
  });

  it("navigates to Community Hub, triggers lazy loading and renders successfully", async () => {
    await renderApp();
    const communityTab = screen.getByRole("tab", { name: /community hub/i });
    await userEvent.click(communityTab);

    await waitFor(() => expect(api.listLeaderboard).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /community hub/i })).toBeInTheDocument();
  });

  it("navigates to Eco-Challenges and renders successfully", async () => {
    await renderApp();
    const challengesTab = screen.getByRole("tab", { name: /eco-challenges/i });
    await userEvent.click(challengesTab);
    expect(screen.getByRole("heading", { name: /gamified eco-quests/i })).toBeInTheDocument();
  });

  it("navigates to My Account and renders successfully", async () => {
    await renderApp();
    const accountTab = screen.getByRole("tab", { name: /my account/i });
    await userEvent.click(accountTab);
    expect(
      screen.getByRole("heading", { name: /access personal intelligence/i }),
    ).toBeInTheDocument();
  });

  it("navigates to Tracking History and renders successfully", async () => {
    await renderApp();
    const historyTab = screen.getByRole("tab", { name: /tracking history/i });
    await userEvent.click(historyTab);
    expect(screen.getByRole("heading", { name: /your history/i })).toBeInTheDocument();
  });

  it("renders logged in user email and allows signing out", async () => {
    const mockSignOut = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: "user-123", email: "loggedin@test.com" } as unknown as User,
      authLoading: false,
      authError: null as string | null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: mockSignOut,
    });

    await renderApp();
    expect(screen.getByText("loggedin@test.com")).toBeInTheDocument();

    const avatarBtn = screen.getByRole("button", { name: /go to profile/i });
    await userEvent.click(avatarBtn);
    expect(screen.getByRole("heading", { name: /your profile/i })).toBeInTheDocument();

    // Click calculator and analytics tabs
    const calcTab = screen.getByRole("tab", { name: /carbon calculator/i });
    await userEvent.click(calcTab);
    const analyticsTab = screen.getByRole("tab", { name: /sustain analytics/i });
    await userEvent.click(analyticsTab);

    const signOutBtn = screen.getByRole("button", { name: /sign out/i });
    await userEvent.click(signOutBtn);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("allows deleting a tip from Community Hub in the App integration flow", async () => {
    vi.mocked(api.listTips).mockResolvedValue([
      {
        id: "tip-abc",
        category: "home",
        title: "My Tip",
        description: "Save power",
        author_name: "Me",
        user_id: "user-123",
        created_at: "2026-06-21T00:00:00Z",
      },
    ]);
    mockUseAuth.mockReturnValue({
      user: { id: "user-123", email: "loggedin@test.com" } as unknown as User,
      authLoading: false,
      authError: null as string | null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    await renderApp();
    const communityTab = screen.getByRole("tab", { name: /community hub/i });
    await userEvent.click(communityTab);

    await waitFor(() => expect(screen.getByText("My Tip")).toBeInTheDocument());

    const deleteBtn = screen.getByRole("button", { name: /delete this tip/i });
    await userEvent.click(deleteBtn);

    const confirmBtn = screen.getByRole("button", { name: "Delete" });
    await userEvent.click(confirmBtn);

    await waitFor(() => expect(api.deleteTip).toHaveBeenCalledWith("tip-abc"));
  });

  it("allows sharing a tip from Community Hub in the App integration flow", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-123", email: "loggedin@test.com" } as unknown as User,
      authLoading: false,
      authError: null as string | null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    await renderApp();
    const communityTab = screen.getByRole("tab", { name: /community hub/i });
    await userEvent.click(communityTab);

    // Fill out share tip form
    const titleInput = screen.getByLabelText(/Tip Title/i);
    const descInput = screen.getByLabelText(/How does it help/i);
    const publishBtn = screen.getByRole("button", { name: /Publish Tip/i });

    await userEvent.type(titleInput, "Save Water");
    await userEvent.type(descInput, "Take shorter showers.");
    await userEvent.click(publishBtn);

    await waitFor(() => {
      expect(api.saveTip).toHaveBeenCalledWith(
        "home",
        "Save Water",
        "Take shorter showers.",
        "loggedin",
        "user-123",
      );
    });
  });

  it("navigates to Account tab when clicking sign in inside Community Hub", async () => {
    await renderApp();
    const communityTab = screen.getByRole("tab", { name: /community/i });
    await userEvent.click(communityTab);

    const signInCtaBtns = screen.getAllByRole("button", { name: /Sign In \/ Register/i });
    await userEvent.click(signInCtaBtns[1]);

    expect(
      screen.getByRole("heading", { name: /access personal intelligence/i }),
    ).toBeInTheDocument();
  });

  it("renders InsightsEmptyState on AI Action Plan tab before calculation is run", async () => {
    await renderApp();
    const insightsTab = screen.getByRole("tab", { name: /ai action plan/i });
    await userEvent.click(insightsTab);
    expect(screen.getByText(/Awaiting Your Data/i)).toBeInTheDocument();
  });

  it("navigates to Account tab when clicking Sign In / Register in the header when logged out", async () => {
    await renderApp();
    const signInBtn = screen.getAllByRole("button", { name: /Sign In \/ Register/i })[0];
    await userEvent.click(signInBtn);
    expect(
      screen.getByRole("heading", { name: /access personal intelligence/i }),
    ).toBeInTheDocument();
  });
});
