import { describe, it, expect } from "vitest";
import { createServiceAreaSchema, updateServiceAreaSchema } from "@/schemas/service-area.schema";

describe("ServiceArea Schemas", () => {
  const validZoneId = "11111111-1111-1111-1111-111111111111";

  it("validates valid service area payload", () => {
    const valid = {
      name: "Indiranagar",
      pinCode: "560038",
      locality: "East",
      city: "Bangalore",
      state: "Karnataka",
      zoneId: validZoneId,
      isActive: true,
    };

    const result = createServiceAreaSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects non-6-digit PIN codes", () => {
    const invalidPin = {
      name: "Indiranagar",
      pinCode: "56003", // 5 digits
      zoneId: validZoneId,
    };

    const result = createServiceAreaSchema.safeParse(invalidPin);
    expect(result.success).toBe(false);
  });

  it("rejects invalid zoneId UUID", () => {
    const invalidZone = {
      name: "Indiranagar",
      pinCode: "560038",
      zoneId: "not-a-uuid",
    };

    const result = createServiceAreaSchema.safeParse(invalidZone);
    expect(result.success).toBe(false);
  });
});
