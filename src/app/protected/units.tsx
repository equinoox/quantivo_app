import { TaxonomyManagementScreen } from "@/features/products/components/TaxonomyManagementScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function UnitsRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <TaxonomyManagementScreen kind="units" />
    </ProtectedRoute>
  );
}
