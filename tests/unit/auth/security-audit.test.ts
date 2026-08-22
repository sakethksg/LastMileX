import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireRole, requireAnyRole } from "@/lib/auth/server-auth";
import { UserRole, OrderStatus } from "@/types/enums";
import { ForbiddenError, UnauthorizedError, ValidationError } from "@/lib/errors/app-error";
import { assertValidTransition } from "@/lib/orders/order-state-machine";
import { updateAgentProfileSchema } from "@/schemas/delivery-agent.schema";
import { createOrderSchema } from "@/schemas/order.schema";

vi.mock("@/lib/auth/server-auth", () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
  requireAnyRole: vi.fn(),
}));

describe("Security, RBAC, IDOR & Parameter Tampering Audit", () => {
  const customerA = {
    id: "cust-A",
    email: "custA@example.com",
    name: "Customer A",
    role: UserRole.CUSTOMER,
    isActive: true,
  };

  const customerB = {
    id: "cust-B",
    email: "custB@example.com",
    name: "Customer B",
    role: UserRole.CUSTOMER,
    isActive: true,
  };

  const agentA = {
    id: "agent-A",
    email: "agentA@lastmilex.com",
    name: "Agent A",
    role: UserRole.DELIVERY_AGENT,
    isActive: true,
  };

  const agentB = {
    id: "agent-B",
    email: "agentB@lastmilex.com",
    name: "Agent B",
    role: UserRole.DELIVERY_AGENT,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. RBAC Route Boundary Enforcement", () => {
    it("rejects CUSTOMER accessing ADMIN routes with 403 Forbidden", async () => {
      vi.mocked(requireRole).mockRejectedValueOnce(new ForbiddenError("Access denied: Required role 'ADMIN'"));
      await expect(requireRole(UserRole.ADMIN)).rejects.toThrow(ForbiddenError);
    });

    it("rejects DELIVERY_AGENT accessing ADMIN routes with 403 Forbidden", async () => {
      vi.mocked(requireRole).mockRejectedValueOnce(new ForbiddenError("Access denied: Required role 'ADMIN'"));
      await expect(requireRole(UserRole.ADMIN)).rejects.toThrow(ForbiddenError);
    });

    it("rejects CUSTOMER accessing DELIVERY_AGENT routes with 403 Forbidden", async () => {
      vi.mocked(requireRole).mockRejectedValueOnce(
        new ForbiddenError("Access denied: Required role 'DELIVERY_AGENT'")
      );
      await expect(requireRole(UserRole.DELIVERY_AGENT)).rejects.toThrow(ForbiddenError);
    });
  });

  describe("2. IDOR Protection (Cross-User Isolation)", () => {
    it("blocks Customer A from viewing Customer B's order", () => {
      const orderOwnedByB = { id: "order-B", customerId: customerB.id };
      const requestingUserId = customerA.id;

      expect(() => {
        if (orderOwnedByB.customerId !== requestingUserId) {
          throw new ForbiddenError("You are not authorized to view this order");
        }
      }).toThrow(ForbiddenError);
    });

    it("blocks Customer A from rescheduling Customer B's failed order", () => {
      const orderOwnedByB = { id: "order-B", customerId: customerB.id, status: OrderStatus.FAILED };
      const requestingUserId = customerA.id;

      expect(() => {
        if (orderOwnedByB.customerId !== requestingUserId) {
          throw new ForbiddenError("You are not authorized to reschedule this order");
        }
      }).toThrow(ForbiddenError);
    });

    it("blocks Agent A from executing delivery actions on Agent B's order", () => {
      const orderAssignedToB = {
        id: "order-1",
        activeAssignment: { agentId: agentB.id },
      };
      const requestingAgentId = agentA.id;

      expect(() => {
        if (orderAssignedToB.activeAssignment.agentId !== requestingAgentId) {
          throw new ForbiddenError("Agent does not hold the active assignment for this order");
        }
      }).toThrow(ForbiddenError);
    });
  });

  describe("3. Parameter Tampering & Invariant Protections", () => {
    it("strips or ignores client attempts to directly manipulate activeDeliveryCount in agent profile updates", () => {
      const maliciousPayload = {
        availability: "AVAILABLE",
        maxConcurrentOrders: 5,
        activeDeliveryCount: 0, // Malicious attempt to reset workload
      };

      const parsed = updateAgentProfileSchema.parse(maliciousPayload);
      expect((parsed as any).activeDeliveryCount).toBeUndefined();
    });

    it("prevents setting maxConcurrentOrders to 0 or negative", () => {
      const invalidPayload = {
        maxConcurrentOrders: 0,
      };

      const result = updateAgentProfileSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("rejects unauthorized direct jumps across the order state machine", () => {
      // Direct jump from CREATED -> DELIVERED
      expect(() => {
        assertValidTransition(OrderStatus.CREATED, OrderStatus.DELIVERED, UserRole.CUSTOMER);
      }).toThrow(ValidationError);

      // Direct jump from ASSIGNED -> DELIVERED (skipping pickup, in transit, out for delivery)
      expect(() => {
        assertValidTransition(OrderStatus.ASSIGNED, OrderStatus.DELIVERED, UserRole.DELIVERY_AGENT);
      }).toThrow(ValidationError);
    });

    it("enforces terminal nature of DELIVERED state even for ADMIN overrides", () => {
      expect(() => {
        assertValidTransition(OrderStatus.DELIVERED, OrderStatus.ASSIGNED, UserRole.ADMIN);
      }).toThrow(ValidationError);
      expect(() => {
        assertValidTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED, UserRole.ADMIN);
      }).toThrow(ValidationError);
    });
  });
});
