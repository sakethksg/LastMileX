/**
 * Calculate chargeable weight from actual weight and volumetric weight.
 * Formula: MAX(actualWeight, volumetricWeight)
 * Rounding policy: Standard logistics ceiling to nearest 0.5 kg increment
 * Examples: 2.1 kg -> 2.5 kg, 3.0 kg -> 3.0 kg, 3.6 kg -> 4.0 kg
 */
export function calculateChargeableWeight(
  actualWeightKg: number,
  volumetricWeightKg: number
): number {
  if (actualWeightKg <= 0 || volumetricWeightKg <= 0) {
    throw new Error("Weights must be greater than zero");
  }

  const rawMax = Math.max(actualWeightKg, volumetricWeightKg);
  // Round UP to nearest 0.5 kg (e.g. 2.1 -> Math.ceil(4.2) / 2 = 5 / 2 = 2.5)
  return Math.ceil(rawMax * 2) / 2;
}
