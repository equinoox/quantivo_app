import { Text, View } from "react-native";
import clsx from "clsx";

import { getFinanceBehaviorLabel, getFinanceTypeLabel } from "@/features/finance/domain/finance-labels";
import { FinanceInsightEntry } from "@/features/finance/types/finance.types";
import { AppCard } from "@/shared/components/ui/AppCard";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";

type FinanceEntryListProps = {
  entries: FinanceInsightEntry[];
  formatMoney: (value: number) => string;
  isCompactLayout: boolean;
  t: (key: string) => string;
};

export function FinanceEntryList({ entries, formatMoney, isCompactLayout, t }: FinanceEntryListProps) {
  return (
    <View className="gap-2">
      {entries.map((entry, index) => {
        const colorClass = entry.type === "revenue" ? "text-green-700" : "text-red-700";
        const pillClass = entry.type === "revenue" ? "border-green-700 bg-green-50" : "border-red-700 bg-red-50";
        return (
          <RevealOnScroll key={entry.id} delay={Math.min(index * 35, 180)} duration={560}>
            <AppCard className="border-primary bg-white">
              <View className="gap-1">
                <View className={clsx(isCompactLayout ? "gap-2" : "flex-row items-center gap-2")}>
                  <View className={clsx("rounded-md border px-2 py-1", pillClass)} style={{ alignSelf: "flex-start", flexGrow: 0, flexShrink: 0 }}>
                    <Text className={clsx("text-xs font-semibold", colorClass)}>{getFinanceTypeLabel(entry.type, t)}</Text>
                  </View>
                  <Text className="min-w-0 flex-1 text-base font-semibold text-secondary_dark">{entry.name}</Text>
                  <Text className={clsx("text-base font-semibold text-secondary_dark", !isCompactLayout && "text-right")}>{formatMoney(entry.amount)}</Text>
                </View>
                <Text className="text-sm text-muted">{entry.date}{entry.source === "inventory" ? ` / ${t("inventory")}` : ` / ${t("customFinancialEntry")}`}</Text>
                <Text className="text-xs font-semibold text-muted">{getFinanceBehaviorLabel(entry.behavior, t)}</Text>
                {entry.explanation ? <Text className="text-sm leading-5 text-secondary">{entry.explanation}</Text> : null}
              </View>
            </AppCard>
          </RevealOnScroll>
        );
      })}
    </View>
  );
}
