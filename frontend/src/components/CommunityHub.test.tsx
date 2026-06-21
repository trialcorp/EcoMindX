import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommunityHub } from "./CommunityHub";
import { axe } from "vitest-axe";
import type { User } from "@supabase/supabase-js";

describe("CommunityHub", () => {
  const mockTips = [
    {
      id: "tip-1",
      created_at: "2026-06-21T12:00:00Z",
      category: "home",
      title: "Test Tip",
      description: "Test Desc",
      author_name: "Test Author",
      user_id: "user-1",
    },
  ];

  const mockLeaderboard = [
    { user_id: "user-1", display_name: "Test User", score: 1000, isUser: true, name: "Test User" },
  ];

  const mockOnShare = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);

  it("renders the leaderboard and tips", () => {
    render(
      <CommunityHub
        leaderboardUsers={mockLeaderboard}
        collectiveSaved={5000}
        communityTips={mockTips}
        loadingCommunity={false}
        communityError={null}
        user={null}
        onShareTip={mockOnShare}
        onDeleteTip={mockOnDelete}
        onSignInClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Test Tip")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("5,000 kg")).toBeInTheDocument();
  });

  it("allows submitting a tip", async () => {
    const mockUser = { id: "user-1", email: "Anonymous Eco-Warrior@example.com" };
    render(
      <CommunityHub
        leaderboardUsers={mockLeaderboard}
        collectiveSaved={5000}
        communityTips={mockTips}
        loadingCommunity={false}
        communityError={null}
        user={mockUser as unknown as User}
        onShareTip={mockOnShare}
        onDeleteTip={mockOnDelete}
        onSignInClick={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Tip Title/), { target: { value: "New Tip" } });
    fireEvent.change(screen.getByLabelText(/How does it help/), {
      target: { value: "It is good" },
    });
    fireEvent.click(screen.getByText("Publish Tip"));

    await waitFor(() => {
      expect(mockOnShare).toHaveBeenCalledWith(
        "home",
        "New Tip",
        "It is good",
        "Anonymous Eco-Warrior",
      );
    });
  });

  it("passes accessibility checks", async () => {
    const { container } = render(
      <CommunityHub
        leaderboardUsers={mockLeaderboard}
        collectiveSaved={5000}
        communityTips={mockTips}
        loadingCommunity={false}
        communityError={null}
        user={null}
        onShareTip={mockOnShare}
        onDeleteTip={mockOnDelete}
        onSignInClick={vi.fn()}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
