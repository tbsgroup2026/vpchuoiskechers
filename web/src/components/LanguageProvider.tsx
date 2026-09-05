"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translate, getCurrentLanguage, LanguageCode } from "@/lib/translations";

interface LanguageContextType {
  lang: LanguageCode;
  setLang: (newLang: LanguageCode) => void;
  t: (keyPath: string, fallback?: string) => string;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("VN");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const currentLang = getCurrentLanguage();
    setLangState(currentLang);
    setMounted(true);

    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<LanguageCode>;
      if (customEvent.detail) {
        setLangState(customEvent.detail);
      }
    };

    window.addEventListener("tbs_lang_changed", handleLanguageChange);
    return () => {
      window.removeEventListener("tbs_lang_changed", handleLanguageChange);
    };
  }, []);

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tbs_lang", newLang);
        window.dispatchEvent(new CustomEvent("tbs_lang_changed", { detail: newLang }));
      } catch (e) {
        console.error("Failed to save language preference:", e);
      }
    }
  };

  const t = (keyPath: string, fallback?: string): string => {
    const result = translate(keyPath, lang);
    return result === keyPath && fallback ? fallback : result;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      lang: "VN" as LanguageCode,
      setLang: () => {},
      t: (keyPath: string, fallback?: string) => fallback || keyPath,
      mounted: false,
    };
  }
  return context;
}
