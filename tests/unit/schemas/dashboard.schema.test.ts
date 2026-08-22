import { describe, it, expect } from "vitest";
import { dashboardQuerySchema } from "@/schemas/dashboard.schema";

describe("Dashboard Query Schema Validation", () => {
  it("accepts valid date range and limit", () => {
    const raw = {
      from: "2026-08-01",
      to: "2026-08-31",
      limit: "10",
    };

    const parsed = dashboardQuerySchema.parse(raw);
    expect(parsed.from).toBeInstanceOf(Date);
    expect(parsed.to).toBeInstanceOf(Date);
    expect(parsed.limit).toBe(10);
  });

  it("applies default and max limit constraints", () => {
    expect(dashboardQuerySchema.parse({}).limit).toBe(5);
    expect(dashboardQuerySchema.parse({ limit: "100" }).limit).toBe(50);
  });

  it("rejects when 'from' is after 'to'", () => {
    const raw = {
      from: "2026-08-31",
      to: "2026-08-01",
    };

    const result = dashboardQuerySchema.safeParse(raw);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        "'from' date must be before or equal to 'to' date"
      );
    }
  });
});
