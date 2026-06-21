import { describe, expect, it, vi, beforeEach } from "vitest";
import * as api from "./api";
import { emptyInput } from "./types";
import type { FootprintResult } from "./types";

const result: FootprintResult = {
  breakdown_kg: { transport: 0, home: 0, diet: 1050, consumption: 0 },
  total_annual_kg: 1050,
  total_annual_tonnes: 1.05,
  comparison: {
    global_average_annual_kg: 4800,
    sustainable_target_annual_kg: 2000,
    ratio_to_global_average: 0.219,
    ratio_to_sustainable_target: 0.525,
  },
};

const mockInvoke = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();
const mockRpc = vi.fn();

vi.mock("./supabaseClient", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: (...args: unknown[]) => mockSingle(...args),
        }),
      }),
      select: (...args: unknown[]) => mockSelect(...args),
      delete: vi.fn().mockReturnValue({
        eq: (...args: unknown[]) => mockDelete(...args),
      }),
      update: (...args: unknown[]) => mockUpdate(...args),
    }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("api client", () => {
  it("calculates the result locally", async () => {
    const res = await api.calculate(emptyInput());
    // emptyInput has diet: "medium_meat", which is 2500 kg CO2e, transport/home/consumption are 0.
    expect(res.total_annual_kg).toBe(2500);
  });

  it("calls the insights edge function and returns the result", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        summary: "Test summary",
        recommendations: [],
        source: "gemini",
      },
      error: null,
    });

    const res = await api.getInsights(emptyInput());
    expect(res.source).toBe("gemini");
    expect(mockInvoke).toHaveBeenCalledWith(
      "insights",
      expect.objectContaining({
        body: expect.objectContaining({
          data: emptyInput(),
        }),
      }),
    );
  });

  it("falls back to local rules when the edge function fails", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error("Edge function error"),
    });

    const res = await api.getInsights(emptyInput());
    expect(res.source).toBe("rules");
    expect(res.summary).toContain("footprint");
  });

  it("falls back to local rules when getInsights throws a network/invocation error", async () => {
    mockInvoke.mockRejectedValue(new Error("Network Failure"));

    const res = await api.getInsights(emptyInput());
    expect(res.source).toBe("rules");
    expect(res.summary).toContain("footprint");
  });

  it("saves an entry to the entries table", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "e1",
        created_at: "2026-01-01T00:00:00Z",
        device_id: "dev-abc12345",
        input: emptyInput(),
        result,
      },
      error: null,
    });

    const res = await api.saveEntry("dev-abc12345", emptyInput(), result);
    expect(res.id).toBe("e1");
    expect(mockSingle).toHaveBeenCalled();
  });

  it("saves an entry to the entries table with a user_id", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "e2",
        created_at: "2026-01-01T00:00:00Z",
        device_id: "dev-abc12345",
        user_id: "user-123",
        input: emptyInput(),
        result,
      },
      error: null,
    });

    const res = await api.saveEntry("dev-abc12345", emptyInput(), result, "user-123");
    expect(res.id).toBe("e2");
  });

  it("throws when saving an entry fails", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "DB Error" },
    });

    await expect(api.saveEntry("dev-abc12345", emptyInput(), result)).rejects.toThrow(
      /Failed to save entry: DB Error/,
    );
  });

  it("lists entries for a device", async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      data: [
        {
          id: "e1",
          created_at: "2026-01-01T00:00:00Z",
          device_id: "dev-abc12345",
          input: emptyInput(),
          result,
        },
      ],
      error: null,
    });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const res = await api.listEntries("dev-abc12345");
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("e1");
    expect(mockEq).toHaveBeenCalledWith("device_id", "dev-abc12345");
  });

  it("returns empty array when listEntries data is null", async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const res = await api.listEntries("dev-abc12345");
    expect(res).toEqual([]);
  });

  it("throws when history cannot be loaded", async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Load Error" },
    });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    await expect(api.listEntries("dev-abc12345")).rejects.toThrow(
      /Failed to load history: Load Error/,
    );
  });

  describe("deleteTip", () => {
    it("deletes a tip from the database", async () => {
      mockDelete.mockResolvedValue({
        error: null,
      });

      await api.deleteTip("tip-123");
      expect(mockDelete).toHaveBeenCalledWith("id", "tip-123");
    });

    it("throws when deletion fails", async () => {
      mockDelete.mockResolvedValue({
        error: { message: "Delete Policy Violation" },
      });

      await expect(api.deleteTip("tip-123")).rejects.toThrow(
        /Failed to delete tip: Delete Policy Violation/,
      );
    });
  });

  it("lists entries for a user if userId is provided", async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      data: [
        {
          id: "e1",
          created_at: "2026-01-01T00:00:00Z",
          device_id: "dev-abc12345",
          user_id: "user-999",
          input: emptyInput(),
          result,
        },
      ],
      error: null,
    });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const res = await api.listEntries("dev-abc12345", "user-999");
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("e1");
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-999");
  });

  describe("claimDeviceHistory", () => {
    it("successfully claims device history", async () => {
      const mockIsLocal = vi.fn().mockResolvedValue({ error: null });
      const mockEqLocal = vi.fn().mockReturnValue({ is: mockIsLocal });
      mockUpdate.mockReturnValue({ eq: mockEqLocal });

      await api.claimDeviceHistory("dev-123", "user-456");
      expect(mockUpdate).toHaveBeenCalledWith({ user_id: "user-456" });
      expect(mockEqLocal).toHaveBeenCalledWith("device_id", "dev-123");
      expect(mockIsLocal).toHaveBeenCalledWith("user_id", null);
    });

    it("throws an error when claim fails", async () => {
      const mockIsLocal = vi.fn().mockResolvedValue({ error: { message: "claim failed" } });
      const mockEqLocal = vi.fn().mockReturnValue({ is: mockIsLocal });
      mockUpdate.mockReturnValue({ eq: mockEqLocal });

      await expect(api.claimDeviceHistory("dev-123", "user-456")).rejects.toThrow(
        /Failed to claim device history: claim failed/,
      );
    });
  });

  describe("listLeaderboard", () => {
    it("returns formatted leaderboard entries", async () => {
      const mockOrderLocal = vi.fn().mockResolvedValue({
        data: [
          { user_id: "u1", display_name: "User One", score: 12.3 },
          { user_id: "u2", display_name: "User Two", score: 45.6 },
        ],
        error: null,
      });
      mockSelect.mockReturnValue({ order: mockOrderLocal });

      const res = await api.listLeaderboard();
      expect(res).toEqual([
        { user_id: "u1", display_name: "User One", score: 12.3 },
        { user_id: "u2", display_name: "User Two", score: 45.6 },
      ]);
      expect(mockOrderLocal).toHaveBeenCalledWith("score", { ascending: true });
    });

    it("returns empty array when leaderboard data is null", async () => {
      const mockOrderLocal = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      mockSelect.mockReturnValue({ order: mockOrderLocal });

      const res = await api.listLeaderboard();
      expect(res).toEqual([]);
    });

    it("throws error when loading leaderboard fails", async () => {
      const mockOrderLocal = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "db error" },
      });
      mockSelect.mockReturnValue({ order: mockOrderLocal });

      await expect(api.listLeaderboard()).rejects.toThrow(/Failed to load leaderboard: db error/);
    });
  });

  describe("getCollectiveSavedCO2e", () => {
    it("returns data value from RPC call", async () => {
      mockRpc.mockResolvedValue({ data: 99999, error: null });

      const res = await api.getCollectiveSavedCO2e();
      expect(res).toBe(99999);
      expect(mockRpc).toHaveBeenCalledWith("get_collective_saved_kg");
    });

    it("returns fallback value when RPC data is null without error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });
      const res = await api.getCollectiveSavedCO2e();
      expect(res).toBe(48250);
    });

    it("returns fallback value and warns when RPC fails", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "rpc error" } });

      const res = await api.getCollectiveSavedCO2e();
      expect(res).toBe(48250);
    });
  });

  describe("listTips", () => {
    it("returns community tips", async () => {
      const mockOrderLocal = vi.fn().mockResolvedValue({
        data: [{ id: "t1", title: "Tip 1", category: "home" }],
        error: null,
      });
      mockSelect.mockReturnValue({ order: mockOrderLocal });

      const res = await api.listTips();
      expect(res).toEqual([{ id: "t1", title: "Tip 1", category: "home" }]);
      expect(mockOrderLocal).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("returns empty array when listTips data is null", async () => {
      const mockOrderLocal = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      mockSelect.mockReturnValue({ order: mockOrderLocal });

      const res = await api.listTips();
      expect(res).toEqual([]);
    });

    it("throws error when listing tips fails", async () => {
      const mockOrderLocal = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "load tips error" },
      });
      mockSelect.mockReturnValue({ order: mockOrderLocal });

      await expect(api.listTips()).rejects.toThrow(/Failed to load tips: load tips error/);
    });
  });

  describe("saveTip", () => {
    it("saves a tip with user_id and returns the single data", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "t1", title: "Save Tip Test", author_name: "Author" },
        error: null,
      });

      const res = await api.saveTip("home", "Save Tip Test", "Desc", "Author", "user-123");
      expect(res.id).toBe("t1");
      expect(mockSingle).toHaveBeenCalled();
    });

    it("throws when saving a tip fails", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "save tip error" },
      });

      await expect(api.saveTip("home", "Save Tip Test", "Desc", "Author")).rejects.toThrow(
        /Failed to save tip: save tip error/,
      );
    });
  });
});
