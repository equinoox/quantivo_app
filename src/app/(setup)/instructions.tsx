import { router } from "expo-router";
import { ChevronRight, ClipboardList, ListPlus, Package, ReceiptText, UsersRound, Wrench } from "lucide-react-native";
import { ReactNode } from "react";
import { Text, View } from "react-native";

import { SetupScreen } from "@/features/setup/components/SetupScreen";
import { AppButton } from "@/shared/components/ui/AppButton";
import { colors } from "@/shared/constants/colors";
import { useI18n } from "@/shared/i18n/useI18n";

function InstructionCard({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <View className="min-h-16 flex-row items-center gap-3 rounded-md border border-primary bg-white px-3 py-3">
      <View className="h-11 w-11 items-center justify-center rounded-md bg-primary">{icon}</View>
      <Text className="flex-1 text-base font-semibold text-secondary_dark">{title}</Text>
      <ChevronRight color={colors.orange} size={22} />
    </View>
  );
}

export default function InstructionsSetupScreen() {
  const { t } = useI18n();
  const cards = [
    { icon: <ListPlus color={colors.secondaryDark} size={22} />, title: t("instructionNewList") },
    { icon: <ClipboardList color={colors.secondaryDark} size={22} />, title: t("instructionListInsight") },
    { icon: <Package color={colors.secondaryDark} size={22} />, title: t("instructionProductsManagement") },
    { icon: <ReceiptText color={colors.secondaryDark} size={22} />, title: t("instructionExpensesRevenues") },
    { icon: <UsersRound color={colors.secondaryDark} size={22} />, title: t("instructionWorkers") },
    { icon: <Wrench color={colors.secondaryDark} size={22} />, title: t("instructionGlobalConfigurations") },
  ];

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
      <View className="gap-3">
        {cards.map((card) => <InstructionCard key={card.title} icon={card.icon} title={card.title} />)}
      </View>
    </SetupScreen>
  );
}
