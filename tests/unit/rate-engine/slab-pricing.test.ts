import { describe, it, expect } from "vitest";
import {
  findMatchingWeightSlab,
  calculateSlabDeliveryCharge,
  WeightSlabDefinition,
} from "@/lib/rate-engine/slab-pricing";

describe("Weight Slab Matching & Pricing", () => {
  const sampleSlabs: WeightSlabDefinition[] = [
    { id: "slab-1", minWeight: 0.0, maxWeight: 1.0, basePrice: 50.0, perKgRate: 0.0 },
    { id: "slab-2", minWeight: 1.0, maxWeight: 5.0, basePrice: 50.0, perKgRate: 15.0 },
    { id: "slab-3", minWeight: 5.0, maxWeight: 20.0, basePrice: 110.0, perKgRate: 12.0 },
  ];

  describe("findMatchingWeightSlab", () => {
    it("matches Slab 1 for weight within [0, 1.0]", () => {
      const slab05 = findMatchingWeightSlab(sampleSlabs, 0.5);
      expect(slab05?.id).toBe("slab-1");

      const slab10 = findMatchingWeightSlab(sampleSlabs, 1.0);
      expect(slab10?.id).toBe("slab-1");
    });

    it("matches Slab 2 for weight within (1.0, 5.0]", () => {
      const slab15 = findMatchingWeightSlab(sampleSlabs, 1.5);
      expect(slab15?.id).toBe("slab-2");

      const slab50 = findMatchingWeightSlab(sampleSlabs, 5.0);
      expect(slab50?.id).toBe("slab-2");
    });

    it("matches Slab 3 for weight within (5.0, 20.0]", () => {
      const slab55 = findMatchingWeightSlab(sampleSlabs, 5.5);
      expect(slab55?.id).toBe("slab-3");

      const slab20 = findMatchingWeightSlab(sampleSlabs, 20.0);
      expect(slab20?.id).toBe("slab-3");
    });

    it("returns null when weight exceeds maximum slab coverage", () => {
      const slab25 = findMatchingWeightSlab(sampleSlabs, 25.0);
      expect(slab25).toBeNull();
    });
  });

  describe("calculateSlabDeliveryCharge - Boundary Calculations", () => {
    // 1. Weight = 0.5 kg -> ₹50.00
    it("calculates ₹50.00 for weight = 0.5 kg in Slab 1", () => {
      const slab = sampleSlabs[0];
      expect(calculateSlabDeliveryCharge(slab, 0.5)).toBe(50.0);
    });

    // 2. Weight = 1.0 kg (Exact boundary of Slab 1) -> ₹50.00
    it("calculates ₹50.00 for weight = 1.0 kg at Slab 1 upper boundary", () => {
      const slab = sampleSlabs[0];
      expect(calculateSlabDeliveryCharge(slab, 1.0)).toBe(50.0);
    });

    // 3. Weight = 1.5 kg (Enters Slab 2) -> ₹50 + (0.5 * 15) = ₹57.50
    it("calculates ₹57.50 for weight = 1.5 kg entering Slab 2", () => {
      const slab = sampleSlabs[1];
      expect(calculateSlabDeliveryCharge(slab, 1.5)).toBe(57.5);
    });

    // 4. Weight = 5.0 kg (Upper boundary of Slab 2) -> ₹50 + (4.0 * 15) = ₹110.00
    it("calculates ₹110.00 for weight = 5.0 kg at Slab 2 upper boundary", () => {
      const slab = sampleSlabs[1];
      expect(calculateSlabDeliveryCharge(slab, 5.0)).toBe(110.0);
    });

    // 5. Weight = 5.5 kg (Enters Slab 3) -> ₹110 + (0.5 * 12) = ₹116.00
    it("calculates ₹116.00 for weight = 5.5 kg entering Slab 3", () => {
      const slab = sampleSlabs[2];
      expect(calculateSlabDeliveryCharge(slab, 5.5)).toBe(116.0);
    });
  });
});
