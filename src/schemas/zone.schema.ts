import { z } from "zod";

export const createZoneSchema = z.object({
  name: z.string().min(2, "Zone name must be at least 2 characters").max(100),
  code: z
    .string()
    .min(2, "Zone code must be at least 2 characters")
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "Zone code must contain only uppercase letters, numbers, hyphens, or underscores"),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateZoneSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "Zone code must contain only uppercase letters, numbers, hyphens, or underscores")
    .optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const zoneQuerySchema = z.object({
  search: z.string().optional(),
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

export type CreateZoneInput = z.input<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type ZoneQueryInput = z.infer<typeof zoneQuerySchema>;
