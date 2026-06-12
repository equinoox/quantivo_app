import { Redirect } from "expo-router";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";

export default function IndexScreen() {
  const session = useAuthStore((state) => state.session);
  const setupStatus = useSetupStore((state) => state.status);

  if (!setupStatus?.isComplete) return <Redirect href="/(setup)/language" />;

  return <Redirect href={session ? "/(tabs)/dashboard" : "/(auth)/login"} />;
}
