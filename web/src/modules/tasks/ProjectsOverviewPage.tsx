"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  IconPlus,
  IconChevronRight,
  IconArrowLeft,
  IconArrowRight,
  IconX,
  IconLayoutKanban,
  IconFolder,
  IconCheckbox,
  IconUsers,
  IconTrendingUp,
  IconCircleCheck,
  IconCpu,
  IconShoe,
  IconFileAnalytics,
  IconBulb,
  IconShieldCheck,
  IconArrowUpRight,
  IconLayersIntersect,
  IconBuildingStore,
  IconGridDots,
  IconPaperclip,
  IconUpload,
  IconFileText,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconPhoto,
  IconTrash,
  IconExternalLink,
  IconDownload,
  IconEye,
} from "@tabler/icons-react";
import { getCurrentUser } from "@/lib/userProfiles";
import { uploadCloudinaryFile } from "@/lib/cloudinary";
import MyTasksKanbanView, { TaskAttachment } from "./MyTasksKanbanView";

/* ── Initial Project Data ─────────────────────────────────────── */
const PROJECTS_INITIAL = [
  {
    id: "PRJ-AUTOMATION",
    name: "Tự động hóa dây chuyền & CĐS IT",
    dept: "Phòng IT & Chuyển đổi số",
    tag: "AUTOMATION & AI",
    accent: "#6366f1",       // Indigo
    accentBg: "#f5f3ff",
    accentBorder: "#e0e7ff",
    Icon: IconCpu,
    progress: 83,
    tasksCount: 3,
    doneCount: 2,
    members: 4,
    description: "Tự động hóa báo cáo, tích hợp AI Gemba & hệ thống ERP sản xuất.",
  },
  {
    id: "PRJ-SKECHERS-RETAIL",
    name: "Vận hành chuỗi Skechers HQ & Store",
    dept: "Phối hợp chuỗi Skechers",
    tag: "SKECHERS RETAIL",
    accent: "#006838",       // TBS Green
    accentBg: "#f0fdf4",
    accentBorder: "#bbf7d0",
    Icon: IconShoe,
    progress: 75,
    tasksCount: 2,
    doneCount: 1,
    members: 5,
    description: "Quản lý đơn hàng, kho vận và đồng bộ sản phẩm chuỗi cửa hàng.",
  },
  {
    id: "PRJ-ADMIN-EXPENSE",
    name: "Số hóa hành chính & đăng ký xe",
    dept: "Phòng Hành chính nhân sự",
    tag: "HÀNH CHÍNH & ISO",
    accent: "#d97706",       // Amber
    accentBg: "#fffbeb",
    accentBorder: "#fef08a",
    Icon: IconFileAnalytics,
    progress: 60,
    tasksCount: 2,
    doneCount: 1,
    members: 3,
    description: "Số hóa công tác phí, đăng ký xe công tác và phòng họp thông minh.",
  },
  {
    id: "PRJ-KAIZEN-152",
    name: "Sáng kiến cải tiến Kaizen & 1-5-2",
    dept: "Ban 2.2 / CI-152",
    tag: "KAIZEN 1-5-2",
    accent: "#0284c7",       // Sky/Blue
    accentBg: "#f0f9ff",
    accentBorder: "#bae6fd",
    Icon: IconBulb,
    progress: 80,
    tasksCount: 3,
    doneCount: 2,
    members: 6,
    description: "Thống kê đề xuất Kaizen, thẩm định hiệu quả tiết kiệm và chấm điểm.",
  },
  {
    id: "PRJ-GEMBA-SAFETY",
    name: "An toàn lao động & kiểm soát Gemba",
    dept: "Ban An toàn & QC",
    tag: "GEMBA SAFETY",
    accent: "#e11d48",       // Rose/Red
    accentBg: "#fff1f2",
    accentBorder: "#fecdd3",
    Icon: IconShieldCheck,
    progress: 50,
    tasksCount: 2,
    doneCount: 1,
    members: 4,
    description: "Ghi nhận lỗi Gemba walk, theo dõi khắc phục sự cố tại xưởng.",
  },
];

const COLOR_OPTIONS = [
  { key: "green",  hex: "#006838", bg: "#f0fdf4", border: "#bbf7d0" },
  { key: "blue",   hex: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" },
  { key: "indigo", hex: "#6366f1", bg: "#f5f3ff", border: "#e0e7ff" },
  { key: "amber",  hex: "#d97706", bg: "#fffbeb", border: "#fef08a" },
  { key: "rose",   hex: "#e11d48", bg: "#fff1f2", border: "#fecdd3" },
  { key: "slate",  hex: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
];

export default function ProjectsOverviewPage() {
  const [projects, setProjects] = useState(PROJECTS_INITIAL);
  const [selectedProject, setSelectedProject] = useState<(typeof PROJECTS_INITIAL)[0] | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal State & Attachments
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fName, setFName] = useState("");
  const [fDept, setFDept] = useState("");
  const [fTag, setFTag] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fColor, setFColor] = useState("green");
  const [fErr, setFErr] = useState("");
  const [fAttachments, setFAttachments] = useState<TaskAttachment[]>([]);
  const [isUploadingProjFile, setIsUploadingProjFile] = useState(false);
  const projFileInputRef = useRef<HTMLInputElement>(null);
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);

  const handleFileUploadToProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingProjFile(true);
      let fileUrl = "";

      try {
        const isImg = file.type.startsWith("image/");
        const uploadRes = await uploadCloudinaryFile(file, {
          category: "project_document",
          fileType: isImg ? "image" : "auto",
        });
        if (uploadRes.secure_url) {
          fileUrl = uploadRes.secure_url;
        }
      } catch (err) {
        console.warn("Cloudinary upload fallback to blob URL:", err);
      }

      if (!fileUrl) {
        fileUrl = URL.createObjectURL(file);
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      let docType: "doc" | "xls" | "pdf" | "img" | "other" = "other";
      if (["doc", "docx"].includes(ext)) docType = "doc";
      else if (["xls", "xlsx", "csv"].includes(ext)) docType = "xls";
      else if (ext === "pdf") docType = "pdf";
      else if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) docType = "img";

      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      const attachmentItem: TaskAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        url: fileUrl,
        type: docType,
        size: formattedSize,
        uploadedAt: new Date().toLocaleDateString("vi-VN"),
      };

      setFAttachments((prev) => [...prev, attachmentItem]);
    } catch (err: any) {
      alert("Lỗi tải tệp: " + err.message);
    } finally {
      setIsUploadingProjFile(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const id = p.get("project") || p.get("project_id");
      if (id) {
        const found = PROJECTS_INITIAL.find((x) => x.id === id);
        if (found) setSelectedProject(found);
      }
    }
  }, []);

  const roleLevel = currentUser?.roleLevel ?? 4;
  const canManage = roleLevel <= 3;

  const pickProject = (prj: (typeof projects)[0]) => {
    setSelectedProject(prj);
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.searchParams.set("project", prj.id);
      u.searchParams.set("name", prj.name);
      window.history.pushState({}, "", u.toString());
    }
  };

  const backToOverview = () => {
    setSelectedProject(null);
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.searchParams.delete("project");
      u.searchParams.delete("name");
      window.history.pushState({}, "", u.toString());
    }
  };

  const handleAddProject = () => {
    setFErr("");
    if (!fName.trim()) { setFErr("Vui lòng nhập tên dự án"); return; }
    if (!fTag.trim()) { setFErr("Vui lòng nhập nhãn phân loại"); return; }

    const c = COLOR_OPTIONS.find((o) => o.key === fColor) || COLOR_OPTIONS[0];
    const slug = fTag.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "");

    const newProject = {
      id: `PRJ-${slug}-${Date.now().toString(36).toUpperCase()}`,
      name: fName.trim(),
      dept: fDept.trim() || "Phòng Ban Chức Năng",
      tag: fTag.trim().toUpperCase(),
      accent: c.hex,
      accentBg: c.bg,
      accentBorder: c.border,
      Icon: IconFolder,
      progress: 0,
      tasksCount: 0,
      doneCount: 0,
      members: 1,
      description: fDesc.trim() || "Bảng quản lý công việc dự án mới tạo.",
    };

    setProjects((prev) => [newProject, ...prev]);
    setFName(""); setFDept(""); setFTag(""); setFDesc(""); setFColor("green"); setFAttachments([]);
    setIsAddOpen(false);
  };

  const totalTasks = projects.reduce((acc, p) => acc + p.tasksCount, 0);
  const doneTasks = projects.reduce((acc, p) => acc + p.doneCount, 0);
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) : 0;

  /* ── Sub-view: Kanban for Selected Project (No Banner, Direct Clean View) ─ */
  if (selectedProject) {
    const PrjIcon = selectedProject.Icon;
    return (
      <div className="space-y-4">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/work" className="hover:text-[#006838] transition-colors font-semibold flex items-center gap-1 cursor-pointer">
              <IconArrowLeft size={14} />
              Work Hub
            </Link>
            <IconChevronRight size={12} className="text-slate-300" />
            <button onClick={backToOverview} className="hover:text-slate-900 transition-colors font-semibold cursor-pointer">
              Tổng Quan Dự Án
            </button>
            <IconChevronRight size={12} className="text-slate-300" />
            <span className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <PrjIcon size={15} style={{ color: selectedProject.accent }} />
              {selectedProject.name}
            </span>
          </div>

          <button
            onClick={backToOverview}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <IconArrowLeft size={13} />
            Quay Về Danh Sách
          </button>
        </nav>

        {/* Embedded Kanban Board */}
        <MyTasksKanbanView projectId={selectedProject.id} projectName={selectedProject.name} />
      </div>
    );
  }

  /* ── Executive Overview Main Page ───────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
            <Link href="/work" className="hover:text-[#006838] transition-colors flex items-center gap-1 cursor-pointer">
              <IconArrowLeft size={13} />
              Work Hub
            </Link>
            <IconChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-900 font-semibold">Tổng Quan Dự Án</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Dự Án & Bảng Công Việc
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              VP Chuỗi Skechers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Chọn dự án để mở bảng quản lý Kanban tương ứng hoặc theo dõi tiến độ công việc tổng thể.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-2xs transition-all duration-150 cursor-pointer shrink-0"
            style={{ backgroundColor: "#006838" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#005230")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#006838")}
          >
            <IconPlus size={16} />
            <span>Thêm Dự Án Mới</span>
          </button>
        )}
      </div>

      {/* KPI Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: "Tổng dự án", value: projects.length, Icon: IconFolder, color: "#006838", bg: "#f0fdf4" },
          { label: "Tổng công việc", value: totalTasks, Icon: IconCheckbox, color: "#0284c7", bg: "#f0f9ff" },
          { label: "Đã hoàn thành", value: doneTasks, Icon: IconCircleCheck, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Tiến độ trung bình", value: `${avgProgress}%`, Icon: IconTrendingUp, color: "#6366f1", bg: "#f5f3ff" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between"
          >
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">{s.label}</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {s.value}
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100"
              style={{ backgroundColor: s.bg }}
            >
              <s.Icon size={20} style={{ color: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Projects Grid Section */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconLayersIntersect size={18} className="text-[#006838]" />
            <h2 className="text-base font-semibold text-slate-900">
              Danh sách dự án đang trực thuộc
            </h2>
          </div>
          <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {projects.length} dự án
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {projects.map((prj) => {
            const PIcon = prj.Icon;
            return (
              <div
                key={prj.id}
                onClick={() => pickProject(prj)}
                className="bg-white hover:bg-slate-50/80 border border-[#E5E9E7] hover:border-emerald-300 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between h-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006838] focus-visible:ring-offset-2"
              >
                <div className="space-y-3.5">
                  {/* Top Row: Icon Box 36px + Title (max 2 lines) + Code */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006838] border border-emerald-200/80 flex items-center justify-center shrink-0 group-hover:bg-[#006838] group-hover:text-white transition-colors">
                      <PIcon size={18} stroke={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-[15px] font-semibold text-slate-900 group-hover:text-[#006838] transition-colors line-clamp-2 leading-snug"
                        title={prj.name}
                      >
                        {prj.name}
                      </h3>
                      <span className="text-xs font-mono text-slate-400 font-normal block mt-0.5">
                        {prj.id.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {/* Description: 13px text-secondary, line-clamp 2 lines, min-h 2 lines */}
                  <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed min-h-[38px] font-normal">
                    {prj.description}
                  </p>

                  {/* Department Section: Label top, Value bottom */}
                  <div className="pt-3 border-t border-[#E5E9E7]">
                    <div className="text-xs text-slate-400 font-normal mb-0.5">
                      Đơn vị quản lý
                    </div>
                    <div className="text-[13px] font-medium text-slate-800 leading-snug truncate" title={prj.dept}>
                      {prj.dept}
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-normal">Tiến độ</span>
                      <span className="text-[13px] font-semibold text-[#006838]">
                        {prj.progress}%
                      </span>
                    </div>
                    <div
                      className="w-full h-1.5 bg-[#E8ECEA] rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={prj.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          prj.progress === 100 ? "bg-emerald-500" : "bg-[#006838]"
                        }`}
                        style={{ width: `${prj.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-[#E5E9E7] flex items-center justify-between text-[13px]">
                  <span className="text-slate-500 font-normal whitespace-nowrap">
                    {prj.tasksCount} thẻ công việc
                  </span>
                  <span className="text-[#006838] font-medium group-hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap">
                    Xem bảng Kanban <IconArrowRight size={14} stroke={1.75} />
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add Project Card Button */}
          {canManage && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200/90 hover:border-[#006838] rounded-2xl p-5 min-h-[240px] flex flex-col items-center justify-center text-center gap-3 group cursor-pointer shadow-2xs transition-all duration-150"
            >
              <div className="w-9 h-9 rounded-xl bg-white text-[#006838] border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <IconPlus size={18} stroke={2} />
              </div>
              <div className="space-y-0.5 px-4">
                <div className="text-sm font-semibold text-[#006838]">
                  Tạo dự án mới
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
                  Khởi tạo bảng Kanban quản lý công việc mới
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ── Modal: Create New Project ─────────────────────────────────── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006838] flex items-center justify-center">
                  <IconFolder size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Thêm Dự Án Mới
                  </h3>
                  <p className="text-xs text-slate-500">Tạo bảng Kanban cho dự án phòng ban</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <IconX size={14} />
              </button>
            </div>

            {/* Modal Form Fields */}
            <div className="px-5 py-4 space-y-3.5">
              <FormField label="Tên Dự Án" required>
                <input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="Ví dụ: Quy Trình Kiểm Soát Chất Lượng..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:border-[#006838] focus:bg-white transition"
                />
              </FormField>

              <FormField label="Phòng Ban Phụ Trách">
                <input
                  value={fDept}
                  onChange={(e) => setFDept(e.target.value)}
                  placeholder="Ví dụ: Phòng QC & Chất Lượng..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:border-[#006838] focus:bg-white transition"
                />
              </FormField>

              <FormField label="Nhãn Phân Loại (Tag)" required>
                <input
                  value={fTag}
                  onChange={(e) => setFTag(e.target.value)}
                  placeholder="Ví dụ: QUALITY & QC"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:border-[#006838] focus:bg-white transition"
                />
              </FormField>

              <FormField label="Màu Chủ Đạo Dự Án">
                <div className="flex items-center gap-2.5 pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setFColor(c.key)}
                      className={`w-7 h-7 rounded-lg border-2 transition flex items-center justify-center cursor-pointer ${
                        fColor === c.key ? "border-slate-800 scale-110 shadow-xs ring-2 ring-slate-400/30" : "border-transparent opacity-75 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={`Tông màu: ${c.key}`}
                    >
                      {fColor === c.key && (
                        <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Import File Document Attachments (Word, Excel, PDF, Images) */}
              <FormField label="Import File / Tài Liệu Liên Quan (Word, Excel, PDF, Hình Ảnh)">
                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="file"
                      ref={projFileInputRef}
                      onChange={handleFileUploadToProject}
                      accept=".doc,.docx,.xls,.xlsx,.csv,.pdf,.png,.jpg,.jpeg,.gif,.webp,.zip"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => projFileInputRef.current?.click()}
                      disabled={isUploadingProjFile}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-50 active:scale-95 shadow-2xs"
                    >
                      <IconUpload size={14} />
                      <span>{isUploadingProjFile ? "Đang tải tệp..." : "Tải File Word, Excel, PDF, Hình Ảnh"}</span>
                    </button>
                  </div>

                  {fAttachments.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                      {fAttachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-slate-200 text-xs">
                          <div
                            className="flex items-center gap-2 truncate flex-1 cursor-pointer"
                            onClick={() => setPreviewAttachment(att)}
                            title="Bấm để xem pop-up tab file"
                          >
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              att.type === "doc" ? "bg-blue-100 text-blue-800" :
                              att.type === "xls" ? "bg-emerald-100 text-emerald-800" :
                              att.type === "pdf" ? "bg-rose-100 text-rose-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {att.type}
                            </span>
                            <span className="font-bold text-slate-800 truncate hover:text-[#006838]">{att.name}</span>
                            <span className="text-[10px] text-slate-400">({att.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                            className="text-rose-500 hover:text-rose-700 p-0.5 rounded transition cursor-pointer"
                          >
                            <IconX size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormField>

              <FormField label="Mô Tả Ngắn">
                <textarea
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  placeholder="Mô tả mục tiêu chính của dự án..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:border-[#006838] focus:bg-white transition resize-none"
                />
              </FormField>

              {fErr && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  ⚠️ {fErr}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-white transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleAddProject}
                className="flex-1 py-2 rounded-lg text-white text-xs font-bold transition cursor-pointer"
                style={{ backgroundColor: "#006838" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#005230")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#006838")}
              >
                Tạo Dự Án
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW POP-UP TAB MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] flex flex-col font-sans relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 ${
                  previewAttachment.type === "doc" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                  previewAttachment.type === "xls" ? "bg-emerald-100 text-emerald-900 border border-emerald-200" :
                  previewAttachment.type === "pdf" ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-purple-100 text-purple-800 border border-purple-200"
                }`}>
                  [{previewAttachment.type.toUpperCase()}]
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate" title={previewAttachment.name}>
                    {previewAttachment.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Kích thước: {previewAttachment.size || "Chưa rõ"} • Tải lên ngày {previewAttachment.uploadedAt}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(previewAttachment.url, "_blank")}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  title="Mở tài liệu hiển thị đầy đủ trong tab mới"
                >
                  <IconExternalLink size={15} />
                  <span>Mở Tab Mới</span>
                </button>
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Tải xuống tài liệu"
                >
                  <IconDownload size={15} />
                  <span>Tải Xuống</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className="flex-1 bg-slate-100/70 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center p-2 min-h-[480px]">
              {previewAttachment.type === "img" ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md"
                />
              ) : previewAttachment.type === "pdf" ? (
                <iframe
                  src={previewAttachment.url}
                  title={previewAttachment.name}
                  className="w-full h-[70vh] rounded-lg border-0 bg-white"
                />
              ) : previewAttachment.url.startsWith("http") ? (
                /* Office Online Viewer Iframe */
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewAttachment.url)}`}
                  title={previewAttachment.name}
                  className="w-full h-[70vh] rounded-lg border-0 bg-white"
                />
              ) : (
                /* Local/Blob Fallback Banner */
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center shadow-2xs border border-emerald-100">
                    <IconFileText size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{previewAttachment.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Tài liệu đính kèm đã sẵn sàng. Bấm nút dưới để hiển thị đầy đủ file trong tab trình duyệt mới!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(previewAttachment.url, "_blank")}
                    className="px-5 py-2.5 rounded-xl bg-[#006838] hover:bg-[#004d29] text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <IconExternalLink size={16} />
                    <span>Mở File Hiển Thị Đầy Đủ Trong Tab Mới</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Form Field Label Helper ──────────────────────────────────── */
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
