import { create } from "zustand";

import { completeInitialSetup, DEFAULT_CURRENCY, DEFAULT_DATE_FORMAT, DEFAULT_TIMEZONE, getSetupStatus, resetInitialSetup } from "@/features/setup/services/setup.service";
import { AppCurrency, AppDateFormat, AppLanguage, SetupAdminInput, SetupStatus } from "@/features/setup/types/setup.types";
import { runMigrations } from "@/shared/lib/db/migrations";
import { Result } from "@/shared/types/result.types";

type SetupDraft = {
  language: AppLanguage | null;
  restaurantName: string;
  timezone: string;
  dateFormat: AppDateFormat;
  currency: AppCurrency;
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
  setRestaurantName: (restaurantName: string) => void;
  setCurrency: (currency: AppCurrency) => void;
  addAdmin: (admin: Omit<SetupAdminInput, "id">) => void;
  removeAdmin: (id: string) => void;
  completeSetup: () => Promise<Result<SetupStatus>>;
  resetSetup: () => Promise<Result<SetupStatus>>;
};

function createDraftId(): string {
  return `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useSetupStore = create<SetupState>((set, get) => ({
  status: null,
  draft: { language: null, restaurantName: "", timezone: DEFAULT_TIMEZONE, dateFormat: DEFAULT_DATE_FORMAT, currency: DEFAULT_CURRENCY, admins: [] },
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
        timezone: status.timezone,
        dateFormat: status.dateFormat,
        currency: status.currency,
        admins: [],
      },
    });
  },
  setLanguage: (language) => set((state) => ({ draft: { ...state.draft, language, dateFormat: language === "sr" ? "dd/MM/yyyy" : "MM/dd/yyyy" } })),
  setTimezone: (timezone) => set((state) => ({ draft: { ...state.draft, timezone } })),
  setDateFormat: (dateFormat) => set((state) => ({ draft: { ...state.draft, dateFormat } })),
  setRestaurantName: (restaurantName) => set((state) => ({ draft: { ...state.draft, restaurantName } })),
  setCurrency: (currency) => set((state) => ({ draft: { ...state.draft, currency } })),
  addAdmin: (admin) =>
    set((state) => ({
      draft: {
        ...state.draft,
        admins: [...state.draft.admins, { ...admin, id: createDraftId(), name: admin.name.trim().replace(/\s+/g, " ") }],
      },
    })),
  removeAdmin: (id) =>
    set((state) => ({
      draft: { ...state.draft, admins: state.draft.admins.filter((admin) => admin.id !== id) },
    })),
  completeSetup: async () => {
    const draft = get().draft;
    if (!draft.language) return { ok: false, error: "Choose a language first." };
    if (!draft.restaurantName.trim()) return { ok: false, error: "Enter the restaurant or bar name." };
    if (draft.admins.length < 1) return { ok: false, error: "Add at least one admin." };

    try {
      const status = await completeInitialSetup({
        language: draft.language,
        restaurantName: draft.restaurantName,
        timezone: draft.timezone,
        dateFormat: draft.dateFormat,
        currency: draft.currency,
        admins: draft.admins,
      });
      set({ status, draft: { language: status.language, restaurantName: status.restaurantName ?? "", timezone: status.timezone, dateFormat: status.dateFormat, currency: status.currency, admins: [] } });
      return { ok: true, data: status };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Setup failed." };
    }
  },
  resetSetup: async () => {
    try {
      const status = await resetInitialSetup();
      set({ status, draft: { language: null, restaurantName: "", timezone: DEFAULT_TIMEZONE, dateFormat: DEFAULT_DATE_FORMAT, currency: DEFAULT_CURRENCY, admins: [] } });
      return { ok: true, data: status };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Reset failed." };
    }
  },
}));
