import { create } from "zustand";

import { loginLocal } from "@/features/auth/services/local-auth.service";
import { AuthSession } from "@/features/auth/types/auth.types";
import { LoginInput } from "@/features/auth/validation/auth.schemas";
import { deleteSecureItem, getSecureItem, setSecureItem } from "@/shared/lib/storage/secure-storage";
import { Result } from "@/shared/types/result.types";

const AUTH_SESSION_KEY = "quantivo.auth.session";

type AuthState = {
  session: AuthSession | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<Result<AuthSession>>;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isHydrated: false,
  hydrate: async () => {
    const stored = await getSecureItem(AUTH_SESSION_KEY);
    set({ session: stored ? (JSON.parse(stored) as AuthSession) : null, isHydrated: true });
  },
  signIn: async (input) => {
    const result = await loginLocal(input);
    if (!result.ok) return result;
    await setSecureItem(AUTH_SESSION_KEY, JSON.stringify(result.data));
    set({ session: result.data, isHydrated: true });
    return result;
  },
  clearSession: async () => {
    await deleteSecureItem(AUTH_SESSION_KEY);
    set({ session: null, isHydrated: true });
  },
}));
