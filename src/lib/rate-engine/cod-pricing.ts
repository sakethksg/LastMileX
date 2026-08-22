import { PaymentType, SurchargeType } from "@/types/enums";

export interface CodSurchargeRuleDefinition {
  id: string;
  surchargeType: SurchargeType;
  surchargeValue: number;
  minSurcharge?: number | null;
  maxSurcharge?: number | null;
}

/**
 * Calculates COD surcharge based on payment type, base delivery charge, and rule.
 * Rules:
 * - If PREPAID: surcharge = 0
 * - If COD + FLAT: surcharge = surchargeValue
 * - If COD + PERCENTAGE: surcharge = (deliveryCharge * surchargeValue / 100), bounded by min/max
 * Rounding: 2 decimal places
 */
export function calculateCodSurchargeAmount(
  paymentType: PaymentType,
  deliveryCharge: number,
  rule?: CodSurchargeRuleDefinition | null
): number {
  if (paymentType !== PaymentType.COD || !rule) {
    return 0;
  }

  if (deliveryCharge < 0) {
    throw new Error("Delivery charge cannot be negative");
  }

  let surcharge: number;

  if (rule.surchargeType === SurchargeType.FLAT) {
    surcharge = rule.surchargeValue;
  } else {
    // PERCENTAGE
    surcharge = (deliveryCharge * rule.surchargeValue) / 100;

    if (rule.minSurcharge !== undefined && rule.minSurcharge !== null && surcharge < rule.minSurcharge) {
      surcharge = rule.minSurcharge;
    }

    if (rule.maxSurcharge !== undefined && rule.maxSurcharge !== null && surcharge > rule.maxSurcharge) {
      surcharge = rule.maxSurcharge;
    }
  }

  return Math.round(surcharge * 100) / 100;
}
