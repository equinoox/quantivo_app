import { ProductSettingsScreen } from "@/features/inventory/products/components/ProductSettingsScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function ProductSettingsRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ProductSettingsScreen />
    </ProtectedRoute>
  );
}
