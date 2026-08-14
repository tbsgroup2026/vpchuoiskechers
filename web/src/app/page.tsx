import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkspaceGallery from "@/components/home/WorkspaceGallery";
import Link from "next/link";
import {
  IconArrowDown,
  IconArrowRight,
  IconBuildingFactory,
  IconSparkles,
  IconQuote,
  IconShieldCheck,
  IconAward,
  IconBuildingWarehouse,
} from "@tabler/icons-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans antialiased text-slate-900 selection:bg-[#006838] selection:text-white">
      <Header />

      <main className="flex-1">
        {/* ════════════════════════════════════════════════════════════════
            MODULE 1 — HERO GIỚI THIỆU (#hero)
            Layout: Asymmetric 2 columns (Desktop: Left ~55%, Right ~45%)
            Hero must fit initial viewport (min-h-[100dvh])
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          className="relative flex items-center bg-[#08221a] overflow-hidden pt-12 pb-10 lg:pt-16 lg:pb-12 min-h-[68vh] lg:min-h-[calc(68vh-2rem)]"
        >
          {/* Background Image: Gate photo spanning across whole section */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: "url('/images/tbs-gate.jpg')" }}
          />

          {/* Soft Gradient Dark Overlay Layer matching Image 2 (Lớp đen mờ) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#041a13]/90 via-[#041a13]/70 to-[#041a13]/40 backdrop-blur-[2px] pointer-events-none" />

          {/* Subtle gradient background mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_20%,_rgba(47,211,154,0.12)_0%,_transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_80%,_rgba(242,220,154,0.06)_0%,_transparent_70%)] pointer-events-none" />

          <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Hero Copy & Stats */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                {/* Small Pill Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2fd39a]/15 border border-[#2fd39a]/40 backdrop-blur-md">
                  <IconSparkles size={13} className="text-[#2fd39a] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#2fd39a]">
                    Văn Phòng Chuỗi SKECHERS - TBS Group
                  </span>
                </div>

                {/* Main Headline & Subtitle */}
                <div className="space-y-2">
                  <h1 className="text-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] text-white">
                    Văn Phòng Chuỗi <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2fd39a] via-[#f2dc9a] to-[#2fd39a]">
                      SKECHERS - TBS Group
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl font-serif italic text-[#c8e6ca] font-light leading-snug">
                    &ldquo;Excellence in Manufacturing. Excellence in Leadership.&rdquo;
                  </p>
                </div>

                {/* Description Paragraph */}
                <p className="text-gray-200 text-xs sm:text-sm leading-relaxed max-w-[58ch]">
                  Không gian điều hành đại diện cho năng lực quản trị, văn hóa doanh nghiệp và tiêu chuẩn vận hành của ngành SKECHERS - TBS Group. Thiết kế hướng đến sự tinh gọn, hiện đại và chuyên nghiệp, phản ánh vị thế của một doanh nghiệp sản xuất trong chuỗi cung ứng toàn cầu.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2fd39a] to-[#f2dc9a] text-[#08221a] font-extrabold px-5.5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
                  >
                    <span>Truy Cập Hệ Thống</span>
                    <IconArrowRight size={15} />
                  </Link>
                  <a
                    href="#workspace"
                    className="inline-flex items-center gap-2 text-gray-200 font-semibold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:text-white hover:bg-white/10 border border-white/20 transition-all duration-200"
                  >
                    Khám Phá Không Gian
                  </a>
                </div>

                {/* Stats Row — 3 Clusters */}
                <div className="pt-5 border-t border-white/15 grid grid-cols-3 gap-3 sm:gap-6">
                  <div className="space-y-0.5">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                      30+
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      Năm Kinh Nghiệm
                    </div>
                  </div>
                  <div className="space-y-0.5 border-l border-white/20 pl-3 sm:pl-6">
                    <div className="text-xl sm:text-2xl font-black font-mono text-[#2fd39a] tracking-tight">
                      10M+
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      Sản Phẩm / Năm
                    </div>
                  </div>
                  <div className="space-y-0.5 border-l border-white/20 pl-3 sm:pl-6">
                    <div className="text-xl sm:text-2xl font-black font-mono text-[#f2dc9a] tracking-tight">
                      5,000+
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      Nhân Sự Vận Hành
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Block matching exact script.google.com layout */}
              <div className="lg:col-span-5 relative min-h-[380px] h-[380px] z-2">
                {/* 1. Main Card (.hv-main): top:0, right:0, width:78%, height:66%, border-radius:26px */}
                <div className="absolute top-0 right-0 w-[78%] h-[66%] rounded-[26px] overflow-hidden border border-[#2fd39a]/35 shadow-2xl z-10 group">
                  <img
                    src="/images/tbs-hands.png"
                    alt="TBS Group - Chung Sức Kiến Tạo Tương Lai"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* 2. Sub Card (.hv-sub): bottom:0, left:0, width:52%, height:44%, border-radius:22px, border:3px solid white */}
                <div className="absolute bottom-0 left-0 w-[52%] h-[44%] rounded-[22px] overflow-hidden border-[3px] border-white/95 shadow-2xl z-20 hover:scale-[1.03] transition-transform duration-300 group/card">
                  <img
                    src="/images/tbs-team-banner.png"
                    alt="Phát Huy Sức Mạnh Kiến Tạo Tương Lai"
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* 3. Dark Quote Badge (.hv-badge): bottom:14%, right:-2%, border-radius:20px, max-width:220px */}
                <div className="absolute bottom-[14%] -right-2 z-30 bg-[#08221a]/85 backdrop-blur-[14px] border border-[#2fd39a]/42 rounded-[20px] p-[15px_19px] max-w-[220px] shadow-2xl">
                  <div className="w-[40px] h-[2.5px] bg-gradient-to-r from-[#2fd39a] to-[#1fae7d] rounded-full mb-[10px]" />
                  <p className="font-serif italic text-white text-[17px] leading-[1.4]">
                    &ldquo;Chung sức kiến tạo tương lai&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Smooth Scroll Arrow Button (Bottom Right) */}
          <a
            href="#brand-strip"
            className="absolute bottom-6 right-6 w-9 h-9 rounded-full bg-[#0d2419] border border-[#2fd39a]/40 text-[#2fd39a] flex items-center justify-center shadow-xl hover:bg-[#2fd39a] hover:text-[#08221a] transition-all duration-300 animate-bounce z-30"
            aria-label="Cuộn xuống"
          >
            <IconArrowDown size={16} />
          </a>
        </section>


        {/* ════════════════════════════════════════════════════════════════
            MODULE 2 — BRAND-STRIP (#brand-strip)
            Full-width dark background strip matching exact 150px x 74px strip-item cards
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="brand-strip"
          className="relative z-20 -mt-4 py-7 bg-[#0b3226]/95 backdrop-blur-md border-y border-[#2fd39a]/30 shadow-2xl overflow-hidden"
        >
          {/* Subtle gradient side fades (120px) */}
          <div className="absolute left-0 top-0 bottom-0 w-[120px] bg-gradient-to-r from-[#0b3226] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-[120px] bg-gradient-to-l from-[#0b3226] to-transparent z-10 pointer-events-none" />

          <div className="w-full text-center space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[3.5px] text-[#f2dc9a]/70">
              ĐỐI TÁC THƯƠNG HIỆU TIN CẬY &amp; HỆ THỐNG CUNG ỨNG
            </h3>

            {/* Continuous Infinite Marquee Row Sliding Left (150px x 74px rounded-14px cards) */}
            <div className="overflow-hidden w-full flex items-center py-1">
              <div className="animate-marquee-left flex items-center gap-[26px]">
                {[
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
                  "QUALITY CONTROL HUB",
                  "TBS FOOTWEAR DIGITAL",
                ].map((brand, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 flex items-center justify-center w-[150px] h-[74px] rounded-[14px] px-[18px] py-[14px] bg-white border border-white/20 shadow-[0_8px_22px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,0,0,0.2)] transition-all duration-300 group cursor-pointer"
                  >
                    <span className="font-serif text-[15px] font-bold text-[#132019] group-hover:text-[#1fae7d] tracking-wide text-center leading-tight transition-colors">
                      {brand}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════
            MODULE 3 — KHÔNG GIAN LÀM VIỆC (#workspace)
            Interactive Gallery with 14 real images from /images/KGLV/
           ════════════════════════════════════════════════════════════════ */}
        <WorkspaceGallery />


        {/* ════════════════════════════════════════════════════════════════
            MODULE 4 — DẤU ẤN THƯƠNG HIỆU CAO CẤP (#premium-brand)
            Asymmetric 2 columns: Text + Highlights / Large Image
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="premium-brand"
          className="py-24 lg:py-32 bg-emerald-50/40 border-y border-emerald-100"
        >
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Image block */}
              <div className="lg:col-span-6 relative">
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-white border border-slate-200 shadow-xl">
                  <img
                    src="https://www.tbsgroup.vn/wp-content/uploads/2014/12/Da-giay1.jpg"
                    alt="Tiêu chuẩn sản xuất SKECHERS"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right Column: Text & Features */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-[#006838] text-[11px] font-bold uppercase tracking-widest">
                  <IconAward size={14} />
                  <span>Tiêu Chuẩn Vận Hành Đỉnh Cao</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight text-display">
                  Dấu Ấn Thương Hiệu &amp; Đẳng Cấp Chuỗi Cung Ứng
                </h2>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Văn Phòng Chuỗi SKECHERS - TBS Group tuân thủ nghiêm ngặt các tiêu chuẩn chất lượng cao nhất của đối tác SKECHERS toàn cầu. Hệ thống áp dụng quy trình số hóa 100%, nâng cao năng suất và đảm bảo an toàn lao động.
                </p>

                {/* 3 Pillars */}
                <div className="space-y-4 pt-2">
                  {[
                    {
                      title: "Vận Hành Chuẩn Hóa 4.0",
                      desc: "Tự động hóa báo cáo sự cố Gemba Walk và đánh giá Cải tiến CI.",
                    },
                    {
                      title: "Kiểm Soát Chất Lượng Thời Gian Thực",
                      desc: "BI Dashboard đo lường chỉ số OEE và tỷ lệ lỗi trên từng chuyền sản xuất.",
                    },
                    {
                      title: "Tối Ưu Kaizen Bằng Trí Tuệ Nhân Tạo",
                      desc: "Tích hợp AI Groq so sánh trùng lặp ý tưởng Kaizen thông minh.",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-3.5"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#006838] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-normal">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════
            MODULE 5 — ẢNH SẢN PHẨM MẪU (#products)
            Grid placeholders 6-8 items with product captions
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="products"
          className="py-24 lg:py-32 bg-white max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 space-y-12"
        >
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight text-display">
              Dòng Sản Phẩm Tiêu Biểu SKECHERS
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Các mẫu sản phẩm thuộc chuỗi cung ứng SKECHERS được sản xuất và kiểm soát chất lượng tại hệ thống nhà máy TBS Group.
            </p>
          </div>

          {/* Grid of 6-8 Product Placeholders */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { name: "SKECHERS Performance Footwear", code: "SK-PERF-01" },
              { name: "SKECHERS Lifestyle Casual Shoes", code: "SK-LIFE-02" },
              { name: "SKECHERS Athletic Sport Line", code: "SK-SPORT-03" },
              { name: "SKECHERS Work & Safety Shoes", code: "SK-[#006838]-04" },
              { name: "SKECHERS Outdoor Trekking Series", code: "SK-OUT-05" },
              { name: "SKECHERS Kids Comfort Collection", code: "SK-KIDS-06" },
              { name: "SKECHERS Handbag & Apparel Accessories", code: "SK-ACC-07" },
              { name: "SKECHERS Special Edition Series", code: "SK-SPEC-08" },
            ].map((prod, idx) => (
              <div
                key={idx}
                className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:border-[#006838]/40 hover:shadow-lg transition-all duration-300 shadow-sm"
              >
                {/* 1:1 Square Ratio Photo Placeholder */}
                <div className="relative aspect-square bg-emerald-50/50 flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300">
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#006838]/10 text-[#006838] flex items-center justify-center mx-auto font-mono font-bold text-xs">
                      SKS
                    </div>
                    <span className="block text-[10px] font-mono text-[#006838] font-bold">
                      {prod.code}
                    </span>
                  </div>
                </div>

                {/* Caption Underneath */}
                <div className="p-3.5 bg-white border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#006838] transition-colors truncate">
                    {prod.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Tiêu chuẩn SKECHERS Global
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
