"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkspaceGallery from "@/components/home/WorkspaceGallery";
import Link from "next/link";
import { motion } from "motion/react";
import {
  IconArrowRight,
  IconAward,
  IconCheckCircle,
  IconGaugeCircle,
  IconSparkles,
} from "@tabler/icons-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans antialiased text-slate-900 selection:bg-[#0a7c5a] selection:text-white">
      <Header />

      <main className="flex-1">
        {/* ════════════════════════════════════════════════════════════════
            HERO — Premium Asymmetric Split
            Left: Copy + CTA. Right: Layered Image Cards
            Brand: Emerald (#0a7c5a) + Slate + Minimal Beige accent
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          className="relative min-h-[100dvh] flex items-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-20"
        >
          {/* Subtle radial accent glow (top-left) */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-amber-100/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Column: Headline + Copy + CTA */}
              <motion.div
                className="space-y-6 lg:space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Eyebrow Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/60 border border-emerald-200/80 backdrop-blur-sm">
                  <IconSparkles size={14} className="text-[#0a7c5a]" />
                  <span className="text-xs font-bold uppercase tracking-wide text-[#0a7c5a]">
                    Không Gian Làm Việc Chuyên Nghiệp
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-slate-900">
                  Vận Hành <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0a7c5a] via-emerald-600 to-[#0a7c5a]">
                    Không Gian Tương Lai
                  </span>
                </h1>

                {/* Subheading */}
                <p className="text-lg sm:text-xl text-slate-600 font-light leading-relaxed max-w-[55ch]">
                  Nơi quản trị hiệu quả, văn hóa chuyên nghiệp và đẳng cấp chuỗi cung ứng toàn cầu.
                </p>

                {/* 2 Stat Pills */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-[#0a7c5a]">
                      30+
                    </span>
                    <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                      Năm Kinh Nghiệm
                    </span>
                  </div>
                  <div className="w-px bg-slate-300 hidden sm:block" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-[#0a7c5a]">
                      10M+
                    </span>
                    <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                      Sản Phẩm / Năm
                    </span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0a7c5a] text-white font-bold rounded-xl text-sm uppercase tracking-wide shadow-lg shadow-emerald-600/25 hover:bg-[#086647] active:scale-95 transition-all duration-200"
                  >
                    Truy Cập Hệ Thống
                    <IconArrowRight size={16} />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 px-6 py-3 text-[#0a7c5a] font-semibold rounded-xl text-sm uppercase tracking-wide border-2 border-[#0a7c5a]/30 hover:border-[#0a7c5a] hover:bg-emerald-50 transition-all duration-200"
                  >
                    Khám Phá
                  </a>
                </div>
              </motion.div>

              {/* Right Column: Layered Image Cards */}
              <motion.div
                className="relative h-[500px] hidden lg:block"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Large Primary Card (top-right) */}
                <div className="absolute top-0 right-0 w-72 h-64 rounded-3xl overflow-hidden shadow-2xl border border-white bg-white group">
                  <img
                    src="https://picsum.photos/seed/tbs-workspace-hero/600/500"
                    alt="Không gian làm việc"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                {/* Secondary Card (bottom-left, slightly smaller) */}
                <div className="absolute bottom-10 left-0 w-60 h-52 rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-white hover:shadow-2xl transition-shadow duration-300 group/card">
                  <img
                    src="https://picsum.photos/seed/tbs-team-workspace/500/450"
                    alt="Nhóm làm việc"
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Floating Quote Badge */}
                <motion.div
                  className="absolute bottom-0 right-8 z-30 bg-white/95 backdrop-blur-lg rounded-2xl p-4 max-w-xs shadow-xl border border-slate-200"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <p className="text-sm font-light text-slate-700 leading-relaxed">
                    <span className="font-semibold text-[#0a7c5a]">"Excellence</span> in Manufacturing. Excellence in Leadership."
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FEATURES — Bento Grid (asymmetric 3-cell layout)
            Variance: high, density: low, motion: medium
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="features"
          className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden"
        >
          <div className="max-w-[1400px] mx-auto">
            {/* Section Header */}
            <motion.div
              className="max-w-2xl mb-16 space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                Tiêu Chuẩn Vận Hành
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Ba trụ cột cơ bản giúp không gian làm việc đạt chuẩn hiệu quả toàn cầu.
              </p>
            </motion.div>

            {/* Bento: 3-Cell Asymmetric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Cell 1: Full Height (spans 2 rows on large screens) */}
              <motion.div
                className="md:row-span-2 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-3xl p-8 lg:p-10 border border-emerald-200/60 flex flex-col justify-between min-h-80 lg:min-h-full shadow-sm hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6 }}
              >
                <div>
                  <div className="w-12 h-12 bg-[#0a7c5a] rounded-2xl flex items-center justify-center text-white mb-4">
                    <IconGaugeCircle size={24} />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-black text-slate-900 mb-3">
                    Vận Hành Chuẩn Hóa 4.0
                  </h3>
                  <p className="text-slate-700 text-sm lg:text-base leading-relaxed">
                    Tự động hóa hoàn toàn báo cáo Gemba Walk, giám sát tiến độ CI và quản lý sự cố theo thời gian thực.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#0a7c5a] font-semibold uppercase tracking-wide mt-6 pt-6 border-t border-emerald-200/50">
                  ✓ Automation
                </div>
              </motion.div>

              {/* Cell 2 */}
              <motion.div
                className="bg-white rounded-3xl p-8 lg:p-10 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 mb-4">
                  <IconCheckCircle size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Kiểm Soát Chất Lượng
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">
                  BI Dashboard thời gian thực giám sát OEE và tỷ lệ lỗi trên từng chuyền sản xuất.
                </p>
              </motion.div>

              {/* Cell 3 */}
              <motion.div
                className="bg-slate-900 rounded-3xl p-8 lg:p-10 border border-slate-700 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center text-white mb-4">
                  <IconSparkles size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Kaizen + AI
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed flex-1">
                  Tích hợp AI Groq tối ưu ý tưởng cải tiến thông minh và phát hiện xu hướng sáng tạo.
                </p>
              </motion.div>

              {/* Cell 4 (optional, full-width accent row below) */}
              <motion.div
                className="md:col-span-2 lg:col-span-1 bg-gradient-to-br from-amber-50 to-amber-100/40 rounded-3xl p-8 border border-amber-200/50 shadow-sm hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className="w-10 h-10 bg-amber-600/20 rounded-xl flex items-center justify-center text-amber-700 mb-3 font-bold">
                  +
                </div>
                <p className="text-slate-700 text-sm font-medium">
                  Tích hợp các giải pháp tiên tiến để tối ưu hoạt động toàn chuỗi.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            WORKSPACE GALLERY (#workspace)
           ════════════════════════════════════════════════════════════════ */}
        <WorkspaceGallery />

        {/* ════════════════════════════════════════════════════════════════
            BRAND EXCELLENCE — Split Layout
            Left: Large Image. Right: Copy + 3 Highlights
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="excellence"
          className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white"
        >
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Image */}
              <motion.div
                className="relative rounded-3xl overflow-hidden aspect-[3/4] lg:aspect-auto lg:h-[600px] shadow-xl border border-slate-200 group"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7 }}
              >
                <img
                  src="https://picsum.photos/seed/tbs-excellence/800/900"
                  alt="Dấu ấn chất lượng TBS"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </motion.div>

              {/* Right: Copy + Highlights */}
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/60 border border-amber-200">
                  <IconAward size={14} className="text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-700">
                    Chứng Nhận Quốc Tế
                  </span>
                </div>

                {/* Headline */}
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                  Đẳng Cấp Chuỗi Cung Ứng Toàn Cầu
                </h2>

                {/* Description */}
                <p className="text-slate-600 text-base leading-relaxed">
                  Tuân thủ tất cả tiêu chuẩn chất lượng cao nhất của SKECHERS. Quy trình số hóa 100%, nâng cao năng suất và đảm bảo an toàn lao động tối đa.
                </p>

                {/* 3 Highlights */}
                <div className="space-y-4 pt-4">
                  {[
                    {
                      num: "01",
                      title: "Số Hóa 100%",
                      desc: "Tất cả quy trình được theo dõi và tối ưu bằng hệ thống kỹ thuật số.",
                    },
                    {
                      num: "02",
                      title: "An Toàn Lao Động",
                      desc: "Tuân thủ nghiêm ngặt các tiêu chuẩn an toàn quốc tế ISO 45001.",
                    },
                    {
                      num: "03",
                      title: "Năng Suất Cao",
                      desc: "Tối ưu hóa liên tục thông qua phương pháp Kaizen và cải tiến CI.",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#0a7c5a] text-white flex items-center justify-center font-bold text-sm">
                          {item.num}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PRODUCTS GRID — Minimal Cards
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="products"
          className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white"
        >
          <div className="max-w-[1400px] mx-auto">
            {/* Header */}
            <motion.div
              className="max-w-2xl mb-16 space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                Sản Phẩm Tiêu Biểu
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Các dòng sản phẩm SKECHERS được sản xuất theo tiêu chuẩn quốc tế.
              </p>
            </motion.div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { name: "Performance Footwear", code: "SK-PERF-01" },
                { name: "Lifestyle Casual Shoes", code: "SK-LIFE-02" },
                { name: "Athletic Sport Line", code: "SK-SPORT-03" },
                { name: "Work & Safety Shoes", code: "SK-WORK-04" },
                { name: "Outdoor Trekking", code: "SK-OUT-05" },
                { name: "Kids Collection", code: "SK-KIDS-06" },
                { name: "Handbag & Apparel", code: "SK-ACC-07" },
                { name: "Special Edition", code: "SK-SPEC-08" },
              ].map((prod, idx) => (
                <motion.div
                  key={idx}
                  className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:border-[#0a7c5a]/40 hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-emerald-100/30 to-emerald-50 flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                    <img
                      src={`https://picsum.photos/seed/product-${idx}/400/400`}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Caption */}
                  <div className="p-3.5 bg-white border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0a7c5a] transition-colors truncate">
                      {prod.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                      {prod.code}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
