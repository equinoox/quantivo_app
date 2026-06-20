import { BarChart3 } from "lucide-react-native";

import { TabHeaderActions } from "@/features/notifications/components/TabHeaderActions";
import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useI18n } from "@/shared/i18n/useI18n";

export function ReportsTab() {
  const { t } = useI18n();

  return (
    <Screen tabPage headerActions={<TabHeaderActions />} icon={<BarChart3 color={colors.secondaryDark} size={36} />} title={t("reports")} subtitle={t("reportsSubtitle")}>
      <RevealOnScroll>
        <AppCard>
          <EmptyState title={t("reportsEmptyTitle")} message={t("reportsInDevelopmentMessage")} />
        </AppCard>
      </RevealOnScroll>
    </Screen>
  );
}
