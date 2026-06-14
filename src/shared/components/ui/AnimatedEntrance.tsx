import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, Easing, ViewStyle } from "react-native";

type AnimatedEntranceProps = PropsWithChildren<{
  delay?: number;
  distance?: number;
  duration?: number;
  scaleFrom?: number;
  style?: ViewStyle;
}>;

export function AnimatedEntrance({ children, delay = 0, distance = 14, duration = 560, scaleFrom, style }: AnimatedEntranceProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;
  const scale = useRef(new Animated.Value(scaleFrom ?? 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { delay, duration, easing: Easing.out(Easing.cubic), toValue: 1, useNativeDriver: true }),
      Animated.timing(translateY, { delay, duration, easing: Easing.out(Easing.cubic), toValue: 0, useNativeDriver: true }),
      Animated.timing(scale, { delay, duration, easing: Easing.out(Easing.cubic), toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [delay, duration, opacity, scale, translateY]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }, { scale }] }]}>{children}</Animated.View>;
}
