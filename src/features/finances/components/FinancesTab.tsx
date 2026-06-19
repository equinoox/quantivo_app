import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import clsx from "clsx";
import { Check, CircleDollarSign, FileText, LineChart, ReceiptText, Trash2 } from "lucide-react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { createCustomFinancialEntry, listCustomFinancialEntries, listInventoryFinanceResults } from "@/features/finances/services/finances.service";
import { CustomFinancialEntry, FinanceInsightEntry, InventoryFinanceResult } from "@/features/finances/types/finance.types";
import { createCustomFinancialEntrySchema } from "@/features/finances/validation/finance.schemas";
import { isValidInventoryDate } from "@/features/inventory/lib/inventory-calculations";
import { createFinancialItem, deleteFinancialItem, listFinancialItems } from "@/features/revenues-expenses/services/financial-items.service";
import { FinancialItem, financialItemBehaviors, FinancialItemBehavior, financialItemTypes, FinancialItemType } from "@/features/revenues-expenses/types/financial-item.types";
import { createFinancialItemSchema } from "@/features/revenues-expenses/validation";
import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppInput } from "@/shared/components/ui/AppInput";
import { AppModal } from "@/shared/components/ui/AppModal";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { LoadingState } from "@/shared/components/ui/LoadingState";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";
import { useI18n } from "@/shared/i18n/useI18n";

type TypeFilter = "all" | FinancialItemType;
type BehaviorFilter = "all" | FinancialItemBehavior;
type InsightMode = "list" | "graph";

type FinancialItemFormState = {
  behavior: FinancialItemBehavior;
  name: string;
  requiresExplanation: boolean;
  type: FinancialItemType;
};

type CustomEntryFormState = {
  amount: string;
  behavior: FinancialItemBehavior;
  date: string;
  explanation: string;
  name: string;
  type: FinancialItemType;
};

const emptyFinancialItemForm: FinancialItemFormState = {
  behavior: "fixed",
  name: "",
  requiresExplanation: false,
  type: "expense",
};

const createEmptyCustomEntryForm = (date: string): CustomEntryFormState => ({
  amount: "",
  behavior: "variable",
  date,
  explanation: "",
  name: "",
  type: "expense",
});

function OptionChip({ isSelected, label, onPress }: { isSelected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("min-h-10 justify-center rounded-md border px-3", isSelected ? "border-orange bg-primary" : "border-primary bg-white")}>
      <Text className="font-semibold text-secondary_dark">{label}</Text>
    </Pressable>
  );
}

function getTypeLabel(type: FinancialItemType, t: (key: string) => string): string {
  return type === "expense" ? t("expense") : t("revenue");
}

function getBehaviorLabel(behavior: FinancialItemBehavior, t: (key: string) => string): string {
  return behavior === "fixed" ? t("fixed") : t("variable");
}

function getDateKey(value: string, dateFormat: string): string | null {
  const trimmedValue = value.trim();
  if (!isValidInventoryDate(trimmedValue, dateFormat)) return null;

  if (dateFormat === "yyyy-MM-dd") return trimmedValue;

  const separator = dateFormat === "dd.MM.yyyy" ? "." : "/";
  const [first, second, year] = trimmedValue.split(separator).map(Number);
  const month = dateFormat === "MM/dd/yyyy" ? first : second;
  const day = dateFormat === "MM/dd/yyyy" ? second : first;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function getShiftLabel(shift: InventoryFinanceResult["shift"], t: (key: string) => string): string {
  return shift === "first" ? t("firstShift") : t("secondShift");
}

function FinanceLineGraph({ chartWidth, entries, formatMoney, t }: { chartWidth: number; entries: FinanceInsightEntry[]; formatMoney: (value: number) => string; t: (key: string) => string }) {
  const chartRows = useMemo(() => {
    const rows = new Map<string, { dateKey: string; expenses: number; revenues: number }>();
    for (const entry of entries) {
      const row = rows.get(entry.dateKey) ?? { dateKey: entry.dateKey, expenses: 0, revenues: 0 };
      if (entry.type === "revenue") row.revenues += entry.amount;
      else row.expenses += entry.amount;
      rows.set(entry.dateKey, row);
    }
    return [...rows.values()].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
  }, [entries]);
  const maxValue = Math.max(1, ...chartRows.map((row) => Math.max(row.revenues, row.expenses)));
  const width = Math.max(280, chartWidth);
  const height = 176;
  const left = 20;
  const top = 16;
  const plotWidth = width - 40;
  const plotHeight = 118;
  const getX = (index: number) => left + (chartRows.length <= 1 ? plotWidth / 2 : (index / (chartRows.length - 1)) * plotWidth);
  const getY = (value: number) => top + plotHeight - (value / maxValue) * plotHeight;
  const revenuePoints = chartRows.map((row, index) => `${getX(index)},${getY(row.revenues)}`).join(" ");
  const expensePoints = chartRows.map((row, index) => `${getX(index)},${getY(row.expenses)}`).join(" ");
  const totalRevenues = chartRows.reduce((total, row) => total + row.revenues, 0);
  const totalExpenses = chartRows.reduce((total, row) => total + row.expenses, 0);

  return (
    <AppCard className="border-primary bg-white">
      <View className="gap-3">
        <Svg height={height} viewBox={`0 0 ${width} ${height}`} width="100%">
          <Line stroke="#d8c8ab" strokeWidth={1} x1={left} x2={left + plotWidth} y1={top + plotHeight} y2={top + plotHeight} />
          <Line stroke="#d8c8ab" strokeWidth={1} x1={left} x2={left} y1={top} y2={top + plotHeight} />
          <Polyline fill="none" points={revenuePoints} stroke="#15803d" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
          <Polyline fill="none" points={expensePoints} stroke="#b91c1c" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
          {chartRows.map((row, index) => <Circle key={`revenue-${row.dateKey}`} cx={getX(index)} cy={getY(row.revenues)} fill="#15803d" r={3.5} />)}
          {chartRows.map((row, index) => <Circle key={`expense-${row.dateKey}`} cx={getX(index)} cy={getY(row.expenses)} fill="#b91c1c" r={3.5} />)}
        </Svg>
        <View className="flex-row flex-wrap gap-3">
          <Text className="text-sm font-semibold text-green-700">{t("revenue")}: {formatMoney(totalRevenues)}</Text>
          <Text className="text-sm font-semibold text-red-700">{t("expense")}: {formatMoney(totalExpenses)}</Text>
        </View>
        {chartRows.length > 0 ? <Text className="text-xs text-muted">{chartRows[0].dateKey} - {chartRows[chartRows.length - 1].dateKey}</Text> : null}
      </View>
    </AppCard>
  );
}

export function FinancesTab() {
  const toast = useAppToast();
  const { t } = useI18n();
  const responsive = useResponsiveLayout();
  const session = useAuthStore((state) => state.session);
  const dateFormat = useSetupStore((state) => state.status?.dateFormat ?? "dd/MM/yyyy");
  const { formatDate, formatMoney } = useAppFormatters();
  const [customEntries, setCustomEntries] = useState<CustomFinancialEntry[]>([]);
  const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]);
  const [inventoryResults, setInventoryResults] = useState<InventoryFinanceResult[]>([]);
  const [financialItemForm, setFinancialItemForm] = useState<FinancialItemFormState>(emptyFinancialItemForm);
  const [customEntryForm, setCustomEntryForm] = useState<CustomEntryFormState>(() => createEmptyCustomEntryForm(formatDate(new Date())));
  const [deleteTarget, setDeleteTarget] = useState<FinancialItem | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [behaviorFilter, setBehaviorFilter] = useState<BehaviorFilter>("all");
  const [insightMode, setInsightMode] = useState<InsightMode>("list");
  const [isCustomEntryModalVisible, setIsCustomEntryModalVisible] = useState(false);
  const [isFinancialItemModalVisible, setIsFinancialItemModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingCustomEntry, setIsSavingCustomEntry] = useState(false);
  const [isSavingFinancialItem, setIsSavingFinancialItem] = useState(false);
  const canManageFinances = session?.user.role === "admin" || session?.user.role === "manager";
  const isCompactLayout = responsive.isPhone || responsive.isFoldable;
  const chartWidth = Math.min(responsive.window.width - responsive.horizontalPadding * 2 - responsive.cardPadding * 2, responsive.contentMaxWidth ?? responsive.window.width);

  const loadFinanceData = async () => {
    try {
      setIsLoading(true);
      const [customRows, itemRows, listRows] = await Promise.all([listCustomFinancialEntries(), listFinancialItems(), listInventoryFinanceResults()]);
      setCustomEntries(customRows);
      setFinancialItems(itemRows);
      setInventoryResults(listRows);
    } catch (error) {
      toast.error(t("financeLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFinanceData();
  }, []);

  const refresh = async () => {
    setIsRefreshing(true);
    await loadFinanceData();
    setIsRefreshing(false);
  };

  const fromDateKey = fromDate.trim() ? getDateKey(fromDate, dateFormat) : null;
  const toDateKey = toDate.trim() ? getDateKey(toDate, dateFormat) : null;
  const isDateRangeInvalid = Boolean(fromDate.trim() && !fromDateKey) || Boolean(toDate.trim() && !toDateKey) || Boolean(fromDateKey && toDateKey && fromDateKey > toDateKey);

  const financeEntries = useMemo<FinanceInsightEntry[]>(() => {
    const customRows: FinanceInsightEntry[] = customEntries.map((entry) => ({
      amount: entry.amount,
      behavior: entry.behavior,
      date: entry.date,
      dateKey: entry.dateKey,
      explanation: entry.explanation,
      id: entry.id,
      name: entry.name,
      source: "custom",
      type: entry.type,
    }));

    const inventoryRows: FinanceInsightEntry[] = inventoryResults.map((entry) => {
      const type: FinancialItemType = entry.totalEarn >= 0 ? "revenue" : "expense";
      return {
        amount: Math.abs(entry.totalEarn),
        behavior: "variable",
        date: entry.date,
        dateKey: getDateKey(entry.date, dateFormat) ?? entry.createdAt.slice(0, 10),
        explanation: getShiftLabel(entry.shift, t),
        id: `inventory-${entry.id}`,
        inventoryListId: entry.id,
        name: t("inventoryListResult"),
        shift: entry.shift,
        source: "inventory",
        type,
      };
    });

    return [...customRows, ...inventoryRows].sort((left, right) => right.dateKey.localeCompare(left.dateKey));
  }, [customEntries, dateFormat, inventoryResults, t]);

  const visibleEntries = useMemo(() => {
    if (isDateRangeInvalid) return [];
    return financeEntries.filter((entry) => {
      if (typeFilter !== "all" && entry.type !== typeFilter) return false;
      if (behaviorFilter !== "all" && entry.behavior !== behaviorFilter) return false;
      if (fromDateKey && entry.dateKey < fromDateKey) return false;
      if (toDateKey && entry.dateKey > toDateKey) return false;
      return true;
    });
  }, [behaviorFilter, financeEntries, fromDateKey, isDateRangeInvalid, toDateKey, typeFilter]);

  const totals = useMemo(() => {
    const revenues = visibleEntries.reduce((total, entry) => entry.type === "revenue" ? total + entry.amount : total, 0);
    const expenses = visibleEntries.reduce((total, entry) => entry.type === "expense" ? total + entry.amount : total, 0);
    return { difference: revenues - expenses, expenses, revenues };
  }, [visibleEntries]);

  const openCustomEntryModal = () => {
    setCustomEntryForm(createEmptyCustomEntryForm(formatDate(new Date())));
    setIsCustomEntryModalVisible(true);
  };

  const closeCustomEntryModal = () => {
    setCustomEntryForm(createEmptyCustomEntryForm(formatDate(new Date())));
    setIsCustomEntryModalVisible(false);
  };

  const closeFinancialItemModal = () => {
    setFinancialItemForm(emptyFinancialItemForm);
    setIsFinancialItemModalVisible(false);
  };

  const handleCreateFinancialItem = async () => {
    const parsed = createFinancialItemSchema.safeParse(financialItemForm);
    if (!parsed.success) {
      toast.error(t("financialItemValidationError"));
      return;
    }

    try {
      setIsSavingFinancialItem(true);
      await createFinancialItem(parsed.data);
      toast.success(t("financialItemSaved"));
      setFinancialItems(await listFinancialItems());
      closeFinancialItemModal();
    } catch (error) {
      toast.error(t("financialItemSaveFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsSavingFinancialItem(false);
    }
  };

  const handleCreateCustomEntry = async () => {
    const parsed = createCustomFinancialEntrySchema.safeParse(customEntryForm);
    const dateKey = getDateKey(customEntryForm.date, dateFormat);
    if (!parsed.success || !dateKey) {
      toast.error(t("customFinancialEntryValidationError"));
      return;
    }

    try {
      setIsSavingCustomEntry(true);
      await createCustomFinancialEntry({
        amount: parsed.data.amount,
        behavior: parsed.data.behavior,
        createdByUserId: session?.user.id,
        date: parsed.data.date,
        dateKey,
        explanation: parsed.data.explanation,
        name: parsed.data.name,
        type: parsed.data.type,
      });
      toast.success(t("customFinancialEntrySaved"));
      setCustomEntries(await listCustomFinancialEntries());
      closeCustomEntryModal();
    } catch (error) {
      toast.error(t("customFinancialEntrySaveFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsSavingCustomEntry(false);
    }
  };

  const handleDeleteFinancialItem = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFinancialItem(deleteTarget.id);
      setFinancialItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      toast.success(t("financialItemDeleted"));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(t("financialItemDeleteFailed"), error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <Screen tabPage icon={<CircleDollarSign color={colors.secondaryDark} size={36} />} title={t("finances")} subtitle={t("financesSubtitle")} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.orange} />}>
      <View className="gap-4">
        {canManageFinances ? (
          <RevealOnScroll delay={60}>
          <View className={clsx(isCompactLayout ? "gap-2" : "flex-row gap-2")}>
            <View className={clsx(!isCompactLayout && "flex-1")}>
              <AppButton label={t("addFinancialItem")} onPress={() => setIsFinancialItemModalVisible(true)} className="bg-secondary_dark" />
            </View>
            <View className={clsx(!isCompactLayout && "flex-1")}>
              <AppButton label={t("addCustomFinancialEntry")} onPress={openCustomEntryModal} className="bg-orange" />
            </View>
          </View>
          </RevealOnScroll>
        ) : null}

        <RevealOnScroll delay={120}>
        <AppCard className="border-primary">
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <ReceiptText color={colors.secondaryDark} size={22} />
              <Text className="text-lg font-semibold text-secondary_dark">{t("financeFilters")}</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <OptionChip isSelected={typeFilter === "all"} label={t("all")} onPress={() => setTypeFilter("all")} />
              <OptionChip isSelected={typeFilter === "revenue"} label={t("revenue")} onPress={() => setTypeFilter("revenue")} />
              <OptionChip isSelected={typeFilter === "expense"} label={t("expense")} onPress={() => setTypeFilter("expense")} />
            </View>
            <View className="flex-row flex-wrap gap-2">
              <OptionChip isSelected={behaviorFilter === "all"} label={t("all")} onPress={() => setBehaviorFilter("all")} />
              <OptionChip isSelected={behaviorFilter === "fixed"} label={t("fixed")} onPress={() => setBehaviorFilter("fixed")} />
              <OptionChip isSelected={behaviorFilter === "variable"} label={t("variable")} onPress={() => setBehaviorFilter("variable")} />
            </View>
            <View className={clsx(isCompactLayout ? "gap-2" : "flex-row gap-2")}>
              <View className="flex-1">
                <AppInput label={t("fromDate")} value={fromDate} onChangeText={setFromDate} placeholder={formatDate(new Date())} />
              </View>
              <View className="flex-1">
                <AppInput label={t("toDate")} value={toDate} onChangeText={setToDate} placeholder={formatDate(new Date())} />
              </View>
            </View>
            {isDateRangeInvalid ? <Text className="text-sm font-semibold text-red-700">{t("financeDateRangeInvalid")}</Text> : null}
          </View>
        </AppCard>
        </RevealOnScroll>

        <RevealOnScroll delay={180}>
        <AppCard className="border-secondary_dark bg-white">
          <View className="flex-row items-center gap-3">
            <View className="min-w-0 flex-1 gap-2">
              <Text className="text-base font-semibold text-green-700">{t("totalRevenues")}: {formatMoney(totals.revenues)}</Text>
              <Text className="text-base font-semibold text-red-700">{t("totalExpenses")}: {formatMoney(totals.expenses)}</Text>
              <Text className={clsx("text-lg font-bold", totals.difference >= 0 ? "text-green-700" : "text-red-700")}>{t("financeDifference")}: {formatMoney(totals.difference)}</Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable accessibilityLabel={t("financeListView")} onPress={() => setInsightMode("list")} className={clsx("h-11 w-11 items-center justify-center rounded-md border", insightMode === "list" ? "border-orange bg-primary" : "border-primary bg-white")}>
                <FileText color={colors.secondaryDark} size={20} />
              </Pressable>
              <Pressable accessibilityLabel={t("financeGraphView")} onPress={() => setInsightMode("graph")} className={clsx("h-11 w-11 items-center justify-center rounded-md border", insightMode === "graph" ? "border-orange bg-primary" : "border-primary bg-white")}>
                <LineChart color={colors.secondaryDark} size={20} />
              </Pressable>
            </View>
          </View>
        </AppCard>
        </RevealOnScroll>

        {isLoading ? <LoadingState label={t("loading")} /> : null}

        {!isLoading && visibleEntries.length === 0 ? (
          <RevealOnScroll delay={220}>
          <AppCard>
            <EmptyState title={t("financeEntriesEmptyTitle")} message={isDateRangeInvalid ? t("financeDateRangeInvalid") : t("financeEntriesEmptyMessage")} />
          </AppCard>
          </RevealOnScroll>
        ) : null}

        {!isLoading && visibleEntries.length > 0 && insightMode === "graph" ? (
          <RevealOnScroll delay={220}>
            <FinanceLineGraph chartWidth={chartWidth} entries={visibleEntries} formatMoney={formatMoney} t={t} />
          </RevealOnScroll>
        ) : null}

        {!isLoading && visibleEntries.length > 0 && insightMode === "list" ? (
          <View className="gap-2">
            {visibleEntries.map((entry, index) => {
              const colorClass = entry.type === "revenue" ? "text-green-700" : "text-red-700";
              const pillClass = entry.type === "revenue" ? "border-green-700 bg-green-50" : "border-red-700 bg-red-50";
              return (
                <RevealOnScroll key={entry.id} delay={Math.min(index * 35, 180)} duration={560}>
                <AppCard key={entry.id} className="border-primary bg-white">
                  <View className="gap-1">
                    <View className={clsx(isCompactLayout ? "gap-2" : "flex-row items-center gap-2")}>
                      <View className={clsx("rounded-md border px-2 py-1", pillClass)} style={{ alignSelf: "flex-start", flexGrow: 0, flexShrink: 0 }}>
                        <Text className={clsx("text-xs font-semibold", colorClass)}>{getTypeLabel(entry.type, t)}</Text>
                      </View>
                      <Text className="min-w-0 flex-1 text-base font-semibold text-secondary_dark">{entry.name}</Text>
                      <Text className={clsx("text-base font-semibold text-secondary_dark", !isCompactLayout && "text-right")}>{formatMoney(entry.amount)}</Text>
                    </View>
                    <Text className="text-sm text-muted">{entry.date}{entry.source === "inventory" ? ` / ${t("inventory")}` : ` / ${t("customFinancialEntry")}`}</Text>
                    <Text className="text-xs font-semibold text-muted">{getBehaviorLabel(entry.behavior, t)}</Text>
                    {entry.explanation ? <Text className="text-sm leading-5 text-secondary">{entry.explanation}</Text> : null}
                  </View>
                </AppCard>
                </RevealOnScroll>
              );
            })}
          </View>
        ) : null}
      </View>

      <AppModal visible={isFinancialItemModalVisible} onClose={closeFinancialItemModal}>
        <View className="gap-4">
          <View>
            <Text className="text-xl font-semibold text-secondary_dark">{t("createFinancialItem")}</Text>
            <Text className="mt-1 text-sm text-muted">{t("revenuesExpensesManagementSubtitle")}</Text>
          </View>
          <View className="gap-2">
            <Text className="text-sm font-medium text-ink">{t("type")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {financialItemTypes.map((type) => <OptionChip key={type} isSelected={financialItemForm.type === type} label={getTypeLabel(type, t)} onPress={() => setFinancialItemForm((current) => ({ ...current, type }))} />)}
            </View>
          </View>
          <View className="gap-2">
            <Text className="text-sm font-medium text-ink">{t("behavior")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {financialItemBehaviors.map((behavior) => <OptionChip key={behavior} isSelected={financialItemForm.behavior === behavior} label={getBehaviorLabel(behavior, t)} onPress={() => setFinancialItemForm((current) => ({ ...current, behavior }))} />)}
            </View>
          </View>
          <AppInput label={t("name")} value={financialItemForm.name} onChangeText={(name) => setFinancialItemForm((current) => ({ ...current, name }))} placeholder={t("financialItemNamePlaceholder")} autoCapitalize="words" />
          <Pressable onPress={() => setFinancialItemForm((current) => ({ ...current, requiresExplanation: !current.requiresExplanation }))} className="flex-row items-center gap-3 rounded-md border border-primary bg-white p-3">
            <View className={clsx("h-6 w-6 items-center justify-center rounded border", financialItemForm.requiresExplanation ? "border-orange bg-orange" : "border-primary bg-white")}>
              {financialItemForm.requiresExplanation ? <Check color={colors.secondaryDark} size={16} strokeWidth={3} /> : null}
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-semibold text-secondary_dark">{t("explanation")}</Text>
              <Text className="text-sm leading-5 text-muted">{t("explanationFinancialItemHint")}</Text>
            </View>
          </Pressable>
          {financialItems.length > 0 ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-secondary_dark">{t("activeFinancialItems")}</Text>
              {financialItems.map((item) => (
                <View key={item.id} className="flex-row items-center gap-2 rounded-md border border-primary bg-white px-3 py-2">
                  <Text className="min-w-0 flex-1 font-semibold text-secondary_dark">{item.name}</Text>
                  <Text className="text-sm text-muted">{getTypeLabel(item.type, t)}</Text>
                  <Pressable accessibilityRole="button" onPress={() => setDeleteTarget(item)} className="h-9 w-9 items-center justify-center rounded-md bg-red-600">
                    <Trash2 color="#ffffff" size={16} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <View className="gap-3">
            <AppButton label={t("create")} loading={isSavingFinancialItem} onPress={handleCreateFinancialItem} className="bg-secondary_dark" />
            <AppButton label={t("cancel")} variant="secondary" onPress={closeFinancialItemModal} />
          </View>
        </View>
      </AppModal>

      <AppModal visible={isCustomEntryModalVisible} onClose={closeCustomEntryModal}>
        <View className="gap-4">
          <View>
            <Text className="text-xl font-semibold text-secondary_dark">{t("customFinancialEntry")}</Text>
            <Text className="mt-1 text-sm text-muted">{t("customFinancialEntrySubtitle")}</Text>
          </View>
          <View className="gap-2">
            <Text className="text-sm font-medium text-ink">{t("type")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {financialItemTypes.map((type) => <OptionChip key={type} isSelected={customEntryForm.type === type} label={getTypeLabel(type, t)} onPress={() => setCustomEntryForm((current) => ({ ...current, type }))} />)}
            </View>
          </View>
          <View className="gap-2">
            <Text className="text-sm font-medium text-ink">{t("behavior")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {financialItemBehaviors.map((behavior) => <OptionChip key={behavior} isSelected={customEntryForm.behavior === behavior} label={getBehaviorLabel(behavior, t)} onPress={() => setCustomEntryForm((current) => ({ ...current, behavior }))} />)}
            </View>
          </View>
          <AppInput label={t("name")} value={customEntryForm.name} onChangeText={(name) => setCustomEntryForm((current) => ({ ...current, name }))} placeholder={t("customFinancialEntryNamePlaceholder")} autoCapitalize="words" />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <AppInput label={t("date")} value={customEntryForm.date} onChangeText={(date) => setCustomEntryForm((current) => ({ ...current, date }))} placeholder={formatDate(new Date())} />
            </View>
            <View className="flex-1">
              <AppInput label={t("pdfAmount")} value={customEntryForm.amount} onChangeText={(amount) => setCustomEntryForm((current) => ({ ...current, amount: amount.replace(/[^\d.,]/g, "") }))} keyboardType="decimal-pad" placeholder={formatMoney(0)} />
            </View>
          </View>
          <AppInput label={t("explanation")} value={customEntryForm.explanation} onChangeText={(explanation) => setCustomEntryForm((current) => ({ ...current, explanation }))} multiline />
          <View className="gap-3">
            <AppButton label={t("create")} loading={isSavingCustomEntry} onPress={handleCreateCustomEntry} className="bg-secondary_dark" />
            <AppButton label={t("cancel")} variant="secondary" onPress={closeCustomEntryModal} />
          </View>
        </View>
      </AppModal>

      <ConfirmDialog destructive visible={Boolean(deleteTarget)} title={t("deleteFinancialItemTitle")} message={t("deleteFinancialItemMessage")} cancelLabel={t("cancel")} confirmLabel={t("delete")} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteFinancialItem} />
    </Screen>
  );
}
