import { PropsWithChildren, ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SetupProgress } from "@/features/setup/components/SetupProgress";
import { AnimatedEntrance } from "@/shared/components/ui/AnimatedEntrance";
import { AngledHeader } from "@/shared/components/ui/AngledHeader";

type SetupScreenProps = PropsWithChildren<{
  step: string;
  stepNumber: number;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}>;

export function SetupScreen({ step, stepNumber, title, subtitle, footer, children }: SetupScreenProps) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-secondary_dark">
      <ScrollView keyboardShouldPersistTaps="handled" className="bg-background" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 bg-background">
          <AngledHeader kicker={step} title={title} subtitle={subtitle} />
          <View className="flex-1 gap-4 px-5 pb-6 pt-8">
            <SetupProgress currentStep={stepNumber} />
            <AnimatedEntrance style={{ flex: 1 }}>
              <View className="gap-4 pt-2">{children}</View>
            </AnimatedEntrance>
            {footer ? <View className="mt-auto gap-3 pt-8">{footer}</View> : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
