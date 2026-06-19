import { router } from "expo-router";
import { BrainCircuit, Cloud, DollarSign, Link, Server, ShoppingCart } from "lucide-react-native";
import { ReactNode } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

import { SetupScreen } from "@/features/setup/components/SetupScreen";
import { SetupFooterActions } from "@/features/setup/components/SetupFooterActions";
import { AppButton } from "@/shared/components/ui/AppButton";
import { colors } from "@/shared/constants/colors";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";
import { useI18n } from "@/shared/i18n/useI18n";

type IntegrationTone = "default" | "google" | "quantivo";

function GoogleIcon() {
  return (
    <Svg height={24} viewBox="0 0 24 24" width={24}>
      <Path d="M21.6 12.22c0-.78-.07-1.53-.2-2.22H12v4.2h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.5Z" fill="#4285F4" />
      <Path d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.08v2.58A10 10 0 0 0 12 22Z" fill="#34A853" />
      <Path d="M6.42 13.9A6 6 0 0 1 6.1 12c0-.66.11-1.3.32-1.9V7.51H3.08A10 10 0 0 0 2 12c0 1.62.39 3.15 1.08 4.49l3.34-2.58Z" fill="#FBBC05" />
      <Path d="M12 5.97c1.47 0 2.8.51 3.84 1.5l2.86-2.87A9.57 9.57 0 0 0 12 2a10 10 0 0 0-8.92 5.51l3.34 2.59C7.2 7.73 9.4 5.97 12 5.97Z" fill="#EA4335" />
    </Svg>
  );
}

function IntegrationGradient({ tone }: { tone: Exclude<IntegrationTone, "default"> }) {
  if (tone === "google") {
    return (
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="googleGradient" x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor="#4285F4" stopOpacity="0.78" />
            <Stop offset="0.32" stopColor="#EA4335" stopOpacity="0.72" />
            <Stop offset="0.66" stopColor="#FBBC05" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#34A853" stopOpacity="0.74" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#googleGradient)" height="100%" width="100%" />
      </Svg>
    );
  }

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="quantivoGradient" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#ff9411" stopOpacity="0.88" />
          <Stop offset="0.5" stopColor="#ff9411" stopOpacity="0.86" />
          <Stop offset="1" stopColor="#ff9411" stopOpacity="0.88" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#quantivoGradient)" height="100%" width="100%" />
    </Svg>
  );
}

function IntegrationCard({ activateLabel, icon, style, title, tone = "default" }: { activateLabel: string; icon: ReactNode; style?: ViewStyle; title: string; tone?: IntegrationTone }) {
  const borderClass = tone === "google" ? "border-white" : "border-primary";

  return (
    <View className={`min-h-16 overflow-hidden rounded-md border bg-white shadow-sm ${borderClass}`} style={[{ elevation: 2, shadowColor: colors.secondaryDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 5 }, style]}>
      {tone !== "default" ? <IntegrationGradient tone={tone} /> : null}
      <View className="flex-row flex-wrap items-center gap-3 px-3 py-3">
        <View className="h-11 w-11 items-center justify-center rounded-md bg-white">{icon}</View>
        <Text numberOfLines={2} className="min-w-0 flex-1 text-base font-semibold text-secondary_dark">{title}</Text>
        <View className="min-w-24 flex-shrink-0">
          <AppButton label={activateLabel} className="bg-secondary_dark" />
        </View>
      </View>
    </View>
  );
}

export function SetupIntegrationsScreen() {
  const { t } = useI18n();
  const responsive = useResponsiveLayout();
  const cardStyle: ViewStyle = responsive.isTablet ? { flexBasis: "48%", flexGrow: 1 } : { width: "100%" };
  const cards = [
    { icon: <Server color={colors.secondaryDark} size={22} />, title: t("integrationServer") },
    { icon: <Cloud color={colors.secondaryDark} size={22} />, title: t("integrationCloud") },
    { icon: <GoogleIcon />, title: t("integrationGoogle"), tone: "google" as const },
    { icon: <BrainCircuit color={colors.secondaryDark} size={22} />, title: t("integrationQuantivoAi"), tone: "quantivo" as const },
    { icon: <DollarSign color={colors.secondaryDark} size={22} />, title: t("integrationQuantivoFinances"), tone: "quantivo" as const },
    { icon: <Link color={colors.secondaryDark} size={22} />, title: t("integrationQuantivoLink"), tone: "quantivo" as const },
    { icon: <ShoppingCart color={colors.secondaryDark} size={22} />, title: t("integrationQuantivoSale"), tone: "quantivo" as const },
  ];

  return (
    <SetupScreen
      step={t("step5")}
      stepNumber={5}
      title={t("integrationsTitle")}
      subtitle={t("integrationsSubtitle")}
      footer={<SetupFooterActions backLabel={t("back")} continueLabel={t("finishSetup")} onBack={() => router.back()} onContinue={() => router.push("/(setup)/finalizing")} />}
    >
      <View className="flex-row flex-wrap gap-3">
        {cards.map((card) => <IntegrationCard key={card.title} activateLabel={t("activate")} icon={card.icon} style={cardStyle} title={card.title} tone={card.tone} />)}
      </View>
    </SetupScreen>
  );
}
