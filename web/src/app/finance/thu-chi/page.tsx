"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconPlus, IconSearch, IconFilter, IconDownload,
  IconCash, IconReceipt, IconArrowUpRight, IconArrowDownRight,
  IconClock, IconCircleCheck, IconAlertCircle, IconChevronRight,
  IconEye, IconPrinter, IconDotsVertical, IconX, IconCheck,
  IconCalendarEvent, IconWallet, IconBuildingBank,
} from "@tabler/icons-react";

const TABS = ["Tất cả", "Phiếu thu", "Phiếu chi", "Tạm ứng", "Hoàn ứng"];
const STATUS_COLOR: Record<string, string> = {
  "Đã duyệt": "bg-emerald-100 text-emerald-700",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Từ chối": "bg-red-100 text-red-700",
  "Nháp": "bg-gray-100 text-gray-600",
};

const TRANSACTIONS = [
  { id: "PT-2026-0801", type: "Phiếu thu", date: "15/08/2026", amount: 142_000_000, desc: "Thu tiền bán hàng SKECHERS tháng 8", dept: "Kinh Doanh", status: "Đã duyệt", cashier: "Trần Thị Thu Hương" },
  { id: "PC-2026-0812", type: "Phiếu chi", date: "14/08/2026", amount: -38_500_000, desc: "Chi phí mua vật tư sản xuất nhà máy A1", dept: "Sản Xuất", status: "Đã duyệt", cashier: "Phạm Văn Đức" },
  { id: "TU-2026-0045", type: "Tạm ứng", date: "13/08/2026", amount: -15_000_000, desc: "Tạm ứng công tác Hà Nội – Nguyễn Văn Minh", dept: "Logistics", status: "Đã duyệt", cashier: "Trần Thị Thu Hương" },
  { id: "PC-2026-0809", type: "Phiếu chi", date: "12/08/2026", amount: -8_200_000, desc: "Chi phí văn phòng phẩm & dịch vụ tháng 8", dept: "Hành Chánh", status: "Chờ duyệt", cashier: "Lê Thị Minh Châu" },
  { id: "HU-2026-0031", type: "Hoàn ứng", date: "11/08/2026", amount: 3_800_000, desc: "Hoàn ứng công tác Đồng Nai – Nguyễn Văn Minh", dept: "Logistics", status: "Đã duyệt", cashier: "Phạm Văn Đức" },
  { id: "PT-2026-0799", type: "Phiếu thu", date: "10/08/2026", amount: 85_000_000, desc: "Thu hồi công nợ NCC Vật tư Minh Long", dept: "Mua Hàng", status: "Đã duyệt", cashier: "Trần Thị Thu Hương" },
  { id: "PC-2026-0805", type: "Phiếu chi", date: "09/08/2026", amount: -52_300_000, desc: "Thanh toán lương bộ phận R&D tháng 7", dept: "R&D", status: "Đã duyệt", cashier: "Phạm Văn Đức" },
  { id: "TU-2026-0044", type: "Tạm ứng", date: "08/08/2026", amount: -5_000_000, desc: "Tạm ứng mua vật tư sửa chữa khẩn cấp", dept: "Bảo Trì", status: "Từ chối", cashier: "Trần Thị Thu Hương" },
];

const QUICK_STATS = [
  { label: "Tổng thu tháng 8", value: "247.3M", change: "+12.4%", up: true, icon: IconArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Tổng chi tháng 8", value: "184.1M", change: "-3.2%", up: false, icon: IconArrowDownRight, color: "text-rose-500", bg: "bg-rose-50" },
  { label: "Quỹ tiền mặt", value: "63.2M", change: "Cân đối", up: true, icon: IconWallet, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Số dư ngân hàng", value: "1.84 tỷ", change: "Vietcombank", up: true, icon: IconBuildingBank, color: "text-violet-600", bg: "bg-violet-50" },
];

export default function ThuChiPage() {
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState("Phiếu thu");

  const filtered = TRANSACTIONS.filter(t => {
    const matchTab = activeTab === "Tất cả" || t.type === activeTab;
    const matchSearch = !search || t.id.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const fmt = (n: number) => {
    const abs = Math.abs(n);
    const str = abs >= 1_000_000
      ? (abs / 1_000_000).toFixed(1) + "M"
      : abs.toLocaleString("vi-VN");
    return (n < 0 ? "−" : "+") + str + " đ";
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/work?dept=finance" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <IconArrowLeft size={20} className="text-gray-500" />
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <IconCash size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-700 text-gray-900 leading-tight">Thu – Chi</h1>
                <p className="text-xs text-gray-400">Kế toán & Quản trị</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-500 text-gray-600 hover:bg-gray-50 transition-colors">
              <IconDownload size={14} />
              Xuất báo cáo
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <IconPlus size={14} />
              Tạo phiếu mới
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-gray-500 font-500">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon size={15} className={s.color} />
                </div>
              </div>
              <p className="text-2xl font-800 text-gray-900">{s.value}</p>
              <p className={`text-xs mt-1 font-500 ${s.up ? "text-emerald-600" : "text-rose-500"}`}>{s.change}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-1 p-1 bg-gray-50 rounded-xl w-fit">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-600 transition-all ${activeTab === t ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm mã phiếu, nội dung..."
                  className="pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                />
              </div>
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <IconFilter size={14} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Mã phiếu", "Loại", "Ngày", "Nội dung", "Phòng ban", "Số tiền", "Trạng thái", "Thủ quỹ", ""].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-600 text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="px-6 py-3.5">
                      <span className="text-xs font-700 text-gray-900 font-mono">{tx.id}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-600 ${
                        tx.type === "Phiếu thu" ? "bg-emerald-50 text-emerald-700" :
                        tx.type === "Phiếu chi" ? "bg-rose-50 text-rose-600" :
                        tx.type === "Tạm ứng" ? "bg-amber-50 text-amber-700" :
                        "bg-blue-50 text-blue-600"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">{tx.date}</td>
                    <td className="px-6 py-3.5 max-w-xs">
                      <p className="text-xs text-gray-700 truncate">{tx.desc}</p>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">{tx.dept}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-sm font-700 ${tx.amount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {fmt(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${STATUS_COLOR[tx.status]}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">{tx.cashier}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100"><IconEye size={13} className="text-gray-500" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100"><IconPrinter size={13} className="text-gray-500" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100"><IconDotsVertical size={13} className="text-gray-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-400">Không tìm thấy phiếu nào phù hợp.</div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Hiển thị {filtered.length} / {TRANSACTIONS.length} phiếu</p>
            <Link href="#" className="text-xs font-600 text-emerald-600 hover:underline flex items-center gap-1">
              Xem toàn bộ lịch sử <IconChevronRight size={13} />
            </Link>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-700 text-gray-900">Tạo phiếu mới</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <IconX size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-600 text-gray-600 mb-1.5 block">Loại phiếu</label>
                <div className="grid grid-cols-4 gap-2">
                  {["Phiếu thu", "Phiếu chi", "Tạm ứng", "Hoàn ứng"].map(t => (
                    <button key={t} onClick={() => setCreateType(t)}
                      className={`py-2 rounded-lg text-xs font-600 border transition-all ${createType === t ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: "Nội dung", placeholder: "Mô tả nội dung giao dịch...", type: "text" },
                { label: "Số tiền (VNĐ)", placeholder: "0", type: "number" },
                { label: "Ngày thực hiện", placeholder: "", type: "date" },
                { label: "Phòng ban", placeholder: "Chọn phòng ban...", type: "text" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-600 text-gray-600 mb-1.5 block">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                </div>
              ))}
              <div>
                <label className="text-xs font-600 text-gray-600 mb-1.5 block">Ghi chú</label>
                <textarea rows={3} placeholder="Ghi chú thêm..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-600 text-gray-600 hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                <IconCheck size={15} />
                Lưu & Gửi duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
