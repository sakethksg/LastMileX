import { describe, it, expect } from "vitest";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/api-response";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { z } from "zod";

describe("API Response Utilities", () => {
  it("creates standard success response", async () => {
    const res = successResponse({ id: "123", name: "Test Item" }, { page: 1, limit: 10, total: 1 });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("123");
    expect(json.meta.total).toBe(1);
  });

  it("creates standard error response", async () => {
    const res = errorResponse("Something went wrong", 500, "CUSTOM_ERROR");
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("CUSTOM_ERROR");
    expect(json.error.message).toBe("Something went wrong");
  });

  it("handles AppError instances properly", async () => {
    const notFoundErr = new NotFoundError("Order not found");
    const res = handleApiError(notFoundErr);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
    expect(json.error.message).toBe("Order not found");
  });

  it("handles ZodError instances properly", async () => {
    const schema = z.object({
      weight: z.number().positive("Weight must be positive"),
    });

    const parsed = schema.safeParse({ weight: -5 });
    if (!parsed.success) {
      const res = handleApiError(parsed.error);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.details?.[0].field).toBe("weight");
    }
  });
});
