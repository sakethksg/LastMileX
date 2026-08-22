import { prisma } from "@/lib/prisma";
import {
  AgentAvailability,
  AssignmentStatus,
  AttemptStatus,
  OrderStatus,
  PaymentType,
  UserRole,
  Prisma,
} from "@prisma/client";

export class DashboardRepository {
  /**
   * 1. Customer Dashboard Repository Data
   */
  async getCustomerDashboardData(customerId: string, limit: number = 5) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [
      statusCounts,
      recentOrders,
      activeOrders,
      notifications,
      unreadNotificationCount,
    ] = await Promise.all([
      // Status aggregation
      prisma.order.groupBy({
        by: ["status"],
        where: { customerId },
        _count: { id: true },
      }),

      // Recent orders
      prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          pricingSnapshot: true,
          pickupZone: true,
          dropZone: true,
          trackingEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),

      // Active deliveries
      prisma.order.findMany({
        where: {
          customerId,
          status: {
            notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          pricingSnapshot: true,
          assignments: {
            where: { status: AssignmentStatus.ACTIVE },
            include: {
              agent: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  deliveryAgentProfile: {
                    select: {
                      vehicleType: true,
                      vehicleNumber: true,
                    },
                  },
                },
              },
            },
          },
          trackingEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          attempts: {
            orderBy: { attemptNumber: "desc" },
            take: 1,
          },
        },
      }),

      // Recent notifications
      prisma.notification.findMany({
        where: { userId: customerId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),

      // Unread / pending notifications
      prisma.notification.count({
        where: {
          userId: customerId,
          status: { in: ["PENDING", "SENT"] },
        },
      }),
    ]);

    return {
      statusCounts,
      recentOrders,
      activeOrders,
      notifications,
      unreadNotificationCount,
    };
  }

  /**
   * 2. Delivery Agent Dashboard Repository Data
   */
  async getAgentDashboardData(agentUserId: string, limit: number = 5) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [
      agentProfile,
      activeOrders,
      completedTodayCount,
      failedTodayCount,
      totalCompletedCount,
      totalFailedCount,
      recentAttempts,
    ] = await Promise.all([
      // Profile
      prisma.deliveryAgentProfile.findUnique({
        where: { userId: agentUserId },
        include: {
          currentZone: true,
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),

      // Active assigned orders
      prisma.order.findMany({
        where: {
          assignments: {
            some: {
              agentId: agentUserId,
              status: AssignmentStatus.ACTIVE,
            },
          },
          status: {
            notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
          },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          pricingSnapshot: true,
          pickupZone: true,
          dropZone: true,
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
          trackingEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),

      // Completed Today
      prisma.deliveryAttempt.count({
        where: {
          agentId: agentUserId,
          status: AttemptStatus.DELIVERED,
          completedAt: { gte: todayStart },
        },
      }),

      // Failed Today
      prisma.deliveryAttempt.count({
        where: {
          agentId: agentUserId,
          status: AttemptStatus.FAILED,
          failedAt: { gte: todayStart },
        },
      }),

      // Total Completed
      prisma.deliveryAttempt.count({
        where: {
          agentId: agentUserId,
          status: AttemptStatus.DELIVERED,
        },
      }),

      // Total Failed
      prisma.deliveryAttempt.count({
        where: {
          agentId: agentUserId,
          status: AttemptStatus.FAILED,
        },
      }),

      // Recent Deliveries
      prisma.deliveryAttempt.findMany({
        where: {
          agentId: agentUserId,
          status: { in: [AttemptStatus.DELIVERED, AttemptStatus.FAILED] },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              pickupAddress: true,
              dropAddress: true,
            },
          },
        },
      }),
    ]);

    return {
      agentProfile,
      activeOrders,
      completedTodayCount,
      failedTodayCount,
      totalCompletedCount,
      totalFailedCount,
      recentAttempts,
    };
  }

  /**
   * 3. Admin Dashboard Repository Data
   */
  async getAdminDashboardData(params?: {
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }) {
    const limit = params?.limit ?? 5;
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const orderDateWhere: Prisma.OrderWhereInput = params?.dateFrom || params?.dateTo
      ? {
          createdAt: {
            ...(params?.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params?.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {};

    const [
      statusCounts,
      completedToday,
      failedToday,
      totalCompleted,
      totalFailed,
      agentProfiles,
      financialSnapshots,
      recentOrders,
      recentFailures,
    ] = await Promise.all([
      // Group by order status
      prisma.order.groupBy({
        by: ["status"],
        where: orderDateWhere,
        _count: { id: true },
      }),

      // Completed today
      prisma.deliveryAttempt.count({
        where: {
          status: AttemptStatus.DELIVERED,
          completedAt: { gte: todayStart },
        },
      }),

      // Failed today
      prisma.deliveryAttempt.count({
        where: {
          status: AttemptStatus.FAILED,
          failedAt: { gte: todayStart },
        },
      }),

      // Total completed
      prisma.deliveryAttempt.count({
        where: { status: AttemptStatus.DELIVERED },
      }),

      // Total failed
      prisma.deliveryAttempt.count({
        where: { status: AttemptStatus.FAILED },
      }),

      // Agent availability & capacity breakdown
      prisma.deliveryAgentProfile.findMany({
        select: {
          id: true,
          availability: true,
          activeDeliveryCount: true,
          maxConcurrentOrders: true,
          user: {
            select: { isActive: true },
          },
        },
      }),

      // Financial snapshots
      prisma.order.findMany({
        where: orderDateWhere,
        select: {
          status: true,
          paymentType: true,
          pricingSnapshot: {
            select: {
              totalCharge: true,
            },
          },
        },
      }),

      // Recent orders
      prisma.order.findMany({
        where: orderDateWhere,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          pricingSnapshot: true,
          pickupZone: true,
          dropZone: true,
          customer: {
            select: { name: true, email: true },
          },
        },
      }),

      // Recent failures
      prisma.deliveryAttempt.findMany({
        where: {
          status: AttemptStatus.FAILED,
        },
        orderBy: { failedAt: "desc" },
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              pickupAddress: true,
              dropAddress: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    return {
      statusCounts,
      completedToday,
      failedToday,
      totalCompleted,
      totalFailed,
      agentProfiles,
      financialSnapshots,
      recentOrders,
      recentFailures,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
