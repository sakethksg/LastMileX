import {
  dashboardRepository,
  DashboardRepository,
} from "@/repositories/dashboard.repository";
import { DashboardQueryInput } from "@/schemas/dashboard.schema";
import { OrderStatus, PaymentType, AgentAvailability } from "@/types/enums";
import { NotFoundError } from "@/lib/errors/app-error";

export class DashboardService {
  constructor(
    private readonly repo: DashboardRepository = dashboardRepository
  ) {}

  /**
   * 1. Customer Dashboard
   */
  async getCustomerDashboard(customerId: string, query?: DashboardQueryInput) {
    const limit = query?.limit ?? 5;
    const data = await this.repo.getCustomerDashboardData(customerId, limit);

    // Compute status counts map
    const countsMap: Record<string, number> = {};
    for (const item of data.statusCounts) {
      countsMap[item.status] = item._count.id;
    }

    const deliveredOrders = countsMap[OrderStatus.DELIVERED] ?? 0;
    const cancelledOrders = countsMap[OrderStatus.CANCELLED] ?? 0;
    const failedOrders = countsMap[OrderStatus.FAILED] ?? 0;
    const totalOrders = Object.values(countsMap).reduce((acc, count) => acc + count, 0);
    const activeOrders = totalOrders - deliveredOrders - cancelledOrders;

    const formattedRecentOrders = data.recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      pickupAddress: order.pickupAddress,
      dropAddress: order.dropAddress,
      totalCharge: order.pricingSnapshot ? Number(order.pricingSnapshot.totalCharge) : 0,
      paymentType: order.paymentType,
      scheduledDeliveryDate: order.scheduledDeliveryDate,
      createdAt: order.createdAt,
      latestTrackingEvent: order.trackingEvents[0] ?? null,
    }));

    const formattedActiveDeliveries = data.activeOrders.map((order) => {
      const activeAssignment = order.assignments[0];
      const agent = activeAssignment?.agent;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        currentAttempt: order.currentAttempt,
        maxAttempts: order.maxAttempts,
        assignedAgent: agent
          ? {
              id: agent.id,
              name: agent.name,
              phone: agent.phone,
              vehicleType: agent.deliveryAgentProfile?.vehicleType ?? null,
            }
          : null,
        latestTrackingEvent: order.trackingEvents[0] ?? null,
        estimatedOrScheduledDeliveryDate: order.scheduledDeliveryDate,
      };
    });

    return {
      overview: {
        totalOrders,
        activeOrders,
        deliveredOrders,
        failedOrders,
        cancelledOrders,
      },
      recentOrders: formattedRecentOrders,
      activeDeliveries: formattedActiveDeliveries,
      notifications: {
        unreadCount: data.unreadNotificationCount,
        recent: data.notifications,
      },
    };
  }

  /**
   * 2. Delivery Agent Dashboard
   */
  async getAgentDashboard(agentUserId: string, query?: DashboardQueryInput) {
    const limit = query?.limit ?? 5;
    const data = await this.repo.getAgentDashboardData(agentUserId, limit);

    if (!data.agentProfile) {
      throw new NotFoundError(
        `Delivery agent profile for user '${agentUserId}' not found`
      );
    }

    const profile = data.agentProfile;
    const capacityRemaining = Math.max(
      0,
      profile.maxConcurrentOrders - profile.activeDeliveryCount
    );

    // Compute workload breakdown by current status of active orders
    const workloadCounts = {
      assigned: 0,
      pickedUp: 0,
      inTransit: 0,
      outForDelivery: 0,
    };

    for (const order of data.activeOrders) {
      if (order.status === OrderStatus.ASSIGNED) workloadCounts.assigned++;
      else if (order.status === OrderStatus.PICKED_UP) workloadCounts.pickedUp++;
      else if (order.status === OrderStatus.IN_TRANSIT) workloadCounts.inTransit++;
      else if (order.status === OrderStatus.OUT_FOR_DELIVERY) workloadCounts.outForDelivery++;
    }

    const totalAttempts = data.totalCompletedCount + data.totalFailedCount;
    const successRate =
      totalAttempts > 0
        ? Number(((data.totalCompletedCount / totalAttempts) * 100).toFixed(2))
        : 0;

    const formattedActiveOrders = data.activeOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      pickupAddress: order.pickupAddress,
      dropAddress: order.dropAddress,
      currentAttempt: order.currentAttempt,
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
      },
      latestTrackingEvent: order.trackingEvents[0] ?? null,
    }));

    const formattedRecentDeliveries = data.recentAttempts.map((attempt) => ({
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      completedAt: attempt.completedAt,
      failedAt: attempt.failedAt,
      failureReason: attempt.failureReason,
      order: attempt.order,
    }));

    return {
      profile: {
        availability: profile.availability,
        currentZone: profile.currentZone
          ? {
              id: profile.currentZone.id,
              name: profile.currentZone.name,
              code: profile.currentZone.code,
            }
          : null,
        activeDeliveryCount: profile.activeDeliveryCount,
        maxConcurrentOrders: profile.maxConcurrentOrders,
        capacityRemaining,
        vehicleType: profile.vehicleType,
        vehicleNumber: profile.vehicleNumber,
      },
      workload: {
        ...workloadCounts,
        completedToday: data.completedTodayCount,
        failedToday: data.failedTodayCount,
      },
      activeOrders: formattedActiveOrders,
      recentDeliveries: formattedRecentDeliveries,
      performance: {
        totalCompleted: data.totalCompletedCount,
        totalFailed: data.totalFailedCount,
        successRate,
      },
    };
  }

  /**
   * 3. Admin Operational Dashboard
   */
  async getAdminDashboard(query?: DashboardQueryInput) {
    const limit = query?.limit ?? 5;
    const data = await this.repo.getAdminDashboardData({
      dateFrom: query?.from,
      dateTo: query?.to,
      limit,
    });

    // Orders overview
    const countsMap: Record<string, number> = {};
    for (const item of data.statusCounts) {
      countsMap[item.status] = item._count.id;
    }

    const deliveredOrders = countsMap[OrderStatus.DELIVERED] ?? 0;
    const cancelledOrders = countsMap[OrderStatus.CANCELLED] ?? 0;
    const failedOrders = countsMap[OrderStatus.FAILED] ?? 0;
    const totalOrders = Object.values(countsMap).reduce((acc, count) => acc + count, 0);
    const activeOrders = totalOrders - deliveredOrders - cancelledOrders;

    const totalAttempts = data.totalCompleted + data.totalFailed;
    const successRate =
      totalAttempts > 0
        ? Number(((data.totalCompleted / totalAttempts) * 100).toFixed(2))
        : 0;

    // Agents metrics
    const agents = {
      total: data.agentProfiles.length,
      available: 0,
      busy: 0,
      offline: 0,
      atCapacity: 0,
    };

    for (const agent of data.agentProfiles) {
      if (agent.availability === AgentAvailability.AVAILABLE) agents.available++;
      else if (agent.availability === AgentAvailability.BUSY) agents.busy++;
      else if (agent.availability === AgentAvailability.OFFLINE) agents.offline++;

      if (agent.activeDeliveryCount >= agent.maxConcurrentOrders) {
        agents.atCapacity++;
      }
    }

    // Financial calculations
    let totalOrderValue = 0;
    let deliveredOrderValue = 0;
    let codExpectedValue = 0;

    for (const snap of data.financialSnapshots) {
      const price = snap.pricingSnapshot ? Number(snap.pricingSnapshot.totalCharge) : 0;
      if (snap.status !== OrderStatus.CANCELLED) {
        totalOrderValue += price;
        if (snap.status === OrderStatus.DELIVERED) {
          deliveredOrderValue += price;
        }
        if (snap.paymentType === PaymentType.COD) {
          codExpectedValue += price;
        }
      }
    }

    const ordersByStatus = Object.values(OrderStatus).map((status) => ({
      status,
      count: countsMap[status] ?? 0,
    }));

    const formattedRecentOrders = data.recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      pickupAddress: order.pickupAddress,
      dropAddress: order.dropAddress,
      totalCharge: order.pricingSnapshot ? Number(order.pricingSnapshot.totalCharge) : 0,
      paymentType: order.paymentType,
      customer: order.customer,
      createdAt: order.createdAt,
    }));

    const formattedRecentFailures = data.recentFailures.map((attempt) => ({
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      failureReason: attempt.failureReason,
      failedAt: attempt.failedAt,
      order: attempt.order,
      agent: attempt.agent,
    }));

    return {
      overview: {
        totalOrders,
        activeOrders,
        deliveredOrders,
        failedOrders,
        cancelledOrders,
      },
      deliveryMetrics: {
        completedToday: data.completedToday,
        failedToday: data.failedToday,
        successRate,
      },
      agents,
      financials: {
        totalOrderValue: Number(totalOrderValue.toFixed(2)),
        deliveredOrderValue: Number(deliveredOrderValue.toFixed(2)),
        codExpectedValue: Number(codExpectedValue.toFixed(2)),
      },
      ordersByStatus,
      recentOrders: formattedRecentOrders,
      recentFailures: formattedRecentFailures,
    };
  }
}

export const dashboardService = new DashboardService();
