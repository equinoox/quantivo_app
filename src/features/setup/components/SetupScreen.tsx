import { PropsWithChildren, ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SetupProgress } from "@/features/setup/components/SetupProgress";
import { AnimatedEntrance } from "@/shared/components/ui/AnimatedEntrance";
import { AngledHeader } from "@/shared/components/ui/AngledHeader";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";

type SetupScreenProps = PropsWithChildren<{
  step: string;
  stepNumber: number;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}>;

export function SetupScreen({ step, stepNumber, title, subtitle, footer, children }: SetupScreenProps) {
  const responsive = useResponsiveLayout();

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-secondary_dark">
      <ScrollView keyboardShouldPersistTaps="handled" className="bg-background" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 bg-background">
          <AngledHeader kicker={step} title={title} subtitle={subtitle} showDate={false} />
          <View
            className="flex-1 self-center"
            style={{
              gap: responsive.gap,
              maxWidth: responsive.contentMaxWidth,
              paddingBottom: responsive.verticalPadding,
              paddingHorizontal: responsive.horizontalPadding,
              paddingTop: responsive.isSmallPhone ? 20 : 32,
              width: "100%",
            }}
          >
            <AnimatedEntrance delay={120} distance={8} duration={650}>
              <SetupProgress currentStep={stepNumber} />
            </AnimatedEntrance>
            <AnimatedEntrance delay={280} distance={18} duration={720} scaleFrom={0.985} style={{ flex: 1 }}>
              <View className="gap-4 pt-2">{children}</View>
            </AnimatedEntrance>
            {footer ? (
              <AnimatedEntrance delay={520} distance={12} duration={680}>
                <View className="mt-auto gap-3 pt-8">{footer}</View>
              </AnimatedEntrance>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
