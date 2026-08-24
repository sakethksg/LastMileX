import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardService } from "@/services/dashboard/dashboard.service";
import { DashboardRepository } from "@/repositories/dashboard.repository";
import { OrderStatus, PaymentType, AgentAvailability } from "@/types/enums";
import { NotFoundError } from "@/lib/errors/app-error";

describe("DashboardService", () => {
  let service: DashboardService;
  let mockRepo: {
    getCustomerDashboardData: ReturnType<typeof vi.fn>;
    getAgentDashboardData: ReturnType<typeof vi.fn>;
    getAdminDashboardData: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      getCustomerDashboardData: vi.fn(),
      getAgentDashboardData: vi.fn(),
      getAdminDashboardData: vi.fn(),
    };
    service = new DashboardService(mockRepo as unknown as DashboardRepository);
  });

  describe("getCustomerDashboard", () => {
    it("aggregates customer order counts, active orders, and notifications", async () => {
      mockRepo.getCustomerDashboardData.mockResolvedValue({
        statusCounts: [
          { status: OrderStatus.DELIVERED, _count: { id: 5 } },
          { status: OrderStatus.ASSIGNED, _count: { id: 2 } },
          { status: OrderStatus.FAILED, _count: { id: 1 } },
          { status: OrderStatus.CANCELLED, _count: { id: 1 } },
        ],
        recentOrders: [
          {
            id: "order-1",
            orderNumber: "LMX-123456",
            status: OrderStatus.ASSIGNED,
            pickupAddress: { street: "123 Main" },
            dropAddress: { street: "456 Oak" },
            pricingSnapshot: { totalCharge: 150 },
            paymentType: PaymentType.PREPAID,
            scheduledDeliveryDate: null,
            createdAt: new Date(),
            trackingEvents: [{ status: OrderStatus.ASSIGNED }],
          },
        ],
        activeOrders: [
          {
            id: "order-1",
            orderNumber: "LMX-123456",
            status: OrderStatus.ASSIGNED,
            currentAttempt: 1,
            maxAttempts: 3,
            scheduledDeliveryDate: null,
            assignments: [
              {
                agent: {
                  id: "agent-1",
                  name: "Delivery Agent",
                  phone: "+919876543210",
                  deliveryAgentProfile: { vehicleType: "BIKE" },
                },
              },
            ],
            trackingEvents: [{ status: OrderStatus.ASSIGNED }],
            attempts: [{ attemptNumber: 1 }],
          },
        ],
        notifications: [{ id: "notif-1", subject: "Order Assigned" }],
        unreadNotificationCount: 2,
      });

      const dashboard = await service.getCustomerDashboard("customer-1");

      expect(dashboard.overview.totalOrders).toBe(9);
      expect(dashboard.overview.deliveredOrders).toBe(5);
      expect(dashboard.overview.failedOrders).toBe(1);
      expect(dashboard.overview.cancelledOrders).toBe(1);
      expect(dashboard.overview.activeOrders).toBe(3); // 9 - 5 (delivered) - 1 (cancelled) = 3
      expect(dashboard.recentOrders).toHaveLength(1);
      expect(dashboard.activeDeliveries).toHaveLength(1);
      expect(dashboard.activeDeliveries[0].assignedAgent?.name).toBe("Delivery Agent");
      expect(dashboard.notifications.unreadCount).toBe(2);
    });
  });

  describe("getAgentDashboard", () => {
    it("computes agent capacity, workload breakdown, and success rate safely", async () => {
      mockRepo.getAgentDashboardData.mockResolvedValue({
        agentProfile: {
          id: "prof-1",
          userId: "agent-1",
          availability: AgentAvailability.AVAILABLE,
          activeDeliveryCount: 2,
          maxConcurrentOrders: 5,
          vehicleType: "BIKE",
          vehicleNumber: "KA01AB1234",
          currentZone: { id: "zone-1", name: "Central", code: "CENTRAL" },
        },
        activeOrders: [
          {
            id: "o-1",
            orderNumber: "LMX-1",
            status: OrderStatus.ASSIGNED,
            pickupAddress: {},
            dropAddress: {},
            currentAttempt: 1,
            customer: { name: "Cust 1", phone: "123" },
            trackingEvents: [],
          },
          {
            id: "o-2",
            orderNumber: "LMX-2",
            status: OrderStatus.OUT_FOR_DELIVERY,
            pickupAddress: {},
            dropAddress: {},
            currentAttempt: 1,
            customer: { name: "Cust 2", phone: "456" },
            trackingEvents: [],
          },
        ],
        completedTodayCount: 4,
        failedTodayCount: 1,
        totalCompletedCount: 18,
        totalFailedCount: 2,
        recentAttempts: [],
      });

      const dashboard = await service.getAgentDashboard("agent-1");

      expect(dashboard.profile.capacityRemaining).toBe(3); // 5 - 2 = 3
      expect(dashboard.workload.assigned).toBe(1);
      expect(dashboard.workload.outForDelivery).toBe(1);
      expect(dashboard.workload.completedToday).toBe(4);
      expect(dashboard.workload.failedToday).toBe(1);
      expect(dashboard.performance.totalCompleted).toBe(18);
      expect(dashboard.performance.totalFailed).toBe(2);
      expect(dashboard.performance.successRate).toBe(90); // 18 / (18 + 2) * 100 = 90.00
    });

    it("handles zero denominator safely for agent success rate", async () => {
      mockRepo.getAgentDashboardData.mockResolvedValue({
        agentProfile: {
          id: "prof-1",
          userId: "agent-1",
          availability: AgentAvailability.AVAILABLE,
          activeDeliveryCount: 0,
          maxConcurrentOrders: 5,
          vehicleType: "BIKE",
          currentZone: null,
        },
        activeOrders: [],
        completedTodayCount: 0,
        failedTodayCount: 0,
        totalCompletedCount: 0,
        totalFailedCount: 0,
        recentAttempts: [],
      });

      const dashboard = await service.getAgentDashboard("agent-1");
      expect(dashboard.performance.successRate).toBe(0);
    });

    it("throws NotFoundError if agent profile does not exist", async () => {
      mockRepo.getAgentDashboardData.mockResolvedValue({ agentProfile: null });
      await expect(service.getAgentDashboard("unknown-agent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getAdminDashboard", () => {
    it("aggregates overview, delivery metrics, agents availability, and financials", async () => {
      mockRepo.getAdminDashboardData.mockResolvedValue({
        statusCounts: [
          { status: OrderStatus.DELIVERED, _count: { id: 10 } },
          { status: OrderStatus.ASSIGNED, _count: { id: 3 } },
          { status: OrderStatus.FAILED, _count: { id: 2 } },
        ],
        completedToday: 5,
        failedToday: 1,
        totalCompleted: 20,
        totalFailed: 5,
        agentProfiles: [
          {
            id: "a-1",
            availability: AgentAvailability.AVAILABLE,
            activeDeliveryCount: 2,
            maxConcurrentOrders: 5,
          },
          {
            id: "a-2",
            availability: AgentAvailability.BUSY,
            activeDeliveryCount: 4,
            maxConcurrentOrders: 4,
          },
          {
            id: "a-3",
            availability: AgentAvailability.OFFLINE,
            activeDeliveryCount: 0,
            maxConcurrentOrders: 5,
          },
        ],
        financialSnapshots: [
          {
            status: OrderStatus.DELIVERED,
            paymentType: PaymentType.PREPAID,
            pricingSnapshot: { totalCharge: 100 },
          },
          {
            status: OrderStatus.DELIVERED,
            paymentType: PaymentType.COD,
            pricingSnapshot: { totalCharge: 200 },
          },
          {
            status: OrderStatus.ASSIGNED,
            paymentType: PaymentType.COD,
            pricingSnapshot: { totalCharge: 150 },
          },
        ],
        recentOrders: [],
        recentFailures: [],
      });

      const dashboard = await service.getAdminDashboard();

      expect(dashboard.overview.totalOrders).toBe(15);
      expect(dashboard.overview.deliveredOrders).toBe(10);
      expect(dashboard.overview.activeOrders).toBe(5);
      expect(dashboard.deliveryMetrics.successRate).toBe(80); // 20 / 25 * 100 = 80.00
      expect(dashboard.agents.total).toBe(3);
      expect(dashboard.agents.available).toBe(1);
      expect(dashboard.agents.busy).toBe(1);
      expect(dashboard.agents.offline).toBe(1);
      expect(dashboard.agents.atCapacity).toBe(1);
      expect(dashboard.financials.totalOrderValue).toBe(450);
      expect(dashboard.financials.deliveredOrderValue).toBe(300);
      expect(dashboard.financials.codExpectedValue).toBe(350);
    });
  });
});
