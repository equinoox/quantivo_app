import { AppCurrency, AppLanguage } from "@/features/setup/types/setup.types";

type AppMoneySettings = {
  currency?: AppCurrency;
  language?: AppLanguage | null;
};

export function formatAppMoney(value: number, settings: AppMoneySettings = {}): string {
  const currency = settings.currency ?? "RSD";
  const locale = settings.language === "sr" ? "sr-RS" : "en-US";

  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: currency === "RSD" ? 0 : 2,
    style: "currency",
  }).format(value);
}
