"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconSearch, IconFilter, IconDownload, IconPlus,
  IconChartPie, IconBuilding, IconUsers, IconPlane, IconFlask,
  IconShoppingCart, IconTruck, IconHome, IconBolt, IconArrowRight,
} from "@tabler/icons-react";

const EXPENSE_CATS = [
  { id: "vp", name: "Chi phí văn phòng", icon: IconHome, amount: 18_400_000, budget: 22_000_000, dept: "Hành chánh", color: "bg-blue-100 text-blue-600" },
  { id: "ns", name: "Chi phí nhân sự", icon: IconUsers, amount: 812_000_000, budget: 850_000_000, dept: "Toàn chuỗi", color: "bg-emerald-100 text-emerald-700" },
  { id: "ct", name: "Chi phí công tác", icon: IconPlane, amount: 34_500_000, budget: 40_000_000, dept: "Nhiều phòng", color: "bg-cyan-100 text-cyan-700" },
  { id: "rd", name: "Chi phí R&D", icon: IconFlask, amount: 189_000_000, budget: 250_000_000, dept: "R&D", color: "bg-violet-100 text-violet-700" },
  { id: "ms", name: "Chi phí mua sắm", icon: IconShoppingCart, amount: 96_200_000, budget: 120_000_000, dept: "Mua hàng", color: "bg-amber-100 text-amber-700" },
  { id: "dv", name: "Chi phí dịch vụ", icon: IconBolt, amount: 28_800_000, budget: 35_000_000, dept: "IT & Hạ tầng", color: "bg-pink-100 text-pink-700" },
  { id: "mb", name: "Chi phí thuê/mặt bằng", icon: IconBuilding, amount: 124_000_000, budget: 124_000_000, dept: "Hành chánh", color: "bg-rose-100 text-rose-600" },
  { id: "vh", name: "Chi phí vận hành", icon: IconTruck, amount: 261_000_000, budget: 280_000_000, dept: "Logistics", color: "bg-orange-100 text-orange-700" },
];

const RECENT_EXPENSES = [
  { id: "CP-2026-0188", cat: "Chi phí công tác", desc: "Chi công tác Hà Nội – Logistics khảo sát kho", amount: 8_500_000, dept: "Logistics", date: "15/08", status: "Đã duyệt" },
  { id: "CP-2026-0187", cat: "Chi phí văn phòng", desc: "Mua văn phòng phẩm, mực in & giấy A4", amount: 2_100_000, dept: "Hành chánh", date: "14/08", status: "Đã duyệt" },
  { id: "CP-2026-0186", cat: "Chi phí dịch vụ", desc: "Gia hạn bản quyền phần mềm Adobe CC", amount: 4_800_000, dept: "R&D", date: "13/08", status: "Chờ duyệt" },
  { id: "CP-2026-0185", cat: "Chi phí mua sắm", desc: "Mua thêm 5 máy may công nghiệp Juki", amount: 85_000_000, dept: "Sản xuất", date: "12/08", status: "Đã duyệt" },
  { id: "CP-2026-0184", cat: "Chi phí R&D", desc: "Mua nguyên liệu thử nghiệm mẫu mới SKECHERS Q4", amount: 12_400_000, dept: "R&D", date: "11/08", status: "Chờ duyệt" },
];

export default function ChiPhiPage() {
  const [search, setSearch] = useState("");
  const totalBudget = EXPENSE_CATS.reduce((s, c) => s + c.budget, 0);
  const totalSpent = EXPENSE_CATS.reduce((s, c) => s + c.amount, 0);

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
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <IconChartPie size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-700 text-gray-900">Chi phí</h1>
                <p className="text-xs text-gray-400">Kế toán & Quản trị</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50">
              <IconDownload size={14} /> Xuất Excel
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-600 hover:bg-orange-600 shadow-sm">
              <IconPlus size={14} /> Thêm chi phí
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">Tổng chi phí tháng 8</p>
            <p className="text-3xl font-800 text-gray-900">{(totalSpent / 1_000_000_000).toFixed(2)} <span className="text-lg font-600 text-gray-400">tỷ đ</span></p>
            <p className="text-xs text-amber-600 font-600 mt-2">{((totalSpent / totalBudget) * 100).toFixed(1)}% ngân sách tháng</p>
            <div className="h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(totalSpent / totalBudget) * 100}%` }} />
            </div>
          </div>

          {/* Category cards */}
          <div className="lg:col-span-2 grid grid-cols-4 gap-3">
            {EXPENSE_CATS.slice(0, 4).map(cat => (
              <div key={cat.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:border-orange-200 transition-colors group">
                <div className={`w-9 h-9 rounded-lg ${cat.color} flex items-center justify-center mb-3`}>
                  <cat.icon size={16} />
                </div>
                <p className="text-xs font-600 text-gray-700 leading-tight mb-2">{cat.name}</p>
                <p className="text-base font-800 text-gray-900">{(cat.amount / 1_000_000).toFixed(0)}M</p>
                <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full rounded-full ${cat.amount >= cat.budget ? "bg-red-500" : "bg-orange-400"}`}
                    style={{ width: `${Math.min((cat.amount / cat.budget) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {EXPENSE_CATS.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-orange-200 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${cat.color} flex items-center justify-center`}>
                  <cat.icon size={16} />
                </div>
                <span className={`text-xs font-700 ${cat.amount >= cat.budget ? "text-red-600" : "text-gray-400"}`}>
                  {((cat.amount / cat.budget) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs font-600 text-gray-600 mb-1">{cat.name}</p>
              <p className="text-lg font-800 text-gray-900">{(cat.amount / 1_000_000).toFixed(0)}M đ</p>
              <p className="text-xs text-gray-400 mt-0.5">NS: {(cat.budget / 1_000_000).toFixed(0)}M đ · {cat.dept}</p>
              <div className="h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                <div className={`h-full rounded-full ${cat.amount >= cat.budget ? "bg-red-500" : "bg-orange-400"}`}
                  style={{ width: `${Math.min((cat.amount / cat.budget) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent expenses table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 pt-5 flex items-center justify-between">
            <h2 className="text-sm font-700 text-gray-800">Chi phí gần đây</h2>
            <div className="relative">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..."
                className="pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg w-48 focus:outline-none" />
            </div>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Mã CP", "Danh mục", "Mô tả", "Phòng ban", "Ngày", "Số tiền", "Trạng thái"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-600 text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {RECENT_EXPENSES.filter(e => !search || e.desc.toLowerCase().includes(search.toLowerCase())).map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5"><span className="text-xs font-700 font-mono text-gray-800">{exp.id}</span></td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{exp.cat}</td>
                    <td className="px-5 py-3.5 max-w-xs"><p className="text-xs text-gray-700 truncate">{exp.desc}</p></td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{exp.dept}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{exp.date}</td>
                    <td className="px-5 py-3.5 text-sm font-700 text-rose-500">−{(exp.amount / 1_000_000).toFixed(1)}M đ</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${exp.status === "Đã duyệt" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-gray-100">
            <button className="text-xs font-600 text-orange-600 hover:underline flex items-center gap-1">
              Xem toàn bộ chi phí <IconArrowRight size={13} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
