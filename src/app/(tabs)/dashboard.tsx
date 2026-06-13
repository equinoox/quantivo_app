import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import clsx from "clsx";
import { AlertTriangle, ImageIcon, LayoutDashboard } from "lucide-react-native";

import { listProducts } from "@/features/products/services/products.service";
import { Product } from "@/features/products/types/product.types";
import { AppCard } from "@/shared/components/ui/AppCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { LoadingState } from "@/shared/components/ui/LoadingState";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";
import { useI18n } from "@/shared/i18n/useI18n";

type InventoryGrouping = "category" | "unit";

const tableColumns = [
  { key: "picture", width: 76 },
  { key: "name", width: 150 },
  { key: "entered", width: 82 },
  { key: "quantity", width: 88 },
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

export default function DashboardScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const { formatMoney } = useAppFormatters();
  const [products, setProducts] = useState<Product[]>([]);
  const [grouping, setGrouping] = useState<InventoryGrouping>("category");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setProducts(await listProducts());
    } catch (error) {
      toast.error(t("productsLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboardProducts();
    }, [loadDashboardProducts]),
  );

  const groupedProducts = useMemo(() => {
    const sortedProducts = [...products].sort((left, right) => {
      const leftGroup = grouping === "category" ? left.categoryName : left.unitName;
      const rightGroup = grouping === "category" ? right.categoryName : right.unitName;
      const groupCompare = leftGroup.localeCompare(rightGroup);
      if (groupCompare !== 0) return groupCompare;
      return left.position - right.position;
    });

    return sortedProducts.reduce<Array<{ groupName: string; products: Product[] }>>((groups, product) => {
      const groupName = (grouping === "category" ? product.categoryName : product.unitName) || t("uncategorized");
      const group = groups.find((item) => item.groupName === groupName);
      if (group) group.products.push(product);
      else groups.push({ groupName, products: [product] });
      return groups;
    }, []);
  }, [grouping, products, t]);

  const hasLowStockProducts = useMemo(() => {
    // TODO: Replace placeholder end quantity with the real ending inventory count when inventory management is implemented.
    const placeholderEndQuantity = 0;
    return products.some((product) => placeholderEndQuantity < product.minimumQuantityAlert);
  }, [products]);

  return (
    <Screen icon={<LayoutDashboard color={colors.secondaryDark} size={36} />} title={t("dashboard")} subtitle={t("dashboardSubtitle")}>
      <View className="gap-4">
        <View className="items-center">
          <View className="flex-row flex-wrap justify-center gap-2">
            <SortChip isSelected={grouping === "unit"} label={t("sortByUnit")} onPress={() => setGrouping("unit")} />
            <SortChip isSelected={grouping === "category"} label={t("sortByCategory")} onPress={() => setGrouping("category")} />
          </View>
        </View>

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

        {!isLoading && products.length > 0 ? (
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
                  <View className="border-t border-primary bg-primary/70 px-3 py-2">
                    <Text className="text-base font-semibold text-secondary_dark">{group.groupName}</Text>
                  </View>
                  {group.products.map((product, productIndex) => {
                    const isLastRow = groupIndex === groupedProducts.length - 1 && productIndex === group.products.length - 1;
                    // TODO: Connect entered/quantity/end to inventory services. Respect product.unitQuantityType for whole vs decimal unit entry.
                    const enteredToday = 0;
                    const currentQuantity = 0;
                    const endQuantity = 0;
                    const soldToday = enteredToday + currentQuantity - endQuantity;
                    const totalEarnings = product.price * soldToday;
                    const isLowQuantity = endQuantity < product.minimumQuantityAlert;

                    return (
                      <View key={product.id} className={clsx("flex-row items-center bg-white", !isLastRow && "border-b border-primary")}>
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
                          <Text className="text-base font-semibold text-secondary_dark">{product.name}</Text>
                        </View>
                        <View style={{ width: tableColumns[2].width }} className="justify-center px-2 py-3">
                          <Text className="text-center text-base text-secondary">{enteredToday}</Text>
                        </View>
                        <View style={{ width: tableColumns[3].width }} className="justify-center px-2 py-3">
                          <Text className="text-center text-base text-secondary">{currentQuantity}</Text>
                        </View>
                        <View style={{ width: tableColumns[4].width }} className="justify-center px-2 py-3">
                          <Text className={clsx("text-center text-base font-semibold", isLowQuantity ? "text-red-700" : "text-secondary")}>{endQuantity}</Text>
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
                    );
                  })}
                </View>
              ))}
            </AppCard>
          </ScrollView>
        ) : null}
      </View>
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
