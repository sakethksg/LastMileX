import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as calculateQuoteRoute } from "@/app/api/quotes/route";
import { requireAuth } from "@/lib/auth/server-auth";
import { quoteService } from "@/services/quote/quote.service";
import { UserRole, CustomerType, PaymentType, RouteType } from "@/types/enums";
import { UnauthorizedError } from "@/lib/errors/app-error";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/server-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/services/quote/quote.service", () => ({
  quoteService: {
    calculateQuote: vi.fn(),
  },
}));

describe("Quotes API Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(body?: any): NextRequest {
    return new NextRequest(new URL("http://localhost:3000/api/quotes"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  it("rejects unauthenticated requests with 401", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError("Authentication required"));

    const req = createMockRequest({
      pickupAddress: "CP",
      pickupPinCode: "110001",
      dropAddress: "Darya Ganj",
      dropPinCode: "110002",
      packageLength: 10,
      packageBreadth: 10,
      packageHeight: 10,
      actualWeight: 0.5,
    });

    const res = await calculateQuoteRoute(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it("calculates and returns quote for authenticated user", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: "customer-1",
      email: "customer@example.com",
      name: "Customer",
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    const mockQuoteResult = {
      pickupZone: { id: "z-1", code: "ZONE-NORTH", name: "North" },
      dropZone: { id: "z-1", code: "ZONE-NORTH", name: "North" },
      routeType: RouteType.INTRA_ZONE,
      customerType: CustomerType.B2C,
      paymentType: PaymentType.PREPAID,
      actualWeight: 0.5,
      volumetricWeight: 0.2,
      chargeableWeight: 0.5,
      rateCardId: "rc-1",
      rateCardName: "Intra B2C",
      weightSlabId: "slab-1",
      deliveryCharge: 50.0,
      codSurcharge: 0.0,
      totalCharge: 50.0,
      currency: "INR",
    };

    vi.mocked(quoteService.calculateQuote).mockResolvedValue(mockQuoteResult);

    const req = createMockRequest({
      pickupAddress: "Connaught Place",
      pickupPinCode: "110001",
      dropAddress: "Darya Ganj",
      dropPinCode: "110002",
      packageLength: 10,
      packageBreadth: 10,
      packageHeight: 10,
      actualWeight: 0.5,
      customerType: CustomerType.B2C,
      paymentType: PaymentType.PREPAID,
    });

    const res = await calculateQuoteRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.totalCharge).toBe(50.0);
  });

  it("returns 400 validation error for invalid payload", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: "customer-1",
      email: "customer@example.com",
      name: "Customer",
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    const req = createMockRequest({
      pickupAddress: "CP",
      pickupPinCode: "1100", // Invalid PIN
      dropAddress: "Darya Ganj",
      dropPinCode: "110002",
      packageLength: -10, // Invalid length
      actualWeight: 0,
    });

    const res = await calculateQuoteRoute(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });
});
