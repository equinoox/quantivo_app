import { ReactNode } from "react";
import { Pressable, Text, View, ViewProps } from "react-native";
import clsx from "clsx";
import { Bell, ChevronLeft } from "lucide-react-native";

import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";
import { colors } from "@/shared/constants/colors";

type AngledHeaderProps = ViewProps & {
  icon?: ReactNode;
  kicker?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  title: string;
  subtitle?: string;
  compact?: boolean;
};

export function AngledHeader({ icon, kicker, onBack, showBackButton = false, title, subtitle, compact = false, className, ...props }: AngledHeaderProps) {
  const { formatDate } = useAppFormatters();
  const currentDate = formatDate(new Date());

  return (
    <View className={clsx("bg-secondary_dark px-5", compact ? "pb-9 pt-8" : "pb-12 pt-10", className)} {...props}>
      <View className="gap-3">
        {kicker ? <Text className="text-xs font-semibold uppercase tracking-widest text-orange">{kicker}</Text> : null}
        <View className="flex-row items-center gap-3">
          {showBackButton ? (
            <Pressable accessibilityRole="button" onPress={onBack} className="h-10 w-10 items-center justify-center rounded-md">
              <ChevronLeft color={colors.orange} size={28} />
            </Pressable>
          ) : null}
          {icon ? <View className="h-14 w-14 items-center justify-center bg-primary rounded-md">{icon}</View> : null}
          <Text className={clsx("flex-1 font-bold leading-tight text-text_color_2", compact ? "text-2xl" : "text-3xl")}>{title}</Text>
          <View className="flex-row items-center gap-2">
            <View className="rounded-md bg-primary px-3 py-2">
              <Text className="text-xs font-semibold text-secondary_dark">{currentDate}</Text>
            </View>
            <Pressable accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Bell color={colors.secondaryDark} size={20} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
