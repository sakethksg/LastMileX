import { describe, it, expect } from "vitest";
import { createZoneSchema, updateZoneSchema } from "@/schemas/zone.schema";

describe("Zone Schemas", () => {
  it("validates valid create zone payload", () => {
    const valid = {
      name: "West Delivery Zone",
      code: "ZONE-WEST",
      description: "Western metro area",
      isActive: true,
    };

    const result = createZoneSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects lowercase/invalid characters in zone code", () => {
    const invalid = {
      name: "West Delivery Zone",
      code: "zone west!", // Lowercase and special characters
    };

    const result = createZoneSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects short zone name", () => {
    const invalid = {
      name: "A",
      code: "ZONE-A",
    };

    const result = createZoneSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("validates partial update payload", () => {
    const valid = {
      description: "Updated description",
      isActive: false,
    };

    const result = updateZoneSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
