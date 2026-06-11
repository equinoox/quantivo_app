import { z } from "zod";

export const loginSchema = z.object({ identifier: z.string().min(2), password: z.string().min(4) });
export const registerSchema = z.object({ name: z.string().min(2), email: z.email(), password: z.string().min(6) });
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
