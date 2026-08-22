import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as listAgents } from "@/app/api/admin/agents/route";
import {
  GET as getAgent,
  PATCH as updateAgent,
} from "@/app/api/admin/agents/[id]/route";
import { POST as assignOrder } from "@/app/api/admin/orders/[id]/assign/route";
import { POST as autoAssignOrder } from "@/app/api/admin/orders/[id]/auto-assign/route";
import { requireRole } from "@/lib/auth/server-auth";
import { deliveryAgentService } from "@/services/delivery-agent/delivery-agent.service";
import { UserRole, AgentAvailability, OrderStatus, AssignmentType } from "@/types/enums";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/server-auth", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/services/delivery-agent/delivery-agent.service", () => ({
  deliveryAgentService: {
    listAgents: vi.fn(),
    getAgentById: vi.fn(),
    updateAgentProfile: vi.fn(),
    manualAssignOrder: vi.fn(),
    autoAssignOrder: vi.fn(),
  },
}));

describe("Admin Agent & Assignment API Routes", () => {
  const adminUser = {
    id: "admin-1",
    email: "admin@lastmilex.com",
    name: "Admin",
    role: UserRole.ADMIN,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(url: string, body?: any, method = "GET"): NextRequest {
    return new NextRequest(new URL(url, "http://localhost:3000"), {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  it("GET /api/admin/agents rejects non-admin with 403", async () => {
    vi.mocked(requireRole).mockRejectedValue(new ForbiddenError("Access denied"));

    const req = createMockRequest("http://localhost:3000/api/admin/agents");
    const res = await listAgents(req);
    expect(res.status).toBe(403);
  });

  it("GET /api/admin/agents returns agents list for ADMIN", async () => {
    vi.mocked(requireRole).mockResolvedValue(adminUser);
    vi.mocked(deliveryAgentService.listAgents).mockResolvedValue({
      agents: [{ id: "agent-1", name: "Agent 1" } as any],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const req = createMockRequest("http://localhost:3000/api/admin/agents");
    const res = await listAgents(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
  });

  it("PATCH /api/admin/agents/[id] updates agent profile", async () => {
    vi.mocked(requireRole).mockResolvedValue(adminUser);
    vi.mocked(deliveryAgentService.updateAgentProfile).mockResolvedValue({
      id: "profile-1",
      availability: AgentAvailability.AVAILABLE,
      maxConcurrentOrders: 6,
    } as any);

    const req = createMockRequest(
      "http://localhost:3000/api/admin/agents/agent-1",
      { maxConcurrentOrders: 6 },
      "PATCH"
    );

    const res = await updateAgent(req, { params: Promise.resolve({ id: "agent-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.maxConcurrentOrders).toBe(6);
  });

  it("POST /api/admin/orders/[id]/assign manually assigns order", async () => {
    vi.mocked(requireRole).mockResolvedValue(adminUser);
    vi.mocked(deliveryAgentService.manualAssignOrder).mockResolvedValue({
      order: { id: "order-1", status: OrderStatus.ASSIGNED },
      assignment: { id: "asgn-1", assignmentType: AssignmentType.MANUAL },
    } as any);

    const req = createMockRequest(
      "http://localhost:3000/api/admin/orders/order-1/assign",
      { agentId: "11111111-1111-1111-1111-111111111111", notes: "Manual dispatch" },
      "POST"
    );

    const res = await assignOrder(req, { params: Promise.resolve({ id: "order-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.order.status).toBe(OrderStatus.ASSIGNED);
  });

  it("POST /api/admin/orders/[id]/auto-assign automatically assigns order", async () => {
    vi.mocked(requireRole).mockResolvedValue(adminUser);
    vi.mocked(deliveryAgentService.autoAssignOrder).mockResolvedValue({
      order: { id: "order-1", status: OrderStatus.ASSIGNED },
      assignment: { id: "asgn-1", assignmentType: AssignmentType.AUTO },
    } as any);

    const req = createMockRequest(
      "http://localhost:3000/api/admin/orders/order-1/auto-assign",
      {},
      "POST"
    );

    const res = await autoAssignOrder(req, { params: Promise.resolve({ id: "order-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.assignment.assignmentType).toBe(AssignmentType.AUTO);
  });
});
