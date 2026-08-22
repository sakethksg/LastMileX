import crypto from "crypto";

/**
 * Generates a human-readable, unique order number.
 * Format: LMX-YYYYMMDD-XXXXXX
 * Example: LMX-20260822-A1B2C3
 */
export function generateOrderNumber(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const dateSegment = `${year}${month}${day}`;

  const randomSegment = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `LMX-${dateSegment}-${randomSegment}`;
}
