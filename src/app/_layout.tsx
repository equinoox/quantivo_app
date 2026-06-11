import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { ToastProvider } from "@/shared/components/feedback/ToastProvider";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="protected/unauthorized" />
        </Stack>
      </ToastProvider>
    </ErrorBoundary>
  );
}
