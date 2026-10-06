"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  translate,
  TranslationKeyPath,
  AppLanguage,
  normalizeLangCode,
  formatDate,
  formatTime,
  formatNumber,
  formatCurrency,
} from "@/lib/i18n";

interface LanguageContextType {
  lang: AppLanguage;
  setLang: (newLang: AppLanguage | "VN" | "EN" | "ENG") => void;
  t: (keyPath: TranslationKeyPath | string, params?: Record<string, string | number>, fallback?: string) => string;
  formatDate: (dateValue: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (dateValue: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number | null | undefined, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number | null | undefined, currencySymbol?: string) => string;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let initialLang: AppLanguage = "vi";
    try {
      const savedLang = localStorage.getItem("tbs_lang");
      initialLang = normalizeLangCode(savedLang);
      // Migrate legacy storage values ("VN", "ENG", etc.) to standard "vi" | "en"
      if (savedLang !== initialLang) {
        localStorage.setItem("tbs_lang", initialLang);
      }
    } catch {
      initialLang = "vi";
    }

    setLangState(initialLang);
    setMounted(true);

    if (typeof document !== "undefined") {
      document.documentElement.lang = initialLang;
    }

    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        const normalized = normalizeLangCode(customEvent.detail);
        setLangState(normalized);
        if (typeof document !== "undefined") {
          document.documentElement.lang = normalized;
        }
      }
    };

    window.addEventListener("tbs_lang_changed", handleLanguageChange);
    return () => {
      window.removeEventListener("tbs_lang_changed", handleLanguageChange);
    };
  }, []);

  const setLang = (rawLang: AppLanguage | "VN" | "EN" | "ENG") => {
    const newLang = normalizeLangCode(rawLang);
    setLangState(newLang);

    if (typeof document !== "undefined") {
      document.documentElement.lang = newLang;
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tbs_lang", newLang);
        window.dispatchEvent(new CustomEvent("tbs_lang_changed", { detail: newLang }));
      } catch (e) {
        console.error("Failed to save language preference:", e);
      }
    }
  };

  const t = (
    keyPath: TranslationKeyPath | string,
    params?: Record<string, string | number>,
    fallback?: string
  ): string => {
    return translate(keyPath, params, lang, fallback);
  };

  const boundFormatDate = (dateValue: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) =>
    formatDate(dateValue, lang, options);

  const boundFormatTime = (dateValue: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) =>
    formatTime(dateValue, lang, options);

  const boundFormatNumber = (value: number | null | undefined, options?: Intl.NumberFormatOptions) =>
    formatNumber(value, lang, options);

  const boundFormatCurrency = (value: number | null | undefined, currencySymbol?: string) =>
    formatCurrency(value, lang, currencySymbol);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t,
        formatDate: boundFormatDate,
        formatTime: boundFormatTime,
        formatNumber: boundFormatNumber,
        formatCurrency: boundFormatCurrency,
        mounted,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: "vi" as AppLanguage,
      setLang: () => {},
      t: (keyPath: string, _params?: Record<string, string | number>, fallback?: string) => fallback || "",
      formatDate: (d: any) => (d ? String(d) : ""),
      formatTime: (d: any) => (d ? String(d) : ""),
      formatNumber: (n: any) => String(n || 0),
      formatCurrency: (n: any) => String(n || 0),
      mounted: false,
    };
  }
  return context;
}
