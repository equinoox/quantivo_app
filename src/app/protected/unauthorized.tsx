import { router } from "expo-router";

import { AppButton } from "@/shared/components/ui/AppButton";
import { AppError } from "@/shared/components/ui/AppError";
import { Screen } from "@/shared/components/ui/Screen";

export default function UnauthorizedScreen() {
  return (
    <Screen>
      <AppError title="Unauthorized" message="Your current role cannot access this area yet." />
      <AppButton label="Back to dashboard" onPress={() => router.replace("/(tabs)/dashboard")} />
    </Screen>
  );
}
