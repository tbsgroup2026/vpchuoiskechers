import { vi, LocaleDictionary } from "@/locales/vi";
import { en } from "@/locales/en";
import { AppLanguage, normalizeLangCode } from "./migration";
export * from "./migration";
export * from "./formatters";

export const dictionaries: Record<AppLanguage, LocaleDictionary> = {
  vi,
  en,
};

// Helper type to construct nested dot-notation paths for keys in LocaleDictionary
type NestedKeys<T> = T extends object
  ? {
      [K in keyof T & (string | number)]: T[K] extends object
        ? `${K}.${NestedKeys<T[K]>}`
        : `${K}`;
    }[keyof T & (string | number)]
  : "";

export type TranslationKeyPath = NestedKeys<LocaleDictionary>;

/**
 * Gets deep property from dictionary object safely by path e.g. "dashboard.totalRooms"
 */
function getDeepValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const keys = path.split(".");
  let current = obj;
  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Performs template variable interpolation for {{paramName}}
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params || !template) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return key in params && params[key] !== undefined && params[key] !== null
      ? String(params[key])
      : `{{${key}}}`;
  });
}

/**
 * Core translation function with interpolation, pluralization, fallback and dev warnings.
 */
export function translate(
  keyPath: string,
  params?: Record<string, string | number>,
  lang: AppLanguage = "vi",
  fallbackParam?: string
): string {
  const targetLang = normalizeLangCode(lang);
  let resolvedText: string | undefined;

  // Handle pluralization if count parameter is provided
  if (params && typeof params.count === "number") {
    const count = params.count;
    if (targetLang === "en") {
      const pluralSuffix = count === 1 ? "_one" : "_other";
      resolvedText = getDeepValue(dictionaries.en, `${keyPath}${pluralSuffix}`);
    }
  }

  // Look up in primary locale dictionary
  if (!resolvedText) {
    resolvedText = getDeepValue(dictionaries[targetLang], keyPath);
  }

  // Fallback to Vietnamese if requested language is English and key was missing
  if (!resolvedText && targetLang === "en") {
    resolvedText = getDeepValue(dictionaries.vi, keyPath);
  }

  // Missing key handling: NEVER output raw key to UI!
  if (!resolvedText) {
    if (process.env.NODE_ENV === "development" || (typeof window !== "undefined" && window.location.hostname === "localhost")) {
      console.warn(`[i18n] Missing translation key: "${keyPath}" for locale: "${targetLang}"`);
    }
    // Return explicit fallback parameter if provided, otherwise empty string
    return fallbackParam !== undefined ? fallbackParam : "";
  }

  return interpolate(resolvedText, params);
}
