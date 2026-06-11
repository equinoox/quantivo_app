import { z } from "zod";

export const inventoryTransactionSchema = z.object({ productId: z.string().min(1), quantityDelta: z.number(), note: z.string().optional() });
