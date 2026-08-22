import {
  deliveryAgentRepository,
  DeliveryAgentRepository,
} from "@/repositories/delivery-agent.repository";
import { orderRepository, OrderRepository } from "@/repositories/order.repository";
import {
  AgentQueryInput,
  UpdateAgentProfileInput,
} from "@/schemas/delivery-agent.schema";
import {
  scoreCandidateAgent,
  rankCandidateAgents,
  filterEligibleAgents,
} from "@/lib/assignment/agent-selection";
import { AssignmentType, OrderStatus, UserRole } from "@/types/enums";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from "@/lib/errors/app-error";

export class DeliveryAgentService {
  constructor(
    private readonly agentRepo: DeliveryAgentRepository = deliveryAgentRepository,
    private readonly orderRepo: OrderRepository = orderRepository
  ) {}

  async getAgentById(userId: string) {
    const agent = await this.agentRepo.findById(userId);
    if (!agent) {
      throw new NotFoundError(`Delivery agent with ID '${userId}' not found`);
    }
    return agent;
  }

  async listAgents(query?: AgentQueryInput) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { total, agents } = await this.agentRepo.listAgents({
      availability: query?.availability,
      currentZoneId: query?.currentZoneId,
      isActive: query?.isActive,
      search: query?.search,
      skip,
      take: limit,
    });

    return {
      agents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateAgentProfile(userId: string, input: UpdateAgentProfileInput) {
    const existing = await this.agentRepo.findProfileByUserId(userId);
    if (!existing) {
      throw new NotFoundError(`Delivery agent profile for user '${userId}' not found`);
    }

    return this.agentRepo.updateProfile(userId, input);
  }

  async manualAssignOrder(
    orderId: string,
    targetAgentUserId: string,
    assignedById: string,
    notes?: string | null
  ) {
    // 1. Fetch and validate order
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }

    if (
      order.status !== OrderStatus.CONFIRMED &&
      order.status !== OrderStatus.RESCHEDULED &&
      order.status !== OrderStatus.ASSIGNED
    ) {
      throw new ValidationError(
        `Order is in '${order.status}' status and cannot be assigned. Only CONFIRMED, RESCHEDULED, or ASSIGNED orders can be assigned.`
      );
    }

    // 2. Fetch and validate agent
    const agent = await this.agentRepo.findById(targetAgentUserId);
    if (!agent || !agent.deliveryAgentProfile) {
      throw new NotFoundError(
        `Delivery agent with ID '${targetAgentUserId}' not found or profile missing`
      );
    }

    if (!agent.isActive) {
      throw new ValidationError(`Agent '${agent.name}' is deactivated`);
    }

    const profile = agent.deliveryAgentProfile;
    if (profile.activeDeliveryCount >= profile.maxConcurrentOrders) {
      throw new ConflictError(
        `Agent '${agent.name}' has reached maximum concurrent capacity (${profile.activeDeliveryCount}/${profile.maxConcurrentOrders})`
      );
    }

    // 3. Perform atomic assignment transaction
    return this.agentRepo.assignOrderTransaction({
      orderId,
      targetAgentUserId,
      assignedById,
      assignmentType: AssignmentType.MANUAL,
      actorRole: UserRole.ADMIN,
      notes,
    });
  }

  async autoAssignOrder(orderId: string, assignedById: string, notes?: string | null) {
    // 1. Fetch order
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }

    if (
      order.status !== OrderStatus.CONFIRMED &&
      order.status !== OrderStatus.RESCHEDULED &&
      order.status !== OrderStatus.ASSIGNED
    ) {
      throw new ValidationError(
        `Order is in '${order.status}' status and cannot be auto-assigned. Only CONFIRMED, RESCHEDULED, or ASSIGNED orders can be assigned.`
      );
    }

    // 2. Query candidate agents
    const candidates = await this.agentRepo.findEligibleCandidateAgents(order.pickupZoneId);
    const eligible = filterEligibleAgents(candidates);

    if (eligible.length === 0) {
      throw new NotFoundError("NO_ELIGIBLE_AGENT: No available delivery agents found for assignment");
    }

    // 3. Score and rank candidates
    const scored = eligible.map((agent) =>
      scoreCandidateAgent(agent, order.pickupZoneId, null)
    );
    const ranked = rankCandidateAgents(scored);

    // 4. Attempt assignment with retry on top ranked candidates in case of concurrent claim
    let lastError: Error | null = null;
    const maxRetries = Math.min(3, ranked.length);

    for (let i = 0; i < maxRetries; i++) {
      const candidate = ranked[i].agent;
      try {
        const result = await this.agentRepo.assignOrderTransaction({
          orderId,
          targetAgentUserId: candidate.userId,
          assignedById,
          assignmentType: AssignmentType.AUTO,
          actorRole: UserRole.ADMIN,
          notes: notes ? `Auto-assigned (Rank #${i + 1}): ${notes}` : `Auto-assigned (Rank #${i + 1})`,
        });

        return {
          ...result,
          scoreBreakdown: ranked[i],
        };
      } catch (err: any) {
        lastError = err;
        // If conflict occurs (agent claimed concurrently), proceed to next candidate
        continue;
      }
    }

    throw (
      lastError ??
      new NotFoundError("NO_ELIGIBLE_AGENT: All candidate agents became unavailable during assignment")
    );
  }

  async getAgentOrders(
    agentUserId: string,
    query?: { status?: OrderStatus; page?: number; limit?: number }
  ) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { total, orders } = await this.agentRepo.listAgentOrders(agentUserId, {
      status: query?.status,
      skip,
      take: limit,
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAgentOrderById(agentUserId: string, orderId: string) {
    const order = await this.agentRepo.findAgentOrderById(agentUserId, orderId);
    if (!order) {
      throw new NotFoundError(
        `Order '${orderId}' not found or not currently assigned to authenticated agent`
      );
    }
    return order;
  }
}

export const deliveryAgentService = new DeliveryAgentService();
