import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { FolderTree, Ruler, Tags, Trash2 } from "lucide-react-native";

import { createCatalogItem, deleteCatalogItem, listCatalogItems } from "@/features/products/services/catalog.service";
import { CatalogItem, TaxonomyKind, UnitQuantityType } from "@/features/products/types/product.types";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppInput } from "@/shared/components/ui/AppInput";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { LoadingState } from "@/shared/components/ui/LoadingState";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useProtectedRoute } from "@/shared/hooks/useProtectedRoute";
import { useI18n } from "@/shared/i18n/useI18n";

type TaxonomyManagementScreenProps = { kind: TaxonomyKind };

const metaByKind = {
  attributes: {
    Icon: Tags,
    emptyMessageKey: "attributesEmptyMessage",
    emptyTitleKey: "attributesEmptyTitle",
    examplesKey: "attributesExamples",
    titleKey: "attributes",
  },
  categories: {
    Icon: FolderTree,
    emptyMessageKey: "categoriesEmptyMessage",
    emptyTitleKey: "categoriesEmptyTitle",
    examplesKey: "categoriesExamples",
    titleKey: "categories",
  },
  units: {
    Icon: Ruler,
    emptyMessageKey: "unitsEmptyMessage",
    emptyTitleKey: "unitsEmptyTitle",
    examplesKey: "unitsExamples",
    titleKey: "units",
  },
} as const;

export function TaxonomyManagementScreen({ kind }: TaxonomyManagementScreenProps) {
  const { session } = useProtectedRoute();
  const toast = useAppToast();
  const { t } = useI18n();
  const meta = metaByKind[kind];
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [name, setName] = useState("");
  const [unitQuantityType, setUnitQuantityType] = useState<UnitQuantityType>("whole");
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = session?.user.role === "admin";

  const getCatalogErrorMessage = (error: unknown): string | undefined => {
    if (!(error instanceof Error)) return undefined;
    if (error.message === "CATALOG_DUPLICATE_NAME") return t("catalogDuplicateName");
    if (error.message === "CATALOG_ITEM_IN_USE") return t("catalogItemUsedMessage");
    return error.message;
  };

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setItems(await listCatalogItems(kind));
    } catch (error) {
      toast.error(t("databaseLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [kind]);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );

  const handleCreate = async () => {
    if (!isAdmin) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t("catalogNameRequired"));
      return;
    }

    try {
      setIsSaving(true);
      await createCatalogItem(kind, trimmedName, kind === "units" ? { quantityType: unitQuantityType } : undefined);
      setName("");
      setUnitQuantityType("whole");
      toast.success(t("catalogItemSaved"));
      await loadItems();
    } catch (error) {
      toast.error(t("catalogItemSaveFailed"), getCatalogErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !deleteTarget) return;
    try {
      await deleteCatalogItem(kind, deleteTarget.id);
      setDeleteTarget(null);
      toast.success(t("catalogItemDeleted"));
      await loadItems();
    } catch (error) {
      toast.error(t("catalogItemDeleteFailed"), getCatalogErrorMessage(error));
    }
  };
  const Icon = meta.Icon;
  const quantityTypes: UnitQuantityType[] = ["whole", "decimal"];

  return (
    <Screen icon={<Icon color={colors.secondaryDark} size={36} />} title={t(meta.titleKey)} subtitle={t(meta.examplesKey)} showBackButton>
      <View className="gap-4">
        {!isAdmin ? <Text className="rounded-md border border-primary bg-white p-3 text-sm text-muted">{t("readOnlyCatalogMessage")}</Text> : null}

        {isAdmin ? (
          <RevealOnScroll>
          <AppCard>
            <AppInput label={t("name")} value={name} onChangeText={setName} autoCapitalize="words" />
            {kind === "units" ? (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-secondary_dark">{t("unitNumberType")}</Text>
                <View className="flex-row gap-2">
                  {quantityTypes.map((quantityType) => (
                    <Pressable
                      key={quantityType}
                      accessibilityRole="button"
                      onPress={() => setUnitQuantityType(quantityType)}
                      className={`flex-1 rounded-md border px-3 py-3 ${unitQuantityType === quantityType ? "border-orange bg-primary" : "border-primary bg-white"}`}
                    >
                      <Text className="text-center font-semibold text-secondary_dark">{quantityType === "whole" ? t("wholeNumbers") : t("decimalNumbers")}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            <AppButton label={t("create")} loading={isSaving} onPress={handleCreate} className="bg-secondary_dark" />
          </AppCard>
          </RevealOnScroll>
        ) : null}

        {isLoading ? <LoadingState label={t("loading")} /> : null}

        {!isLoading && items.length === 0 ? (
          <RevealOnScroll>
            <AppCard>
              <EmptyState title={t(meta.emptyTitleKey)} message={t(meta.emptyMessageKey)} />
            </AppCard>
          </RevealOnScroll>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <View className="gap-3">
            {items.map((item) => (
              <RevealOnScroll key={item.id} duration={560}>
                <AppCard className="border-primary">
                  <View className="min-h-10 flex-row items-center justify-between gap-3">
                    <Text className="flex-1 text-base font-semibold text-secondary_dark">{item.name}</Text>
                    {kind === "units" ? <Text className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-secondary_dark">{item.quantityType === "whole" ? t("wholeNumbers") : t("decimalNumbers")}</Text> : null}
                    {isAdmin ? (
                      <Pressable accessibilityRole="button" onPress={() => setDeleteTarget(item)} className="h-10 w-10 items-center justify-center rounded-md bg-red-600">
                        <Trash2 color="#ffffff" size={18} />
                      </Pressable>
                    ) : null}
                  </View>
                </AppCard>
              </RevealOnScroll>
            ))}
          </View>
        ) : null}
      </View>
      <ConfirmDialog destructive visible={Boolean(deleteTarget)} title={t("deleteCatalogItemTitle")} message={t("deleteCatalogItemMessage")} cancelLabel={t("cancel")} confirmLabel={t("delete")} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </Screen>
  );
}
