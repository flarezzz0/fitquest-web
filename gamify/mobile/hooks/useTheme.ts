import { useColorScheme } from "react-native"
import { useStore } from "../store/useStore"

export function useTheme() {
  const themeMode = useStore((s) => s.themeMode)
  const systemScheme = useColorScheme()
  const isDark = themeMode === "system" ? systemScheme === "dark" : themeMode === "dark"
  return { isDark, themeMode }
}
