"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconSearch, IconPlus, IconDownload, IconPackage,
  IconArrowUp, IconArrowDown, IconArrowsRightLeft, IconAlertTriangle,
  IconClipboardList, IconBarcode, IconChevronRight, IconHistory,
} from "@tabler/icons-react";

const INVENTORY = [
  { id: "VT-001", name: "Da giày tổng hợp PU nhãn SKECHERS", unit: "m²", qty: 2840, min: 500, cost: 85_000, location: "Kho A1-R01", cat: "Nguyên liệu chính" },
  { id: "VT-002", name: "Đế cao su tổng hợp size EU 36-44", unit: "đôi", qty: 1250, min: 300, cost: 42_000, location: "Kho A2-R03", cat: "Nguyên liệu chính" },
  { id: "VT-003", name: "Chỉ may công nghiệp Coats cuộn 5000m", unit: "cuộn", qty: 380, min: 80, cost: 28_000, location: "Kho VP-R01", cat: "Vật tư tiêu hao" },
  { id: "VT-004", name: "Keo dán đế Bostik PU màu trắng", unit: "kg", qty: 42, min: 50, cost: 180_000, location: "Kho A1-R02", cat: "Vật tư tiêu hao" },
  { id: "VT-005", name: "Hộp carton đóng gói SKECHERS 40x30x20", unit: "cái", qty: 8500, min: 2000, cost: 8_500, location: "Kho TTPP-R01", cat: "Vật tư đóng gói" },
  { id: "VT-006", name: "Mực in nhãn barcode Zebra ZD420", unit: "cuộn", qty: 28, min: 30, cost: 450_000, location: "Kho VP-R02", cat: "Công cụ dụng cụ" },
  { id: "VT-007", name: "Dầu bôi trơn máy may Singer", unit: "lít", qty: 15, min: 10, cost: 120_000, location: "Kho BT-R01", cat: "Vật tư tiêu hao" },
  { id: "VT-008", name: "Băng keo dán thùng 5cm Scotch 3M", unit: "cuộn", qty: 340, min: 100, cost: 15_000, location: "Kho TTPP-R02", cat: "Vật tư đóng gói" },
];

const MOVEMENTS = [
  { type: "Xuất", id: "XK-2026-0441", item: "Da giày PU nhãn SKECHERS", qty: 120, unit: "m²", dept: "Sản xuất A1", date: "15/08", note: "Sản xuất lô SP-08-0441" },
  { type: "Nhập", id: "NK-2026-0218", item: "Đế cao su size EU 36-44", qty: 500, unit: "đôi", dept: "Mua hàng", date: "14/08", note: "Nhập từ NCC Phú Cường" },
  { type: "Xuất", id: "XK-2026-0440", item: "Hộp carton đóng gói", qty: 1200, unit: "cái", dept: "TTPP", date: "13/08", note: "Đóng gói lô hàng xuất Mỹ" },
  { type: "Điều chuyển", id: "DC-2026-0031", item: "Keo dán đế Bostik PU", qty: 8, unit: "kg", dept: "Kho A2", date: "12/08", note: "Bổ sung cho kho A2" },
];

export default function VatTuKhoPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("Tồn kho");
  const lowStock = INVENTORY.filter(i => i.qty <= i.min).length;

  const filtered = INVENTORY.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase())
  );

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
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <IconPackage size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-700 text-gray-900">Vật tư & Kho</h1>
                <p className="text-xs text-gray-400">Kế toán & Quản trị</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50">
              <IconClipboardList size={14} /> Kiểm kê kho
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-600 hover:bg-indigo-700 shadow-sm">
              <IconArrowUp size={14} /> Nhập kho
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-xs font-600 hover:bg-rose-600 shadow-sm">
              <IconArrowDown size={14} /> Xuất kho
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tổng mục vật tư", value: INVENTORY.length, sub: "Đang quản lý", color: "bg-indigo-50 text-indigo-600" },
            { label: "Tồn kho thấp", value: lowStock, sub: "Cần nhập bổ sung", color: "bg-amber-50 text-amber-600" },
            { label: "Nhập kho tháng 8", value: "12 lần", sub: "518 đơn vị", color: "bg-emerald-50 text-emerald-700" },
            { label: "Xuất kho tháng 8", value: "28 lần", sub: "2,840 đơn vị", color: "bg-rose-50 text-rose-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-2">{s.label}</p>
              <p className="text-xl font-800 text-gray-900">{s.value}</p>
              <span className={`text-xs font-500 px-2 py-0.5 rounded-full mt-1.5 inline-block ${s.color}`}>{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Low stock alert */}
        {lowStock > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <IconAlertTriangle size={18} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{lowStock} mục vật tư</strong> tồn kho dưới mức tối thiểu — {INVENTORY.filter(i => i.qty <= i.min).map(i => i.name.split(" ").slice(0, 3).join(" ")).join(", ")}
            </p>
            <button className="ml-auto px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-600 whitespace-nowrap hover:bg-amber-600">Đặt hàng ngay</button>
          </div>
        )}

        {/* Tab switcher */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 pt-5 flex items-center justify-between">
            <div className="flex gap-1 p-1 bg-gray-50 rounded-xl w-fit">
              {["Tồn kho", "Lịch sử N-X"].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-600 transition-all ${tab === t ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên vật tư, mã..."
                  className="pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg w-52 focus:outline-none" />
              </div>
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><IconDownload size={14} className="text-gray-500" /></button>
            </div>
          </div>

          {tab === "Tồn kho" ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Mã VT", "Tên vật tư", "Danh mục", "Tồn kho", "Tối thiểu", "Đơn giá", "Vị trí kho", ""].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-600 text-gray-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(item => {
                    const isLow = item.qty <= item.min;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5"><span className="text-xs font-700 font-mono text-gray-700">{item.id}</span></td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <p className="text-xs font-500 text-gray-800 truncate">{item.name}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{item.cat}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-sm font-800 ${isLow ? "text-red-600" : "text-gray-900"}`}>
                            {item.qty.toLocaleString("vi-VN")} {item.unit}
                          </span>
                          {isLow && <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-600">Thấp!</span>}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{item.min} {item.unit}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-700 font-500">{item.cost.toLocaleString("vi-VN")} đ</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{item.location}</td>
                        <td className="px-5 py-3.5">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100"><IconBarcode size={13} className="text-gray-400" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {MOVEMENTS.map(mv => (
                <div key={mv.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mv.type === "Nhập" ? "bg-emerald-100" : mv.type === "Xuất" ? "bg-rose-100" : "bg-blue-100"}`}>
                    {mv.type === "Nhập" ? <IconArrowDown size={15} className="text-emerald-700" /> :
                     mv.type === "Xuất" ? <IconArrowUp size={15} className="text-rose-600" /> :
                     <IconArrowsRightLeft size={15} className="text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-700 font-mono text-gray-700">{mv.id}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-600 ${mv.type === "Nhập" ? "bg-emerald-50 text-emerald-700" : mv.type === "Xuất" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>{mv.type}</span>
                    </div>
                    <p className="text-xs text-gray-700 mt-0.5 truncate">{mv.item} — <span className="font-600">{mv.qty} {mv.unit}</span></p>
                    <p className="text-xs text-gray-400">{mv.note}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{mv.dept}</p>
                    <p className="text-xs text-gray-400">{mv.date}/08</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-4 border-t border-gray-100">
            <button className="text-xs font-600 text-indigo-600 hover:underline flex items-center gap-1">
              Xem toàn bộ <IconChevronRight size={13} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
