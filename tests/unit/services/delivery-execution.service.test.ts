import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeliveryExecutionService } from "@/services/delivery-agent/delivery-execution.service";
import { prisma } from "@/lib/prisma";
import {
  AgentAvailability,
  AssignmentStatus,
  AttemptStatus,
  OrderStatus,
  UserRole,
} from "@/types/enums";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from "@/lib/errors/app-error";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    deliveryAttempt: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    agentAssignment: {
      update: vi.fn(),
    },
    deliveryAgentProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    orderTrackingEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe("DeliveryExecutionService", () => {
  let service: DeliveryExecutionService;

  const agentUserId = "agent-user-1";
  const orderId = "order-1";

  const sampleOrderAssigned = {
    id: orderId,
    status: OrderStatus.ASSIGNED,
    customerId: "customer-1",
    currentAttempt: 1,
    maxAttempts: 3,
    assignments: [
      {
        id: "asgn-1",
        agentId: agentUserId,
        status: AssignmentStatus.ACTIVE,
      },
    ],
    attempts: [
      {
        id: "attempt-1",
        attemptNumber: 1,
        status: AttemptStatus.PENDING,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DeliveryExecutionService();
  });

  describe("pickupOrder", () => {
    it("transitions ASSIGNED -> PICKED_UP", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(sampleOrderAssigned as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.PICKED_UP,
      } as any);

      const result = await service.pickupOrder(orderId, agentUserId);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatus.PICKED_UP },
      });
      expect(prisma.deliveryAttempt.updateMany).toHaveBeenCalledWith({
        where: {
          orderId,
          attemptNumber: 1,
          status: AttemptStatus.PENDING,
        },
        data: { status: AttemptStatus.IN_PROGRESS },
      });
      expect(result.order.status).toBe(OrderStatus.PICKED_UP);
    });

    it("rejects when requesting agent does not hold the active assignment", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...sampleOrderAssigned,
        assignments: [], // No active assignment for this agent
      } as any);

      await expect(
        service.pickupOrder(orderId, "different-agent")
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("startDelivery & markOutForDelivery", () => {
    it("transitions PICKED_UP -> IN_TRANSIT", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.PICKED_UP,
      } as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.IN_TRANSIT,
      } as any);

      const result = await service.startDelivery(orderId, agentUserId);
      expect(result.order.status).toBe(OrderStatus.IN_TRANSIT);
    });

    it("transitions IN_TRANSIT -> OUT_FOR_DELIVERY", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.IN_TRANSIT,
      } as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.OUT_FOR_DELIVERY,
      } as any);

      const result = await service.markOutForDelivery(orderId, agentUserId);
      expect(result.order.status).toBe(OrderStatus.OUT_FOR_DELIVERY);
    });
  });

  describe("completeDelivery", () => {
    it("completes delivery, closes assignment, decrements agent workload, sets DELIVERED", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.OUT_FOR_DELIVERY,
      } as any);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.deliveryAgentProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: agentUserId,
        availability: AgentAvailability.BUSY,
        activeDeliveryCount: 2,
        maxConcurrentOrders: 3,
      } as any);
      vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.DELIVERED,
      } as any);

      const result = await service.completeDelivery(orderId, agentUserId, "Delivered safely");

      expect(prisma.agentAssignment.update).toHaveBeenCalledWith({
        where: { id: "asgn-1" },
        data: expect.objectContaining({ status: AssignmentStatus.COMPLETED }),
      });
      expect(prisma.deliveryAgentProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: agentUserId, activeDeliveryCount: { gt: 0 } },
        data: { activeDeliveryCount: { decrement: 1 } },
      });
      expect(prisma.deliveryAgentProfile.update).toHaveBeenCalledWith({
        where: { id: "profile-1" },
        data: { availability: AgentAvailability.AVAILABLE },
      });
      expect(result.order.status).toBe(OrderStatus.DELIVERED);
    });
  });

  describe("failDelivery", () => {
    it("marks attempt FAILED, closes assignment, decrements workload, sets order FAILED", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.OUT_FOR_DELIVERY,
      } as any);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.deliveryAgentProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: agentUserId,
        availability: AgentAvailability.AVAILABLE,
        activeDeliveryCount: 1,
        maxConcurrentOrders: 5,
      } as any);
      vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.FAILED,
      } as any);

      const result = await service.failDelivery(
        orderId,
        agentUserId,
        "CUSTOMER_UNAVAILABLE",
        "Door locked"
      );

      expect(prisma.deliveryAttempt.updateMany).toHaveBeenCalledWith({
        where: {
          orderId,
          attemptNumber: 1,
          status: { in: [AttemptStatus.PENDING, AttemptStatus.IN_PROGRESS] },
        },
        data: expect.objectContaining({
          status: AttemptStatus.FAILED,
          failureReason: "CUSTOMER_UNAVAILABLE",
        }),
      });
      expect(result.order.status).toBe(OrderStatus.FAILED);
    });
  });

  describe("rescheduleOrder", () => {
    it("reschedules FAILED order, increments currentAttempt, and creates new DeliveryAttempt", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.FAILED,
        currentAttempt: 1,
        maxAttempts: 3,
      } as any);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.deliveryAttempt.create).mockResolvedValue({
        id: "attempt-2",
        orderId,
        attemptNumber: 2,
        status: AttemptStatus.PENDING,
      } as any);
      vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.RESCHEDULED,
        currentAttempt: 2,
      } as any);

      const result = await service.rescheduleOrder(
        orderId,
        "customer-1",
        UserRole.CUSTOMER,
        new Date("2026-08-25T10:00:00Z"),
        "Please deliver on Tuesday"
      );

      expect(prisma.deliveryAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId,
          attemptNumber: 2,
          status: AttemptStatus.PENDING,
        }),
      });
      expect(result.order.status).toBe(OrderStatus.RESCHEDULED);
    });

    it("rejects reschedule when order has reached maxAttempts", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...sampleOrderAssigned,
        status: OrderStatus.FAILED,
        currentAttempt: 3,
        maxAttempts: 3,
      } as any);

      await expect(
        service.rescheduleOrder(orderId, "customer-1", UserRole.CUSTOMER)
      ).rejects.toThrow(ConflictError);
    });
  });
});
