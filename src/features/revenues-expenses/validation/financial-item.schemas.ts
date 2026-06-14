import { z } from "zod";

export const createFinancialItemSchema = z.object({
  type: z.enum(["expense", "revenue"]),
  behavior: z.enum(["fixed", "variable"]),
  name: z.string().trim().min(1),
  requiresExplanation: z.boolean(),
});
