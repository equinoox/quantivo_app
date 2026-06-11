import { ActivityIndicator, Text, View } from "react-native";

type LoadingStateProps = { label?: string };

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return <View className="items-center gap-3 py-8"><ActivityIndicator /><Text className="text-muted">{label}</Text></View>;
}
