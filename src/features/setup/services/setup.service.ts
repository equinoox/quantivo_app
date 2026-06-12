import { count, eq } from "drizzle-orm";

import { createLoginKeyForFullName, hashPasswordForLocalDemo } from "@/features/auth/services/local-auth.service";
import { AppCurrency, AppDateFormat, AppLanguage, CompleteSetupInput, SetupStatus } from "@/features/setup/types/setup.types";
import { db } from "@/shared/lib/db/client";
import { appSettings, users } from "@/shared/lib/db/schema";

const LANGUAGE_KEY = "language";
const RESTAURANT_NAME_KEY = "restaurant_name";
const TIMEZONE_KEY = "timezone";
const DATE_FORMAT_KEY = "date_format";
const CURRENCY_KEY = "currency";
const SETUP_COMPLETED_AT_KEY = "setup_completed_at";
export const DEFAULT_TIMEZONE = "Europe/Belgrade";
export const DEFAULT_DATE_FORMAT: AppDateFormat = "dd/MM/yyyy";
export const DEFAULT_CURRENCY: AppCurrency = "RSD";

function toDateFormat(value: string | undefined): AppDateFormat {
  if (value === "MM/dd/yyyy" || value === "dd/MM/yyyy" || value === "yyyy-MM-dd") return value;
  return DEFAULT_DATE_FORMAT;
}

function toCurrency(value: string | undefined): AppCurrency {
  if (value === "RSD" || value === "EUR" || value === "USD") return value;
  return DEFAULT_CURRENCY;
}

function createLocalId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function setSetting(key: string, value: string): Promise<void> {
  const updatedAt = new Date().toISOString();
  await db.insert(appSettings).values({ key, value, updatedAt }).onConflictDoUpdate({
    target: appSettings.key,
    set: { value, updatedAt },
  });
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const settings = await db.select().from(appSettings);
  const settingsByKey = new Map(settings.map((setting) => [setting.key, setting.value]));
  const [adminResult] = await db.select({ value: count() }).from(users).where(eq(users.role, "admin"));

  const language = settingsByKey.get(LANGUAGE_KEY) as AppLanguage | undefined;
  const restaurantName = settingsByKey.get(RESTAURANT_NAME_KEY) ?? null;
  const timezone = settingsByKey.get(TIMEZONE_KEY) || DEFAULT_TIMEZONE;
  const dateFormat = toDateFormat(settingsByKey.get(DATE_FORMAT_KEY));
  const currency = toCurrency(settingsByKey.get(CURRENCY_KEY));
  const adminCount = adminResult?.value ?? 0;
  const isComplete = Boolean(settingsByKey.get(SETUP_COMPLETED_AT_KEY) && language && restaurantName && adminCount > 0);

  return {
    isComplete,
    language: language ?? null,
    restaurantName,
    timezone,
    dateFormat,
    currency,
    adminCount,
  };
}

export async function completeInitialSetup(input: CompleteSetupInput): Promise<SetupStatus> {
  const now = new Date().toISOString();
  const normalizedAdmins = input.admins.map((admin) => ({
    ...admin,
    name: admin.name.trim().replace(/\s+/g, " "),
    loginKey: createLoginKeyForFullName(admin.name),
  }));

  for (const admin of normalizedAdmins) {
    const passwordHash = await hashPasswordForLocalDemo(admin.password);
    await db.insert(users).values({
      id: createLocalId("usr"),
      name: admin.name,
      loginKey: admin.loginKey,
      passwordHash,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });
  }

  await setSetting(LANGUAGE_KEY, input.language);
  await setSetting(RESTAURANT_NAME_KEY, input.restaurantName.trim());
  await setSetting(TIMEZONE_KEY, input.timezone);
  await setSetting(DATE_FORMAT_KEY, input.dateFormat);
  await setSetting(CURRENCY_KEY, input.currency);
  await setSetting(SETUP_COMPLETED_AT_KEY, now);

  return getSetupStatus();
}

export async function resetInitialSetup(): Promise<SetupStatus> {
  await db.delete(appSettings);
  await db.delete(users);
  return getSetupStatus();
}
