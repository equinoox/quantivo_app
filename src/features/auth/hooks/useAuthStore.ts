import { create } from "zustand";

import { loginLocal } from "@/features/auth/services/local-auth.service";
import { isValidAuthSession, refreshAuthSessionActivity, type SessionTimeoutMinutes } from "@/features/auth/services/session.service";
import { AuthSession } from "@/features/auth/types/auth.types";
import { LoginInput } from "@/features/auth/validation/auth.schemas";
import { deleteSecureItem, getSecureJson, setSecureJson } from "@/shared/lib/storage/secure-storage";
import { Result } from "@/shared/types/result.types";

const AUTH_SESSION_KEY = "quantivo.auth.session";

type AuthState = {
  session: AuthSession | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<Result<AuthSession>>;
  refreshSessionActivity: (timeoutMinutes: SessionTimeoutMinutes | null) => Promise<void>;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isHydrated: false,
  hydrate: async () => {
    const session = await getSecureJson<AuthSession>(AUTH_SESSION_KEY);
    if (!session) {
      set({ session: null, isHydrated: true });
      return;
    }

    if (!isValidAuthSession(session)) {
      await deleteSecureItem(AUTH_SESSION_KEY);
      set({ session: null, isHydrated: true });
      return;
    }

    set({ session, isHydrated: true });
  },
  signIn: async (input) => {
    const result = await loginLocal(input);
    if (!result.ok) return result;
    await setSecureJson(AUTH_SESSION_KEY, result.data);
    set({ session: result.data, isHydrated: true });
    return result;
  },
  refreshSessionActivity: async (timeoutMinutes) => {
    const currentSession = useAuthStore.getState().session;
    if (!currentSession) return;
    const nextSession = refreshAuthSessionActivity(currentSession, timeoutMinutes);
    await setSecureJson(AUTH_SESSION_KEY, nextSession);
    set({ session: nextSession, isHydrated: true });
  },
  clearSession: async () => {
    await deleteSecureItem(AUTH_SESSION_KEY);
    set({ session: null, isHydrated: true });
  },
}));
