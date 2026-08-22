import { describe, it, expect } from "vitest";
import { manualAssignSchema, autoAssignSchema } from "@/schemas/assignment.schema";

describe("Assignment Schema Validation", () => {
  describe("manualAssignSchema", () => {
    it("validates manual assignment payload with UUID agentId", () => {
      const payload = {
        agentId: "11111111-1111-1111-1111-111111111111",
        notes: "Priority dispatch",
      };

      const result = manualAssignSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID agentId", () => {
      const result = manualAssignSchema.safeParse({ agentId: "invalid-uuid" });
      expect(result.success).toBe(false);
    });
  });

  describe("autoAssignSchema", () => {
    it("validates optional notes in auto assignment", () => {
      expect(autoAssignSchema.safeParse({ notes: "Auto dispatch" }).success).toBe(true);
      expect(autoAssignSchema.safeParse({}).success).toBe(true);
    });
  });
});
