import { describe, it, expect } from "vitest";
import {
  hasRole,
  hasAnyRole,
  isAdmin,
  isCustomer,
  isDeliveryAgent,
  canAccessOrder,
} from "@/lib/auth/rbac";
import { assertOrderOwnership } from "@/lib/auth/server-auth";
import { UserRole } from "@/types/enums";
import { AuthUserContext } from "@/types/domain";
import { ForbiddenError } from "@/lib/errors/app-error";

describe("RBAC & Role Authorization Utilities", () => {
  const adminUser: AuthUserContext = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "admin@lastmilex.com",
    name: "Admin User",
    role: UserRole.ADMIN,
    isActive: true,
  };

  const customerUser: AuthUserContext = {
    id: "22222222-2222-2222-2222-222222222222",
    email: "customer@example.com",
    name: "Customer User",
    role: UserRole.CUSTOMER,
    isActive: true,
  };

  const agentUser: AuthUserContext = {
    id: "33333333-3333-3333-3333-333333333333",
    email: "agent@lastmilex.com",
    name: "Agent User",
    role: UserRole.DELIVERY_AGENT,
    isActive: true,
  };

  const inactiveUser: AuthUserContext = {
    id: "44444444-4444-4444-4444-444444444444",
    email: "inactive@example.com",
    name: "Inactive User",
    role: UserRole.CUSTOMER,
    isActive: false,
  };

  describe("Role Verification", () => {
    it("correctly identifies ADMIN role", () => {
      expect(isAdmin(adminUser)).toBe(true);
      expect(isAdmin(customerUser)).toBe(false);
      expect(isAdmin(agentUser)).toBe(false);
      expect(hasRole(adminUser, UserRole.ADMIN)).toBe(true);
    });

    it("correctly identifies CUSTOMER role", () => {
      expect(isCustomer(customerUser)).toBe(true);
      expect(isCustomer(adminUser)).toBe(false);
      expect(isCustomer(agentUser)).toBe(false);
    });

    it("correctly identifies DELIVERY_AGENT role", () => {
      expect(isDeliveryAgent(agentUser)).toBe(true);
      expect(isDeliveryAgent(customerUser)).toBe(false);
      expect(isDeliveryAgent(adminUser)).toBe(false);
    });

    it("handles unauthenticated and null users", () => {
      expect(hasRole(null, UserRole.CUSTOMER)).toBe(false);
      expect(hasRole(undefined, UserRole.ADMIN)).toBe(false);
      expect(hasAnyRole(null, [UserRole.ADMIN, UserRole.CUSTOMER])).toBe(false);
      expect(isAdmin(null)).toBe(false);
    });

    it("rejects inactive users even if role matches", () => {
      expect(hasRole(inactiveUser, UserRole.CUSTOMER)).toBe(false);
      expect(hasAnyRole(inactiveUser, [UserRole.CUSTOMER])).toBe(false);
      expect(isCustomer(inactiveUser)).toBe(false);
    });

    it("evaluates hasAnyRole across multiple roles", () => {
      expect(hasAnyRole(agentUser, [UserRole.ADMIN, UserRole.DELIVERY_AGENT])).toBe(true);
      expect(hasAnyRole(customerUser, [UserRole.ADMIN, UserRole.DELIVERY_AGENT])).toBe(false);
      expect(hasAnyRole(adminUser, [UserRole.ADMIN, UserRole.CUSTOMER])).toBe(true);
    });
  });

  describe("Resource & Order Ownership Verification", () => {
    const sampleOrder = {
      id: "ord-123",
      customerId: "22222222-2222-2222-2222-222222222222",
      assignedAgentId: "33333333-3333-3333-3333-333333333333",
    };

    it("allows ADMIN to access any order", () => {
      expect(canAccessOrder(adminUser, sampleOrder)).toBe(true);
    });

    it("allows CUSTOMER to access their own order", () => {
      expect(canAccessOrder(customerUser, sampleOrder)).toBe(true);
    });

    it("rejects CUSTOMER from accessing another customer's order", () => {
      const otherCustomer: AuthUserContext = {
        ...customerUser,
        id: "99999999-9999-9999-9999-999999999999",
      };
      expect(canAccessOrder(otherCustomer, sampleOrder)).toBe(false);
    });

    it("allows DELIVERY_AGENT to access assigned order", () => {
      expect(canAccessOrder(agentUser, sampleOrder)).toBe(true);
    });

    it("rejects DELIVERY_AGENT from accessing unrelated order", () => {
      const otherAgent: AuthUserContext = {
        ...agentUser,
        id: "88888888-8888-8888-8888-888888888888",
      };
      expect(canAccessOrder(otherAgent, sampleOrder)).toBe(false);
    });

    it("assertOrderOwnership succeeds for owner and throws ForbiddenError for others", async () => {
      await expect(
        assertOrderOwnership(sampleOrder.customerId, customerUser)
      ).resolves.toBeUndefined();

      await expect(
        assertOrderOwnership(sampleOrder.customerId, adminUser)
      ).resolves.toBeUndefined();

      const otherUser: AuthUserContext = {
        ...customerUser,
        id: "77777777-7777-7777-7777-777777777777",
      };

      await expect(
        assertOrderOwnership(sampleOrder.customerId, otherUser)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
