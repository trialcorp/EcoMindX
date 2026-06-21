import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFootprint } from "./useFootprint";
import * as api from "../lib/api";
import type { User } from "@supabase/supabase-js";

vi.mock("../lib/api", () => ({
  calculate: vi.fn(),
  getInsights: vi.fn(),
  saveEntry: vi.fn(),
  listEntries: vi.fn(() => Promise.resolve([])),
  claimDeviceHistory: vi.fn(),
}));

vi.mock("../lib/deviceId", () => ({
  getDeviceId: vi.fn(() => "test-device-id"),
}));

describe("useFootprint", () => {
  const mockUser = { id: "user-123" } as User;
  const mockResult = { total_annual_tonnes: 4.5, breakdown_kg: {} } as never;
  const mockInsights = { summary: "Good work", recommendations: [] } as never;
  const mockInput = { transport: {}, home: {}, diet: "vegan", consumption: {} } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("loads initial state from localStorage if present", () => {
    localStorage.setItem("ecomindx_active_result", JSON.stringify(mockResult));
    localStorage.setItem("ecomindx_active_input", JSON.stringify(mockInput));
    localStorage.setItem("ecomindx_active_insights", JSON.stringify(mockInsights));

    const { result } = renderHook(() => useFootprint(null));

    expect(result.current.result).toEqual(mockResult);
    expect(result.current.lastInput).toEqual(mockInput);
    expect(result.current.insights).toEqual(mockInsights);
  });

  it("handles corrupted localStorage data gracefully", () => {
    localStorage.setItem("ecomindx_active_result", "{bad json}");
    localStorage.setItem("ecomindx_active_input", "{bad json}");
    localStorage.setItem("ecomindx_active_insights", "{bad json}");

    const { result } = renderHook(() => useFootprint(null));

    expect(result.current.result).toBeNull();
    expect(result.current.lastInput).toBeNull();
    expect(result.current.insights).toBeNull();
  });

  it("runs loadHistory on mount and silent fallback on failure", async () => {
    vi.mocked(api.listEntries).mockRejectedValue(new Error("silent error"));

    let result: { current: ReturnType<typeof useFootprint> } | undefined;
    await act(async () => {
      const rendered = renderHook(() => useFootprint(mockUser));
      result = rendered.result;
    });

    expect(api.listEntries).toHaveBeenCalledWith("test-device-id", "user-123");
    expect(result?.current.entries).toEqual([]);
  });

  it("calculates successfully and auto-saves to history", async () => {
    vi.mocked(api.calculate).mockResolvedValue(mockResult);
    vi.mocked(api.getInsights).mockResolvedValue(mockInsights);
    vi.mocked(api.saveEntry).mockResolvedValue({} as never);

    const { result } = renderHook(() => useFootprint(mockUser));

    await act(async () => {
      await result.current.calculate(mockInput);
    });

    expect(api.calculate).toHaveBeenCalledWith(mockInput);
    expect(api.getInsights).toHaveBeenCalledWith(mockInput);
    expect(api.saveEntry).toHaveBeenCalledWith("test-device-id", mockInput, mockResult, "user-123");
    expect(result.current.result).toEqual(mockResult);
    expect(result.current.insights).toEqual(mockInsights);
    expect(result.current.status).toContain("ready below");
    expect(result.current.error).toBeNull();
  });

  it("calculates successfully even when auto-save fails", async () => {
    vi.mocked(api.calculate).mockResolvedValue(mockResult);
    vi.mocked(api.getInsights).mockResolvedValue(mockInsights);
    vi.mocked(api.saveEntry).mockRejectedValue(new Error("auto-save fail"));

    const { result } = renderHook(() => useFootprint(mockUser));

    await act(async () => {
      await result.current.calculate(mockInput);
    });

    expect(result.current.result).toEqual(mockResult);
    expect(result.current.error).toBeNull();
  });

  it("sets error when calculate fails", async () => {
    vi.mocked(api.calculate).mockRejectedValue(new Error("calculate fail"));

    const { result } = renderHook(() => useFootprint(mockUser));

    await act(async () => {
      await result.current.calculate(mockInput);
    });

    expect(result.current.error).toContain("Something went wrong");
  });

  it("saves entry manually", async () => {
    vi.mocked(api.saveEntry).mockResolvedValue({} as never);
    localStorage.setItem("ecomindx_active_result", JSON.stringify(mockResult));
    localStorage.setItem("ecomindx_active_input", JSON.stringify(mockInput));

    const { result } = renderHook(() => useFootprint(mockUser));

    await act(async () => {
      await result.current.save();
    });

    expect(api.saveEntry).toHaveBeenCalledWith("test-device-id", mockInput, mockResult, "user-123");
    expect(result.current.status).toContain("saved to your history");

    vi.clearAllMocks();
    await act(async () => {
      await result.current.save();
    });
    expect(api.saveEntry).not.toHaveBeenCalled();
  });

  it("save does nothing if no result or lastInput", async () => {
    const { result } = renderHook(() => useFootprint(mockUser));

    await act(async () => {
      await result.current.save();
    });

    expect(api.saveEntry).not.toHaveBeenCalled();
  });

  it("handles manual save error", async () => {
    vi.mocked(api.saveEntry).mockRejectedValue(new Error("save fail"));
    localStorage.setItem("ecomindx_active_result", JSON.stringify(mockResult));
    localStorage.setItem("ecomindx_active_input", JSON.stringify(mockInput));

    const { result } = renderHook(() => useFootprint(mockUser));

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toContain("Could not save this entry");
  });

  it("save handles manual save string error", async () => {
    vi.mocked(api.saveEntry).mockRejectedValue("string save fail");
    localStorage.setItem("ecomindx_active_result", JSON.stringify(mockResult));
    localStorage.setItem("ecomindx_active_input", JSON.stringify(mockInput));

    const { result } = renderHook(() => useFootprint(mockUser));

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toContain("Could not save this entry");
  });

  it("claims device history successfully", async () => {
    vi.mocked(api.claimDeviceHistory).mockResolvedValue(undefined);

    const { result } = renderHook(() => useFootprint(mockUser));

    await act(async () => {
      await result.current.claimHistory();
    });

    expect(api.claimDeviceHistory).toHaveBeenCalledWith("test-device-id", "user-123");
    expect(result.current.status).toContain("Device history claimed");
  });

  it("claims device history does nothing if no user is logged in", async () => {
    const { result } = renderHook(() => useFootprint(null));

    await act(async () => {
      await result.current.claimHistory();
    });

    expect(api.claimDeviceHistory).not.toHaveBeenCalled();
  });

  it("handles claim device history failure", async () => {
    vi.mocked(api.claimDeviceHistory).mockRejectedValue(new Error("claim error"));

    const { result } = renderHook(() => useFootprint(mockUser));

    await act(async () => {
      await result.current.claimHistory();
    });

    expect(result.current.error).toBe("claim error");
  });

  it("handles claim device history failure with string error", async () => {
    vi.mocked(api.claimDeviceHistory).mockRejectedValue("string claim error");

    const { result } = renderHook(() => useFootprint(mockUser));

    await act(async () => {
      await result.current.claimHistory();
    });

    expect(result.current.error).toBe("Failed to claim local history.");
  });

  it("warns when writing to localStorage fails", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Set initial values in localStorage first using direct API
    localStorage.setItem("ecomindx_active_result", JSON.stringify(mockResult));
    localStorage.setItem("ecomindx_active_input", JSON.stringify(mockInput));
    localStorage.setItem("ecomindx_active_insights", JSON.stringify(mockInsights));

    const mockSetItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });

    renderHook(() => useFootprint(null));

    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
    mockSetItem.mockRestore();
  });
});
