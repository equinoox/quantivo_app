import { RefreshControl, View } from "react-native";
import clsx from "clsx";
import { CircleDollarSign } from "lucide-react-native";

import { CustomFinancialEntryModal } from "@/features/finance/components/CustomFinancialEntryModal";
import { FinanceEntryList } from "@/features/finance/components/FinanceEntryList";
import { FinanceFiltersCard } from "@/features/finance/components/FinanceFiltersCard";
import { FinanceLineGraph } from "@/features/finance/components/FinanceLineGraph";
import { FinanceSummaryCard } from "@/features/finance/components/FinanceSummaryCard";
import { FinancialItemModal } from "@/features/finance/components/FinancialItemModal";
import { useFinances } from "@/features/finance/hooks/useFinances";
import { TabHeaderActions } from "@/features/notifications/components/TabHeaderActions";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { LoadingState } from "@/shared/components/ui/LoadingState";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";
import { useI18n } from "@/shared/i18n/useI18n";

export function FinancesTab() {
  const { t } = useI18n();
  const responsive = useResponsiveLayout();
  const finances = useFinances();
  const isCompactLayout = responsive.isPhone || responsive.isFoldable;
  const chartWidth = Math.min(responsive.window.width - responsive.horizontalPadding * 2 - responsive.cardPadding * 2, responsive.contentMaxWidth ?? responsive.window.width);

  return (
    <Screen tabPage headerActions={<TabHeaderActions />} icon={<CircleDollarSign color={colors.secondaryDark} size={36} />} title={t("finances")} subtitle={t("financesSubtitle")} refreshControl={<RefreshControl refreshing={finances.isRefreshing} onRefresh={finances.refresh} tintColor={colors.orange} />}>
      <View className="gap-4">
        {finances.canManageFinances ? (
          <RevealOnScroll delay={60}>
            <View className={clsx(isCompactLayout ? "gap-2" : "flex-row gap-2")}>
              <View className={clsx(!isCompactLayout && "flex-1")}>
                <AppButton label={t("addFinancialItem")} onPress={finances.openFinancialItemModal} className="bg-secondary_dark" />
              </View>
              <View className={clsx(!isCompactLayout && "flex-1")}>
                <AppButton label={t("addCustomFinancialEntry")} onPress={finances.openCustomEntryModal} className="bg-orange" />
              </View>
            </View>
          </RevealOnScroll>
        ) : null}

        <RevealOnScroll delay={120}>
          <FinanceFiltersCard
            behaviorFilter={finances.behaviorFilter}
            formatDate={finances.formatDate}
            fromDate={finances.fromDate}
            isCompactLayout={isCompactLayout}
            isDateRangeInvalid={finances.isDateRangeInvalid}
            onBehaviorFilterChange={finances.setBehaviorFilter}
            onFromDateChange={finances.setFromDate}
            onToDateChange={finances.setToDate}
            onTypeFilterChange={finances.setTypeFilter}
            t={t}
            toDate={finances.toDate}
            typeFilter={finances.typeFilter}
          />
        </RevealOnScroll>

        <RevealOnScroll delay={180}>
          <FinanceSummaryCard formatMoney={finances.formatMoney} insightMode={finances.insightMode} onInsightModeChange={finances.setInsightMode} t={t} totals={finances.totals} />
        </RevealOnScroll>

        {finances.isLoading ? <LoadingState label={t("loading")} /> : null}

        {!finances.isLoading && finances.visibleEntries.length === 0 ? (
          <RevealOnScroll delay={220}>
            <AppCard>
              <EmptyState title={t("financeEntriesEmptyTitle")} message={finances.isDateRangeInvalid ? t("financeDateRangeInvalid") : t("financeEntriesEmptyMessage")} />
            </AppCard>
          </RevealOnScroll>
        ) : null}

        {!finances.isLoading && finances.visibleEntries.length > 0 && finances.insightMode === "graph" ? (
          <RevealOnScroll delay={220}>
            <FinanceLineGraph chartWidth={chartWidth} entries={finances.visibleEntries} formatMoney={finances.formatMoney} t={t} />
          </RevealOnScroll>
        ) : null}

        {!finances.isLoading && finances.visibleEntries.length > 0 && finances.insightMode === "list" ? <FinanceEntryList entries={finances.visibleEntries} formatMoney={finances.formatMoney} isCompactLayout={isCompactLayout} t={t} /> : null}
      </View>

      <FinancialItemModal
        financialItems={finances.financialItems}
        form={finances.financialItemForm}
        isSaving={finances.isSavingFinancialItem}
        onClose={finances.closeFinancialItemModal}
        onCreate={finances.handleCreateFinancialItem}
        onDeletePress={finances.setDeleteTarget}
        onFormChange={finances.setFinancialItemForm}
        t={t}
        visible={finances.isFinancialItemModalVisible}
      />

      <CustomFinancialEntryModal
        form={finances.customEntryForm}
        formatDate={finances.formatDate}
        formatMoney={finances.formatMoney}
        isSaving={finances.isSavingCustomEntry}
        onClose={finances.closeCustomEntryModal}
        onCreate={finances.handleCreateCustomEntry}
        onFormChange={finances.setCustomEntryForm}
        t={t}
        visible={finances.isCustomEntryModalVisible}
      />

      <ConfirmDialog destructive visible={Boolean(finances.deleteTarget)} title={t("deleteFinancialItemTitle")} message={t("deleteFinancialItemMessage")} cancelLabel={t("cancel")} confirmLabel={t("delete")} onCancel={() => finances.setDeleteTarget(null)} onConfirm={finances.handleDeleteFinancialItem} />
    </Screen>
  );
}
