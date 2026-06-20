import { Text, View } from "react-native";

import { FinanceOptionChip } from "@/features/finance/components/FinanceOptionChip";
import { getFinanceBehaviorLabel, getFinanceTypeLabel } from "@/features/finance/domain/finance-labels";
import { CustomEntryFormState } from "@/features/finance/types/finance.types";
import { financialItemBehaviors, financialItemTypes } from "@/features/finance/types/financial-item.types";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/AppInput";
import { AppModal } from "@/shared/components/ui/AppModal";

type CustomFinancialEntryModalProps = {
  form: CustomEntryFormState;
  formatDate: (date: Date) => string;
  formatMoney: (value: number) => string;
  isSaving: boolean;
  onClose: () => void;
  onCreate: () => void;
  onFormChange: (form: CustomEntryFormState) => void;
  t: (key: string) => string;
  visible: boolean;
};

export function CustomFinancialEntryModal({ form, formatDate, formatMoney, isSaving, onClose, onCreate, onFormChange, t, visible }: CustomFinancialEntryModalProps) {
  return (
    <AppModal visible={visible} onClose={onClose}>
      <View className="gap-4">
        <View>
          <Text className="text-xl font-semibold text-secondary_dark">{t("customFinancialEntry")}</Text>
          <Text className="mt-1 text-sm text-muted">{t("customFinancialEntrySubtitle")}</Text>
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
        <AppInput label={t("name")} value={form.name} onChangeText={(name) => onFormChange({ ...form, name })} placeholder={t("customFinancialEntryNamePlaceholder")} autoCapitalize="words" />
        <View className="flex-row gap-2">
          <View className="flex-1">
            <AppInput label={t("date")} value={form.date} onChangeText={(date) => onFormChange({ ...form, date })} placeholder={formatDate(new Date())} />
          </View>
          <View className="flex-1">
            <AppInput label={t("pdfAmount")} value={form.amount} onChangeText={(amount) => onFormChange({ ...form, amount: amount.replace(/[^\d.,]/g, "") })} keyboardType="decimal-pad" placeholder={formatMoney(0)} />
          </View>
        </View>
        <AppInput label={t("explanation")} value={form.explanation} onChangeText={(explanation) => onFormChange({ ...form, explanation })} multiline />
        <View className="gap-3">
          <AppButton label={t("create")} loading={isSaving} onPress={onCreate} className="bg-secondary_dark" />
          <AppButton label={t("cancel")} variant="secondary" onPress={onClose} />
        </View>
      </View>
    </AppModal>
  );
}
