import { FileText } from "lucide-react-native";

import { TabHeaderActions } from "@/features/notifications/components/TabHeaderActions";
import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useI18n } from "@/shared/i18n/useI18n";

export function InvoicesTab() {
  const { t } = useI18n();

  return (
    <Screen tabPage headerActions={<TabHeaderActions />} icon={<FileText color={colors.secondaryDark} size={36} />} title={t("invoices")} subtitle={t("invoicesSubtitle")}>
      <RevealOnScroll>
        <AppCard>
          <EmptyState title={t("inDevelopment")} message={t("invoicesInDevelopmentMessage")} />
        </AppCard>
      </RevealOnScroll>
    </Screen>
  );
}
