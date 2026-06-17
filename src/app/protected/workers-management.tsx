import { WorkersManagementScreen } from "@/features/workers/components/WorkersManagementScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function WorkersManagementRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <WorkersManagementScreen />
    </ProtectedRoute>
  );
}
