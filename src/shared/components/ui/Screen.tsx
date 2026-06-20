import { PropsWithChildren, ReactElement, ReactNode, useState } from "react";
import { ImageBackground, ImageSourcePropType, KeyboardAvoidingView, Platform, RefreshControlProps, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import clsx from "clsx";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { AngledHeader } from "@/shared/components/ui/AngledHeader";
import { RevealOnScrollContext } from "@/shared/components/ui/RevealOnScroll";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";

type ScreenProps = PropsWithChildren<{ backgroundFallbackSource?: ImageSourcePropType; backgroundImageUri?: string | null; backgroundOverlayClassName?: string; headerActions?: ReactNode; icon?: ReactNode; refreshControl?: ReactElement<RefreshControlProps>; showBackButton?: boolean; subtitle?: string; title?: string; scrollable?: boolean; tabPage?: boolean }>;

export function Screen({ backgroundFallbackSource, backgroundImageUri, backgroundOverlayClassName, headerActions, icon, refreshControl, showBackButton = false, subtitle, title, scrollable = true, tabPage = false, children }: ScreenProps) {
  const session = useAuthStore((state) => state.session);
  const responsive = useResponsiveLayout();
  const [revealViewportHeight, setRevealViewportHeight] = useState(0);
  const [revealScrollY, setRevealScrollY] = useState(0);
  const body = (
    <View
      className="self-center"
      style={{
        gap: responsive.gap,
        maxWidth: responsive.contentMaxWidth,
        paddingHorizontal: responsive.horizontalPadding,
        paddingVertical: responsive.verticalPadding,
        width: "100%",
      }}
    >
      {children}
    </View>
  );
  const backgroundSource = backgroundImageUri ? { uri: backgroundImageUri } : (backgroundFallbackSource ?? require("../../../../assets/quantivo_bg.png"));
  const displayTitle = tabPage && session?.user.name && title ? `${session.user.name}` : title;
  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-secondary_dark">
      <View className="flex-1 bg-background">
        {displayTitle ? <AngledHeader icon={icon} title={displayTitle} subtitle={subtitle} showBackButton={showBackButton} rightActions={headerActions} onBack={() => router.back()} compact /> : null}
        <ImageBackground source={backgroundSource} resizeMode="cover" className="flex-1">
          {backgroundOverlayClassName ? <View pointerEvents="none" className={clsx("absolute inset-0", backgroundOverlayClassName)} /> : null}
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
            {scrollable ? (
              <RevealOnScrollContext.Provider value={{ scrollY: revealScrollY, viewportHeight: revealViewportHeight }}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
                  onLayout={(event) => setRevealViewportHeight(event.nativeEvent.layout.height)}
                  onScroll={(event) => setRevealScrollY(event.nativeEvent.contentOffset.y)}
                  refreshControl={refreshControl}
                  scrollEventThrottle={80}
                >
                  {body}
                </ScrollView>
              </RevealOnScrollContext.Provider>
            ) : (
              <View className="flex-1">{body}</View>
            )}
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}
