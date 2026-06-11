import { Text, View } from "react-native";

type EmptyStateProps = { title: string; message?: string };

export function EmptyState({ title, message }: EmptyStateProps) {
  return <View className="items-center gap-2 py-8"><Text className="text-lg font-semibold text-ink">{title}</Text>{message ? <Text className="text-center text-muted">{message}</Text> : null}</View>;
}
