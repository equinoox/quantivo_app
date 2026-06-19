import { router, usePathname } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { DEFAULT_SESSION_TIMEOUT_MINUTES, getSessionDurationMs } from "@/features/auth/services/session.service";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { routes } from "@/shared/constants/routes";

const SESSION_ACTIVITY_PERSIST_INTERVAL_MS = 60_000;

export function useSessionInactivity() {
  const pathname = usePathname();
  const clearSession = useAuthStore((state) => state.clearSession);
  const refreshSessionActivity = useAuthStore((state) => state.refreshSessionActivity);
  const session = useAuthStore((state) => state.session);
  const setupStatus = useSetupStore((state) => state.status);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const lastActivityAtRef = useRef(Date.now());
  const lastPersistedActivityAtRef = useRef(0);
  const isExpiringRef = useRef(false);
  const sessionTimeoutMinutes = setupStatus ? setupStatus.sessionTimeoutMinutes : DEFAULT_SESSION_TIMEOUT_MINUTES;
  const sessionTimeoutMs = getSessionDurationMs(sessionTimeoutMinutes);

  const markActivity = useCallback(() => {
    if (!session || isSessionExpired || sessionTimeoutMs === null) return;
    const now = Date.now();
    lastActivityAtRef.current = now;
    if (now - lastPersistedActivityAtRef.current >= SESSION_ACTIVITY_PERSIST_INTERVAL_MS) {
      lastPersistedActivityAtRef.current = now;
      void refreshSessionActivity(sessionTimeoutMinutes);
    }
  }, [isSessionExpired, refreshSessionActivity, session, sessionTimeoutMinutes, sessionTimeoutMs]);

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
    if (!session || isSessionExpired || sessionTimeoutMs === null) return;
    const now = Date.now();
    if (Date.parse(session.expiresAt) <= now || now - lastActivityAtRef.current >= sessionTimeoutMs) notifySessionExpired();
  }, [isSessionExpired, notifySessionExpired, session, sessionTimeoutMs]);

  useEffect(() => {
    if (session) {
      const activityAt = session.lastActivityAt ? Date.parse(session.lastActivityAt) : Date.now();
      lastActivityAtRef.current = Number.isFinite(activityAt) ? activityAt : Date.now();
      lastPersistedActivityAtRef.current = Date.now();
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
