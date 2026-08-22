import { describe, it, expect } from "vitest";
import { calculateVolumetricWeight } from "@/lib/rate-engine/volumetric-weight";

describe("Volumetric Weight Calculation", () => {
  it("calculates volumetric weight accurately for standard dimensions", () => {
    // 20 x 20 x 20 cm = 8000 / 5000 = 1.6 kg
    expect(calculateVolumetricWeight(20, 20, 20)).toBe(1.6);
  });

  it("calculates volumetric weight with correct 2-decimal rounding", () => {
    // 15 x 25 x 35 cm = 13125 / 5000 = 2.625 kg -> rounded to 2.63 kg
    expect(calculateVolumetricWeight(15, 25, 35)).toBe(2.63);
  });

  it("throws error for non-positive dimensions", () => {
    expect(() => calculateVolumetricWeight(0, 10, 10)).toThrow();
    expect(() => calculateVolumetricWeight(10, -5, 10)).toThrow();
    expect(() => calculateVolumetricWeight(10, 10, 0)).toThrow();
  });
});
