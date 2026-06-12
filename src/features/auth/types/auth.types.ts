import { UserRole } from "@/shared/constants/roles";

export type AuthUser = { id: string; name: string; role: UserRole };
export type AuthSession = { user: AuthUser; token: string };
