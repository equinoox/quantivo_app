import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import clsx from "clsx";
import { ChevronDown, ClipboardList, Minus, Plus } from "lucide-react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { exportInventoryListToPdf } from "@/features/inventory/services/inventory-pdf.service";
import { deleteInventoryList, getInventoryList, INVENTORY_LIST_DUPLICATE_ERROR, listInventoryLists, updateInventoryList } from "@/features/inventory/services/inventory.service";
import { InventoryListDetail, InventoryListFinancialEntryDetail, InventoryListProductDetail, InventoryListSummary } from "@/features/inventory/types/inventory.types";
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
import { useI18n } from "@/shared/i18n/useI18n";

type ProductField = "kolicina" | "uneto" | "kraj";
type ProductExpressionField = "kolicinaExpression" | "unetoExpression" | "krajExpression";
type InventoryGrouping = "category" | "unit";
type NumericTarget =
  | { kind: "product"; rowId: string; field: ProductField; expression: string }
  | { kind: "financial"; rowId: string; expression: string }
  | null;
type ExplanationTarget = { rowId: string; value: string } | null;
type ExpressionPreview = { expression: string } | null;

const productColumns = [
  { key: "name", width: 150 },
  { key: "quantity", width: 92 },
  { key: "entered", width: 82 },
  { key: "end", width: 72 },
  { key: "sold", width: 74 },
  { key: "price", width: 112 },
  { key: "totalEarnings", width: 164 },
] as const;

const productTableWidth = productColumns.reduce((total, column) => total + column.width, 0);

function evaluatePlusExpression(expression: string): number | null {
  const normalizedExpression = expression.replace(/,/g, ".").replace(/\s/g, "");
  if (!normalizedExpression) return null;
  if (!/^\d+(\.\d+)?([+-]\d+(\.\d+)?)*$/.test(normalizedExpression)) return null;
  const values = normalizedExpression.match(/[+-]?\d+(\.\d+)?/g)?.map((part) => Number(part)) ?? [];
  if (values.some((value) => Number.isNaN(value))) return null;
  return values.reduce((total, value) => total + value, 0);
}

function sanitizeExpression(value: string): string {
  return value.replace(/,/g, ".").replace(/[^\d.+-]/g, "");
}

function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? value.toString() : value.toString();
}

function hasExpression(expression: string): boolean {
  return expression.includes("+") || expression.includes("-");
}

function getProductExpressionField(field: ProductField): ProductExpressionField {
  if (field === "kolicina") return "kolicinaExpression";
  if (field === "uneto") return "unetoExpression";
  return "krajExpression";
}

function getShiftLabel(shift: InventoryListSummary["shift"], t: (key: string) => string): string {
  return shift === "first" ? t("firstShift") : t("secondShift");
}

function SortChip({ isSelected, label, onPress }: { isSelected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("min-h-10 justify-center rounded-md border px-3", isSelected ? "border-orange bg-primary" : "border-primary bg-white")}>
      <Text className="font-semibold text-secondary_dark">{label}</Text>
    </Pressable>
  );
}

function isValidInventoryDate(value: string, dateFormat: string): boolean {
  const trimmedValue = value.trim();
  let day = 0;
  let month = 0;
  let year = 0;

  if (dateFormat === "yyyy-MM-dd") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);
    if (!match) return false;
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    const separator = dateFormat === "dd.MM.yyyy" ? "\\." : "/";
    const match = new RegExp(`^(\\d{2})${separator}(\\d{2})${separator}(\\d{4})$`).exec(trimmedValue);
    if (!match) return false;
    const firstPart = Number(match[1]);
    const secondPart = Number(match[2]);
    year = Number(match[3]);
    if (dateFormat === "MM/dd/yyyy") {
      month = firstPart;
      day = secondPart;
    } else {
      day = firstPart;
      month = secondPart;
    }
  }

  if (year < 1900 || month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function ExpressionBadge({ expression }: { expression: string }) {
  if (!hasExpression(expression)) return null;
  return (
    <View className="ml-1 rounded bg-orange px-1.5 py-0.5">
      <Text className="text-xs font-bold text-white">+</Text>
    </View>
  );
}

export default function InventoryScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const session = useAuthStore((state) => state.session);
  const dateFormat = useSetupStore((state) => state.status?.dateFormat ?? "dd/MM/yyyy");
  const { formatDateTime, formatMoney } = useAppFormatters();
  const [lists, setLists] = useState<InventoryListSummary[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [selectedList, setSelectedList] = useState<InventoryListDetail | null>(null);
  const [draftList, setDraftList] = useState<InventoryListDetail | null>(null);
  const [numericTarget, setNumericTarget] = useState<NumericTarget>(null);
  const [numericDraft, setNumericDraft] = useState("");
  const [explanationTarget, setExplanationTarget] = useState<ExplanationTarget>(null);
  const [expressionPreview, setExpressionPreview] = useState<ExpressionPreview>(null);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isPdfConfirmVisible, setIsPdfConfirmVisible] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [grouping, setGrouping] = useState<InventoryGrouping>("unit");
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedListsRef = useRef(false);
  const isAdmin = session?.user.role === "admin";
  const isEditing = Boolean(draftList);
  const visibleList = draftList ?? selectedList;
  const selectedSummary = lists.find((list) => list.id === selectedListId);

  const groupedProducts = useMemo(() => {
    if (!visibleList) return [];
    const sortedProducts = [...visibleList.products].sort((left, right) => {
      const leftGroup = grouping === "category" ? left.categoryName : left.unitName;
      const rightGroup = grouping === "category" ? right.categoryName : right.unitName;
      if (left.isCounterProduct !== right.isCounterProduct) return left.isCounterProduct ? 1 : -1;
      const groupCompare = leftGroup.localeCompare(rightGroup);
      if (groupCompare !== 0) return groupCompare;
      return left.position - right.position;
    });

    return sortedProducts.reduce<Array<{ groupName: string; products: InventoryListProductDetail[] }>>((groups, product) => {
      const groupName = product.isCounterProduct ? t("counterProductsCategory") : (grouping === "category" ? product.categoryName : product.unitName) || t("uncategorized");
      const group = groups.find((item) => item.groupName === groupName);
      if (group) group.products.push(product);
      else groups.push({ groupName, products: [product] });
      return groups;
    }, []);
  }, [grouping, t, visibleList]);

  const loadListDetail = useCallback(async (listId: string) => {
    if (!listId) {
      setSelectedList(null);
      setDraftList(null);
      return;
    }

    try {
      setIsDetailLoading(true);
      const detail = await getInventoryList(listId);
      setSelectedList(detail);
      setDraftList(null);
    } catch (error) {
      toast.error(t("inventoryListLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const loadLists = useCallback(async () => {
    try {
      setIsLoading(true);
      const rows = await listInventoryLists();
      setLists(rows);
      setSelectedListId("");
      setSelectedList(null);
      setDraftList(null);
      setIsPickerOpen(false);
    } catch (error) {
      toast.error(t("inventoryListsLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedListsRef.current) {
      hasLoadedListsRef.current = true;
      void loadLists();
    }
  }, [loadLists]);

  const summaryTotals = useMemo(() => {
    const source = visibleList;
    if (!source) return { bilans: 0, totalEarn: 0, totalExpenses: 0, totalProductEarnings: 0, totalRevenues: 0 };
    const totalProductEarnings = source.products.reduce((total, item) => total + item.totalEarning, 0);
    const totalRevenues = source.financialEntries.reduce((total, item) => item.typeSnapshot === "revenue" ? total + item.amount : total, 0);
    const totalExpenses = source.financialEntries.reduce((total, item) => item.typeSnapshot === "expense" ? total + item.amount : total, 0);
    const bilans = totalRevenues - totalExpenses;
    return { bilans, totalEarn: totalProductEarnings + bilans, totalExpenses, totalProductEarnings, totalRevenues };
  }, [visibleList]);

  const selectList = (listId: string) => {
    setSelectedListId(listId);
    setIsPickerOpen(false);
    void loadListDetail(listId);
  };

  const startEditing = () => {
    if (!isAdmin || !selectedList) return;
    setDraftList(JSON.parse(JSON.stringify(selectedList)) as InventoryListDetail);
  };

  const cancelEditing = () => {
    setDraftList(null);
    setNumericTarget(null);
    setExplanationTarget(null);
  };

  const openProductNumberModal = (row: InventoryListProductDetail, field: ProductField) => {
    if (!isEditing) return;
    if (row.isCounterProduct && field === "uneto") return;
    const expressionField = getProductExpressionField(field);
    setNumericTarget({ expression: row[expressionField], field, kind: "product", rowId: row.id });
    setNumericDraft(row[expressionField]);
  };

  const openFinancialNumberModal = (row: InventoryListFinancialEntryDetail) => {
    if (!isEditing) return;
    setNumericTarget({ expression: row.amountExpression, kind: "financial", rowId: row.id });
    setNumericDraft(row.amountExpression);
  };

  const openExplanationModal = (row: InventoryListFinancialEntryDetail) => {
    if (!isEditing) return;
    setExplanationTarget({ rowId: row.id, value: row.explanation });
  };

  const closeNumericModal = () => {
    setNumericTarget(null);
    setNumericDraft("");
  };

  const closeExplanationModal = () => setExplanationTarget(null);

  const appendPlus = () => setNumericDraft((current) => `${current}+`);
  const appendMinus = () => setNumericDraft((current) => `${current}-`);

  const updateDraftProduct = (rowId: string, field: ProductField, value: number, expression: string) => {
    setDraftList((current) => {
      if (!current) return current;
      return {
        ...current,
        products: current.products.map((row) => {
          if (row.id !== rowId) return row;
          const expressionField = getProductExpressionField(field);
          const nextRow = { ...row, [field]: value, [expressionField]: expression } as InventoryListProductDetail;
          const prodato = nextRow.isCounterProduct ? nextRow.kraj - nextRow.kolicina : nextRow.kolicina + nextRow.uneto - nextRow.kraj;
          return { ...nextRow, uneto: nextRow.isCounterProduct ? 0 : nextRow.uneto, unetoExpression: nextRow.isCounterProduct ? "0" : nextRow.unetoExpression, prodato, totalEarning: prodato * nextRow.priceSnapshot };
        }),
      };
    });
  };

  const updateDraftFinancialAmount = (rowId: string, value: number, expression: string) => {
    setDraftList((current) => {
      if (!current) return current;
      return { ...current, financialEntries: current.financialEntries.map((row) => row.id === rowId ? { ...row, amount: value, amountExpression: expression } : row) };
    });
  };

  const updateDraftFinancialExplanation = (rowId: string, explanation: string) => {
    setDraftList((current) => {
      if (!current) return current;
      return { ...current, financialEntries: current.financialEntries.map((row) => row.id === rowId ? { ...row, explanation } : row) };
    });
  };

  const saveNumericModal = () => {
    if (!numericTarget) return;
    const calculatedValue = numericDraft.trim() ? evaluatePlusExpression(numericDraft) : evaluatePlusExpression(numericTarget.expression);
    if (calculatedValue === null || calculatedValue < 0) {
      toast.error(t("calculatorInvalidExpression"));
      return;
    }
    if (numericTarget.kind === "product") {
      const row = draftList?.products.find((product) => product.id === numericTarget.rowId);
      if (row?.isCounterProduct && numericTarget.field === "kraj" && calculatedValue < row.kolicina) {
        toast.error(t("counterProductEndInvalid"));
        return;
      }
      if (row?.isCounterProduct && numericTarget.field === "kolicina" && row.kraj < calculatedValue) {
        toast.error(t("counterProductEndInvalid"));
        return;
      }
    }

    const expression = numericDraft.trim() || calculatedValue.toString();
    if (numericTarget.kind === "product") updateDraftProduct(numericTarget.rowId, numericTarget.field, calculatedValue, expression);
    else updateDraftFinancialAmount(numericTarget.rowId, calculatedValue, expression);
    closeNumericModal();
  };

  const saveExplanationModal = () => {
    if (!explanationTarget) return;
    updateDraftFinancialExplanation(explanationTarget.rowId, explanationTarget.value);
    closeExplanationModal();
  };

  const saveList = async () => {
    if (!draftList || isSaving) return;
    if (!isValidInventoryDate(draftList.date, dateFormat)) {
      toast.error(t("inventoryValidationFailed"), t("inventoryDateInvalid"));
      return;
    }
    for (const product of draftList.products) {
      if (product.kraj < 0 || product.totalEarning < 0) {
        toast.error(t("inventoryValidationFailed"), t("inventoryNegativeTotalsInvalid"));
        return;
      }
      if (product.isCounterProduct && product.kraj < product.kolicina) {
        toast.error(t("inventoryValidationFailed"), t("counterProductEndInvalid"));
        return;
      }
    }
    setIsSaving(true);
    try {
      const updatedList = await updateInventoryList({
        date: draftList.date,
        financialEntries: draftList.financialEntries,
        id: draftList.id,
        products: draftList.products,
        shift: draftList.shift,
      });
      setSelectedList(updatedList);
      setDraftList(null);
      const rows = await listInventoryLists();
      setLists(rows);
      toast.success(t("inventoryListUpdated"));
    } catch (error) {
      if (error instanceof Error && error.message === INVENTORY_LIST_DUPLICATE_ERROR) toast.error(t("inventoryDuplicateList"));
      else toast.error(t("inventoryListUpdateFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteList = async () => {
    if (!isAdmin || !selectedList || isDeletingList) return;
    setIsDeleteConfirmVisible(false);
    setIsDeletingList(true);
    try {
      await deleteInventoryList(selectedList.id);
      setSelectedListId("");
      setSelectedList(null);
      setDraftList(null);
      setLists(await listInventoryLists());
      toast.success(t("inventoryListDeleted"));
    } catch (error) {
      toast.error(t("inventoryListDeleteFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsDeletingList(false);
    }
  };

  const exportPdf = async () => {
    if (!visibleList || isExportingPdf) return;
    setIsPdfConfirmVisible(false);
    setIsExportingPdf(true);
    try {
      const fileName = `Quantivo-${visibleList.date}-${visibleList.shift}-${visibleList.id}.pdf`;
      await exportInventoryListToPdf({
        fileName,
        formatDateTime,
        formatMoney,
        labels: {
          createdAt: t("createdAt"),
          createdBy: t("createdBy"),
          end: t("end"),
          entered: t("entered"),
          expense: t("expense"),
          explanation: t("explanation"),
          firstShift: t("firstShift"),
          inventory: t("inventory"),
          inventoryDate: t("inventoryDate"),
          inventorySummary: t("inventorySummary"),
          listId: t("listId"),
          name: t("name"),
          noExplanation: t("noExplanation"),
          notAvailable: t("notAvailable"),
          pdfAmount: t("pdfAmount"),
          price: t("price"),
          products: t("products"),
          quantity: t("quantity"),
          revenue: t("revenue"),
          revenuesExpensesManagement: t("revenuesExpensesManagement"),
          secondShift: t("secondShift"),
          shift: t("shift"),
          sold: t("sold"),
          totalEarn: t("totalEarn"),
          totalEarnings: t("totalEarnings"),
          totalExpenses: t("totalExpenses"),
          totalProductEarnings: t("totalProductEarnings"),
          totalRevenues: t("totalRevenues"),
          type: t("type"),
          updatedAt: t("updatedAt"),
        },
        list: visibleList,
      });
      toast.success(t("pdfExported"));
    } catch (error) {
      toast.error(t("pdfExportFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const updateDraftDate = (date: string) => {
    setDraftList((current) => current ? { ...current, date } : current);
  };

  const updateDraftShift = (shift: InventoryListDetail["shift"]) => {
    setDraftList((current) => current ? { ...current, shift } : current);
  };

  const refreshLists = async () => {
    setIsRefreshing(true);
    await loadLists();
    setIsRefreshing(false);
  };

  const renderNumberCell = (value: number, expression: string, onPress?: () => void) => (
    <Pressable disabled={!onPress && !hasExpression(expression)} onPress={onPress ?? (hasExpression(expression) ? () => setExpressionPreview({ expression }) : undefined)} className={clsx("min-h-10 flex-row items-center justify-center rounded-md border border-primary bg-white px-2", (onPress || hasExpression(expression)) && "bg-background")}>
      <Text className="text-center text-base font-semibold text-secondary_dark">{formatQuantity(value)}</Text>
      <ExpressionBadge expression={expression} />
    </Pressable>
  );

  return (
    <Screen tabPage icon={<ClipboardList color={colors.secondaryDark} size={36} />} title={t("inventory")} subtitle={t("inventorySubtitle")} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshLists} tintColor={colors.orange} />}>
      <View className="gap-4">
        {isLoading ? <LoadingState label={t("loadingLists")} /> : null}

        {!isLoading && lists.length === 0 ? (
          <RevealOnScroll>
            <AppCard>
              <EmptyState title={t("inventoryEmptyTitle")} message={t("inventoryListsEmptyMessage")} />
            </AppCard>
          </RevealOnScroll>
        ) : null}

        {!isLoading && lists.length > 0 ? (
          <RevealOnScroll>
          <AppCard className="border-primary">
            <Text className="text-lg font-semibold text-secondary_dark">{t("chooseInventoryList")}</Text>
            <Pressable onPress={() => setIsPickerOpen((current) => !current)} className="min-h-12 flex-row items-center justify-between gap-3 rounded-md border border-primary bg-white px-3">
              <Text className={clsx("flex-1 font-semibold", selectedSummary ? "text-secondary_dark" : "text-muted")}>
                {selectedSummary ? `${selectedSummary.date} | ${getShiftLabel(selectedSummary.shift, t)} | ${selectedSummary.createdByUserName}` : t("selectInventoryList")}
              </Text>
              <ChevronDown color={colors.secondaryDark} size={20} />
            </Pressable>
            {isPickerOpen ? (
              <View style={{ maxHeight: 280 }} className="overflow-hidden rounded-md border border-primary bg-white">
                <ScrollView nestedScrollEnabled>
                  <Pressable onPress={() => selectList("")} className={clsx("border-b border-primary px-3 py-3", !selectedListId && "bg-primary")}>
                    <Text className="font-semibold text-secondary_dark">{t("noneSelected")}</Text>
                  </Pressable>
                  {lists.map((list) => (
                    <Pressable key={list.id} onPress={() => selectList(list.id)} className={clsx("border-b border-primary px-3 py-3", selectedListId === list.id && "bg-primary")}>
                      <Text className="font-semibold text-secondary_dark">{list.date} | {getShiftLabel(list.shift, t)} | {list.createdByUserName}</Text>
                      <Text className="mt-1 text-xs text-muted">{t("totalEarn")}: {formatMoney(list.totalEarn)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </AppCard>
          </RevealOnScroll>
        ) : null}

        {isDetailLoading ? <LoadingState label={t("loadingListDetails")} /> : null}

        {!isLoading && !isDetailLoading && lists.length > 0 && !visibleList ? (
          <RevealOnScroll>
            <AppCard className="border-primary">
              <Text className="text-base font-semibold text-secondary_dark">{t("selectInventoryListPrompt")}</Text>
            </AppCard>
          </RevealOnScroll>
        ) : null}

        {!isDetailLoading && visibleList ? (
          <RevealOnScroll>
          <AppCard className="border-secondary_dark bg-white">
            <View className="gap-5">
              <View className="gap-3 border-b border-primary pb-4">
                <View className="flex-row flex-wrap items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-secondary_dark">{visibleList.date} | {getShiftLabel(visibleList.shift, t)}</Text>
                    <Text className="mt-1 text-sm text-muted">{t("createdBy")}: {visibleList.createdByUserName}</Text>
                    <Text className="mt-1 text-sm text-muted">{t("createdAt")}: {formatDateTime(visibleList.createdAt)}</Text>
                    <Text className="mt-1 text-sm text-muted">{t("updatedAt")}: {formatDateTime(visibleList.updatedAt)}</Text>
                  </View>
                  {isAdmin && !isEditing ? (
                    <View className="min-w-32 gap-2">
                      <AppButton label={t("exportPdf")} loading={isExportingPdf} disabled={isExportingPdf} onPress={() => setIsPdfConfirmVisible(true)} className="bg-orange" />
                      <AppButton label={t("editList")} onPress={startEditing} className="bg-secondary_dark" />
                      <AppButton label={t("delete")} loading={isDeletingList} disabled={isDeletingList} onPress={() => setIsDeleteConfirmVisible(true)} className="bg-red-600" />
                    </View>
                  ) : null}
                  {!isAdmin && !isEditing ? (
                    <View className="min-w-32">
                      <AppButton label={t("exportPdf")} loading={isExportingPdf} disabled={isExportingPdf} onPress={() => setIsPdfConfirmVisible(true)} className="bg-orange" />
                    </View>
                  ) : null}
                </View>
                {isEditing ? (
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <AppButton label={t("saveList")} loading={isSaving} disabled={isSaving} onPress={saveList} className="bg-secondary_dark" />
                    </View>
                    <View className="flex-1">
                      <AppButton label={t("cancel")} variant="secondary" disabled={isSaving} onPress={cancelEditing} />
                    </View>
                  </View>
                ) : null}
              
              </View>

              <View className="gap-3">
                <View className="flex-row flex-wrap items-center justify-between gap-3">
                  <Text className="text-lg font-semibold text-secondary_dark">{t("products")}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    <SortChip isSelected={grouping === "unit"} label={t("sortByUnit")} onPress={() => setGrouping("unit")} />
                    <SortChip isSelected={grouping === "category"} label={t("sortByCategory")} onPress={() => setGrouping("category")} />
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View className="overflow-hidden rounded-md border border-secondary_dark" style={{ width: productTableWidth + 2 }}>
                    <View className="flex-row bg-secondary_dark">
                      {productColumns.map((column) => (
                        <View key={column.key} style={{ width: column.width }} className={clsx("justify-center px-2 py-3", column.key === "name" ? "items-start" : "items-center")}>
                          <Text numberOfLines={2} className={clsx("w-full text-xs font-semibold uppercase text-text_color_2", column.key === "name" ? "text-left" : "text-center")}>{t(column.key)}</Text>
                        </View>
                      ))}
                    </View>
                    {groupedProducts.map((group) => (
                      <View key={group.groupName}>
                        <View className="bg-primary/70 px-3 py-2">
                          <Text className="text-base font-semibold text-secondary_dark">{group.groupName}</Text>
                        </View>
                        {group.products.map((product, index) => (
                          <RevealOnScroll key={product.id} duration={560}>
                          <View className={clsx("flex-row items-center bg-white", index < group.products.length - 1 && "border-b border-primary")}>
                            <View style={{ width: productColumns[0].width }} className="justify-center px-2 py-3">
                              <View className="flex-row items-center gap-1">
                                <Text className="flex-shrink text-base font-semibold text-secondary_dark">{product.productNameSnapshot}</Text>
                                {product.isCounterProduct ? <Text className="rounded bg-orange px-1.5 py-0.5 text-xs font-bold text-black">B</Text> : null}
                              </View>
                            </View>
                            <View style={{ width: productColumns[1].width }} className="justify-center px-2 py-3">
                              {renderNumberCell(product.kolicina, product.kolicinaExpression, isEditing ? () => openProductNumberModal(product, "kolicina") : undefined)}
                            </View>
                            <View style={{ width: productColumns[2].width }} className="justify-center px-2 py-3">
                              {product.isCounterProduct ? <Text className="text-center text-base font-semibold text-secondary_dark">{t("notAvailable")}</Text> : renderNumberCell(product.uneto, product.unetoExpression, isEditing ? () => openProductNumberModal(product, "uneto") : undefined)}
                            </View>
                            <View style={{ width: productColumns[3].width }} className="justify-center px-2 py-3">
                              {renderNumberCell(product.kraj, product.krajExpression, isEditing ? () => openProductNumberModal(product, "kraj") : undefined)}
                            </View>
                            <View style={{ width: productColumns[4].width }} className="justify-center px-2 py-3">
                              <Text className="text-center text-base text-secondary">{formatQuantity(product.prodato)}</Text>
                            </View>
                            <View style={{ width: productColumns[5].width }} className="justify-center px-2 py-3">
                              <Text className="text-center text-base text-secondary">{formatMoney(product.priceSnapshot)}</Text>
                            </View>
                            <View style={{ width: productColumns[6].width }} className="justify-center px-2 py-3">
                              <Text numberOfLines={1} className="text-center text-base font-semibold text-secondary_dark">{formatMoney(product.totalEarning)}</Text>
                            </View>
                          </View>
                          </RevealOnScroll>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="gap-3 border-t border-primary pt-4">
                <Text className="text-lg font-semibold text-secondary_dark">{t("revenuesExpensesManagement")}</Text>
                {visibleList.financialEntries.map((entry) => {
                  const colorClass = entry.typeSnapshot === "revenue" ? "text-green-700" : "text-red-700";
                  return (
                    <RevealOnScroll key={entry.id} duration={560}>
                    <View className="gap-2 rounded-md border border-primary bg-white p-3">
                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-secondary_dark">{entry.nameSnapshot}</Text>
                          <Text className={clsx("mt-1 text-sm font-semibold", colorClass)}>{entry.typeSnapshot === "revenue" ? t("revenue") : t("expense")}</Text>
                        </View>
                        {renderNumberCell(entry.amount, entry.amountExpression, isEditing ? () => openFinancialNumberModal(entry) : undefined)}
                      </View>
                      <Pressable disabled={!isEditing} onPress={() => openExplanationModal(entry)} className={clsx("min-h-11 justify-center rounded-md border border-primary bg-background px-3", !entry.explanation && "bg-white")}>
                        <Text className={clsx("text-sm", entry.explanation ? "text-secondary_dark" : "text-muted")}>{entry.explanation || t("noExplanation")}</Text>
                      </Pressable>
                    </View>
                    </RevealOnScroll>
                  );
                })}
              </View>

              {isEditing ? (
                <View className="gap-3 border-t border-primary pt-4">
                  <AppInput label={t("inventoryDate")} value={visibleList.date} onChangeText={updateDraftDate} />
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-ink">{t("shift")}</Text>
                    <View className="flex-row flex-wrap gap-2">
                      <SortChip isSelected={visibleList.shift === "first"} label={t("firstShift")} onPress={() => updateDraftShift("first")} />
                      <SortChip isSelected={visibleList.shift === "second"} label={t("secondShift")} onPress={() => updateDraftShift("second")} />
                    </View>
                  </View>
                </View>
              ) : null}

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
            </View>
          </AppCard>
          </RevealOnScroll>
        ) : null}
      </View>

      <AppModal visible={Boolean(numericTarget)} onClose={closeNumericModal}>
        <View className="gap-5">
          <View>
            <Text className="text-xl font-semibold text-secondary_dark">{t("editInventoryValue")}</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">{t("inventoryValueModalHint")}</Text>
          </View>
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <AppInput value={numericDraft} onChangeText={(value) => setNumericDraft(sanitizeExpression(value))} keyboardType="decimal-pad" placeholder="10+10+10" />
            </View>
            <Pressable accessibilityLabel={t("insertPlus")} onPress={appendPlus} className="h-12 w-12 items-center justify-center rounded-lg bg-secondary_dark">
              <Plus color="#ffffff" size={22} />
            </Pressable>
            <Pressable accessibilityLabel={t("insertMinus")} onPress={appendMinus} className="h-12 w-12 items-center justify-center rounded-lg bg-secondary_dark">
              <Minus color="#ffffff" size={22} />
            </Pressable>
          </View>
          <View className="gap-3">
            <AppButton label={t("saveChanges")} onPress={saveNumericModal} className="bg-secondary_dark" />
            <AppButton label={t("cancel")} variant="secondary" onPress={closeNumericModal} />
          </View>
        </View>
      </AppModal>

      <AppModal visible={Boolean(explanationTarget)} onClose={closeExplanationModal}>
        <View className="gap-5">
          <View>
            <Text className="text-xl font-semibold text-secondary_dark">{t("editExplanation")}</Text>
          </View>
          <AppInput value={explanationTarget?.value ?? ""} onChangeText={(value) => setExplanationTarget((current) => current ? { ...current, value } : current)} multiline />
          <View className="gap-3">
            <AppButton label={t("saveChanges")} onPress={saveExplanationModal} className="bg-secondary_dark" />
            <AppButton label={t("cancel")} variant="secondary" onPress={closeExplanationModal} />
          </View>
        </View>
      </AppModal>
      <AppModal visible={Boolean(expressionPreview)} onClose={() => setExpressionPreview(null)}>
        <View className="gap-5">
          <View>
            <Text className="text-xl font-semibold text-secondary_dark">{t("savedExpression")}</Text>
            <Text className="mt-2 text-lg font-semibold text-secondary">{expressionPreview?.expression ?? ""}</Text>
          </View>
          <AppButton label={t("confirm")} onPress={() => setExpressionPreview(null)} className="bg-secondary_dark" />
        </View>
      </AppModal>
      <ConfirmDialog
        visible={isPdfConfirmVisible}
        title={t("exportPdfConfirmTitle")}
        message={t("exportPdfConfirmMessage")}
        cancelLabel={t("cancel")}
        confirmLabel={t("exportPdf")}
        onCancel={() => setIsPdfConfirmVisible(false)}
        onConfirm={exportPdf}
      />
      <ConfirmDialog
        destructive
        visible={isDeleteConfirmVisible}
        title={t("deleteInventoryListTitle")}
        message={t("deleteInventoryListMessage")}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onCancel={() => setIsDeleteConfirmVisible(false)}
        onConfirm={handleDeleteList}
      />
    </Screen>
  );
}
