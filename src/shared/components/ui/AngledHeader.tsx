import { Text, View, ViewProps } from "react-native";
import clsx from "clsx";

type AngledHeaderProps = ViewProps & {
  kicker?: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
};

export function AngledHeader({ kicker, title, subtitle, compact = false, className, ...props }: AngledHeaderProps) {
  return (
    <View className={clsx("relative overflow-hidden bg-secondary_dark px-5", compact ? "pb-8 pt-6" : "pb-12 pt-8", className)} {...props}>
      <View className="gap-3">
        {kicker ? <Text className="text-xs font-semibold uppercase tracking-widest text-orange">{kicker}</Text> : null}
        <Text className={clsx("font-bold leading-tight text-text_color_2", compact ? "text-3xl" : "text-4xl")}>{title}</Text>
        {subtitle ? <Text className={clsx("max-w-xl leading-6 text-primary", compact ? "text-sm" : "text-base")}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
