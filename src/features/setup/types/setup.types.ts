import type { SessionTimeoutMinutes } from "@/features/auth/services/session.service";

export type AppLanguage = "en" | "sr";
export type AppDateFormat = "MM/dd/yyyy" | "dd/MM/yyyy" | "dd.MM.yyyy" | "yyyy-MM-dd";
export type AppTimeFormat = "12h" | "24h";
export type AppCurrency = "RSD" | "EUR" | "USD";

export type SetupAdminInput = {
  id: string;
  name: string;
  password: string;
};

export type SetupStatus = {
  isComplete: boolean;
  language: AppLanguage | null;
  restaurantName: string | null;
  businessLogoUri: string | null;
  businessBackgroundUri: string | null;
  timezone: string;
  dateFormat: AppDateFormat;
  timeFormat: AppTimeFormat;
  currency: AppCurrency;
  sessionTimeoutMinutes: SessionTimeoutMinutes | null;
  adminCount: number;
};

export type CompleteSetupInput = {
  language: AppLanguage;
  restaurantName: string;
  businessLogoUri?: string;
  businessBackgroundUri?: string;
  timezone: string;
  dateFormat: AppDateFormat;
  timeFormat: AppTimeFormat;
  currency: AppCurrency;
  sessionTimeoutMinutes: SessionTimeoutMinutes | null;
  admins: SetupAdminInput[];
};

export type WorkspaceSettingsInput = {
  language: AppLanguage;
  restaurantName: string;
  businessLogoUri?: string;
  businessBackgroundUri?: string;
  timezone: string;
  dateFormat: AppDateFormat;
  timeFormat: AppTimeFormat;
  currency: AppCurrency;
  sessionTimeoutMinutes: SessionTimeoutMinutes | null;
};
