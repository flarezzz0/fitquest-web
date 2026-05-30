import { useStore } from "../store/useStore"
import th from "../locales/th"
import en from "../locales/en"

export function useTranslation() {
  const language = useStore((s) => s.language)
  const t = language === "th" ? th : en
  return { t, language }
}
