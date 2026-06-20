import { Pressable, Text } from "react-native";
import clsx from "clsx";

type FinanceOptionChipProps = {
  isSelected: boolean;
  label: string;
  onPress: () => void;
};

export function FinanceOptionChip({ isSelected, label, onPress }: FinanceOptionChipProps) {
  return (
    <Pressable onPress={onPress} className={clsx("min-h-10 justify-center rounded-md border px-3", isSelected ? "border-orange bg-primary" : "border-primary bg-white")}>
      <Text className="font-semibold text-secondary_dark">{label}</Text>
    </Pressable>
  );
}
