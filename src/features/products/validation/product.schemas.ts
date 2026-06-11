import { z } from "zod";

export const productSchema = z.object({ name: z.string().min(1), unit: z.enum(["piece", "liter", "kilogram", "other"]), salePrice: z.number().min(0) });
