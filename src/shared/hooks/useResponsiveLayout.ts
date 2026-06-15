import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export type ResponsiveBreakpoint = "xs" | "sm" | "md" | "lg" | "foldable" | "tablet" | "wide";

export function getResponsiveBreakpoint(width: number): ResponsiveBreakpoint {
  if (width < 360) return "xs";
  if (width < 390) return "sm";
  if (width <= 430) return "md";
  if (width <= 480) return "lg";
  if (width < 768) return "foldable";
  if (width < 1024) return "tablet";
  return "wide";
}

export function useResponsiveLayout() {
  const { height, width } = useWindowDimensions();

  return useMemo(() => {
    const breakpoint = getResponsiveBreakpoint(width);
    const isExtraSmallPhone = breakpoint === "xs";
    const isSmallPhone = breakpoint === "xs" || breakpoint === "sm";
    const isPhone = width < 481;
    const isFoldable = width >= 481 && width < 768;
    const isTablet = width >= 768;
    const isWide = width >= 1024;
    const horizontalPadding = isExtraSmallPhone ? 12 : isSmallPhone ? 14 : isPhone ? 16 : isFoldable ? 20 : 28;
    const verticalPadding = isSmallPhone ? 18 : isPhone ? 22 : 28;
    const gap = isExtraSmallPhone ? 12 : isPhone ? 16 : 20;
    const cardPadding = isExtraSmallPhone ? 12 : isPhone ? 14 : 16;
    const contentMaxWidth = isWide ? 1040 : isTablet ? 900 : undefined;
    const formMaxWidth = isWide ? 560 : isTablet ? 520 : 430;
    const modalMaxWidth = Math.min(width - horizontalPadding * 2, isTablet ? 640 : 520);
    const modalMaxHeight = Math.max(320, height - 72);

    return {
      breakpoint,
      cardPadding,
      contentMaxWidth,
      formMaxWidth,
      gap,
      horizontalPadding,
      isExtraSmallPhone,
      isFoldable,
      isPhone,
      isSmallPhone,
      isTablet,
      isWide,
      modalMaxHeight,
      modalMaxWidth,
      verticalPadding,
      window: { height, width },
    };
  }, [height, width]);
}
