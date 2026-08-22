import { describe, it, expect } from "vitest";
import { calculateChargeableWeight } from "@/lib/rate-engine/chargeable-weight";

describe("Chargeable Weight Calculation", () => {
  it("chooses actual weight when actual weight exceeds volumetric weight", () => {
    // Actual: 3.2 kg, Volumetric: 1.5 kg -> Max: 3.2 kg -> Ceil 0.5 step: 3.5 kg
    expect(calculateChargeableWeight(3.2, 1.5)).toBe(3.5);
  });

  it("chooses volumetric weight when volumetric weight exceeds actual weight", () => {
    // Actual: 1.0 kg, Volumetric: 2.1 kg -> Max: 2.1 kg -> Ceil 0.5 step: 2.5 kg
    expect(calculateChargeableWeight(1.0, 2.1)).toBe(2.5);
  });

  it("preserves exact multiples of 0.5 kg without unnecessary upward rounding", () => {
    // Exact 2.0 kg -> 2.0 kg
    expect(calculateChargeableWeight(2.0, 1.5)).toBe(2.0);
    // Exact 3.5 kg -> 3.5 kg
    expect(calculateChargeableWeight(1.2, 3.5)).toBe(3.5);
  });

  it("throws error for non-positive weights", () => {
    expect(() => calculateChargeableWeight(0, 2.0)).toThrow();
    expect(() => calculateChargeableWeight(-1, 2.0)).toThrow();
    expect(() => calculateChargeableWeight(2.0, 0)).toThrow();
  });
});
