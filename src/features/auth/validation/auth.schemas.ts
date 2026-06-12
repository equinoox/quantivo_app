import { z } from "zod";

export const loginSchema = z.object({ identifier: z.string().min(2), password: z.string().min(4) });
export type LoginInput = z.infer<typeof loginSchema>;
