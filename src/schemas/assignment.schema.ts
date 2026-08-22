import { z } from "zod";

export const manualAssignSchema = z.object({
  agentId: z.string().uuid("agentId must be a valid UUID"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
});

export const autoAssignSchema = z.object({
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
});

export type ManualAssignInput = z.infer<typeof manualAssignSchema>;
export type AutoAssignInput = z.infer<typeof autoAssignSchema>;
