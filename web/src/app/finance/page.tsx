"use client";
import React from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconCash, IconFileInvoice, IconArrowsRightLeft,
  IconChartBar, IconChartPie, IconBuilding, IconPackage, IconRefresh,
  IconCircleCheck, IconChevronRight, IconTrendingUp,
} from "@tabler/icons-react";

const MODULES = [
  {
    href: "/finance/thu-chi",
    icon: IconCash,
    color: "bg-emerald-600",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    title: "Thu – Chi",
    desc: "Phiếu thu, phiếu chi, tạm ứng, hoàn ứng và theo dõi quỹ tiền mặt",
    stat: "8 phiếu tháng này",
  },
  {
    href: "/finance/hoa-don",
    icon: IconFileInvoice,
    color: "bg-blue-600",
    lightColor: "bg-blue-50",
    textColor: "text-blue-700",
    title: "Hóa đơn & Chứng từ",
    desc: "Nhập hóa đơn điện tử, đối chiếu và lưu trữ chứng từ",
    stat: "47 hóa đơn T8",
  },
  {
    href: "/finance/cong-no",
    icon: IconArrowsRightLeft,
    color: "bg-violet-600",
    lightColor: "bg-violet-50",
    textColor: "text-violet-700",
    title: "Công nợ",
    desc: "Phải thu, phải trả, theo dõi hạn thanh toán và cảnh báo quá hạn",
    stat: "2 khoản quá hạn",
    alert: true,
  },
  {
    href: "/finance/ngan-sach",
    icon: IconChartBar,
    color: "bg-cyan-600",
    lightColor: "bg-cyan-50",
    textColor: "text-cyan-700",
    title: "Ngân sách",
    desc: "Lập ngân sách, phân bổ và theo dõi Budget/Actual theo phòng ban",
    stat: "1 PB vượt NS",
    alert: true,
  },
  {
    href: "/finance/chi-phi",
    icon: IconChartPie,
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-700",
    title: "Chi phí",
    desc: "Phân loại chi phí theo danh mục, phòng ban và theo dõi xu hướng",
    stat: "1.77 tỷ đ T8",
  },
  {
    href: "/finance/tai-san",
    icon: IconBuilding,
    color: "bg-teal-600",
    lightColor: "bg-teal-50",
    textColor: "text-teal-700",
    title: "Tài sản",
    desc: "Quản lý tài sản cố định, điều chuyển, khấu hao và thanh lý",
    stat: "1 TS hư hỏng",
    alert: true,
  },
  {
    href: "/finance/vat-tu-kho",
    icon: IconPackage,
    color: "bg-indigo-600",
    lightColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    title: "Vật tư & Kho",
    desc: "Nhập xuất kho, tồn kho và cảnh báo vật tư thấp",
    stat: "2 VT tồn thấp",
    alert: true,
  },
  {
    href: "/finance/doi-soat",
    icon: IconRefresh,
    color: "bg-pink-600",
    lightColor: "bg-pink-50",
    textColor: "text-pink-700",
    title: "Đối soát",
    desc: "Đối soát thu chi, ngân hàng, hóa đơn, công nợ và chứng từ",
    stat: "3 chênh lệch",
    alert: true,
  },
  {
    href: "/finance/phe-duyet",
    icon: IconCircleCheck,
    color: "bg-emerald-700",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-800",
    title: "Phê duyệt",
    desc: "Quy trình duyệt phiếu chi, tạm ứng, mua sắm và điều chỉnh ngân sách",
    stat: "2 chờ duyệt",
    alert: true,
  },
  {
    href: "/finance/bao-cao",
    icon: IconTrendingUp,
    color: "bg-blue-700",
    lightColor: "bg-blue-50",
    textColor: "text-blue-800",
    title: "Báo cáo Quản trị",
    desc: "Tổng hợp toàn bộ báo cáo tài chính, xuất Excel/PDF theo kỳ",
    stat: "8 loại báo cáo",
  },
];

export default function FinanceIndexPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fc]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link href="/work?dept=finance" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <IconArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div className="w-px h-6 bg-gray-200" />
          <div>
            <h1 className="text-sm font-700 text-gray-900">Kế toán & Quản trị</h1>
            <p className="text-xs text-gray-400">Quản lý tài chính, tài sản và báo cáo</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-800 text-gray-900">Chọn chức năng</h2>
          <p className="text-sm text-gray-400 mt-1">10 phân hệ quản trị tài chính nội bộ</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MODULES.map(mod => (
            <Link key={mod.href} href={mod.href}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition-all group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center`}>
                  <mod.icon size={18} className="text-white" />
                </div>
                {mod.alert && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <h3 className="text-sm font-700 text-gray-900 mb-1.5">{mod.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{mod.desc}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${mod.lightColor} ${mod.textColor}`}>
                  {mod.stat}
                </span>
                <IconChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
