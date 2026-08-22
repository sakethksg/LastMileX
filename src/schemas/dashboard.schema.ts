import { z } from "zod";

export const dashboardQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(50, Math.max(1, parseInt(val, 10))) : 5)),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return data.from.getTime() <= data.to.getTime();
      }
      return true;
    },
    {
      message: "'from' date must be before or equal to 'to' date",
      path: ["from"],
    }
  );

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
