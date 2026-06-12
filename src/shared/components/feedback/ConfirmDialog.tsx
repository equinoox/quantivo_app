import { Text, View } from "react-native";

import { AppButton } from "@/shared/components/ui/AppButton";
import { AppModal } from "@/shared/components/ui/AppModal";

type ConfirmDialogProps = { visible: boolean; title: string; message?: string; cancelLabel?: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void };

export function ConfirmDialog({ visible, title, message, cancelLabel = "Cancel", confirmLabel = "Confirm", onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <AppModal visible={visible} onClose={onCancel}>
      <View className="gap-5">
        <View className="h-1 w-14 rounded-sm bg-orange" />
        <View>
          <Text className="text-xl font-semibold text-secondary_dark">{title}</Text>
          {message ? <Text className="mt-2 leading-5 text-secondary">{message}</Text> : null}
        </View>
        <View className="gap-3">
          <AppButton label={confirmLabel} className="bg-secondary_dark" onPress={onConfirm} />
          <AppButton label={cancelLabel} variant="secondary" onPress={onCancel} />
        </View>
      </View>
    </AppModal>
  );
}
