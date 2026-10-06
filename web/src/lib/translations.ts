// Language Translation System Bridge for TBS Group
import { translate as coreTranslate, normalizeLangCode, AppLanguage } from "./i18n";
import { vi } from "@/locales/vi";
import { en } from "@/locales/en";

export type LanguageCode = "VN" | "ENG" | "vi" | "en";

export const TRANSLATIONS = {
  VN: vi,
  ENG: en,
  vi,
  en,
};

export function translate(keyPath: string, lang: string = "vi"): string {
  const normalized = normalizeLangCode(lang);
  return coreTranslate(keyPath, undefined, normalized, keyPath);
}

export function getCurrentLanguage(): AppLanguage {
  if (typeof window === "undefined") return "vi";
  try {
    const saved = localStorage.getItem("tbs_lang");
    return normalizeLangCode(saved);
  } catch {
    return "vi";
  }
}

export function getTranslations(lang: string) {
  const normalized = normalizeLangCode(lang);
  return TRANSLATIONS[normalized];
}

export default TRANSLATIONS;
