import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import clsx from "clsx";

import { SetupScreen } from "@/features/setup/components/SetupScreen";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { AppDateFormat, AppLanguage } from "@/features/setup/types/setup.types";
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

const dateFormats: AppDateFormat[] = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"];

export default function LanguageSetupScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const language = useSetupStore((state) => state.draft.language);
  const timezone = useSetupStore((state) => state.draft.timezone);
  const dateFormat = useSetupStore((state) => state.draft.dateFormat);
  const setLanguage = useSetupStore((state) => state.setLanguage);
  const setTimezone = useSetupStore((state) => state.setTimezone);
  const setDateFormat = useSetupStore((state) => state.setDateFormat);
  const languages: { value: AppLanguage; label: string; flag: string; description: string }[] = [
    { value: "en", label: t("english"), flag: "\u{1F1EC}\u{1F1E7}", description: t("englishDescription") },
    { value: "sr", label: t("serbian"), flag: "\u{1F1F7}\u{1F1F8}", description: t("serbianDescription") },
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
    </SetupScreen>
  );
}
