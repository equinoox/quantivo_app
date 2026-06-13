import { z } from "zod";

const numericPasswordSchema = z.string().min(6).regex(/^\d+$/);

const workerBaseSchema = z.object({
  age: z.coerce.number().int().positive(),
  fullName: z.string().trim().min(1),
  role: z.enum(["Admin", "Manager", "Worker"]),
  workerType: z.string().trim(),
});

export const createWorkerSchema = workerBaseSchema.extend({
  password: numericPasswordSchema,
});

export const updateWorkerSchema = workerBaseSchema.extend({
  password: z.string().refine((value) => value.length === 0 || (value.length >= 6 && /^\d+$/.test(value))),
});

export type CreateWorkerFormInput = z.input<typeof createWorkerSchema>;
export type UpdateWorkerFormInput = z.input<typeof updateWorkerSchema>;
