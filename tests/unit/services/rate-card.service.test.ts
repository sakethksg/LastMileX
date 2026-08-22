import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateCardService } from "@/services/rate-card/rate-card.service";
import { RateCardRepository } from "@/repositories/rate-card.repository";
import { ZoneRepository } from "@/repositories/zone.repository";
import { CustomerType, RouteType } from "@/types/enums";
import { ValidationError } from "@/lib/errors/app-error";

describe("RateCardService", () => {
  let rateCardService: RateCardService;
  let mockRateCardRepo: {
    findById: ReturnType<typeof vi.fn>;
    createWithSlabs: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
  };
  let mockZoneRepo: {
    findById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRateCardRepo = {
      findById: vi.fn(),
      createWithSlabs: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
    };
    mockZoneRepo = {
      findById: vi.fn(),
    };
    rateCardService = new RateCardService(
      mockRateCardRepo as unknown as RateCardRepository,
      mockZoneRepo as unknown as ZoneRepository
    );
  });

  describe("Weight Slab Validation", () => {
    it("accepts valid continuous non-overlapping weight slabs", () => {
      const validSlabs = [
        { minWeight: 0, maxWeight: 1, basePrice: 50, perKgRate: 0 },
        { minWeight: 1, maxWeight: 5, basePrice: 50, perKgRate: 15 },
        { minWeight: 5, maxWeight: 20, basePrice: 110, perKgRate: 12 },
      ];

      expect(() => rateCardService.validateWeightSlabs(validSlabs)).not.toThrow();
    });

    it("rejects overlapping weight slabs", () => {
      const overlappingSlabs = [
        { minWeight: 0, maxWeight: 2, basePrice: 50, perKgRate: 0 },
        { minWeight: 1.5, maxWeight: 5, basePrice: 50, perKgRate: 15 }, // Overlaps with 0-2
      ];

      expect(() => rateCardService.validateWeightSlabs(overlappingSlabs)).toThrow(ValidationError);
    });

    it("rejects slabs with maxWeight <= minWeight", () => {
      const invalidSlabs = [{ minWeight: 5, maxWeight: 3, basePrice: 50, perKgRate: 0 }];

      expect(() => rateCardService.validateWeightSlabs(invalidSlabs)).toThrow(ValidationError);
    });

    it("rejects empty slabs array", () => {
      expect(() => rateCardService.validateWeightSlabs([])).toThrow(ValidationError);
    });
  });

  describe("Rate Card Creation", () => {
    it("creates an intra-zone rate card successfully", async () => {
      mockRateCardRepo.createWithSlabs.mockResolvedValue({
        id: "rc-1",
        name: "Intra B2C",
        customerType: CustomerType.B2C,
        routeType: RouteType.INTRA_ZONE,
        isActive: true,
      });

      const result = await rateCardService.createRateCard({
        name: "Intra B2C",
        customerType: CustomerType.B2C,
        routeType: RouteType.INTRA_ZONE,
        effectiveFrom: new Date("2026-01-01"),
        weightSlabs: [{ minWeight: 0, maxWeight: 5, basePrice: 50, perKgRate: 10 }],
      });

      expect(result.id).toBe("rc-1");
      expect(mockRateCardRepo.createWithSlabs).toHaveBeenCalled();
    });

    it("rejects INTER_ZONE card when source and destination zones are identical", async () => {
      mockZoneRepo.findById.mockResolvedValue({ id: "zone-1", name: "Zone 1" });

      await expect(
        rateCardService.createRateCard({
          name: "Inter B2C Invalid",
          customerType: CustomerType.B2C,
          routeType: RouteType.INTER_ZONE,
          sourceZoneId: "zone-1",
          destinationZoneId: "zone-1", // Same zone for INTER_ZONE
          effectiveFrom: new Date("2026-01-01"),
          weightSlabs: [{ minWeight: 0, maxWeight: 5, basePrice: 50, perKgRate: 10 }],
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
