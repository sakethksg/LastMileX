import { z } from "zod";
import { AgentAvailability } from "@/types/enums";

export const agentQuerySchema = z.object({
  availability: z.nativeEnum(AgentAvailability).optional(),
  currentZoneId: z.string().uuid("currentZoneId must be a valid UUID").optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
});

export const updateAgentProfileSchema = z.object({
  currentZoneId: z.string().uuid("currentZoneId must be a valid UUID").nullable().optional(),
  availability: z.nativeEnum(AgentAvailability).optional(),
  vehicleType: z.string().min(2, "Vehicle type must be at least 2 characters").max(50).nullable().optional(),
  vehicleNumber: z.string().min(2, "Vehicle number must be at least 2 characters").max(50).nullable().optional(),
  maxConcurrentOrders: z
    .number()
    .int("Maximum concurrent orders must be an integer")
    .min(1, "Maximum concurrent orders must be at least 1")
    .max(50, "Maximum concurrent orders cannot exceed 50")
    .optional(),
});

export type AgentQueryInput = z.infer<typeof agentQuerySchema>;
export type UpdateAgentProfileInput = z.infer<typeof updateAgentProfileSchema>;
