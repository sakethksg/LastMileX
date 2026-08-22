import { describe, it, expect } from "vitest";
import { createCodSurchargeSchema } from "@/schemas/cod-surcharge.schema";
import { RouteType, SurchargeType } from "@/types/enums";

describe("CodSurcharge Schemas", () => {
  it("validates valid flat surcharge", () => {
    const valid = {
      routeType: RouteType.INTRA_ZONE,
      surchargeType: SurchargeType.FLAT,
      surchargeValue: 40,
      effectiveFrom: new Date("2026-01-01"),
      isActive: true,
    };

    const result = createCodSurchargeSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("validates valid percentage surcharge with min/max caps", () => {
    const valid = {
      routeType: RouteType.INTER_ZONE,
      surchargeType: SurchargeType.PERCENTAGE,
      surchargeValue: 2.5,
      minSurcharge: 50,
      maxSurcharge: 250,
      effectiveFrom: new Date("2026-01-01"),
    };

    const result = createCodSurchargeSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects percentage surcharge > 100%", () => {
    const invalid = {
      routeType: RouteType.INTER_ZONE,
      surchargeType: SurchargeType.PERCENTAGE,
      surchargeValue: 150, // > 100%
      effectiveFrom: new Date("2026-01-01"),
    };

    const result = createCodSurchargeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects maxSurcharge < minSurcharge", () => {
    const invalid = {
      routeType: RouteType.INTER_ZONE,
      surchargeType: SurchargeType.PERCENTAGE,
      surchargeValue: 2.5,
      minSurcharge: 100,
      maxSurcharge: 50, // Less than min
      effectiveFrom: new Date("2026-01-01"),
    };

    const result = createCodSurchargeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
