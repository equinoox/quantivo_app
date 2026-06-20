import { router } from "expo-router";
import { BarChart3, CircleDollarSign, ClipboardList, FileText, LayoutDashboard, Package } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { TabHeaderActions } from "@/features/notifications/components/TabHeaderActions";
import { AppCard } from "@/shared/components/ui/AppCard";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { routes } from "@/shared/constants/routes";
import { useI18n } from "@/shared/i18n/useI18n";

type DashboardActionCardProps = {
  description: string;
  icon: ReactNode;
  label: string;
  onPress: () => void;
};

function DashboardActionCard({ description, icon, label, onPress }: DashboardActionCardProps) {
  return (
    <Pressable onPress={onPress}>
      <AppCard className="border-primary bg-white">
        <View className="min-h-20 flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-md bg-primary">{icon}</View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold text-secondary_dark">{label}</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">{description}</Text>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

export function DashboardTab() {
  const { t } = useI18n();

  return (
    <Screen tabPage headerActions={<TabHeaderActions />} icon={<LayoutDashboard color={colors.secondaryDark} size={36} />} title={t("dashboardMain")} subtitle={t("dashboardMainSubtitle")}>
      <View className="gap-4">
        <RevealOnScroll>
          <View className="gap-3">
            <DashboardActionCard description={t("dashboardInventoryDescription")} icon={<ClipboardList color={colors.secondaryDark} size={22} />} label={t("inventory")} onPress={() => router.push(routes.inventory)} />
            <DashboardActionCard description={t("dashboardProductsDescription")} icon={<Package color={colors.secondaryDark} size={22} />} label={t("products")} onPress={() => router.push(routes.products)} />
            <DashboardActionCard description={t("dashboardFinanceDescription")} icon={<CircleDollarSign color={colors.secondaryDark} size={22} />} label={t("finances")} onPress={() => router.push(routes.finance)} />
            <DashboardActionCard description={t("dashboardInvoicesDescription")} icon={<FileText color={colors.secondaryDark} size={22} />} label={t("invoices")} onPress={() => router.push(routes.invoices)} />
            <DashboardActionCard description={t("dashboardReportsDescription")} icon={<BarChart3 color={colors.secondaryDark} size={22} />} label={t("reports")} onPress={() => router.push(routes.reports)} />
          </View>
        </RevealOnScroll>
      </View>
    </Screen>
  );
}
