import { Text, View } from "react-native";
import clsx from "clsx";
import { ReceiptText } from "lucide-react-native";

import { FinanceOptionChip } from "@/features/finance/components/FinanceOptionChip";
import { FinanceBehaviorFilter, FinanceTypeFilter } from "@/features/finance/types/finance.types";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppInput } from "@/shared/components/ui/AppInput";
import { colors } from "@/shared/constants/colors";

type FinanceFiltersCardProps = {
  behaviorFilter: FinanceBehaviorFilter;
  formatDate: (date: Date) => string;
  fromDate: string;
  isCompactLayout: boolean;
  isDateRangeInvalid: boolean;
  onBehaviorFilterChange: (filter: FinanceBehaviorFilter) => void;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onTypeFilterChange: (filter: FinanceTypeFilter) => void;
  t: (key: string) => string;
  toDate: string;
  typeFilter: FinanceTypeFilter;
};

export function FinanceFiltersCard({ behaviorFilter, formatDate, fromDate, isCompactLayout, isDateRangeInvalid, onBehaviorFilterChange, onFromDateChange, onToDateChange, onTypeFilterChange, t, toDate, typeFilter }: FinanceFiltersCardProps) {
  return (
    <AppCard className="border-primary">
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <ReceiptText color={colors.secondaryDark} size={22} />
          <Text className="text-lg font-semibold text-secondary_dark">{t("financeFilters")}</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <FinanceOptionChip isSelected={typeFilter === "all"} label={t("all")} onPress={() => onTypeFilterChange("all")} />
          <FinanceOptionChip isSelected={typeFilter === "revenue"} label={t("revenue")} onPress={() => onTypeFilterChange("revenue")} />
          <FinanceOptionChip isSelected={typeFilter === "expense"} label={t("expense")} onPress={() => onTypeFilterChange("expense")} />
        </View>
        <View className="flex-row flex-wrap gap-2">
          <FinanceOptionChip isSelected={behaviorFilter === "all"} label={t("all")} onPress={() => onBehaviorFilterChange("all")} />
          <FinanceOptionChip isSelected={behaviorFilter === "fixed"} label={t("fixed")} onPress={() => onBehaviorFilterChange("fixed")} />
          <FinanceOptionChip isSelected={behaviorFilter === "variable"} label={t("variable")} onPress={() => onBehaviorFilterChange("variable")} />
        </View>
        <View className={clsx(isCompactLayout ? "gap-2" : "flex-row gap-2")}>
          <View className="flex-1">
            <AppInput label={t("fromDate")} value={fromDate} onChangeText={onFromDateChange} placeholder={formatDate(new Date())} />
          </View>
          <View className="flex-1">
            <AppInput label={t("toDate")} value={toDate} onChangeText={onToDateChange} placeholder={formatDate(new Date())} />
          </View>
        </View>
        {isDateRangeInvalid ? <Text className="text-sm font-semibold text-red-700">{t("financeDateRangeInvalid")}</Text> : null}
      </View>
    </AppCard>
  );
}
