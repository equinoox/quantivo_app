import { z } from "zod";

const requiredNonNegativeNumberSchema = z.string().trim().min(1).transform((value, context) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    context.addIssue({ code: "custom", message: "Invalid number" });
    return z.NEVER;
  }
  return parsed;
});

const optionalNonNegativeNumberSchema = z.string().trim().transform((value, context) => {
  if (!value) return 0;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    context.addIssue({ code: "custom", message: "Invalid number" });
    return z.NEVER;
  }
  return parsed;
});

const requiredNonNegativeIntegerSchema = z.string().trim().min(1).transform((value, context) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    context.addIssue({ code: "custom", message: "Invalid number" });
    return z.NEVER;
  }
  return parsed;
});

export const catalogItemSchema = z.object({
  name: z.string().trim().min(1),
});

export const productSchema = z.object({
  attributeIds: z.array(z.string()),
  categoryId: z.string().trim().min(1),
  description: z.string().trim(),
  imageUrl: z.string().trim(),
  isCounterProduct: z.boolean(),
  minimumQuantityAlert: optionalNonNegativeNumberSchema,
  name: z.string().trim().min(1),
  position: requiredNonNegativeIntegerSchema,
  price: requiredNonNegativeNumberSchema,
  unitId: z.string().trim().min(1),
});

export type CatalogItemFormInput = z.input<typeof catalogItemSchema>;
export type ProductFormInput = z.input<typeof productSchema>;
