import { PropsWithChildren } from "react";
import { Modal, ModalProps, Pressable, View } from "react-native";

type AppModalProps = PropsWithChildren<ModalProps & { onClose?: () => void }>;

export function AppModal({ children, onClose, transparent = true, animationType = "fade", ...props }: AppModalProps) {
  return (
    <Modal transparent={transparent} animationType={animationType} onRequestClose={onClose} {...props}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 px-5" onPress={onClose}>
        <View className="w-full rounded-lg bg-white p-5" onStartShouldSetResponder={() => true}>{children}</View>
      </Pressable>
    </Modal>
  );
}
