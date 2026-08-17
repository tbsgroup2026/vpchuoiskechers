"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconSearch, IconFilter, IconDownload, IconPlus,
  IconAlertTriangle, IconChevronRight, IconX, IconCheck, IconCalendar,
  IconBuildingStore, IconArrowUp, IconArrowDown, IconArrowsRightLeft,
  IconBell, IconEye, IconSend,
} from "@tabler/icons-react";

const RECEIVABLES = [
  { id: "CN-THU-001", partner: "SKECHERS Vietnam Ltd.", type: "Phải thu", amount: 285_000_000, due: "20/08/2026", daysLeft: 3, status: "Gần đến hạn", contact: "Mr. David Chen" },
  { id: "CN-THU-002", partner: "Đại lý Bình Dương No.1", type: "Phải thu", amount: 48_500_000, due: "25/08/2026", daysLeft: 8, status: "Bình thường", contact: "Lê Văn Hùng" },
  { id: "CN-THU-003", partner: "Chuỗi SKECHERS HCM", type: "Phải thu", amount: 124_000_000, due: "05/08/2026", daysLeft: -10, status: "Quá hạn", contact: "Nguyễn Thị Lan" },
  { id: "CN-CHI-001", partner: "Cty TNHH Vật Tư Minh Long", type: "Phải trả", amount: 92_300_000, due: "18/08/2026", daysLeft: 1, status: "Gần đến hạn", contact: "Minh Long Sales" },
  { id: "CN-CHI-002", partner: "Cty CP Hoá Chất Thuận An", type: "Phải trả", amount: 12_300_000, due: "30/08/2026", daysLeft: 13, status: "Bình thường", contact: "Sales Dept" },
  { id: "CN-CHI-003", partner: "Cty TNHH Đế Giày Phú Cường", type: "Phải trả", amount: 56_800_000, due: "01/08/2026", daysLeft: -14, status: "Quá hạn", contact: "Phú Cường KT" },
];

const STATUS_CONF: Record<string, { bg: string; text: string; dot: string }> = {
  "Bình thường": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Gần đến hạn": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Quá hạn": { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

const SUMMARY = [
  { label: "Tổng phải thu", value: "457.5M", note: "3 đối tác", icon: IconArrowDown, color: "text-emerald-600 bg-emerald-50" },
  { label: "Tổng phải trả", value: "161.4M", note: "3 nhà cung cấp", icon: IconArrowUp, color: "text-rose-500 bg-rose-50" },
  { label: "Quá hạn", value: "180.8M", note: "2 khoản", icon: IconAlertTriangle, color: "text-red-600 bg-red-50" },
  { label: "Gần đến hạn", value: "377.3M", note: "Trong 7 ngày", icon: IconBell, color: "text-amber-600 bg-amber-50" },
];

export default function CongNoPage() {
  const [filter, setFilter] = useState("Tất cả");
  const [search, setSearch] = useState("");

  const filtered = RECEIVABLES.filter(r => {
    const matchFilter = filter === "Tất cả" || r.type === filter || (filter === "Quá hạn" && r.status === "Quá hạn");
    const matchSearch = !search || r.partner.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

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
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <IconArrowsRightLeft size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-700 text-gray-900">Công nợ</h1>
                <p className="text-xs text-gray-400">Kế toán & Quản trị</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50">
              <IconBell size={14} /> Cảnh báo công nợ
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-600 hover:bg-violet-700 shadow-sm">
              <IconPlus size={14} /> Thêm công nợ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Alert quá hạn */}
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <IconAlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-700 text-red-700">2 khoản công nợ quá hạn cần xử lý ngay</p>
            <p className="text-xs text-red-600 mt-0.5">Tổng giá trị 180.8M đ — Chuỗi SKECHERS HCM (10 ngày) và Đế Giày Phú Cường (14 ngày)</p>
          </div>
          <button className="ml-auto px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-600 hover:bg-red-700 whitespace-nowrap">Xem ngay</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SUMMARY.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color.split(" ")[1]}`}>
                  <s.icon size={15} className={s.color.split(" ")[0]} />
                </div>
              </div>
              <p className="text-2xl font-800 text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.note}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-1 p-1 bg-gray-50 rounded-xl w-fit">
              {["Tất cả", "Phải thu", "Phải trả", "Quá hạn"].map(t => (
                <button key={t} onClick={() => setFilter(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-600 transition-all ${filter === t ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="relative">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tên đối tác, mã CN..."
                className="pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Mã CN", "Đối tác", "Loại", "Số tiền", "Đến hạn", "Tình trạng", "Liên hệ", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-600 text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => {
                  const conf = STATUS_CONF[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="px-5 py-3.5"><span className="text-xs font-700 font-mono text-gray-800">{r.id}</span></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                            <IconBuildingStore size={13} className="text-violet-600" />
                          </div>
                          <span className="text-xs text-gray-700 font-500">{r.partner}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${r.type === "Phải thu" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>{r.type}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-800 text-gray-900">
                        {(r.amount / 1_000_000).toFixed(1)}M đ
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-gray-700">{r.due}</p>
                        <p className={`text-xs font-600 mt-0.5 ${r.daysLeft < 0 ? "text-red-500" : r.daysLeft <= 7 ? "text-amber-600" : "text-gray-400"}`}>
                          {r.daysLeft < 0 ? `Quá ${Math.abs(r.daysLeft)} ngày` : `Còn ${r.daysLeft} ngày`}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-600 w-fit ${conf.bg} ${conf.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{r.contact}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100"><IconEye size={13} className="text-gray-500" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100"><IconSend size={13} className="text-gray-500" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">{filtered.length} / {RECEIVABLES.length} khoản công nợ</p>
          </div>
        </div>
      </main>
    </div>
  );
}
