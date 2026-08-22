import { prisma } from "@/lib/prisma";
import {
  AgentAvailability,
  AssignmentStatus,
  AttemptStatus,
  OrderStatus,
  UserRole,
} from "@/types/enums";
import { assertValidTransition } from "@/lib/orders/order-state-machine";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from "@/lib/errors/app-error";

export class DeliveryExecutionService {
  /**
   * Helper to verify that the requesting agent has an ACTIVE assignment for this order.
   */
  private async getOrderAndVerifyActiveAgent(orderId: string, agentUserId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        assignments: {
          where: {
            agentId: agentUserId,
            status: AssignmentStatus.ACTIVE,
          },
        },
        attempts: {
          orderBy: { attemptNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundError(`Order '${orderId}' not found`);
    }

    const activeAssignment = order.assignments[0];
    if (!activeAssignment) {
      throw new ForbiddenError(
        `Agent '${agentUserId}' does not hold the active assignment for order '${orderId}'`
      );
    }

    return {
      order,
      activeAssignment,
      currentAttempt: order.attempts[0],
    };
  }

  /**
   * 1. Pickup: ASSIGNED -> PICKED_UP
   */
  async pickupOrder(orderId: string, agentUserId: string, notes?: string | null) {
    const { order, activeAssignment } = await this.getOrderAndVerifyActiveAgent(
      orderId,
      agentUserId
    );

    assertValidTransition(order.status, OrderStatus.PICKED_UP, UserRole.DELIVERY_AGENT);

    return prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PICKED_UP },
      });

      // 2. Update active delivery attempt to IN_PROGRESS
      await tx.deliveryAttempt.updateMany({
        where: {
          orderId: order.id,
          attemptNumber: order.currentAttempt,
          status: AttemptStatus.PENDING,
        },
        data: { status: AttemptStatus.IN_PROGRESS },
      });

      // 3. Append Tracking Event
      const trackingEvent = await tx.orderTrackingEvent.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: OrderStatus.PICKED_UP,
          actorId: agentUserId,
          actorRole: UserRole.DELIVERY_AGENT,
          note: notes ?? "Package picked up by delivery agent",
          metadata: {
            assignmentId: activeAssignment.id,
            attemptNumber: order.currentAttempt,
          },
        },
      });

      return {
        order: updatedOrder,
        trackingEvent,
      };
    });
  }

  /**
   * 2. Start Delivery: PICKED_UP -> IN_TRANSIT
   */
  async startDelivery(orderId: string, agentUserId: string, notes?: string | null) {
    const { order, activeAssignment } = await this.getOrderAndVerifyActiveAgent(
      orderId,
      agentUserId
    );

    assertValidTransition(order.status, OrderStatus.IN_TRANSIT, UserRole.DELIVERY_AGENT);

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.IN_TRANSIT },
      });

      const trackingEvent = await tx.orderTrackingEvent.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: OrderStatus.IN_TRANSIT,
          actorId: agentUserId,
          actorRole: UserRole.DELIVERY_AGENT,
          note: notes ?? "Package is in transit to destination",
          metadata: {
            assignmentId: activeAssignment.id,
            attemptNumber: order.currentAttempt,
          },
        },
      });

      return {
        order: updatedOrder,
        trackingEvent,
      };
    });
  }

  /**
   * 3. Out for Delivery: IN_TRANSIT -> OUT_FOR_DELIVERY
   */
  async markOutForDelivery(orderId: string, agentUserId: string, notes?: string | null) {
    const { order, activeAssignment } = await this.getOrderAndVerifyActiveAgent(
      orderId,
      agentUserId
    );

    assertValidTransition(order.status, OrderStatus.OUT_FOR_DELIVERY, UserRole.DELIVERY_AGENT);

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.OUT_FOR_DELIVERY },
      });

      const trackingEvent = await tx.orderTrackingEvent.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: OrderStatus.OUT_FOR_DELIVERY,
          actorId: agentUserId,
          actorRole: UserRole.DELIVERY_AGENT,
          note: notes ?? "Agent is out for delivery at destination",
          metadata: {
            assignmentId: activeAssignment.id,
            attemptNumber: order.currentAttempt,
          },
        },
      });

      return {
        order: updatedOrder,
        trackingEvent,
      };
    });
  }

  /**
   * 4. Complete Delivery: OUT_FOR_DELIVERY -> DELIVERED (Terminal)
   */
  async completeDelivery(orderId: string, agentUserId: string, notes?: string | null) {
    const { order, activeAssignment } = await this.getOrderAndVerifyActiveAgent(
      orderId,
      agentUserId
    );

    assertValidTransition(order.status, OrderStatus.DELIVERED, UserRole.DELIVERY_AGENT);

    return prisma.$transaction(async (tx) => {
      // Guard against concurrent execution
      const orderClaim = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.OUT_FOR_DELIVERY,
        },
        data: { status: OrderStatus.DELIVERED },
      });

      if (orderClaim.count === 0) {
        throw new ConflictError(
          `Order '${order.id}' is not in OUT_FOR_DELIVERY state or was completed concurrently`
        );
      }

      // Close delivery attempt
      await tx.deliveryAttempt.updateMany({
        where: {
          orderId: order.id,
          attemptNumber: order.currentAttempt,
          status: { in: [AttemptStatus.PENDING, AttemptStatus.IN_PROGRESS] },
        },
        data: {
          status: AttemptStatus.DELIVERED,
          completedAt: new Date(),
        },
      });

      // Close assignment
      await tx.agentAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          status: AssignmentStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Decrement agent workload safely
      await tx.deliveryAgentProfile.updateMany({
        where: {
          userId: agentUserId,
          activeDeliveryCount: { gt: 0 },
        },
        data: {
          activeDeliveryCount: { decrement: 1 },
        },
      });

      // Restore availability from BUSY -> AVAILABLE if now below max
      const profile = await tx.deliveryAgentProfile.findUnique({
        where: { userId: agentUserId },
      });
      if (
        profile &&
        profile.availability === AgentAvailability.BUSY &&
        profile.activeDeliveryCount < profile.maxConcurrentOrders
      ) {
        await tx.deliveryAgentProfile.update({
          where: { id: profile.id },
          data: { availability: AgentAvailability.AVAILABLE },
        });
      }

      // Append immutable tracking event
      const trackingEvent = await tx.orderTrackingEvent.create({
        data: {
          orderId: order.id,
          previousStatus: OrderStatus.OUT_FOR_DELIVERY,
          newStatus: OrderStatus.DELIVERED,
          actorId: agentUserId,
          actorRole: UserRole.DELIVERY_AGENT,
          note: notes ?? "Package successfully delivered to recipient",
          metadata: {
            assignmentId: activeAssignment.id,
            attemptNumber: order.currentAttempt,
          },
        },
      });

      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          pricingSnapshot: true,
          pickupZone: true,
          dropZone: true,
        },
      });

      return {
        order: updatedOrder,
        trackingEvent,
      };
    });
  }

  /**
   * 5. Fail Delivery: OUT_FOR_DELIVERY -> FAILED
   */
  async failDelivery(
    orderId: string,
    agentUserId: string,
    failureReason: string,
    notes?: string | null
  ) {
    const { order, activeAssignment } = await this.getOrderAndVerifyActiveAgent(
      orderId,
      agentUserId
    );

    assertValidTransition(order.status, OrderStatus.FAILED, UserRole.DELIVERY_AGENT);

    return prisma.$transaction(async (tx) => {
      // Guard against concurrent execution
      const orderClaim = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.OUT_FOR_DELIVERY,
        },
        data: { status: OrderStatus.FAILED },
      });

      if (orderClaim.count === 0) {
        throw new ConflictError(
          `Order '${order.id}' is not in OUT_FOR_DELIVERY state or was updated concurrently`
        );
      }

      // Update delivery attempt to FAILED
      await tx.deliveryAttempt.updateMany({
        where: {
          orderId: order.id,
          attemptNumber: order.currentAttempt,
          status: { in: [AttemptStatus.PENDING, AttemptStatus.IN_PROGRESS] },
        },
        data: {
          status: AttemptStatus.FAILED,
          failureReason,
          failedAt: new Date(),
        },
      });

      // Close assignment as COMPLETED (agent's active attempt on this assignment is finished)
      await tx.agentAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          status: AssignmentStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Decrement agent workload safely
      await tx.deliveryAgentProfile.updateMany({
        where: {
          userId: agentUserId,
          activeDeliveryCount: { gt: 0 },
        },
        data: {
          activeDeliveryCount: { decrement: 1 },
        },
      });

      // Restore availability if was BUSY
      const profile = await tx.deliveryAgentProfile.findUnique({
        where: { userId: agentUserId },
      });
      if (
        profile &&
        profile.availability === AgentAvailability.BUSY &&
        profile.activeDeliveryCount < profile.maxConcurrentOrders
      ) {
        await tx.deliveryAgentProfile.update({
          where: { id: profile.id },
          data: { availability: AgentAvailability.AVAILABLE },
        });
      }

      // Append immutable tracking event
      const trackingEvent = await tx.orderTrackingEvent.create({
        data: {
          orderId: order.id,
          previousStatus: OrderStatus.OUT_FOR_DELIVERY,
          newStatus: OrderStatus.FAILED,
          actorId: agentUserId,
          actorRole: UserRole.DELIVERY_AGENT,
          note: notes ? `Delivery failed: ${failureReason} (${notes})` : `Delivery failed: ${failureReason}`,
          metadata: {
            assignmentId: activeAssignment.id,
            attemptNumber: order.currentAttempt,
            failureReason,
          },
        },
      });

      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          pricingSnapshot: true,
          pickupZone: true,
          dropZone: true,
        },
      });

      return {
        order: updatedOrder,
        trackingEvent,
      };
    });
  }

  /**
   * 6. Reschedule: FAILED -> RESCHEDULED
   */
  async rescheduleOrder(
    orderId: string,
    actorId: string,
    actorRole: UserRole,
    scheduledDeliveryDate?: Date | null,
    notes?: string | null
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        attempts: {
          orderBy: { attemptNumber: "desc" },
        },
      },
    });

    if (!order) {
      throw new NotFoundError(`Order '${orderId}' not found`);
    }

    // Ownership check for customers
    if (actorRole === UserRole.CUSTOMER && order.customerId !== actorId) {
      throw new ForbiddenError("You are not authorized to reschedule this order");
    }

    // Must be in FAILED status
    if (order.status !== OrderStatus.FAILED) {
      throw new ValidationError(
        `Order is in '${order.status}' status and cannot be rescheduled. Only FAILED orders can be rescheduled.`
      );
    }

    // Check maximum delivery attempts
    if (order.currentAttempt >= order.maxAttempts) {
      throw new ConflictError(
        `Order has reached maximum delivery attempts (${order.currentAttempt}/${order.maxAttempts}) and cannot be rescheduled`
      );
    }

    assertValidTransition(order.status, OrderStatus.RESCHEDULED, actorRole);

    return prisma.$transaction(async (tx) => {
      const nextAttemptNumber = order.currentAttempt + 1;

      // 1. Update Order status and increment currentAttempt
      const orderClaim = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.FAILED,
        },
        data: {
          status: OrderStatus.RESCHEDULED,
          currentAttempt: nextAttemptNumber,
          scheduledDeliveryDate: scheduledDeliveryDate ?? null,
        },
      });

      if (orderClaim.count === 0) {
        throw new ConflictError(
          `Order '${order.id}' is no longer in FAILED status or was rescheduled concurrently`
        );
      }

      // 2. Create new DeliveryAttempt for the retry
      const newAttempt = await tx.deliveryAttempt.create({
        data: {
          orderId: order.id,
          attemptNumber: nextAttemptNumber,
          status: AttemptStatus.PENDING,
          scheduledDate: scheduledDeliveryDate ?? new Date(),
          rescheduledById: actorId,
          rescheduledAt: new Date(),
        },
      });

      // 3. Append immutable tracking event
      const trackingEvent = await tx.orderTrackingEvent.create({
        data: {
          orderId: order.id,
          previousStatus: OrderStatus.FAILED,
          newStatus: OrderStatus.RESCHEDULED,
          actorId,
          actorRole,
          note: notes ? `Order rescheduled for retry: ${notes}` : `Order rescheduled for retry attempt #${nextAttemptNumber}`,
          metadata: {
            newAttemptNumber: nextAttemptNumber,
            scheduledDeliveryDate: scheduledDeliveryDate ? scheduledDeliveryDate.toISOString() : null,
          },
        },
      });

      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          pricingSnapshot: true,
          pickupZone: true,
          dropZone: true,
          attempts: {
            orderBy: { attemptNumber: "asc" },
          },
        },
      });

      return {
        order: updatedOrder,
        newAttempt,
        trackingEvent,
      };
    });
  }
}

export const deliveryExecutionService = new DeliveryExecutionService();
