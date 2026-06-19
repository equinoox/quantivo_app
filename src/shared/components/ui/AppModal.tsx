import { PropsWithChildren } from "react";
import { Dimensions, KeyboardAvoidingView, Modal, ModalProps, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AnimatedEntrance } from "@/shared/components/ui/AnimatedEntrance";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";

type AppModalProps = PropsWithChildren<ModalProps & { layout?: "default" | "landscape"; onClose?: () => void }>;

export function AppModal({ children, layout = "default", onClose, transparent = true, animationType = "fade", ...props }: AppModalProps) {
  const responsive = useResponsiveLayout();
  const isLandscapeLayout = layout === "landscape";
  const screen = Dimensions.get("screen");
  const isScreenLandscape = screen.width > screen.height;
  const stableWindowHeight = isScreenLandscape ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
  const modalMaxHeight = isLandscapeLayout ? Math.max(320, stableWindowHeight - 32) : Math.max(320, stableWindowHeight - 72);
  const modalMaxWidth = isLandscapeLayout ? Math.min(Math.max(responsive.window.width, responsive.window.height) - 24, 980) : responsive.modalMaxWidth;
  const horizontalPadding = isLandscapeLayout ? 12 : responsive.horizontalPadding;
  const keyboardBehavior = isLandscapeLayout ? (Platform.OS === "ios" ? "padding" : "height") : Platform.OS === "ios" ? "padding" : undefined;

  return (
    <Modal transparent={transparent} animationType={animationType} onRequestClose={onClose} {...props}>
      <View className="flex-1 items-center justify-center bg-black/40" style={{ paddingHorizontal: horizontalPadding }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={keyboardBehavior} style={{ maxHeight: modalMaxHeight, width: "100%" }}>
          <AnimatedEntrance distance={16} duration={560} scaleFrom={0.97} style={{ alignSelf: "center", maxHeight: modalMaxHeight, maxWidth: modalMaxWidth, width: "100%" }}>
            <View className="w-full overflow-hidden rounded-lg bg-white">
              <ScrollView keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, padding: isLandscapeLayout ? 12 : responsive.isExtraSmallPhone ? 16 : 20 }}>
                {children}
              </ScrollView>
            </View>
          </AnimatedEntrance>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
