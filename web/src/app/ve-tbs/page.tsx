"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  IconBuildingFactory2,
  IconTruckDelivery,
  IconBuildingStore,
  IconBriefcase,
  IconCpu,
  IconShieldCheck,
  IconAward,
  IconUsers,
  IconHistory,
  IconArrowRight,
  IconCheck,
  IconSparkles,
} from "@tabler/icons-react";

const STATS = [
  { label: "Cán Bộ CNV", value: "50,000+", desc: "Nguồn nhân lực chất lượng cao trên toàn quốc" },
  { label: "Năm Phát Triển", value: "35+ Năm", desc: "Hành trình bền vững từ năm 1989" },
  { label: "Ngành Trụ Cột", value: "06 Ngành", desc: "Sản xuất, Logistics, BĐS & Thương mại" },
  { label: "Năng Lực Xuất Khẩu", value: "30M+", desc: "Sản phẩm giày da & túi xách mỗi năm" },
];

const TIMELINE = [
  {
    year: "1989",
    title: "Khởi Đầu Hành Trình",
    desc: "Thành lập xưởng sản xuất giày nhỏ đầu tiên tại tỉnh Bình Dương với tinh thần kiên cường và khát vọng vươn tầm quốc tế.",
  },
  {
    year: "2000s",
    title: "Hợp Tác Chiến Lược Toàn Cầu",
    desc: "Trở thành đối tác sản xuất chiến lược của các thương hiệu hàng đầu thế giới như Skechers, Decathlon, Coach.",
  },
  {
    year: "2010s",
    title: "Phát Triển Hệ Sinh Thái Đa Ngành",
    desc: "Mở rộng sang Hạ tầng Logistics (ICD TBS Logistics), Bất động sản (TBS Land), Khách sạn (Mai House) và Sân golf (Montgomerie Links).",
  },
  {
    year: "2026",
    title: "Tiên Phong Chuyển Đổi Số 4.0",
    desc: "Đầu tư mạnh mẽ vào Smart Factory, OEE Real-time, Ticket Số hóa Bảo trì và Trí tuệ nhân tạo Kaizen AI trong vận hành chuỗi.",
  },
];

const PILLARS = [
  {
    id: "footwear",
    title: "Sản Xuất Giày Da",
    subtitle: "Trụ cột cốt lõi sản xuất công nghiệp",
    description:
      "TBS Group sở hữu chuỗi nhà máy hiện đại tại Bình Dương, Đồng Nai, An Giang với công nghệ tự động hóa tiến tiến, sản xuất hơn 30 triệu đôi giày mỗi năm cho các thương hiệu hàng đầu như Skechers, Decathlon.",
    image: "/images/tbs-factory-plant.png",
    icon: IconBuildingFactory2,
    badge: "Xuất Khẩu Toàn Cầu",
  },
  {
    id: "logistics",
    title: "Hạ Tầng Logistics & ICD",
    subtitle: "Trung tâm tiếp vận quy mô hàng đầu",
    description:
      "ICD TBS Logistics sở hữu hơn 115,000 m² kho bãi đạt chuẩn quốc tế, kết nối giao thông huyết mạch, cung cấp dịch vụ logistics trọn gói từ kho vận, hải quan đến vận tải chuỗi cung ứng.",
    image: "/images/tbs-logistics-hub.png",
    icon: IconTruckDelivery,
    badge: "115,000 m² Kho Vận",
  },
  {
    id: "retail",
    title: "Thương Mại & Bán Lẻ Skechers",
    subtitle: "Chuỗi phân phối & trải nghiệm khách hàng",
    description:
      "Văn Phòng Chuỗi Skechers - TBS Group vận hành hệ thống cửa hàng bán lẻ hiện đại trên toàn quốc, mang lại dịch vụ khách hàng xuất sắc và giải pháp quản lý hàng hóa thời gian thực.",
    image: "/images/tbs-skechers-store.png",
    icon: IconBuildingStore,
    badge: "Hệ Thống Chuỗi Chuẩn Quốc Tế",
  },
  {
    id: "digital",
    title: "Công Nghệ Số & Vận Hành 4.0",
    subtitle: "Chuyển đổi số toàn diện doanh nghiệp",
    description:
      "Ứng dụng công nghệ Cloudflare Workers, Next.js Native, đo lường OEE dừng máy thời gian thực, ticket Gemba Walk số hóa và phân tích dữ liệu AI giúp tối ưu hiệu suất 24/7.",
    image: "/images/tbs-hq-hero.png",
    icon: IconCpu,
    badge: "Smart Factory & AI Kaizen",
  },
];

export default function VeTBSPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#04120d] text-white font-sans antialiased selection:bg-[#2fd39a] selection:text-[#04120d]">
      <Header />

      <main className="flex-1">
        {/* Hero Section — Editorial Dark Glass Aesthetic */}
        <section className="relative pt-32 pb-24 md:pt-44 md:pb-36 overflow-hidden">
          {/* Background Image with Dark Emerald Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/tbs-hq-hero.png"
              alt="TBS Group Headquarters"
              className="w-full h-full object-cover object-center opacity-30 scale-105 animate-pulse transition-transform duration-10000"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#04120d]/80 via-[#04120d]/95 to-[#04120d]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f4133]/40 via-transparent to-transparent" />
          </div>

          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0f4133]/80 border border-[#2fd39a]/40 backdrop-blur-md shadow-lg shadow-emerald-950/50 text-[#2fd39a] text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-500">
                <IconSparkles size={14} className="animate-spin" />
                <span>Tập Đoàn Đa Ngành Hàng Đầu Việt Nam</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-[1.08] font-display">
                TẬP ĐOÀN <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2fd39a] via-[#f2dc9a] to-[#2fd39a]">TBS GROUP</span>
              </h1>

              <p className="text-base sm:text-xl text-gray-300 font-medium leading-relaxed max-w-3xl mx-auto">
                35 năm bền vững kiến tạo hệ sinh thái sản xuất công nghiệp, logistics, bất động sản và thương mại dịch vụ số hóa chuẩn mực quốc tế.
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/careers"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#2fd39a] to-[#006838] text-[#04120d] font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-emerald-950/60 hover:brightness-110 active:scale-95 transition-all duration-200"
                >
                  <span>Gia Nhập TBS Group</span>
                  <IconArrowRight size={16} />
                </Link>

                <Link
                  href="/work"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-sm uppercase tracking-wider backdrop-blur-md transition-all duration-200 active:scale-95"
                >
                  <span>Hệ Thống Quản Trị</span>
                </Link>
              </div>
            </div>

            {/* Key Statistics Bento Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-8 border-t border-white/10">
              {STATS.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-[#08221a]/80 border border-[#2fd39a]/25 rounded-2xl p-5 backdrop-blur-md shadow-lg text-center hover:border-[#2fd39a]/50 transition-colors"
                >
                  <div className="text-2xl sm:text-4xl font-black text-[#f2dc9a] font-mono tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">
                    {stat.label}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 leading-snug">
                    {stat.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: 6 Ngành Trụ Cột Chiến Lược */}
        <section className="py-20 bg-[#061812] border-t border-white/10 relative">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono font-bold text-[#2fd39a] uppercase tracking-widest block">
                HỆ SINH THÁI ĐA NGÀNH
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
                Các Ngành Trụ Cột Chiến Lược
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                TBS Group liên tục đầu tư và mở rộng quy mô trên 6 lĩnh vực chính, đóng góp tích cực vào sự phát triển kinh tế xã hội đất nước.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {PILLARS.map((pillar) => {
                const IconComponent = pillar.icon;
                return (
                  <div
                    key={pillar.id}
                    className="group bg-[#08221a]/90 border border-[#2fd39a]/30 rounded-3xl overflow-hidden shadow-2xl hover:border-[#2fd39a]/70 transition-all duration-300 flex flex-col"
                  >
                    {/* Pillar Image Frame */}
                    <div className="relative h-64 sm:h-72 overflow-hidden bg-black/40">
                      <img
                        src={pillar.image}
                        alt={pillar.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#08221a] via-transparent to-black/30" />
                      <div className="absolute top-4 left-4 bg-[#04120d]/80 border border-[#2fd39a]/40 px-3.5 py-1 rounded-full text-[11px] font-bold text-[#2fd39a] backdrop-blur-md">
                        {pillar.badge}
                      </div>
                    </div>

                    {/* Pillar Content */}
                    <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#2fd39a]/15 text-[#2fd39a] border border-[#2fd39a]/30 flex items-center justify-center font-bold">
                            <IconComponent size={22} />
                          </div>
                          <div>
                            <h3 className="text-xl font-extrabold text-white group-hover:text-[#2fd39a] transition-colors">
                              {pillar.title}
                            </h3>
                            <span className="text-xs text-[#f2dc9a] font-medium">
                              {pillar.subtitle}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed pt-2">
                          {pillar.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#2fd39a]">
                        <span>Tiêu chuẩn ISO & OEE 4.0</span>
                        <IconArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: Lịch Sử 35 Năm Phát Triển */}
        <section className="py-20 bg-[#04120d] relative overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
            <div className="max-w-3xl mb-16 space-y-3">
              <span className="text-xs font-mono font-bold text-[#f2dc9a] uppercase tracking-widest block">
                HÀNH TRÌNH BỀN VỮNG
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
                35 Năm Lịch Sử & Phát Triển
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Từ những bước khởi đầu kiên cường đến vị thế tập đoàn đa ngành có tầm ảnh hưởng quốc tế.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TIMELINE.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#08221a]/60 border border-[#2fd39a]/25 rounded-3xl p-6 relative hover:border-[#2fd39a]/60 transition-colors backdrop-blur-sm"
                >
                  <div className="text-4xl font-black font-mono text-[#2fd39a] mb-3">
                    {item.year}
                  </div>
                  <h4 className="text-base font-extrabold text-white mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Mối Quan Hệ Chiến Lược Skechers & Số Hóa Vận Hành */}
        <section className="py-20 bg-[#08221a] border-t border-white/10 relative">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
            <div className="bg-[#04120d] border border-[#2fd39a]/40 rounded-3xl p-8 sm:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2fd39a]/10 text-[#2fd39a] text-xs font-bold border border-[#2fd39a]/30">
                  <IconShieldCheck size={16} />
                  <span>Văn Phòng Chuỗi Skechers - TBS Group</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-white uppercase leading-tight">
                  Đối Tác Sản Xuất & Phân Phối Chuỗi Skechers Toàn Cầu
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Với năng lực sản xuất chuẩn mực và quản lý vận hành hiện đại, Văn Phòng Chuỗi Skechers thuộc TBS Group giữ vai trò then chốt trong việc duy trì chuỗi cung ứng ổn định, chất lượng đồng nhất và chuyển đổi số quy trình bảo trì, kiểm toán Gemba Walk thời gian thực.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-200 font-medium">
                    <IconCheck size={16} className="text-[#2fd39a]" />
                    <span>Đo lường OEE dừng máy tự động</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-200 font-medium">
                    <IconCheck size={16} className="text-[#2fd39a]" />
                    <span>Ticket số hóa bảo trì bằng mã QR</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-200 font-medium">
                    <IconCheck size={16} className="text-[#2fd39a]" />
                    <span>Hệ thống phân tích Kaizen AI</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-200 font-medium">
                    <IconCheck size={16} className="text-[#2fd39a]" />
                    <span>An ninh dữ liệu Cloudflare Workers</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="rounded-2xl overflow-hidden border border-[#2fd39a]/30 shadow-2xl">
                  <img
                    src="/images/tbs-skechers-store.png"
                    alt="Skechers Retail Store"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
