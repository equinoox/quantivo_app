import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { translations } from "@/shared/i18n/translations";

export function useI18n() {
  const language = useSetupStore((state) => state.status?.language ?? state.draft.language ?? "en");
  const dictionary = translations[language];

  return {
    language,
    t: (key: keyof typeof dictionary) => dictionary[key] ?? key,
  };
}
