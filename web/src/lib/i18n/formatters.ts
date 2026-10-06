import { AppLanguage } from "./migration";

export function getIntlLocale(lang: AppLanguage): string {
  return lang === "en" ? "en-US" : "vi-VN";
}

/**
 * Format a Date object or date string according to locale.
 * Default format: "dd/MM/yyyy" for vi, "MM/dd/yyyy" for en.
 */
export function formatDate(
  dateValue: Date | string | number | null | undefined,
  lang: AppLanguage = "vi",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateValue) return "";
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  return new Intl.DateTimeFormat(getIntlLocale(lang), defaultOptions).format(d);
}

/**
 * Format time from date or time string according to locale.
 * Default format: "HH:mm" (24h) for vi, "hh:mm a" (12h) for en.
 */
export function formatTime(
  dateValue: Date | string | number | null | undefined,
  lang: AppLanguage = "vi",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateValue) return "";
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    hour: "2-digit",
    minute: "2-digit",
    hour12: lang === "en",
  };

  return new Intl.DateTimeFormat(getIntlLocale(lang), defaultOptions).format(d);
}

/**
 * Format a number according to locale (e.g. 1.000 vs 1,000).
 */
export function formatNumber(
  value: number | null | undefined,
  lang: AppLanguage = "vi",
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return new Intl.NumberFormat(getIntlLocale(lang), options).format(value);
}

/**
 * Format currency according to locale.
 * Defaults to VND for vi, USD for en (unless specified).
 */
export function formatCurrency(
  value: number | null | undefined,
  lang: AppLanguage = "vi",
  currencySymbol?: string
): string {
  if (value === null || value === undefined || isNaN(value)) return "0";
  const currency = currencySymbol || (lang === "en" ? "USD" : "VND");
  return new Intl.NumberFormat(getIntlLocale(lang), {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
}
