import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  UserRole,
  CustomerType,
  AgentAvailability,
  RouteType,
  SurchargeType,
  OrderStatus,
  AssignmentType,
  AssignmentStatus,
  AttemptStatus,
  NotificationType,
  NotificationEventType,
  NotificationStatus,
} from "@/types/enums";

describe("Database Schema & Model Integrity Verification", () => {
  it("exposes all 14 Prisma model delegates", () => {
    expect(prisma.user).toBeDefined();
    expect(prisma.customerProfile).toBeDefined();
    expect(prisma.deliveryAgentProfile).toBeDefined();
    expect(prisma.zone).toBeDefined();
    expect(prisma.serviceArea).toBeDefined();
    expect(prisma.rateCard).toBeDefined();
    expect(prisma.weightSlab).toBeDefined();
    expect(prisma.codSurcharge).toBeDefined();
    expect(prisma.order).toBeDefined();
    expect(prisma.orderPricingSnapshot).toBeDefined();
    expect(prisma.agentAssignment).toBeDefined();
    expect(prisma.deliveryAttempt).toBeDefined();
    expect(prisma.orderTrackingEvent).toBeDefined();
    expect(prisma.notification).toBeDefined();
  });

  it("verifies all domain enums are properly defined and mapped", () => {
    // User Roles
    expect(Object.values(UserRole)).toEqual(["CUSTOMER", "DELIVERY_AGENT", "ADMIN"]);
    
    // Customer Types
    expect(Object.values(CustomerType)).toEqual(["B2B", "B2C"]);

    // Agent Availability
    expect(Object.values(AgentAvailability)).toEqual(["AVAILABLE", "BUSY", "OFFLINE"]);

    // Route Types
    expect(Object.values(RouteType)).toEqual(["INTRA_ZONE", "INTER_ZONE"]);

    // Surcharge Types
    expect(Object.values(SurchargeType)).toEqual(["FLAT", "PERCENTAGE"]);

    // Order Lifecycle States (10 states)
    expect(Object.values(OrderStatus)).toEqual([
      "CREATED",
      "CONFIRMED",
      "ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "FAILED",
      "CANCELLED",
      "RESCHEDULED",
    ]);

    // Assignment & Attempt States
    expect(Object.values(AssignmentType)).toEqual(["MANUAL", "AUTO"]);
    expect(Object.values(AssignmentStatus)).toEqual(["ACTIVE", "COMPLETED", "REASSIGNED", "CANCELLED"]);
    expect(Object.values(AttemptStatus)).toEqual(["PENDING", "IN_PROGRESS", "DELIVERED", "FAILED", "CANCELLED"]);

    // Notifications
    expect(Object.values(NotificationType)).toEqual(["EMAIL", "SMS"]);
    expect(Object.values(NotificationStatus)).toEqual(["PENDING", "SENT", "FAILED", "RETRYING"]);
  });
});
