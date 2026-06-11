import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Screen } from "@/shared/components/ui/Screen";

export default function ReportsScreen() {
  return (
    <Screen title="Reports">
      <AppCard>
        <EmptyState title="Reports foundation" message="Inventory valuation, sales, export, and audit reports will be built here." />
      </AppCard>
    </Screen>
  );
}
