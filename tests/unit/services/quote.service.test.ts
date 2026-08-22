import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuoteService } from "@/services/quote/quote.service";
import { ServiceAreaService } from "@/services/service-area/service-area.service";
import { RateCardRepository } from "@/repositories/rate-card.repository";
import { CodSurchargeRepository } from "@/repositories/cod-surcharge.repository";
import { CustomerType, PaymentType, RouteType, SurchargeType } from "@/types/enums";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

describe("QuoteService", () => {
  let quoteService: QuoteService;
  let mockServiceAreaService: {
    resolveZoneByPinCode: ReturnType<typeof vi.fn>;
  };
  let mockRateCardRepo: {
    findApplicableRateCard: ReturnType<typeof vi.fn>;
  };
  let mockCodRepo: {
    findActiveRule: ReturnType<typeof vi.fn>;
  };

  const northZone = {
    id: "zone-north",
    code: "ZONE-NORTH",
    name: "North Delivery Zone",
    isActive: true,
  };

  const southZone = {
    id: "zone-south",
    code: "ZONE-SOUTH",
    name: "South Delivery Zone",
    isActive: true,
  };

  const sampleRateCard = {
    id: "rc-1",
    name: "Standard B2C Card",
    customerType: CustomerType.B2C,
    routeType: RouteType.INTRA_ZONE,
    isActive: true,
    weightSlabs: [
      { id: "slab-1", minWeight: 0.0, maxWeight: 1.0, basePrice: 50.0, perKgRate: 0.0 },
      { id: "slab-2", minWeight: 1.0, maxWeight: 5.0, basePrice: 50.0, perKgRate: 15.0 },
      { id: "slab-3", minWeight: 5.0, maxWeight: 20.0, basePrice: 110.0, perKgRate: 12.0 },
    ],
  };

  beforeEach(() => {
    mockServiceAreaService = {
      resolveZoneByPinCode: vi.fn(),
    };
    mockRateCardRepo = {
      findApplicableRateCard: vi.fn(),
    };
    mockCodRepo = {
      findActiveRule: vi.fn(),
    };

    quoteService = new QuoteService(
      mockServiceAreaService as unknown as ServiceAreaService,
      mockRateCardRepo as unknown as RateCardRepository,
      mockCodRepo as unknown as CodSurchargeRepository
    );
  });

  describe("Zone Resolution & Route Classification", () => {
    it("classifies INTRA_ZONE when pickup and drop PINs are in the same zone", async () => {
      mockServiceAreaService.resolveZoneByPinCode
        .mockResolvedValueOnce({
          serviceArea: { pinCode: "110001", name: "CP", zoneId: northZone.id },
          zone: northZone,
        })
        .mockResolvedValueOnce({
          serviceArea: { pinCode: "110002", name: "Darya Ganj", zoneId: northZone.id },
          zone: northZone,
        });

      mockRateCardRepo.findApplicableRateCard.mockResolvedValue(sampleRateCard);

      const quote = await quoteService.calculateQuote({
        pickupAddress: "CP",
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

      expect(quote.routeType).toBe(RouteType.INTRA_ZONE);
      expect(quote.pickupZone.id).toBe(northZone.id);
      expect(quote.dropZone.id).toBe(northZone.id);
    });

    it("classifies INTER_ZONE when pickup and drop PINs are in different zones", async () => {
      mockServiceAreaService.resolveZoneByPinCode
        .mockResolvedValueOnce({
          serviceArea: { pinCode: "110001", name: "CP", zoneId: northZone.id },
          zone: northZone,
        })
        .mockResolvedValueOnce({
          serviceArea: { pinCode: "560001", name: "MG Road", zoneId: southZone.id },
          zone: southZone,
        });

      mockRateCardRepo.findApplicableRateCard.mockResolvedValue({
        ...sampleRateCard,
        routeType: RouteType.INTER_ZONE,
      });

      const quote = await quoteService.calculateQuote({
        pickupAddress: "CP",
        pickupPinCode: "110001",
        dropAddress: "MG Road",
        dropPinCode: "560001",
        packageLength: 10,
        packageBreadth: 10,
        packageHeight: 10,
        actualWeight: 0.5,
        customerType: CustomerType.B2C,
        paymentType: PaymentType.PREPAID,
      });

      expect(quote.routeType).toBe(RouteType.INTER_ZONE);
      expect(quote.pickupZone.id).toBe(northZone.id);
      expect(quote.dropZone.id).toBe(southZone.id);
    });

    it("throws NotFoundError when pickup PIN code is unserviced", async () => {
      mockServiceAreaService.resolveZoneByPinCode.mockResolvedValueOnce(null);

      await expect(
        quoteService.calculateQuote({
          pickupAddress: "Unknown",
          pickupPinCode: "999999",
          dropAddress: "MG Road",
          dropPinCode: "560001",
          packageLength: 10,
          packageBreadth: 10,
          packageHeight: 10,
          actualWeight: 0.5,
          customerType: CustomerType.B2C,
          paymentType: PaymentType.PREPAID,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when drop PIN code is unserviced", async () => {
      mockServiceAreaService.resolveZoneByPinCode
        .mockResolvedValueOnce({
          serviceArea: { pinCode: "110001", name: "CP", zoneId: northZone.id },
          zone: northZone,
        })
        .mockResolvedValueOnce(null);

      await expect(
        quoteService.calculateQuote({
          pickupAddress: "CP",
          pickupPinCode: "110001",
          dropAddress: "Unknown",
          dropPinCode: "888888",
          packageLength: 10,
          packageBreadth: 10,
          packageHeight: 10,
          actualWeight: 0.5,
          customerType: CustomerType.B2C,
          paymentType: PaymentType.PREPAID,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Rate Card & Weight Pricing", () => {
    beforeEach(() => {
      mockServiceAreaService.resolveZoneByPinCode
        .mockResolvedValueOnce({
          serviceArea: { pinCode: "110001", name: "CP", zoneId: northZone.id },
          zone: northZone,
        })
        .mockResolvedValueOnce({
          serviceArea: { pinCode: "110002", name: "Darya Ganj", zoneId: northZone.id },
          zone: northZone,
        });
    });

    it("throws NotFoundError when no applicable rate card exists", async () => {
      mockRateCardRepo.findApplicableRateCard.mockResolvedValue(null);

      await expect(
        quoteService.calculateQuote({
          pickupAddress: "CP",
          pickupPinCode: "110001",
          dropAddress: "Darya Ganj",
          dropPinCode: "110002",
          packageLength: 10,
          packageBreadth: 10,
          packageHeight: 10,
          actualWeight: 1.0,
          customerType: CustomerType.B2C,
          paymentType: PaymentType.PREPAID,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ValidationError when chargeable weight exceeds all weight slabs", async () => {
      mockRateCardRepo.findApplicableRateCard.mockResolvedValue(sampleRateCard);

      await expect(
        quoteService.calculateQuote({
          pickupAddress: "CP",
          pickupPinCode: "110001",
          dropAddress: "Darya Ganj",
          dropPinCode: "110002",
          packageLength: 10,
          packageBreadth: 10,
          packageHeight: 10,
          actualWeight: 35.0, // Exceeds 20 kg max
          customerType: CustomerType.B2C,
          paymentType: PaymentType.PREPAID,
        })
      ).rejects.toThrow(ValidationError);
    });

    it("calculates exact delivery charge for weight entered into Slab 2", async () => {
      mockRateCardRepo.findApplicableRateCard.mockResolvedValue(sampleRateCard);

      // Package: 1.5 kg -> Slab 2 [1 - 5 kg] -> 50 + (0.5 * 15) = 57.50
      const quote = await quoteService.calculateQuote({
        pickupAddress: "CP",
        pickupPinCode: "110001",
        dropAddress: "Darya Ganj",
        dropPinCode: "110002",
        packageLength: 10,
        packageBreadth: 10,
        packageHeight: 10,
        actualWeight: 1.5,
        customerType: CustomerType.B2C,
        paymentType: PaymentType.PREPAID,
      });

      expect(quote.chargeableWeight).toBe(1.5);
      expect(quote.deliveryCharge).toBe(57.5);
      expect(quote.codSurcharge).toBe(0);
      expect(quote.totalCharge).toBe(57.5);
    });
  });

  describe("COD Surcharge Application", () => {
    beforeEach(() => {
      mockServiceAreaService.resolveZoneByPinCode
        .mockResolvedValueOnce({
          serviceArea: { pinCode: "110001", name: "CP", zoneId: northZone.id },
          zone: northZone,
        })
        .mockResolvedValueOnce({
          serviceArea: { pinCode: "110002", name: "Darya Ganj", zoneId: northZone.id },
          zone: northZone,
        });

      mockRateCardRepo.findApplicableRateCard.mockResolvedValue(sampleRateCard);
    });

    it("adds FLAT COD surcharge when paymentType is COD", async () => {
      mockCodRepo.findActiveRule.mockResolvedValue({
        id: "cod-1",
        routeType: RouteType.INTRA_ZONE,
        surchargeType: SurchargeType.FLAT,
        surchargeValue: 40.0,
      });

      const quote = await quoteService.calculateQuote({
        pickupAddress: "CP",
        pickupPinCode: "110001",
        dropAddress: "Darya Ganj",
        dropPinCode: "110002",
        packageLength: 10,
        packageBreadth: 10,
        packageHeight: 10,
        actualWeight: 0.5, // Slab 1 -> ₹50
        customerType: CustomerType.B2C,
        paymentType: PaymentType.COD,
      });

      expect(quote.deliveryCharge).toBe(50.0);
      expect(quote.codSurcharge).toBe(40.0);
      expect(quote.totalCharge).toBe(90.0);
    });

    it("adds PERCENTAGE COD surcharge with min cap", async () => {
      mockCodRepo.findActiveRule.mockResolvedValue({
        id: "cod-2",
        routeType: RouteType.INTRA_ZONE,
        surchargeType: SurchargeType.PERCENTAGE,
        surchargeValue: 2.0, // 2% of ₹50 = ₹1
        minSurcharge: 25.0, // Min cap
        maxSurcharge: 100.0,
      });

      const quote = await quoteService.calculateQuote({
        pickupAddress: "CP",
        pickupPinCode: "110001",
        dropAddress: "Darya Ganj",
        dropPinCode: "110002",
        packageLength: 10,
        packageBreadth: 10,
        packageHeight: 10,
        actualWeight: 0.5, // Slab 1 -> ₹50
        customerType: CustomerType.B2C,
        paymentType: PaymentType.COD,
      });

      expect(quote.deliveryCharge).toBe(50.0);
      expect(quote.codSurcharge).toBe(25.0); // Capped at min ₹25
      expect(quote.totalCharge).toBe(75.0);
    });
  });
});
