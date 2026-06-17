import { TaxonomyManagementScreen } from "@/features/products/components/TaxonomyManagementScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function CategoriesRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <TaxonomyManagementScreen kind="categories" />
    </ProtectedRoute>
  );
}
