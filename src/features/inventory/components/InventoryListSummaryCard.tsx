import { Text, View } from "react-native";
import clsx from "clsx";

type InventoryListSummaryCardProps = {
  formatMoney: (value: number) => string;
  summaryTotals: {
    totalEarn: number;
    totalExpenses: number;
    totalProductEarnings: number;
    totalRevenues: number;
  };
  t: (key: string) => string;
};

export function InventoryListSummaryCard({ formatMoney, summaryTotals, t }: InventoryListSummaryCardProps) {
  return (
    <View className="gap-3 border-t border-primary pt-4">
      <Text className="text-lg font-semibold text-secondary_dark">{t("inventorySummary")}</Text>
      <View className="gap-3 rounded-md border border-primary bg-background p-4">
        <View className="gap-2 border-b border-primary pb-3">
          <Text className="text-base font-semibold text-secondary_dark">{t("totalProductEarnings")}: {formatMoney(summaryTotals.totalProductEarnings)}</Text>
          <Text className="text-base font-semibold text-green-700">{t("totalRevenues")}: {formatMoney(summaryTotals.totalRevenues)}</Text>
          <Text className="text-base font-semibold text-red-700">{t("totalExpenses")}: {formatMoney(summaryTotals.totalExpenses)}</Text>
        </View>
        <View className={clsx("rounded-md border px-4 py-3", summaryTotals.totalEarn >= 0 ? "border-green-700 bg-green-50" : "border-red-700 bg-red-50")}>
          <Text className="text-sm font-semibold uppercase text-secondary_dark">{t("totalEarn")}</Text>
          <Text className={clsx("mt-1 text-2xl font-bold", summaryTotals.totalEarn >= 0 ? "text-green-700" : "text-red-700")}>{formatMoney(summaryTotals.totalEarn)}</Text>
        </View>
      </View>
    </View>
  );
}
