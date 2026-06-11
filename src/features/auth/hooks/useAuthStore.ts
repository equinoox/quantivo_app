import { create } from "zustand";

import { AuthSession } from "@/features/auth/types/auth.types";
import { deleteSecureItem, getSecureItem, setSecureItem } from "@/shared/lib/storage/secure-storage";

const AUTH_SESSION_KEY = "quantivo.auth.session";

type AuthState = {
  session: AuthSession | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  signInPlaceholder: (identifier: string) => Promise<void>;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isHydrated: false,
  hydrate: async () => {
    const stored = await getSecureItem(AUTH_SESSION_KEY);
    set({ session: stored ? (JSON.parse(stored) as AuthSession) : null, isHydrated: true });
  },
  signInPlaceholder: async (identifier) => {
    const session: AuthSession = { token: "local-placeholder-session", user: { id: "local-user", name: identifier || "Local User", email: identifier.includes("@") ? identifier : "local@quantivo.app", role: "admin" } };
    await setSecureItem(AUTH_SESSION_KEY, JSON.stringify(session));
    set({ session, isHydrated: true });
  },
  clearSession: async () => {
    await deleteSecureItem(AUTH_SESSION_KEY);
    set({ session: null, isHydrated: true });
  },
}));
