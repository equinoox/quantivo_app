import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Screen } from "@/shared/components/ui/Screen";

export default function InventoryScreen() {
  return (
    <Screen title="Inventory">
      <AppCard>
        <EmptyState title="Inventory foundation" message="Stock counts, transactions, and corrections will be built here." />
      </AppCard>
    </Screen>
  );
}
