import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import clsx from "clsx";
import { AlertTriangle, CircleDollarSign, ClipboardList, Clock, ListPlus, Minus, Package, Pencil, Plus } from "lucide-react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { NewInventoryProductTable } from "@/features/inventory/components/NewInventoryProductTable";
import { useNewInventoryDraftStore } from "@/features/inventory/hooks/useNewInventoryDraftStore";
import { evaluateInventoryExpression, getInitialProductInventoryValues, getInventoryDateKey, isValidInventoryDate, parseInventoryFieldValue, parseOptionalNonNegativeNumber, sanitizeCalculatorExpression } from "@/features/inventory/lib/inventory-calculations";
import { finishInventoryList, INVENTORY_LIST_DUPLICATE_ERROR } from "@/features/inventory/services/inventory.service";
import { createInventoryActivity } from "@/features/inventory/services/inventory-activity.service";
import { FinishInventoryListFinancialEntryInput, FinishInventoryListProductInput } from "@/features/inventory/types/inventory.types";
import { createShiftFinishedNotification } from "@/features/notifications/services/notifications.service";
import { listProducts } from "@/features/inventory/products/services/products.service";
import { Product } from "@/features/inventory/products/types/product.types";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { listFinancialItems } from "@/features/finance/services/financial-items.service";
import { FinancialItem } from "@/features/finance/types/financial-item.types";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/AppInput";
import { AppModal } from "@/shared/components/ui/AppModal";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { LoadingState } from "@/shared/components/ui/LoadingState";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { routes } from "@/shared/constants/routes";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { createLocalId } from "@/shared/lib/id/createLocalId";
import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";
import { useI18n } from "@/shared/i18n/useI18n";

type InventoryGrouping = "category" | "unit";
type InventoryShift = "first" | "second";
type EditableProductField = "entered" | "quantity" | "end";
type InventoryFinancialEntry = {
  amount: string;
  amountExpression: string;
  behavior: FinancialItem["behavior"];
  explanation: string;
  id: string;
  itemId: string;
  name: string;
  requiresExplanation: boolean;
  type: FinancialItem["type"];
};
type CalculatorTarget = { entryId: string; expression: string } | null;

function SortChip({ isSelected, label, onPress }: { isSelected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("min-h-10 justify-center rounded-md border px-3", isSelected ? "border-orange bg-primary" : "border-primary bg-white")}>
      <Text className="font-semibold text-secondary_dark">{label}</Text>
    </Pressable>
  );
}

export function CreateInventoryListScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const session = useAuthStore((state) => state.session);
  const dateFormat = useSetupStore((state) => state.status?.dateFormat ?? "dd/MM/yyyy");
  const { formatDate, formatMoney } = useAppFormatters();
  const grouping = useNewInventoryDraftStore((state) => state.grouping);
  const productInventoryInputs = useNewInventoryDraftStore((state) => state.productInventoryInputs);
  const products = useNewInventoryDraftStore((state) => state.products);
  const resetProductInventoryInputs = useNewInventoryDraftStore((state) => state.resetProductInventoryInputs);
  const setGrouping = useNewInventoryDraftStore((state) => state.setGrouping);
  const setProducts = useNewInventoryDraftStore((state) => state.setProducts);
  const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]);
  const [financialEntries, setFinancialEntries] = useState<InventoryFinancialEntry[]>([]);
  const [selectedFinancialItemId, setSelectedFinancialItemId] = useState("");
  const [calculatorTarget, setCalculatorTarget] = useState<CalculatorTarget>(null);
  const [isAddAllConfirmVisible, setIsAddAllConfirmVisible] = useState(false);
  const [isFinishConfirmVisible, setIsFinishConfirmVisible] = useState(false);
  const [inventoryDate, setInventoryDate] = useState(() => formatDate(new Date()));
  const [shift, setShift] = useState<InventoryShift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = session?.user.role === "admin";
  const isManager = session?.user.role === "manager";
  const shouldLogInventoryAction = session?.user.role === "worker" || session?.user.role === "manager";

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [productRows, financialRows] = await Promise.all([listProducts(), listFinancialItems()]);
      setFinancialItems(financialRows);
      setProducts(productRows);
    } catch (error) {
      toast.error(t("productsLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboardData();
    }, [loadDashboardData]),
  );

  const groupedProducts = useMemo(() => {
    const sortedProducts = [...products].sort((left, right) => {
      const leftGroup = grouping === "category" ? left.categoryName : left.unitName;
      const rightGroup = grouping === "category" ? right.categoryName : right.unitName;
      if (left.isCounterProduct !== right.isCounterProduct) return left.isCounterProduct ? 1 : -1;
      const groupCompare = leftGroup.localeCompare(rightGroup);
      if (groupCompare !== 0) return groupCompare;
      return left.position - right.position;
    });

    return sortedProducts.reduce<Array<{ groupName: string; products: Product[] }>>((groups, product) => {
      const groupName = product.isCounterProduct ? t("counterProductsCategory") : (grouping === "category" ? product.categoryName : product.unitName) || t("uncategorized");
      const group = groups.find((item) => item.groupName === groupName);
      if (group) group.products.push(product);
      else groups.push({ groupName, products: [product] });
      return groups;
    }, []);
  }, [grouping, products, t]);

  const hasLowStockProducts = useMemo(() => {
    return products.some((product) => {
      const endQuantity = parseInventoryFieldValue(productInventoryInputs[product.id]?.end ?? getInitialProductInventoryValues(product).end, product.quantityOnHand);
      return endQuantity < product.minimumQuantityAlert;
    });
  }, [productInventoryInputs, products]);

  const productTotals = useMemo(() => {
    return products.reduce((total, product) => {
      const rowValues = productInventoryInputs[product.id] ?? getInitialProductInventoryValues(product);
      const initialValues = getInitialProductInventoryValues(product);
      const quantity = parseInventoryFieldValue(rowValues?.quantity ?? "", Number(initialValues.quantity));
      const entered = parseInventoryFieldValue(rowValues?.entered ?? "", Number(initialValues.entered));
      const end = parseInventoryFieldValue(rowValues?.end ?? "", Number(initialValues.end));
      const sold = product.isCounterProduct ? end - quantity : quantity + entered - end;
      return total + sold * product.price;
    }, 0);
  }, [productInventoryInputs, products]);

  const financialTotals = useMemo(() => {
    return financialEntries.reduce(
      (totals, item) => {
        const value = parseOptionalNonNegativeNumber(item.amount);
        const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;
        if (item.type === "revenue") totals.revenues += safeValue;
        else totals.expenses += safeValue;
        return totals;
      },
      { expenses: 0, revenues: 0 },
    );
  }, [financialEntries]);

  const summaryTotals = useMemo(() => {
    const bilans = financialTotals.revenues - financialTotals.expenses;
    return {
      bilans,
      totalEarn: productTotals + bilans,
      totalExpenses: financialTotals.expenses,
      totalProductEarnings: productTotals,
      totalRevenues: financialTotals.revenues,
    };
  }, [financialTotals.expenses, financialTotals.revenues, productTotals]);

  const selectedFinancialItem = useMemo(() => financialItems.find((item) => item.id === selectedFinancialItemId), [financialItems, selectedFinancialItemId]);

  const getProductInventoryValue = (product: Product, field: EditableProductField) => productInventoryInputs[product.id]?.[field] ?? getInitialProductInventoryValues(product)[field];

  const canEditProductField = (field: EditableProductField) => {
    if (isAdmin) return true;
    if (isManager) return true;
    return field === "entered" || field === "end";
  };

  const canEditProductFieldForProduct = (product: Product, field: EditableProductField) => {
    if (product.isCounterProduct && field === "entered") return false;
    return canEditProductField(field);
  };

  const addFinancialEntry = () => {
    if (!selectedFinancialItem) return;
    setFinancialEntries((current) => [
      ...current,
      {
        amount: "",
        amountExpression: "",
        behavior: selectedFinancialItem.behavior,
        explanation: "",
        id: createLocalId("entry"),
        itemId: selectedFinancialItem.id,
        name: selectedFinancialItem.name,
        requiresExplanation: selectedFinancialItem.requiresExplanation,
        type: selectedFinancialItem.type,
      },
    ]);
  };

  const addAllFinancialEntries = () => {
    const selectedItemIds = new Set(financialEntries.map((entry) => entry.itemId));
    const rowsToAdd = financialItems.filter((item) => !selectedItemIds.has(item.id));
    if (rowsToAdd.length === 0) {
      setIsAddAllConfirmVisible(false);
      return;
    }

    setFinancialEntries((current) => [
      ...current,
      ...rowsToAdd.map((item) => ({
        amount: "",
        amountExpression: "",
        behavior: item.behavior,
        explanation: "",
        id: createLocalId("entry"),
        itemId: item.id,
        name: item.name,
        requiresExplanation: item.requiresExplanation,
        type: item.type,
      })),
    ]);
    setIsAddAllConfirmVisible(false);
  };

  const removeFinancialEntry = (entryId: string) => {
    setFinancialEntries((current) => current.filter((entry) => entry.id !== entryId));
  };

  const updateFinancialExplanation = (entryId: string, explanation: string) => {
    setFinancialEntries((current) => current.map((entry) => entry.id === entryId ? { ...entry, explanation } : entry));
  };

  const openCalculator = (entryId: string) => {
    const entry = financialEntries.find((item) => item.id === entryId);
    setCalculatorTarget({ entryId, expression: entry?.amountExpression || entry?.amount || "" });
  };

  const closeCalculator = () => setCalculatorTarget(null);

  const appendCalculatorPlus = () => {
    setCalculatorTarget((current) => current ? { ...current, expression: `${current.expression}+` } : current);
  };

  const appendCalculatorMinus = () => {
    setCalculatorTarget((current) => current ? { ...current, expression: `${current.expression}-` } : current);
  };

  const handleCalculatorConfirm = () => {
    if (!calculatorTarget) return;
    const calculatedValue = calculatorTarget.expression.trim() ? evaluateInventoryExpression(calculatorTarget.expression) : 0;
    if (calculatedValue === null || calculatedValue < 0) {
      toast.error(t("calculatorInvalidExpression"));
      return;
    }

    setFinancialEntries((current) => current.map((entry) => entry.id === calculatorTarget.entryId ? { ...entry, amount: calculatedValue.toString(), amountExpression: calculatorTarget.expression.trim() } : entry));
    closeCalculator();
  };

  const buildProductRows = (): FinishInventoryListProductInput[] => {
    return products.map((product) => {
      const values = productInventoryInputs[product.id] ?? getInitialProductInventoryValues(product);
      const initialValues = getInitialProductInventoryValues(product);
      const uneto = parseInventoryFieldValue(values.entered, Number(initialValues.entered));
      const kolicina = parseInventoryFieldValue(values.quantity, Number(initialValues.quantity));
      const kraj = parseInventoryFieldValue(values.end, Number(initialValues.end));
      const prodato = product.isCounterProduct ? kraj - kolicina : kolicina + uneto - kraj;
      return {
        isCounterProduct: product.isCounterProduct,
        kolicina,
        kolicinaExpression: values.quantity.trim() || kolicina.toString(),
        kraj,
        krajExpression: values.end.trim() || kraj.toString(),
        priceSnapshot: product.price,
        productId: product.id,
        productNameSnapshot: product.name,
        prodato,
        totalEarning: prodato * product.price,
        uneto: product.isCounterProduct ? 0 : uneto,
        unetoExpression: product.isCounterProduct ? "0" : values.entered.trim() || uneto.toString(),
      };
    });
  };

  const buildFinancialRows = (): FinishInventoryListFinancialEntryInput[] => {
    const selectedRows = financialEntries.map((entry) => ({
      amount: parseOptionalNonNegativeNumber(entry.amount),
      amountExpression: entry.amountExpression.trim() || entry.amount.trim() || "0",
      behaviorSnapshot: entry.behavior,
      explanation: entry.explanation.trim(),
      nameSnapshot: entry.name || "",
      revenueExpenseId: entry.itemId,
      typeSnapshot: entry.type,
    }));
    const selectedItemIds = new Set(financialEntries.map((entry) => entry.itemId));
    const unselectedRows = financialItems
      .filter((item) => !selectedItemIds.has(item.id))
      .map((item) => ({
        amount: 0,
        amountExpression: "0",
        behaviorSnapshot: item.behavior,
        explanation: "",
        nameSnapshot: item.name || "",
        revenueExpenseId: item.id,
        typeSnapshot: item.type,
      }));

    return [...selectedRows, ...unselectedRows];
  };

  const validateInventoryManagement = () => {
    if (!session?.user.id) return t("unauthorized");
    if (!inventoryDate.trim()) return t("inventoryDateRequired");
    if (!isValidInventoryDate(inventoryDate, dateFormat) || !getInventoryDateKey(inventoryDate, dateFormat)) return t("inventoryDateInvalid");
    if (!shift) return t("inventoryShiftRequired");
    if (products.length === 0 || products.some((product) => !product.id || !product.name || !Number.isFinite(product.price))) return t("inventoryProductDataRequired");

    for (const product of products) {
      const values = productInventoryInputs[product.id] ?? getInitialProductInventoryValues(product);
      const initialValues = getInitialProductInventoryValues(product);
      const entered = parseInventoryFieldValue(values.entered, Number(initialValues.entered));
      const quantity = parseInventoryFieldValue(values.quantity, Number(initialValues.quantity));
      const end = parseInventoryFieldValue(values.end, Number(initialValues.end));
      if (![entered, quantity, end].every((value) => Number.isFinite(value) && value >= 0)) return t("inventoryValueInvalid");
      const sold = product.isCounterProduct ? end - quantity : quantity + entered - end;
      const totalEarning = sold * product.price;
      if (product.isCounterProduct && end < quantity) return t("counterProductEndInvalid");
      if (end < 0 || totalEarning < 0) return t("inventoryNegativeTotalsInvalid");
    }

    for (const entry of financialEntries) {
      if (!Number.isFinite(parseOptionalNonNegativeNumber(entry.amount))) return t("inventoryFinancialAmountInvalid");
    }

    return null;
  };

  const openFinishConfirm = () => {
    if (isSaving) return;
    const validationError = validateInventoryManagement();
    if (validationError) {
      toast.error(t("inventoryValidationFailed"), validationError);
      return;
    }
    setIsFinishConfirmVisible(true);
  };

  const handleFinishInventoryManagement = async () => {
    if (isSaving) return;
    setIsFinishConfirmVisible(false);
    const validationError = validateInventoryManagement();
    if (validationError) {
      toast.error(t("inventoryValidationFailed"), validationError);
      return;
    }

    if (!shift || !session?.user.id) return;

    const productRows = buildProductRows();
    const financialRows = buildFinancialRows();
    const dateKey = getInventoryDateKey(inventoryDate, dateFormat);
    if (!dateKey) return;

    setIsSaving(true);
    try {
      const finishedList = await finishInventoryList({
        bilans: summaryTotals.bilans,
        createdByUserId: session.user.id,
        date: inventoryDate.trim(),
        dateKey,
        financialEntries: financialRows,
        products: productRows,
        shift,
        totalEarn: summaryTotals.totalEarn,
        totalExpenses: summaryTotals.totalExpenses,
        totalProductEarnings: summaryTotals.totalProductEarnings,
        totalRevenues: summaryTotals.totalRevenues,
      });

      try {
        await createInventoryActivity({
          actorNameSnapshot: session.user.name,
          actorUserId: session.user.id,
          inventoryDate: finishedList.date,
          inventoryListId: finishedList.id,
          shift: finishedList.shift,
          type: "inventory_list_created",
        });
      } catch (error) {
        toast.error(t("inventoryActivitySaveFailed"), error instanceof Error ? error.message : undefined);
      }

      if (shouldLogInventoryAction) {
        try {
          await createShiftFinishedNotification({
            actorNameSnapshot: session.user.name,
            actorUserId: session.user.id,
            inventoryDate: finishedList.date,
            inventoryListId: finishedList.id,
            shift: finishedList.shift,
          });
        } catch (error) {
          toast.error(t("notificationSaveFailed"), error instanceof Error ? error.message : undefined);
        }
      }

      const [freshProducts, freshFinancialItems] = await Promise.all([listProducts(), listFinancialItems()]);
      setProducts(freshProducts);
      setFinancialItems(freshFinancialItems);
      resetProductInventoryInputs(freshProducts);
      setFinancialEntries([]);
      setSelectedFinancialItemId("");
      toast.success(t("inventorySaved"));
    } catch (error) {
      if (error instanceof Error && error.message === INVENTORY_LIST_DUPLICATE_ERROR) {
        toast.error(t("inventoryDuplicateList"));
      } else {
        toast.error(t("inventorySaveFailed"), error instanceof Error ? error.message : undefined);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  return (
    <Screen icon={<ListPlus color={colors.secondaryDark} size={36} />} title={t("createInventoryList")} subtitle={t("dashboardSubtitle")} showBackButton refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshDashboard} tintColor={colors.orange} />}>
      <View className="gap-4">
        {isLoading ? <LoadingState label={t("loadingProducts")} /> : null}

        {!isLoading && hasLowStockProducts ? (
          <View className="flex-row items-center gap-2 px-1">
            <AlertTriangle color="#dc2626" size={22} />
            <Text className="flex-1 text-base font-semibold text-red-800">{t("lowStockWarning")}</Text>
          </View>
        ) : null}

        {!isLoading && products.length === 0 ? (
          <AppCard>
            <EmptyState title={t("productsEmptyTitle")} message={t("productsEmptyMessage")} />
          </AppCard>
        ) : null}

        {!isLoading ? (
          <AppCard className="border-secondary_dark bg-white">
            <View className="gap-5">
              {products.length > 0 ? (
                <View className="gap-3">
                  <View className="flex-row flex-wrap items-center justify-between gap-3">
                    <View className="flex-row items-center gap-2">
                      <Package color={colors.secondaryDark} size={22} />
                      <Text className="text-lg font-semibold text-secondary_dark">{t("products")}</Text>
                    </View>
                    <Pressable accessibilityRole="button" onPress={() => router.push(routes.newInventoryProducts)} className="min-h-10 flex-row items-center justify-center gap-2 rounded-md border border-primary bg-white px-3">
                      <Pencil color={colors.secondaryDark} size={16} />
                      <Text className="font-semibold text-secondary_dark">{t("editProductStock")}</Text>
                    </Pressable>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    <SortChip isSelected={grouping === "unit"} label={t("sortByUnit")} onPress={() => setGrouping("unit")} />
                    <SortChip isSelected={grouping === "category"} label={t("sortByCategory")} onPress={() => setGrouping("category")} />
                  </View>
                  <NewInventoryProductTable
                    canEditProductFieldForProduct={canEditProductFieldForProduct}
                    formatMoney={formatMoney}
                    getProductInventoryValue={getProductInventoryValue}
                    groupedProducts={groupedProducts}
                    isReadOnly
                    onOpenCell={() => router.push(routes.newInventoryProducts)}
                    t={t}
                    withReveal={false}
                  />
                </View>
              ) : null}

              {financialItems.length > 0 ? (
                <View className="gap-4 border-t border-primary pt-4">
                  <View className="flex-row items-center gap-2">
                    <CircleDollarSign color={colors.secondaryDark} size={22} />
                    <Text className="text-lg font-semibold text-secondary_dark">{t("revenuesExpensesManagement")}</Text>
                  </View>
                  <View className="gap-3">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-2">
                        {financialItems.map((item) => (
                          <Pressable key={item.id} onPress={() => setSelectedFinancialItemId(item.id)} className={clsx("min-h-12 justify-center rounded-md border bg-white px-3", selectedFinancialItemId === item.id ? "border-orange" : "border-primary")}>
                            <Text className="font-semibold text-secondary_dark">{item.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <AppButton label={t("add")} disabled={!selectedFinancialItem} onPress={addFinancialEntry} className="bg-secondary_dark" />
                      </View>
                      <View className="flex-1">
                        <AppButton label={t("addAll")} onPress={() => setIsAddAllConfirmVisible(true)} className="bg-orange" />
                      </View>
                    </View>
                  </View>
                  <View className="gap-3">
                    {financialEntries.length === 0 ? <Text className="text-sm text-muted">{t("inventoryFinancialEntriesEmpty")}</Text> : null}
                    {financialEntries.map((item) => {
                      const iconColor = item.type === "revenue" ? "#16a34a" : "#dc2626";
                      return (
                        <View key={item.id} className="gap-2 rounded-md border border-primary bg-white p-3">
                          <View className="flex-row items-start justify-between gap-3">
                            <View className="flex-1">
                              <View className="flex-row items-center gap-2">
                                <Text className="text-base font-semibold text-secondary_dark">{item.name}</Text>
                                <CircleDollarSign color={iconColor} size={18} />
                              </View>
                            </View>
                            <Pressable onPress={() => openCalculator(item.id)} className="min-h-11 min-w-28 justify-center rounded-md border border-primary bg-background px-3">
                              <Text className="text-center text-base font-semibold text-secondary_dark">{item.amount || "0"}</Text>
                            </Pressable>
                            <Pressable onPress={() => removeFinancialEntry(item.id)} className="h-11 w-11 items-center justify-center rounded-md bg-red-600">
                              <Text className="font-semibold text-white">X</Text>
                            </Pressable>
                          </View>
                          {item.requiresExplanation ? <AppInput label={`${item.name} ${t("explanation")}`} value={item.explanation} onChangeText={(value) => updateFinancialExplanation(item.id, value)} /> : null}
                        </View>
                      );
                    })}
                  </View>
                  <View className="gap-2">
                    <Text className="text-base font-semibold text-green-700">{t("totalRevenues")}: {formatMoney(financialTotals.revenues)}</Text>
                    <Text className="text-base font-semibold text-red-700">{t("totalExpenses")}: {formatMoney(financialTotals.expenses)}</Text>
                  </View>
                </View>
              ) : null}

              <View className="gap-3 border-t border-primary pt-4">
                <View className="flex-row items-center gap-2">
                  <Clock color={colors.secondaryDark} size={22} />
                  <Text className="text-lg font-semibold text-secondary_dark">{t("inventoryTiming")}</Text>
                </View>
                <View className="flex-row flex-wrap items-end gap-2">
                  <View className="flex-none" style={{ width: 136 }}>
                    <AppInput label={t("date")} value={inventoryDate} onChangeText={setInventoryDate} placeholder={formatDate(new Date())} />
                  </View>
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-ink">{t("shift")}</Text>
                    <View className="flex-row gap-2">
                      <Pressable onPress={() => setShift("first")} className={clsx("min-h-12 justify-center rounded-md border px-3", shift === "first" ? "border-orange bg-primary" : "border-primary bg-white")}>
                        <Text numberOfLines={1} className="text-center text-sm font-semibold text-secondary_dark">{t("firstShift")}</Text>
                      </Pressable>
                      <Pressable onPress={() => setShift("second")} className={clsx("min-h-12 justify-center rounded-md border px-3", shift === "second" ? "border-orange bg-primary" : "border-primary bg-white")}>
                        <Text numberOfLines={1} className="text-center text-sm font-semibold text-secondary_dark">{t("secondShift")}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>

              <View className="gap-3 border-t border-primary pt-4">
                <View className="flex-row items-center gap-2">
                  <ClipboardList color={colors.secondaryDark} size={22} />
                  <Text className="text-lg font-semibold text-secondary_dark">{t("inventorySummary")}</Text>
                </View>
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
                <AppButton label={t("finishInventoryManagement")} loading={isSaving} disabled={isSaving} onPress={openFinishConfirm} className="bg-secondary_dark" />
              </View>
            </View>
          </AppCard>
        ) : null}
      </View>
      <AppModal visible={Boolean(calculatorTarget)} onClose={closeCalculator}>
        <View className="gap-5">
          <View>
            <Text className="text-xl font-semibold text-secondary_dark">{t("calculatorInputTitle")}</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">{t("calculatorInputHint")}</Text>
          </View>
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <AppInput value={calculatorTarget?.expression ?? ""} onChangeText={(expression) => setCalculatorTarget((current) => current ? { ...current, expression: sanitizeCalculatorExpression(expression) } : current)} keyboardType="phone-pad" placeholder="10+10+10" />
            </View>
            <Pressable accessibilityLabel={t("insertPlus")} onPress={appendCalculatorPlus} className="h-12 w-12 items-center justify-center rounded-lg bg-secondary_dark">
              <Plus color="#ffffff" size={22} />
            </Pressable>
            <Pressable accessibilityLabel={t("insertMinus")} onPress={appendCalculatorMinus} className="h-12 w-12 items-center justify-center rounded-lg bg-secondary_dark">
              <Minus color="#ffffff" size={22} />
            </Pressable>
          </View>
          <View className="gap-3">
            <AppButton label={t("confirm")} onPress={handleCalculatorConfirm} className="bg-secondary_dark" />
            <AppButton label={t("cancel")} variant="secondary" onPress={closeCalculator} />
          </View>
        </View>
      </AppModal>
      <ConfirmDialog
        visible={isAddAllConfirmVisible}
        title={t("addAllFinancialEntriesTitle")}
        message={t("addAllFinancialEntriesMessage")}
        cancelLabel={t("cancel")}
        confirmLabel={t("addAll")}
        onCancel={() => setIsAddAllConfirmVisible(false)}
        onConfirm={addAllFinancialEntries}
      />
      <ConfirmDialog
        visible={isFinishConfirmVisible}
        title={t("finishInventoryConfirmTitle")}
        message={t("finishInventoryConfirmMessage")}
        cancelLabel={t("cancel")}
        confirmLabel={t("finishInventoryManagement")}
        onCancel={() => setIsFinishConfirmVisible(false)}
        onConfirm={handleFinishInventoryManagement}
      />
    </Screen>
  );
}
