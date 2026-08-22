import { describe, it, expect } from "vitest";
import { createOrderSchema, adminCreateOrderSchema } from "@/schemas/order.schema";
import { PaymentType } from "@/types/enums";

describe("Order Schema Validation", () => {
  const validOrderPayload = {
    pickupAddress: "Flat 402, Sunshine Apartments, Connaught Place",
    pickupPinCode: "110001",
    dropAddress: "Flat 101, Indiranagar",
    dropPinCode: "560038",
    packageLength: 20,
    packageBreadth: 15,
    packageHeight: 10,
    actualWeight: 1.2,
    paymentType: PaymentType.COD,
  };

  it("validates a standard customer order request", () => {
    const result = createOrderSchema.safeParse(validOrderPayload);
    expect(result.success).toBe(true);
  });

  it("rejects non-6-digit PIN codes", () => {
    const result = createOrderSchema.safeParse({
      ...validOrderPayload,
      pickupPinCode: "11000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive dimensions and weights", () => {
    expect(
      createOrderSchema.safeParse({ ...validOrderPayload, packageLength: 0 }).success
    ).toBe(false);

    expect(
      createOrderSchema.safeParse({ ...validOrderPayload, actualWeight: -1 }).success
    ).toBe(false);
  });

  it("validates admin create order payload requiring customerId", () => {
    const adminPayload = {
      ...validOrderPayload,
      customerId: "11111111-1111-1111-1111-111111111111",
    };
    const result = adminCreateOrderSchema.safeParse(adminPayload);
    expect(result.success).toBe(true);
  });

  it("rejects admin create order payload missing customerId", () => {
    const result = adminCreateOrderSchema.safeParse(validOrderPayload);
    expect(result.success).toBe(false);
  });
});
