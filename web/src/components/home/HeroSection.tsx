"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconArrowRight, IconArrowDown } from "@tabler/icons-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getLandingCMS, DEFAULT_LANDING_CMS, DEFAULT_SHOE_GROUPS, ShoeGroup, isGroupValid } from "@/lib/landingCMS";

const formatImgUrl = (url?: string) => {
  if (!url) return "/images/tbs-logo.png";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  return "/" + url;
};

export default function HeroSection() {
  const { t, lang } = useTranslation();
  const [cmsHero, setCmsHero] = useState(DEFAULT_LANDING_CMS.hero);
  const [shoeGroups, setShoeGroups] = useState<ShoeGroup[]>(DEFAULT_SHOE_GROUPS);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);

  useEffect(() => {
    const loadCMS = () => {
      const config = getLandingCMS();
      if (config?.hero) {
        setCmsHero(config.hero);
      }
      if (config?.shoeLines?.groups && config.shoeLines.groups.length > 0) {
        const validGroups = config.shoeLines.groups.filter(isGroupValid);
        setShoeGroups(validGroups.length > 0 ? validGroups : DEFAULT_SHOE_GROUPS);
      } else {
        setShoeGroups(DEFAULT_SHOE_GROUPS);
      }
    };
    loadCMS();

    if (typeof window !== "undefined") {
      window.addEventListener("tbs_landing_cms_updated", loadCMS);
      return () => window.removeEventListener("tbs_landing_cms_updated", loadCMS);
    }
  }, []);

  // Auto cycle active group every 7 seconds
  useEffect(() => {
    if (!shoeGroups.length) return;
    const timer = setInterval(() => {
      setActiveGroupIndex((prev) => (prev + 1) % shoeGroups.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [shoeGroups.length]);

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          MODULE 1 — HERO SECTION (#hero)
          Background: Gate photo with dark green overlay (#08221a)
         ════════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative flex items-center bg-[#08221a] overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 min-h-[80vh] lg:min-h-[78vh]"
      >
        {/* Background Image: Gate photo full visibility */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url('${cmsHero.bgImage || "/images/tbs-gate.jpg"}')` }}
        />
        {/* Lớp phủ đen có độ trong suốt 40%, gradient black từ trái sang phải */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10 pointer-events-none" />
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Copy & CTAs & Stats */}
            <div className="lg:col-span-7 space-y-6">
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight">
                {cmsHero.titlePrefix || t("hero.chain_office")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2fd39a] via-[#52e8b2] to-[#f2dc9a]">
                  {cmsHero.titleHighlight || t("hero.skechers_tbs")}
                </span>
              </h1>

              {/* Italic Quote */}
              <p className="text-sm sm:text-base font-serif italic text-[#f2dc9a]/90 tracking-wide">
                &ldquo;{cmsHero.quoteItalic || t("hero.excellence_manufacturing")}&rdquo;
              </p>

              {/* Paragraph Description */}
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-[62ch]">
                {cmsHero.description || t("hero.operating_space")}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2fd39a] to-[#f2dc9a] text-[#08221a] font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
                >
                  <span>{t("hero.access_system")}</span>
                  <IconArrowRight size={16} />
                </Link>
                <a
                  href="#workspace"
                  className="inline-flex items-center gap-2 text-gray-200 font-semibold px-6 py-3 rounded-xl text-xs uppercase tracking-wider hover:text-white hover:bg-white/10 border border-white/20 transition-all duration-200"
                >
                  {t("hero.explore_space")}
                </a>
              </div>

              {/* Stats Row — 3 Clusters */}
              <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-3 sm:gap-6">
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                    {cmsHero.stat1Value || "30+"}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    {cmsHero.stat1Label || t("hero.years_experience")}
                  </div>
                </div>
                <div className="space-y-0.5 border-l border-white/20 pl-3 sm:pl-6">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-[#2fd39a] tracking-tight">
                    {cmsHero.stat2Value || "10M+"}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    {cmsHero.stat2Label || t("hero.products_year")}
                  </div>
                </div>
                <div className="space-y-0.5 border-l border-white/20 pl-3 sm:pl-6">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-[#f2dc9a] tracking-tight">
                    {cmsHero.stat3Value || "5,000+"}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    {cmsHero.stat3Label || t("hero.operational_staff")}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Block matching exact screenshot */}
            <div className="lg:col-span-5 relative min-h-[440px] h-[440px] z-10 mt-6 lg:mt-0">
              {/* 1. Main Card (Top-Right): Hands Circle Image */}
              <div className="absolute top-0 right-0 w-[80%] h-[68%] rounded-[26px] overflow-hidden border border-[#2fd39a]/35 shadow-2xl z-10 group bg-[#0d2419]">
                <img
                  src={cmsHero.handsImage || "/images/tbs-hands.png"}
                  alt="TBS Group - Chung Sức Kiến Tạo Tương Lai"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* 2. Sub Card (Bottom-Left): Team Photo Banner with White Border */}
              <div className="absolute bottom-0 left-0 w-[55%] h-[48%] rounded-[22px] overflow-hidden border-[3px] border-white shadow-2xl z-20 hover:scale-[1.03] transition-transform duration-300 group/card bg-[#0d2419]">
                <img
                  src={cmsHero.teamImage || "/images/tbs-team-banner.png"}
                  alt="Phát Huy Sức Mạnh Kiến Tạo Tương Lai"
                  className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                />
              </div>

              {/* 3. Dark Quote Badge: Bottom-Right Quote Box */}
              <div className="absolute bottom-[10%] -right-2 z-30 bg-[#08221a]/90 backdrop-blur-[14px] border border-[#2fd39a]/45 rounded-[20px] p-[16px_20px] max-w-[230px] shadow-2xl">
                <div className="w-[40px] h-[2.5px] bg-gradient-to-r from-[#2fd39a] to-[#1fae7d] rounded-full mb-[10px]" />
                <p className="font-serif italic text-white text-[16px] sm:text-[17px] leading-[1.4]">
                  &ldquo;{cmsHero.quoteBadgeText || "Chung sức kiến tạo tương lai"}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Arrow Button */}
        <a
          href="#brand-strip"
          className="absolute bottom-6 right-8 w-10 h-10 rounded-full bg-[#0d2419] border border-[#2fd39a]/40 text-[#2fd39a] flex items-center justify-center shadow-xl hover:bg-[#2fd39a] hover:text-[#08221a] transition-all duration-300 animate-bounce z-30"
          aria-label={t("common.next")}
        >
          <IconArrowDown size={18} />
        </a>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          MODULE 2 — DÒNG GIÀY TIÊU BIỂU (#brand-strip)
      {/* ════════════════════════════════════════════════════════════════
          MODULE 2 — DÒNG GIÀY TIÊU BIỂU (#brand-strip)
          Compact full-width horizontal shoe carousel matching Image 1
         ════════════════════════════════════════════════════════════════ */}
      <section
        id="brand-strip"
        className="relative z-30 -mt-[74px] py-4 sm:py-5 bg-[#072419] border-y border-[#2fd39a]/20 shadow-2xl overflow-hidden select-none"
      >
        {/* Gradient side overlays for viewport edge fade */}
        <div className="absolute left-0 top-0 bottom-0 w-[70px] sm:w-[130px] bg-gradient-to-r from-[#072419] via-[#072419]/90 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-[70px] sm:w-[130px] bg-gradient-to-l from-[#072419] via-[#072419]/90 to-transparent z-20 pointer-events-none" />

        <div className="w-full space-y-3 text-center">
          {/* HEADER: ────── DÒNG GIÀY TIÊU BIỂU ────── */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 px-4">
            <div className="h-[1px] w-16 sm:w-36 bg-gradient-to-r from-transparent to-[#f2dc9a]/80" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-[3px] sm:tracking-[4px] text-[#f2dc9a] font-display whitespace-nowrap">
              DÒNG GIÀY TIÊU BIỂU
            </h3>
            <div className="h-[1px] w-16 sm:w-36 bg-gradient-to-l from-transparent to-[#f2dc9a]/80" />
          </div>

          {/* CONTINUOUS HORIZONTAL MARQUEE CAROUSEL OF ALL SHOE GROUPS */}
          <div className="overflow-hidden w-full flex items-center py-1">
            <div className="animate-marquee-left flex items-center gap-6 sm:gap-8 shrink-0">
              {(() => {
                const sortedGroups = [...shoeGroups].sort((a, b) => a.order - b.order);
                return [...sortedGroups, ...sortedGroups].map((group, groupIdx) => {
                  const sortedItems = [...(group.items || [])].sort((a, b) => a.order - b.order);
                  return (
                    <div key={`${group.id || groupIdx}-${groupIdx}`} className="flex flex-col items-center shrink-0 space-y-2.5">
                      {/* Horizontal Product Cards Row for this Group */}
                      <div className="flex items-center gap-3.5 sm:gap-4">
                        {sortedItems.map((item, itemIdx) => (
                          <div
                            key={`${item.id}-${itemIdx}`}
                            className="flex-shrink-0 flex items-center justify-center w-[150px] sm:w-[165px] h-[86px] sm:h-[94px] rounded-[18px] sm:rounded-[22px] bg-white p-2.5 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                            title={item.name}
                          >
                            <img
                              src={formatImgUrl(item.url)}
                              alt={item.name || group.title}
                              className="w-full h-full object-contain p-0.5 transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.dataset.triedFallback) {
                                  target.dataset.triedFallback = "true";
                                  if (target.src.endsWith(".png")) {
                                    target.src = target.src.replace(/\.png$/, ".jpg");
                                  } else if (target.src.endsWith(".jpg")) {
                                    target.src = target.src.replace(/\.jpg$/, ".png");
                                  }
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Group Label Underneath Card Row */}
                      <div className="flex items-center justify-center gap-3 w-full">
                        <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#f2dc9a]/70" />
                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-[2.5px] sm:tracking-[3px] text-[#f2dc9a] font-display whitespace-nowrap">
                          {group.title}
                        </span>
                        <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#f2dc9a]/70" />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
