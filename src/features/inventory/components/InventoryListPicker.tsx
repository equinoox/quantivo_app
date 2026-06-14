import { Pressable, ScrollView, Text, View } from "react-native";
import clsx from "clsx";
import { ChevronDown } from "lucide-react-native";

import { InventoryListSummary } from "@/features/inventory/types/inventory.types";
import { AppCard } from "@/shared/components/ui/AppCard";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { colors } from "@/shared/constants/colors";

type InventoryListPickerProps = {
  formatMoney: (value: number) => string;
  getShiftLabel: (shift: InventoryListSummary["shift"]) => string;
  isOpen: boolean;
  lists: InventoryListSummary[];
  onSelect: (listId: string) => void;
  onToggle: () => void;
  selectedListId: string;
  selectedSummary?: InventoryListSummary;
  t: (key: string) => string;
};

export function InventoryListPicker({ formatMoney, getShiftLabel, isOpen, lists, onSelect, onToggle, selectedListId, selectedSummary, t }: InventoryListPickerProps) {
  return (
    <RevealOnScroll>
      <AppCard className="border-primary">
        <Text className="text-lg font-semibold text-secondary_dark">{t("chooseInventoryList")}</Text>
        <Pressable onPress={onToggle} className="min-h-12 flex-row items-center justify-between gap-3 rounded-md border border-primary bg-white px-3">
          <Text className={clsx("flex-1 font-semibold", selectedSummary ? "text-secondary_dark" : "text-muted")}>
            {selectedSummary ? `${selectedSummary.date} | ${getShiftLabel(selectedSummary.shift)} | ${selectedSummary.createdByUserName}` : t("selectInventoryList")}
          </Text>
          <ChevronDown color={colors.secondaryDark} size={20} />
        </Pressable>
        {isOpen ? (
          <View style={{ maxHeight: 280 }} className="overflow-hidden rounded-md border border-primary bg-white">
            <ScrollView nestedScrollEnabled>
              <Pressable onPress={() => onSelect("")} className={clsx("border-b border-primary px-3 py-3", !selectedListId && "bg-primary")}>
                <Text className="font-semibold text-secondary_dark">{t("noneSelected")}</Text>
              </Pressable>
              {lists.map((list) => (
                <Pressable key={list.id} onPress={() => onSelect(list.id)} className={clsx("border-b border-primary px-3 py-3", selectedListId === list.id && "bg-primary")}>
                  <Text className="font-semibold text-secondary_dark">{list.date} | {getShiftLabel(list.shift)} | {list.createdByUserName}</Text>
                  <Text className="mt-1 text-xs text-muted">{t("totalEarn")}: {formatMoney(list.totalEarn)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </AppCard>
    </RevealOnScroll>
  );
}
