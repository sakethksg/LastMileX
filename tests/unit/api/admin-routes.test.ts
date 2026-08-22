import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getZones, POST as createZone } from "@/app/api/admin/zones/route";
import { GET as getServiceAreas, POST as createServiceArea } from "@/app/api/admin/service-areas/route";
import { GET as getRateCards, POST as createRateCard } from "@/app/api/admin/rate-cards/route";
import { GET as getCodSurcharges, POST as createCodSurcharge } from "@/app/api/admin/cod-surcharges/route";
import { requireRole } from "@/lib/auth/server-auth";
import { zoneService } from "@/services/zone/zone.service";
import { serviceAreaService } from "@/services/service-area/service-area.service";
import { rateCardService } from "@/services/rate-card/rate-card.service";
import { codSurchargeService } from "@/services/cod-surcharge/cod-surcharge.service";
import { UserRole } from "@/types/enums";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/server-auth", () => ({
  requireRole: vi.fn(),
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("@/services/zone/zone.service", () => ({
  zoneService: {
    listZones: vi.fn(),
    createZone: vi.fn(),
    getZoneById: vi.fn(),
    updateZone: vi.fn(),
  },
}));

vi.mock("@/services/service-area/service-area.service", () => ({
  serviceAreaService: {
    listServiceAreas: vi.fn(),
    createServiceArea: vi.fn(),
    getServiceAreaById: vi.fn(),
    updateServiceArea: vi.fn(),
  },
}));

vi.mock("@/services/rate-card/rate-card.service", () => ({
  rateCardService: {
    listRateCards: vi.fn(),
    createRateCard: vi.fn(),
    getRateCardById: vi.fn(),
    updateRateCard: vi.fn(),
  },
}));

vi.mock("@/services/cod-surcharge/cod-surcharge.service", () => ({
  codSurchargeService: {
    listCodSurcharges: vi.fn(),
    createCodSurcharge: vi.fn(),
    getCodSurchargeById: vi.fn(),
    updateCodSurcharge: vi.fn(),
  },
}));

describe("Admin Route Handlers RBAC & Error Handling", () => {
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

  describe("Authentication & Authorization Gates", () => {
    it("rejects unauthenticated requests with 401", async () => {
      vi.mocked(requireRole).mockRejectedValue(new UnauthorizedError("Authentication required"));

      const req = createMockRequest("http://localhost:3000/api/admin/zones");
      const res = await getZones(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects CUSTOMER role with 403 Forbidden", async () => {
      vi.mocked(requireRole).mockRejectedValue(
        new ForbiddenError("Access denied. Requires 'ADMIN' role")
      );

      const req = createMockRequest("http://localhost:3000/api/admin/zones");
      const res = await getZones(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("allows ADMIN role and calls service", async () => {
      vi.mocked(requireRole).mockResolvedValue({
        id: "admin-1",
        email: "admin@lastmilex.com",
        name: "Admin",
        role: UserRole.ADMIN,
        isActive: true,
      });

      vi.mocked(zoneService.listZones).mockResolvedValue({
        zones: [
          {
            id: "zone-1",
            name: "North",
            code: "ZONE-NORTH",
            description: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { serviceAreas: 0 },
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const req = createMockRequest("http://localhost:3000/api/admin/zones?page=1");
      const res = await getZones(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
    });
  });

  describe("Validation Error Handling on Mutations", () => {
    it("returns 422 Unprocessable Entity for invalid zone payload", async () => {
      vi.mocked(requireRole).mockResolvedValue({
        id: "admin-1",
        email: "admin@lastmilex.com",
        name: "Admin",
        role: UserRole.ADMIN,
        isActive: true,
      });

      const req = createMockRequest("http://localhost:3000/api/admin/zones", { code: "invalid code!" }, "POST");
      const res = await createZone(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
