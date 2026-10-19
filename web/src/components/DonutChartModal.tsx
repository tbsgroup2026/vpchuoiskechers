"use client";

import { useEffect } from "react";
import { IconX, IconChartPie } from "@tabler/icons-react";
import { DonutChartCard, DonutDataItem } from "@/components/dashboard";

interface DonutChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonutChartModal({ isOpen, onClose }: DonutChartModalProps) {
  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const breakdown: DonutDataItem[] = [
    { key: "zone-a", label: "Zone A - Xưởng May 01", value: 120, percent: 30.2, color: "#006838" },
    { key: "zone-b", label: "Zone B - Xưởng Ép Đế", value: 85, percent: 21.4, color: "#22c55e" },
    { key: "zone-c", label: "Zone C - Xưởng Hoàn Thiện", value: 74, percent: 18.6, color: "#f59e0b" },
    { key: "zone-d", label: "Zone D - Logistics TTPP", value: 52, percent: 13.1, color: "#3b82f6" },
    { key: "rd", label: "Khu Vực R&D Mẫu", value: 41, percent: 10.3, color: "#8b5cf6" },
    { key: "qc", label: "Trung Tâm QC", value: 26, percent: 6.5, color: "#ec4899" },
  ];

  const total = breakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#006838] via-[#00522c] to-[#08221a] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 shadow-xs">
              <IconChartPie size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Phân Bổ Chỉ Số Cải Tiến Theo Khu Vực
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                Văn Phòng Chuỗi SKECHERS - TBS Group Dashboard 24/7
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Modal Body: Standardized DonutChartCard */}
        <div className="p-4">
          <DonutChartCard
            title="TỔNG HỢP CẢI TIẾN THEO KHU VỰC"
            icon={IconChartPie}
            centerLabel="TBS GROUP"
            centerTotal={total}
            centerSubtitle="Tổng Cải Tiến"
            breakdown={breakdown}
            maxLegendRows={8}
          />
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>Hệ Thống Báo Cáo Cải Tiến Tự Động SKECHERS - TBS Group</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#006838] text-white font-extrabold hover:bg-[#00522c] transition-colors cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
