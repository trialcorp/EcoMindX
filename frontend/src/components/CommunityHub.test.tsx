import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommunityHub } from "./CommunityHub";
import { axe } from "vitest-axe";
import type { User } from "@supabase/supabase-js";
import type { LeaderboardEntry } from "../lib/types";

describe("CommunityHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("allows deleting a tip when the user matches the tip owner", async () => {
    const mockUser = { id: "user-1", email: "user1@example.com" };
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

    // Click delete button
    const deleteBtn = screen.getByRole("button", { name: /delete this tip/i });
    fireEvent.click(deleteBtn);

    // Click confirm delete in dialog
    const confirmBtn = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith("tip-1");
    });
  });

  it("renders communityError when provided", () => {
    render(
      <CommunityHub
        leaderboardUsers={mockLeaderboard}
        collectiveSaved={5000}
        communityTips={mockTips}
        loadingCommunity={false}
        communityError="Error occurred"
        user={null}
        onShareTip={mockOnShare}
        onDeleteTip={mockOnDelete}
        onSignInClick={vi.fn()}
      />,
    );
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });

  it("allows canceling tip deletion", async () => {
    const mockUser = { id: "user-1", email: "user1@example.com" };
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

    // Click delete button
    const deleteBtn = screen.getByRole("button", { name: /delete this tip/i });
    fireEvent.click(deleteBtn);

    // Click cancel in confirm dialog
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);

    // Dialog should close and onDeleteTip should NOT be called
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("allows selecting category when submitting a tip and handles submit failure", async () => {
    const mockUser = { id: "user-1", email: "Anonymous Eco-Warrior@example.com" };
    const mockRejectShare = vi.fn().mockRejectedValue(new Error("Fail share"));

    render(
      <CommunityHub
        leaderboardUsers={mockLeaderboard}
        collectiveSaved={5000}
        communityTips={mockTips}
        loadingCommunity={false}
        communityError={null}
        user={mockUser as unknown as User}
        onShareTip={mockRejectShare}
        onDeleteTip={mockOnDelete}
        onSignInClick={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: "transport" } });
    fireEvent.change(screen.getByLabelText(/Tip Title/), { target: { value: "New Tip" } });
    fireEvent.change(screen.getByLabelText(/How does it help/), {
      target: { value: "It is good" },
    });
    fireEvent.click(screen.getByText("Publish Tip"));

    await waitFor(() => {
      expect(mockRejectShare).toHaveBeenCalledWith(
        "transport",
        "New Tip",
        "It is good",
        "Anonymous Eco-Warrior",
      );
    });
  });

  it("renders loading community spinner when loading and leaderboard is empty", () => {
    render(
      <CommunityHub
        leaderboardUsers={[]}
        collectiveSaved={5000}
        communityTips={mockTips}
        loadingCommunity={true}
        communityError={null}
        user={null}
        onShareTip={mockOnShare}
        onDeleteTip={mockOnDelete}
        onSignInClick={vi.fn()}
      />,
    );
    expect(screen.getByText("Loading community data...")).toBeInTheDocument();
  });

  it("does not submit if title or description is missing", async () => {
    const mockUser = { id: "user-1" };
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

    fireEvent.click(screen.getByText("Publish Tip"));

    await waitFor(() => {
      expect(mockOnShare).not.toHaveBeenCalled();
    });
  });

  it("renders anonymous leaderboard user gracefully", () => {
    const anonymousLeaderboard = [
      { score: 1000, isUser: false } as unknown as LeaderboardEntry,
    ];
    render(
      <CommunityHub
        leaderboardUsers={anonymousLeaderboard}
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
    expect(screen.getByText("1000.0 t")).toBeInTheDocument();
  });

  it("submits as Anonymous when user has no email", async () => {
    const mockUser = { id: "user-no-email" };
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
        "Anonymous",
      );
    });
  });

  it("renders more than 3 leaderboard users", () => {
    const longLeaderboard = [
      { user_id: "1", score: 100, isUser: false, name: "A" },
      { user_id: "2", score: 200, isUser: false, name: "B" },
      { user_id: "3", score: 300, isUser: false, name: "C" },
      { user_id: "4", score: 400, isUser: false, name: "D" },
    ] as unknown as LeaderboardEntry[];
    render(
      <CommunityHub
        leaderboardUsers={longLeaderboard}
        collectiveSaved={5000}
        communityTips={[]}
        loadingCommunity={false}
        communityError={null}
        user={null}
        onShareTip={vi.fn()}
        onDeleteTip={vi.fn()}
        onSignInClick={vi.fn()}
      />,
    );
    expect(screen.getByText("#4")).toBeInTheDocument();
  });

  it("does not submit if description is missing but title is provided", async () => {
    const mockUser = { id: "user-1" };
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
    fireEvent.click(screen.getByText("Publish Tip"));
    await waitFor(() => {
      expect(mockOnShare).not.toHaveBeenCalled();
    });
  });

  it("does not submit if title is missing but description is provided", async () => {
    const mockUser = { id: "user-1" };
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
    fireEvent.change(screen.getByLabelText(/How does it help/), {
      target: { value: "It is good" },
    });
    fireEvent.click(screen.getByText("Publish Tip"));
    await waitFor(() => {
      expect(mockOnShare).not.toHaveBeenCalled();
    });
  });
});
