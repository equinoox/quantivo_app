import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import clsx from "clsx";
import { ClipboardList, Minus, Plus } from "lucide-react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { InventoryDocumentHeader } from "@/features/inventory/components/InventoryDocumentHeader";
import { InventoryFinancialEntries } from "@/features/inventory/components/InventoryFinancialEntries";
import { InventoryListPicker } from "@/features/inventory/components/InventoryListPicker";
import { InventoryListProductTable } from "@/features/inventory/components/InventoryListProductTable";
import { InventoryListSummaryCard } from "@/features/inventory/components/InventoryListSummaryCard";
import { InventorySortChip } from "@/features/inventory/components/InventorySortChip";
import { calculateSoldValue, evaluateInventoryExpression, formatQuantity, getProductExpressionField, hasInventoryExpression, InventoryGrouping, isValidInventoryDate, ProductField, sanitizeInventoryExpression } from "@/features/inventory/lib/inventory-calculations";
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

type NumericTarget =
  | { kind: "product"; rowId: string; field: ProductField; expression: string }
  | { kind: "financial"; rowId: string; expression: string }
  | null;
type ExplanationTarget = { rowId: string; value: string } | null;
type ExpressionPreview = { expression: string } | null;

function getShiftLabel(shift: InventoryListSummary["shift"], t: (key: string) => string): string {
  return shift === "first" ? t("firstShift") : t("secondShift");
}

function ExpressionBadge({ expression }: { expression: string }) {
  if (!hasInventoryExpression(expression)) return null;
  return (
    <View className="ml-1 rounded bg-orange px-1.5 py-0.5">
      <Text className="text-xs font-bold text-white">+</Text>
    </View>
  );
}

export function InventoryTab() {
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
          const prodato = calculateSoldValue({ end: nextRow.kraj, entered: nextRow.uneto, isCounterProduct: nextRow.isCounterProduct, quantity: nextRow.kolicina });
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
    const calculatedValue = numericDraft.trim() ? evaluateInventoryExpression(numericDraft) : evaluateInventoryExpression(numericTarget.expression);
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
    <Pressable disabled={!onPress && !hasInventoryExpression(expression)} onPress={onPress ?? (hasInventoryExpression(expression) ? () => setExpressionPreview({ expression }) : undefined)} className={clsx("min-h-10 flex-row items-center justify-center rounded-md border border-primary bg-white px-2", (onPress || hasInventoryExpression(expression)) && "bg-background")}>
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
          <InventoryListPicker
            formatMoney={formatMoney}
            getShiftLabel={(listShift) => getShiftLabel(listShift, t)}
            isOpen={isPickerOpen}
            lists={lists}
            onSelect={selectList}
            onToggle={() => setIsPickerOpen((current) => !current)}
            selectedListId={selectedListId}
            selectedSummary={selectedSummary}
            t={t}
          />
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
              <InventoryDocumentHeader
                formatDateTime={formatDateTime}
                getShiftLabel={(listShift) => getShiftLabel(listShift, t)}
                isAdmin={isAdmin}
                isDeletingList={isDeletingList}
                isEditing={isEditing}
                isExportingPdf={isExportingPdf}
                isSaving={isSaving}
                list={visibleList}
                onCancelEdit={cancelEditing}
                onDelete={() => setIsDeleteConfirmVisible(true)}
                onEdit={startEditing}
                onExportPdf={() => setIsPdfConfirmVisible(true)}
                onSave={saveList}
                t={t}
              />

              <InventoryListProductTable
                formatMoney={formatMoney}
                formatQuantity={formatQuantity}
                groupedProducts={groupedProducts}
                grouping={grouping}
                isEditing={isEditing}
                onChangeGrouping={setGrouping}
                onOpenNumber={openProductNumberModal}
                renderNumberCell={renderNumberCell}
                t={t}
              />

              <InventoryFinancialEntries
                entries={visibleList.financialEntries}
                formatMoney={formatMoney}
                isEditing={isEditing}
                onOpenExplanation={openExplanationModal}
                onOpenNumber={openFinancialNumberModal}
                renderNumberCell={renderNumberCell}
                t={t}
              />

              {isEditing ? (
                <View className="gap-3 border-t border-primary pt-4">
                  <AppInput label={t("inventoryDate")} value={visibleList.date} onChangeText={updateDraftDate} />
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-ink">{t("shift")}</Text>
                    <View className="flex-row flex-wrap gap-2">
                      <InventorySortChip isSelected={visibleList.shift === "first"} label={t("firstShift")} onPress={() => updateDraftShift("first")} />
                      <InventorySortChip isSelected={visibleList.shift === "second"} label={t("secondShift")} onPress={() => updateDraftShift("second")} />
                    </View>
                  </View>
                </View>
              ) : null}

              <InventoryListSummaryCard formatMoney={formatMoney} summaryTotals={summaryTotals} t={t} />
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
              <AppInput value={numericDraft} onChangeText={(value) => setNumericDraft(sanitizeInventoryExpression(value))} keyboardType="decimal-pad" placeholder="10+10+10" />
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
