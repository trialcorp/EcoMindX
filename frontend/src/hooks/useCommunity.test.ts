import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCommunity } from "./useCommunity";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  listLeaderboard: vi.fn(),
  getCollectiveSavedCO2e: vi.fn(),
  listTips: vi.fn(),
  saveTip: vi.fn(),
  deleteTip: vi.fn(),
}));

describe("useCommunity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads community data successfully", async () => {
    const mockLeaderboard = [{ user_id: "u1", display_name: "User 1", score: 10 }];
    const mockTips = [{ id: "t1", title: "Tip 1", category: "home" }];
    const mockSaved = 50000;

    vi.mocked(api.listLeaderboard).mockResolvedValue(mockLeaderboard);
    vi.mocked(api.getCollectiveSavedCO2e).mockResolvedValue(mockSaved);
    vi.mocked(api.listTips).mockResolvedValue(mockTips as never);

    const { result } = renderHook(() => useCommunity());

    expect(result.current.loadingCommunity).toBe(false);

    await act(async () => {
      await result.current.loadCommunityData();
    });

    expect(api.listLeaderboard).toHaveBeenCalled();
    expect(api.getCollectiveSavedCO2e).toHaveBeenCalled();
    expect(api.listTips).toHaveBeenCalled();

    expect(result.current.leaderboard).toEqual(mockLeaderboard);
    expect(result.current.collectiveSaved).toBe(mockSaved);
    expect(result.current.tips).toEqual(mockTips);
    expect(result.current.loadingCommunity).toBe(false);
    expect(result.current.communityError).toBeNull();
  });

  it("handles loading error gracefully", async () => {
    vi.mocked(api.listLeaderboard).mockRejectedValue(new Error("db error"));

    const { result } = renderHook(() => useCommunity());

    await act(async () => {
      await result.current.loadCommunityData();
    });

    expect(result.current.communityError).toContain("Could not load community data");
    expect(result.current.loadingCommunity).toBe(false);
  });

  it("shares a tip and reloads data", async () => {
    vi.mocked(api.saveTip).mockResolvedValue({} as never);
    vi.mocked(api.listLeaderboard).mockResolvedValue([]);
    vi.mocked(api.getCollectiveSavedCO2e).mockResolvedValue(0);
    vi.mocked(api.listTips).mockResolvedValue([]);

    const { result } = renderHook(() => useCommunity());

    await act(async () => {
      await result.current.shareTip("home", "Title", "Desc", "Author", "user-123");
    });

    expect(api.saveTip).toHaveBeenCalledWith("home", "Title", "Desc", "Author", "user-123");
    expect(api.listTips).toHaveBeenCalled();
  });

  it("handles sharing error gracefully and bubbles the exception", async () => {
    vi.mocked(api.saveTip).mockRejectedValue(new Error("share error"));

    const { result } = renderHook(() => useCommunity());

    await act(async () => {
      await expect(
        result.current.shareTip("home", "Title", "Desc", "Author", "user-123"),
      ).rejects.toThrow("share error");
    });

    expect(result.current.communityError).toBe("share error");
  });

  it("handles sharing non-Error error gracefully and bubbles it", async () => {
    vi.mocked(api.saveTip).mockRejectedValue("string error");

    const { result } = renderHook(() => useCommunity());

    await act(async () => {
      await expect(
        result.current.shareTip("home", "Title", "Desc", "Author", "user-123"),
      ).rejects.toBe("string error");
    });

    expect(result.current.communityError).toBe("Failed to share eco-tip.");
  });

  it("deletes a tip and reloads data", async () => {
    vi.mocked(api.deleteTip).mockResolvedValue(undefined);
    vi.mocked(api.listLeaderboard).mockResolvedValue([]);
    vi.mocked(api.getCollectiveSavedCO2e).mockResolvedValue(0);
    vi.mocked(api.listTips).mockResolvedValue([]);

    const { result } = renderHook(() => useCommunity());

    await act(async () => {
      await result.current.deleteTip("tip-123");
    });

    expect(api.deleteTip).toHaveBeenCalledWith("tip-123");
    expect(api.listTips).toHaveBeenCalled();
  });

  it("handles deletion error gracefully and bubbles it", async () => {
    vi.mocked(api.deleteTip).mockRejectedValue(new Error("delete error"));

    const { result } = renderHook(() => useCommunity());

    await act(async () => {
      await expect(result.current.deleteTip("tip-123")).rejects.toThrow("delete error");
    });

    expect(result.current.communityError).toBe("delete error");
  });

  it("handles deletion non-Error error gracefully and bubbles it", async () => {
    vi.mocked(api.deleteTip).mockRejectedValue("delete failure");

    const { result } = renderHook(() => useCommunity());

    await act(async () => {
      await expect(result.current.deleteTip("tip-123")).rejects.toBe("delete failure");
    });

    expect(result.current.communityError).toBe("Failed to delete eco-tip.");
  });
});
