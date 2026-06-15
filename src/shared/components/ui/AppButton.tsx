import { PropsWithChildren, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, PressableProps, Text } from "react-native";
import clsx from "clsx";

type AppButtonProps = PressableProps & PropsWithChildren<{ label?: string; variant?: "primary" | "secondary" | "danger"; loading?: boolean }>;

export function AppButton({ label, children, variant = "primary", loading = false, disabled, className, ...props }: AppButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn: PressableProps["onPressIn"] = (event) => {
    Animated.spring(scale, { friction: 7, tension: 140, toValue: 0.98, useNativeDriver: true }).start();
    props.onPressIn?.(event);
  };

  const handlePressOut: PressableProps["onPressOut"] = (event) => {
    Animated.spring(scale, { friction: 7, tension: 140, toValue: 1, useNativeDriver: true }).start();
    props.onPressOut?.(event);
  };

  return (
    <Animated.View style={{ alignSelf: "stretch", transform: [{ scale }] }}>
      <Pressable disabled={disabled || loading} className={clsx("min-h-12 items-center justify-center rounded-lg px-4", variant === "primary" && "bg-brand-500", variant === "secondary" && "border border-slate-300 bg-white", variant === "danger" && "bg-red-600", (disabled || loading) && "opacity-60", className)} {...props} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {loading ? (
          <ActivityIndicator color={variant === "secondary" ? "#172033" : "#ffffff"} />
        ) : (
          <Text adjustsFontSizeToFit minimumFontScale={0.86} numberOfLines={2} className={clsx("text-center font-semibold", variant === "secondary" ? "text-ink" : "text-white")}>
            {label ?? children}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
