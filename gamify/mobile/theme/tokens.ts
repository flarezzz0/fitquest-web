export interface ThemeTokens {
  bg: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
  gold: string;
  primaryOnDark: string;
  bgAlt: string;
}

const dark: ThemeTokens = {
  bg: "#000",
  card: "#1c1c1e",
  text: "#fff",
  subtext: "#8e8e93",
  border: "#2c2c2e",
  primary: "#2997ff",
  success: "#30d158",
  warning: "#ff9f0a",
  error: "#ff453a",
  gold: "#ffd60a",
  primaryOnDark: "#2997ff",
  bgAlt: "#1d1d1f",
};

const light: ThemeTokens = {
  bg: "#f2f2f7",
  card: "#fff",
  text: "#000",
  subtext: "#6c6c70",
  border: "#e5e5ea",
  primary: "#0066cc",
  success: "#34c759",
  warning: "#ff9500",
  error: "#ff3b30",
  gold: "#ff9500",
  primaryOnDark: "#0066cc",
  bgAlt: "#e5e5ea",
};

export function tokens(isDark: boolean): ThemeTokens {
  return isDark ? dark : light;
}
