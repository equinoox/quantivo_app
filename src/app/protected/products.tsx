import { ProductsTab } from "@/features/inventory/products/components/ProductsTab";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function ProductsRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager", "worker"]}>
      <ProductsTab />
    </ProtectedRoute>
  );
}
