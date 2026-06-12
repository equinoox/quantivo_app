import "../global.css";

import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View, StatusBar } from "react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { ToastProvider } from "@/shared/components/feedback/ToastProvider";
import { colors } from "@/shared/constants/colors";

function AppNavigator() {
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(setup)" options={{ orientation: "portrait" }} />
      <Stack.Screen name="(auth)" options={{ orientation: "portrait" }} />
      <Stack.Screen name="(tabs)" options={{ orientation: "portrait" }} />
      <Stack.Screen name="protected/dev-database" options={{ orientation: "portrait" }} />
      <Stack.Screen name="protected/unauthorized" options={{ orientation: "portrait" }} />
    </Stack>
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
