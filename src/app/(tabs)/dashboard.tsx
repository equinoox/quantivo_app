import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import clsx from "clsx";
import { AlertTriangle, CircleDollarSign, ImageIcon, ListPlus, Minus, Plus } from "lucide-react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { finishInventoryList, INVENTORY_LIST_DUPLICATE_ERROR } from "@/features/inventory/services/inventory.service";
import { FinishInventoryListFinancialEntryInput, FinishInventoryListProductInput } from "@/features/inventory/types/inventory.types";
import { createInventoryFieldChangeNotification, createShiftFinishedNotification } from "@/features/notifications/services/notifications.service";
import { listProducts } from "@/features/products/services/products.service";
import { Product } from "@/features/products/types/product.types";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { listFinancialItems } from "@/features/revenues-expenses/services/financial-items.service";
import { FinancialItem } from "@/features/revenues-expenses/types/financial-item.types";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/AppInput";
import { AppModal } from "@/shared/components/ui/AppModal";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { LoadingState } from "@/shared/components/ui/LoadingState";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";
import { useI18n } from "@/shared/i18n/useI18n";

type InventoryGrouping = "category" | "unit";
type InventoryShift = "first" | "second";
type EditableProductField = "entered" | "quantity" | "end";
type ProductInventoryState = Record<string, Record<EditableProductField, string>>;
type ProductCellTarget = { productId: string; field: EditableProductField } | null;
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

const tableColumns = [
  { key: "picture", width: 76 },
  { key: "name", width: 150 },
  { key: "quantity", width: 88 },
  { key: "entered", width: 82 },
  { key: "end", width: 70 },
  { key: "sold", width: 70 },
  { key: "price", width: 112 },
  { key: "totalEarnings", width: 164 },
] as const;

const tableWidth = tableColumns.reduce((total, column) => total + column.width, 0);

function SortChip({ isSelected, label, onPress }: { isSelected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("min-h-10 justify-center rounded-md border px-3", isSelected ? "border-orange bg-primary" : "border-primary bg-white")}>
      <Text className="font-semibold text-secondary_dark">{label}</Text>
    </Pressable>
  );
}

function evaluatePlusExpression(expression: string): number | null {
  const normalizedExpression = expression.replace(/,/g, ".").replace(/\s/g, "");
  if (!normalizedExpression) return null;
  if (!/^\d+(\.\d+)?([+-]\d+(\.\d+)?)*$/.test(normalizedExpression)) return null;
  const values = normalizedExpression.match(/[+-]?\d+(\.\d+)?/g)?.map((part) => Number(part)) ?? [];
  if (values.some((value) => Number.isNaN(value))) return null;
  return values.reduce((total, value) => total + value, 0);
}

function sanitizeCalculatorExpression(expression: string): string {
  return expression.replace(/[^\d+\-.,]/g, "");
}

function sanitizeInventoryExpression(value: string): string {
  return value.replace(/,/g, ".").replace(/[^\d.+-]/g, "");
}

function parseNonNegativeNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsedValue = Number(value.replace(/,/g, "."));
  if (!Number.isFinite(parsedValue) || parsedValue < 0) return null;
  return parsedValue;
}

function parseOptionalNonNegativeNumber(value: string): number {
  if (!value.trim()) return 0;
  return parseNonNegativeNumber(value) ?? Number.NaN;
}

function parseInventoryFieldValue(value: string, fallbackValue: number): number {
  if (!value.trim()) return fallbackValue;
  return evaluatePlusExpression(value) ?? Number.NaN;
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

function createLocalEntryId(): string {
  return `entry_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getInitialProductInventoryValues(product: Product): Record<EditableProductField, string> {
  const quantityOnHand = product.quantityOnHand.toString();
  return { entered: "0", end: quantityOnHand, quantity: quantityOnHand };
}

export default function DashboardScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const session = useAuthStore((state) => state.session);
  const dateFormat = useSetupStore((state) => state.status?.dateFormat ?? "dd/MM/yyyy");
  const { formatDate, formatMoney } = useAppFormatters();
  const [products, setProducts] = useState<Product[]>([]);
  const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]);
  const [productInventoryInputs, setProductInventoryInputs] = useState<ProductInventoryState>({});
  const [productCellTarget, setProductCellTarget] = useState<ProductCellTarget>(null);
  const [productCellDraft, setProductCellDraft] = useState("");
  const [financialEntries, setFinancialEntries] = useState<InventoryFinancialEntry[]>([]);
  const [selectedFinancialItemId, setSelectedFinancialItemId] = useState("");
  const [calculatorTarget, setCalculatorTarget] = useState<CalculatorTarget>(null);
  const [isAddAllConfirmVisible, setIsAddAllConfirmVisible] = useState(false);
  const [isFinishConfirmVisible, setIsFinishConfirmVisible] = useState(false);
  const [inventoryDate, setInventoryDate] = useState(() => formatDate(new Date()));
  const [shift, setShift] = useState<InventoryShift | null>(null);
  const [grouping, setGrouping] = useState<InventoryGrouping>("unit");
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
      setProducts(productRows);
      setFinancialItems(financialRows);
      setProductInventoryInputs((current) => {
        const next = { ...current };
        for (const product of productRows) {
          if (!next[product.id]) next[product.id] = getInitialProductInventoryValues(product);
        }
        return next;
      });
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

  const openProductCellModal = (productId: string, field: EditableProductField) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (!canEditProductFieldForProduct(product, field)) return;
    setProductCellTarget({ field, productId });
    setProductCellDraft(getProductInventoryValue(product, field));
  };

  const closeProductCellModal = () => {
    setProductCellTarget(null);
    setProductCellDraft("");
  };

  const handleProductCellSave = () => {
    if (!productCellTarget) return;
    const product = products.find((item) => item.id === productCellTarget.productId);
    if (!product) return;
    const fallbackValue = Number(getProductInventoryValue(product, productCellTarget.field));
    const parsedValue = parseInventoryFieldValue(productCellDraft, Number.isFinite(fallbackValue) ? fallbackValue : 0);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      toast.error(t("inventoryValueInvalid"));
      return;
    }
    if (product.isCounterProduct && productCellTarget.field === "end") {
      const startValue = parseInventoryFieldValue(getProductInventoryValue(product, "quantity"), product.quantityOnHand);
      if (parsedValue < startValue) {
        toast.error(t("counterProductEndInvalid"));
        return;
      }
    }
    if (product.isCounterProduct && productCellTarget.field === "quantity") {
      const endValue = parseInventoryFieldValue(getProductInventoryValue(product, "end"), product.quantityOnHand);
      if (endValue < parsedValue) {
        toast.error(t("counterProductEndInvalid"));
        return;
      }
    }

    const savedValue = productCellDraft.trim() ? productCellDraft.trim() : parsedValue.toString();
    const oldValue = parseInventoryFieldValue(getProductInventoryValue(product, productCellTarget.field), Number.isFinite(fallbackValue) ? fallbackValue : 0);
    setProductInventoryInputs((current) => ({
      ...current,
      [productCellTarget.productId]: {
        entered: current[productCellTarget.productId]?.entered ?? "0",
        end: current[productCellTarget.productId]?.end ?? "0",
        quantity: current[productCellTarget.productId]?.quantity ?? "0",
        [productCellTarget.field]: savedValue,
      },
    }));
    if (shouldLogInventoryAction && (productCellTarget.field === "quantity" || productCellTarget.field === "entered") && Number.isFinite(oldValue) && oldValue !== parsedValue && session?.user.id) {
      void createInventoryFieldChangeNotification({
        actorNameSnapshot: session.user.name,
        actorUserId: session.user.id,
        columnKey: productCellTarget.field,
        columnLabelSnapshot: productCellTarget.field === "quantity" ? t("quantity") : t("entered"),
        newValue: parsedValue,
        oldValue,
        productId: product.id,
        productNameSnapshot: product.name,
      }).catch((error) => toast.error(t("notificationSaveFailed"), error instanceof Error ? error.message : undefined));
    }
    closeProductCellModal();
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
        id: createLocalEntryId(),
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
        id: createLocalEntryId(),
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

  const appendProductCellPlus = () => {
    setProductCellDraft((current) => `${current}+`);
  };

  const appendProductCellMinus = () => {
    setProductCellDraft((current) => `${current}-`);
  };

  const appendCalculatorPlus = () => {
    setCalculatorTarget((current) => current ? { ...current, expression: `${current.expression}+` } : current);
  };

  const appendCalculatorMinus = () => {
    setCalculatorTarget((current) => current ? { ...current, expression: `${current.expression}-` } : current);
  };

  const handleCalculatorConfirm = () => {
    if (!calculatorTarget) return;
    const calculatedValue = calculatorTarget.expression.trim() ? evaluatePlusExpression(calculatorTarget.expression) : 0;
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
    if (!isValidInventoryDate(inventoryDate, dateFormat)) return t("inventoryDateInvalid");
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

  const resetProductInventoryInputs = (productRows: Product[]) => {
    const nextInputs: ProductInventoryState = {};
    for (const product of productRows) {
      nextInputs[product.id] = getInitialProductInventoryValues(product);
    }
    setProductInventoryInputs(nextInputs);
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

    setIsSaving(true);
    try {
      const finishedList = await finishInventoryList({
        bilans: summaryTotals.bilans,
        createdByUserId: session.user.id,
        date: inventoryDate.trim(),
        financialEntries: financialRows,
        products: productRows,
        shift,
        totalEarn: summaryTotals.totalEarn,
        totalExpenses: summaryTotals.totalExpenses,
        totalProductEarnings: summaryTotals.totalProductEarnings,
        totalRevenues: summaryTotals.totalRevenues,
      });

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
    <Screen tabPage icon={<ListPlus color={colors.secondaryDark} size={36} />} title={t("dashboard")} subtitle={t("dashboardSubtitle")} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshDashboard} tintColor={colors.orange} />}>
      <View className="gap-4">
        <RevealOnScroll>
          <View className="items-center">
            <View className="flex-row flex-wrap justify-center gap-2">
              <SortChip isSelected={grouping === "unit"} label={t("sortByUnit")} onPress={() => setGrouping("unit")} />
              <SortChip isSelected={grouping === "category"} label={t("sortByCategory")} onPress={() => setGrouping("category")} />
            </View>
          </View>
        </RevealOnScroll>

        {isLoading ? <LoadingState label={t("loadingProducts")} /> : null}

        {!isLoading && hasLowStockProducts ? (
          <RevealOnScroll>
            <View className="flex-row items-center gap-2 px-1">
              <AlertTriangle color="#dc2626" size={22} />
              <Text className="flex-1 text-base font-semibold text-red-800">{t("lowStockWarning")}</Text>
            </View>
          </RevealOnScroll>
        ) : null}

        {!isLoading && products.length === 0 ? (
          <RevealOnScroll>
            <AppCard>
              <EmptyState title={t("productsEmptyTitle")} message={t("productsEmptyMessage")} />
            </AppCard>
          </RevealOnScroll>
        ) : null}

        {!isLoading && products.length > 0 ? (
          <RevealOnScroll>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <AppCard className="gap-0 overflow-hidden border-secondary_dark p-0" style={{ width: tableWidth + 2 }}>
              <View className="flex-row bg-secondary_dark">
                <View style={{ width: tableColumns[0].width }} className="items-center justify-center px-2 py-3">
                  <Text numberOfLines={2} className="w-full text-center text-xs font-semibold uppercase text-text_color_2">{t("picture")}</Text>
                </View>
                {tableColumns.slice(1).map((column) => (
                  <View key={column.key} style={{ width: column.width }} className={clsx("justify-center px-2 py-3", column.key === "name" ? "items-start" : "items-center")}>
                    <Text numberOfLines={2} className={clsx("w-full text-xs font-semibold uppercase text-text_color_2", column.key === "name" ? "text-left" : "text-center")}>{t(column.key)}</Text>
                  </View>
                ))}
              </View>

              {groupedProducts.map((group, groupIndex) => (
                <View key={group.groupName}>
                  <View className="bg-primary/70 px-3 py-2">
                    <Text className="text-base ml-2 font-semibold text-secondary_dark">{group.groupName}</Text>
                  </View>
                  {group.products.map((product, productIndex) => {
                    const isLastRow = groupIndex === groupedProducts.length - 1 && productIndex === group.products.length - 1;
                    const enteredToday = parseInventoryFieldValue(getProductInventoryValue(product, "entered"), 0);
                    const currentQuantity = parseInventoryFieldValue(getProductInventoryValue(product, "quantity"), product.quantityOnHand);
                    const endQuantity = parseInventoryFieldValue(getProductInventoryValue(product, "end"), product.quantityOnHand);
                    const soldToday = product.isCounterProduct ? endQuantity - currentQuantity : currentQuantity + enteredToday - endQuantity;
                    const totalEarnings = product.price * soldToday;
                    const isLowQuantity = !product.isCounterProduct && endQuantity < product.minimumQuantityAlert;

                    return (
                      <RevealOnScroll key={product.id} duration={560}>
                        <View className={clsx("flex-row items-center bg-white", !isLastRow && "border-b border-primary")}>
                        <View style={{ width: tableColumns[0].width }} className="items-center px-2 py-3">
                          <View className="relative h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-secondary_dark bg-primary">
                            {product.imageUrl ? <Image source={{ uri: product.imageUrl }} className="h-full w-full" resizeMode="cover" /> : <ImageIcon color={colors.secondaryDark} size={22} />}
                            {isLowQuantity ? (
                              <View pointerEvents="none" style={styles.lowStockImageOverlay} className="items-center justify-center bg-red-700/35">
                                <View className="rounded-full bg-white/80 p-1">
                                  <AlertTriangle color="#dc2626" size={18} />
                                </View>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <View style={{ width: tableColumns[1].width }} className="justify-center px-2 py-3">
                          <View className="flex-row items-center gap-1">
                            <Text className="flex-shrink text-base font-semibold text-secondary_dark">{product.name}</Text>
                            {product.isCounterProduct ? <Text className="rounded bg-orange px-1.5 py-0.5 text-xs font-bold text-black">B</Text> : null}
                          </View>
                        </View>
                        <View style={{ width: tableColumns[2].width }} className="justify-center px-2 py-3">
                          <Pressable disabled={!canEditProductFieldForProduct(product, "quantity")} onPress={() => openProductCellModal(product.id, "quantity")} className="min-h-10 justify-center rounded-md border border-primary bg-background px-2">
                            <Text className="text-center text-base text-secondary">{currentQuantity}</Text>
                          </Pressable>
                        </View>
                        <View style={{ width: tableColumns[3].width }} className="justify-center px-2 py-3">
                          <Pressable disabled={!canEditProductFieldForProduct(product, "entered")} onPress={() => openProductCellModal(product.id, "entered")} className="min-h-10 justify-center rounded-md border border-primary bg-background px-2">
                            <Text className="text-center text-base text-secondary">{product.isCounterProduct ? t("notAvailable") : enteredToday}</Text>
                          </Pressable>
                        </View>
                        <View style={{ width: tableColumns[4].width }} className="justify-center px-2 py-3">
                          <Pressable disabled={!canEditProductFieldForProduct(product, "end")} onPress={() => openProductCellModal(product.id, "end")} className="min-h-10 justify-center rounded-md border border-primary bg-background px-2">
                            <Text className={clsx("text-center text-base font-semibold", isLowQuantity ? "text-red-700" : "text-secondary")}>{endQuantity}</Text>
                          </Pressable>
                        </View>
                        <View style={{ width: tableColumns[5].width }} className="justify-center px-2 py-3">
                          <Text className="text-center text-base text-secondary">{soldToday}</Text>
                        </View>
                        <View style={{ width: tableColumns[6].width }} className="justify-center px-2 py-3">
                          <Text className="text-center text-base text-secondary">{formatMoney(product.price)}</Text>
                        </View>
                        <View style={{ width: tableColumns[7].width }} className="justify-center px-2 py-3">
                          <Text numberOfLines={1} className="text-center text-base font-semibold text-secondary_dark">{formatMoney(totalEarnings)}</Text>
                        </View>
                        </View>
                      </RevealOnScroll>
                    );
                  })}
                </View>
              ))}
            </AppCard>
          </ScrollView>
          </RevealOnScroll>
        ) : null}

        {!isLoading && financialItems.length > 0 ? (
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
                  <RevealOnScroll key={item.id} duration={560}>
                    <View className="gap-2 rounded-md border border-primary bg-white p-3">
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
        ) : null}

        <RevealOnScroll>
          <AppCard className="border-primary">
            <View className="gap-3">
              <AppInput label={t("inventoryDate")} value={inventoryDate} onChangeText={setInventoryDate} placeholder={formatDate(new Date())} />
              <View className="gap-2">
                <Text className="text-sm font-medium text-ink">{t("shift")}</Text>
                <View className="flex-row flex-wrap gap-2">
                  <SortChip isSelected={shift === "first"} label={t("firstShift")} onPress={() => setShift("first")} />
                  <SortChip isSelected={shift === "second"} label={t("secondShift")} onPress={() => setShift("second")} />
                </View>
              </View>
            </View>
          </AppCard>
        </RevealOnScroll>

        <RevealOnScroll>
          <AppCard className="border-secondary_dark bg-white">
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
            <AppButton label={t("finishInventoryManagement")} loading={isSaving} disabled={isSaving} onPress={openFinishConfirm} className="bg-secondary_dark" />
          </AppCard>
        </RevealOnScroll>
      </View>
      <AppModal visible={Boolean(productCellTarget)} onClose={closeProductCellModal}>
        <View className="gap-5">
          <View>
            <Text className="text-xl font-semibold text-secondary_dark">{t("editInventoryValue")}</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">{t("inventoryValueModalHint")}</Text>
          </View>
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <AppInput value={productCellDraft} onChangeText={(value) => setProductCellDraft(sanitizeInventoryExpression(value))} keyboardType="decimal-pad" placeholder="10+10" />
            </View>
            <Pressable accessibilityLabel={t("insertPlus")} onPress={appendProductCellPlus} className="h-12 w-12 items-center justify-center rounded-lg bg-secondary_dark">
              <Plus color="#ffffff" size={22} />
            </Pressable>
            <Pressable accessibilityLabel={t("insertMinus")} onPress={appendProductCellMinus} className="h-12 w-12 items-center justify-center rounded-lg bg-secondary_dark">
              <Minus color="#ffffff" size={22} />
            </Pressable>
          </View>
          <View className="gap-3">
            <AppButton label={t("saveChanges")} onPress={handleProductCellSave} className="bg-secondary_dark" />
            <AppButton label={t("cancel")} variant="secondary" onPress={closeProductCellModal} />
          </View>
        </View>
      </AppModal>
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

const styles = StyleSheet.create({
  lowStockImageOverlay: {
    bottom: 0,
    elevation: 2,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 2,
  },
});
