import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertValidTransition,
  ALLOWED_TRANSITIONS,
} from "@/lib/orders/order-state-machine";
import { OrderStatus, UserRole } from "@/types/enums";
import { ValidationError } from "@/lib/errors/app-error";

describe("Order State Machine", () => {
  describe("canTransition", () => {
    it("allows valid forward transitions in the standard delivery lifecycle", () => {
      expect(canTransition(OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(true);
      expect(canTransition(OrderStatus.CONFIRMED, OrderStatus.ASSIGNED)).toBe(true);
      expect(canTransition(OrderStatus.ASSIGNED, OrderStatus.PICKED_UP)).toBe(true);
      expect(canTransition(OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT)).toBe(true);
      expect(canTransition(OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY)).toBe(true);
      expect(canTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED)).toBe(true);
      expect(canTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED)).toBe(true);
      expect(canTransition(OrderStatus.FAILED, OrderStatus.RESCHEDULED)).toBe(true);
      expect(canTransition(OrderStatus.RESCHEDULED, OrderStatus.ASSIGNED)).toBe(true);
    });

    it("allows cancellation from CREATED, CONFIRMED, FAILED, and RESCHEDULED", () => {
      expect(canTransition(OrderStatus.CREATED, OrderStatus.CANCELLED)).toBe(true);
      expect(canTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED)).toBe(true);
      expect(canTransition(OrderStatus.FAILED, OrderStatus.CANCELLED)).toBe(true);
      expect(canTransition(OrderStatus.RESCHEDULED, OrderStatus.CANCELLED)).toBe(true);
    });

    it("rejects invalid backward transitions or invalid jumps", () => {
      expect(canTransition(OrderStatus.PICKED_UP, OrderStatus.CREATED)).toBe(false);
      expect(canTransition(OrderStatus.CREATED, OrderStatus.DELIVERED)).toBe(false);
      expect(canTransition(OrderStatus.CONFIRMED, OrderStatus.DELIVERED)).toBe(false);
    });

    it("rejects transitions out of terminal states (DELIVERED, CANCELLED)", () => {
      expect(canTransition(OrderStatus.DELIVERED, OrderStatus.CONFIRMED)).toBe(false);
      expect(canTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED)).toBe(false);
      expect(canTransition(OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY, UserRole.ADMIN)).toBe(false);

      expect(canTransition(OrderStatus.CANCELLED, OrderStatus.CREATED)).toBe(false);
      expect(canTransition(OrderStatus.CANCELLED, OrderStatus.CONFIRMED, UserRole.ADMIN)).toBe(false);
    });

    it("allows ADMIN override cancellation on active non-delivered orders", () => {
      expect(canTransition(OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED, UserRole.ADMIN)).toBe(true);
      expect(canTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED, UserRole.ADMIN)).toBe(true);
      expect(canTransition(OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED, UserRole.CUSTOMER)).toBe(false);
    });
  });

  describe("assertValidTransition", () => {
    it("does not throw for allowed transitions", () => {
      expect(() =>
        assertValidTransition(OrderStatus.CREATED, OrderStatus.CONFIRMED)
      ).not.toThrow();
    });

    it("throws ValidationError for illegal transitions", () => {
      expect(() =>
        assertValidTransition(OrderStatus.DELIVERED, OrderStatus.CREATED)
      ).toThrow(ValidationError);

      expect(() =>
        assertValidTransition(OrderStatus.CREATED, OrderStatus.DELIVERED)
      ).toThrow(ValidationError);
    });
  });
});
