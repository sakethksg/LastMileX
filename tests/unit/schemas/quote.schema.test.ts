import { describe, it, expect } from "vitest";
import { calculateQuoteSchema } from "@/schemas/quote.schema";
import { CustomerType, PaymentType } from "@/types/enums";

describe("Quote Schema Validation", () => {
  const validPayload = {
    pickupAddress: "Connaught Place, Central Delhi",
    pickupPinCode: "110001",
    dropAddress: "Indiranagar, East Bangalore",
    dropPinCode: "560038",
    packageLength: 20,
    packageBreadth: 15,
    packageHeight: 10,
    actualWeight: 2.5,
    customerType: CustomerType.B2C,
    paymentType: PaymentType.COD,
  };

  it("validates a complete valid quote request", () => {
    const result = calculateQuoteSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects non-6-digit pickup or drop PIN codes", () => {
    expect(
      calculateQuoteSchema.safeParse({ ...validPayload, pickupPinCode: "11000" }).success
    ).toBe(false);

    expect(
      calculateQuoteSchema.safeParse({ ...validPayload, dropPinCode: "5600389" }).success
    ).toBe(false);
  });

  it("rejects zero or negative dimensions and weights", () => {
    expect(
      calculateQuoteSchema.safeParse({ ...validPayload, packageLength: 0 }).success
    ).toBe(false);

    expect(
      calculateQuoteSchema.safeParse({ ...validPayload, actualWeight: -1 }).success
    ).toBe(false);
  });

  it("rejects dimensions exceeding maximum limits (> 300 cm)", () => {
    expect(
      calculateQuoteSchema.safeParse({ ...validPayload, packageHeight: 350 }).success
    ).toBe(false);
  });
});
