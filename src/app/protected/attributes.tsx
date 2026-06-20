import { TaxonomyManagementScreen } from "@/features/inventory/products/components/TaxonomyManagementScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function AttributesRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <TaxonomyManagementScreen kind="attributes" />
    </ProtectedRoute>
  );
}
