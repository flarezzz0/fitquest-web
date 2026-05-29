import { Platform, useWindowDimensions } from "react-native";
import { getBreakpoint, BREAKPOINTS } from "../theme/breakpoints";

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= BREAKPOINTS.desktop;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isMobile = width < BREAKPOINTS.tablet;
  const breakpoint = getBreakpoint(width);

  return { isDesktop, isTablet, isMobile, breakpoint, width, height };
}
