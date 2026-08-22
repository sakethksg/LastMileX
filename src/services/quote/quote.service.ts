import { serviceAreaService, ServiceAreaService } from "@/services/service-area/service-area.service";
import { rateCardRepository, RateCardRepository } from "@/repositories/rate-card.repository";
import { codSurchargeRepository, CodSurchargeRepository } from "@/repositories/cod-surcharge.repository";
import { CalculateQuoteInput, QuoteBreakdown } from "@/schemas/quote.schema";
import { RouteType, PaymentType, CustomerType } from "@/types/enums";
import { calculateVolumetricWeight } from "@/lib/rate-engine/volumetric-weight";
import { calculateChargeableWeight } from "@/lib/rate-engine/chargeable-weight";
import { findMatchingWeightSlab, calculateSlabDeliveryCharge } from "@/lib/rate-engine/slab-pricing";
import { calculateCodSurchargeAmount } from "@/lib/rate-engine/cod-pricing";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

export class QuoteService {
  constructor(
    private readonly serviceAreaServiceInstance: ServiceAreaService = serviceAreaService,
    private readonly rateCardRepo: RateCardRepository = rateCardRepository,
    private readonly codRepo: CodSurchargeRepository = codSurchargeRepository
  ) {}

  async calculateQuote(input: CalculateQuoteInput, date = new Date()): Promise<QuoteBreakdown> {
    // 1. Resolve Pickup Zone
    const pickupResolution = await this.serviceAreaServiceInstance.resolveZoneByPinCode(
      input.pickupPinCode
    );
    if (!pickupResolution) {
      throw new NotFoundError(
        `Pickup PIN code '${input.pickupPinCode}' is not currently serviceable or is inactive`
      );
    }
    const pickupZone = pickupResolution.zone;

    // 2. Resolve Drop Zone
    const dropResolution = await this.serviceAreaServiceInstance.resolveZoneByPinCode(
      input.dropPinCode
    );
    if (!dropResolution) {
      throw new NotFoundError(
        `Drop PIN code '${input.dropPinCode}' is not currently serviceable or is inactive`
      );
    }
    const dropZone = dropResolution.zone;

    // 3. Classify Route Type
    const routeType =
      pickupZone.id === dropZone.id ? RouteType.INTRA_ZONE : RouteType.INTER_ZONE;

    // 4. Calculate Volumetric Weight
    const volumetricWeight = calculateVolumetricWeight(
      input.packageLength,
      input.packageBreadth,
      input.packageHeight
    );

    // 5. Calculate Chargeable Weight
    const chargeableWeight = calculateChargeableWeight(input.actualWeight, volumetricWeight);

    // 6. Find Applicable Rate Card
    const customerType = input.customerType ?? CustomerType.B2C;
    const rateCard = await this.rateCardRepo.findApplicableRateCard({
      customerType,
      routeType,
      sourceZoneId: pickupZone.id,
      destinationZoneId: dropZone.id,
      date,
    });

    if (!rateCard) {
      throw new NotFoundError(
        `No active rate card found for ${customerType} ${routeType} from ${pickupZone.name} to ${dropZone.name}`
      );
    }

    // 7. Resolve Weight Slab
    const slabDefinitions = rateCard.weightSlabs.map((s) => ({
      id: s.id,
      minWeight: Number(s.minWeight),
      maxWeight: Number(s.maxWeight),
      basePrice: Number(s.basePrice),
      perKgRate: Number(s.perKgRate),
    }));

    const matchedSlab = findMatchingWeightSlab(slabDefinitions, chargeableWeight);
    if (!matchedSlab) {
      throw new ValidationError(
        `Chargeable weight (${chargeableWeight} kg) exceeds maximum weight coverage for rate card '${rateCard.name}'`
      );
    }

    // 8. Calculate Base Delivery Charge
    const deliveryCharge = calculateSlabDeliveryCharge(matchedSlab, chargeableWeight);

    // 9. Calculate COD Surcharge
    const paymentType = input.paymentType ?? PaymentType.PREPAID;
    let codSurcharge = 0;

    if (paymentType === PaymentType.COD) {
      const codRule = await this.codRepo.findActiveRule(routeType, date);
      if (codRule) {
        codSurcharge = calculateCodSurchargeAmount(paymentType, deliveryCharge, {
          id: codRule.id,
          surchargeType: codRule.surchargeType,
          surchargeValue: Number(codRule.surchargeValue),
          minSurcharge: codRule.minSurcharge !== null ? Number(codRule.minSurcharge) : null,
          maxSurcharge: codRule.maxSurcharge !== null ? Number(codRule.maxSurcharge) : null,
        });
      }
    }

    // 10. Calculate Total Charge
    const totalCharge = Math.round((deliveryCharge + codSurcharge) * 100) / 100;

    return {
      pickupZone: {
        id: pickupZone.id,
        code: pickupZone.code,
        name: pickupZone.name,
      },
      dropZone: {
        id: dropZone.id,
        code: dropZone.code,
        name: dropZone.name,
      },
      routeType,
      customerType,
      paymentType,
      actualWeight: input.actualWeight,
      volumetricWeight,
      chargeableWeight,
      rateCardId: rateCard.id,
      rateCardName: rateCard.name,
      weightSlabId: matchedSlab.id,
      deliveryCharge,
      codSurcharge,
      totalCharge,
      currency: "INR",
    };
  }
}

export const quoteService = new QuoteService();
