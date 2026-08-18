"use client";

import React, { useState } from "react";
import FinanceShell from "@/components/FinanceShell";
import {
  IconChartBar,
  IconCheck,
  IconDownload,
  IconFileSpreadsheet,
  IconFileText,
  IconPrinter,
  IconTrendingUp,
} from "@tabler/icons-react";

export default function BaoCaoPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reports = [
    {
      code: "BC-01",
      title: "Báo cáo Kết quả Hoạt động Kinh doanh & Sản xuất (P&L)",
      period: "Tháng 08/2026",
      desc: "Doanh thu 12.4 tỷ, Chi phí 3.1 tỷ, Lợi nhuận ròng 2.6 tỷ",
      type: "Định kỳ tháng",
    },
    {
      code: "BC-02",
      title: "Báo cáo Lưu chuyển Tiền tệ (Dòng tiền ròng Cash Flow)",
      period: "Tháng 08/2026",
      desc: "Số dư quỹ 63.2M đ, Tiền gửi Vietcombank 1.84 tỷ đ",
      type: "Định kỳ tháng",
    },
    {
      code: "BC-03",
      title: "Báo cáo Tổng hợp Thu - Chi & Tạm ứng theo Phòng ban",
      period: "Tháng 08/2026",
      desc: "Chi tiết 8 phiếu phát sinh, 2 tạm ứng công tác",
      type: "Nội bộ",
    },
    {
      code: "BC-04",
      title: "Báo cáo Tuân thủ Định mức Ngân sách (Budget vs Actual)",
      period: "Tháng 08/2026",
      desc: "R&D vượt 8.6%, Sản xuất NM1 đạt 96.5% định mức",
      type: "Quản trị",
    },
  ];

  return (
    <FinanceShell
      breadcrumbs={[
        { label: "Kế toán & Quản trị", href: "/finance" },
        { label: "Báo cáo", href: "/finance/bao-cao" },
        { label: "Trung tâm báo cáo tài chính" },
      ]}
      title="Trung Tâm Báo Cáo Tài Chính & Quản Trị Dòng Tiền"
      activeSubmenu="Báo cáo tài chính"
    >
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">
            Hệ Thống 8 Báo Cáo Quản Trị Số Hóa TBS Group
          </h3>
          <span className="text-xs font-bold text-slate-500">Kỳ báo cáo: Tháng 08/2026</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {reports.map((rep) => (
            <div
              key={rep.code}
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-[#006838]/60 transition-all flex flex-col justify-between gap-3 shadow-2xs group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-[#006838] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {rep.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {rep.type}
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-900 leading-snug group-hover:text-[#006838] transition-colors">
                  {rep.title}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">{rep.desc}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 font-mono">{rep.period}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => showToast(`📥 Đang xuất báo cáo ${rep.code} dạng Excel XLSX...`)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#006838] hover:bg-emerald-100 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <IconFileSpreadsheet size={14} />
                    <span>Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast(`📄 Đang xuất báo cáo ${rep.code} dạng PDF chuẩn A4...`)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <IconFileText size={14} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <IconCheck size={16} />
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </FinanceShell>
  );
}
