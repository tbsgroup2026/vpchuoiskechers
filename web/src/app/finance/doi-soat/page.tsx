"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconArrowsRightLeft, IconCircleCheck, IconAlertTriangle,
  IconX, IconMinus, IconPlus, IconChevronDown, IconCheck, IconRefresh,
} from "@tabler/icons-react";

type RecStatus = "matched" | "diff" | "pending";

interface RecItem {
  id: string;
  type: string;
  left: string;
  leftVal: string;
  right: string;
  rightVal: string;
  status: RecStatus;
  diffAmount?: string;
  note?: string;
}

const RECON_ITEMS: RecItem[] = [
  { id: "DS-001", type: "Thu – Chi", left: "Sổ kế toán", leftVal: "247,300,000 đ", right: "Phiếu thu/chi", rightVal: "247,300,000 đ", status: "matched" },
  { id: "DS-002", type: "Ngân hàng", left: "Sao kê VCB tháng 8", leftVal: "1,842,400,000 đ", right: "Sổ tiền gửi NH", rightVal: "1,838,200,000 đ", status: "diff", diffAmount: "4,200,000 đ", note: "Phí dịch vụ NH chưa hạch toán" },
  { id: "DS-003", type: "Hóa đơn", left: "Hóa đơn đầu vào", leftVal: "312,400,000 đ", right: "Phiếu chi tương ứng", rightVal: "312,400,000 đ", status: "matched" },
  { id: "DS-004", type: "Công nợ", left: "Bảng theo dõi CN phải trả", leftVal: "161,400,000 đ", right: "Xác nhận NCC", rightVal: "158,600,000 đ", status: "diff", diffAmount: "2,800,000 đ", note: "NCC Đế Giày Phú Cường chưa xác nhận" },
  { id: "DS-005", type: "Ngân sách", left: "Ngân sách phân bổ T8", leftVal: "1,990,000,000 đ", right: "Thực chi tổng hợp", rightVal: "1,771,600,000 đ", status: "matched" },
  { id: "DS-006", type: "Chứng từ", left: "Chứng từ lưu trữ (47 HĐ)", leftVal: "47 chứng từ", right: "Hệ thống ghi nhận", rightVal: "45 chứng từ", status: "diff", diffAmount: "2 chứng từ", note: "2 hóa đơn nhập kho chưa scan lưu" },
  { id: "DS-007", type: "Thu – Chi", left: "Sổ kế toán T7", leftVal: "198,500,000 đ", right: "Xác nhận kiểm toán", rightVal: "198,500,000 đ", status: "matched" },
  { id: "DS-008", type: "Hóa đơn", left: "HĐ đầu ra tháng 8", leftVal: "498,700,000 đ", right: "Phiếu thu tương ứng", rightVal: "498,700,000 đ", status: "pending", note: "Đang chờ đối chiếu" },
];

const STATUS_CONF = {
  matched: { label: "Khớp", bg: "bg-emerald-50", text: "text-emerald-700", icon: IconCircleCheck, iconColor: "text-emerald-500" },
  diff: { label: "Chênh lệch", bg: "bg-red-50", text: "text-red-600", icon: IconMinus, iconColor: "text-red-500" },
  pending: { label: "Chờ đối chiếu", bg: "bg-amber-50", text: "text-amber-700", icon: IconArrowsRightLeft, iconColor: "text-amber-500" },
};

const REC_TYPES = ["Tất cả", "Thu – Chi", "Ngân hàng", "Hóa đơn", "Công nợ", "Ngân sách", "Chứng từ"];

export default function DoiSoatPage() {
  const [filter, setFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState<"all" | RecStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = RECON_ITEMS.filter(item => {
    const matchType = filter === "Tất cả" || item.type === filter;
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchType && matchStatus;
  });

  const matched = RECON_ITEMS.filter(i => i.status === "matched").length;
  const diffs = RECON_ITEMS.filter(i => i.status === "diff").length;
  const pending = RECON_ITEMS.filter(i => i.status === "pending").length;

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
              <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center">
                <IconArrowsRightLeft size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-700 text-gray-900">Đối soát</h1>
                <p className="text-xs text-gray-400">Kế toán & Quản trị</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50">
              <IconRefresh size={14} /> Chạy đối soát tự động
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => setStatusFilter(statusFilter === "matched" ? "all" : "matched")}>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <IconCircleCheck size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-800 text-gray-900">{matched}</p>
              <p className="text-xs text-gray-500">Đã khớp</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-200 transition-colors" onClick={() => setStatusFilter(statusFilter === "diff" ? "all" : "diff")}>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <IconAlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-800 text-gray-900">{diffs}</p>
              <p className="text-xs text-gray-500">Chênh lệch</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-amber-200 transition-colors" onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <IconArrowsRightLeft size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-800 text-gray-900">{pending}</p>
              <p className="text-xs text-gray-500">Chờ đối chiếu</p>
            </div>
          </div>
        </div>

        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {REC_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-600 transition-all border ${filter === t ? "bg-pink-600 text-white border-pink-600" : "bg-white text-gray-600 border-gray-200 hover:border-pink-300"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Reconciliation list */}
        <div className="space-y-3">
          {filtered.map(item => {
            const conf = STATUS_CONF[item.status];
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${item.status === "diff" ? "border-red-200" : "border-gray-100"}`}>
                <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                  <div className={`w-8 h-8 rounded-lg ${conf.bg} flex items-center justify-center shrink-0`}>
                    <conf.icon size={16} className={conf.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-700 font-mono text-gray-600">{item.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-600 ${conf.bg} ${conf.text}`}>{conf.label}</span>
                      <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-50 rounded-full">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-gray-600">
                      <span><strong className="text-gray-400">{item.left}:</strong> {item.leftVal}</span>
                      <IconArrowsRightLeft size={12} className="text-gray-300 shrink-0" />
                      <span><strong className="text-gray-400">{item.right}:</strong> {item.rightVal}</span>
                    </div>
                  </div>
                  {item.diffAmount && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-800 text-red-600">∆ {item.diffAmount}</p>
                    </div>
                  )}
                  <IconChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-600 text-gray-500 mb-1">{item.left}</p>
                        <p className="text-lg font-800 text-gray-900">{item.leftVal}</p>
                      </div>
                      <div className={`rounded-xl p-4 ${item.status === "diff" ? "bg-red-50" : "bg-gray-50"}`}>
                        <p className="text-xs font-600 text-gray-500 mb-1">{item.right}</p>
                        <p className={`text-lg font-800 ${item.status === "diff" ? "text-red-700" : "text-gray-900"}`}>{item.rightVal}</p>
                      </div>
                    </div>
                    {item.note && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                        <p className="text-xs text-amber-800"><strong>Ghi chú:</strong> {item.note}</p>
                      </div>
                    )}
                    {item.status === "diff" && (
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-600 hover:bg-rose-700">
                          <IconAlertTriangle size={13} /> Ghi nhận nguyên nhân
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50">
                          <IconCheck size={13} /> Đánh dấu đã xử lý
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
