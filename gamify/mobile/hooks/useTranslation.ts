import { useStore } from "../store/useStore"
import th from "../locales/th"
import en from "../locales/en"

export function useTranslation() {
  const language = useStore((s) => s.language)
  const locale = language === "th" ? th : en

  // key เช่น 'dashboard.welcome' → locale['dashboard']['welcome']
  const t = (key: string): string => {
    const parts = key.split(".")
    let val: any = locale
    for (const p of parts) {
      if (val && typeof val === "object" && p in val) val = val[p]
      else return key
    }
    return typeof val === "string" ? val : key
  }

  return { t, language }
}
