import { PropsWithChildren } from "react";
import { Text, View } from "react-native";
import Toast, { ToastConfig, ToastConfigParams } from "react-native-toast-message";

import { colors } from "@/shared/constants/colors";

const toneByType = {
  error: { accent: "#dc2626", background: "#fff5f5", title: "#991b1b" },
  info: { accent: colors.secondaryDark, background: "#ffffff", title: colors.secondaryDark },
  success: { accent: "#16a34a", background: "#f0fdf4", title: "#166534" },
};

function AppToast({ text1, text2, type }: ToastConfigParams<unknown>) {
  const tone = type === "error" ? toneByType.error : type === "info" ? toneByType.info : toneByType.success;

  return (
    <View className="mx-4 overflow-hidden rounded-md border border-primary shadow-sm" style={{ backgroundColor: tone.background, maxWidth: "92%", minWidth: "92%" }}>
      <View className="flex-row">
        <View style={{ backgroundColor: tone.accent, width: 5 }} />
        <View className="flex-1 gap-1 px-4 py-3">
          {text1 ? <Text className="text-base font-semibold" style={{ color: tone.title }}>{text1}</Text> : null}
          {text2 ? <Text className="text-sm leading-5 text-secondary">{text2}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const toastConfig: ToastConfig = {
  error: (params) => <AppToast {...params} />,
  info: (params) => <AppToast {...params} />,
  success: (params) => <AppToast {...params} />,
};

export function ToastProvider({ children }: PropsWithChildren) {
  return <>{children}<Toast config={toastConfig} visibilityTime={6500} /></>;
}
