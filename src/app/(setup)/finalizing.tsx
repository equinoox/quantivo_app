import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { SetupScreen } from "@/features/setup/components/SetupScreen";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppButton } from "@/shared/components/ui/AppButton";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

export default function FinalizingSetupScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const completeSetup = useSetupStore((state) => state.completeSetup);
  const [isConfirmVisible, setIsConfirmVisible] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const finalize = async () => {
    setIsConfirmVisible(false);
    setIsSettingUp(true);
    const result = await completeSetup();
    setIsSettingUp(false);
    setIsComplete(result.ok);
    if (!result.ok) toast.error(t("setupFailed"), result.error);
  };

  return (
    <SetupScreen
      step={t("step6")}
      stepNumber={6}
      title={t("settingUpTitle")}
      subtitle={t("settingUpSubtitle")}
      footer={
        <>
          <AppButton label={t("goToLogin")} disabled={!isComplete} onPress={() => router.replace("/(auth)/login")} className="bg-secondary_dark" />
          {!isComplete ? <AppButton label={t("back")} variant="secondary" onPress={() => router.back()} /> : null}
        </>
      }
    >
      <View className="items-center gap-5 rounded-md border border-primary bg-white p-8">
        {isSettingUp ? <ActivityIndicator color={colors.orange} size="large" /> : null}
        <Text className="text-center text-base font-semibold text-secondary_dark">{isSettingUp ? t("settingUpTitle") : isComplete ? t("setupComplete") : t("confirmSetupToContinue")}</Text>
      </View>
      <ConfirmDialog visible={isConfirmVisible} title={t("finishSetupTitle")} message={t("finishSetupMessage")} cancelLabel={t("cancel")} confirmLabel={t("confirm")} onCancel={() => router.back()} onConfirm={finalize} />
    </SetupScreen>
  );
}
