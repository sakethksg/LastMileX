import { describe, it, expect } from "vitest";
import {
  failDeliverySchema,
  completeDeliverySchema,
  rescheduleOrderSchema,
} from "@/schemas/delivery-execution.schema";

describe("Delivery Execution Schemas", () => {
  describe("failDeliverySchema", () => {
    it("validates failure reason and optional notes", () => {
      const payload = {
        failureReason: "CUSTOMER_UNAVAILABLE",
        notes: "Door was locked, no response to phone calls",
      };

      const result = failDeliverySchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects empty failure reason", () => {
      const result = failDeliverySchema.safeParse({ failureReason: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("completeDeliverySchema", () => {
    it("validates complete delivery payload", () => {
      expect(completeDeliverySchema.safeParse({ notes: "Handed to recipient" }).success).toBe(true);
      expect(completeDeliverySchema.safeParse({}).success).toBe(true);
    });
  });

  describe("rescheduleOrderSchema", () => {
    it("validates scheduledDeliveryDate and notes", () => {
      const payload = {
        scheduledDeliveryDate: "2026-08-25T10:00:00.000Z",
        notes: "Please deliver in the morning",
      };

      const result = rescheduleOrderSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });
});
