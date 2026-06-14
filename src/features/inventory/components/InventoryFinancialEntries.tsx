import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import clsx from "clsx";

import { InventoryListFinancialEntryDetail } from "@/features/inventory/types/inventory.types";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";

type InventoryFinancialEntriesProps = {
  entries: InventoryListFinancialEntryDetail[];
  isEditing: boolean;
  onOpenExplanation: (row: InventoryListFinancialEntryDetail) => void;
  onOpenNumber: (row: InventoryListFinancialEntryDetail) => void;
  renderNumberCell: (value: number, expression: string, onPress?: () => void) => ReactNode;
  t: (key: string) => string;
};

export function InventoryFinancialEntries({ entries, isEditing, onOpenExplanation, onOpenNumber, renderNumberCell, t }: InventoryFinancialEntriesProps) {
  return (
    <View className="gap-3 border-t border-primary pt-4">
      <Text className="text-lg font-semibold text-secondary_dark">{t("revenuesExpensesManagement")}</Text>
      {entries.map((entry) => {
        const colorClass = entry.typeSnapshot === "revenue" ? "text-green-700" : "text-red-700";
        return (
          <RevealOnScroll key={entry.id} duration={560}>
            <View className="gap-2 rounded-md border border-primary bg-white p-3">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-secondary_dark">{entry.nameSnapshot}</Text>
                  <Text className={clsx("mt-1 text-sm font-semibold", colorClass)}>{entry.typeSnapshot === "revenue" ? t("revenue") : t("expense")}</Text>
                </View>
                {renderNumberCell(entry.amount, entry.amountExpression, isEditing ? () => onOpenNumber(entry) : undefined)}
              </View>
              <Pressable disabled={!isEditing} onPress={() => onOpenExplanation(entry)} className={clsx("min-h-11 justify-center rounded-md border border-primary bg-background px-3", !entry.explanation && "bg-white")}>
                <Text className={clsx("text-sm", entry.explanation ? "text-secondary_dark" : "text-muted")}>{entry.explanation || t("noExplanation")}</Text>
              </Pressable>
            </View>
          </RevealOnScroll>
        );
      })}
    </View>
  );
}
