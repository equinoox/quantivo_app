import { Pressable, Text, View } from "react-native";
import clsx from "clsx";
import { Check, Trash2 } from "lucide-react-native";

import { FinanceOptionChip } from "@/features/finance/components/FinanceOptionChip";
import { getFinanceBehaviorLabel, getFinanceTypeLabel } from "@/features/finance/domain/finance-labels";
import { FinancialItemFormState } from "@/features/finance/types/finance.types";
import { FinancialItem, financialItemBehaviors, financialItemTypes } from "@/features/finance/types/financial-item.types";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/AppInput";
import { AppModal } from "@/shared/components/ui/AppModal";
import { colors } from "@/shared/constants/colors";

type FinancialItemModalProps = {
  financialItems: FinancialItem[];
  form: FinancialItemFormState;
  isSaving: boolean;
  onClose: () => void;
  onCreate: () => void;
  onDeletePress: (item: FinancialItem) => void;
  onFormChange: (form: FinancialItemFormState) => void;
  t: (key: string) => string;
  visible: boolean;
};

export function FinancialItemModal({ financialItems, form, isSaving, onClose, onCreate, onDeletePress, onFormChange, t, visible }: FinancialItemModalProps) {
  return (
    <AppModal visible={visible} onClose={onClose}>
      <View className="gap-4">
        <View>
          <Text className="text-xl font-semibold text-secondary_dark">{t("createFinancialItem")}</Text>
          <Text className="mt-1 text-sm text-muted">{t("revenuesExpensesManagementSubtitle")}</Text>
        </View>
        <View className="gap-2">
          <Text className="text-sm font-medium text-ink">{t("type")}</Text>
          <View className="flex-row flex-wrap gap-2">
            {financialItemTypes.map((type) => <FinanceOptionChip key={type} isSelected={form.type === type} label={getFinanceTypeLabel(type, t)} onPress={() => onFormChange({ ...form, type })} />)}
          </View>
        </View>
        <View className="gap-2">
          <Text className="text-sm font-medium text-ink">{t("behavior")}</Text>
          <View className="flex-row flex-wrap gap-2">
            {financialItemBehaviors.map((behavior) => <FinanceOptionChip key={behavior} isSelected={form.behavior === behavior} label={getFinanceBehaviorLabel(behavior, t)} onPress={() => onFormChange({ ...form, behavior })} />)}
          </View>
        </View>
        <AppInput label={t("name")} value={form.name} onChangeText={(name) => onFormChange({ ...form, name })} placeholder={t("financialItemNamePlaceholder")} autoCapitalize="words" />
        <Pressable onPress={() => onFormChange({ ...form, requiresExplanation: !form.requiresExplanation })} className="flex-row items-center gap-3 rounded-md border border-primary bg-white p-3">
          <View className={clsx("h-6 w-6 items-center justify-center rounded border", form.requiresExplanation ? "border-orange bg-orange" : "border-primary bg-white")}>
            {form.requiresExplanation ? <Check color={colors.secondaryDark} size={16} strokeWidth={3} /> : null}
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-semibold text-secondary_dark">{t("explanation")}</Text>
            <Text className="text-sm leading-5 text-muted">{t("explanationFinancialItemHint")}</Text>
          </View>
        </Pressable>
        {financialItems.length > 0 ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-secondary_dark">{t("activeFinancialItems")}</Text>
            {financialItems.map((item) => (
              <View key={item.id} className="flex-row items-center gap-2 rounded-md border border-primary bg-white px-3 py-2">
                <Text className="min-w-0 flex-1 font-semibold text-secondary_dark">{item.name}</Text>
                <Text className="text-sm text-muted">{getFinanceTypeLabel(item.type, t)}</Text>
                <Pressable accessibilityRole="button" onPress={() => onDeletePress(item)} className="h-9 w-9 items-center justify-center rounded-md bg-red-600">
                  <Trash2 color="#ffffff" size={16} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        <View className="gap-3">
          <AppButton label={t("create")} loading={isSaving} onPress={onCreate} className="bg-secondary_dark" />
          <AppButton label={t("cancel")} variant="secondary" onPress={onClose} />
        </View>
      </View>
    </AppModal>
  );
}
