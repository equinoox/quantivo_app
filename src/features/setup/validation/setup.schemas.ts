import { z } from "zod";

export const languageSchema = z.enum(["en", "sr"]);
export const restaurantSetupSchema = z.object({ restaurantName: z.string().trim().min(2) });
export const setupAdminSchema = z.object({
  name: z.string().trim().min(2),
  password: z.string().min(6),
});
