import { NewInventoryProductsScreen } from "@/features/inventory/components/NewInventoryProductsScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function NewInventoryProductsRoute() {
  return (
    <ProtectedRoute>
      <NewInventoryProductsScreen />
    </ProtectedRoute>
  );
}
