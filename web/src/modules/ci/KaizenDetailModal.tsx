"use client";

import React, { useState } from "react";
import {
  IconX,
  IconTrophy,
  IconStar,
  IconThumbUp,
  IconPhoto,
  IconAward,
  IconEditCircle,
  IconTrash,
  IconAlertCircle,
} from "@tabler/icons-react";
import { HalfStarRating, KaizenProposal } from "./CIModule";

interface KaizenDetailModalProps {
  proposal: KaizenProposal;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEvaluate: () => void;
  onRate: () => void;
}

const CATEGORIES = [
  { id: "MATERIAL_SAVING", label: "1.Tiết kiệm Vật tư", color: "bg-blue-600 text-white" },
  { id: "COST_SAVING", label: "2.Tiết kiệm Chi phí", color: "bg-emerald-600 text-white" },
  { id: "PRODUCTIVITY", label: "3.Tăng Năng suất", color: "bg-blue-500 text-white" },
  { id: "SAFETY", label: "4.An toàn lao động", color: "bg-[#006838] text-white" },
  { id: "5S", label: "5.5S", color: "bg-sky-500 text-white" },
  { id: "AUTOMATION", label: "6.Tự động hoá", color: "bg-indigo-600 text-white" },
  { id: "EQUIPMENT", label: "7.MMTB CCDC", color: "bg-purple-600 text-white" },
  { id: "OTHER", label: "8.Khác", color: "bg-slate-600 text-white" },
];

export default function KaizenDetailModal({
  proposal,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onEvaluate,
  onRate,
}: KaizenDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "expert_review" | "star_review">("info");
  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(proposal.before_image_url ? { type: "image", url: proposal.before_image_url } : null);

  if (!isOpen || !proposal) return null;

  const catObj = CATEGORIES.find((c) => c.id === proposal.category) || CATEGORIES[0];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[95vh] flex flex-col md:flex-row overflow-hidden text-left animate-in zoom-in-95 duration-200">
        
        {/* ═══════════════════════════════════════════════════════════════════════════════════
            LEFT SIDEBAR (Fixed, ~320px, no scroll)
           ═══════════════════════════════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-80 md:max-h-[95vh] md:overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 p-5 md:p-6 flex flex-col gap-5 flex-shrink-0">
          
          {/* 1. Large Main Media Display (Image/Video) */}
          <div className="space-y-3">
            <div className="relative w-full aspect-video bg-slate-200 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-md flex items-center justify-center">
              {selectedMedia?.type === "image" && selectedMedia.url ? (
                <img
                  src={selectedMedia.url}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              ) : selectedMedia?.type === "video" && selectedMedia.url ? (
                <video
                  src={selectedMedia.url}
                  controls
                  className="w-full h-full object-cover bg-slate-900"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs font-bold flex flex-col items-center gap-1">
                  <IconPhoto size={32} className="opacity-40" />
                  <span>Không có media</span>
                </div>
              )}
            </div>

            {/* Thumbnails - Click to Switch Media */}
            <div className="flex gap-2">
              {proposal.before_image_url && (
                <button
                  type="button"
                  onClick={() => proposal.before_image_url && setSelectedMedia({ type: "image", url: proposal.before_image_url })}
                  className={`flex-1 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedMedia?.url === proposal.before_image_url && selectedMedia?.type === "image"
                      ? "border-[#006838] ring-2 ring-[#006838]/50"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  title="Ảnh trước"
                >
                  <img src={proposal.before_image_url} alt="Before" className="w-full h-full object-cover" />
                </button>
              )}
              {proposal.after_image_url && (
                <button
                  type="button"
                  onClick={() => proposal.after_image_url && setSelectedMedia({ type: "image", url: proposal.after_image_url })}
                  className={`flex-1 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedMedia?.url === proposal.after_image_url && selectedMedia?.type === "image"
                      ? "border-[#006838] ring-2 ring-[#006838]/50"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  title="Ảnh sau"
                >
                  <img src={proposal.after_image_url} alt="After" className="w-full h-full object-cover" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Region & Category Badges */}
          <div className="space-y-2">
            <span className="inline-block px-3 py-1.5 rounded-full bg-slate-700 text-white text-[11px] font-black">
              {proposal.region} · {proposal.proposer_emp_code}
            </span>
            <span className={`inline-block px-3 py-1.5 rounded-full text-[11px] font-black ${catObj.color}`}>
              {catObj.label}
            </span>
          </div>

          {/* 3. Two-Column Score Stats */}
          <div className="grid grid-cols-2 gap-3">
            {/* Score */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Điểm TB</span>
              <span className="text-2xl font-black text-amber-600 block">
                {(proposal.avg_rating || 0).toFixed(1)} ⭐
              </span>
              <span className="text-[10px] font-bold text-slate-400">{proposal.rating_count || 0} lượt</span>
            </div>

            {/* Expert Score */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Chuyên Môn</span>
              <span className="text-2xl font-black text-emerald-600 block">
                {proposal.score_points || 0} / 100
              </span>
              <span className="text-[10px] font-bold text-emerald-600">Đã duyệt</span>
            </div>
          </div>

          {/* 4. Info Labels (vertical) */}
          <div className="space-y-2.5 border-t border-slate-300 pt-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Người Đăng Ký</span>
              <span className="text-xs font-bold text-slate-900">{proposal.proposer_name}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block">VTCV</span>
                <span className="text-xs font-bold text-slate-900">{proposal.department}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Nhóm SP-DV</span>
                <span className="text-xs font-bold text-slate-900">{proposal.factory || "N/A"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Phân Loại</span>
                <span className="text-xs font-bold text-slate-900">{catObj.label}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Ngày Đăng</span>
                <span className="text-xs font-bold text-slate-900">
                  {new Date(proposal.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Mã NV</span>
                <span className="text-xs font-bold text-slate-900">{proposal.proposer_emp_code}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Loại ĐK</span>
                <span className="text-xs font-bold text-slate-900">
                  {proposal.registration_type === "THI_DUA" ? "Thi Đua" : "Lưu Trữ"}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Action Buttons (Full Width, Stacked) */}
          <div className="space-y-2 border-t border-slate-300 pt-4">
            <button
              type="button"
              onClick={onEdit}
              className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <IconEditCircle size={16} />
              <span>Sửa</span>
            </button>

            <button
              type="button"
              onClick={() => {}}
              className="w-full py-3 px-4 rounded-2xl border-2 border-red-600 text-red-600 hover:bg-red-50 font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Đóng TĐ</span>
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="w-full py-3 px-4 rounded-2xl border-2 border-red-300 text-red-500 hover:bg-red-50 font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <IconTrash size={16} />
              <span>Xóa</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════════════
            RIGHT CONTENT (Scrollable, with Tabs)
           ═══════════════════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Header with Close Button & Category Badges */}
          <div className="flex-shrink-0 p-5 md:p-6 border-b border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-3 py-1.5 rounded-full text-[11px] font-black ${catObj.color}`}>
                  {catObj.label}
                </span>
                <span className="inline-block px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-black">
                  {proposal.registration_type === "THI_DUA" ? "🏆 Thi đua" : "📦 Lưu Trữ"}
                </span>
                <span className="inline-block px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-black">
                  ✓ Đã duyệt
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex-shrink-0"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase line-clamp-2 mb-1">
                {proposal.title}
              </h2>
              <p className="text-xs font-bold text-slate-400">
                MSNV: {proposal.proposer_emp_code} · KV: {proposal.region} · Tháng{" "}
                {new Date(proposal.created_at).getMonth() + 1}/{new Date(proposal.created_at).getFullYear()}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 px-5 md:px-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2 overflow-x-auto">
            {[
              { id: "info", label: "ℹ️ Thông tin", count: null },
              { id: "expert_review", label: "👑 Đánh giá chuyên môn", count: proposal.evaluated_at ? "1" : "0" },
              { id: "star_review", label: "⭐ Đánh giá thưởng", count: proposal.rating_count || "0" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                  activeTab === tab.id
                    ? "border-[#006838] text-[#006838] bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "info" && <TabInfoContent proposal={proposal} />}
            {activeTab === "expert_review" && (
              <TabExpertReviewContent proposal={proposal} onEvaluate={onEvaluate} />
            )}
            {activeTab === "star_review" && <TabStarReviewContent proposal={proposal} onRate={onRate} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   TAB 1: INFO CONTENT
   ═══════════════════════════════════════════════════════════════════════════════════ */
function TabInfoContent({ proposal }: { proposal: KaizenProposal }) {
  return (
    <div className="p-5 md:p-6 space-y-6">
      {/* 1. Overview - 3 Columns */}
      <div>
        <h3 className="text-sm font-black text-slate-900 mb-3 uppercase">Tổng Quan Cải Tiến</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-blue-600 block">Mã Hàng</span>
            <span className="text-lg font-black text-blue-900">{proposal.code}</span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 block">Số Lượng ĐH</span>
            <span className="text-lg font-black text-emerald-900">{proposal.vote_count}</span>
          </div>
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-purple-600 block">Hướng Đánh Giá</span>
            <span className="text-sm font-black text-purple-900">{proposal.category || "---"}</span>
          </div>
        </div>
      </div>

      {/* 2. Problem & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
          <h4 className="text-xs font-extrabold uppercase text-red-700 flex items-center gap-2">
            <IconAlertCircle size={16} />
            <span>Vấn Đề Phát Hiện (Trước)</span>
          </h4>
          <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
            {proposal.before_description || "Không có dữ liệu"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
          <h4 className="text-xs font-extrabold uppercase text-emerald-700 flex items-center gap-2">
            <IconThumbUp size={16} />
            <span>Giải Pháp Hành Động (Sau)</span>
          </h4>
          <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
            {proposal.after_solution || "Không có dữ liệu"}
          </p>
        </div>
      </div>

      {/* 3. Effectiveness - 4 Columns */}
      <div>
        <h3 className="text-sm font-black text-slate-900 mb-3 uppercase">Hiệu Quả Cải Tiến</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-orange-600 block">Trước</span>
            <span className="text-lg font-black text-orange-900">0</span>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-blue-600 block">Sau</span>
            <span className="text-lg font-black text-blue-900">{proposal.saved_seconds}s</span>
          </div>
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-purple-600 block">Tiết Kiệm</span>
            <span className="text-lg font-black text-purple-900">100%</span>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-white block">Hiệu Quả (VNĐ)</span>
            <span className="text-xl font-black text-white">23.2M</span>
          </div>
        </div>
      </div>

      {/* 4. Video Comparison */}
      {proposal.attachments_json && (() => {
        try {
          const atts = typeof proposal.attachments_json === "string" ? JSON.parse(proposal.attachments_json) : proposal.attachments_json;
          if (!Array.isArray(atts)) return null;
          const vids = atts.filter((a: any) => a && (a.type?.startsWith("video_") || a.url?.includes("video") || a.url?.startsWith("data:video/")));
          if (!vids || vids.length === 0) return null;
          return (
            <div>
              <h3 className="text-sm font-black text-slate-900 mb-3 uppercase">So Sánh Video Clips Thực Địa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vids.map((v: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <span className="text-xs font-bold text-slate-600 block">🎬 {v.title || (v.type === "video_before" ? "Video Trước Cải Tiến" : "Video Sau Cải Tiến")}</span>
                    <video controls src={v.url} className="w-full aspect-video bg-slate-900 rounded-2xl border-2 border-purple-300 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          );
        } catch(e) { return null; }
      })()}

      {/* 5. Image Comparison */}
      <div>
        <h3 className="text-sm font-black text-slate-900 mb-3 uppercase">So Sánh Hình Ảnh</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 block">Trước (1 ảnh)</span>
            {proposal.before_image_url ? (
              <img
                src={proposal.before_image_url}
                alt="Before"
                className="w-full h-48 object-cover rounded-2xl border-2 border-slate-300"
              />
            ) : (
              <div className="w-full h-48 bg-slate-100 rounded-2xl border-2 border-slate-300 flex items-center justify-center text-slate-400 text-xs font-bold">
                Không có ảnh
              </div>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 block">Sau (1 ảnh)</span>
            {proposal.after_image_url ? (
              <img
                src={proposal.after_image_url}
                alt="After"
                className="w-full h-48 object-cover rounded-2xl border-2 border-slate-300"
              />
            ) : (
              <div className="w-full h-48 bg-slate-100 rounded-2xl border-2 border-slate-300 flex items-center justify-center text-slate-400 text-xs font-bold">
                Không có ảnh
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   TAB 2: EXPERT REVIEW CONTENT
   ═══════════════════════════════════════════════════════════════════════════════════ */
function TabExpertReviewContent({
  proposal,
  onEvaluate,
}: {
  proposal: KaizenProposal;
  onEvaluate: () => void;
}) {
  return (
    <div className="p-5 md:p-6">
      {proposal.award_title || proposal.score_points > 0 ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 block">Hạng Giải Thưởng</span>
                <span className="text-2xl font-black text-amber-700 flex items-center gap-1.5 mt-0.5">
                  🥇 {proposal.award_title || "Giải Nhất"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-amber-600 block">Điểm Chuyên Môn</span>
                <span className="text-3xl font-black text-emerald-600">{proposal.score_points || 95}/100</span>
              </div>
            </div>

            {proposal.review_comment && (
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-600 block">Nhận Xét Hội Đồng:</span>
                <div className="p-4 rounded-2xl bg-white border border-amber-200 text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {proposal.review_comment}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onEvaluate}
              className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <IconAward size={16} />
              <span>Sửa Chấm Điểm Lại</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl border-2 border-dashed border-slate-300 text-center space-y-4 bg-slate-50/50">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <IconTrophy size={32} />
          </div>
          <div className="space-y-1">
            <h5 className="text-base font-black text-slate-800">Chưa có kết quả chấm điểm chuyên môn</h5>
            <p className="text-xs text-slate-500 font-medium">
              Đề xuất này chưa được Ban Giám Khảo đánh giá điểm thang 100 hoặc trao giải.
            </p>
          </div>
          <button
            type="button"
            onClick={onEvaluate}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <IconAward size={16} />
            <span>Tiến Hành Chấm Điểm &amp; Trao Giải</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   TAB 3: STAR REVIEW CONTENT
   ═══════════════════════════════════════════════════════════════════════════════════ */
function TabStarReviewContent({ proposal, onRate }: { proposal: KaizenProposal; onRate: () => void }) {
  return (
    <div className="p-5 md:p-6">
      <div className="p-6 rounded-3xl bg-sky-50 border border-sky-200 shadow-md text-center space-y-6">
        <div className="space-y-2">
          <span className="text-4xl font-black text-amber-500 block">
            {(proposal.avg_rating || 5.0).toFixed(1)} ⭐
          </span>
          <span className="text-sm font-bold text-slate-500 block">
            Dựa trên {proposal.rating_count || 0} lượt bình chọn từ nhân sự
          </span>
        </div>

        <button
          type="button"
          onClick={onRate}
          className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <IconStar size={18} className="fill-slate-950" />
          <span>Thực Hiện Đánh Giá Sao Ngay</span>
        </button>
      </div>
    </div>
  );
}
