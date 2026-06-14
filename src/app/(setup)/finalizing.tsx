import { router } from "expo-router";
import { MousePointerClick, ShieldCheck, Zap } from "lucide-react-native";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";

import { SetupScreen } from "@/features/setup/components/SetupScreen";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AnimatedEntrance } from "@/shared/components/ui/AnimatedEntrance";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

function QuantivoLogoText() {
  return (
    <Svg height={54} viewBox="0 0 240 54" width={240}>
      <Defs>
        <LinearGradient id="quantivoTextGradient" x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor="#FF6B00" />
          <Stop offset="0.5" stopColor={colors.orange} />
          <Stop offset="1" stopColor="#FFD166" />
        </LinearGradient>
      </Defs>
      <SvgText fill="url(#quantivoTextGradient)" fontSize="38" fontWeight="800" x="120" y="39" textAnchor="middle">
        Quantivo
      </SvgText>
    </Svg>
  );
}

function FinalizingBenefit({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View className="min-h-20 flex-1 items-center justify-center gap-2 rounded-md border border-primary bg-white px-2 py-3">
      {icon}
      <Text className="text-center text-xs font-semibold text-secondary_dark">{label}</Text>
    </View>
  );
}

function CompletionMark({ onDone }: { onDone: () => void }) {
  const circleProgress = useRef(new Animated.Value(0)).current;
  const checkProgress = useRef(new Animated.Value(0)).current;
  const circleLength = 2 * Math.PI * 46;
  const checkLength = 58;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(circleProgress, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.timing(checkProgress, {
        duration: 620,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: false,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) onDone();
    });

    return () => animation.stop();
  }, [checkProgress, circleProgress, onDone]);

  const circleDashOffset = circleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circleLength, 0],
  });
  const checkDashOffset = checkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [checkLength, 0],
  });
  const checkOpacity = checkProgress.interpolate({
    inputRange: [0, 0.08, 0.09, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <Svg height={122} viewBox="0 0 122 122" width={122}>
      <Circle cx="61" cy="61" fill="none" r="46" stroke="#DCFCE7" strokeWidth="8" />
      <AnimatedCircle cx="61" cy="61" fill="none" r="46" stroke="#22C55E" strokeDasharray={`${circleLength} ${circleLength}`} strokeDashoffset={circleDashOffset} strokeLinecap="round" strokeWidth="8" transform="rotate(-90 61 61)" />
      <AnimatedPath d="M39 62.5L54 77L84 46" fill="none" opacity={checkOpacity} stroke="#22C55E" strokeDasharray={`${checkLength} ${checkLength}`} strokeDashoffset={checkDashOffset} strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
    </Svg>
  );
}

export default function FinalizingSetupScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const completeSetup = useSetupStore((state) => state.completeSetup);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isMarkDone, setIsMarkDone] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loadingMessages = [t("finalizingLoadingReady"), t("finalizingLoadingInventory"), t("finalizingLoadingWorkflow")];

  const clearFinalizingTimers = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => clearFinalizingTimers, []);

  const runLoadingSequence = () =>
    new Promise<void>((resolve) => {
      clearFinalizingTimers();
      setLoadingMessageIndex(0);
      timersRef.current = [
        setTimeout(() => setLoadingMessageIndex(1), 2000),
        setTimeout(() => setLoadingMessageIndex(2), 4000),
        setTimeout(resolve, 6000),
      ];
    });

  const finalize = async () => {
    if (isSettingUp) return;
    setIsSettingUp(true);
    setIsComplete(false);
    setIsMarkDone(false);
    const [result] = await Promise.all([completeSetup(), runLoadingSequence()]);
    clearFinalizingTimers();
    setIsSettingUp(false);
    setIsComplete(result.ok);
    if (!result.ok) toast.error(t("setupFailed"), result.error);
  };

  return (
    <SetupScreen
      step={t("step6")}
      stepNumber={6}
      title={t("finalizingTitle")}
      footer={
        <>
          <AppButton label={t("goToLogin")} disabled={!isComplete} onPress={() => router.replace("/(auth)/login")} className="bg-secondary_dark" />
          {!isComplete ? <AppButton label={t("back")} variant="secondary" onPress={() => router.back()} /> : null}
        </>
      }
    >
      <View className="flex-1 items-center">
        <View className="items-center">
          <QuantivoLogoText />
          <Text className="text-center text-sm mb-6 font-semibold text-muted">{t("quantivoTagline")}</Text>
          {!isComplete ? (
            <View className="mt-6 w-full min-w-56 gap-3">
              <AppButton label={t("finishSetupAction")} loading={isSettingUp} disabled={isSettingUp} onPress={finalize} className="bg-secondary_dark" />
              {isSettingUp ? <Text className="text-center text-sm font-semibold text-muted">{loadingMessages[loadingMessageIndex]}</Text> : null}
            </View>
          ) : null}
        </View>

        {isComplete ? (
          <>
            <View className="flex-1 items-center justify-center gap-5 py-10">
              <CompletionMark onDone={() => setIsMarkDone(true)} />
              {isMarkDone ? (
                <AnimatedEntrance delay={80} distance={12} duration={620}>
                  <View className="items-center gap-2">
                    <Text className="text-center text-3xl font-bold text-secondary_dark">{t("everythingFinished")}</Text>
                    <Text className="text-center text-base font-semibold text-muted">{t("beginWorkMessage")}</Text>
                  </View>
                </AnimatedEntrance>
              ) : null}
            </View>

            {isMarkDone ? (
              <AnimatedEntrance delay={280} distance={14} duration={650} scaleFrom={0.98} style={{ alignSelf: "stretch" }}>
                <View className="w-full flex-row gap-2">
                  <FinalizingBenefit icon={<Zap color={colors.orange} size={22} />} label={t("fast")} />
                  <FinalizingBenefit icon={<ShieldCheck color={colors.orange} size={22} />} label={t("secure")} />
                  <FinalizingBenefit icon={<MousePointerClick color={colors.orange} size={22} />} label={t("easyToUse")} />
                </View>
              </AnimatedEntrance>
            ) : null}
          </>
        ) : (
          <View className="flex-1" />
        )}
      </View>
    </SetupScreen>
  );
}
