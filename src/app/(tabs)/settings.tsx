import { router } from "expo-router";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Screen } from "@/shared/components/ui/Screen";

export default function SettingsScreen() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const handleLogout = async () => {
    await clearSession();
    router.replace("/(auth)/login");
  };
  return (
    <Screen title="Settings">
      <AppCard>
        <EmptyState title="Settings foundation" message="Users, roles, sync, database, and device settings will live here." />
        <AppButton label="Log out placeholder" variant="secondary" onPress={handleLogout} />
      </AppCard>
    </Screen>
  );
}
