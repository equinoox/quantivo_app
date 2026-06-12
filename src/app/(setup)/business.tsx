import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import clsx from "clsx";

import { SetupScreen } from "@/features/setup/components/SetupScreen";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { AppCurrency } from "@/features/setup/types/setup.types";
import { restaurantSetupSchema } from "@/features/setup/validation/setup.schemas";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/AppInput";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

export default function BusinessSetupScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const restaurantName = useSetupStore((state) => state.draft.restaurantName);
  const currency = useSetupStore((state) => state.draft.currency);
  const setRestaurantName = useSetupStore((state) => state.setRestaurantName);
  const setCurrency = useSetupStore((state) => state.setCurrency);
  const currencies: { value: AppCurrency; label: string }[] = [
    { value: "RSD", label: "RSD" },
    { value: "EUR", label: "EUR" },
    { value: "USD", label: "USD" },
  ];

  const handleNext = () => {
    const parsed = restaurantSetupSchema.safeParse({ restaurantName });
    if (!parsed.success) {
      toast.error(t("restaurantNameError"));
      return;
    }
    setRestaurantName(parsed.data.restaurantName);
    router.push("/(setup)/admins");
  };

  return (
    <SetupScreen
      step={t("step2")}
      stepNumber={2}
      title={t("businessTitle")}
      subtitle={t("businessSubtitle")}
      footer={
        <>
          <AppButton label={t("continue")} onPress={handleNext} className="bg-secondary_dark" />
          <AppButton label={t("back")} variant="secondary" onPress={() => router.back()} />
        </>
      }
    >
      <AppInput label={t("restaurantName")} value={restaurantName} onChangeText={setRestaurantName} autoCapitalize="words" />
      <View className="gap-3">
        <Text className="text-sm font-semibold text-secondary_dark">{t("currency")}</Text>
        <View className="flex-row flex-wrap gap-2">
          {currencies.map((item) => (
            <Pressable key={item.value} onPress={() => setCurrency(item.value)} className={clsx("min-h-10 justify-center rounded-md border bg-white px-4", currency === item.value ? "border-orange" : "border-primary")}>
              <Text className="font-semibold text-secondary_dark">{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SetupScreen>
  );
}
