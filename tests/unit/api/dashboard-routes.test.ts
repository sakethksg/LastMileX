import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getCustomerDashboard } from "@/app/api/dashboard/customer/route";
import { GET as getAgentDashboard } from "@/app/api/agent/dashboard/route";
import { GET as getAdminDashboard } from "@/app/api/admin/dashboard/route";
import { requireAuth, requireRole } from "@/lib/auth/server-auth";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import { UserRole } from "@/types/enums";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/server-auth", () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/services/dashboard/dashboard.service", () => ({
  dashboardService: {
    getCustomerDashboard: vi.fn(),
    getAgentDashboard: vi.fn(),
    getAdminDashboard: vi.fn(),
  },
}));

describe("Dashboard API Routes", () => {
  const customerUser = {
    id: "cust-1",
    email: "customer@example.com",
    name: "Customer",
    role: UserRole.CUSTOMER,
    isActive: true,
  };

  const agentUser = {
    id: "agent-1",
    email: "agent@lastmilex.com",
    name: "Agent",
    role: UserRole.DELIVERY_AGENT,
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

  function createMockRequest(url: string): NextRequest {
    return new NextRequest(new URL(url, "http://localhost:3000"), {
      method: "GET",
      headers: { "content-type": "application/json" },
    });
  }

  describe("Customer Dashboard Route", () => {
    it("returns customer dashboard for authenticated user", async () => {
      vi.mocked(requireAuth).mockResolvedValue(customerUser);
      vi.mocked(dashboardService.getCustomerDashboard).mockResolvedValue({
        summary: { totalOrders: 5, activeOrders: 2 },
      } as any);

      const req = createMockRequest("http://localhost:3000/api/dashboard/customer");
      const res = await getCustomerDashboard(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.summary.totalOrders).toBe(5);
      expect(dashboardService.getCustomerDashboard).toHaveBeenCalledWith("cust-1", expect.anything());
    });

    it("rejects unauthenticated request with 401", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError("Unauthorized"));

      const req = createMockRequest("http://localhost:3000/api/dashboard/customer");
      const res = await getCustomerDashboard(req);
      expect(res.status).toBe(401);
    });
  });

  describe("Agent Dashboard Route", () => {
    it("returns agent dashboard for authenticated agent", async () => {
      vi.mocked(requireRole).mockResolvedValue(agentUser);
      vi.mocked(dashboardService.getAgentDashboard).mockResolvedValue({
        profile: { capacityRemaining: 3 },
      } as any);

      const req = createMockRequest("http://localhost:3000/api/agent/dashboard");
      const res = await getAgentDashboard(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.profile.capacityRemaining).toBe(3);
    });

    it("rejects non-agent with 403", async () => {
      vi.mocked(requireRole).mockRejectedValue(new ForbiddenError("Access denied"));

      const req = createMockRequest("http://localhost:3000/api/agent/dashboard");
      const res = await getAgentDashboard(req);
      expect(res.status).toBe(403);
    });
  });

  describe("Admin Dashboard Route", () => {
    it("returns operational dashboard for admin", async () => {
      vi.mocked(requireRole).mockResolvedValue(adminUser);
      vi.mocked(dashboardService.getAdminDashboard).mockResolvedValue({
        overview: { totalOrders: 100 },
      } as any);

      const req = createMockRequest("http://localhost:3000/api/admin/dashboard?from=2026-08-01&to=2026-08-31");
      const res = await getAdminDashboard(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.overview.totalOrders).toBe(100);
    });

    it("rejects non-admin with 403", async () => {
      vi.mocked(requireRole).mockRejectedValue(new ForbiddenError("Access denied"));

      const req = createMockRequest("http://localhost:3000/api/admin/dashboard");
      const res = await getAdminDashboard(req);
      expect(res.status).toBe(403);
    });
  });
});
