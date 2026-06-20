import { CreateInventoryListScreen } from "@/features/inventory/components/CreateInventoryListScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function NewInventoryListRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager", "worker"]}>
      <CreateInventoryListScreen />
    </ProtectedRoute>
  );
}
