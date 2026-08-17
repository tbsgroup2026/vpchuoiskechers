"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconSearch, IconPlus, IconDownload, IconQrcode,
  IconTransferIn, IconTransferOut, IconArrowsRightLeft, IconClipboardList,
  IconAlertTriangle, IconChevronRight, IconDeviceLaptop, IconArmchair,
  IconCar, IconTool, IconBuilding, IconTag, IconCircleCheck, IconX, IconCheck,
} from "@tabler/icons-react";

const ASSETS = [
  { id: "TS-2026-0001", name: "Máy tính xách tay Dell XPS 15", cat: "Thiết bị IT", dept: "IT", user: "Phạm Nguyễn Anh Huy", value: 32_000_000, depreciation: 3_200_000, status: "Đang sử dụng", condition: "Tốt", icon: IconDeviceLaptop },
  { id: "TS-2026-0002", name: "Xe tải giao hàng 1.5 tấn Kia K250", cat: "Phương tiện", dept: "Logistics", user: "Phòng Logistics", value: 580_000_000, depreciation: 58_000_000, status: "Đang sử dụng", condition: "Tốt", icon: IconCar },
  { id: "TS-2026-0003", name: "Bộ bàn họp 20 chỗ", cat: "Nội thất", dept: "Hành chánh", user: "Phòng họp WORK", value: 48_000_000, depreciation: 4_800_000, status: "Đang sử dụng", condition: "Tốt", icon: IconArmchair },
  { id: "TS-2026-0004", name: "Máy chiếu Epson EB-1781W 4K", cat: "Thiết bị VP", dept: "Hành chánh", user: "Phòng họp OTI", value: 18_500_000, depreciation: 1_850_000, status: "Đang sử dụng", condition: "Hao mòn", icon: IconBuilding },
  { id: "TS-2026-0005", name: "Máy hàn công nghiệp Lincoln", cat: "Thiết bị SX", dept: "Sản xuất", user: "Nhà máy A1", value: 42_000_000, depreciation: 4_200_000, status: "Hư hỏng", condition: "Hỏng", icon: IconTool },
  { id: "TS-2026-0006", name: "Server HPE ProLiant DL380 Gen10", cat: "Thiết bị IT", dept: "IT", user: "Phòng Server", value: 180_000_000, depreciation: 18_000_000, status: "Đang sử dụng", condition: "Tốt", icon: IconDeviceLaptop },
  { id: "TS-2026-0007", name: "Điều hòa trung tâm tòa nhà VP", cat: "Hệ thống", dept: "Hành chánh", user: "Tòa nhà VP", value: 320_000_000, depreciation: 32_000_000, status: "Đang sử dụng", condition: "Tốt", icon: IconBuilding },
];

const STATUS_COLOR: Record<string, string> = {
  "Đang sử dụng": "bg-emerald-100 text-emerald-700",
  "Hư hỏng": "bg-red-100 text-red-600",
  "Thanh lý": "bg-gray-100 text-gray-500",
  "Điều chuyển": "bg-blue-100 text-blue-600",
};

export default function TaiSanPage() {
  const [search, setSearch] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);

  const filtered = ASSETS.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()));
  const totalValue = ASSETS.reduce((s, a) => s + a.value, 0);
  const totalDep = ASSETS.reduce((s, a) => s + a.depreciation, 0);

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
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <IconBuilding size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-700 text-gray-900">Tài sản</h1>
                <p className="text-xs text-gray-400">Kế toán & Quản trị</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50">
              <IconClipboardList size={14} /> Kiểm kê
            </button>
            <button onClick={() => setShowTransfer(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50">
              <IconArrowsRightLeft size={14} /> Điều chuyển
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-600 hover:bg-teal-700 shadow-sm">
              <IconPlus size={14} /> Thêm tài sản
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tổng tài sản", value: `${(totalValue / 1_000_000_000).toFixed(2)} tỷ đ`, sub: `${ASSETS.length} mục`, color: "bg-teal-50 text-teal-600" },
            { label: "Khấu hao tháng 8", value: `${(totalDep / 1_000_000).toFixed(0)}M đ`, sub: "Theo kế hoạch", color: "bg-amber-50 text-amber-600" },
            { label: "Đang sử dụng", value: `${ASSETS.filter(a => a.status === "Đang sử dụng").length}`, sub: "Tài sản hoạt động", color: "bg-emerald-50 text-emerald-700" },
            { label: "Cần xử lý", value: `${ASSETS.filter(a => a.status === "Hư hỏng").length}`, sub: "Hư hỏng, cần sửa", color: "bg-red-50 text-red-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-2">{s.label}</p>
              <p className="text-xl font-800 text-gray-900">{s.value}</p>
              <span className={`text-xs font-500 px-2 py-0.5 rounded-full mt-1.5 inline-block ${s.color}`}>{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Broken assets alert */}
        {ASSETS.some(a => a.status === "Hư hỏng") && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <IconAlertTriangle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              <strong>{ASSETS.filter(a => a.status === "Hư hỏng").length} tài sản hư hỏng</strong> cần xử lý — {ASSETS.filter(a => a.status === "Hư hỏng").map(a => a.name).join(", ")}
            </p>
            <button className="ml-auto px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-600 whitespace-nowrap hover:bg-red-700">Xem & xử lý</button>
          </div>
        )}

        {/* Asset grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 pt-5 flex items-center justify-between">
            <h2 className="text-sm font-700 text-gray-800">Danh sách tài sản</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên TS, mã TS..."
                  className="pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg w-52 focus:outline-none" />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50">
                <IconDownload size={14} /> Xuất
              </button>
            </div>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Mã TS", "Tên tài sản", "Danh mục", "Phòng ban / Người dùng", "Nguyên giá", "KH tháng", "Tình trạng", "Trạng thái", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-600 text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(asset => (
                  <tr key={asset.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="px-5 py-3.5"><span className="text-xs font-700 font-mono text-gray-700">{asset.id}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                          <asset.icon size={13} className="text-teal-600" />
                        </div>
                        <span className="text-xs font-500 text-gray-800">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{asset.cat}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-gray-700">{asset.dept}</p>
                      <p className="text-xs text-gray-400">{asset.user}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-700 text-gray-800">{(asset.value / 1_000_000).toFixed(0)}M đ</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{(asset.depreciation / 1_000_000).toFixed(1)}M đ</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${asset.condition === "Tốt" ? "bg-emerald-50 text-emerald-700" : asset.condition === "Hao mòn" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${STATUS_COLOR[asset.status] || "bg-gray-100 text-gray-500"}`}>{asset.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-xs text-gray-500" title="QR Code"><IconQrcode size={13} /></button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-xs text-gray-500" title="Điều chuyển"><IconTransferOut size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">{filtered.length} / {ASSETS.length} tài sản</p>
          </div>
        </div>
      </main>

      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-700 text-gray-900">Điều chuyển tài sản</h2>
              <button onClick={() => setShowTransfer(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><IconX size={16} className="text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              {[{ label: "Tài sản cần điều chuyển", placeholder: "Chọn tài sản..." }, { label: "Phòng ban nhận", placeholder: "Chọn phòng ban..." }, { label: "Người nhận", placeholder: "Họ tên người nhận..." }, { label: "Lý do", placeholder: "Lý do điều chuyển..." }].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-600 text-gray-600 mb-1 block">{f.label}</label>
                  <input placeholder={f.placeholder} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTransfer(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-600 text-gray-600 hover:bg-gray-50">Hủy</button>
              <button className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-600 hover:bg-teal-700 flex items-center justify-center gap-2">
                <IconCheck size={15} /> Xác nhận điều chuyển
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
