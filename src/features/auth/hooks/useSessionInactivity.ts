import { router, usePathname } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { routes } from "@/shared/constants/routes";

const SESSION_INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;

export function useSessionInactivity() {
  const pathname = usePathname();
  const clearSession = useAuthStore((state) => state.clearSession);
  const session = useAuthStore((state) => state.session);
  const setupStatus = useSetupStore((state) => state.status);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const lastActivityAtRef = useRef(Date.now());
  const isExpiringRef = useRef(false);

  const markActivity = useCallback(() => {
    if (session && !isSessionExpired) lastActivityAtRef.current = Date.now();
  }, [isSessionExpired, session]);

  const notifySessionExpired = useCallback(() => {
    if (!session || isExpiringRef.current) return;
    setIsSessionExpired(true);
  }, [session]);

  const endExpiredSession = useCallback(async () => {
    if (!session || isExpiringRef.current) return;
    isExpiringRef.current = true;
    await clearSession();
    setIsSessionExpired(false);
    isExpiringRef.current = false;
    router.replace(setupStatus?.isComplete ? routes.login : "/(setup)/language");
  }, [clearSession, session, setupStatus?.isComplete]);

  const checkInactivity = useCallback(() => {
    if (!session || isSessionExpired) return;
    if (Date.now() - lastActivityAtRef.current >= SESSION_INACTIVITY_TIMEOUT_MS) notifySessionExpired();
  }, [isSessionExpired, notifySessionExpired, session]);

  useEffect(() => {
    if (session) {
      lastActivityAtRef.current = Date.now();
      setIsSessionExpired(false);
    }
  }, [session]);

  useEffect(() => {
    markActivity();
  }, [markActivity, pathname]);

  useEffect(() => {
    const intervalId = setInterval(checkInactivity, 15_000);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") checkInactivity();
    });

    return () => {
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [checkInactivity]);

  return { endExpiredSession, isSessionExpired, markActivity };
}
