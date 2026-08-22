import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getAgentOrders } from "@/app/api/agent/orders/route";
import { GET as getAgentOrderById } from "@/app/api/agent/orders/[id]/route";
import { requireRole } from "@/lib/auth/server-auth";
import { deliveryAgentService } from "@/services/delivery-agent/delivery-agent.service";
import { UserRole } from "@/types/enums";
import { ForbiddenError, NotFoundError } from "@/lib/errors/app-error";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/server-auth", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/services/delivery-agent/delivery-agent.service", () => ({
  deliveryAgentService: {
    getAgentOrders: vi.fn(),
    getAgentOrderById: vi.fn(),
  },
}));

describe("Agent Assigned Orders API Routes", () => {
  const agentUser = {
    id: "agent-user-1",
    email: "agent@lastmilex.com",
    name: "Delivery Agent",
    role: UserRole.DELIVERY_AGENT,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(url: string): NextRequest {
    return new NextRequest(new URL(url, "http://localhost:3000"), {
      headers: { "content-type": "application/json" },
    });
  }

  it("GET /api/agent/orders rejects non-agent with 403", async () => {
    vi.mocked(requireRole).mockRejectedValue(new ForbiddenError("Access denied"));

    const req = createMockRequest("http://localhost:3000/api/agent/orders");
    const res = await getAgentOrders(req);
    expect(res.status).toBe(403);
  });

  it("GET /api/agent/orders returns assigned orders for authenticated agent", async () => {
    vi.mocked(requireRole).mockResolvedValue(agentUser);
    vi.mocked(deliveryAgentService.getAgentOrders).mockResolvedValue({
      orders: [{ id: "order-1", orderNumber: "LMX-20260822-123456" } as any],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const req = createMockRequest("http://localhost:3000/api/agent/orders?page=1");
    const res = await getAgentOrders(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(deliveryAgentService.getAgentOrders).toHaveBeenCalledWith("agent-user-1", expect.anything());
  });

  it("GET /api/agent/orders/[id] returns order detail when assigned to agent", async () => {
    vi.mocked(requireRole).mockResolvedValue(agentUser);
    vi.mocked(deliveryAgentService.getAgentOrderById).mockResolvedValue({
      id: "order-1",
      orderNumber: "LMX-20260822-123456",
    } as any);

    const req = createMockRequest("http://localhost:3000/api/agent/orders/order-1");
    const res = await getAgentOrderById(req, { params: Promise.resolve({ id: "order-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe("order-1");
  });
});
