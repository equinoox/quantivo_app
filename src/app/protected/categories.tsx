import { TaxonomyManagementScreen } from "@/features/inventory/products/components/TaxonomyManagementScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function CategoriesRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <TaxonomyManagementScreen kind="categories" />
    </ProtectedRoute>
  );
}
