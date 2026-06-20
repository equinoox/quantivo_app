import { Pressable, ScrollView, Text, View } from "react-native";
import clsx from "clsx";
import { CircleDollarSign } from "lucide-react-native";

import { InventoryFinancialEntry } from "@/features/inventory/types/new-inventory.types";
import { FinancialItem } from "@/features/finance/types/financial-item.types";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppInput } from "@/shared/components/ui/AppInput";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { colors } from "@/shared/constants/colors";

type NewInventoryFinancialEntriesCardProps = {
  entries: InventoryFinancialEntry[];
  financialItems: FinancialItem[];
  financialTotals: { expenses: number; revenues: number };
  formatMoney: (value: number) => string;
  onAdd: () => void;
  onAddAll: () => void;
  onOpenCalculator: (entryId: string) => void;
  onRemove: (entryId: string) => void;
  onSelectItem: (itemId: string) => void;
  onUpdateExplanation: (entryId: string, explanation: string) => void;
  selectedFinancialItem?: FinancialItem;
  selectedFinancialItemId: string;
  t: (key: string) => string;
};

export function NewInventoryFinancialEntriesCard({ entries, financialItems, financialTotals, formatMoney, onAdd, onAddAll, onOpenCalculator, onRemove, onSelectItem, onUpdateExplanation, selectedFinancialItem, selectedFinancialItemId, t }: NewInventoryFinancialEntriesCardProps) {
  return (
    <RevealOnScroll>
      <AppCard className="border-primary">
        <View className="flex-row items-center gap-2">
          <CircleDollarSign color={colors.secondaryDark} size={22} />
          <Text className="text-lg font-semibold text-secondary_dark">{t("revenuesExpensesManagement")}</Text>
        </View>
        <View className="gap-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {financialItems.map((item) => (
                <Pressable key={item.id} onPress={() => onSelectItem(item.id)} className={clsx("min-h-12 justify-center rounded-md border bg-white px-3", selectedFinancialItemId === item.id ? "border-orange" : "border-primary")}>
                  <Text className="font-semibold text-secondary_dark">{item.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <AppButton label={t("add")} disabled={!selectedFinancialItem} onPress={onAdd} className="bg-secondary_dark" />
            </View>
            <View className="flex-1">
              <AppButton label={t("addAll")} onPress={onAddAll} className="bg-orange" />
            </View>
          </View>
        </View>
        <View className="gap-3">
          {entries.length === 0 ? <Text className="text-sm text-muted">{t("inventoryFinancialEntriesEmpty")}</Text> : null}
          {entries.map((item) => {
            const iconColor = item.type === "revenue" ? "#16a34a" : "#dc2626";
            return (
              <RevealOnScroll key={item.id} duration={560}>
                <View className="gap-2 rounded-md border border-primary bg-white p-3">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-semibold text-secondary_dark">{item.name}</Text>
                        <CircleDollarSign color={iconColor} size={18} />
                      </View>
                    </View>
                    <Pressable onPress={() => onOpenCalculator(item.id)} className="min-h-11 min-w-28 justify-center rounded-md border border-primary bg-background px-3">
                      <Text className="text-center text-base font-semibold text-secondary_dark">{item.amount || "0"}</Text>
                    </Pressable>
                    <Pressable onPress={() => onRemove(item.id)} className="h-11 w-11 items-center justify-center rounded-md bg-red-600">
                      <Text className="font-semibold text-white">X</Text>
                    </Pressable>
                  </View>
                  {item.requiresExplanation ? <AppInput label={`${item.name} ${t("explanation")}`} value={item.explanation} onChangeText={(value) => onUpdateExplanation(item.id, value)} /> : null}
                </View>
              </RevealOnScroll>
            );
          })}
        </View>
        <View className="h-px bg-primary" />
        <View className="gap-2">
          <Text className="text-base font-semibold text-green-700">{t("totalRevenues")}: {formatMoney(financialTotals.revenues)}</Text>
          <Text className="text-base font-semibold text-red-700">{t("totalExpenses")}: {formatMoney(financialTotals.expenses)}</Text>
        </View>
      </AppCard>
    </RevealOnScroll>
  );
}
