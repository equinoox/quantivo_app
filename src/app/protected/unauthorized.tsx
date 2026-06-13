import { router } from "expo-router";
import { ShieldAlert } from "lucide-react-native";

import { AppButton } from "@/shared/components/ui/AppButton";
import { AppError } from "@/shared/components/ui/AppError";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useI18n } from "@/shared/i18n/useI18n";

export default function UnauthorizedScreen() {
  const { t } = useI18n();

  return (
    <Screen icon={<ShieldAlert color={colors.secondaryDark} size={36} />} title={t("unauthorized")} subtitle={t("unauthorizedMessage")} showBackButton>
      <AppError title={t("unauthorized")} message={t("unauthorizedMessage")} />
      <AppButton label={t("backToDashboard")} onPress={() => router.replace("/(tabs)/dashboard")} />
    </Screen>
  );
}
