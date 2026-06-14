import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, ViewStyle } from "react-native";

export type RevealOnScrollContextValue = {
  scrollY: number;
  viewportHeight: number;
};

export const RevealOnScrollContext = createContext<RevealOnScrollContextValue | null>(null);

type RevealOnScrollProps = PropsWithChildren<{
  delay?: number;
  distance?: number;
  duration?: number;
  style?: ViewStyle;
}>;

export function RevealOnScroll({ children, delay = 0, distance = 18, duration = 620, style }: RevealOnScrollProps) {
  const context = useContext(RevealOnScrollContext);
  const [layoutY, setLayoutY] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(!context);
  const opacity = useRef(new Animated.Value(context ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(context ? distance : 0)).current;
  const scale = useRef(new Animated.Value(context ? 0.985 : 1)).current;

  useEffect(() => {
    if (isVisible || !context || layoutY === null || context.viewportHeight <= 0) return;
    if (layoutY < context.scrollY + context.viewportHeight - 54) setIsVisible(true);
  }, [context, isVisible, layoutY]);

  useEffect(() => {
    if (!isVisible) return;
    Animated.parallel([
      Animated.timing(opacity, { delay, duration, easing: Easing.out(Easing.cubic), toValue: 1, useNativeDriver: true }),
      Animated.timing(translateY, { delay, duration, easing: Easing.out(Easing.cubic), toValue: 0, useNativeDriver: true }),
      Animated.timing(scale, { delay, duration, easing: Easing.out(Easing.cubic), toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [delay, duration, isVisible, opacity, scale, translateY]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutY(event.nativeEvent.layout.y);
  };

  return (
    <Animated.View onLayout={handleLayout} style={[style, { opacity, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}
