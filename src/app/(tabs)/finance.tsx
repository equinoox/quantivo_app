import { FinancesTab } from "@/features/finance/components/FinancesTab";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function FinanceRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <FinancesTab />
    </ProtectedRoute>
  );
}
