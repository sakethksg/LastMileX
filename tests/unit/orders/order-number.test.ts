import { describe, it, expect } from "vitest";
import { generateOrderNumber } from "@/lib/orders/order-number";

describe("Order Number Generator", () => {
  it("generates order numbers in the standard LMX-YYYYMMDD-XXXXXX format", () => {
    const fixedDate = new Date("2026-08-22T12:00:00Z");
    const orderNumber = generateOrderNumber(fixedDate);

    expect(orderNumber).toMatch(/^LMX-20260822-[A-F0-9]{6}$/);
  });

  it("generates distinct order numbers across successive calls", () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) {
      set.add(generateOrderNumber());
    }
    expect(set.size).toBe(50);
  });
});
