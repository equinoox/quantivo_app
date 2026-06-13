import { router } from "expo-router";
import { Settings } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { routes } from "@/shared/constants/routes";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

export default function SettingsScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const clearSession = useAuthStore((state) => state.clearSession);
  const session = useAuthStore((state) => state.session);
  const resetSetup = useSetupStore((state) => state.resetSetup);
  const [isResetConfirmVisible, setIsResetConfirmVisible] = useState(false);

  const handleLogout = async () => {
    await clearSession();
    router.replace("/(auth)/login");
  };

  const handleResetSetup = async () => {
    setIsResetConfirmVisible(false);
    await clearSession();
    const result = await resetSetup();
    if (!result.ok) {
      toast.error(t("resetSetupFailed"), result.error);
      return;
    }
    toast.success(t("resetSetupDone"));
    router.replace("/(setup)/language");
  };

  return (
    <Screen icon={<Settings color={colors.secondaryDark} size={36} />} title={t("settings")} subtitle={t("settingsFoundation")}>
      <AppCard>
        <AppButton label={t("logout")} variant="secondary" onPress={handleLogout} />
      </AppCard>

      <AppCard className="border-primary">
        <View className="gap-1">
          <Text className="text-lg font-semibold text-secondary_dark">{t("productsCms")}</Text>
          <Text className="text-sm text-muted">{t("productsCmsDescription")}</Text>
        </View>
        <AppButton label={t("attributes")} variant="secondary" onPress={() => router.push(routes.attributes)} />
        <AppButton label={t("units")} variant="secondary" onPress={() => router.push(routes.units)} />
        <AppButton label={t("categories")} variant="secondary" onPress={() => router.push(routes.categories)} />
      </AppCard>

      <AppCard className="border-primary">
        <View className="gap-1">
          <Text className="text-lg font-semibold text-secondary_dark">{t("adminSettings")}</Text>
          <Text className="text-sm text-muted">{t("adminSettingsDescription")}</Text>
        </View>
        {session?.user.role === "admin" ? <AppButton label={t("manageWorkers")} variant="secondary" onPress={() => router.push(routes.workersManagement)} /> : null}
        {__DEV__ ? <AppButton label={t("developerDatabase")} variant="secondary" onPress={() => router.push(routes.devDatabase)} /> : null}
        <AppButton label={t("resetSetup")} variant="danger" onPress={() => setIsResetConfirmVisible(true)} />
      </AppCard>

      <ConfirmDialog visible={isResetConfirmVisible} title={t("resetSetupTitle")} message={t("resetSetupMessage")} cancelLabel={t("cancel")} confirmLabel={t("confirm")} onCancel={() => setIsResetConfirmVisible(false)} onConfirm={handleResetSetup} />
    </Screen>
  );
}
