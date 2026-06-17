import { RevenuesExpensesScreen } from "@/features/revenues-expenses/components/RevenuesExpensesScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function RevenuesExpensesRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <RevenuesExpensesScreen />
    </ProtectedRoute>
  );
}
