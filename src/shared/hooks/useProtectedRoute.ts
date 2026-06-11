import { useEffect } from "react";
import { router } from "expo-router";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { UserRole } from "@/shared/constants/roles";
import { routes } from "@/shared/constants/routes";

type ProtectedRouteOptions = { allowedRoles?: UserRole[] };

export function useProtectedRoute(options: ProtectedRouteOptions = {}) {
  const session = useAuthStore((state) => state.session);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const allowedRoles = options.allowedRoles;

  useEffect(() => {
    if (!isHydrated) return;
    if (!session) { router.replace(routes.login); return; }
    if (allowedRoles && !allowedRoles.includes(session.user.role)) router.replace(routes.unauthorized);
  }, [allowedRoles, isHydrated, session]);

  return { session, isHydrated };
}
