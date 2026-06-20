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

vi.mock("./supabaseClient", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
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
});

