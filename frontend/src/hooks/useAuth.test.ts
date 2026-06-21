import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "./useAuth";

const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

let mockSupabase: unknown = {
  auth: {
    signUp: (...args: unknown[]) => mockSignUp(...args),
    signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
    signOut: (...args: unknown[]) => mockSignOut(...args),
    getSession: (...args: unknown[]) => mockGetSession(...args),
    onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
  },
};

vi.mock("../lib/supabaseClient", () => ({
  get supabase() {
    return mockSupabase;
  },
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        signUp: (...args: unknown[]) => mockSignUp(...args),
        signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
        signOut: (...args: unknown[]) => mockSignOut(...args),
        getSession: (...args: unknown[]) => mockGetSession(...args),
        onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      },
    };
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it("recovers initial session on mount", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } });

    let hookResult: { current: ReturnType<typeof useAuth> } | undefined;
    await act(async () => {
      const { result } = renderHook(() => useAuth());
      hookResult = result;
    });

    expect(mockGetSession).toHaveBeenCalled();
    expect(hookResult?.current.user).toEqual(mockUser);
    expect(hookResult?.current.authLoading).toBe(false);
  });

  it("handles getSession failure gracefully", async () => {
    mockGetSession.mockRejectedValue(new Error("session error"));

    let hookResult: { current: ReturnType<typeof useAuth> } | undefined;
    await act(async () => {
      const { result } = renderHook(() => useAuth());
      hookResult = result;
    });

    expect(hookResult?.current.user).toBeNull();
    expect(hookResult?.current.authLoading).toBe(false);
  });

  it("subscribes to auth state changes and updates user", async () => {
    let changeCallback:
      | ((event: string, session: { user: { id: string; email: string } } | null) => void)
      | undefined;
    mockOnAuthStateChange.mockImplementation((cb) => {
      changeCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    let hookResult: { current: ReturnType<typeof useAuth> } | undefined;
    await act(async () => {
      const { result } = renderHook(() => useAuth());
      hookResult = result;
    });

    expect(mockOnAuthStateChange).toHaveBeenCalled();

    const mockUser = { id: "user-456", email: "change@example.com" };
    await act(async () => {
      if (changeCallback) {
        changeCallback("SIGNED_IN", { user: mockUser });
      }
    });

    expect(hookResult?.current.user).toEqual(mockUser);
  });

  it("signs up successfully", async () => {
    const mockUser = { id: "user-new", email: "new@example.com" };
    mockSignUp.mockResolvedValue({ data: { user: mockUser }, error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "password123");
    });

    expect(mockSignUp).toHaveBeenCalledWith({ email: "new@example.com", password: "password123" });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.authError).toBeNull();
  });

  it("sets authError when signUp fails", async () => {
    mockSignUp.mockResolvedValue({ data: { user: null }, error: { message: "sign up failed" } });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await expect(result.current.signUp("new@example.com", "password123")).rejects.toThrow(
        "sign up failed",
      );
    });

    expect(result.current.authError).toBe("sign up failed");
    expect(result.current.user).toBeNull();
  });

  it("signs in successfully", async () => {
    const mockUser = { id: "user-in", email: "in@example.com" };
    mockSignIn.mockResolvedValue({ data: { user: mockUser }, error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("in@example.com", "password123");
    });

    expect(mockSignIn).toHaveBeenCalledWith({ email: "in@example.com", password: "password123" });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.authError).toBeNull();
  });

  it("sets authError when signIn fails", async () => {
    mockSignIn.mockResolvedValue({ data: { user: null }, error: { message: "sign in failed" } });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await expect(result.current.signIn("in@example.com", "password123")).rejects.toThrow(
        "sign in failed",
      );
    });

    expect(result.current.authError).toBe("sign in failed");
    expect(result.current.user).toBeNull();
  });

  it("signs out successfully", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.authError).toBeNull();
  });

  it("sets authError when signOut fails", async () => {
    mockSignOut.mockResolvedValue({ error: { message: "sign out failed" } });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await expect(result.current.signOut()).rejects.toThrow("sign out failed");
    });

    expect(result.current.authError).toBe("sign out failed");
  });

  it("handles null supabase client gracefully", async () => {
    mockSupabase = null;
    let hookResult: { current: ReturnType<typeof useAuth> } | undefined;
    await act(async () => {
      const { result } = renderHook(() => useAuth());
      hookResult = result;
    });
    expect(hookResult?.current.authLoading).toBe(false);
  });
});
