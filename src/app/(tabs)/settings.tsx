import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Screen } from "@/shared/components/ui/Screen";
import { routes } from "@/shared/constants/routes";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

export default function SettingsScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const clearSession = useAuthStore((state) => state.clearSession);
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
    <Screen title={t("settings")}>
      <AppCard>
        <EmptyState title={t("settings")} message={t("settingsFoundation")} />
        <AppButton label={t("logout")} variant="secondary" onPress={handleLogout} />
      </AppCard>

      <AppCard className="border-primary">
        <View className="gap-1">
          <Text className="text-lg font-semibold text-secondary_dark">{t("adminSettings")}</Text>
          <Text className="text-sm text-muted">{t("adminSettingsDescription")}</Text>
        </View>
        {__DEV__ ? <AppButton label={t("developerDatabase")} variant="secondary" onPress={() => router.push(routes.devDatabase)} /> : null}
        <AppButton label={t("resetSetup")} variant="danger" onPress={() => setIsResetConfirmVisible(true)} />
      </AppCard>

      <ConfirmDialog visible={isResetConfirmVisible} title={t("resetSetupTitle")} message={t("resetSetupMessage")} cancelLabel={t("cancel")} confirmLabel={t("confirm")} onCancel={() => setIsResetConfirmVisible(false)} onConfirm={handleResetSetup} />
    </Screen>
  );
}
