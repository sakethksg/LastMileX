import { prisma } from "@/lib/prisma";
import {
  AgentAvailability,
  AssignmentStatus,
  AssignmentType,
  AttemptStatus,
  OrderStatus,
  UserRole,
  Prisma,
} from "@prisma/client";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";

export class DeliveryAgentRepository {
  async findById(userId: string) {
    return prisma.user.findFirst({
      where: {
        id: userId,
        role: UserRole.DELIVERY_AGENT,
      },
      include: {
        deliveryAgentProfile: {
          include: {
            currentZone: true,
          },
        },
      },
    });
  }

  async findProfileByUserId(userId: string) {
    return prisma.deliveryAgentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
        currentZone: true,
      },
    });
  }

  async listAgents(params?: {
    availability?: AgentAvailability;
    currentZoneId?: string;
    isActive?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.UserWhereInput = {
      role: UserRole.DELIVERY_AGENT,
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params?.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
      deliveryAgentProfile: {
        is: {
          ...(params?.availability ? { availability: params.availability } : {}),
          ...(params?.currentZoneId ? { currentZoneId: params.currentZoneId } : {}),
        },
      },
    };

    const [total, agents] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          deliveryAgentProfile: {
            include: {
              currentZone: true,
            },
          },
        },
      }),
    ]);

    return { total, agents };
  }

  async updateProfile(
    userId: string,
    data: {
      currentZoneId?: string | null;
      availability?: AgentAvailability;
      vehicleType?: string | null;
      vehicleNumber?: string | null;
      maxConcurrentOrders?: number;
    }
  ) {
    return prisma.deliveryAgentProfile.update({
      where: { userId },
      data: {
        ...(data.currentZoneId !== undefined ? { currentZoneId: data.currentZoneId } : {}),
        ...(data.availability !== undefined ? { availability: data.availability } : {}),
        ...(data.vehicleType !== undefined ? { vehicleType: data.vehicleType } : {}),
        ...(data.vehicleNumber !== undefined ? { vehicleNumber: data.vehicleNumber } : {}),
        ...(data.maxConcurrentOrders !== undefined
          ? { maxConcurrentOrders: data.maxConcurrentOrders }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
        currentZone: true,
      },
    });
  }

  async findEligibleCandidateAgents(pickupZoneId?: string) {
    // Fetch all active delivery agents with profiles
    const agents = await prisma.user.findMany({
      where: {
        role: UserRole.DELIVERY_AGENT,
        isActive: true,
        deliveryAgentProfile: {
          availability: AgentAvailability.AVAILABLE,
        },
      },
      include: {
        deliveryAgentProfile: {
          include: {
            currentZone: true,
          },
        },
        assignedAgentOrders: {
          where: {
            status: AssignmentStatus.COMPLETED,
          },
          orderBy: {
            completedAt: "desc",
          },
          take: 1,
        },
      },
    });

    return agents
      .filter((u) => u.deliveryAgentProfile !== null)
      .map((u) => {
        const p = u.deliveryAgentProfile!;
        const lastAssignment = u.assignedAgentOrders[0];
        return {
          id: p.id,
          userId: u.id,
          name: u.name,
          email: u.email,
          isActive: u.isActive,
          availability: p.availability,
          currentZoneId: p.currentZoneId,
          maxConcurrentOrders: p.maxConcurrentOrders,
          activeDeliveryCount: p.activeDeliveryCount,
          lastKnownLatitude: p.lastKnownLatitude ? Number(p.lastKnownLatitude) : null,
          lastKnownLongitude: p.lastKnownLongitude ? Number(p.lastKnownLongitude) : null,
          lastDeliveryCompletedAt: lastAssignment?.completedAt ?? null,
          createdAt: u.createdAt,
        };
      });
  }

  async assignOrderTransaction(params: {
    orderId: string;
    targetAgentUserId: string;
    assignedById: string;
    assignmentType: AssignmentType;
    actorRole: UserRole;
    notes?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch and lock order row / verify status
      const order = await tx.order.findUnique({
        where: { id: params.orderId },
        include: {
          assignments: {
            where: { status: AssignmentStatus.ACTIVE },
            include: { agent: true },
          },
        },
      });

      if (!order) {
        throw new NotFoundError(`Order '${params.orderId}' not found`);
      }

      if (
        order.status !== OrderStatus.CONFIRMED &&
        order.status !== OrderStatus.RESCHEDULED &&
        order.status !== OrderStatus.ASSIGNED // Reassignment when already assigned
      ) {
        throw new ConflictError(
          `Order is in '${order.status}' status and cannot be assigned. Must be CONFIRMED, RESCHEDULED, or ASSIGNED.`
        );
      }

      // 2. Fetch target agent profile
      const targetAgentProfile = await tx.deliveryAgentProfile.findUnique({
        where: { userId: params.targetAgentUserId },
        include: { user: true },
      });

      if (!targetAgentProfile || !targetAgentProfile.user.isActive) {
        throw new ConflictError("Target agent is not active or has no agent profile");
      }

      // 3. Atomically claim capacity slot for new agent
      const claimResult = await tx.deliveryAgentProfile.updateMany({
        where: {
          id: targetAgentProfile.id,
          availability: AgentAvailability.AVAILABLE,
          activeDeliveryCount: { lt: targetAgentProfile.maxConcurrentOrders },
        },
        data: {
          activeDeliveryCount: { increment: 1 },
        },
      });

      if (claimResult.count === 0) {
        throw new ConflictError(
          `Agent '${targetAgentProfile.user.name}' has reached maximum concurrent capacity or is not available`
        );
      }

      // Re-fetch agent profile to check if now at max capacity -> update to BUSY
      const refreshedProfile = await tx.deliveryAgentProfile.findUnique({
        where: { id: targetAgentProfile.id },
      });

      if (
        refreshedProfile &&
        refreshedProfile.activeDeliveryCount >= refreshedProfile.maxConcurrentOrders
      ) {
        await tx.deliveryAgentProfile.update({
          where: { id: targetAgentProfile.id },
          data: { availability: AgentAvailability.BUSY },
        });
      }

      // 4. Handle Reassignment if an active assignment already existed
      let isReassignment = false;
      let previousAgentName: string | null = null;
      const currentActiveAssignment = order.assignments[0];

      if (currentActiveAssignment) {
        isReassignment = true;
        previousAgentName = currentActiveAssignment.agent.name;

        // Close previous active assignment
        await tx.agentAssignment.update({
          where: { id: currentActiveAssignment.id },
          data: {
            status: AssignmentStatus.REASSIGNED,
            completedAt: new Date(),
          },
        });

        // Decrement previous agent's workload safely
        await tx.deliveryAgentProfile.updateMany({
          where: {
            userId: currentActiveAssignment.agentId,
            activeDeliveryCount: { gt: 0 },
          },
          data: {
            activeDeliveryCount: { decrement: 1 },
          },
        });

        // If previous agent was BUSY, revert to AVAILABLE if now below max
        const prevProfile = await tx.deliveryAgentProfile.findUnique({
          where: { userId: currentActiveAssignment.agentId },
        });
        if (
          prevProfile &&
          prevProfile.availability === AgentAvailability.BUSY &&
          prevProfile.activeDeliveryCount < prevProfile.maxConcurrentOrders
        ) {
          await tx.deliveryAgentProfile.update({
            where: { id: prevProfile.id },
            data: { availability: AgentAvailability.AVAILABLE },
          });
        }
      }

      // 5. Determine attemptNumber
      const totalPastAssignments = await tx.agentAssignment.count({
        where: { orderId: params.orderId },
      });
      const attemptNumber = totalPastAssignments + 1;

      // 6. Create new AgentAssignment record
      const newAssignment = await tx.agentAssignment.create({
        data: {
          orderId: order.id,
          agentId: params.targetAgentUserId,
          assignedById: params.assignedById,
          assignmentType: params.assignmentType,
          status: AssignmentStatus.ACTIVE,
          attemptNumber,
          notes: params.notes ?? null,
        },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // 7. Update order status to ASSIGNED (if not already ASSIGNED)
      const previousOrderStatus = order.status;
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.ASSIGNED,
        },
      });

      // 8. Upsert / Create DeliveryAttempt
      await tx.deliveryAttempt.upsert({
        where: {
          orderId_attemptNumber: {
            orderId: order.id,
            attemptNumber: order.currentAttempt,
          },
        },
        create: {
          orderId: order.id,
          attemptNumber: order.currentAttempt,
          agentId: params.targetAgentUserId,
          status: AttemptStatus.PENDING,
          scheduledDate: order.scheduledDeliveryDate ?? new Date(),
        },
        update: {
          agentId: params.targetAgentUserId,
          status: AttemptStatus.PENDING,
        },
      });

      // 9. Create OrderTrackingEvent
      const trackingNote = isReassignment
        ? `Order reassigned from ${previousAgentName} to ${targetAgentProfile.user.name} (${params.assignmentType})`
        : `Order assigned to ${targetAgentProfile.user.name} (${params.assignmentType})`;

      const trackingEvent = await tx.orderTrackingEvent.create({
        data: {
          orderId: order.id,
          previousStatus: previousOrderStatus,
          newStatus: OrderStatus.ASSIGNED,
          actorId: params.assignedById,
          actorRole: params.actorRole,
          note: params.notes ? `${trackingNote}: ${params.notes}` : trackingNote,
          metadata: {
            assignmentId: newAssignment.id,
            agentId: params.targetAgentUserId,
            assignmentType: params.assignmentType,
            attemptNumber,
            isReassignment,
          },
        },
      });

      return {
        order: updatedOrder,
        assignment: newAssignment,
        trackingEvent,
      };
    });
  }

  async listAgentOrders(
    agentUserId: string,
    params?: {
      status?: OrderStatus;
      skip?: number;
      take?: number;
    }
  ) {
    const where: Prisma.OrderWhereInput = {
      assignments: {
        some: {
          agentId: agentUserId,
          status: AssignmentStatus.ACTIVE,
        },
      },
      ...(params?.status ? { status: params.status } : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          pickupZone: true,
          dropZone: true,
          pricingSnapshot: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    return { total, orders };
  }

  async findAgentOrderById(agentUserId: string, orderId: string) {
    return prisma.order.findFirst({
      where: {
        id: orderId,
        assignments: {
          some: {
            agentId: agentUserId,
            status: AssignmentStatus.ACTIVE,
          },
        },
      },
      include: {
        pickupZone: true,
        dropZone: true,
        pricingSnapshot: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        trackingEvents: {
          orderBy: { timestamp: "asc" },
        },
        assignments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }
}

export const deliveryAgentRepository = new DeliveryAgentRepository();
