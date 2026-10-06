import { useLanguage } from "@/components/LanguageProvider";

export function useTranslation() {
  const { lang, setLang, t, mounted, formatDate, formatTime, formatNumber, formatCurrency } = useLanguage();
  return { t, lang, setLang, mounted, formatDate, formatTime, formatNumber, formatCurrency };
}

export default useTranslation;
