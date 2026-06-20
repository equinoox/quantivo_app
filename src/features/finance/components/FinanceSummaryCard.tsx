import { Pressable, Text, View } from "react-native";
import clsx from "clsx";
import { FileText, LineChart } from "lucide-react-native";

import { FinanceInsightMode, FinanceTotals } from "@/features/finance/types/finance.types";
import { AppCard } from "@/shared/components/ui/AppCard";
import { colors } from "@/shared/constants/colors";

type FinanceSummaryCardProps = {
  formatMoney: (value: number) => string;
  insightMode: FinanceInsightMode;
  onInsightModeChange: (mode: FinanceInsightMode) => void;
  t: (key: string) => string;
  totals: FinanceTotals;
};

export function FinanceSummaryCard({ formatMoney, insightMode, onInsightModeChange, t, totals }: FinanceSummaryCardProps) {
  return (
    <AppCard className="border-secondary_dark bg-white">
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1 gap-2">
          <Text className="text-base font-semibold text-green-700">{t("totalRevenues")}: {formatMoney(totals.revenues)}</Text>
          <Text className="text-base font-semibold text-red-700">{t("totalExpenses")}: {formatMoney(totals.expenses)}</Text>
          <Text className={clsx("text-lg font-bold", totals.difference >= 0 ? "text-green-700" : "text-red-700")}>{t("financeDifference")}: {formatMoney(totals.difference)}</Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable accessibilityLabel={t("financeListView")} onPress={() => onInsightModeChange("list")} className={clsx("h-11 w-11 items-center justify-center rounded-md border", insightMode === "list" ? "border-orange bg-primary" : "border-primary bg-white")}>
            <FileText color={colors.secondaryDark} size={20} />
          </Pressable>
          <Pressable accessibilityLabel={t("financeGraphView")} onPress={() => onInsightModeChange("graph")} className={clsx("h-11 w-11 items-center justify-center rounded-md border", insightMode === "graph" ? "border-orange bg-primary" : "border-primary bg-white")}>
            <LineChart color={colors.secondaryDark} size={20} />
          </Pressable>
        </View>
      </View>
    </AppCard>
  );
}
