// Language Code Migration Helper

export type AppLanguage = "vi" | "en";

/**
 * Normalizes legacy or raw language strings into standard "vi" | "en".
 * - "VN", "vi", "VI", "vn" -> "vi"
 * - "EN", "ENG", "en", "eng" -> "en"
 * - any other / empty / null / undefined -> "vi"
 */
export function normalizeLangCode(rawLang?: string | null): AppLanguage {
  if (!rawLang) return "vi";
  const cleaned = rawLang.trim().toLowerCase();
  if (cleaned === "en" || cleaned === "eng") {
    return "en";
  }
  if (cleaned === "vi" || cleaned === "vn") {
    return "vi";
  }
  return "vi";
}
