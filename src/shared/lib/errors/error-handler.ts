import { AppError } from "@/shared/lib/errors/AppError";

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message);
  return new AppError("Unknown application error");
}
