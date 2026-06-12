import { router } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { loginSchema, type LoginInput } from "@/features/auth/validation/auth.schemas";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { AnimatedEntrance } from "@/shared/components/ui/AnimatedEntrance";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/AppInput";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

export default function LoginScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const signIn = useAuthStore((state) => state.signIn);
  const businessName = useSetupStore((state) => state.status?.restaurantName);
  const { setValue, watch } = useForm<LoginInput>({ defaultValues: { identifier: "", password: "" } });
  const formValues = watch();

  const handleSubmit = async () => {
    const parsed = loginSchema.safeParse(formValues);
    if (!parsed.success) {
      toast.error(t("checkLogin"));
      return;
    }
    const result = await signIn(parsed.data);
    if (!result.ok) {
      toast.error(t("invalidLogin"));
      return;
    }
    router.replace("/(tabs)/dashboard");
  };

  return (
    <Screen scrollable>
      <AnimatedEntrance>
        <View className="gap-5 py-5">
          <View className="overflow-hidden rounded-md bg-secondary_dark p-5">
            <View className="mb-8 h-1 w-16 rounded-sm bg-orange" />
            <View className="gap-2">
              <Text className="text-xs font-semibold uppercase tracking-widest text-orange">Quantivo</Text>
              <Text className="text-4xl font-bold leading-tight text-text_color_2">{businessName || "Quantivo"}</Text>
              <Text className="text-base leading-6 text-primary">{t("appSubtitle")}</Text>
            </View>
          </View>

          <View className="gap-5 rounded-md border border-primary bg-white p-5">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-md bg-primary">
                <ShieldCheck color={colors.secondaryDark} size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-secondary_dark">{t("login")}</Text>
                <Text className="text-sm text-muted">{t("loginSubtitle")}</Text>
              </View>
            </View>

            <View className="h-px bg-primary" />
            <AppInput label={t("fullName")} autoCapitalize="words" value={formValues.identifier} onChangeText={(value) => setValue("identifier", value)} />
            <AppInput label={t("password")} secureTextEntry value={formValues.password} onChangeText={(value) => setValue("password", value)} />
            <AppButton label={t("login")} onPress={handleSubmit} className="bg-secondary_dark" />
          </View>
        </View>
      </AnimatedEntrance>
    </Screen>
  );
}
