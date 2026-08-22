/**
 * Calculate volumetric weight in kilograms from package dimensions in centimeters.
 * Formula: (length * breadth * height) / 5000
 * Standard logistics divisor: 5000 cm³/kg
 * Rounding: 2 decimal places
 */
export function calculateVolumetricWeight(
  lengthCm: number,
  breadthCm: number,
  heightCm: number
): number {
  if (lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0) {
    throw new Error("Dimensions must all be greater than zero");
  }

  const rawVolumetricWeight = (lengthCm * breadthCm * heightCm) / 5000;
  return Math.round(rawVolumetricWeight * 100) / 100;
}
