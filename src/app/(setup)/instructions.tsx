import { router } from "expo-router";
import { View } from "react-native";

import { SetupScreen } from "@/features/setup/components/SetupScreen";
import { AppButton } from "@/shared/components/ui/AppButton";
import { useI18n } from "@/shared/i18n/useI18n";

export default function InstructionsSetupScreen() {
  const { t } = useI18n();

  return (
    <SetupScreen
      step={t("step4")}
      stepNumber={4}
      title={t("instructionsTitle")}
      subtitle={t("instructionsSubtitle")}
      footer={
        <>
          <AppButton label={t("continue")} onPress={() => router.push("/(setup)/integrations")} className="bg-secondary_dark" />
          <AppButton label={t("back")} variant="secondary" onPress={() => router.back()} />
        </>
      }
    >
      <View className="min-h-48 rounded-md border border-dashed border-primary bg-white" />
    </SetupScreen>
  );
}
