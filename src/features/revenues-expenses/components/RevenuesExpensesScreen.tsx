import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import clsx from "clsx";
import { Check, ReceiptText, Trash2 } from "lucide-react-native";

import { createFinancialItem, deleteFinancialItem, listFinancialItems } from "@/features/revenues-expenses/services/financial-items.service";
import { FinancialItem, financialItemBehaviors, FinancialItemBehavior, financialItemTypes, FinancialItemType } from "@/features/revenues-expenses/types/financial-item.types";
import { createFinancialItemSchema } from "@/features/revenues-expenses/validation";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppInput } from "@/shared/components/ui/AppInput";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { LoadingState } from "@/shared/components/ui/LoadingState";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { colors } from "@/shared/constants/colors";
import type { UserRole } from "@/shared/constants/roles";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

type FinancialItemFormState = {
  type: FinancialItemType;
  behavior: FinancialItemBehavior;
  name: string;
  requiresExplanation: boolean;
};

const emptyForm: FinancialItemFormState = {
  type: "expense",
  behavior: "fixed",
  name: "",
  requiresExplanation: false,
};

function OptionChip({ isSelected, label, onPress }: { isSelected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("min-h-10 justify-center rounded-md border px-3", isSelected ? "border-orange bg-primary" : "border-primary bg-white")}>
      <Text className="font-semibold text-secondary_dark">{label}</Text>
    </Pressable>
  );
}

function getTypeLabel(type: FinancialItemType, t: (key: string) => string): string {
  return type === "expense" ? t("expense") : t("revenue");
}

function getBehaviorLabel(behavior: FinancialItemBehavior, t: (key: string) => string): string {
  return behavior === "fixed" ? t("fixed") : t("variable");
}

const allowedRoles: UserRole[] = ["admin", "manager"];

export function RevenuesExpensesScreen() {
  const session = useAuthStore((state) => state.session);
  const toast = useAppToast();
  const { t } = useI18n();
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [form, setForm] = useState<FinancialItemFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<FinancialItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const canManageFinancialItems = session ? allowedRoles.includes(session.user.role) : false;

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setItems(await listFinancialItems());
    } catch (error) {
      toast.error(t("databaseLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!canManageFinancialItems) return;
    void loadItems();
  }, [canManageFinancialItems]);

  const handleCreate = async () => {
    const parsed = createFinancialItemSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("financialItemValidationError"));
      return;
    }

    try {
      setIsSaving(true);
      await createFinancialItem(parsed.data);
      // TODO: Add edit action later if needed.
      setForm(emptyForm);
      toast.success(t("financialItemSaved"));
      await loadItems();
    } catch (error) {
      toast.error(t("financialItemSaveFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFinancialItem(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      toast.success(t("financialItemDeleted"));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(t("financialItemDeleteFailed"), error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <Screen icon={<ReceiptText color={colors.secondaryDark} size={36} />} title={t("revenuesExpensesManagement")} subtitle={t("revenuesExpensesManagementSubtitle")} showBackButton>
      <View className="gap-4">
        <RevealOnScroll>
        <AppCard className="border-primary">
          <View>
            <Text className="text-lg font-semibold text-secondary_dark">{t("createFinancialItem")}</Text>
            <Text className="mt-1 text-sm text-muted">{t("revenuesExpensesManagementSubtitle")}</Text>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-ink">{t("type")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {financialItemTypes.map((type) => <OptionChip key={type} isSelected={form.type === type} label={getTypeLabel(type, t)} onPress={() => setForm((current) => ({ ...current, type }))} />)}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-ink">{t("behavior")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {financialItemBehaviors.map((behavior) => <OptionChip key={behavior} isSelected={form.behavior === behavior} label={getBehaviorLabel(behavior, t)} onPress={() => setForm((current) => ({ ...current, behavior }))} />)}
            </View>
          </View>

          <AppInput label={t("name")} value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder={t("financialItemNamePlaceholder")} autoCapitalize="words" />
          <Pressable onPress={() => setForm((current) => ({ ...current, requiresExplanation: !current.requiresExplanation }))} className="flex-row items-center gap-3 rounded-md border border-primary bg-white p-3">
            <View className={clsx("h-6 w-6 items-center justify-center rounded border", form.requiresExplanation ? "border-orange bg-orange" : "border-primary bg-white")}>
              {form.requiresExplanation ? <Check color={colors.secondaryDark} size={16} strokeWidth={3} /> : null}
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-semibold text-secondary_dark">{t("explanation")}</Text>
              <Text className="text-sm leading-5 text-muted">{t("explanationFinancialItemHint")}</Text>
            </View>
          </Pressable>
          <AppButton label={t("create")} loading={isSaving} onPress={handleCreate} className="bg-secondary_dark" />
        </AppCard>
        </RevealOnScroll>

        {isLoading ? <LoadingState label={t("loading")} /> : null}

        {!isLoading && items.length === 0 ? (
          <RevealOnScroll>
            <AppCard>
              <EmptyState title={t("financialItemsEmptyTitle")} message={t("financialItemsEmptyMessage")} />
            </AppCard>
          </RevealOnScroll>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <View className="gap-3">
            {items.map((item) => (
              <RevealOnScroll key={item.id} duration={560}>
                <AppCard className="border-primary">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text className="text-lg font-semibold text-secondary_dark">{item.name}</Text>
                      <Text className="mt-1 text-sm text-muted">{getTypeLabel(item.type, t)} / {getBehaviorLabel(item.behavior, t)}{item.requiresExplanation ? ` / ${t("explanation")}` : ""}</Text>
                    </View>
                    <Pressable accessibilityRole="button" onPress={() => setDeleteTarget(item)} className="h-10 w-10 items-center justify-center rounded-md bg-red-600">
                      <Trash2 color="#ffffff" size={18} />
                    </Pressable>
                  </View>
                </AppCard>
              </RevealOnScroll>
            ))}
          </View>
        ) : null}
      </View>

      <ConfirmDialog destructive visible={Boolean(deleteTarget)} title={t("deleteFinancialItemTitle")} message={t("deleteFinancialItemMessage")} cancelLabel={t("cancel")} confirmLabel={t("delete")} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </Screen>
  );
}
