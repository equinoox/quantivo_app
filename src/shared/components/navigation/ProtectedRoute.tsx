import { router } from "expo-router";
import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import type { UserRole } from "@/shared/constants/roles";
import { routes } from "@/shared/constants/routes";

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
  children: ReactNode;
};

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const session = useAuthStore((state) => state.session);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hasAllowedRole = !allowedRoles || (session ? allowedRoles.includes(session.user.role) : false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!session) {
      router.replace(routes.login);
      return;
    }
    if (!hasAllowedRole) router.replace(routes.unauthorized);
  }, [hasAllowedRole, isHydrated, session]);

  if (!isHydrated || !session || !hasAllowedRole) return null;

  return <>{children}</>;
}
