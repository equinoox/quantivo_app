import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Minus, Package, Plus } from "lucide-react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { NewInventoryProductTable } from "@/features/inventory/components/NewInventoryProductTable";
import { useNewInventoryDraftStore } from "@/features/inventory/hooks/useNewInventoryDraftStore";
import { EditableProductField, getInitialProductInventoryValues, parseInventoryFieldValue, sanitizeInventoryExpression } from "@/features/inventory/lib/inventory-calculations";
import { createInventoryFieldChangeNotification } from "@/features/notifications/services/notifications.service";
import { listProducts } from "@/features/products/services/products.service";
import { Product } from "@/features/products/types/product.types";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppInput } from "@/shared/components/ui/AppInput";
import { AppModal } from "@/shared/components/ui/AppModal";
import { LoadingState } from "@/shared/components/ui/LoadingState";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";
import { useI18n } from "@/shared/i18n/useI18n";

type ProductCellTarget = { productId: string; field: EditableProductField } | null;

function SortChip({ isSelected, label, onPress }: { isSelected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`min-h-10 justify-center rounded-md border px-3 ${isSelected ? "border-orange bg-primary" : "border-primary bg-white"}`}>
      <Text className="font-semibold text-secondary_dark">{label}</Text>
    </Pressable>
  );
}

export function NewInventoryProductsScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const session = useAuthStore((state) => state.session);
  const { formatMoney } = useAppFormatters();
  const grouping = useNewInventoryDraftStore((state) => state.grouping);
  const productInventoryInputs = useNewInventoryDraftStore((state) => state.productInventoryInputs);
  const products = useNewInventoryDraftStore((state) => state.products);
  const setGrouping = useNewInventoryDraftStore((state) => state.setGrouping);
  const setProducts = useNewInventoryDraftStore((state) => state.setProducts);
  const updateProductInventoryField = useNewInventoryDraftStore((state) => state.updateProductInventoryField);
  const [productCellTarget, setProductCellTarget] = useState<ProductCellTarget>(null);
  const [productCellDraft, setProductCellDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isAdmin = session?.user.role === "admin";
  const isManager = session?.user.role === "manager";
  const shouldLogInventoryAction = session?.user.role === "worker" || session?.user.role === "manager";

  const loadProducts = useCallback(async () => {
    if (products.length > 0) return;
    try {
      setIsLoading(true);
      setProducts(await listProducts());
    } catch (error) {
      toast.error(t("productsLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [products.length, setProducts, t, toast]);

  useFocusEffect(
    useCallback(() => {
      void loadProducts();
    }, [loadProducts]),
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

  const getProductInventoryValue = (product: Product, field: EditableProductField) => productInventoryInputs[product.id]?.[field] ?? getInitialProductInventoryValues(product)[field];

  const canEditProductField = (field: EditableProductField) => {
    if (isAdmin || isManager) return true;
    return field === "entered" || field === "end";
  };

  const canEditProductFieldForProduct = (product: Product, field: EditableProductField) => {
    if (product.isCounterProduct && field === "entered") return false;
    return canEditProductField(field);
  };

  const openProductCellModal = (productId: string, field: EditableProductField) => {
    const product = products.find((item) => item.id === productId);
    if (!product || !canEditProductFieldForProduct(product, field)) return;
    setProductCellTarget({ field, productId });
    setProductCellDraft(getProductInventoryValue(product, field));
  };

  const closeProductCellModal = () => {
    setProductCellTarget(null);
    setProductCellDraft("");
  };

  const appendProductCellPlus = () => setProductCellDraft((current) => `${current}+`);
  const appendProductCellMinus = () => setProductCellDraft((current) => `${current}-`);

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
    updateProductInventoryField(product.id, productCellTarget.field, savedValue);
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

  return (
    <Screen>
      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3 rounded-md border border-primary bg-white px-3 py-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Package color={colors.secondaryDark} size={20} />
            <Text numberOfLines={1} className="text-base font-semibold text-secondary_dark">{t("editProductStock")}</Text>
          </View>
          <View className="w-28">
            <AppButton label={t("done")} onPress={() => router.back()} className="bg-secondary_dark" />
          </View>
        </View>

        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <View className="flex-row flex-wrap gap-2">
            <SortChip isSelected={grouping === "unit"} label={t("sortByUnit")} onPress={() => setGrouping("unit")} />
            <SortChip isSelected={grouping === "category"} label={t("sortByCategory")} onPress={() => setGrouping("category")} />
          </View>
        </View>

        {isLoading ? <LoadingState label={t("loadingProducts")} /> : null}

        {!isLoading ? (
          <AppCard className="border-secondary_dark bg-white">
            <NewInventoryProductTable
              canEditProductFieldForProduct={canEditProductFieldForProduct}
              formatMoney={formatMoney}
              getProductInventoryValue={getProductInventoryValue}
              groupedProducts={groupedProducts}
              onOpenCell={openProductCellModal}
              t={t}
              withReveal={false}
            />
          </AppCard>
        ) : null}
      </View>

      <AppModal visible={Boolean(productCellTarget)} layout="landscape" onClose={closeProductCellModal}>
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
    </Screen>
  );
}
