import { Text, View } from "react-native";

import { AppButton } from "@/shared/components/ui/AppButton";
import { AppModal } from "@/shared/components/ui/AppModal";

type ConfirmDialogProps = { visible: boolean; title: string; message?: string; onCancel: () => void; onConfirm: () => void };

export function ConfirmDialog({ visible, title, message, onCancel, onConfirm }: ConfirmDialogProps) {
  return <AppModal visible={visible} onClose={onCancel}><View className="gap-4"><View><Text className="text-xl font-semibold text-ink">{title}</Text>{message ? <Text className="mt-2 text-muted">{message}</Text> : null}</View><View className="flex-row gap-3"><AppButton label="Cancel" variant="secondary" className="flex-1" onPress={onCancel} /><AppButton label="Confirm" className="flex-1" onPress={onConfirm} /></View></View></AppModal>;
}
