import { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AngledHeader } from "@/shared/components/ui/AngledHeader";

type ScreenProps = PropsWithChildren<{ title?: string; scrollable?: boolean }>;

export function Screen({ title, scrollable = false, children }: ScreenProps) {
  const content = (
    <View className="flex-1 bg-background">
      {title ? <AngledHeader title={title} compact /> : null}
      <View className="flex-1 gap-5 px-5 py-6">{children}</View>
    </View>
  );
  return <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-secondary_dark">{scrollable ? <ScrollView keyboardShouldPersistTaps="handled" className="bg-background">{content}</ScrollView> : content}</SafeAreaView>;
}
