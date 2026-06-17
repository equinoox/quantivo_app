import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import clsx from "clsx";

import { SESSION_TIMEOUT_OPTIONS, type SessionTimeoutMinutes } from "@/features/auth/services/session.service";
import { SetupScreen } from "@/features/setup/components/SetupScreen";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { AppDateFormat, AppLanguage, AppTimeFormat } from "@/features/setup/types/setup.types";
import { AppButton } from "@/shared/components/ui/AppButton";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

const timezoneOptions = [
  { label: "UTC+0 UTC", value: "UTC" },
  { label: "UTC+1 Europe/Belgrade", value: "Europe/Belgrade" },
  { label: "UTC+2 Europe/Athens", value: "Europe/Athens" },
  { label: "UTC-5 America/New_York", value: "America/New_York" },
];

const dateFormats: AppDateFormat[] = ["dd/MM/yyyy", "dd.MM.yyyy", "MM/dd/yyyy", "yyyy-MM-dd"];
const timeFormats: AppTimeFormat[] = ["24h", "12h"];

export function SetupLanguageScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const language = useSetupStore((state) => state.draft.language);
  const timezone = useSetupStore((state) => state.draft.timezone);
  const dateFormat = useSetupStore((state) => state.draft.dateFormat);
  const timeFormat = useSetupStore((state) => state.draft.timeFormat);
  const sessionTimeoutMinutes = useSetupStore((state) => state.draft.sessionTimeoutMinutes);
  const setLanguage = useSetupStore((state) => state.setLanguage);
  const setTimezone = useSetupStore((state) => state.setTimezone);
  const setDateFormat = useSetupStore((state) => state.setDateFormat);
  const setTimeFormat = useSetupStore((state) => state.setTimeFormat);
  const setSessionTimeoutMinutes = useSetupStore((state) => state.setSessionTimeoutMinutes);
  const languages: { value: AppLanguage; label: string; flag: string; description: string }[] = [
    { value: "en", label: t("english"), flag: "\u{1F1EC}\u{1F1E7}", description: t("englishDescription") },
    { value: "sr", label: t("serbian"), flag: "\u{1F1F7}\u{1F1F8}", description: t("serbianDescription") },
  ];
  const sessionTimeoutOptions: { value: SessionTimeoutMinutes | null; label: string }[] = [
    { value: null, label: t("sessionExpirationDisabled") },
    ...SESSION_TIMEOUT_OPTIONS.map((value) => ({ value, label: value === 60 ? t("sessionExpiration1Hour") : t(`sessionExpiration${value}Minutes`) })),
  ];

  const handleNext = () => {
    if (!language) {
      toast.error(t("chooseLanguageError"));
      return;
    }
    router.push("/(setup)/business");
  };

  return (
    <SetupScreen step={t("step1")} stepNumber={1} title={t("chooseLanguageTitle")} subtitle={t("chooseLanguageSubtitle")} footer={<AppButton label={t("continue")} onPress={handleNext} className="bg-secondary_dark" />}>
      <View className="gap-3">
        {languages.map((item) => {
          const selected = language === item.value;
          return (
            <Pressable key={item.value} onPress={() => setLanguage(item.value)} className={clsx("min-h-24 rounded-md border bg-white p-4", selected ? "border-orange" : "border-primary")}>
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Text className="text-lg font-semibold text-secondary_dark">{item.label} {item.flag}</Text>
                  <Text className="text-sm leading-5 text-secondary">{item.description}</Text>
                </View>
                <View className={clsx("h-6 w-6 items-center justify-center rounded-sm border", selected ? "border-orange bg-orange" : "border-primary")}>{selected ? <Check color={colors.secondaryDark} size={16} strokeWidth={3} /> : null}</View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-3">
        <Text className="text-sm font-semibold text-secondary_dark">{t("timezone")}</Text>
        <View className="gap-2">
          {timezoneOptions.map((item) => (
            <Pressable key={item.value} onPress={() => setTimezone(item.value)} className={clsx("min-h-11 justify-center rounded-md border bg-white px-4", timezone === item.value ? "border-orange" : "border-primary")}>
              <Text className="font-medium text-secondary_dark">{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-sm font-semibold text-secondary_dark">{t("dateFormat")}</Text>
        <View className="flex-row flex-wrap gap-2">
          {dateFormats.map((item) => (
            <Pressable key={item} onPress={() => setDateFormat(item)} className={clsx("min-h-10 justify-center rounded-md border bg-white px-3", dateFormat === item ? "border-orange" : "border-primary")}>
              <Text className="font-medium text-secondary_dark">{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-sm font-semibold text-secondary_dark">{t("timeFormat")}</Text>
        <View className="flex-row flex-wrap gap-2">
          {timeFormats.map((item) => (
            <Pressable key={item} onPress={() => setTimeFormat(item)} className={clsx("min-h-10 justify-center rounded-md border bg-white px-3", timeFormat === item ? "border-orange" : "border-primary")}>
              <Text className="font-medium text-secondary_dark">{item === "12h" ? t("timeFormat12h") : t("timeFormat24h")}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-sm font-semibold text-secondary_dark">{t("sessionExpiration")}</Text>
          <Text className="text-sm leading-5 text-muted">{t("sessionExpirationDescription")}</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {sessionTimeoutOptions.map((item) => (
            <Pressable key={item.value ?? "disabled"} onPress={() => setSessionTimeoutMinutes(item.value)} className={clsx("min-h-10 justify-center rounded-md border bg-white px-3", sessionTimeoutMinutes === item.value ? "border-orange" : "border-primary")}>
              <Text className="font-medium text-secondary_dark">{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SetupScreen>
  );
}
