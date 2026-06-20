import { InventoryListsScreen } from "@/features/inventory/components/InventoryListsScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function InventoryListsRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager", "worker"]}>
      <InventoryListsScreen />
    </ProtectedRoute>
  );
}
