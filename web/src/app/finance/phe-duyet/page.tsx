"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconCircleCheck, IconClock, IconX, IconCheck,
  IconUser, IconChevronRight, IconArrowRight, IconPlus,
  IconAlertCircle, IconChevronDown,
} from "@tabler/icons-react";

type ApprovalStatus = "pending" | "approved" | "rejected" | "draft";

interface ApprovalRequest {
  id: string;
  type: string;
  title: string;
  amount?: string;
  dept: string;
  creator: string;
  createdAt: string;
  currentStep: number;
  status: ApprovalStatus;
  steps: { role: string; name?: string; status: "done" | "current" | "waiting" }[];
}

const REQUESTS: ApprovalRequest[] = [
  {
    id: "PD-2026-0088", type: "Phiếu chi", title: "Chi phí mua thiết bị IT cho phòng CN-CI",
    amount: "24,800,000 đ", dept: "CN-CI", creator: "Phạm Nguyễn Anh Huy",
    createdAt: "15/08/2026", currentStep: 2, status: "pending",
    steps: [
      { role: "Nhân viên tạo", name: "Phạm Nguyễn Anh Huy", status: "done" },
      { role: "Trưởng bộ phận", name: "Nguyễn Thị Lan Anh", status: "current" },
      { role: "Kế toán kiểm tra", status: "waiting" },
      { role: "Quản lý duyệt", status: "waiting" },
    ],
  },
  {
    id: "TU-2026-0046", type: "Tạm ứng", title: "Tạm ứng công tác TP. HCM – Kiểm tra kho TTPP",
    amount: "8,000,000 đ", dept: "Logistics", creator: "Nguyễn Văn Minh",
    createdAt: "14/08/2026", currentStep: 3, status: "pending",
    steps: [
      { role: "Nhân viên tạo", name: "Nguyễn Văn Minh", status: "done" },
      { role: "Trưởng bộ phận", name: "Nguyễn Văn Minh", status: "done" },
      { role: "Kế toán kiểm tra", name: "Trần Thị Thu Hương", status: "current" },
      { role: "Quản lý duyệt", status: "waiting" },
    ],
  },
  {
    id: "MS-2026-0031", type: "Mua sắm", title: "Đề nghị mua 2 máy in laser A3 cho phòng R&D",
    amount: "18,600,000 đ", dept: "R&D", creator: "Võ Thị Kim Loan",
    createdAt: "12/08/2026", currentStep: 4, status: "approved",
    steps: [
      { role: "Nhân viên tạo", name: "Võ Thị Kim Loan", status: "done" },
      { role: "Trưởng bộ phận", name: "Võ Thị Kim Loan", status: "done" },
      { role: "Kế toán kiểm tra", name: "Phạm Văn Đức", status: "done" },
      { role: "Quản lý duyệt", name: "Phó Tổng Giám Đốc", status: "done" },
    ],
  },
  {
    id: "PC-2026-0088", type: "Phiếu chi", title: "Thanh toán dịch vụ vệ sinh công nghiệp nhà máy A2",
    amount: "12,400,000 đ", dept: "Sản xuất", creator: "Giám Đốc SX",
    createdAt: "11/08/2026", currentStep: 2, status: "rejected",
    steps: [
      { role: "Nhân viên tạo", status: "done" },
      { role: "Trưởng bộ phận", status: "done" },
      { role: "Kế toán kiểm tra", status: "done" },
      { role: "Quản lý duyệt", status: "done" },
    ],
  },
  {
    id: "NS-2026-0012", type: "Điều chỉnh NS", title: "Điều chỉnh ngân sách R&D tăng thêm 50M cho Q4/2026",
    amount: "50,000,000 đ", dept: "R&D", creator: "Trưởng phòng R&D",
    createdAt: "10/08/2026", currentStep: 1, status: "draft",
    steps: [
      { role: "Nhân viên tạo", status: "current" },
      { role: "Trưởng bộ phận", status: "waiting" },
      { role: "Kế toán kiểm tra", status: "waiting" },
      { role: "Quản lý duyệt", status: "waiting" },
    ],
  },
];

const STATUS_CONF: Record<ApprovalStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Đang duyệt", bg: "bg-amber-50", text: "text-amber-700" },
  approved: { label: "Đã duyệt", bg: "bg-emerald-50", text: "text-emerald-700" },
  rejected: { label: "Từ chối", bg: "bg-red-50", text: "text-red-600" },
  draft: { label: "Nháp", bg: "bg-gray-100", text: "text-gray-500" },
};

const TYPE_COLORS: Record<string, string> = {
  "Phiếu chi": "bg-rose-50 text-rose-600",
  "Tạm ứng": "bg-amber-50 text-amber-700",
  "Mua sắm": "bg-blue-50 text-blue-700",
  "Điều chỉnh NS": "bg-violet-50 text-violet-700",
};

export default function PheDuyetPage() {
  const [filter, setFilter] = useState<"all" | ApprovalStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = REQUESTS.filter(r => filter === "all" || r.status === filter);

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
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <IconCircleCheck size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-700 text-gray-900">Phê duyệt</h1>
                <p className="text-xs text-gray-400">Kế toán & Quản trị</p>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-600 hover:bg-emerald-700 shadow-sm">
            <IconPlus size={14} /> Tạo đề nghị mới
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Tổng yêu cầu", value: REQUESTS.length, status: "all" as const },
            { label: "Đang chờ duyệt", value: REQUESTS.filter(r => r.status === "pending").length, status: "pending" as const },
            { label: "Đã duyệt", value: REQUESTS.filter(r => r.status === "approved").length, status: "approved" as const },
            { label: "Từ chối", value: REQUESTS.filter(r => r.status === "rejected").length, status: "rejected" as const },
          ].map(s => (
            <button key={s.label} onClick={() => setFilter(s.status)}
              className={`bg-white rounded-xl p-4 border text-left transition-all shadow-sm ${filter === s.status ? "border-emerald-400 ring-2 ring-emerald-400/20" : "border-gray-100 hover:border-gray-200"}`}>
              <p className="text-2xl font-800 text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Workflow guide */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-700 text-gray-500 mb-3">Quy trình phê duyệt nội bộ</p>
          <div className="flex items-center gap-2 flex-wrap">
            {["Nhân viên tạo", "Trưởng bộ phận", "Kế toán kiểm tra", "Quản lý duyệt", "Hoàn tất"].map((step, i, arr) => (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-xs font-800 text-emerald-700">{i + 1}</span>
                  </div>
                  <span className="text-xs font-600 text-gray-700">{step}</span>
                </div>
                {i < arr.length - 1 && <IconArrowRight size={14} className="text-gray-300 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Request list */}
        <div className="space-y-3">
          {filtered.map(req => {
            const conf = STATUS_CONF[req.status];
            const isExpanded = expandedId === req.id;
            return (
              <div key={req.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${req.status === "pending" ? "border-amber-200" : req.status === "rejected" ? "border-red-200" : "border-gray-100"}`}>
                <button className="w-full px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-xs font-700 font-mono text-gray-500">{req.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-600 ${TYPE_COLORS[req.type] || "bg-gray-100 text-gray-600"}`}>{req.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-600 ${conf.bg} ${conf.text}`}>{conf.label}</span>
                    </div>
                    <p className="text-sm font-600 text-gray-800">{req.title}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><IconUser size={12} /> {req.creator}</span>
                      <span>{req.dept}</span>
                      <span>{req.createdAt}</span>
                      {req.amount && <span className="font-700 text-gray-600">{req.amount}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Step progress pills */}
                    <div className="flex gap-1">
                      {req.steps.map((step, i) => (
                        <div key={i} className={`h-1.5 w-6 rounded-full ${step.status === "done" ? "bg-emerald-500" : step.status === "current" ? "bg-amber-400" : "bg-gray-200"}`} title={step.role} />
                      ))}
                    </div>
                    <IconChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                    {/* Step timeline */}
                    <div className="relative space-y-0">
                      {req.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-4 relative">
                          {i < req.steps.length - 1 && (
                            <div className="absolute left-[15px] top-8 w-px h-8 bg-gray-200" />
                          )}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${step.status === "done" ? "bg-emerald-100" : step.status === "current" ? "bg-amber-100" : "bg-gray-100"}`}>
                            {step.status === "done" ? <IconCheck size={14} className="text-emerald-600" /> :
                             step.status === "current" ? <IconClock size={14} className="text-amber-600" /> :
                             <span className="text-xs font-700 text-gray-400">{i + 1}</span>}
                          </div>
                          <div className="pb-6">
                            <p className={`text-sm font-600 ${step.status === "current" ? "text-amber-700" : step.status === "done" ? "text-gray-800" : "text-gray-400"}`}>{step.role}</p>
                            {step.name && <p className="text-xs text-gray-500 mt-0.5">{step.name}</p>}
                            {step.status === "current" && <span className="text-xs text-amber-600 font-600">Đang chờ xử lý</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {req.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-600 hover:bg-emerald-700">
                          <IconCheck size={13} /> Phê duyệt
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-600 hover:bg-red-100 border border-red-200">
                          <IconX size={13} /> Từ chối
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
