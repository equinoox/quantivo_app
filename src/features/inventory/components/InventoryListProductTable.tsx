import { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import clsx from "clsx";

import { InventorySortChip } from "@/features/inventory/components/InventorySortChip";
import { ProductField } from "@/features/inventory/lib/inventory-calculations";
import { InventoryListProductDetail } from "@/features/inventory/types/inventory.types";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";

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

type InventoryListProductTableProps = {
  formatMoney: (value: number) => string;
  formatQuantity: (value: number) => string;
  groupedProducts: Array<{ groupName: string; products: InventoryListProductDetail[] }>;
  grouping: "unit" | "category";
  isEditing: boolean;
  onChangeGrouping: (grouping: "unit" | "category") => void;
  onOpenNumber: (row: InventoryListProductDetail, field: ProductField) => void;
  renderNumberCell: (value: number, expression: string, onPress?: () => void) => ReactNode;
  t: (key: string) => string;
};

export function InventoryListProductTable({ formatMoney, formatQuantity, groupedProducts, grouping, isEditing, onChangeGrouping, onOpenNumber, renderNumberCell, t }: InventoryListProductTableProps) {
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <Text className="text-lg font-semibold text-secondary_dark">{t("products")}</Text>
        <View className="flex-row flex-wrap gap-2">
          <InventorySortChip isSelected={grouping === "unit"} label={t("sortByUnit")} onPress={() => onChangeGrouping("unit")} />
          <InventorySortChip isSelected={grouping === "category"} label={t("sortByCategory")} onPress={() => onChangeGrouping("category")} />
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
                      {renderNumberCell(product.kolicina, product.kolicinaExpression, isEditing ? () => onOpenNumber(product, "kolicina") : undefined)}
                    </View>
                    <View style={{ width: productColumns[2].width }} className="justify-center px-2 py-3">
                      {product.isCounterProduct ? <Text className="text-center text-base font-semibold text-secondary_dark">{t("notAvailable")}</Text> : renderNumberCell(product.uneto, product.unetoExpression, isEditing ? () => onOpenNumber(product, "uneto") : undefined)}
                    </View>
                    <View style={{ width: productColumns[3].width }} className="justify-center px-2 py-3">
                      {renderNumberCell(product.kraj, product.krajExpression, isEditing ? () => onOpenNumber(product, "kraj") : undefined)}
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
  );
}
