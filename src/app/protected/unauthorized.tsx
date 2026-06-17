import { UnauthorizedScreen } from "@/features/auth/components/UnauthorizedScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";

export default function UnauthorizedRoute() {
  return (
    <ProtectedRoute>
      <UnauthorizedScreen />
    </ProtectedRoute>
  );
}
