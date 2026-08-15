"use client";

import Link from "next/link";
import { IconArrowRight, IconArrowDown, IconSparkles } from "@tabler/icons-react";

export default function HeroSection() {
  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          MODULE 1 — HERO SECTION (#hero)
          Background: Gate photo with dark green overlay (#08221a)
         ════════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative flex items-center bg-[#08221a] overflow-hidden pt-16 pb-20 lg:pt-20 lg:pb-24 min-h-[70vh] lg:min-h-[68vh]"
      >
        {/* Background Image: Gate photo full visibility */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/images/tbs-gate.jpg')" }}
        />
        {/* Semi-transparent black gradient overlay for crisp text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35 pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Copy & CTAs & Stats */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2fd39a]/15 border border-[#2fd39a]/30 backdrop-blur-sm">
                <IconSparkles size={14} className="text-[#2fd39a]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#2fd39a]">
                  Văn Phòng Chuỗi SKECHERS - TBS Group
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight">
                Văn Phòng Chuỗi <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2fd39a] via-[#52e8b2] to-[#f2dc9a]">
                  SKECHERS - TBS Group
                </span>
              </h1>

              {/* Italic Quote */}
              <p className="text-sm sm:text-base font-serif italic text-[#f2dc9a]/90 tracking-wide">
                &ldquo;Excellence in Manufacturing. Excellence in Leadership.&rdquo;
              </p>

              {/* Paragraph Description */}
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-[62ch]">
                Không gian điều hành đại diện cho năng lực quản trị, văn hóa doanh nghiệp và tiêu chuẩn vận hành của ngành SKECHERS - TBS Group. Thiết kế hướng đến sự tinh gọn, hiện đại và chuyên nghiệp, phản ánh vị thế của một doanh nghiệp sản xuất trong chuỗi cung ứng toàn cầu.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2fd39a] to-[#f2dc9a] text-[#08221a] font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
                >
                  <span>Truy Cập Hệ Thống</span>
                  <IconArrowRight size={16} />
                </Link>
                <a
                  href="#workspace"
                  className="inline-flex items-center gap-2 text-gray-200 font-semibold px-6 py-3 rounded-xl text-xs uppercase tracking-wider hover:text-white hover:bg-white/10 border border-white/20 transition-all duration-200"
                >
                  Khám Phá Không Gian
                </a>
              </div>

              {/* Stats Row — 3 Clusters */}
              <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-3 sm:gap-6">
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                    30+
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    Năm Kinh Nghiệm
                  </div>
                </div>
                <div className="space-y-0.5 border-l border-white/20 pl-3 sm:pl-6">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-[#2fd39a] tracking-tight">
                    10M+
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    Sản Phẩm / Năm
                  </div>
                </div>
                <div className="space-y-0.5 border-l border-white/20 pl-3 sm:pl-6">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-[#f2dc9a] tracking-tight">
                    5,000+
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    Nhân Sự Vận Hành
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Block matching exact screenshot */}
            <div className="lg:col-span-5 relative min-h-[440px] h-[440px] z-10 mt-6 lg:mt-0">
              {/* 1. Main Card (Top-Right): Hands Circle Image */}
              <div className="absolute top-0 right-0 w-[80%] h-[68%] rounded-[26px] overflow-hidden border border-[#2fd39a]/35 shadow-2xl z-10 group bg-[#0d2419]">
                <img
                  src="/images/tbs-hands.png"
                  alt="TBS Group - Chung Sức Kiến Tạo Tương Lai"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* 2. Sub Card (Bottom-Left): Team Photo Banner with White Border */}
              <div className="absolute bottom-0 left-0 w-[55%] h-[48%] rounded-[22px] overflow-hidden border-[3px] border-white shadow-2xl z-20 hover:scale-[1.03] transition-transform duration-300 group/card bg-[#0d2419]">
                <img
                  src="/images/tbs-team-banner.png"
                  alt="Phát Huy Sức Mạnh Kiến Tạo Tương Lai"
                  className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                />
              </div>

              {/* 3. Dark Quote Badge: Bottom-Right Quote Box */}
              <div className="absolute bottom-[10%] -right-2 z-30 bg-[#08221a]/90 backdrop-blur-[14px] border border-[#2fd39a]/45 rounded-[20px] p-[16px_20px] max-w-[230px] shadow-2xl">
                <div className="w-[40px] h-[2.5px] bg-gradient-to-r from-[#2fd39a] to-[#1fae7d] rounded-full mb-[10px]" />
                <p className="font-serif italic text-white text-[16px] sm:text-[17px] leading-[1.4]">
                  &ldquo;Chung sức kiến tạo tương lai&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Arrow Button */}
        <a
          href="#brand-strip"
          className="absolute bottom-6 right-8 w-10 h-10 rounded-full bg-[#0d2419] border border-[#2fd39a]/40 text-[#2fd39a] flex items-center justify-center shadow-xl hover:bg-[#2fd39a] hover:text-[#08221a] transition-all duration-300 animate-bounce z-30"
          aria-label="Cuộn xuống"
        >
          <IconArrowDown size={18} />
        </a>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          MODULE 2 — BRAND-STRIP (#brand-strip)
          Full-width dark green background strip with white stadium pills
         ════════════════════════════════════════════════════════════════ */}
      <section
        id="brand-strip"
        className="relative z-30 -mt-[74px] py-7 bg-[#0b3226]/95 backdrop-blur-md border-y border-[#2fd39a]/25 shadow-2xl overflow-hidden"
      >
        {/* Gradient side fades */}
        <div className="absolute left-0 top-0 bottom-0 w-[120px] bg-gradient-to-r from-[#0b3226] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-[120px] bg-gradient-to-l from-[#0b3226] to-transparent z-10 pointer-events-none" />

        <div className="w-full text-center space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[3.5px] text-[#f2dc9a]">
            ĐỐI TÁC THƯƠNG HIỆU TIN CẬY &amp; HỆ THỐNG CUNG ỨNG
          </h3>

          {/* Continuous Marquee Row of White Stadium Pills */}
          <div className="overflow-hidden w-full flex items-center py-1">
            <div className="animate-marquee-left flex items-center gap-5 sm:gap-7">
              {[
                "QUALITY CONTROL HUB",
                "TBS FOOTWEAR DIGITAL",
                "SKECHERS GLOBAL",
                "TBS GROUP LOGISTICS",
                "DECATHLON PARTNER",
                "ZONE II INDUSTRIAL",
                "SKECHERS ZONE II",
                "QUALITY CONTROL HUB",
                "TBS FOOTWEAR DIGITAL",
                "SKECHERS GLOBAL",
                "TBS GROUP LOGISTICS",
                "DECATHLON PARTNER",
                "ZONE II INDUSTRIAL",
                "SKECHERS ZONE II",
              ].map((brand, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 flex items-center justify-center min-w-[160px] h-[74px] rounded-[18px] px-6 py-3 bg-white text-slate-900 font-extrabold text-xs sm:text-sm uppercase tracking-wider border border-white/20 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 text-center select-none cursor-pointer"
                >
                  <span>{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
