import { UserRole } from "@/shared/constants/roles";

export type AuthUser = { id: string; name: string; email: string; role: UserRole };
export type AuthSession = { user: AuthUser; token: string };
