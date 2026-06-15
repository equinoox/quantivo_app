import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Modal, ModalProps, Platform, Pressable, ScrollView, View } from "react-native";

import { AnimatedEntrance } from "@/shared/components/ui/AnimatedEntrance";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";

type AppModalProps = PropsWithChildren<ModalProps & { onClose?: () => void }>;

export function AppModal({ children, onClose, transparent = true, animationType = "fade", ...props }: AppModalProps) {
  const responsive = useResponsiveLayout();

  return (
    <Modal transparent={transparent} animationType={animationType} onRequestClose={onClose} {...props}>
      <Pressable className="flex-1 items-center justify-center bg-black/40" style={{ paddingHorizontal: responsive.horizontalPadding }} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ maxHeight: responsive.modalMaxHeight, width: "100%" }}>
          <AnimatedEntrance distance={16} duration={560} scaleFrom={0.97} style={{ alignSelf: "center", maxHeight: responsive.modalMaxHeight, maxWidth: responsive.modalMaxWidth, width: "100%" }}>
            <View className="w-full overflow-hidden rounded-lg bg-white" onStartShouldSetResponder={() => true}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: responsive.isExtraSmallPhone ? 16 : 20 }}>
                {children}
              </ScrollView>
            </View>
          </AnimatedEntrance>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
