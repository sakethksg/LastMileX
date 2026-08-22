import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { fetchCurrentUser } from "@/lib/api/auth";

describe("Frontend API Client Architecture", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("unwraps { success: true, data } response correctly", async () => {
    const mockData = { id: "123", name: "Test Order" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (key: string) => (key === "content-type" ? "application/json" : null),
      },
      json: async () => ({ success: true, data: mockData }),
    });

    const result = await apiClient("/api/test");
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("throws ApiClientError with code and details on 400 Bad Request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      headers: {
        get: (key: string) => (key === "content-type" ? "application/json" : null),
      },
      json: async () => ({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: [{ path: ["pinCode"], message: "Invalid PIN code" }],
        },
      }),
    });

    await expect(apiClient("/api/test")).rejects.toThrow(ApiClientError);

    try {
      await apiClient("/api/test");
    } catch (err: any) {
      expect(err.status).toBe(400);
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.message).toBe("Validation failed");
      expect(err.details).toBeDefined();
    }
  });

  it("handles 401 Unauthorized smoothly in fetchCurrentUser", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: {
        get: (key: string) => (key === "content-type" ? "application/json" : null),
      },
      json: async () => ({
        success: false,
        error: { message: "No active session", code: "UNAUTHORIZED" },
      }),
    });

    const user = await fetchCurrentUser();
    expect(user).toBeNull();
  });
});
