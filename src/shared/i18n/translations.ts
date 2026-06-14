import { AppLanguage } from "@/features/setup/types/setup.types";
import { authTranslations } from "@/shared/i18n/translations/auth";
import { commonTranslations } from "@/shared/i18n/translations/common";
import { financeTranslations } from "@/shared/i18n/translations/finance";
import { inventoryTranslations } from "@/shared/i18n/translations/inventory";
import { notificationsTranslations } from "@/shared/i18n/translations/notifications";
import { productsTranslations } from "@/shared/i18n/translations/products";
import { setupTranslations } from "@/shared/i18n/translations/setup";
import { workersTranslations } from "@/shared/i18n/translations/workers";

const dictionaries = [
  commonTranslations,
  authTranslations,
  inventoryTranslations,
  productsTranslations,
  financeTranslations,
  workersTranslations,
  setupTranslations,
  notificationsTranslations,
];

export const translations: Record<AppLanguage, Record<string, string>> = {
  en: Object.assign({}, ...dictionaries.map((dictionary) => dictionary.en)),
  sr: Object.assign({}, ...dictionaries.map((dictionary) => dictionary.sr)),
};
