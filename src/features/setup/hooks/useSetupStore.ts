import { create } from "zustand";

import type { SessionTimeoutMinutes } from "@/features/auth/services/session.service";
import { completeInitialSetup, DEFAULT_CURRENCY, DEFAULT_DATE_FORMAT, DEFAULT_SESSION_TIMEOUT, DEFAULT_TIME_FORMAT, DEFAULT_TIMEZONE, getSetupStatus, resetInitialSetup, saveWorkspaceSettings } from "@/features/setup/services/setup.service";
import { AppCurrency, AppDateFormat, AppLanguage, AppTimeFormat, SetupAdminInput, SetupStatus } from "@/features/setup/types/setup.types";
import { runMigrations } from "@/shared/lib/db/migrations";
import { AppError } from "@/shared/lib/errors/AppError";
import { createLocalId } from "@/shared/lib/id/createLocalId";
import { Result } from "@/shared/types/result.types";

type SetupDraft = {
  language: AppLanguage | null;
  restaurantName: string;
  businessLogoUri: string;
  businessBackgroundUri: string;
  timezone: string;
  dateFormat: AppDateFormat;
  timeFormat: AppTimeFormat;
  currency: AppCurrency;
  sessionTimeoutMinutes: SessionTimeoutMinutes | null;
  admins: SetupAdminInput[];
};

type SetupState = {
  status: SetupStatus | null;
  draft: SetupDraft;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: AppLanguage) => void;
  setTimezone: (timezone: string) => void;
  setDateFormat: (dateFormat: AppDateFormat) => void;
  setTimeFormat: (timeFormat: AppTimeFormat) => void;
  setSessionTimeoutMinutes: (sessionTimeoutMinutes: SessionTimeoutMinutes | null) => void;
  setRestaurantName: (restaurantName: string) => void;
  setBusinessLogoUri: (businessLogoUri: string) => void;
  setBusinessBackgroundUri: (businessBackgroundUri: string) => void;
  setCurrency: (currency: AppCurrency) => void;
  addAdmin: (admin: Omit<SetupAdminInput, "id">) => void;
  removeAdmin: (id: string) => void;
  saveSettings: () => Promise<Result<SetupStatus>>;
  completeSetup: () => Promise<Result<SetupStatus>>;
  resetSetup: () => Promise<Result<SetupStatus>>;
};

export const useSetupStore = create<SetupState>((set, get) => ({
  status: null,
  draft: { language: null, restaurantName: "", businessLogoUri: "", businessBackgroundUri: "", timezone: DEFAULT_TIMEZONE, dateFormat: DEFAULT_DATE_FORMAT, timeFormat: DEFAULT_TIME_FORMAT, currency: DEFAULT_CURRENCY, sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT, admins: [] },
  isHydrated: false,
  hydrate: async () => {
    await runMigrations();
    const status = await getSetupStatus();
    set({
      status,
      isHydrated: true,
      draft: {
        language: status.language,
        restaurantName: status.restaurantName ?? "",
        businessLogoUri: status.businessLogoUri ?? "",
        businessBackgroundUri: status.businessBackgroundUri ?? "",
        timezone: status.timezone,
        dateFormat: status.dateFormat,
        timeFormat: status.timeFormat,
        currency: status.currency,
        sessionTimeoutMinutes: status.sessionTimeoutMinutes,
        admins: [],
      },
    });
  },
  setLanguage: (language) => set((state) => ({ draft: { ...state.draft, language, dateFormat: language === "sr" ? "dd.MM.yyyy" : "MM/dd/yyyy", timeFormat: language === "sr" ? "24h" : "12h" } })),
  setTimezone: (timezone) => set((state) => ({ draft: { ...state.draft, timezone } })),
  setDateFormat: (dateFormat) => set((state) => ({ draft: { ...state.draft, dateFormat } })),
  setTimeFormat: (timeFormat) => set((state) => ({ draft: { ...state.draft, timeFormat } })),
  setSessionTimeoutMinutes: (sessionTimeoutMinutes) => set((state) => ({ draft: { ...state.draft, sessionTimeoutMinutes } })),
  setRestaurantName: (restaurantName) => set((state) => ({ draft: { ...state.draft, restaurantName } })),
  setBusinessLogoUri: (businessLogoUri) => set((state) => ({ draft: { ...state.draft, businessLogoUri } })),
  setBusinessBackgroundUri: (businessBackgroundUri) => set((state) => ({ draft: { ...state.draft, businessBackgroundUri } })),
  setCurrency: (currency) => set((state) => ({ draft: { ...state.draft, currency } })),
  addAdmin: (admin) =>
    set((state) => ({
      draft: {
        ...state.draft,
        admins: [...state.draft.admins, { ...admin, id: createLocalId("draft"), name: admin.name.trim().replace(/\s+/g, " ") }],
      },
    })),
  removeAdmin: (id) =>
    set((state) => ({
      draft: { ...state.draft, admins: state.draft.admins.filter((admin) => admin.id !== id) },
    })),
  saveSettings: async () => {
    const draft = get().draft;
    if (!draft.language) return { ok: false, error: "Choose a language first." };
    if (!draft.restaurantName.trim()) return { ok: false, error: "Enter the restaurant or bar name." };

    try {
      const status = await saveWorkspaceSettings({
        language: draft.language,
        restaurantName: draft.restaurantName,
        businessLogoUri: draft.businessLogoUri,
        businessBackgroundUri: draft.businessBackgroundUri,
        timezone: draft.timezone,
        dateFormat: draft.dateFormat,
        timeFormat: draft.timeFormat,
        currency: draft.currency,
        sessionTimeoutMinutes: draft.sessionTimeoutMinutes,
      });
      set({ status, draft: { ...draft, language: status.language, restaurantName: status.restaurantName ?? "", businessLogoUri: status.businessLogoUri ?? "", businessBackgroundUri: status.businessBackgroundUri ?? "", timezone: status.timezone, dateFormat: status.dateFormat, timeFormat: status.timeFormat, currency: status.currency, sessionTimeoutMinutes: status.sessionTimeoutMinutes } });
      return { ok: true, data: status };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Settings save failed." };
    }
  },
  completeSetup: async () => {
    const draft = get().draft;
    if (!draft.language) return { ok: false, error: "Choose a language first." };
    if (!draft.restaurantName.trim()) return { ok: false, error: "Enter the restaurant or bar name." };
    if (draft.admins.length < 1) return { ok: false, error: "Add at least one admin." };

    try {
      const status = await completeInitialSetup({
        language: draft.language,
        restaurantName: draft.restaurantName,
        businessLogoUri: draft.businessLogoUri,
        businessBackgroundUri: draft.businessBackgroundUri,
        timezone: draft.timezone,
        dateFormat: draft.dateFormat,
        timeFormat: draft.timeFormat,
        currency: draft.currency,
        sessionTimeoutMinutes: draft.sessionTimeoutMinutes,
        admins: draft.admins,
      });
      set({ status, draft: { language: status.language, restaurantName: status.restaurantName ?? "", businessLogoUri: status.businessLogoUri ?? "", businessBackgroundUri: status.businessBackgroundUri ?? "", timezone: status.timezone, dateFormat: status.dateFormat, timeFormat: status.timeFormat, currency: status.currency, sessionTimeoutMinutes: status.sessionTimeoutMinutes, admins: [] } });
      return { ok: true, data: status };
    } catch (error) {
      if (error instanceof AppError) return { ok: false, error: error.code };
      return { ok: false, error: error instanceof Error ? error.message : "Setup failed." };
    }
  },
  resetSetup: async () => {
    try {
      const status = await resetInitialSetup();
      set({ status, draft: { language: null, restaurantName: "", businessLogoUri: "", businessBackgroundUri: "", timezone: DEFAULT_TIMEZONE, dateFormat: DEFAULT_DATE_FORMAT, timeFormat: DEFAULT_TIME_FORMAT, currency: DEFAULT_CURRENCY, sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT, admins: [] } });
      return { ok: true, data: status };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Reset failed." };
    }
  },
}));
