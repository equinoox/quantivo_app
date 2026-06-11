import { Text, View } from "react-native";

type AppErrorProps = { title?: string; message: string };

export function AppError({ title = "Something went wrong", message }: AppErrorProps) {
  return <View className="rounded-lg border border-red-200 bg-red-50 p-4"><Text className="font-semibold text-red-700">{title}</Text><Text className="mt-1 text-red-700">{message}</Text></View>;
}
