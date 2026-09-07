import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import React from "react";
import { supabase } from "@/integrations/supabase/client";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Mock normalizeOptionalProfileField internally if needed or assume works
describe("AuthContext", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ full_name: "Donor User", role: "donor" })
    }) as any;

    // Default to no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    // Mock onAuthStateChange returning a mock unsubscription
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } as any },
    } as any);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("should initialize with null user and loading true, then false", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("should load session and resolve user info successfully", async () => {
    // Setup a fake session
    const mockSession = {
      user: {
        id: "user_123",
        email: "donor@nutriguard.id",
        user_metadata: {
          full_name: "Donor User",
          role: "donor",
        },
      },
    };
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.id).toBe("user_123");
    expect(result.current.user?.email).toBe("donor@nutriguard.id");
    expect(result.current.user?.role).toBe("donor");
    expect(result.current.user?.fullName).toBe("Donor User");
  });

  it("should handle signIn successfully", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock signIn
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: {
        session: {
          user: {
            id: "user_1",
            email: "vendor@nutriguard.id",
          }
        }
      },
      error: null,
    } as any);

    let signInResult;
    await act(async () => {
      signInResult = await result.current.signIn("test@test.com", "password");
    });

    expect(signInResult).toEqual({ error: null }); // Returns object with no error
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password",
    });
  });

  it("should handle signIn error", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { session: null },
      error: { message: "Invalid credentials" },
    } as any);

    let signInResult;
    await act(async () => {
      signInResult = await result.current.signIn("test@test.com", "wrong");
    });

    expect(signInResult).toEqual({ error: "Invalid credentials" });
  });

  it("should handle signOut", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
