import { PropsWithChildren } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = PropsWithChildren<{ title?: string; scrollable?: boolean }>;

export function Screen({ title, scrollable = false, children }: ScreenProps) {
  const content = <View className="flex-1 gap-5 px-5 py-6">{title ? <Text className="text-3xl font-bold text-ink">{title}</Text> : null}{children}</View>;
  return <SafeAreaView className="flex-1 bg-background">{scrollable ? <ScrollView keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}</SafeAreaView>;
}
