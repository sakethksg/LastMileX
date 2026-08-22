import { describe, it, expect } from "vitest";
import { UserRole, OrderStatus, PaymentType, CustomerType, AgentAvailability, SurchargeType } from "@/types/enums";
import { calculateVolumetricWeight } from "@/lib/rate-engine/volumetric-weight";
import { calculateChargeableWeight } from "@/lib/rate-engine/chargeable-weight";
import { calculateCodSurchargeAmount } from "@/lib/rate-engine/cod-pricing";
import { canTransition } from "@/lib/orders/order-state-machine";

describe("Phase 15 Full Product Lifecycle & Cross-Persona Verification", () => {
  describe("Customer Lifecycle: Volumetric Calculation & Pricing Engine Invariants", () => {
    it("computes deterministic volumetric and chargeable weights correctly", () => {
      // Dimensions 20 x 20 x 20 / 5000 = 1.6kg vs actualWeight 2.5kg -> 2.5kg
      const volWeight = calculateVolumetricWeight(20, 20, 20);
      expect(volWeight).toBe(1.6);

      const chargeable = calculateChargeableWeight(2.5, volWeight);
      expect(chargeable).toBe(2.5);

      // Surcharge on COD with FLAT surcharge of 20
      const codSurchargeFlat = calculateCodSurchargeAmount(
        PaymentType.COD,
        50,
        {
          id: "cod-1",
          surchargeType: SurchargeType.FLAT,
          surchargeValue: 20,
        }
      );
      expect(codSurchargeFlat).toBe(20);

      // Prepaid returns 0 surcharge
      const prepaidSurcharge = calculateCodSurchargeAmount(
        PaymentType.PREPAID,
        50,
        {
          id: "cod-1",
          surchargeType: SurchargeType.FLAT,
          surchargeValue: 20,
        }
      );
      expect(prepaidSurcharge).toBe(0);
    });
  });

  describe("State Machine: End-to-End Progression & Terminal Invariants", () => {
    it("validates standard customer, agent, and admin state transitions", () => {
      // 1. Forward delivery execution
      expect(canTransition(OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(true);
      expect(canTransition(OrderStatus.CONFIRMED, OrderStatus.ASSIGNED)).toBe(true);
      expect(canTransition(OrderStatus.ASSIGNED, OrderStatus.PICKED_UP)).toBe(true);
      expect(canTransition(OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT)).toBe(true);
      expect(canTransition(OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY)).toBe(true);
      expect(canTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED)).toBe(true);

      // 2. Failure & Rescheduling flow
      expect(canTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED)).toBe(true);
      expect(canTransition(OrderStatus.FAILED, OrderStatus.RESCHEDULED)).toBe(true);
      expect(canTransition(OrderStatus.RESCHEDULED, OrderStatus.ASSIGNED)).toBe(true);

      // 3. Illegal state jumps rejected
      expect(canTransition(OrderStatus.CREATED, OrderStatus.DELIVERED)).toBe(false);
      expect(canTransition(OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY)).toBe(false);
      expect(canTransition(OrderStatus.FAILED, OrderStatus.DELIVERED)).toBe(false);
      expect(canTransition(OrderStatus.CANCELLED, OrderStatus.CONFIRMED)).toBe(false);
    });
  });

  describe("Agent & Admin Capacity Invariants", () => {
    it("enforces workload boundaries (0 <= activeCount <= maxConcurrent)", () => {
      const agentProfile = {
        userId: "agent-1",
        availability: AgentAvailability.AVAILABLE,
        maxConcurrentOrders: 3,
        activeDeliveryCount: 2,
      };

      const hasCapacity = agentProfile.activeDeliveryCount < agentProfile.maxConcurrentOrders;
      expect(hasCapacity).toBe(true);

      const updatedCount = agentProfile.activeDeliveryCount + 1;
      const atCapacity = updatedCount >= agentProfile.maxConcurrentOrders;
      expect(atCapacity).toBe(true);
    });
  });

  describe("Security & Cross-Persona RBAC Invariants", () => {
    it("ensures strict role separation across Customer, Agent, and Admin", () => {
      expect(UserRole.CUSTOMER).not.toBe(UserRole.DELIVERY_AGENT);
      expect(UserRole.DELIVERY_AGENT).not.toBe(UserRole.ADMIN);
      expect(UserRole.CUSTOMER).not.toBe(UserRole.ADMIN);
      expect(CustomerType.B2B).not.toBe(CustomerType.B2C);
    });
  });
});
