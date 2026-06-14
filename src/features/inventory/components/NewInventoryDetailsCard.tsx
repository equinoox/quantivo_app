import { Text, View } from "react-native";

import { InventoryShift } from "@/features/inventory/lib/inventory-calculations";
import { InventorySortChip } from "@/features/inventory/components/InventorySortChip";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppInput } from "@/shared/components/ui/AppInput";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";

type NewInventoryDetailsCardProps = {
  datePlaceholder: string;
  inventoryDate: string;
  onChangeDate: (value: string) => void;
  onChangeShift: (shift: InventoryShift) => void;
  shift: InventoryShift | null;
  t: (key: string) => string;
};

export function NewInventoryDetailsCard({ datePlaceholder, inventoryDate, onChangeDate, onChangeShift, shift, t }: NewInventoryDetailsCardProps) {
  return (
    <RevealOnScroll>
      <AppCard className="border-primary">
        <View className="gap-3">
          <AppInput label={t("inventoryDate")} value={inventoryDate} onChangeText={onChangeDate} placeholder={datePlaceholder} />
          <View className="gap-2">
            <Text className="text-sm font-medium text-ink">{t("shift")}</Text>
            <View className="flex-row flex-wrap gap-2">
              <InventorySortChip isSelected={shift === "first"} label={t("firstShift")} onPress={() => onChangeShift("first")} />
              <InventorySortChip isSelected={shift === "second"} label={t("secondShift")} onPress={() => onChangeShift("second")} />
            </View>
          </View>
        </View>
      </AppCard>
    </RevealOnScroll>
  );
}
