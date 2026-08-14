import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
    <div className="min-h-screen flex flex-col bg-[#08221a] font-sans antialiased text-white selection:bg-[#2fd39a] selection:text-[#08221a]">
      <Header />

      <main className="flex-1">
        {/* ════════════════════════════════════════════════════════════════
            MODULE 1 — HERO GIỚI THIỆU (#hero)
            Layout: Asymmetric 2 columns (Desktop: Left ~55%, Right ~45%)
            Hero must fit initial viewport (min-h-[100dvh])
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          className="relative min-h-[100dvh] flex items-center bg-[#08221a] overflow-hidden pt-28 pb-16 lg:pt-32 lg:pb-20"
        >
          {/* Background Image: Gate photo */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: "url('/images/tbs-gate.jpg')" }}
          />

          {/* 90% Dark Overlay (Lớp đen mờ 90% giống ảnh 2) */}
          <div className="absolute inset-0 bg-[#08221a]/90 backdrop-blur-[2px] pointer-events-none" />

          {/* Subtle gradient background mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_20%,_rgba(47,211,154,0.12)_0%,_transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_80%,_rgba(242,220,154,0.06)_0%,_transparent_70%)] pointer-events-none" />

          <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Hero Copy & Stats */}
              <div className="lg:col-span-7 space-y-6">
                {/* Small Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2fd39a]/10 border border-[#2fd39a]/30 backdrop-blur-md">
                  <IconSparkles size={14} className="text-[#2fd39a] animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#2fd39a]">
                    Hệ Thống Quản Trị Chuỗi Cung Ứng SKECHERS
                  </span>
                </div>

                {/* Main Headline & Subtitle */}
                <div className="space-y-3">
                  <h1 className="text-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                    Văn Phòng Chuỗi <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2fd39a] via-[#f2dc9a] to-[#2fd39a]">
                      SKECHERS - TBS Group
                    </span>
                  </h1>
                  <p className="text-xl sm:text-2xl font-serif italic text-[#f2dc9a]/90 font-light leading-snug">
                    &ldquo;Nâng tầm tiêu chuẩn sản xuất &amp; vận hành chuỗi cung ứng quốc tế&rdquo;
                  </p>
                </div>

                {/* Description Paragraph */}
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-[62ch]">
                  Trung tâm điều hành và quản trị số hoá toàn diện cho tổ hợp nhà máy SKECHERS tại ZONE II. Tích hợp Gemba Walk thời gian thực, quản lý Cải tiến CI, Kaizen và báo cáo số liệu vận hành 24/7.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#2fd39a] to-[#f2dc9a] text-[#08221a] font-extrabold px-7 py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
                  >
                    <span>Truy Cập Hệ Thống</span>
                    <IconArrowRight size={16} />
                  </Link>
                  <a
                    href="#workspace"
                    className="inline-flex items-center gap-2 text-gray-300 font-semibold px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider hover:text-white hover:bg-white/5 border border-white/10 transition-all duration-200"
                  >
                    Khám Phá Không Gian
                  </a>
                </div>

                {/* Stats Row — 3 Clusters */}
                <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-4 sm:gap-8">
                  <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                      30+
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Năm Kinh Nghiệm
                    </div>
                  </div>
                  <div className="space-y-1 border-l border-white/15 pl-4 sm:pl-8">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-[#2fd39a] tracking-tight">
                      10M+
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Sản Phẩm / Năm
                    </div>
                  </div>
                  <div className="space-y-1 border-l border-white/15 pl-4 sm:pl-8">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-[#f2dc9a] tracking-tight">
                      5,000+
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Nhân Sự Vận Hành
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Block with Overlapping Cards */}
              <div className="lg:col-span-5 relative">
                {/* Main Visual Image (Position cũ dùng Ảnh 2: TBS Group - Chung sức kiến tạo tương lai) */}
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-[#0d2419] border border-[#2fd39a]/30 shadow-2xl group">
                  <img
                    src="/images/tbs-hands.png"
                    alt="TBS Group - Chung Sức Kiến Tạo Tương Lai"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08221a]/60 via-transparent to-transparent opacity-80" />
                </div>

                {/* Overlapping Card (Vị trí thẻ text 'Chuẩn Quốc Tế' đổi sang hiển thị ảnh Đội ngũ nhân sự) */}
                <div className="absolute -bottom-8 -left-4 sm:-left-8 w-60 sm:w-72 bg-[#0d2419]/95 border border-[#2fd39a]/40 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl group/card">
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden">
                    <img
                      src="/images/tbs-team.png"
                      alt="Phát Huy Sức Mạnh Cùng Kiến Tạo Tương Lai"
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08221a]/90 via-[#08221a]/30 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-extrabold text-[#2fd39a] uppercase tracking-wider">
                          Phát Huy Sức Mạnh
                        </div>
                        <div className="text-[11px] font-bold text-white leading-tight">
                          Cùng Kiến Tạo Tương Lai
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-[#2fd39a]/20 border border-[#2fd39a]/40 text-[#2fd39a] flex items-center justify-center">
                        <IconShieldCheck size={14} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dark Quote Badge (Top Right) */}
                <div className="absolute -top-4 -right-4 bg-[#08221a]/95 border border-[#f2dc9a]/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3">
                  <IconQuote size={20} className="text-[#f2dc9a]" />
                  <span className="text-[11px] font-semibold text-gray-200 italic">
                    &ldquo;Chung sức kiến tạo tương lai&rdquo;
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Smooth Scroll Arrow Button (Bottom Right) */}
          <a
            href="#brand-strip"
            className="absolute bottom-6 right-8 w-11 h-11 rounded-full bg-[#0d2419] border border-[#2fd39a]/40 text-[#2fd39a] flex items-center justify-center shadow-xl hover:bg-[#2fd39a] hover:text-[#08221a] transition-all duration-300 animate-bounce"
            aria-label="Cuộn xuống"
          >
            <IconArrowDown size={18} />
          </a>
        </section>


        {/* ════════════════════════════════════════════════════════════════
            MODULE 2 — BRAND-STRIP (ĐỐI TÁC THƯƠNG HIỆU TIN CẬY) (#brand-strip)
            Full-width dark background strip directly below Hero
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="brand-strip"
          className="py-10 bg-[#061a14] border-y border-[#2fd39a]/15 overflow-hidden"
        >
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 text-center space-y-6">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#f2dc9a]">
              ĐỐI TÁC THƯƠNG HIỆU TIN CẬY &amp; HỆ THỐNG CUNG ỨNG
            </h3>

            {/* Horizontal Partner Logos Row */}
            <div className="flex items-center justify-start lg:justify-center gap-4 sm:gap-6 overflow-x-auto pb-2 scroll-snap-x snap-mandatory no-scrollbar">
              {[
                "SKECHERS GLOBAL",
                "TBS GROUP LOGISTICS",
                "DECATHLON PARTNER",
                "ZONE II INDUSTRIAL",
                "THOAI SON SHOES",
                "QUALITY CONTROL HUB",
              ].map((brand, idx) => (
                <div
                  key={idx}
                  className="flex-none snap-center px-6 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#2fd39a]/40 transition-colors duration-200 flex items-center justify-center min-w-[180px]"
                >
                  <span className="text-xs font-bold font-mono text-gray-300 tracking-wider">
                    {brand}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════
            MODULE 3 — KHÔNG GIAN LÀM VIỆC (#workspace)
            Grid placeholders 4:3 cards with labels
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="workspace"
          className="py-24 lg:py-32 bg-[#08221a] max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 space-y-12"
        >
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#2fd39a] uppercase tracking-widest">
              <IconBuildingWarehouse size={16} />
              <span>Cơ Sở Hạ Tầng</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight text-display">
              Không Gian Làm Việc &amp; Sản Xuất
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Môi trường làm việc hiện đại tại Văn Phòng Chuỗi SKECHERS - TBS Group, ứng dụng công nghệ 4.0 và tiêu chuẩn vận hành xanh.
            </p>
          </div>

          {/* Grid of 6 Workspaces */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { title: "Khu Vực Văn Phòng Điều Hành Chuỗi", code: "ZONE-A1" },
              { title: "Trung Tâm Giám Sát Gemba Walk & BI", code: "ZONE-A2" },
              { title: "Xưởng Sản Xuất Giày SKECHERS 1", code: "PLANT-S1" },
              { title: "Xưởng Sản Xuất Giày SKECHERS 2", code: "PLANT-S2" },
              { title: "Phòng Thí Nghiệm QC & Kỹ Thuật", code: "LAB-QC" },
              { title: "Kho Vật Tư & Dịch Vụ Logistics", code: "WH-LOGISTICS" },
            ].map((space, idx) => (
              <div
                key={idx}
                className="group relative bg-[#0d2419] rounded-3xl overflow-hidden border border-white/10 hover:border-[#2fd39a]/50 transition-all duration-300 shadow-xl"
              >
                {/* 4:3 Image Container */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-[#0f4133] to-[#08221a] overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono text-xs">
                    {/* Placeholder image representation */}
                    <div className="text-center space-y-2">
                      <IconBuildingFactory size={36} className="mx-auto text-[#2fd39a]/40 group-hover:text-[#2fd39a] group-hover:scale-110 transition-all duration-300" />
                      <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {space.code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Space Label Underneath */}
                <div className="p-5 bg-[#0a281f] flex items-center justify-between border-t border-white/5">
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#2fd39a] transition-colors">
                      {space.title}
                    </h4>
                    <span className="text-[11px] font-mono text-[#f2dc9a]">
                      SKECHERS - TBS Group
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════
            MODULE 4 — DẤU ẤN THƯƠNG HIỆU CAO CẤP (#premium-brand)
            Asymmetric 2 columns: Text + Highlights / Large Image
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="premium-brand"
          className="py-24 lg:py-32 bg-[#061a14] border-y border-[#2fd39a]/15"
        >
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Image block */}
              <div className="lg:col-span-6 relative">
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-[#0d2419] border border-[#2fd39a]/30 shadow-2xl">
                  <img
                    src="https://www.tbsgroup.vn/wp-content/uploads/2014/12/Da-giay1.jpg"
                    alt="Tiêu chuẩn sản xuất SKECHERS"
                    className="w-full h-full object-cover brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08221a] via-transparent to-transparent" />
                </div>
              </div>

              {/* Right Column: Text & Features */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2dc9a]/10 border border-[#f2dc9a]/30 text-[#f2dc9a] text-[11px] font-bold uppercase tracking-widest">
                  <IconAward size={14} />
                  <span>Tiêu Chuẩn Vận Hành Đỉnh Cao</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight text-display">
                  Dấu Ấn Thương Hiệu &amp; Đẳng Cấp Chuỗi Cung Ứng
                </h2>

                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
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
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-0.5">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-400 leading-normal">
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
          className="py-24 lg:py-32 bg-[#08221a] max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 space-y-12"
        >
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight text-display">
              Dòng Sản Phẩm Tiêu Biểu SKECHERS
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Các mẫu sản phẩm thuộc chuỗi cung ứng SKECHERS được sản xuất và kiểm soát chất lượng tại hệ thống nhà máy TBS Group.
            </p>
          </div>

          {/* Grid of 6-8 Product Placeholders */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { name: "SKECHERS Performance Footwear", code: "SK-PERF-01" },
              { name: "SKECHERS Lifestyle Casual Shoes", code: "SK-LIFE-02" },
              { name: "SKECHERS Athletic Sport Line", code: "SK-SPORT-03" },
              { name: "SKECHERS Work & Safety Shoes", code: "SK-[#2fd39a]-04" },
              { name: "SKECHERS Outdoor Trekking Series", code: "SK-OUT-05" },
              { name: "SKECHERS Kids Comfort Collection", code: "SK-KIDS-06" },
              { name: "SKECHERS Handbag & Apparel Accessories", code: "SK-ACC-07" },
              { name: "SKECHERS Special Edition Series", code: "SK-SPEC-08" },
            ].map((prod, idx) => (
              <div
                key={idx}
                className="group bg-[#0d2419] rounded-2xl overflow-hidden border border-white/10 hover:border-[#2fd39a]/50 transition-all duration-300 shadow-lg"
              >
                {/* 1:1 Square Ratio Photo Placeholder */}
                <div className="relative aspect-square bg-[#0a281f] flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300">
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#2fd39a]/15 text-[#2fd39a] flex items-center justify-center mx-auto font-mono font-bold text-xs">
                      SKS
                    </div>
                    <span className="block text-[10px] font-mono text-[#f2dc9a]">
                      {prod.code}
                    </span>
                  </div>
                </div>

                {/* Caption Underneath */}
                <div className="p-3.5 bg-[#08221a] border-t border-white/5">
                  <h4 className="text-xs font-bold text-white group-hover:text-[#2fd39a] transition-colors truncate">
                    {prod.name}
                  </h4>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
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
