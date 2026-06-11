import { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";
import clsx from "clsx";

type AppButtonProps = PressableProps & PropsWithChildren<{ label?: string; variant?: "primary" | "secondary" | "danger"; loading?: boolean }>;

export function AppButton({ label, children, variant = "primary", loading = false, disabled, className, ...props }: AppButtonProps) {
  return (
    <Pressable disabled={disabled || loading} className={clsx("min-h-12 items-center justify-center rounded-lg px-4", variant === "primary" && "bg-brand-500", variant === "secondary" && "border border-slate-300 bg-white", variant === "danger" && "bg-red-600", (disabled || loading) && "opacity-60", className)} {...props}>
      {loading ? <ActivityIndicator color={variant === "secondary" ? "#172033" : "#ffffff"} /> : <Text className={clsx("font-semibold", variant === "secondary" ? "text-ink" : "text-white")}>{label ?? children}</Text>}
    </Pressable>
  );
}
