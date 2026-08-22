import { describe, it, expect } from "vitest";
import { calculateCodSurchargeAmount } from "@/lib/rate-engine/cod-pricing";
import { PaymentType, SurchargeType } from "@/types/enums";

describe("COD Surcharge Pricing", () => {
  it("returns zero surcharge when payment type is PREPAID", () => {
    const rule = {
      id: "cod-flat",
      surchargeType: SurchargeType.FLAT,
      surchargeValue: 50,
    };

    expect(calculateCodSurchargeAmount(PaymentType.PREPAID, 200, rule)).toBe(0);
  });

  it("calculates flat COD surcharge accurately", () => {
    const rule = {
      id: "cod-flat",
      surchargeType: SurchargeType.FLAT,
      surchargeValue: 40,
    };

    expect(calculateCodSurchargeAmount(PaymentType.COD, 200, rule)).toBe(40);
  });

  it("calculates percentage COD surcharge within boundaries", () => {
    const rule = {
      id: "cod-pct",
      surchargeType: SurchargeType.PERCENTAGE,
      surchargeValue: 2.5, // 2.5% of 1000 = 25
      minSurcharge: 10,
      maxSurcharge: 100,
    };

    expect(calculateCodSurchargeAmount(PaymentType.COD, 1000, rule)).toBe(25);
  });

  it("enforces minimum COD surcharge cap", () => {
    const rule = {
      id: "cod-pct",
      surchargeType: SurchargeType.PERCENTAGE,
      surchargeValue: 2.0, // 2% of 100 = 2
      minSurcharge: 30, // Min cap
      maxSurcharge: 100,
    };

    expect(calculateCodSurchargeAmount(PaymentType.COD, 100, rule)).toBe(30);
  });

  it("enforces maximum COD surcharge cap", () => {
    const rule = {
      id: "cod-pct",
      surchargeType: SurchargeType.PERCENTAGE,
      surchargeValue: 5.0, // 5% of 5000 = 250
      minSurcharge: 20,
      maxSurcharge: 150, // Max cap
    };

    expect(calculateCodSurchargeAmount(PaymentType.COD, 5000, rule)).toBe(150);
  });
});
