import { describe, it, expect } from "vitest";
import { UserRole, OrderStatus } from "@/types/enums";

describe("Frontend Role-Based Routing & Delivery Action Logic", () => {
  describe("Role-to-Dashboard Path Resolution", () => {
    const resolveDashboardPath = (role?: UserRole) => {
      switch (role) {
        case UserRole.ADMIN:
          return "/admin/dashboard";
        case UserRole.DELIVERY_AGENT:
          return "/agent/dashboard";
        case UserRole.CUSTOMER:
          return "/dashboard";
        default:
          return "/login";
      }
    };

    it("resolves ADMIN to /admin/dashboard", () => {
      expect(resolveDashboardPath(UserRole.ADMIN)).toBe("/admin/dashboard");
    });

    it("resolves DELIVERY_AGENT to /agent/dashboard", () => {
      expect(resolveDashboardPath(UserRole.DELIVERY_AGENT)).toBe("/agent/dashboard");
    });

    it("resolves CUSTOMER to /dashboard", () => {
      expect(resolveDashboardPath(UserRole.CUSTOMER)).toBe("/dashboard");
    });

    it("resolves unauthenticated to /login", () => {
      expect(resolveDashboardPath(undefined)).toBe("/login");
    });
  });

  describe("Delivery Agent Action Bar State Visibility", () => {
    const getAvailableAgentActions = (status: OrderStatus) => {
      switch (status) {
        case OrderStatus.ASSIGNED:
          return ["PICKUP"];
        case OrderStatus.PICKED_UP:
          return ["START_DELIVERY"];
        case OrderStatus.IN_TRANSIT:
          return ["OUT_FOR_DELIVERY"];
        case OrderStatus.OUT_FOR_DELIVERY:
          return ["COMPLETE_DELIVERY", "REPORT_FAILURE"];
        case OrderStatus.DELIVERED:
        case OrderStatus.FAILED:
        case OrderStatus.CANCELLED:
        default:
          return [];
      }
    };

    it("exposes only PICKUP for ASSIGNED orders", () => {
      expect(getAvailableAgentActions(OrderStatus.ASSIGNED)).toEqual(["PICKUP"]);
    });

    it("exposes only START_DELIVERY for PICKED_UP orders", () => {
      expect(getAvailableAgentActions(OrderStatus.PICKED_UP)).toEqual(["START_DELIVERY"]);
    });

    it("exposes only OUT_FOR_DELIVERY for IN_TRANSIT orders", () => {
      expect(getAvailableAgentActions(OrderStatus.IN_TRANSIT)).toEqual(["OUT_FOR_DELIVERY"]);
    });

    it("exposes COMPLETE_DELIVERY and REPORT_FAILURE for OUT_FOR_DELIVERY orders", () => {
      expect(getAvailableAgentActions(OrderStatus.OUT_FOR_DELIVERY)).toEqual([
        "COMPLETE_DELIVERY",
        "REPORT_FAILURE",
      ]);
    });

    it("exposes no actions for terminal DELIVERED, FAILED, or CANCELLED orders", () => {
      expect(getAvailableAgentActions(OrderStatus.DELIVERED)).toEqual([]);
      expect(getAvailableAgentActions(OrderStatus.FAILED)).toEqual([]);
      expect(getAvailableAgentActions(OrderStatus.CANCELLED)).toEqual([]);
    });
  });
});
