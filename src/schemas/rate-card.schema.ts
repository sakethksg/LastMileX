import { z } from "zod";
import { CustomerType, RouteType } from "@/types/enums";

export const weightSlabSchema = z
  .object({
    minWeight: z.number().min(0, "minWeight must be non-negative"),
    maxWeight: z.number().positive("maxWeight must be greater than 0"),
    basePrice: z.number().min(0, "basePrice must be non-negative"),
    perKgRate: z.number().min(0, "perKgRate must be non-negative").default(0),
  })
  .refine((data) => data.maxWeight > data.minWeight, {
    message: "maxWeight must be strictly greater than minWeight",
    path: ["maxWeight"],
  });

export const createRateCardSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    customerType: z.nativeEnum(CustomerType),
    routeType: z.nativeEnum(RouteType),
    sourceZoneId: z.string().uuid("sourceZoneId must be a valid UUID").optional().nullable(),
    destinationZoneId: z.string().uuid("destinationZoneId must be a valid UUID").optional().nullable(),
    effectiveFrom: z.coerce.date(),
    effectiveTo: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional().default(true),
    weightSlabs: z.array(weightSlabSchema).min(1, "At least one weight slab is required"),
  })
  .refine(
    (data) => {
      if (data.effectiveTo && data.effectiveTo <= data.effectiveFrom) {
        return false;
      }
      return true;
    },
    {
      message: "effectiveTo must be strictly after effectiveFrom",
      path: ["effectiveTo"],
    }
  );

export const updateRateCardSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    effectiveTo: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional(),
  });

export const rateCardQuerySchema = z.object({
  customerType: z.nativeEnum(CustomerType).optional(),
  routeType: z.nativeEnum(RouteType).optional(),
  sourceZoneId: z.string().uuid().optional(),
  destinationZoneId: z.string().uuid().optional(),
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

export type WeightSlabInput = z.input<typeof weightSlabSchema>;
export type CreateRateCardInput = z.input<typeof createRateCardSchema>;
export type UpdateRateCardInput = z.infer<typeof updateRateCardSchema>;
export type RateCardQueryInput = z.infer<typeof rateCardQuerySchema>;
