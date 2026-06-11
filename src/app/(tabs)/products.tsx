import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Screen } from "@/shared/components/ui/Screen";

export default function ProductsScreen() {
  return (
    <Screen title="Products">
      <AppCard>
        <EmptyState title="Products foundation" message="Product catalog, categories, pricing, and reorder settings will live here." />
      </AppCard>
    </Screen>
  );
}
