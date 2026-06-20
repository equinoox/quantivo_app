import { useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { getDateKey, isFinanceDateRangeInvalid } from "@/features/finance/domain/finance-date";
import { createFinanceInsightEntries, filterFinanceInsightEntries, getFinanceTotals } from "@/features/finance/domain/finance-insights";
import { getInventoryShiftLabel } from "@/features/finance/domain/finance-labels";
import { createCustomFinancialEntry, listCustomFinancialEntries, listInventoryFinanceResults } from "@/features/finance/services/finances.service";
import { createFinancialItem, deleteFinancialItem, listFinancialItems } from "@/features/finance/services/financial-items.service";
import {
  createEmptyCustomEntryForm,
  CustomEntryFormState,
  CustomFinancialEntry,
  emptyFinancialItemForm,
  FinanceBehaviorFilter,
  FinanceInsightMode,
  FinanceTypeFilter,
  FinancialItemFormState,
  InventoryFinanceResult,
} from "@/features/finance/types/finance.types";
import { FinancialItem } from "@/features/finance/types/financial-item.types";
import { createCustomFinancialEntrySchema, createFinancialItemSchema } from "@/features/finance/validation";
import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

export function useFinances() {
  const toast = useAppToast();
  const { t } = useI18n();
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
  const [typeFilter, setTypeFilter] = useState<FinanceTypeFilter>("all");
  const [behaviorFilter, setBehaviorFilter] = useState<FinanceBehaviorFilter>("all");
  const [insightMode, setInsightMode] = useState<FinanceInsightMode>("list");
  const [isCustomEntryModalVisible, setIsCustomEntryModalVisible] = useState(false);
  const [isFinancialItemModalVisible, setIsFinancialItemModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingCustomEntry, setIsSavingCustomEntry] = useState(false);
  const [isSavingFinancialItem, setIsSavingFinancialItem] = useState(false);

  const canManageFinances = session?.user.role === "admin" || session?.user.role === "manager";

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
  const isDateRangeInvalid = isFinanceDateRangeInvalid(fromDate, toDate, fromDateKey, toDateKey);

  const financeEntries = useMemo(
    () =>
      createFinanceInsightEntries({
        customEntries,
        getInventoryDateKey: (date) => getDateKey(date, dateFormat),
        getInventoryShiftLabel: (shift) => getInventoryShiftLabel(shift, t),
        inventoryResultName: t("inventoryListResult"),
        inventoryResults,
      }),
    [customEntries, dateFormat, inventoryResults, t],
  );

  const visibleEntries = useMemo(
    () => filterFinanceInsightEntries(financeEntries, { behaviorFilter, fromDateKey, isDateRangeInvalid, toDateKey, typeFilter }),
    [behaviorFilter, financeEntries, fromDateKey, isDateRangeInvalid, toDateKey, typeFilter],
  );

  const totals = useMemo(() => getFinanceTotals(visibleEntries), [visibleEntries]);

  const openCustomEntryModal = () => {
    setCustomEntryForm(createEmptyCustomEntryForm(formatDate(new Date())));
    setIsCustomEntryModalVisible(true);
  };

  const closeCustomEntryModal = () => {
    setCustomEntryForm(createEmptyCustomEntryForm(formatDate(new Date())));
    setIsCustomEntryModalVisible(false);
  };

  const openFinancialItemModal = () => {
    setIsFinancialItemModalVisible(true);
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

  return {
    behaviorFilter,
    canManageFinances,
    closeCustomEntryModal,
    closeFinancialItemModal,
    customEntryForm,
    deleteTarget,
    financialItemForm,
    financialItems,
    formatDate,
    formatMoney,
    fromDate,
    handleCreateCustomEntry,
    handleCreateFinancialItem,
    handleDeleteFinancialItem,
    insightMode,
    isCustomEntryModalVisible,
    isDateRangeInvalid,
    isFinancialItemModalVisible,
    isLoading,
    isRefreshing,
    isSavingCustomEntry,
    isSavingFinancialItem,
    openCustomEntryModal,
    openFinancialItemModal,
    refresh,
    setBehaviorFilter,
    setCustomEntryForm,
    setDeleteTarget,
    setFinancialItemForm,
    setFromDate,
    setInsightMode,
    setToDate,
    setTypeFilter,
    toDate,
    totals,
    typeFilter,
    visibleEntries,
  };
}
