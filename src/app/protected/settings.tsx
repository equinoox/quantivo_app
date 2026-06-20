import { SettingsTab } from "@/features/settings/components/SettingsTab";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function SettingsRoute() {
  return (
    <ProtectedRoute>
      <SettingsTab />
    </ProtectedRoute>
  );
}
