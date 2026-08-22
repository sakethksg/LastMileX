import { describe, it, expect, vi, beforeEach } from "vitest";
import { CodSurchargeService } from "@/services/cod-surcharge/cod-surcharge.service";
import { CodSurchargeRepository } from "@/repositories/cod-surcharge.repository";
import { RouteType, SurchargeType } from "@/types/enums";
import { ValidationError } from "@/lib/errors/app-error";

describe("CodSurchargeService", () => {
  let codService: CodSurchargeService;
  let mockCodRepo: {
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockCodRepo = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
    };
    codService = new CodSurchargeService(mockCodRepo as unknown as CodSurchargeRepository);
  });

  it("creates a flat COD surcharge rule successfully", async () => {
    mockCodRepo.create.mockResolvedValue({
      id: "cod-1",
      routeType: RouteType.INTRA_ZONE,
      surchargeType: SurchargeType.FLAT,
      surchargeValue: 40,
      isActive: true,
    });

    const result = await codService.createCodSurcharge({
      routeType: RouteType.INTRA_ZONE,
      surchargeType: SurchargeType.FLAT,
      surchargeValue: 40,
      effectiveFrom: new Date("2026-01-01"),
    });

    expect(result.id).toBe("cod-1");
  });

  it("rejects percentage surcharge > 100%", async () => {
    await expect(
      codService.createCodSurcharge({
        routeType: RouteType.INTER_ZONE,
        surchargeType: SurchargeType.PERCENTAGE,
        surchargeValue: 120, // > 100%
        effectiveFrom: new Date("2026-01-01"),
      })
    ).rejects.toThrow(ValidationError);
  });

  it("rejects when maxSurcharge < minSurcharge", async () => {
    await expect(
      codService.createCodSurcharge({
        routeType: RouteType.INTER_ZONE,
        surchargeType: SurchargeType.PERCENTAGE,
        surchargeValue: 2.5,
        minSurcharge: 200,
        maxSurcharge: 50, // Less than min
        effectiveFrom: new Date("2026-01-01"),
      })
    ).rejects.toThrow(ValidationError);
  });
});
