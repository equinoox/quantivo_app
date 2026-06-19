import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image, Pressable, Text, View } from "react-native";
import clsx from "clsx";
import { ImageIcon } from "lucide-react-native";

import { SetupScreen } from "@/features/setup/components/SetupScreen";
import { SetupFooterActions } from "@/features/setup/components/SetupFooterActions";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { AppCurrency } from "@/features/setup/types/setup.types";
import { restaurantSetupSchema } from "@/features/setup/validation/setup.schemas";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppInput } from "@/shared/components/ui/AppInput";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

export function SetupBusinessScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const restaurantName = useSetupStore((state) => state.draft.restaurantName);
  const businessLogoUri = useSetupStore((state) => state.draft.businessLogoUri);
  const businessBackgroundUri = useSetupStore((state) => state.draft.businessBackgroundUri);
  const currency = useSetupStore((state) => state.draft.currency);
  const setRestaurantName = useSetupStore((state) => state.setRestaurantName);
  const setBusinessLogoUri = useSetupStore((state) => state.setBusinessLogoUri);
  const setBusinessBackgroundUri = useSetupStore((state) => state.setBusinessBackgroundUri);
  const setCurrency = useSetupStore((state) => state.setCurrency);
  const currencies: { value: AppCurrency; label: string }[] = [
    { value: "RSD", label: "RSD" },
    { value: "EUR", label: "EUR" },
    { value: "USD", label: "USD" },
  ];

  const handlePickBusinessImage = async (target: "logo" | "background") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error(t("imagePermissionRequired"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: target === "logo" ? [1, 1] : [9, 16],
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled) return;
    const uri = result.assets[0]?.uri ?? "";
    if (target === "logo") setBusinessLogoUri(uri);
    else setBusinessBackgroundUri(uri);
  };

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
      footer={<SetupFooterActions backLabel={t("back")} continueLabel={t("continue")} onBack={() => router.back()} onContinue={handleNext} />}
    >
      <AppInput label={t("restaurantName")} value={restaurantName} onChangeText={setRestaurantName} autoCapitalize="words" />
      <AppCard className="border-primary">
        <View className="gap-1">
          <Text className="text-base font-semibold text-secondary_dark">{t("businessLogo")}</Text>
          <Text className="text-sm leading-5 text-muted">{t("businessLogoGuidance")}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-primary bg-white">
            {businessLogoUri ? <Image source={{ uri: businessLogoUri }} className="h-full w-full" resizeMode="cover" /> : <ImageIcon color={colors.secondaryDark} size={28} />}
          </View>
          <View className="flex-1 gap-2">
            <AppButton label={t("selectLogo")} variant="secondary" onPress={() => handlePickBusinessImage("logo")} />
            {businessLogoUri ? <AppButton label={t("removeLogo")} variant="danger" onPress={() => setBusinessLogoUri("")} /> : null}
          </View>
        </View>
      </AppCard>
      <AppCard className="border-primary">
        <View className="gap-1">
          <Text className="text-base font-semibold text-secondary_dark">{t("businessBackground")}</Text>
          <Text className="text-sm leading-5 text-muted">{t("businessBackgroundGuidance")}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="h-28 w-20 items-center justify-center overflow-hidden rounded-md border border-primary bg-white">
            {businessBackgroundUri ? <Image source={{ uri: businessBackgroundUri }} className="h-full w-full" resizeMode="cover" /> : <ImageIcon color={colors.secondaryDark} size={28} />}
          </View>
          <View className="flex-1 gap-2">
            <AppButton label={t("selectBackground")} variant="secondary" onPress={() => handlePickBusinessImage("background")} />
            {businessBackgroundUri ? <AppButton label={t("removeBackground")} variant="danger" onPress={() => setBusinessBackgroundUri("")} /> : null}
          </View>
        </View>
      </AppCard>
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
