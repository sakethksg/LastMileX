import { z } from "zod";
import { CustomerType, PaymentType, RouteType } from "@/types/enums";

export const calculateQuoteSchema = z.object({
  pickupAddress: z.string().min(3, "Pickup address must be at least 3 characters"),
  pickupPinCode: z.string().regex(/^\d{6}$/, "Pickup PIN code must be exactly 6 digits"),
  dropAddress: z.string().min(3, "Drop address must be at least 3 characters"),
  dropPinCode: z.string().regex(/^\d{6}$/, "Drop PIN code must be exactly 6 digits"),
  packageLength: z
    .number()
    .positive("Length must be strictly positive")
    .max(300, "Maximum dimension length is 300 cm"),
  packageBreadth: z
    .number()
    .positive("Breadth must be strictly positive")
    .max(300, "Maximum dimension breadth is 300 cm"),
  packageHeight: z
    .number()
    .positive("Height must be strictly positive")
    .max(300, "Maximum dimension height is 300 cm"),
  actualWeight: z
    .number()
    .positive("Actual weight must be strictly positive")
    .max(1000, "Maximum allowable weight is 1000 kg"),
  customerType: z.nativeEnum(CustomerType).default(CustomerType.B2C),
  paymentType: z.nativeEnum(PaymentType).default(PaymentType.PREPAID),
});

export type CalculateQuoteInput = z.input<typeof calculateQuoteSchema>;
export type CalculateQuoteOutput = z.infer<typeof calculateQuoteSchema>;

export interface QuoteBreakdown {
  pickupZone: {
    id: string;
    code: string;
    name: string;
  };
  dropZone: {
    id: string;
    code: string;
    name: string;
  };
  routeType: RouteType;
  customerType: CustomerType;
  paymentType: PaymentType;
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  rateCardId: string;
  rateCardName: string;
  weightSlabId: string;
  deliveryCharge: number;
  codSurcharge: number;
  totalCharge: number;
  currency: string;
}
