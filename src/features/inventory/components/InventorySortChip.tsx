import { Pressable, Text } from "react-native";
import clsx from "clsx";

export function InventorySortChip({ isSelected, label, onPress }: { isSelected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("min-h-10 justify-center rounded-md border px-3", isSelected ? "border-orange bg-primary" : "border-primary bg-white")}>
      <Text className="font-semibold text-secondary_dark">{label}</Text>
    </Pressable>
  );
}
