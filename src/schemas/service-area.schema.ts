import { z } from "zod";

export const createServiceAreaSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  pinCode: z.string().regex(/^\d{6}$/, "PIN code must be exactly 6 digits"),
  locality: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  zoneId: z.string().uuid("zoneId must be a valid UUID"),
  isActive: z.boolean().optional().default(true),
});

export const updateServiceAreaSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  pinCode: z.string().regex(/^\d{6}$/, "PIN code must be exactly 6 digits").optional(),
  locality: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  zoneId: z.string().uuid("zoneId must be a valid UUID").optional(),
  isActive: z.boolean().optional(),
});

export const serviceAreaQuerySchema = z.object({
  pinCode: z.string().optional(),
  zoneId: z.string().uuid().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
});

export type CreateServiceAreaInput = z.input<typeof createServiceAreaSchema>;
export type UpdateServiceAreaInput = z.infer<typeof updateServiceAreaSchema>;
export type ServiceAreaQueryInput = z.infer<typeof serviceAreaQuerySchema>;
