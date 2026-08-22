import { z } from "zod";
import { OrderStatus, PaymentType } from "@/types/enums";

export const createOrderSchema = z.object({
  pickupAddress: z.string().min(3, "Pickup address must be at least 3 characters").max(500),
  pickupPinCode: z.string().regex(/^\d{6}$/, "Pickup PIN code must be exactly 6 digits"),
  dropAddress: z.string().min(3, "Drop address must be at least 3 characters").max(500),
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
  paymentType: z.nativeEnum(PaymentType).default(PaymentType.PREPAID),
  notes: z.string().max(500).optional().nullable(),
  scheduledDeliveryDate: z.coerce.date().optional().nullable(),
});

export const adminCreateOrderSchema = createOrderSchema.extend({
  customerId: z.string().uuid("customerId must be a valid UUID"),
});

export const orderQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  customerId: z.string().uuid().optional(),
  orderNumber: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional().nullable(),
});

export type CreateOrderInput = z.input<typeof createOrderSchema>;
export type AdminCreateOrderInput = z.input<typeof adminCreateOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
