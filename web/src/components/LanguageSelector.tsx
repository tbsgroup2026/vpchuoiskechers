"use client";

import { useState, useEffect, useRef } from "react";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";
import { useLanguage } from "@/components/LanguageProvider";
import { AppLanguage } from "@/lib/i18n";

export type LanguageCode = "vi" | "en" | "VN" | "EN" | "ENG";

interface LanguageOption {
  code: AppLanguage;
  displayCode: "VI" | "EN";
  label: string;
  nativeLabel: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "vi", displayCode: "VI", label: "Tiếng Việt", nativeLabel: "VN (Việt Nam)", flag: "🇻🇳" },
  { code: "en", displayCode: "EN", label: "English", nativeLabel: "EN (English)", flag: "🇬🇧" },
];

interface LanguageSelectorProps {
  variant?: "header-dark" | "header-light" | "auto";
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export default function LanguageSelector({
  variant = "auto",
  className = "",
  isOpen: externalIsOpen,
  onToggle,
  onClose,
}: LanguageSelectorProps) {
  const { lang, setLang, t } = useLanguage();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Close dropdown when clicked outside or on Esc key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectLanguage = (code: AppLanguage) => {
    setLang(code);
    handleClose();
  };

  const isDark = variant === "header-dark";
  const isLight = variant === "header-light";
  const currentDisplayCode = lang === "en" ? "EN" : "VI";

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl font-bold text-xs sm:text-xs transition-all duration-200 cursor-pointer select-none shadow-2xs ${
          isDark
            ? "border border-[#2fd39a]/60 bg-[#041a13]/80 hover:bg-[#0f4133] text-white hover:border-[#2fd39a]"
            : isLight
            ? "border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800"
            : "border border-[#006838] bg-white hover:bg-emerald-50/60 text-[#08221a] hover:border-[#004d29]"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t("header.selectLanguage", undefined, "Chọn ngôn ngữ / Select Language")}
        title={t("header.selectLanguage", undefined, "Chọn ngôn ngữ / Select Language")}
      >
        <span className="tracking-wide font-extrabold">{currentDisplayCode}</span>
        <IconChevronDown
          size={13}
          className={`transition-transform duration-200 ${
            isDark ? "text-[#2fd39a]" : isLight ? "text-slate-600" : "text-[#006838]"
          } ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-44 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 border ${
            isDark
              ? "bg-[#041a13]/98 border-[#2fd39a]/30 text-white backdrop-blur-xl"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 text-slate-400">
            {t("header.selectLanguage", undefined, "Ngôn ngữ / Language")}
          </div>
          <div className="space-y-1">
            {LANGUAGES.map((item) => {
              const isSelected = lang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => selectLanguage(item.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? "bg-[#0f4133] text-[#2fd39a]"
                        : "bg-emerald-50 text-[#006838]"
                      : isDark
                      ? "text-gray-200 hover:bg-white/10"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{item.flag}</span>
                    <span>{item.nativeLabel}</span>
                  </div>
                  {isSelected && (
                    <IconCheck
                      size={14}
                      className={isDark ? "text-[#2fd39a]" : "text-[#006838]"}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
