import { describe, it, expect, vi, beforeEach } from "vitest";
import { failDelivery } from "@/lib/api/agents";
import { rescheduleCustomerOrder, rescheduleAdminOrder } from "@/lib/api/orders";
import { apiClient, ApiClientError } from "@/lib/api/client";

describe("Frontend ↔ Backend API Contract Alignment", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("failDelivery formats body payload as { failureReason, notes }", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (key: string) => (key === "content-type" ? "application/json" : null),
      },
      json: async () => ({
        success: true,
        data: { id: "order-123", status: "FAILED", failureReason: "CUSTOMER_UNAVAILABLE" },
      }),
    });

    const result = await failDelivery("order-123", "CUSTOMER_UNAVAILABLE", "Called 3 times");
    expect(result).toBeDefined();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/agent/orders/order-123/fail-delivery",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          failureReason: "CUSTOMER_UNAVAILABLE",
          notes: "Called 3 times",
        }),
      })
    );
  });

  it("rescheduleCustomerOrder formats body payload as { scheduledDeliveryDate, notes }", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (key: string) => (key === "content-type" ? "application/json" : null),
      },
      json: async () => ({
        success: true,
        data: { id: "order-123", status: "RESCHEDULED", currentAttempt: 2 },
      }),
    });

    const result = await rescheduleCustomerOrder("order-123", "2026-08-25", "Please deliver after 2pm");
    expect(result).toBeDefined();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/orders/order-123/reschedule",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          scheduledDeliveryDate: "2026-08-25",
          notes: "Please deliver after 2pm",
        }),
      })
    );
  });

  it("rescheduleAdminOrder formats body payload as { scheduledDeliveryDate, notes }", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (key: string) => (key === "content-type" ? "application/json" : null),
      },
      json: async () => ({
        success: true,
        data: { id: "order-456", status: "RESCHEDULED", currentAttempt: 3 },
      }),
    });

    const result = await rescheduleAdminOrder("order-456", "2026-08-26");
    expect(result).toBeDefined();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/orders/order-456/reschedule",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          scheduledDeliveryDate: "2026-08-26",
          notes: undefined,
        }),
      })
    );
  });

  it("handles fetch network failure with NETWORK_ERROR code", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    await expect(apiClient("/api/test")).rejects.toThrow(ApiClientError);

    try {
      await apiClient("/api/test");
    } catch (err: any) {
      expect(err.code).toBe("NETWORK_ERROR");
      expect(err.status).toBe(0);
    }
  });

  it("handles 502 Bad Gateway non-JSON response gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      headers: {
        get: (key: string) => (key === "content-type" ? "text/html" : null),
      },
    });

    await expect(apiClient("/api/test")).rejects.toThrow(ApiClientError);

    try {
      await apiClient("/api/test");
    } catch (err: any) {
      expect(err.status).toBe(502);
      expect(err.code).toBe("HTTP_502");
      expect(err.message).toBe("Bad Gateway");
    }
  });
});
