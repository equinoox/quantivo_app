import "../global.css";

import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View, StatusBar, Text } from "react-native";

import { useSessionInactivity } from "@/features/auth/hooks/useSessionInactivity";
import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { ToastProvider } from "@/shared/components/feedback/ToastProvider";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppModal } from "@/shared/components/ui/AppModal";
import { colors } from "@/shared/constants/colors";
import { useI18n } from "@/shared/i18n/useI18n";

function AppNavigator() {
  const { endExpiredSession, isSessionExpired, markActivity } = useSessionInactivity();
  const { t } = useI18n();
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const hydrateSetup = useSetupStore((state) => state.hydrate);
  const isSetupHydrated = useSetupStore((state) => state.isHydrated);

  useEffect(() => {
    void hydrateSetup().then(hydrateAuth);
  }, [hydrateAuth, hydrateSetup]);

  if (!isAuthHydrated || !isSetupHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  return (
    <View className="flex-1" onTouchStart={markActivity}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(setup)" options={{ orientation: "portrait" }} />
        <Stack.Screen name="(auth)" options={{ orientation: "portrait" }} />
        <Stack.Screen name="(tabs)" options={{ orientation: "portrait" }} />
        <Stack.Screen name="protected/attributes" options={{ orientation: "portrait" }} />
        <Stack.Screen name="protected/categories" options={{ orientation: "portrait" }} />
        <Stack.Screen name="protected/dev-database" options={{ orientation: "portrait" }} />
        <Stack.Screen name="protected/revenues-expenses" options={{ orientation: "portrait" }} />
        <Stack.Screen name="protected/units" options={{ orientation: "portrait" }} />
        <Stack.Screen name="protected/workers-management" options={{ orientation: "portrait" }} />
        <Stack.Screen name="protected/unauthorized" options={{ orientation: "portrait" }} />
      </Stack>
      <AppModal visible={isSessionExpired}>
        <View className="gap-5">
          <View className="h-1 w-14 rounded-sm bg-orange" />
          <View>
            <Text className="text-xl font-semibold text-secondary_dark">{t("sessionExpiredTitle")}</Text>
            <Text className="mt-2 leading-5 text-secondary">{t("sessionExpiredMessage")}</Text>
          </View>
          <AppButton label={t("goToLogin")} onPress={endExpiredSession} className="bg-secondary_dark" />
        </View>
      </AppModal>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
        <AppNavigator />
      </ToastProvider>
    </ErrorBoundary>
  );
}
