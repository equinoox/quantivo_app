import { count, eq } from "drizzle-orm";

import { createLoginKeyForFullName, hashPasswordForLocalDemo } from "@/features/auth/services/local-auth.service";
import { AppCurrency, AppDateFormat, AppLanguage, AppTimeFormat, CompleteSetupInput, SetupStatus, WorkspaceSettingsInput } from "@/features/setup/types/setup.types";
import { db } from "@/shared/lib/db/client";
import { resetDatabase } from "@/shared/lib/db/migrations";
import { appSettings, users } from "@/shared/lib/db/schema";

const LANGUAGE_KEY = "language";
const RESTAURANT_NAME_KEY = "restaurant_name";
const BUSINESS_LOGO_URI_KEY = "business_logo_uri";
const BUSINESS_BACKGROUND_URI_KEY = "business_background_uri";
const TIMEZONE_KEY = "timezone";
const DATE_FORMAT_KEY = "date_format";
const TIME_FORMAT_KEY = "time_format";
const CURRENCY_KEY = "currency";
const SETUP_COMPLETED_AT_KEY = "setup_completed_at";
export const DEFAULT_TIMEZONE = "Europe/Belgrade";
export const DEFAULT_DATE_FORMAT: AppDateFormat = "dd/MM/yyyy";
export const DEFAULT_TIME_FORMAT: AppTimeFormat = "24h";
export const DEFAULT_CURRENCY: AppCurrency = "RSD";

function toDateFormat(value: string | undefined): AppDateFormat {
  if (value === "MM/dd/yyyy" || value === "dd/MM/yyyy" || value === "dd.MM.yyyy" || value === "yyyy-MM-dd") return value;
  return DEFAULT_DATE_FORMAT;
}

function toTimeFormat(value: string | undefined): AppTimeFormat {
  if (value === "12h" || value === "24h") return value;
  return DEFAULT_TIME_FORMAT;
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

async function deleteSetting(key: string): Promise<void> {
  await db.delete(appSettings).where(eq(appSettings.key, key));
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const settings = await db.select().from(appSettings);
  const settingsByKey = new Map(settings.map((setting) => [setting.key, setting.value]));
  const [adminResult] = await db.select({ value: count() }).from(users).where(eq(users.role, "admin"));

  const language = settingsByKey.get(LANGUAGE_KEY) as AppLanguage | undefined;
  const restaurantName = settingsByKey.get(RESTAURANT_NAME_KEY) ?? null;
  const businessLogoUri = settingsByKey.get(BUSINESS_LOGO_URI_KEY) ?? null;
  const businessBackgroundUri = settingsByKey.get(BUSINESS_BACKGROUND_URI_KEY) ?? null;
  const timezone = settingsByKey.get(TIMEZONE_KEY) || DEFAULT_TIMEZONE;
  const dateFormat = toDateFormat(settingsByKey.get(DATE_FORMAT_KEY));
  const timeFormat = toTimeFormat(settingsByKey.get(TIME_FORMAT_KEY));
  const currency = toCurrency(settingsByKey.get(CURRENCY_KEY));
  const adminCount = adminResult?.value ?? 0;
  const isComplete = Boolean(settingsByKey.get(SETUP_COMPLETED_AT_KEY) && language && restaurantName && adminCount > 0);

  return {
    isComplete,
    language: language ?? null,
    restaurantName,
    businessLogoUri,
    businessBackgroundUri,
    timezone,
    dateFormat,
    timeFormat,
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
    }).onConflictDoUpdate({
      target: users.loginKey,
      set: {
        deletedAt: null,
        name: admin.name,
        passwordHash,
        role: "admin",
        updatedAt: now,
      },
    });
  }

  await setSetting(LANGUAGE_KEY, input.language);
  await setSetting(RESTAURANT_NAME_KEY, input.restaurantName.trim());
  if (input.businessLogoUri?.trim()) await setSetting(BUSINESS_LOGO_URI_KEY, input.businessLogoUri.trim());
  if (input.businessBackgroundUri?.trim()) await setSetting(BUSINESS_BACKGROUND_URI_KEY, input.businessBackgroundUri.trim());
  await setSetting(TIMEZONE_KEY, input.timezone);
  await setSetting(DATE_FORMAT_KEY, input.dateFormat);
  await setSetting(TIME_FORMAT_KEY, input.timeFormat);
  await setSetting(CURRENCY_KEY, input.currency);
  await setSetting(SETUP_COMPLETED_AT_KEY, now);

  return getSetupStatus();
}

export async function saveWorkspaceSettings(input: WorkspaceSettingsInput): Promise<SetupStatus> {
  await setSetting(LANGUAGE_KEY, input.language);
  await setSetting(RESTAURANT_NAME_KEY, input.restaurantName.trim());
  await setSetting(TIMEZONE_KEY, input.timezone);
  await setSetting(DATE_FORMAT_KEY, input.dateFormat);
  await setSetting(TIME_FORMAT_KEY, input.timeFormat);
  await setSetting(CURRENCY_KEY, input.currency);

  if (input.businessLogoUri?.trim()) await setSetting(BUSINESS_LOGO_URI_KEY, input.businessLogoUri.trim());
  else await deleteSetting(BUSINESS_LOGO_URI_KEY);

  if (input.businessBackgroundUri?.trim()) await setSetting(BUSINESS_BACKGROUND_URI_KEY, input.businessBackgroundUri.trim());
  else await deleteSetting(BUSINESS_BACKGROUND_URI_KEY);

  return getSetupStatus();
}

export async function resetInitialSetup(): Promise<SetupStatus> {
  await resetDatabase();
  return getSetupStatus();
}
