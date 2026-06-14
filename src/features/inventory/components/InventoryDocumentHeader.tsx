import { Text, View } from "react-native";

import { InventoryListDetail } from "@/features/inventory/types/inventory.types";
import { AppButton } from "@/shared/components/ui/AppButton";

type InventoryDocumentHeaderProps = {
  formatDateTime: (value: string | Date) => string;
  getShiftLabel: (shift: InventoryListDetail["shift"]) => string;
  isAdmin: boolean;
  isDeletingList: boolean;
  isEditing: boolean;
  isExportingPdf: boolean;
  isSaving: boolean;
  list: InventoryListDetail;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onExportPdf: () => void;
  onSave: () => void;
  t: (key: string) => string;
};

export function InventoryDocumentHeader({ formatDateTime, getShiftLabel, isAdmin, isDeletingList, isEditing, isExportingPdf, isSaving, list, onCancelEdit, onDelete, onEdit, onExportPdf, onSave, t }: InventoryDocumentHeaderProps) {
  return (
    <View className="gap-3 border-b border-primary pb-4">
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xl font-bold text-secondary_dark">{list.date} | {getShiftLabel(list.shift)}</Text>
          <Text className="mt-1 text-sm text-muted">{t("createdBy")}: {list.createdByUserName}</Text>
          <Text className="mt-1 text-sm text-muted">{t("createdAt")}: {formatDateTime(list.createdAt)}</Text>
          <Text className="mt-1 text-sm text-muted">{t("updatedAt")}: {formatDateTime(list.updatedAt)}</Text>
        </View>
        {isAdmin && !isEditing ? (
          <View className="min-w-32 gap-2">
            <AppButton label={t("exportPdf")} loading={isExportingPdf} disabled={isExportingPdf} onPress={onExportPdf} className="bg-orange" />
            <AppButton label={t("editList")} onPress={onEdit} className="bg-secondary_dark" />
            <AppButton label={t("delete")} loading={isDeletingList} disabled={isDeletingList} onPress={onDelete} className="bg-red-600" />
          </View>
        ) : null}
        {!isAdmin && !isEditing ? (
          <View className="min-w-32">
            <AppButton label={t("exportPdf")} loading={isExportingPdf} disabled={isExportingPdf} onPress={onExportPdf} className="bg-orange" />
          </View>
        ) : null}
      </View>
      {isEditing ? (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <AppButton label={t("saveList")} loading={isSaving} disabled={isSaving} onPress={onSave} className="bg-secondary_dark" />
          </View>
          <View className="flex-1">
            <AppButton label={t("cancel")} variant="secondary" disabled={isSaving} onPress={onCancelEdit} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
