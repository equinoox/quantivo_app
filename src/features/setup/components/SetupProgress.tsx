import { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";

type SetupProgressProps = {
  currentStep: number;
  totalSteps?: number;
};

export function SetupProgress({ currentStep, totalSteps = 6 }: SetupProgressProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const clampedStep = Math.min(Math.max(currentStep, 1), totalSteps);

  useEffect(() => {
    Animated.timing(progress, {
      duration: 260,
      toValue: clampedStep / totalSteps,
      useNativeDriver: false,
    }).start();
  }, [clampedStep, progress, totalSteps]);

  return (
    <View className="h-1.5 overflow-hidden rounded-sm bg-primary/30" onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
      <Animated.View className="h-full rounded-sm bg-orange" style={{ width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, trackWidth] }) }} />
    </View>
  );
}
