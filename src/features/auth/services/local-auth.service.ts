import * as Crypto from "expo-crypto";
import { eq } from "drizzle-orm";

import { AuthSession } from "@/features/auth/types/auth.types";
import { LoginInput } from "@/features/auth/validation/auth.schemas";
import { db } from "@/shared/lib/db/client";
import { users } from "@/shared/lib/db/schema";
import { Result } from "@/shared/types/result.types";

export async function hashPasswordForLocalDemo(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export function createLoginKeyForFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function loginLocal(input: LoginInput): Promise<Result<AuthSession>> {
  const loginKey = createLoginKeyForFullName(input.identifier);
  const [user] = await db.select().from(users).where(eq(users.loginKey, loginKey)).limit(1);

  if (!user || user.deletedAt) return { ok: false, error: "Invalid full name or password." };

  const passwordHash = await hashPasswordForLocalDemo(input.password);
  if (user.passwordHash !== passwordHash) return { ok: false, error: "Invalid full name or password." };

  return {
    ok: true,
    data: {
      token: `local-${Date.now().toString(36)}`,
      user: { id: user.id, name: user.name, role: user.role },
    },
  };
}
