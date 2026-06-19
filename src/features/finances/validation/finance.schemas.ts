import { z } from "zod";

const nonNegativeAmountSchema = z.string().trim().min(1).transform((value, context) => {
  const parsed = Number(value.replace(/,/g, "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    context.addIssue({ code: "custom", message: "Invalid amount" });
    return z.NEVER;
  }
  return parsed;
});

export const createCustomFinancialEntrySchema = z.object({
  amount: nonNegativeAmountSchema,
  behavior: z.enum(["fixed", "variable"]),
  date: z.string().trim().min(1),
  explanation: z.string().trim(),
  name: z.string().trim().min(1),
  type: z.enum(["expense", "revenue"]),
});

export type CreateCustomFinancialEntryFormInput = z.input<typeof createCustomFinancialEntrySchema>;
