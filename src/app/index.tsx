import { Redirect } from "expo-router";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";

export default function IndexScreen() {
  const session = useAuthStore((state) => state.session);
  return <Redirect href={session ? "/(tabs)/dashboard" : "/(auth)/login"} />;
}
