import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";

export default function AuthLayout() {
  const session = useAuthStore((state) => state.session);
  const setupStatus = useSetupStore((state) => state.status);

  if (!setupStatus?.isComplete) return <Redirect href="/(setup)/language" />;
  if (session) return <Redirect href="/(tabs)/dashboard" />;

  return <Stack screenOptions={{ headerShown: false, orientation: "portrait" }} />;
}
