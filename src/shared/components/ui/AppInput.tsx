import { Text, TextInput, TextInputProps, View } from "react-native";
import clsx from "clsx";

type AppInputProps = TextInputProps & { label?: string; error?: string };

export function AppInput({ label, error, className, ...props }: AppInputProps) {
  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-medium text-ink">{label}</Text> : null}
      <TextInput placeholderTextColor="#8a94a6" className={clsx("min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-ink", className)} {...props} />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
