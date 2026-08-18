"use client";

import React from "react";
import Link from "next/link";
import FinanceShell from "@/components/FinanceShell";
import {
  IconCoins,
  IconClock,
  IconTrendingUp,
  IconAdjustmentsHorizontal,
  IconWallet,
  IconFileInvoice,
  IconUsers,
  IconCalendarEvent,
  IconChartPie,
  IconDeviceDesktop,
  IconPackage,
  IconArrowsRightLeft,
  IconShieldCheck,
  IconChartBar,
  IconArrowRight,
  IconPlus,
} from "@tabler/icons-react";

const MODULES = [
  {
    href: "/finance/thu-chi",
    icon: IconWallet,
    title: "1. 💰 Thu – Chi",
    badge: "8 phiếu T8",
    desc: ["Tạo phiếu thu / Tạo phiếu chi", "Tạm ứng / Hoàn ứng", "Theo dõi quỹ tiền mặt & NH", "Duyệt phiếu thu/chi & Lịch sử"],
  },
  {
    href: "/finance/hoa-don",
    icon: IconFileInvoice,
    title: "2. 🧾 Hóa đơn & Chứng từ",
    badge: "47 HĐ T8",
    desc: ["Hóa đơn đầu vào & đầu ra", "Nhập & tra cứu hóa đơn", "Đính kèm chứng từ điện tử", "Đối chiếu hóa đơn - Phiếu chi"],
  },
  {
    href: "/finance/cong-no",
    icon: IconUsers,
    title: "3. 🤝 Công nợ",
    badge: "2 quá hạn",
    desc: ["Công nợ phải trả & phải thu", "Danh sách đối tác & NCC", "Theo dõi hạn & quá hạn", "Cảnh báo & đối chiếu công nợ"],
  },
  {
    href: "/finance/ngan-sach",
    icon: IconCalendarEvent,
    title: "4. 📊 Ngân sách",
    badge: "1 PB vượt NS",
    desc: ["Lập & phân bổ ngân sách", "Ngân sách theo PB / Đơn vị", "Theo dõi Budget / Actual", "Cảnh báo vượt & điều chỉnh"],
  },
  {
    href: "/finance/chi-phi",
    icon: IconChartPie,
    title: "5. 💸 Chi phí",
    badge: "1.77 tỷ đ",
    desc: ["Chi phí văn phòng, nhân sự", "Chi phí công tác & R&D", "Chi phí mua sắm & dịch vụ", "Chi phí thuê mặt bằng & vận hành"],
  },
  {
    href: "/finance/tai-san",
    icon: IconDeviceDesktop,
    title: "6. 🏢 Tài sản",
    badge: "1 TS sửa",
    desc: ["Danh sách tài sản & cấp phát", "Bàn giao & điều chuyển TS", "Kiểm kê & theo dõi khấu hao", "Tài sản hư hỏng & thanh lý"],
  },
  {
    href: "/finance/vat-tu-kho",
    icon: IconPackage,
    title: "7. 📦 Vật tư & Kho",
    badge: "2 tồn thấp",
    desc: ["Nhập kho / Xuất kho", "Điều chuyển & kiểm kê kho", "Theo dõi nhập - xuất - tồn", "Cảnh báo tồn kho thấp"],
  },
  {
    href: "/finance/doi-soat",
    icon: IconArrowsRightLeft,
    title: "8. 🔄 Đối soát",
    badge: "3 chênh lệch",
    desc: ["Đối soát thu chi & ngân hàng", "Đối soát hóa đơn & công nợ", "Đối soát chứng từ & NS", "Ghi nhận nguyên nhân lệch"],
  },
  {
    href: "/finance/phe-duyet",
    icon: IconShieldCheck,
    title: "9. ✅ Phê duyệt",
    badge: "2 chờ duyệt",
    desc: ["Quy trình workflow 4 cấp", "Duyệt phiếu chi & tạm ứng", "Duyệt đề nghị mua sắm", "Duyệt điều chỉnh ngân sách"],
  },
  {
    href: "/finance/bao-cao",
    icon: IconChartBar,
    title: "10. 📈 Báo cáo quản trị",
    badge: "8 báo cáo",
    desc: ["BC Thu-Chi & Chi phí", "BC Ngân sách & Công nợ", "BC Tài sản, Kho & Dòng tiền", "Xuất file Excel/PDF định kỳ"],
  },
];

export default function FinanceHubPage() {
  return (
    <FinanceShell
      breadcrumbs={[
        { label: "Kế toán & Quản trị", href: "/finance" },
        { label: "Tổng quan" },
      ]}
      title="Trung Tâm Quản Trị Tài Chính & Kế Toán"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/thu-chi?tab=chi"
            className="px-4 py-2 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <IconPlus size={16} />
            <span>+ Tạo phiếu chi mới</span>
          </Link>
        </div>
      }
    >
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100/80 shadow-2xs">
            <IconCoins size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-500 block truncate">Doanh thu tháng</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
              12.4 tỷ
            </div>
            <span className="text-[10px] font-bold text-emerald-700 mt-0.5 flex items-center gap-0.5">
              +12% so với tháng trước ↑
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100/80 shadow-2xs">
            <IconClock size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-500 block truncate">Chi phí vận hành</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
              3.1 tỷ
            </div>
            <span className="text-[10px] font-bold text-emerald-700 mt-0.5 flex items-center gap-0.5">
              -8% so với tháng trước ↓
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100/80 shadow-2xs">
            <IconTrendingUp size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-500 block truncate">Lợi nhuận ròng</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
              2.6 tỷ
            </div>
            <span className="text-[10px] font-bold text-emerald-700 mt-0.5 flex items-center gap-0.5">
              +18% so với tháng trước ↑
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100/80 shadow-2xs">
            <IconAdjustmentsHorizontal size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-500 block truncate">Tỷ lệ chi phí/doanh thu</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
              25.0%
            </div>
            <span className="text-[10px] font-bold text-emerald-700 mt-0.5 flex items-center gap-0.5">
              -3% so với tháng trước ↓
            </span>
          </div>
        </div>
      </div>

      {/* Grid 10 Modules */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Danh Mục 10 Phân Hệ Nghiệp Vụ Kế Toán
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Truy cập nhanh các nghiệp vụ quản lý tài chính, ngân sách, tài sản và dòng tiền
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {MODULES.map((mod, idx) => {
            const ModIcon = mod.icon;
            return (
              <Link
                key={idx}
                href={mod.href}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-[#006838]/60 hover:shadow-sm transition-all flex flex-col justify-between gap-3 group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-200/50">
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-[#006838] transition-colors leading-tight flex items-center gap-1.5">
                      <ModIcon size={16} className="text-[#006838]" />
                      <span>{mod.title}</span>
                    </h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-[#006838] border border-emerald-100 flex-shrink-0">
                      {mod.badge}
                    </span>
                  </div>

                  <ul className="space-y-0.5 pt-2">
                    {mod.desc.map((d, dIdx) => (
                      <li key={dIdx} className="text-[10px] text-slate-600 flex items-start gap-1 leading-snug">
                        <span className="text-[#006838] font-bold">•</span>
                        <span className="truncate">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-1.5 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-extrabold text-[#006838] group-hover:translate-x-0.5 transition-transform">
                  <span>Mở phân hệ</span>
                  <IconArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </FinanceShell>
  );
}
