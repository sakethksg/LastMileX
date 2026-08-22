import { z } from "zod";
import {
  NotificationEventType,
  NotificationStatus,
  NotificationType,
} from "@/types/enums";

export const notificationQuerySchema = z.object({
  status: z.nativeEnum(NotificationStatus).optional(),
  eventType: z.nativeEnum(NotificationEventType).optional(),
  type: z.nativeEnum(NotificationType).optional(),
  userId: z.string().uuid("userId must be a valid UUID").optional(),
  orderId: z.string().uuid("orderId must be a valid UUID").optional(),
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

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
