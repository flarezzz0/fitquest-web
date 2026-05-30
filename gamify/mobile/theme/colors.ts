// 🍎 Apple Design System Colors
// Source: getdesign.md/apple/design-md
// Dark mode variant for fitness app
// Reactive: use useThemeColors() hook for dynamic theming

import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { useStore } from "../store/useStore";

export const colors = {
  // Brand & Accent
  primary: "#0066cc",         // Action Blue
  primaryFocus: "#0071e3",    // Focus Blue
  primaryOnDark: "#2997ff",   // Sky Link Blue (on dark surfaces)

  // Backgrounds
  bg: "#1d1d1f",              // Near-black ink (Apple's dark bg)
  card: "#272729",            // Surface tile 1
  cardAlt: "#2a2a2c",         // Surface tile 2
  cardDark: "#252527",        // Surface tile 3
  pureBlack: "#000000",       // True black (nav)
  canvas: "#ffffff",          // White (for highlights)

  // Text
  text: "#f5f5f7",            // Near-white (Apple parchment)
  textDim: "#cccccc",         // Body muted
  textMuted: "#7a7a7a",       // Ink muted 48
  textInk: "#1d1d1f",         // For light surfaces

  // Cards & Borders
  cardBorder: "rgba(255,255,255,0.08)",  // Soft hairline
  divider: "rgba(255,255,255,0.04)",     // Divider soft

  // Status
  success: "#30d158",         // Apple green
  warning: "#ff9f0a",         // Apple orange
  error: "#ff453a",           // Apple red
  gold: "#ffd60a",            // Apple yellow (for coins)

  // Legacy neon mapping (kept for compatibility)
  neon: {
    blue: "#2997ff",
    purple: "#bf5af2",
    green: "#30d158",
    pink: "#ff375f",
    gold: "#ffd60a",
  },
};

// Dark tokens (override specific keys)
const darkOverrides = {
  bg: "#1d1d1f",
  card: "#272729",
  cardAlt: "#2a2a2c",
  cardDark: "#252527",
  pureBlack: "#000000",
  text: "#f5f5f7",
  textDim: "#cccccc",
  textMuted: "#7a7a7a",
  textInk: "#1d1d1f",
  cardBorder: "rgba(255,255,255,0.08)",
  divider: "rgba(255,255,255,0.04)",
};

// Light tokens (override specific keys)
const lightOverrides = {
  bg: "#f2f2f7",
  card: "#ffffff",
  cardAlt: "#f5f5f7",
  cardDark: "#e8e8ed",
  pureBlack: "#ffffff",
  text: "#1d1d1f",
  textDim: "#3a3a3c",
  textMuted: "#8e8e93",
  textInk: "#f5f5f7",
  cardBorder: "rgba(0,0,0,0.08)",
  divider: "rgba(0,0,0,0.04)",
};

export function useThemeColors() {
  const themeMode = useStore((s) => s.themeMode);
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const compute = (): boolean => {
      if (themeMode === "dark") return true;
      if (themeMode === "light") return false;
      // system
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      return systemScheme === "dark";
    };
    setIsDark(compute());

    if (themeMode === "system" && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [themeMode, systemScheme]);

  const overrides = isDark ? darkOverrides : lightOverrides;
  return { ...colors, ...overrides };
}
