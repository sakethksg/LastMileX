import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeliveryAgentService } from "@/services/delivery-agent/delivery-agent.service";
import { DeliveryAgentRepository } from "@/repositories/delivery-agent.repository";
import { OrderRepository } from "@/repositories/order.repository";
import {
  AgentAvailability,
  AssignmentStatus,
  AssignmentType,
  OrderStatus,
  UserRole,
} from "@/types/enums";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors/app-error";

describe("DeliveryAgentService", () => {
  let agentService: DeliveryAgentService;
  let mockAgentRepo: {
    findById: ReturnType<typeof vi.fn>;
    findProfileByUserId: ReturnType<typeof vi.fn>;
    listAgents: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
    findEligibleCandidateAgents: ReturnType<typeof vi.fn>;
    assignOrderTransaction: ReturnType<typeof vi.fn>;
    listAgentOrders: ReturnType<typeof vi.fn>;
    findAgentOrderById: ReturnType<typeof vi.fn>;
  };
  let mockOrderRepo: {
    findById: ReturnType<typeof vi.fn>;
  };

  const sampleAgent = {
    id: "user-agent-1",
    email: "agent1@lastmilex.com",
    name: "Ramesh Agent",
    role: UserRole.DELIVERY_AGENT,
    isActive: true,
    deliveryAgentProfile: {
      id: "profile-1",
      userId: "user-agent-1",
      availability: AgentAvailability.AVAILABLE,
      currentZoneId: "zone-north",
      maxConcurrentOrders: 5,
      activeDeliveryCount: 1,
    },
  };

  const sampleOrder = {
    id: "order-1",
    orderNumber: "LMX-20260822-123456",
    status: OrderStatus.CONFIRMED,
    pickupZoneId: "zone-north",
    dropZoneId: "zone-south",
  };

  beforeEach(() => {
    mockAgentRepo = {
      findById: vi.fn(),
      findProfileByUserId: vi.fn(),
      listAgents: vi.fn(),
      updateProfile: vi.fn(),
      findEligibleCandidateAgents: vi.fn(),
      assignOrderTransaction: vi.fn(),
      listAgentOrders: vi.fn(),
      findAgentOrderById: vi.fn(),
    };

    mockOrderRepo = {
      findById: vi.fn(),
    };

    agentService = new DeliveryAgentService(
      mockAgentRepo as unknown as DeliveryAgentRepository,
      mockOrderRepo as unknown as OrderRepository
    );
  });

  describe("Agent Profile Management", () => {
    it("retrieves agent details for valid agent ID", async () => {
      mockAgentRepo.findById.mockResolvedValue(sampleAgent);

      const result = await agentService.getAgentById("user-agent-1");
      expect(result.id).toBe("user-agent-1");
      expect(result.name).toBe("Ramesh Agent");
    });

    it("throws NotFoundError when agent is not found", async () => {
      mockAgentRepo.findById.mockResolvedValue(null);

      await expect(agentService.getAgentById("unknown-agent")).rejects.toThrow(
        NotFoundError
      );
    });

    it("updates agent profile", async () => {
      mockAgentRepo.findProfileByUserId.mockResolvedValue({
        id: "profile-1",
        userId: "user-agent-1",
      });

      mockAgentRepo.updateProfile.mockResolvedValue({
        id: "profile-1",
        availability: AgentAvailability.AVAILABLE,
        maxConcurrentOrders: 8,
      });

      const result = await agentService.updateAgentProfile("user-agent-1", {
        maxConcurrentOrders: 8,
      });

      expect(mockAgentRepo.updateProfile).toHaveBeenCalledWith("user-agent-1", {
        maxConcurrentOrders: 8,
      });
      expect(result.maxConcurrentOrders).toBe(8);
    });
  });

  describe("Manual Assignment", () => {
    it("successfully assigns agent to CONFIRMED order", async () => {
      mockOrderRepo.findById.mockResolvedValue(sampleOrder);
      mockAgentRepo.findById.mockResolvedValue(sampleAgent);
      mockAgentRepo.assignOrderTransaction.mockResolvedValue({
        order: { ...sampleOrder, status: OrderStatus.ASSIGNED },
        assignment: { id: "asgn-1", agentId: "user-agent-1", status: AssignmentStatus.ACTIVE },
        trackingEvent: { id: "track-1" },
      });

      const result = await agentService.manualAssignOrder(
        "order-1",
        "user-agent-1",
        "admin-1",
        "Priority order"
      );

      expect(mockAgentRepo.assignOrderTransaction).toHaveBeenCalledWith({
        orderId: "order-1",
        targetAgentUserId: "user-agent-1",
        assignedById: "admin-1",
        assignmentType: AssignmentType.MANUAL,
        actorRole: UserRole.ADMIN,
        notes: "Priority order",
      });
      expect(result.order.status).toBe(OrderStatus.ASSIGNED);
    });

    it("rejects assignment for order in CREATED state", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...sampleOrder,
        status: OrderStatus.CREATED,
      });

      await expect(
        agentService.manualAssignOrder("order-1", "user-agent-1", "admin-1")
      ).rejects.toThrow(ValidationError);
    });

    it("rejects assignment when agent is at maximum capacity", async () => {
      mockOrderRepo.findById.mockResolvedValue(sampleOrder);
      mockAgentRepo.findById.mockResolvedValue({
        ...sampleAgent,
        deliveryAgentProfile: {
          ...sampleAgent.deliveryAgentProfile,
          activeDeliveryCount: 5,
          maxConcurrentOrders: 5,
        },
      });

      await expect(
        agentService.manualAssignOrder("order-1", "user-agent-1", "admin-1")
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("Auto Assignment", () => {
    it("selects best agent and assigns order automatically", async () => {
      mockOrderRepo.findById.mockResolvedValue(sampleOrder);
      mockAgentRepo.findEligibleCandidateAgents.mockResolvedValue([
        {
          id: "profile-1",
          userId: "user-agent-1",
          name: "Ramesh Agent",
          email: "agent1@example.com",
          isActive: true,
          availability: AgentAvailability.AVAILABLE,
          currentZoneId: "zone-north",
          maxConcurrentOrders: 5,
          activeDeliveryCount: 0,
          createdAt: new Date(),
        },
      ]);

      mockAgentRepo.assignOrderTransaction.mockResolvedValue({
        order: { ...sampleOrder, status: OrderStatus.ASSIGNED },
        assignment: { id: "asgn-1", agentId: "user-agent-1", assignmentType: AssignmentType.AUTO },
      });

      const result = await agentService.autoAssignOrder("order-1", "admin-1");

      expect(result.assignment.assignmentType).toBe(AssignmentType.AUTO);
      expect(result.scoreBreakdown.agent.userId).toBe("user-agent-1");
    });

    it("throws NotFoundError when no eligible agents exist", async () => {
      mockOrderRepo.findById.mockResolvedValue(sampleOrder);
      mockAgentRepo.findEligibleCandidateAgents.mockResolvedValue([]);

      await expect(
        agentService.autoAssignOrder("order-1", "admin-1")
      ).rejects.toThrow(NotFoundError);
    });
  });
});
