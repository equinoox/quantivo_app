import * as Crypto from "expo-crypto";
import { eq } from "drizzle-orm";

import type { AuthSession, AuthUser } from "@/features/auth/types/auth.types";
import { roles } from "@/shared/constants/roles";
import { db } from "@/shared/lib/db/client";
import { appSettings } from "@/shared/lib/db/schema";

export const SESSION_TIMEOUT_OPTIONS = [5, 15, 30, 60] as const;
export type SessionTimeoutMinutes = (typeof SESSION_TIMEOUT_OPTIONS)[number];

export const DEFAULT_SESSION_TIMEOUT_MINUTES: SessionTimeoutMinutes = 15;
export const SESSION_TIMEOUT_DISABLED = "disabled";
export const SESSION_TIMEOUT_SETTING_KEY = "session_timeout_minutes";

const DISABLED_SESSION_EXPIRES_AT = "9999-12-31T23:59:59.999Z";

export function isSessionTimeoutMinutes(value: unknown): value is SessionTimeoutMinutes {
  return typeof value === "number" && SESSION_TIMEOUT_OPTIONS.includes(value as SessionTimeoutMinutes);
}

export function parseSessionTimeoutMinutes(value: string | null | undefined): SessionTimeoutMinutes | null {
  if (value === SESSION_TIMEOUT_DISABLED) return null;
  const minutes = Number(value);
  return isSessionTimeoutMinutes(minutes) ? minutes : DEFAULT_SESSION_TIMEOUT_MINUTES;
}

export function serializeSessionTimeoutMinutes(value: SessionTimeoutMinutes | null): string {
  return value === null ? SESSION_TIMEOUT_DISABLED : value.toString();
}

export async function getSessionTimeoutMinutes(): Promise<SessionTimeoutMinutes | null> {
  const [setting] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, SESSION_TIMEOUT_SETTING_KEY)).limit(1);
  return parseSessionTimeoutMinutes(setting?.value);
}

export function getSessionDurationMs(timeoutMinutes: SessionTimeoutMinutes | null): number | null {
  return timeoutMinutes === null ? null : timeoutMinutes * 60 * 1000;
}

function getSessionExpiresAt(activityAt: Date, timeoutMinutes: SessionTimeoutMinutes | null): string {
  const durationMs = getSessionDurationMs(timeoutMinutes);
  if (durationMs === null) return DISABLED_SESSION_EXPIRES_AT;
  return new Date(activityAt.getTime() + durationMs).toISOString();
}

export function createAuthSession(user: AuthUser, timeoutMinutes: SessionTimeoutMinutes | null): AuthSession {
  const now = new Date();
  const nowIso = now.toISOString();
  return {
    createdAt: nowIso,
    expiresAt: getSessionExpiresAt(now, timeoutMinutes),
    lastActivityAt: nowIso,
    token: Crypto.randomUUID(),
    user,
  };
}

export function refreshAuthSessionActivity(session: AuthSession, timeoutMinutes: SessionTimeoutMinutes | null): AuthSession {
  const now = new Date();
  const nowIso = now.toISOString();
  return {
    ...session,
    expiresAt: getSessionExpiresAt(now, timeoutMinutes),
    lastActivityAt: nowIso,
  };
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

export function isValidAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AuthSession>;
  const user = session.user as Partial<AuthUser> | undefined;

  if (typeof session.token !== "string" || !session.token.trim()) return false;
  if (!isValidIsoDate(session.createdAt) || !isValidIsoDate(session.expiresAt)) return false;
  if (session.lastActivityAt !== undefined && !isValidIsoDate(session.lastActivityAt)) return false;
  if (!user || typeof user.id !== "string" || typeof user.name !== "string") return false;
  if (!roles.includes(user.role as AuthUser["role"])) return false;
  if (Date.parse(session.expiresAt) <= Date.now()) return false;

  return true;
}
