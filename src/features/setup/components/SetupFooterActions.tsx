import { View } from "react-native";

import { AppButton } from "@/shared/components/ui/AppButton";

type SetupFooterActionsProps = {
  backLabel: string;
  continueLabel: string;
  onBack: () => void;
  onContinue: () => void;
};

export function SetupFooterActions({ backLabel, continueLabel, onBack, onContinue }: SetupFooterActionsProps) {
  return (
    <View className="flex-row gap-3">
      <View className="flex-1">
        <AppButton label={backLabel} variant="secondary" onPress={onBack} />
      </View>
      <View className="flex-1">
        <AppButton label={continueLabel} onPress={onContinue} className="bg-secondary_dark" />
      </View>
    </View>
  );
}
