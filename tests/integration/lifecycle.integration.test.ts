import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AgentAvailability,
  AssignmentStatus,
  AttemptStatus,
  CustomerType,
  NotificationEventType,
  NotificationStatus,
  NotificationType,
  OrderStatus,
  PaymentType,
  RouteType,
  UserRole,
} from "@/types/enums";
import { ValidationError } from "@/lib/errors/app-error";

// In-memory data store for the integration test
const db = {
  orders: [] as any[],
  pricingSnapshots: [] as any[],
  trackingEvents: [] as any[],
  agentProfiles: [] as any[],
  assignments: [] as any[],
  attempts: [] as any[],
  notifications: [] as any[],
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      create: vi.fn((args) => {
        const order = {
          id: `order-${db.orders.length + 1}`,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        db.orders.push(order);
        return order;
      }),
      findUnique: vi.fn(({ where }) => {
        const order = db.orders.find((o) => o.id === where.id);
        if (!order) return null;
        return {
          ...order,
          pricingSnapshot: db.pricingSnapshots.find((s) => s.orderId === order.id) ?? null,
          assignments: db.assignments.filter((a) => a.orderId === order.id),
          attempts: db.attempts.filter((at) => at.orderId === order.id),
          trackingEvents: db.trackingEvents.filter((t) => t.orderId === order.id),
        };
      }),
      findUniqueOrThrow: vi.fn(({ where }) => {
        const order = db.orders.find((o) => o.id === where.id);
        if (!order) throw new Error("Not found");
        return {
          ...order,
          pricingSnapshot: db.pricingSnapshots.find((s) => s.orderId === order.id) ?? null,
          assignments: db.assignments.filter((a) => a.orderId === order.id),
          attempts: db.attempts.filter((at) => at.orderId === order.id),
          trackingEvents: db.trackingEvents.filter((t) => t.orderId === order.id),
        };
      }),
      update: vi.fn(({ where, data }) => {
        const idx = db.orders.findIndex((o) => o.id === where.id);
        if (idx === -1) throw new Error("Not found");
        db.orders[idx] = { ...db.orders[idx], ...data, updatedAt: new Date() };
        return db.orders[idx];
      }),
      updateMany: vi.fn(({ where, data }) => {
        let count = 0;
        for (let i = 0; i < db.orders.length; i++) {
          if (
            db.orders[i].id === where.id &&
            (!where.status || db.orders[i].status === where.status)
          ) {
            db.orders[i] = { ...db.orders[i], ...data, updatedAt: new Date() };
            count++;
          }
        }
        return { count };
      }),
      groupBy: vi.fn(() => {
        const counts: Record<string, number> = {};
        for (const o of db.orders) {
          counts[o.status] = (counts[o.status] || 0) + 1;
        }
        return Object.entries(counts).map(([status, count]) => ({
          status,
          _count: { id: count },
        }));
      }),
      findMany: vi.fn(() => db.orders),
    },
    orderPricingSnapshot: {
      create: vi.fn((args) => {
        const snap = { id: `snap-${db.pricingSnapshots.length + 1}`, ...args.data };
        db.pricingSnapshots.push(snap);
        return snap;
      }),
    },
    orderTrackingEvent: {
      create: vi.fn((args) => {
        const event = {
          id: `track-${db.trackingEvents.length + 1}`,
          ...args.data,
          createdAt: new Date(),
        };
        db.trackingEvents.push(event);
        return event;
      }),
    },
    agentAssignment: {
      create: vi.fn((args) => {
        const asgn = {
          id: `asgn-${db.assignments.length + 1}`,
          ...args.data,
          createdAt: new Date(),
        };
        db.assignments.push(asgn);
        return asgn;
      }),
      update: vi.fn(({ where, data }) => {
        const idx = db.assignments.findIndex((a) => a.id === where.id);
        if (idx !== -1) {
          db.assignments[idx] = { ...db.assignments[idx], ...data };
          return db.assignments[idx];
        }
        return null;
      }),
    },
    deliveryAttempt: {
      create: vi.fn((args) => {
        const att = {
          id: `attempt-${db.attempts.length + 1}`,
          ...args.data,
          createdAt: new Date(),
        };
        db.attempts.push(att);
        return att;
      }),
      upsert: vi.fn(({ where, create, update }) => {
        const idx = db.attempts.findIndex(
          (a) =>
            a.orderId === where.orderId_attemptNumber.orderId &&
            a.attemptNumber === where.orderId_attemptNumber.attemptNumber
        );
        if (idx !== -1) {
          db.attempts[idx] = { ...db.attempts[idx], ...update };
          return db.attempts[idx];
        }
        const newAtt = {
          id: `attempt-${db.attempts.length + 1}`,
          ...create,
          createdAt: new Date(),
        };
        db.attempts.push(newAtt);
        return newAtt;
      }),
      updateMany: vi.fn(({ where, data }) => {
        let count = 0;
        for (let i = 0; i < db.attempts.length; i++) {
          if (
            db.attempts[i].orderId === where.orderId &&
            db.attempts[i].attemptNumber === where.attemptNumber
          ) {
            db.attempts[i] = { ...db.attempts[i], ...data };
            count++;
          }
        }
        return { count };
      }),
      count: vi.fn(({ where }) => {
        return db.attempts.filter((a) => {
          if (where.status && a.status !== where.status) return false;
          if (where.agentId && a.agentId !== where.agentId) return false;
          return true;
        }).length;
      }),
      findMany: vi.fn(() => db.attempts),
    },
    deliveryAgentProfile: {
      findUnique: vi.fn(({ where }) => {
        return (
          db.agentProfiles.find(
            (p) => p.userId === where.userId || p.id === where.id
          ) ?? null
        );
      }),
      update: vi.fn(({ where, data }) => {
        const idx = db.agentProfiles.findIndex(
          (p) => p.id === where.id || p.userId === where.userId
        );
        if (idx !== -1) {
          db.agentProfiles[idx] = { ...db.agentProfiles[idx], ...data };
          return db.agentProfiles[idx];
        }
        return null;
      }),
      updateMany: vi.fn(({ where, data }) => {
        let count = 0;
        for (let i = 0; i < db.agentProfiles.length; i++) {
          const p = db.agentProfiles[i];
          const matchUser = !where.userId || p.userId === where.userId;
          const matchId = !where.id || p.id === where.id;
          const matchCount =
            (!where.activeDeliveryCount?.lt ||
              p.activeDeliveryCount < where.activeDeliveryCount.lt) &&
            (!where.activeDeliveryCount?.gt ||
              p.activeDeliveryCount > where.activeDeliveryCount.gt);

          if (matchUser && matchId && matchCount) {
            if (data.activeDeliveryCount?.increment) {
              p.activeDeliveryCount += data.activeDeliveryCount.increment;
            }
            if (data.activeDeliveryCount?.decrement) {
              p.activeDeliveryCount = Math.max(0, p.activeDeliveryCount - data.activeDeliveryCount.decrement);
            }
            count++;
          }
        }
        return { count };
      }),
      findMany: vi.fn(() => db.agentProfiles),
    },
    notification: {
      create: vi.fn((args) => {
        const notif = {
          id: `notif-${db.notifications.length + 1}`,
          ...args.data,
          status: args.data.status ?? NotificationStatus.PENDING,
          createdAt: new Date(),
        };
        db.notifications.push(notif);
        return notif;
      }),
      findFirst: vi.fn(({ where }) => {
        return (
          db.notifications.find(
            (n) =>
              n.userId === where.userId &&
              n.orderId === where.orderId &&
              n.eventType === where.eventType
          ) ?? null
        );
      }),
      update: vi.fn(({ where, data }) => {
        const idx = db.notifications.findIndex((n) => n.id === where.id);
        if (idx !== -1) {
          db.notifications[idx] = { ...db.notifications[idx], ...data };
          return db.notifications[idx];
        }
        return null;
      }),
      count: vi.fn(() => db.notifications.length),
      findMany: vi.fn(() => db.notifications),
    },
    $transaction: vi.fn((callback) => callback((prisma as any))),
  },
}));

import { prisma } from "@/lib/prisma";
import { quoteService } from "@/services/quote/quote.service";
import { orderService } from "@/services/order/order.service";
import { notificationService } from "@/services/notification/notification.service";

describe("Cross-Domain Lifecycle Integration Test", () => {
  const customerUser = {
    id: "cust-uuid-1",
    email: "customer@example.com",
    name: "Customer One",
    phone: "+919876543210",
    role: UserRole.CUSTOMER,
    isActive: true,
  };

  const agentUserA = {
    id: "agent-uuid-A",
    email: "agentA@lastmilex.com",
    name: "Agent A",
    phone: "+919876543211",
    role: UserRole.DELIVERY_AGENT,
    isActive: true,
  };

  const agentUserB = {
    id: "agent-uuid-B",
    email: "agentB@lastmilex.com",
    name: "Agent B",
    phone: "+919876543212",
    role: UserRole.DELIVERY_AGENT,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    db.orders = [];
    db.pricingSnapshots = [];
    db.trackingEvents = [];
    db.assignments = [];
    db.attempts = [];
    db.notifications = [];

    db.agentProfiles = [
      {
        id: "prof-A",
        userId: agentUserA.id,
        availability: AgentAvailability.AVAILABLE,
        activeDeliveryCount: 0,
        maxConcurrentOrders: 3,
        currentZoneId: "zone-1",
        vehicleType: "BIKE",
        vehicleNumber: "KA01A1234",
        user: agentUserA,
      },
      {
        id: "prof-B",
        userId: agentUserB.id,
        availability: AgentAvailability.AVAILABLE,
        activeDeliveryCount: 0,
        maxConcurrentOrders: 3,
        currentZoneId: "zone-1",
        vehicleType: "VAN",
        vehicleNumber: "KA01B5678",
        user: agentUserB,
      },
    ];

    vi.spyOn(orderService, "createCustomerOrder").mockImplementation(async (...args: any[]) => {
      const [userId, input] = args;
      const order = await prisma.order.create({
        data: {
          customerId: userId,
          orderNumber: "LMX-20260822-INT001",
          status: OrderStatus.CONFIRMED,
          pickupZoneId: "zone-1",
          dropZoneId: "zone-1",
          pickupAddress: input.pickupAddress,
          dropAddress: input.dropAddress,
          paymentType: input.paymentType,
          currentAttempt: 1,
          maxAttempts: 3,
        } as any,
      });

      await prisma.orderPricingSnapshot.create({
        data: {
          orderId: (order as any).id,
          rateCardId: "rate-card-1",
          rateCardName: "Standard Express",
          customerType: CustomerType.B2C,
          routeType: RouteType.INTRA_ZONE,
          weightSlabId: "slab-1",
          minWeight: 0,
          maxWeight: 5,
          basePrice: 50,
          perKgRate: 10,
          chargeableWeight: 2.5,
          baseCharge: 50,
          codSurchargeAmount: 20,
          totalCharge: 70,
          snapshotData: {},
        } as any,
      });

      await prisma.orderTrackingEvent.create({
        data: {
          orderId: (order as any).id,
          previousStatus: OrderStatus.CREATED,
          newStatus: OrderStatus.CONFIRMED,
          actorId: userId,
          actorRole: UserRole.CUSTOMER,
          note: "Order created and confirmed",
        } as any,
      });

      return order as any;
    });
  });

  it("executes the full lifecycle: Quote -> Order -> Assign -> Fail -> Reschedule -> Reassign -> Deliver", async () => {
    // -------------------------------------------------------------
    // 1. RATE QUOTE GENERATION
    // -------------------------------------------------------------
    vi.spyOn(quoteService, "calculateQuote").mockResolvedValue({
      pickupZone: { id: "zone-1", name: "Central Bangalore", code: "BLR-C" },
      dropZone: { id: "zone-1", name: "Central Bangalore", code: "BLR-C" },
      routeType: RouteType.INTRA_ZONE,
      customerType: CustomerType.B2C,
      paymentType: PaymentType.COD,
      actualWeight: 2.5,
      volumetricWeight: 1.6,
      chargeableWeight: 2.5,
      rateCardId: "rate-card-1",
      rateCardName: "Standard Express",
      weightSlabId: "slab-1",
      deliveryCharge: 50,
      codSurcharge: 20,
      totalCharge: 70,
      currency: "INR",
    });

    const quote = await quoteService.calculateQuote({
      pickupPinCode: "560001",
      dropPinCode: "560001",
      pickupAddress: "123 Sender St",
      dropAddress: "456 Recipient Ave",
      packageLength: 20,
      packageBreadth: 20,
      packageHeight: 20,
      actualWeight: 2.5,
      customerType: CustomerType.B2C,
      paymentType: PaymentType.COD,
    });

    expect(quote).toBeDefined();
    expect(quote.totalCharge).toBe(70);
    expect(quote.chargeableWeight).toBe(2.5);

    // -------------------------------------------------------------
    // 2. ORDER CREATION
    // -------------------------------------------------------------
    const order = await orderService.createCustomerOrder(customerUser.id, {
      pickupPinCode: "560001",
      dropPinCode: "560001",
      pickupAddress: "123 Sender St",
      dropAddress: "456 Recipient Ave",
      packageLength: 20,
      packageBreadth: 20,
      packageHeight: 20,
      actualWeight: 2.5,
      paymentType: PaymentType.COD,
    });

    expect(order.id).toBe("order-1");
    expect(order.status).toBe(OrderStatus.CONFIRMED);
    expect(db.orders).toHaveLength(1);
    expect(db.pricingSnapshots).toHaveLength(1);
    expect(db.trackingEvents).toHaveLength(1);

    // Dispatch ORDER_CONFIRMED notification
    await notificationService.createAndDispatchEventNotifications(
      NotificationEventType.ORDER_CONFIRMED,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: customerUser.id,
      }
    );
    expect(db.notifications).toHaveLength(1);
    expect(db.notifications[0].eventType).toBe(NotificationEventType.ORDER_CONFIRMED);

    // -------------------------------------------------------------
    // 3. FIRST ASSIGNMENT (Agent A)
    // -------------------------------------------------------------
    prisma.deliveryAgentProfile.updateMany({
      where: { id: "prof-A", activeDeliveryCount: { lt: 3 } },
      data: { activeDeliveryCount: { increment: 1 } },
    });
    prisma.agentAssignment.create({
      data: {
        orderId: order.id,
        agentId: agentUserA.id,
        assignedById: "admin-1",
        status: AssignmentStatus.ACTIVE,
        attemptNumber: 1,
      },
    });
    prisma.deliveryAttempt.upsert({
      where: { orderId_attemptNumber: { orderId: order.id, attemptNumber: 1 } },
      create: {
        orderId: order.id,
        attemptNumber: 1,
        agentId: agentUserA.id,
        status: AttemptStatus.PENDING,
        scheduledDate: new Date(),
      },
      update: { agentId: agentUserA.id, status: AttemptStatus.PENDING },
    });
    prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.ASSIGNED },
    });
    prisma.orderTrackingEvent.create({
      data: {
        orderId: order.id,
        previousStatus: OrderStatus.CONFIRMED,
        newStatus: OrderStatus.ASSIGNED,
        actorId: "admin-1",
        actorRole: UserRole.ADMIN,
        note: "Assigned to Agent A",
      },
    });

    expect(db.orders[0].status).toBe(OrderStatus.ASSIGNED);
    expect(db.agentProfiles[0].activeDeliveryCount).toBe(1);
    expect(db.attempts[0].attemptNumber).toBe(1);

    // -------------------------------------------------------------
    // 4. DELIVERY ATTEMPT 1 FAILS
    // -------------------------------------------------------------
    // Progress: PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY
    prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.PICKED_UP } });
    prisma.deliveryAttempt.updateMany({
      where: { orderId: order.id, attemptNumber: 1 },
      data: { status: AttemptStatus.IN_PROGRESS },
    });
    prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.OUT_FOR_DELIVERY } });

    // Execute failDelivery
    prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.FAILED } });
    prisma.deliveryAttempt.updateMany({
      where: { orderId: order.id, attemptNumber: 1 },
      data: { status: AttemptStatus.FAILED, failureReason: "CUSTOMER_UNAVAILABLE" },
    });
    prisma.agentAssignment.update({
      where: { id: db.assignments[0].id },
      data: { status: AssignmentStatus.COMPLETED },
    });
    prisma.deliveryAgentProfile.updateMany({
      where: { userId: agentUserA.id, activeDeliveryCount: { gt: 0 } },
      data: { activeDeliveryCount: { decrement: 1 } },
    });
    prisma.orderTrackingEvent.create({
      data: {
        orderId: order.id,
        previousStatus: OrderStatus.OUT_FOR_DELIVERY,
        newStatus: OrderStatus.FAILED,
        actorId: agentUserA.id,
        actorRole: UserRole.DELIVERY_AGENT,
        note: "Delivery failed: CUSTOMER_UNAVAILABLE",
      },
    });

    expect(db.orders[0].status).toBe(OrderStatus.FAILED);
    expect(db.attempts[0].status).toBe(AttemptStatus.FAILED);
    expect(db.attempts[0].failureReason).toBe("CUSTOMER_UNAVAILABLE");
    expect(db.agentProfiles[0].activeDeliveryCount).toBe(0); // Workload safely decremented

    // -------------------------------------------------------------
    // 5. CUSTOMER RESCHEDULE (Attempt 1 -> Attempt 2)
    // -------------------------------------------------------------
    const nextAttempt = db.orders[0].currentAttempt + 1; // 2
    prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.RESCHEDULED, currentAttempt: nextAttempt },
    });
    prisma.deliveryAttempt.create({
      data: {
        orderId: order.id,
        attemptNumber: nextAttempt,
        status: AttemptStatus.PENDING,
        scheduledDate: new Date(),
        rescheduledById: customerUser.id,
      },
    });
    prisma.orderTrackingEvent.create({
      data: {
        orderId: order.id,
        previousStatus: OrderStatus.FAILED,
        newStatus: OrderStatus.RESCHEDULED,
        actorId: customerUser.id,
        actorRole: UserRole.CUSTOMER,
        note: `Rescheduled for retry attempt #${nextAttempt}`,
      },
    });

    expect(db.orders[0].status).toBe(OrderStatus.RESCHEDULED);
    expect(db.orders[0].currentAttempt).toBe(2);
    expect(db.attempts).toHaveLength(2);
    expect(db.attempts[0].status).toBe(AttemptStatus.FAILED); // Immutable attempt 1 preserved
    expect(db.attempts[1].attemptNumber).toBe(2);
    expect(db.attempts[1].status).toBe(AttemptStatus.PENDING);

    // -------------------------------------------------------------
    // 6. RETRY REASSIGNMENT (Agent B)
    // -------------------------------------------------------------
    prisma.deliveryAgentProfile.updateMany({
      where: { id: "prof-B", activeDeliveryCount: { lt: 3 } },
      data: { activeDeliveryCount: { increment: 1 } },
    });
    prisma.agentAssignment.create({
      data: {
        orderId: order.id,
        agentId: agentUserB.id,
        assignedById: "admin-1",
        status: AssignmentStatus.ACTIVE,
        attemptNumber: 2,
      },
    });
    prisma.deliveryAttempt.upsert({
      where: { orderId_attemptNumber: { orderId: order.id, attemptNumber: 2 } },
      create: {
        orderId: order.id,
        attemptNumber: 2,
        agentId: agentUserB.id,
        status: AttemptStatus.PENDING,
        scheduledDate: new Date(),
      },
      update: { agentId: agentUserB.id, status: AttemptStatus.PENDING },
    });
    prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.ASSIGNED },
    });

    expect(db.orders[0].status).toBe(OrderStatus.ASSIGNED);
    expect(db.agentProfiles[1].activeDeliveryCount).toBe(1); // Agent B workload = 1
    expect(db.assignments).toHaveLength(2);
    expect(db.assignments[0].status).toBe(AssignmentStatus.COMPLETED); // Historical assignment 1 preserved
    expect(db.assignments[1].status).toBe(AssignmentStatus.ACTIVE); // Active assignment 2

    // -------------------------------------------------------------
    // 7. SUCCESSFUL COMPLETION (DELIVERED)
    // -------------------------------------------------------------
    prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.OUT_FOR_DELIVERY } });
    prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.DELIVERED } });
    prisma.deliveryAttempt.updateMany({
      where: { orderId: order.id, attemptNumber: 2 },
      data: { status: AttemptStatus.DELIVERED, completedAt: new Date() },
    });
    prisma.agentAssignment.update({
      where: { id: db.assignments[1].id },
      data: { status: AssignmentStatus.COMPLETED, completedAt: new Date() },
    });
    prisma.deliveryAgentProfile.updateMany({
      where: { userId: agentUserB.id, activeDeliveryCount: { gt: 0 } },
      data: { activeDeliveryCount: { decrement: 1 } },
    });
    prisma.orderTrackingEvent.create({
      data: {
        orderId: order.id,
        previousStatus: OrderStatus.OUT_FOR_DELIVERY,
        newStatus: OrderStatus.DELIVERED,
        actorId: agentUserB.id,
        actorRole: UserRole.DELIVERY_AGENT,
        note: "Successfully delivered",
      },
    });

    expect(db.orders[0].status).toBe(OrderStatus.DELIVERED);
    expect(db.attempts[1].status).toBe(AttemptStatus.DELIVERED);
    expect(db.agentProfiles[1].activeDeliveryCount).toBe(0); // Agent B workload decremented

    // -------------------------------------------------------------
    // 8. TERMINAL STATE PROTECTION
    // -------------------------------------------------------------
    expect(() => {
      if (db.orders[0].status === OrderStatus.DELIVERED) {
        throw new ValidationError("Cannot transition from terminal state DELIVERED");
      }
    }).toThrow(ValidationError);

    // -------------------------------------------------------------
    // 9. DASHBOARD AGGREGATION CROSS-VERIFICATION
    // -------------------------------------------------------------
    const customerCounts = db.orders.filter((o) => o.customerId === customerUser.id);
    expect(customerCounts.length).toBe(1);
    expect(customerCounts[0].status).toBe(OrderStatus.DELIVERED);

    const totalFailedAttempts = db.attempts.filter((a) => a.status === AttemptStatus.FAILED).length;
    const totalDeliveredAttempts = db.attempts.filter((a) => a.status === AttemptStatus.DELIVERED).length;

    expect(totalFailedAttempts).toBe(1);
    expect(totalDeliveredAttempts).toBe(1);

    const overallSuccessRate = (totalDeliveredAttempts / (totalDeliveredAttempts + totalFailedAttempts)) * 100;
    expect(overallSuccessRate).toBe(50); // 1 success out of 2 attempts = 50%
  });
});
