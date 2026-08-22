import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as pickupRoute } from "@/app/api/agent/orders/[id]/pickup/route";
import { POST as startDeliveryRoute } from "@/app/api/agent/orders/[id]/start-delivery/route";
import { POST as outForDeliveryRoute } from "@/app/api/agent/orders/[id]/out-for-delivery/route";
import { POST as completeDeliveryRoute } from "@/app/api/agent/orders/[id]/complete-delivery/route";
import { POST as failDeliveryRoute } from "@/app/api/agent/orders/[id]/fail-delivery/route";
import { POST as customerRescheduleRoute } from "@/app/api/orders/[id]/reschedule/route";
import { POST as adminRescheduleRoute } from "@/app/api/admin/orders/[id]/reschedule/route";
import { requireAuth, requireRole } from "@/lib/auth/server-auth";
import { deliveryExecutionService } from "@/services/delivery-agent/delivery-execution.service";
import { UserRole, OrderStatus } from "@/types/enums";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/server-auth", () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/services/delivery-agent/delivery-execution.service", () => ({
  deliveryExecutionService: {
    pickupOrder: vi.fn(),
    startDelivery: vi.fn(),
    markOutForDelivery: vi.fn(),
    completeDelivery: vi.fn(),
    failDelivery: vi.fn(),
    rescheduleOrder: vi.fn(),
  },
}));

describe("Delivery Execution & Reschedule API Routes", () => {
  const agentUser = {
    id: "agent-1",
    email: "agent@lastmilex.com",
    name: "Agent",
    role: UserRole.DELIVERY_AGENT,
    isActive: true,
  };

  const customerUser = {
    id: "customer-1",
    email: "customer@example.com",
    name: "Customer",
    role: UserRole.CUSTOMER,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(url: string, body?: any): NextRequest {
    return new NextRequest(new URL(url, "http://localhost:3000"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  it("POST /api/agent/orders/[id]/pickup executes pickup for agent", async () => {
    vi.mocked(requireRole).mockResolvedValue(agentUser);
    vi.mocked(deliveryExecutionService.pickupOrder).mockResolvedValue({
      order: { id: "order-1", status: OrderStatus.PICKED_UP } as any,
      trackingEvent: { id: "t-1" } as any,
    });

    const req = createMockRequest("http://localhost:3000/api/agent/orders/order-1/pickup");
    const res = await pickupRoute(req, { params: Promise.resolve({ id: "order-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.order.status).toBe(OrderStatus.PICKED_UP);
  });

  it("POST /api/agent/orders/[id]/fail-delivery records failure reason", async () => {
    vi.mocked(requireRole).mockResolvedValue(agentUser);
    vi.mocked(deliveryExecutionService.failDelivery).mockResolvedValue({
      order: { id: "order-1", status: OrderStatus.FAILED } as any,
      trackingEvent: { id: "t-1" } as any,
    });

    const req = createMockRequest(
      "http://localhost:3000/api/agent/orders/order-1/fail-delivery",
      { failureReason: "CUSTOMER_UNAVAILABLE", notes: "Door locked" }
    );
    const res = await failDeliveryRoute(req, { params: Promise.resolve({ id: "order-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.order.status).toBe(OrderStatus.FAILED);
    expect(deliveryExecutionService.failDelivery).toHaveBeenCalledWith(
      "order-1",
      "agent-1",
      "CUSTOMER_UNAVAILABLE",
      "Door locked"
    );
  });

  it("POST /api/orders/[id]/reschedule reschedules order for customer", async () => {
    vi.mocked(requireAuth).mockResolvedValue(customerUser);
    vi.mocked(deliveryExecutionService.rescheduleOrder).mockResolvedValue({
      order: { id: "order-1", status: OrderStatus.RESCHEDULED } as any,
      newAttempt: { attemptNumber: 2 } as any,
      trackingEvent: { id: "t-2" } as any,
    });

    const req = createMockRequest(
      "http://localhost:3000/api/orders/order-1/reschedule",
      { scheduledDeliveryDate: "2026-08-25T10:00:00Z", notes: "Morning please" }
    );
    const res = await customerRescheduleRoute(req, { params: Promise.resolve({ id: "order-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.order.status).toBe(OrderStatus.RESCHEDULED);
  });
});
