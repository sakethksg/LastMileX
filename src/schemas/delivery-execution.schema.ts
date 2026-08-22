import { z } from "zod";

export const DeliveryFailureReasonEnum = z.enum([
  "CUSTOMER_UNAVAILABLE",
  "ADDRESS_NOT_FOUND",
  "CUSTOMER_REFUSED",
  "ACCESS_RESTRICTED",
  "PACKAGE_DAMAGED",
  "OTHER",
]);

export type DeliveryFailureReason = z.infer<typeof DeliveryFailureReasonEnum>;

export const failDeliverySchema = z.object({
  failureReason: z.string().min(2, "Failure reason must be provided").max(100),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
});

export const completeDeliverySchema = z.object({
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
});

export const updateDeliveryProgressSchema = z.object({
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
});

export const rescheduleOrderSchema = z.object({
  scheduledDeliveryDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
});

export type FailDeliveryInput = z.infer<typeof failDeliverySchema>;
export type CompleteDeliveryInput = z.infer<typeof completeDeliverySchema>;
export type UpdateDeliveryProgressInput = z.infer<typeof updateDeliveryProgressSchema>;
export type RescheduleOrderInput = z.infer<typeof rescheduleOrderSchema>;
