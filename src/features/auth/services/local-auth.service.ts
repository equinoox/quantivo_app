import * as Crypto from "expo-crypto";

import { AuthSession } from "@/features/auth/types/auth.types";
import { LoginInput, RegisterInput } from "@/features/auth/validation/auth.schemas";
import { Result } from "@/shared/types/result.types";

export async function hashPasswordForLocalDemo(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export async function loginLocal(_input: LoginInput): Promise<Result<AuthSession>> {
  return { ok: false, error: "Local login service is prepared but not implemented." };
}

export async function registerLocal(_input: RegisterInput): Promise<Result<AuthSession>> {
  return { ok: false, error: "Local registration service is prepared but not implemented." };
}
