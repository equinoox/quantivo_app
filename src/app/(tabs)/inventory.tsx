import { Boxes } from "lucide-react-native";

import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useI18n } from "@/shared/i18n/useI18n";

export default function InventoryScreen() {
  const { t } = useI18n();

  return (
    <Screen icon={<Boxes color={colors.secondaryDark} size={36} />} title={t("inventory")} subtitle={t("inventorySubtitle")}>
      <AppCard>
        <EmptyState title={t("inventoryEmptyTitle")} />
      </AppCard>
    </Screen>
  );
}
