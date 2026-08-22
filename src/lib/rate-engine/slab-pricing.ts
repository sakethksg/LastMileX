export interface WeightSlabDefinition {
  id: string;
  minWeight: number;
  maxWeight: number;
  basePrice: number;
  perKgRate: number;
}

/**
 * Resolves the matching weight slab for a given chargeable weight.
 * Selection rule:
 * - If w === 0: matches slab with minWeight === 0
 * - If w > 0: matches slab where (minWeight < w && w <= maxWeight)
 *   or for the first slab starting at 0, (0 <= w && w <= maxWeight)
 */
export function findMatchingWeightSlab(
  slabs: WeightSlabDefinition[],
  chargeableWeightKg: number
): WeightSlabDefinition | null {
  if (!slabs || slabs.length === 0) {
    return null;
  }

  const sorted = [...slabs].sort((a, b) => a.minWeight - b.minWeight);

  for (const slab of sorted) {
    if (slab.minWeight === 0 && chargeableWeightKg >= 0 && chargeableWeightKg <= slab.maxWeight) {
      return slab;
    }

    if (chargeableWeightKg > slab.minWeight && chargeableWeightKg <= slab.maxWeight) {
      return slab;
    }
  }

  return null;
}

/**
 * Calculates delivery charge using the approved weight slab semantics.
 * Formula:
 * - If chargeableWeight <= slab.minWeight: slab.basePrice
 * - If chargeableWeight > slab.minWeight: slab.basePrice + (chargeableWeight - slab.minWeight) * slab.perKgRate
 * Rounding: 2 decimal places
 */
export function calculateSlabDeliveryCharge(
  slab: WeightSlabDefinition,
  chargeableWeightKg: number
): number {
  if (chargeableWeightKg < 0) {
    throw new Error("Chargeable weight cannot be negative");
  }

  if (chargeableWeightKg <= slab.minWeight) {
    return Math.round(slab.basePrice * 100) / 100;
  }

  const additionalWeight = chargeableWeightKg - slab.minWeight;
  const charge = slab.basePrice + additionalWeight * slab.perKgRate;
  return Math.round(charge * 100) / 100;
}
