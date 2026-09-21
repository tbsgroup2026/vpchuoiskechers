"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconFolder,
  IconUsers,
  IconChecklist,
  IconClock,
  IconShield,
  IconPlus,
  IconArrowLeft,
} from "@tabler/icons-react";

interface ProjectMember {
  empCode: string;
  name: string;
  department: string;
  role: string;
}

interface ProjectData {
  id: string;
  code: string;
  name: string;
  description: string;
  manager_name: string;
  progress: number;
  members: ProjectMember[];
}

const DEFAULT_PROJECT: ProjectData = {
  id: "PROJ-01",
  code: "PROJ-DIGITAL-2026",
  name: "Chuyển Đổi Số SKECHERS 2026",
  description: "Dự án số hóa toàn diện quy trình sản xuất, Gemba & MMTB Văn phòng chuỗi SKECHERS - TBS Group.",
  manager_name: "Phạm Nguyễn Anh Huy",
  progress: 75,
  members: [
    { empCode: "202608001", name: "Phạm Nguyễn Anh Huy", department: "IT_CDS", role: "PROJECT_MANAGER" },
    { empCode: "NS-001", name: "Nguyễn Thị Lan Anh", department: "NHAN_SU", role: "MEMBER" },
    { empCode: "QC-001", name: "Bùi Thị Hằng", department: "CHAT_LUONG_QC", role: "MEMBER" },
    { empCode: "KT-001", name: "Trần Thị Thu Hương", department: "KE_TOAN", role: "MEMBER" },
  ],
};

export default function ProjectWorkspaceView() {
  const [project, setProject] = useState<ProjectData>(DEFAULT_PROJECT);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProj = async () => {
      try {
        const res = await fetch("/api/projects?id=PROJ-01");
        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          if (data.success && data.project) {
            setProject(data.project);
          }
        }
      } catch (err) {
        console.error("Failed to load project from API, using default project state:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProj();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-8 space-y-4 animate-pulse">
        <div className="h-14 bg-slate-200 rounded-3xl w-full" />
        <div className="h-36 bg-slate-200 rounded-3xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 rounded-3xl" />
          <div className="lg:col-span-2 h-64 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs">
        <Link
          href="/work"
          className="px-4 py-2 bg-slate-100 hover:bg-[#006838] text-slate-700 hover:text-white rounded-2xl transition-all flex items-center gap-2 text-xs font-bold border border-slate-200"
          title="Quay lại Work Hub (/work)"
        >
          <IconArrowLeft size={18} />
          <span>Quay lại Work Hub (/work)</span>
        </Link>
      </div>

      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-lg space-y-2 border border-slate-700">
        <div className="flex items-center gap-2">
          <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/40">
            DỰ ÁN LIÊN PHÒNG BAN — SCOPE PROJECT INDEPENDENT
          </span>
          <span className="text-amber-400 font-mono text-xs">[{project.code}]</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{project.name}</h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <IconUsers size={20} className="text-blue-600" />
              <span>Thành Viên Dự Án ({project.members.length})</span>
            </h3>
          </div>

          <div className="space-y-2">
            {project.members.map((m) => (
              <div key={m.empCode} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">{m.name}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{m.department}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                    m.role === "PROJECT_MANAGER"
                      ? "bg-purple-100 text-purple-900 border border-purple-300"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 font-semibold italic pt-2 border-t border-slate-100">
            Lưu ý: Project Manager chỉ quản lý việc trong dự án này và không tự động truy cập dữ liệu phòng ban gốc của thành viên.
          </p>
        </div>

        {/* Progress & Kanban Info */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Tổng Tiến Độ Dự Án</span>
              <span className="text-emerald-700 font-black text-sm">{project.progress}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${project.progress}%` }} />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <IconChecklist size={36} className="mx-auto text-slate-400" />
            <h4 className="text-sm font-black text-slate-800">Không Gian Kanban Task Dự Án Độc Lập</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tất cả các task được gán trong dự án này sẽ xuất hiện trên Kanban Công việc của thành viên với tag dự án riêng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
