import { TaxonomyManagementScreen } from "@/features/inventory/products/components/TaxonomyManagementScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function UnitsRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <TaxonomyManagementScreen kind="units" />
    </ProtectedRoute>
  );
}
