import { Redirect, Stack, useSegments } from "expo-router";

import { useSetupStore } from "@/features/setup/hooks/useSetupStore";

export default function SetupLayout() {
  const status = useSetupStore((state) => state.status);
  const segments = useSegments();
  const currentScreen = segments[segments.length - 1];

  if (status?.isComplete && currentScreen !== "finalizing") return <Redirect href="/(auth)/login" />;

  return <Stack screenOptions={{ headerShown: false, orientation: "portrait" }} />;
}
