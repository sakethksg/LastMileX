import { describe, it, expect } from "vitest";
import {
  agentQuerySchema,
  updateAgentProfileSchema,
} from "@/schemas/delivery-agent.schema";
import { AgentAvailability } from "@/types/enums";

describe("Delivery Agent Schema Validation", () => {
  describe("agentQuerySchema", () => {
    it("parses query parameters with correct transformations", () => {
      const query = {
        availability: AgentAvailability.AVAILABLE,
        isActive: "true",
        page: "2",
        limit: "10",
        search: "smith",
      };

      const result = agentQuerySchema.parse(query);
      expect(result.isActive).toBe(true);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.availability).toBe(AgentAvailability.AVAILABLE);
    });
  });

  describe("updateAgentProfileSchema", () => {
    it("validates valid agent profile update", () => {
      const payload = {
        availability: AgentAvailability.AVAILABLE,
        vehicleType: "BIKE",
        vehicleNumber: "DL-01-AB-1234",
        maxConcurrentOrders: 4,
      };

      const result = updateAgentProfileSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects maxConcurrentOrders less than 1", () => {
      const payload = {
        maxConcurrentOrders: 0,
      };

      const result = updateAgentProfileSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
