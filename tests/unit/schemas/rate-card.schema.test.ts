import { describe, it, expect } from "vitest";
import { createRateCardSchema, weightSlabSchema } from "@/schemas/rate-card.schema";
import { CustomerType, RouteType } from "@/types/enums";

describe("RateCard & WeightSlab Schemas", () => {
  describe("WeightSlab Schema", () => {
    it("validates valid weight slab", () => {
      const valid = {
        minWeight: 0,
        maxWeight: 5,
        basePrice: 50,
        perKgRate: 10,
      };

      const result = weightSlabSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects maxWeight <= minWeight", () => {
      const invalid = {
        minWeight: 5,
        maxWeight: 5, // Equal
        basePrice: 50,
        perKgRate: 10,
      };

      const result = weightSlabSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects negative pricing values", () => {
      const invalid = {
        minWeight: 0,
        maxWeight: 5,
        basePrice: -50, // Negative
        perKgRate: 10,
      };

      const result = weightSlabSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("CreateRateCard Schema", () => {
    it("validates valid rate card with weight slabs", () => {
      const valid = {
        name: "Express B2C Intra",
        customerType: CustomerType.B2C,
        routeType: RouteType.INTRA_ZONE,
        effectiveFrom: new Date("2026-01-01"),
        weightSlabs: [
          { minWeight: 0, maxWeight: 1, basePrice: 40, perKgRate: 0 },
          { minWeight: 1, maxWeight: 5, basePrice: 40, perKgRate: 15 },
        ],
      };

      const result = createRateCardSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects effectiveTo before effectiveFrom", () => {
      const invalid = {
        name: "Invalid Date Card",
        customerType: CustomerType.B2C,
        routeType: RouteType.INTRA_ZONE,
        effectiveFrom: new Date("2026-06-01"),
        effectiveTo: new Date("2026-01-01"), // Before from
        weightSlabs: [{ minWeight: 0, maxWeight: 1, basePrice: 40, perKgRate: 0 }],
      };

      const result = createRateCardSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects empty weight slabs array", () => {
      const invalid = {
        name: "No Slabs Card",
        customerType: CustomerType.B2C,
        routeType: RouteType.INTRA_ZONE,
        effectiveFrom: new Date("2026-01-01"),
        weightSlabs: [],
      };

      const result = createRateCardSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
