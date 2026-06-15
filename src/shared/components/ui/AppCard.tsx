import { PropsWithChildren } from "react";
import { View, ViewProps } from "react-native";
import clsx from "clsx";

import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";

export function AppCard({ children, className, ...props }: PropsWithChildren<ViewProps>) {
  const responsive = useResponsiveLayout();
  const { style, ...rest } = props;

  return (
    <View className={clsx("gap-4 rounded-lg border border-slate-200 bg-surface", responsive.isExtraSmallPhone ? "p-3" : "p-4", className)} style={style} {...rest}>
      {children}
    </View>
  );
}
