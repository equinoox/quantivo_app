import { PropsWithChildren, ReactNode } from "react";
import { ImageBackground, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AngledHeader } from "@/shared/components/ui/AngledHeader";

type ScreenProps = PropsWithChildren<{ icon?: ReactNode; showBackButton?: boolean; subtitle?: string; title?: string; scrollable?: boolean }>;

export function Screen({ icon, showBackButton = false, subtitle, title, scrollable = true, children }: ScreenProps) {
  const body = <View className="gap-5 px-5 py-6">{children}</View>;
  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-secondary_dark">
      <View className="flex-1 bg-background">
        {title ? <AngledHeader icon={icon} title={title} subtitle={subtitle} showBackButton={showBackButton} onBack={() => router.back()} compact /> : null}
        <ImageBackground source={require("../../../../assets/quantivo_bg.png")} resizeMode="cover" className="flex-1">
          {scrollable ? (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
              {body}
            </ScrollView>
          ) : (
            <View className="flex-1">{body}</View>
          )}
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}
