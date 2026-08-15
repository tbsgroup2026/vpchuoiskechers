"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import WorkspaceGallery from "@/components/home/WorkspaceGallery";
import {
  IconAward,
  IconCircleCheck,
  IconGauge,
} from "@tabler/icons-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#08221a] font-sans antialiased text-white selection:bg-[#2fd39a] selection:text-[#08221a]">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION & BRAND STRIP */}
        <HeroSection />

        {/* WORKSPACE GALLERY (#workspace) */}
        <div className="bg-white text-slate-900">
          <WorkspaceGallery />
        </div>

        {/* BRAND EXCELLENCE */}
        <section
          id="excellence"
          className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white text-slate-900"
        >
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-xl border border-slate-200 group bg-slate-100">
                <img
                  src="/images/tbs-factory-plant.png"
                  alt="Dấu ấn chất lượng TBS"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-[#08221a] text-xs font-bold uppercase tracking-widest">
                  <IconAward size={15} className="text-[#08221a]" />
                  <span>Tiêu Chuẩn Vận Hành Đỉnh Cao</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Dấu Ấn Thương Hiệu &amp; Đẳng Cấp Chuỗi Cung Ứng
                </h2>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Văn Phòng Chuỗi SKECHERS - TBS Group tuân thủ nghiêm ngặt các tiêu chuẩn chất lượng cao nhất của đối tác SKECHERS toàn cầu. Hệ thống áp dụng quy trình số hóa 100%, nâng cao năng suất và đảm bảo an toàn lao động.
                </p>

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
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#08221a] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
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

        {/* PRODUCTS GRID */}
        <section
          id="products"
          className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-t border-slate-100"
        >
          <div className="max-w-[1400px] mx-auto space-y-12">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Dòng Sản Phẩm Tiêu Biểu SKECHERS
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Các mẫu sản phẩm thuộc chuỗi cung ứng SKECHERS được sản xuất và kiểm soát chất lượng tại hệ thống nhà máy TBS Group.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { name: "Performance Footwear", code: "SK-PERF-01" },
                { name: "Lifestyle Casual Shoes", code: "SK-LIFE-02" },
                { name: "Athletic Sport Line", code: "SK-SPORT-03" },
                { name: "Work & Safety Shoes", code: "SK-WORK-04" },
                { name: "Outdoor Trekking Series", code: "SK-OUT-05" },
                { name: "Kids Comfort Collection", code: "SK-KIDS-06" },
                { name: "Handbag & Accessories", code: "SK-ACC-07" },
                { name: "Special Edition Series", code: "SK-SPEC-08" },
              ].map((prod, idx) => (
                <div
                  key={idx}
                  className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:border-[#08221a]/40 hover:shadow-xl transition-all duration-300 shadow-sm"
                >
                  <div className="relative aspect-square bg-emerald-50/50 flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300">
                    <div className="text-center space-y-1.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#08221a] text-white flex items-center justify-center mx-auto p-2 shadow-sm overflow-hidden">
                        <img src="/images/tbs-logo.png" alt="TBS Group Logo" className="w-full h-full object-contain brightness-0 invert" />
                      </div>
                      <span className="block text-[10px] font-mono text-[#08221a] font-bold">
                        {prod.code}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#08221a] transition-colors truncate">
                      {prod.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Tiêu chuẩn SKECHERS Global
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
