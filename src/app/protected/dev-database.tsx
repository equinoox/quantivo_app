import { Redirect } from "expo-router";

import { DevDatabaseScreen } from "@/features/dev-db/components/DevDatabaseScreen";
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";
import { routes } from "@/shared/constants/routes";

export default function DevDatabaseRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      {__DEV__ ? <DevDatabaseScreen /> : <Redirect href={routes.unauthorized} />}
    </ProtectedRoute>
  );
}
