import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import clsx from "clsx";
import { AlertTriangle, ImageIcon } from "lucide-react-native";

import { calculateSoldValue, EditableProductField, parseInventoryFieldValue } from "@/features/inventory/lib/inventory-calculations";
import { Product } from "@/features/products/types/product.types";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { colors } from "@/shared/constants/colors";

const tableColumns = [
  { key: "picture", width: 68 },
  { key: "name", width: 136 },
  { key: "quantity", width: 80 },
  { key: "entered", width: 76 },
  { key: "end", width: 66 },
  { key: "sold", width: 66 },
  { key: "price", width: 100 },
  { key: "totalEarnings", width: 142 },
] as const;

const tableWidth = tableColumns.reduce((total, column) => total + column.width, 0);

type NewInventoryProductTableProps = {
  canEditProductFieldForProduct: (product: Product, field: EditableProductField) => boolean;
  formatMoney: (value: number) => string;
  getProductInventoryValue: (product: Product, field: EditableProductField) => string;
  groupedProducts: Array<{ groupName: string; products: Product[] }>;
  isReadOnly?: boolean;
  onOpenCell: (productId: string, field: EditableProductField) => void;
  showLowStockWarning?: boolean;
  withReveal?: boolean;
  t: (key: string) => string;
};

export function NewInventoryProductTable({ canEditProductFieldForProduct, formatMoney, getProductInventoryValue, groupedProducts, isReadOnly = false, onOpenCell, showLowStockWarning = false, withReveal = true, t }: NewInventoryProductTableProps) {
  if (showLowStockWarning) {
    return (
      <RevealOnScroll>
        <View className="flex-row items-center gap-2 px-1">
          <AlertTriangle color="#dc2626" size={22} />
          <Text className="flex-1 text-base font-semibold text-red-800">{t("lowStockWarning")}</Text>
        </View>
      </RevealOnScroll>
    );
  }

  const table = (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View className="overflow-hidden rounded-md border border-secondary_dark" style={{ width: tableWidth + 2 }}>
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
              <Text className="text-base font-semibold text-secondary_dark">{group.groupName}</Text>
            </View>
            {group.products.map((product, productIndex) => {
              const isLastRow = groupIndex === groupedProducts.length - 1 && productIndex === group.products.length - 1;
              const enteredToday = parseInventoryFieldValue(getProductInventoryValue(product, "entered"), 0);
              const currentQuantity = parseInventoryFieldValue(getProductInventoryValue(product, "quantity"), product.quantityOnHand);
              const endQuantity = parseInventoryFieldValue(getProductInventoryValue(product, "end"), product.quantityOnHand);
              const soldToday = calculateSoldValue({ end: endQuantity, entered: enteredToday, isCounterProduct: product.isCounterProduct, quantity: currentQuantity });
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
                      <Pressable disabled={isReadOnly || !canEditProductFieldForProduct(product, "quantity")} onPress={() => onOpenCell(product.id, "quantity")} className={clsx("min-h-10 justify-center rounded-md border border-primary px-2", isReadOnly ? "bg-white" : "bg-background")}>
                        <Text className="text-center text-base text-secondary">{currentQuantity}</Text>
                      </Pressable>
                    </View>
                    <View style={{ width: tableColumns[3].width }} className="justify-center px-2 py-3">
                      <Pressable disabled={isReadOnly || !canEditProductFieldForProduct(product, "entered")} onPress={() => onOpenCell(product.id, "entered")} className={clsx("min-h-10 justify-center rounded-md border border-primary px-2", isReadOnly ? "bg-white" : "bg-background")}>
                        <Text className="text-center text-base text-secondary">{product.isCounterProduct ? t("notAvailable") : enteredToday}</Text>
                      </Pressable>
                    </View>
                    <View style={{ width: tableColumns[4].width }} className="justify-center px-2 py-3">
                      <Pressable disabled={isReadOnly || !canEditProductFieldForProduct(product, "end")} onPress={() => onOpenCell(product.id, "end")} className={clsx("min-h-10 justify-center rounded-md border border-primary px-2", isReadOnly ? "bg-white" : "bg-background")}>
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
      </View>
    </ScrollView>
  );

  if (!withReveal) return table;

  return (
    <RevealOnScroll>
      {table}
    </RevealOnScroll>
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
