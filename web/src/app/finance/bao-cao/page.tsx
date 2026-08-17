"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconDownload, IconTrendingUp, IconTrendingDown,
  IconChartBar, IconFileText, IconCalendar, IconFilter,
  IconArrowRight, IconCircleCheck, IconArrowUp, IconArrowDown,
} from "@tabler/icons-react";

const REPORTS = [
  { id: "BC-THU-CHI", title: "Báo cáo Thu – Chi", desc: "Tổng hợp toàn bộ giao dịch thu chi theo tháng/quý/năm", lastUpdate: "15/08/2026", status: "Sẵn sàng", color: "bg-emerald-50 text-emerald-700", icon: IconTrendingUp },
  { id: "BC-CHI-PHI", title: "Báo cáo Chi phí", desc: "Phân tích chi phí theo danh mục và phòng ban", lastUpdate: "15/08/2026", status: "Sẵn sàng", color: "bg-orange-50 text-orange-600", icon: IconChartBar },
  { id: "BC-NGAN-SACH", title: "Báo cáo Ngân sách", desc: "So sánh Budget vs Actual theo tháng và phòng ban", lastUpdate: "15/08/2026", status: "Sẵn sàng", color: "bg-cyan-50 text-cyan-700", icon: IconChartBar },
  { id: "BC-CONG-NO", title: "Báo cáo Công nợ", desc: "Danh sách công nợ phải thu/trả và quá hạn", lastUpdate: "14/08/2026", status: "Sẵn sàng", color: "bg-violet-50 text-violet-700", icon: IconArrowDown },
  { id: "BC-TAI-SAN", title: "Báo cáo Tài sản", desc: "Danh sách tài sản, khấu hao và giá trị còn lại", lastUpdate: "01/08/2026", status: "Sẵn sàng", color: "bg-teal-50 text-teal-700", icon: IconFileText },
  { id: "BC-KHO", title: "Báo cáo Kho", desc: "Tồn kho, nhập xuất và cảnh báo tồn thấp", lastUpdate: "15/08/2026", status: "Sẵn sàng", color: "bg-indigo-50 text-indigo-700", icon: IconArrowUp },
  { id: "BC-DONG-TIEN", title: "Báo cáo Dòng tiền", desc: "Phân tích dòng tiền vào ra, dự báo tháng tới", lastUpdate: "15/08/2026", status: "Sẵn sàng", color: "bg-blue-50 text-blue-700", icon: IconTrendingUp },
  { id: "BC-PHONG-BAN", title: "Báo cáo theo Phòng ban", desc: "Tổng hợp tài chính phân theo từng phòng ban", lastUpdate: "15/08/2026", status: "Sẵn sàng", color: "bg-pink-50 text-pink-700", icon: IconChartBar },
];

const QUICK_KPI = [
  { label: "Doanh thu T8", value: "498.7M đ", change: "+14.2%", up: true },
  { label: "Chi phí T8", value: "312.4M đ", change: "+3.1%", up: false },
  { label: "Lợi nhuận ròng", value: "186.3M đ", change: "+31.8%", up: true },
  { label: "Dòng tiền cuối T8", value: "1.84 tỷ đ", change: "+8.4%", up: true },
];

const MONTHLY_DATA = [
  { month: "T3", revenue: 38, expense: 29 },
  { month: "T4", revenue: 44, expense: 32 },
  { month: "T5", revenue: 51, expense: 35 },
  { month: "T6", revenue: 58, expense: 38 },
  { month: "T7", revenue: 62, expense: 40 },
  { month: "T8", revenue: 72, expense: 45 },
];

export default function BaoCaoPage() {
  const [period, setPeriod] = useState("Tháng 8/2026");
  const maxVal = Math.max(...MONTHLY_DATA.map(d => Math.max(d.revenue, d.expense)));

  return (
    <div className="min-h-screen bg-[#f7f8fc]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/work?dept=finance" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <IconArrowLeft size={20} className="text-gray-500" />
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
                <IconChartBar size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-700 text-gray-900">Báo cáo Quản trị</h1>
                <p className="text-xs text-gray-400">Kế toán & Quản trị</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none">
              {["Tháng 8/2026", "Tháng 7/2026", "Q3/2026", "6 tháng đầu 2026", "Năm 2026"].map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50">
              <IconFilter size={14} /> Bộ lọc
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_KPI.map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-2">{kpi.label}</p>
              <p className="text-2xl font-800 text-gray-900">{kpi.value}</p>
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-600 ${kpi.up ? "text-emerald-600" : "text-rose-500"}`}>
                {kpi.up ? <IconTrendingUp size={13} /> : <IconTrendingDown size={13} />}
                {kpi.change} so với T7
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-700 text-gray-800">Xu hướng Doanh thu – Chi phí</h2>
              <p className="text-xs text-gray-400 mt-0.5">6 tháng gần nhất · Đơn vị: tỷ đ</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" />Doanh thu</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-400" />Chi phí</span>
            </div>
          </div>
          <div className="flex items-end gap-4 h-48">
            {MONTHLY_DATA.map(d => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 h-40 w-full justify-center">
                  <div className="flex-1 bg-blue-500 rounded-t-lg transition-all hover:bg-blue-400"
                    style={{ height: `${(d.revenue / maxVal) * 100}%` }}
                    title={`Doanh thu: ${d.revenue}M đ`} />
                  <div className="flex-1 bg-rose-300 rounded-t-lg transition-all hover:bg-rose-400"
                    style={{ height: `${(d.expense / maxVal) * 100}%` }}
                    title={`Chi phí: ${d.expense}M đ`} />
                </div>
                <span className="text-xs text-gray-400 font-500">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Report catalog */}
        <div>
          <h2 className="text-sm font-700 text-gray-700 mb-4">Danh sách báo cáo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REPORTS.map(report => (
              <div key={report.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${report.color} flex items-center justify-center`}>
                    <report.icon size={18} />
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity" title="Tải Excel">
                      <IconDownload size={13} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-700 text-gray-900 mb-1.5">{report.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">{report.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <IconCircleCheck size={12} className="text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-600">{report.status}</span>
                  </div>
                  <span className="text-xs text-gray-400">{report.lastUpdate}</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-600 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem báo cáo <IconArrowRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export section */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-base font-700 text-white">Xuất toàn bộ báo cáo {period}</h3>
            <p className="text-xs text-blue-200 mt-1">Tổng hợp tất cả báo cáo tài chính thành một file duy nhất</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 text-sm font-700 hover:bg-blue-50 transition-colors shadow-sm">
              <IconDownload size={16} /> Xuất Excel
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800 text-white text-sm font-700 hover:bg-blue-900 transition-colors">
              <IconFileText size={16} /> Xuất PDF
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
