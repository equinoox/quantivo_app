import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import clsx from "clsx";

import { InventoryListFinancialEntryDetail } from "@/features/inventory/types/inventory.types";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";

type InventoryFinancialEntriesProps = {
  entries: InventoryListFinancialEntryDetail[];
  formatMoney: (value: number) => string;
  isEditing: boolean;
  onOpenExplanation: (row: InventoryListFinancialEntryDetail) => void;
  onOpenNumber: (row: InventoryListFinancialEntryDetail) => void;
  renderNumberCell: (value: number, expression: string, onPress?: () => void) => ReactNode;
  t: (key: string) => string;
};

export function InventoryFinancialEntries({ entries, formatMoney, isEditing, onOpenExplanation, onOpenNumber, renderNumberCell, t }: InventoryFinancialEntriesProps) {
  const sortedEntries = [...entries].sort((left, right) => {
    if (left.typeSnapshot === right.typeSnapshot) return 0;
    return left.typeSnapshot === "revenue" ? -1 : 1;
  });

  return (
    <View className="gap-3 border-t border-primary pt-4">
      <Text className="text-lg font-semibold text-secondary_dark">{t("revenuesExpensesManagement")}</Text>
      {sortedEntries.map((entry) => {
        const colorClass = entry.typeSnapshot === "revenue" ? "text-green-700" : "text-red-700";
        const pillClass = entry.typeSnapshot === "revenue" ? "border-green-700 bg-green-50" : "border-red-700 bg-red-50";
        const typeLabel = entry.typeSnapshot === "revenue" ? t("revenue") : t("expense");
        const explanation = entry.explanation.trim();
        return (
          <RevealOnScroll key={entry.id} duration={560}>
            <Pressable disabled={!isEditing} onPress={() => onOpenExplanation(entry)} className="rounded-md border border-primary bg-white px-3 py-2">
              <View className="flex-row items-center gap-2">
                <View className={clsx("rounded-md border px-2 py-1", pillClass)}>
                  <Text className={clsx("text-xs font-semibold", colorClass)}>{typeLabel}</Text>
                </View>
                <Text className="min-w-0 flex-1 text-base font-semibold text-secondary_dark">{entry.nameSnapshot}</Text>
                {isEditing ? <View className="min-w-28">{renderNumberCell(entry.amount, entry.amountExpression, () => onOpenNumber(entry))}</View> : <Text className="text-right text-base font-semibold text-secondary_dark">{formatMoney(entry.amount)}</Text>}
              </View>
              {explanation ? <Text className="mt-1 text-sm leading-5 text-secondary">{explanation}</Text> : null}
            </Pressable>
          </RevealOnScroll>
        );
      })}
    </View>
  );
}
