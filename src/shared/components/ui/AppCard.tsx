import { PropsWithChildren } from "react";
import { View, ViewProps } from "react-native";
import clsx from "clsx";

export function AppCard({ children, className, ...props }: PropsWithChildren<ViewProps>) {
  return <View className={clsx("gap-4 rounded-lg border border-slate-200 bg-surface p-4", className)} {...props}>{children}</View>;
}
