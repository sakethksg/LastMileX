import { z } from "zod";
import { RouteType, SurchargeType } from "@/types/enums";

export const createCodSurchargeSchema = z
  .object({
    routeType: z.nativeEnum(RouteType),
    surchargeType: z.nativeEnum(SurchargeType),
    surchargeValue: z.number().positive("surchargeValue must be greater than 0"),
    minSurcharge: z.number().min(0, "minSurcharge must be non-negative").optional().nullable(),
    maxSurcharge: z.number().min(0, "maxSurcharge must be non-negative").optional().nullable(),
    effectiveFrom: z.coerce.date(),
    effectiveTo: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.surchargeType === SurchargeType.PERCENTAGE && data.surchargeValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage surcharge value cannot exceed 100%",
      path: ["surchargeValue"],
    }
  )
  .refine(
    (data) => {
      if (
        data.minSurcharge !== undefined &&
        data.minSurcharge !== null &&
        data.maxSurcharge !== undefined &&
        data.maxSurcharge !== null &&
        data.maxSurcharge < data.minSurcharge
      ) {
        return false;
      }
      return true;
    },
    {
      message: "maxSurcharge must be greater than or equal to minSurcharge",
      path: ["maxSurcharge"],
    }
  )
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

export const updateCodSurchargeSchema = z.object({
  effectiveTo: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const codSurchargeQuerySchema = z.object({
  routeType: z.nativeEnum(RouteType).optional(),
  surchargeType: z.nativeEnum(SurchargeType).optional(),
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

export type CreateCodSurchargeInput = z.input<typeof createCodSurchargeSchema>;
export type UpdateCodSurchargeInput = z.infer<typeof updateCodSurchargeSchema>;
export type CodSurchargeQueryInput = z.infer<typeof codSurchargeQuerySchema>;
