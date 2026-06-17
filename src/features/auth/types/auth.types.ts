import type { UserRole } from "@/shared/constants/roles";

export type AuthUser = { id: string; name: string; role: UserRole };
export type AuthSession = {
  createdAt: string;
  expiresAt: string;
  lastActivityAt?: string;
  token: string;
  user: AuthUser;
};
