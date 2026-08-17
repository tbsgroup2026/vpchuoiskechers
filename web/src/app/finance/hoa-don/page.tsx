"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconPlus, IconSearch, IconFilter, IconDownload,
  IconFileInvoice, IconUpload, IconLink, IconCheck, IconX,
  IconChevronRight, IconEye, IconAlertCircle, IconCircleCheck,
  IconClock, IconFileCheck, IconPaperclip, IconArrowsRightLeft,
} from "@tabler/icons-react";

const STATUS_COLOR: Record<string, string> = {
  "Đã đối chiếu": "bg-emerald-100 text-emerald-700",
  "Chờ xử lý": "bg-amber-100 text-amber-700",
  "Có sai lệch": "bg-red-100 text-red-700",
  "Chưa nhập": "bg-gray-100 text-gray-500",
};

const INVOICES = [
  { id: "HĐ-IN-2026-0142", type: "Đầu vào", date: "15/08/2026", supplier: "Cty TNHH Vật Tư Minh Long", amount: 48_500_000, tax: 4_850_000, status: "Đã đối chiếu", linked: "PC-2026-0812", dept: "Mua Hàng" },
  { id: "HĐ-OUT-2026-0089", type: "Đầu ra", date: "14/08/2026", supplier: "SKECHERS Vietnam Ltd.", amount: 142_000_000, tax: 14_200_000, status: "Đã đối chiếu", linked: "PT-2026-0801", dept: "Kinh Doanh" },
  { id: "HĐ-IN-2026-0139", type: "Đầu vào", date: "12/08/2026", supplier: "Cty CP Hoá Chất Thuận An", amount: 12_300_000, tax: 1_230_000, status: "Chờ xử lý", linked: null, dept: "Sản Xuất" },
  { id: "HĐ-IN-2026-0137", type: "Đầu vào", date: "10/08/2026", supplier: "Cty TNHH Đế Giày Phú Cường", amount: 85_000_000, tax: 8_500_000, status: "Có sai lệch", linked: "PC-2026-0799", dept: "Sản Xuất" },
  { id: "HĐ-OUT-2026-0086", type: "Đầu ra", date: "08/08/2026", supplier: "Đại lý SKECHERS HCM", amount: 62_400_000, tax: 6_240_000, status: "Đã đối chiếu", linked: "PT-2026-0785", dept: "Kinh Doanh" },
  { id: "HĐ-IN-2026-0131", type: "Đầu vào", date: "05/08/2026", supplier: "Cty CP Dịch Vụ Hậu Cần VN", amount: 24_800_000, tax: 2_480_000, status: "Chưa nhập", linked: null, dept: "Logistics" },
];

const STATS = [
  { label: "Tổng hóa đơn tháng 8", value: "47 hóa đơn", sub: "28 đầu vào / 19 đầu ra", color: "bg-blue-50 text-blue-600" },
  { label: "Tổng giá trị đầu vào", value: "312.4M", sub: "+8.1% tháng trước", color: "bg-rose-50 text-rose-600" },
  { label: "Tổng giá trị đầu ra", value: "498.7M", sub: "+14.2% tháng trước", color: "bg-emerald-50 text-emerald-700" },
  { label: "Chưa đối chiếu", value: "6 hóa đơn", sub: "Cần xử lý ngay", color: "bg-amber-50 text-amber-600" },
];

export default function HoaDonPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [showUpload, setShowUpload] = useState(false);

  const filtered = INVOICES.filter(inv => {
    const matchType = typeFilter === "Tất cả" || inv.type === typeFilter;
    const matchSearch = !search || inv.id.toLowerCase().includes(search.toLowerCase()) || inv.supplier.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#f7f8fc]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/work?dept=finance" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <IconArrowLeft size={20} className="text-gray-500" />
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <IconFileInvoice size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-700 text-gray-900 leading-tight">Hóa đơn & Chứng từ</h1>
                <p className="text-xs text-gray-400">Kế toán & Quản trị</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50 transition-colors">
              <IconUpload size={14} />
              Nhập hóa đơn
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50 transition-colors">
              <IconDownload size={14} />
              Xuất danh sách
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-2">{s.label}</p>
              <p className="text-xl font-800 text-gray-900">{s.value}</p>
              <p className={`text-xs mt-1.5 font-500 px-2 py-0.5 rounded-full w-fit ${s.color}`}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-1 p-1 bg-gray-50 rounded-xl w-fit">
              {["Tất cả", "Đầu vào", "Đầu ra"].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-600 transition-all ${typeFilter === t ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Mã HĐ, nhà cung cấp..."
                  className="pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><IconFilter size={14} className="text-gray-500" /></button>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Mã hóa đơn", "Loại", "Ngày", "Đối tác", "Giá trị (VAT)", "Thuế VAT", "Liên kết phiếu", "Trạng thái", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-600 text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-700 text-gray-900 font-mono">{inv.id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${inv.type === "Đầu vào" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{inv.date}</td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-xs text-gray-700 truncate">{inv.supplier}</p>
                      <p className="text-xs text-gray-400">{inv.dept}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-700 text-gray-800">
                      {(inv.amount / 1_000_000).toFixed(1)}M đ
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {(inv.tax / 1_000_000).toFixed(2)}M đ
                    </td>
                    <td className="px-5 py-3.5">
                      {inv.linked ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600 font-600">
                          <IconLink size={12} />
                          {inv.linked}
                        </span>
                      ) : (
                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                          <IconArrowsRightLeft size={12} />
                          Đối chiếu
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${STATUS_COLOR[inv.status]}`}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100"><IconEye size={13} className="text-gray-500" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100"><IconPaperclip size={13} className="text-gray-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">{filtered.length} / {INVOICES.length} hóa đơn</p>
            <button className="text-xs font-600 text-blue-600 hover:underline flex items-center gap-1">
              Tra cứu toàn bộ <IconChevronRight size={13} />
            </button>
          </div>
        </div>
      </main>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-700 text-gray-900">Nhập hóa đơn</h2>
              <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><IconX size={16} className="text-gray-500" /></button>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <IconUpload size={32} className="text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-600 text-gray-700">Kéo thả file hoặc nhấn để chọn</p>
              <p className="text-xs text-gray-400 mt-1">Hỗ trợ: PDF, XML (hóa đơn điện tử), XLSX</p>
            </div>
            <div className="space-y-3 mt-5">
              {[{ label: "Loại hóa đơn", placeholder: "Đầu vào / Đầu ra" }, { label: "Số hóa đơn", placeholder: "Nhập số hóa đơn..." }, { label: "Ngày hóa đơn", placeholder: "" }].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-600 text-gray-600 mb-1 block">{f.label}</label>
                  <input placeholder={f.placeholder} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowUpload(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-600 text-gray-600 hover:bg-gray-50">Hủy</button>
              <button className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                <IconCheck size={15} /> Nhập hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
