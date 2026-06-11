import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Screen } from "@/shared/components/ui/Screen";

export default function DashboardScreen() {
  return (
    <Screen title="Dashboard">
      <AppCard>
        <EmptyState title="Dashboard foundation" message="KPIs, shift status, alerts, and recent activity will live here." />
      </AppCard>
    </Screen>
  );
}
