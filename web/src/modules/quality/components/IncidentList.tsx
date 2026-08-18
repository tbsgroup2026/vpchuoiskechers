"use client";

import React, { useState } from "react";
import { IncidentItem } from "../types";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconClock,
  IconExternalLink,
  IconCheck,
  IconLoader2,
  IconPlayerPlay,
} from "@tabler/icons-react";

interface IncidentListProps {
  incidents: IncidentItem[];
  portalUrl?: string;
}

export default function IncidentList({ incidents, portalUrl }: IncidentListProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredIncidents =
    filter === "all" ? incidents : incidents.filter((i) => i.status === filter);

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <IconAlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              🚨 Sự Cố Đang Cần Xử Lý (KG1)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Danh sách phiếu phát hiện lỗi chất lượng & bảo trì trực tiếp trên chuyền
            </p>
          </div>
        </div>

        {/* Filter Pills & Portal CTA */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold text-slate-600">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === "all" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              Tất cả ({incidents.length})
            </button>
            <button
              onClick={() => setFilter("unprocessed")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === "unprocessed" ? "bg-amber-100 text-amber-900 shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              Chưa xử lý
            </button>
            <button
              onClick={() => setFilter("processing")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === "processing" ? "bg-blue-100 text-blue-900 shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              Đang xử lý
            </button>
          </div>

          {portalUrl && (
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-[#006838] hover:bg-[#006838] hover:text-white border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
            >
              <span>Xem trên Portal KG1</span>
              <IconExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Incident List Rows */}
      <div className="space-y-2.5">
        {filteredIncidents.map((incident) => {
          let statusBadge = (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Chưa xử lý
            </span>
          );

          if (incident.status === "processing") {
            statusBadge = (
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1">
                <IconLoader2 size={12} className="animate-spin-slow" />
                Đang xử lý
              </span>
            );
          } else if (incident.status === "trial") {
            statusBadge = (
              <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold flex items-center gap-1">
                <IconPlayerPlay size={12} />
                Chạy thử
              </span>
            );
          } else if (incident.status === "completed") {
            statusBadge = (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#006838] border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                <IconCheck size={12} />
                Đã hoàn thành
              </span>
            );
          }

          return (
            <div
              key={incident.id}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200 hover:border-[#006838] hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              {/* Left Details */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    {incident.code}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {incident.workshop} → {incident.line} → {incident.team}
                  </span>
                  {incident.severity === "critical" && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black uppercase">
                      SOS
                    </span>
                  )}
                </div>

                <div className="text-sm font-black text-slate-900 group-hover:text-[#006838] transition-colors truncate">
                  {incident.errorType}
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                  <span>Người báo: <strong>{incident.reporter}</strong></span>
                  <span>•</span>
                  <span>{incident.createdAt}</span>
                </div>
              </div>

              {/* Right Status & Metric */}
              <div className="flex items-center gap-3 sm:flex-col sm:items-end justify-between flex-shrink-0">
                {statusBadge}

                {incident.slaRemaining && (
                  <div className="text-xs font-black text-amber-700 flex items-center gap-1">
                    <IconClock size={13} />
                    <span>SLA còn: {incident.slaRemaining}</span>
                  </div>
                )}

                {incident.mttrMinutes && (
                  <div className="text-xs font-bold text-slate-500">
                    MTTR: <strong className="text-slate-800">{incident.mttrMinutes} phút</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
