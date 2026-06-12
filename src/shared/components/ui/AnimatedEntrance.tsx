import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

type AnimatedEntranceProps = PropsWithChildren<{
  delay?: number;
  style?: ViewStyle;
}>;

export function AnimatedEntrance({ children, delay = 0, style }: AnimatedEntranceProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { delay, duration: 220, toValue: 1, useNativeDriver: true }),
      Animated.timing(translateY, { delay, duration: 220, toValue: 0, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
