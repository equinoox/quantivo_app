import { ReactNode } from "react";
import { Pressable, Text, View, ViewProps } from "react-native";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react-native";

import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";
import { colors } from "@/shared/constants/colors";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";

type AngledHeaderProps = ViewProps & {
  compact?: boolean;
  icon?: ReactNode;
  kicker?: string;
  onBack?: () => void;
  rightActions?: ReactNode;
  showBackButton?: boolean;
  showDate?: boolean;
  subtitle?: string;
  title: string;
};

export function AngledHeader({ className, compact = false, icon, kicker, onBack, rightActions, showBackButton = false, showDate = true, style, title, ...props }: AngledHeaderProps) {
  const responsive = useResponsiveLayout();
  const { formatDate } = useAppFormatters();
  const currentDate = formatDate(new Date());

  return (
    <View className={clsx("bg-secondary_dark", compact ? "pb-9 pt-8" : "pb-12 pt-10", className)} style={[{ paddingHorizontal: responsive.horizontalPadding }, style]} {...props}>
      <View className="self-center gap-3" style={{ maxWidth: responsive.contentMaxWidth, width: "100%" }}>
        {kicker ? <Text className="text-xs font-semibold uppercase tracking-widest text-orange">{kicker}</Text> : null}
        <View className="flex-row flex-wrap items-center gap-3">
          {showBackButton ? (
            <Pressable accessibilityRole="button" onPress={onBack} className="h-10 w-10 items-center justify-center rounded-md">
              <ChevronLeft color={colors.orange} size={28} />
            </Pressable>
          ) : null}
          {icon ? <View className={clsx("items-center justify-center rounded-md bg-primary", responsive.isExtraSmallPhone ? "h-12 w-12" : "h-14 w-14")}>{icon}</View> : null}
          <Text adjustsFontSizeToFit={responsive.isSmallPhone} minimumFontScale={0.82} numberOfLines={2} className={clsx("min-w-0 flex-1 font-bold leading-tight text-text_color_2", compact ? "text-2xl" : "text-3xl")}>{title}</Text>
          <View className="ml-auto flex-row flex-wrap items-center justify-end gap-2">
            {showDate ? (
              <View className="rounded-md bg-primary px-3 py-2">
                <Text numberOfLines={1} className="text-xs font-semibold text-secondary_dark">{currentDate}</Text>
              </View>
            ) : null}
            {rightActions}
          </View>
        </View>
      </View>
    </View>
  );
}
