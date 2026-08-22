import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getCustomerOrders, POST as createCustomerOrder } from "@/app/api/orders/route";
import { GET as getCustomerOrderById } from "@/app/api/orders/[id]/route";
import { GET as getAdminOrders, POST as createAdminOrder } from "@/app/api/admin/orders/route";
import { GET as getAdminOrderById } from "@/app/api/admin/orders/[id]/route";
import { PATCH as updateOrderStatus } from "@/app/api/admin/orders/[id]/status/route";
import { requireAuth, requireRole } from "@/lib/auth/server-auth";
import { orderService } from "@/services/order/order.service";
import { UserRole, OrderStatus, CustomerType, PaymentType } from "@/types/enums";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors/app-error";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/server-auth", () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/services/order/order.service", () => ({
  orderService: {
    createCustomerOrder: vi.fn(),
    createAdminOrder: vi.fn(),
    getCustomerOrders: vi.fn(),
    getCustomerOrderById: vi.fn(),
    getAdminOrders: vi.fn(),
    getAdminOrderById: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

describe("Order API Routes", () => {
  const customerUser = {
    id: "cust-1",
    email: "customer@example.com",
    name: "Customer",
    role: UserRole.CUSTOMER,
    isActive: true,
  };

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

  describe("Customer Order Endpoints", () => {
    it("POST /api/orders rejects unauthenticated requests with 401", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError("Authentication required"));

      const req = createMockRequest("http://localhost:3000/api/orders", {}, "POST");
      const res = await createCustomerOrder(req);
      expect(res.status).toBe(401);
    });

    it("POST /api/orders creates order for authenticated customer (201)", async () => {
      vi.mocked(requireAuth).mockResolvedValue(customerUser);
      vi.mocked(orderService.createCustomerOrder).mockResolvedValue({
        id: "order-1",
        orderNumber: "LMX-20260822-123456",
        status: OrderStatus.CREATED,
      } as any);

      const req = createMockRequest(
        "http://localhost:3000/api/orders",
        {
          pickupAddress: "Connaught Place",
          pickupPinCode: "110001",
          dropAddress: "Indiranagar",
          dropPinCode: "560038",
          packageLength: 20,
          packageBreadth: 15,
          packageHeight: 10,
          actualWeight: 1.2,
          paymentType: PaymentType.PREPAID,
        },
        "POST"
      );

      const res = await createCustomerOrder(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.orderNumber).toBe("LMX-20260822-123456");
      expect(orderService.createCustomerOrder).toHaveBeenCalledWith(customerUser.id, expect.anything());
    });

    it("GET /api/orders returns customer's orders", async () => {
      vi.mocked(requireAuth).mockResolvedValue(customerUser);
      vi.mocked(orderService.getCustomerOrders).mockResolvedValue({
        orders: [{ id: "order-1", orderNumber: "LMX-20260822-123456" } as any],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const req = createMockRequest("http://localhost:3000/api/orders?page=1");
      const res = await getCustomerOrders(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
    });

    it("GET /api/orders/[id] returns order detail for owner", async () => {
      vi.mocked(requireAuth).mockResolvedValue(customerUser);
      vi.mocked(orderService.getCustomerOrderById).mockResolvedValue({
        id: "order-1",
        customerId: customerUser.id,
        orderNumber: "LMX-20260822-123456",
      } as any);

      const req = createMockRequest("http://localhost:3000/api/orders/order-1");
      const res = await getCustomerOrderById(req, { params: Promise.resolve({ id: "order-1" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe("order-1");
    });
  });

  describe("Admin Order Endpoints", () => {
    it("GET /api/admin/orders rejects non-admin users with 403", async () => {
      vi.mocked(requireRole).mockRejectedValue(new ForbiddenError("Access denied"));

      const req = createMockRequest("http://localhost:3000/api/admin/orders");
      const res = await getAdminOrders(req);
      expect(res.status).toBe(403);
    });

    it("GET /api/admin/orders allows ADMIN to list all orders", async () => {
      vi.mocked(requireRole).mockResolvedValue(adminUser);
      vi.mocked(orderService.getAdminOrders).mockResolvedValue({
        orders: [{ id: "order-1" } as any, { id: "order-2" } as any],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      });

      const req = createMockRequest("http://localhost:3000/api/admin/orders");
      const res = await getAdminOrders(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toHaveLength(2);
    });

    it("PATCH /api/admin/orders/[id]/status updates order status", async () => {
      vi.mocked(requireRole).mockResolvedValue(adminUser);
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue({
        id: "order-1",
        status: OrderStatus.CONFIRMED,
      } as any);

      const req = createMockRequest(
        "http://localhost:3000/api/admin/orders/order-1/status",
        { status: OrderStatus.CONFIRMED, note: "Confirmed by admin" },
        "PATCH"
      );

      const res = await updateOrderStatus(req, { params: Promise.resolve({ id: "order-1" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe(OrderStatus.CONFIRMED);
    });
  });
});
