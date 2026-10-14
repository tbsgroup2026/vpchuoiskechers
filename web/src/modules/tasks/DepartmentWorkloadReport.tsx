"use client";

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  IconUsers,
  IconDownload,
  IconPrinter,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconArrowRight,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconX,
  IconLoader2,
  IconBriefcase,
  IconCheck,
} from "@tabler/icons-react";
import UserAvatar from "@/components/UserAvatar";

export interface WorkloadStaff {
  empCode: string;
  name: string;
  position: string;
  department: string;
}

export interface WorkloadTask {
  id: string;
  code: string;
  title: string;
  status: string;
  progress: number;
  priority: string;
  due_date: string;
  assignee_emp_code: string;
  assignee_name: string;
  reporter_emp_code?: string;
  department_id?: string;
  project_id?: string;
  result_description?: string;
  updated_at?: string;
}

interface DepartmentWorkloadReportProps {
  tasks: WorkloadTask[];
  staffList: WorkloadStaff[];
  deptName?: string;
  isManager?: boolean;
  onTaskReassigned?: () => void;
}

export default function DepartmentWorkloadReport({
  tasks,
  staffList,
  deptName = "Văn Phòng Chuỗi SKECHERS",
  isManager = true,
  onTaskReassigned,
}: DepartmentWorkloadReportProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [reassignModal, setReassignModal] = useState<{
    task: WorkloadTask;
    currentAssignee: WorkloadStaff;
  } | null>(null);
  const [targetAssigneeCode, setTargetAssigneeCode] = useState<string>("");
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Calculate workload per staff member
  const staffWorkload = useMemo(() => {
    return staffList.map((staff) => {
      const staffTasks = tasks.filter(
        (t) =>
          t.assignee_emp_code === staff.empCode ||
          (t.assignee_name && staff.name && t.assignee_name.toLowerCase().includes(staff.name.toLowerCase()))
      );

      const doingTasks = staffTasks.filter((t) => t.status === "DOING" || t.status === "in_progress");
      const doneTasks = staffTasks.filter((t) => t.status === "DONE" || t.status === "done");
      const reviewTasks = staffTasks.filter((t) => t.status === "REVIEW" || t.status === "pending_review");
      const helpTasks = staffTasks.filter((t) => t.status === "NEED_HELP" || t.status === "need_help");
      const overdueTasks = staffTasks.filter((t) => {
        if (!t.due_date || t.status === "DONE") return false;
        return new Date(t.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
      });

      const total = staffTasks.length;
      const doingCount = doingTasks.length;
      const doneCount = doneTasks.length;

      // Status classification
      let workloadStatus: "OVERLOAD" | "FREE" | "NORMAL" = "NORMAL";
      if (doingCount > 5) {
        workloadStatus = "OVERLOAD";
      } else if (doingCount === 0) {
        workloadStatus = "FREE";
      }

      return {
        staff,
        total,
        doingCount,
        doneCount,
        reviewCount: reviewTasks.length,
        helpCount: helpTasks.length,
        overdueCount: overdueTasks.length,
        workloadStatus,
        completionRate: total > 0 ? Math.round((doneCount / total) * 100) : 0,
        tasks: staffTasks,
        doingTasks,
      };
    });
  }, [staffList, tasks]);

  // Overload vs Free summary
  const overloadedStaff = staffWorkload.filter((s) => s.workloadStatus === "OVERLOAD");
  const freeStaff = staffWorkload.filter((s) => s.workloadStatus === "FREE");

  // Filtered staff list for display
  const displayedStaff = staffWorkload.filter(
    (s) =>
      !filterQuery.trim() ||
      s.staff.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.staff.empCode.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.staff.position.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // 1. Export Excel function
  const handleExportExcel = () => {
    // Sheet 1: Tasks List
    const taskRows = tasks.map((t, idx) => ({
      "STT": idx + 1,
      "Mã công việc": t.code || `TSK-${t.id.slice(0, 5)}`,
      "Tiêu đề": t.title,
      "Phòng ban": t.department_id || deptName,
      "Dự án": t.project_id || "Chung",
      "Người thực hiện": t.assignee_name || t.assignee_emp_code,
      "Mã NV": t.assignee_emp_code,
      "Độ ưu tiên": t.priority || "MEDIUM",
      "Trạng thái": t.status,
      "Tiến độ (%)": `${t.progress || 0}%`,
      "Hạn chót": t.due_date ? t.due_date.substring(0, 10) : "",
      "Kết quả nghiệm thu": t.result_description || "",
    }));

    // Sheet 2: Workload Summary
    const workloadRows = staffWorkload.map((s, idx) => ({
      "STT": idx + 1,
      "Họ và tên": s.staff.name,
      "Mã NV": s.staff.empCode,
      "Vị trí / Chức danh": s.staff.position,
      "Tổng số việc": s.total,
      "Đang thực hiện (DOING)": s.doingCount,
      "Chờ duyệt (REVIEW)": s.reviewCount,
      "Đã hoàn thành (DONE)": s.doneCount,
      "Quá hạn": s.overdueCount,
      "Tỷ lệ hoàn thành (%)": `${s.completionRate}%`,
      "Tình trạng tải":
        s.workloadStatus === "OVERLOAD"
          ? "QUÁ TẢI (>5 việc)"
          : s.workloadStatus === "FREE"
          ? "RẢNH RỖI (0 việc)"
          : "Bình thường",
    }));

    const wb = XLSX.utils.book_new();

    const wsTasks = XLSX.utils.json_to_sheet(taskRows);
    const wsWorkload = XLSX.utils.json_to_sheet(workloadRows);

    // Auto width
    const autoWidth = (ws: any, rows: any[]) => {
      if (!rows.length) return;
      const keys = Object.keys(rows[0]);
      ws["!cols"] = keys.map((key) => {
        let maxLen = key.length;
        rows.forEach((r) => {
          const val = String(r[key] || "");
          if (val.length > maxLen) maxLen = Math.min(val.length, 40);
        });
        return { wch: maxLen + 3 };
      });
    };

    autoWidth(wsTasks, taskRows);
    autoWidth(wsWorkload, workloadRows);

    XLSX.utils.book_append_sheet(wb, wsTasks, "Danh_Sach_Cong_Viec");
    XLSX.utils.book_append_sheet(wb, wsWorkload, "Phan_Bo_Tai_Nhan_Su");

    const dateStr = new Date().toISOString().substring(0, 10);
    XLSX.writeFile(wb, `Bao_Cao_Cong_Viec_TBS_${deptName.replace(/\s+/g, "_")}_${dateStr}.xlsx`);
  };

  // 2. Print Report function (A4 landscape)
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  // 3. Quick Reassign task from Overloaded staff to Free/Normal staff
  const handleConfirmReassign = async () => {
    if (!reassignModal || !targetAssigneeCode) return;
    const targetStaff = staffList.find((s) => s.empCode === targetAssigneeCode);
    if (!targetStaff) return;

    setIsSubmittingReassign(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId: reassignModal.task.id,
          assignee_emp_code: targetStaff.empCode,
          assignee_name: targetStaff.name,
          force: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✓ Đã chuyển thành công công việc [${reassignModal.task.code}] từ ${reassignModal.currentAssignee.name} sang ${targetStaff.name}!`);
        setReassignModal(null);
        if (onTaskReassigned) onTaskReassigned();
      } else {
        alert(`Lỗi chuyển việc: ${data.error || "Không thể lưu"}`);
      }
    } catch {
      alert("Lỗi kết nối khi chuyển việc!");
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Screen UI Header & Action Toolbar ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006838] flex items-center justify-center shrink-0">
              <IconUsers size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Phân Bổ Tải Công Việc & Báo Cáo Phòng Ban
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {deptName} • Theo dõi nhân sự quá tải / rảnh rỗi và xuất báo cáo chuẩn TBS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <IconDownload size={16} />
              <span>Xuất Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-[#006838] hover:bg-emerald-800 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <IconPrinter size={16} />
              <span>In Báo Cáo / Xuất PDF</span>
            </button>
          </div>
        </div>

        {/* Status Callout Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-xs">
                {overloadedStaff.length}
              </div>
              <div>
                <span className="text-xs font-black text-rose-900 block">Đang Quá Tải</span>
                <span className="text-[10px] text-rose-600 font-medium">&gt; 5 việc đang thực hiện</span>
              </div>
            </div>
            {overloadedStaff.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-black animate-pulse">
                Cần san việc
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#006838] text-white flex items-center justify-center font-black text-xs">
                {freeStaff.length}
              </div>
              <div>
                <span className="text-xs font-black text-emerald-900 block">Đang Rảnh Rỗi</span>
                <span className="text-[10px] text-emerald-600 font-medium">0 việc đang làm (Sẵn sàng)</span>
              </div>
            </div>
            <span className="text-xs font-black text-[#006838]">
              {freeStaff.length} nhân sự
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                {staffList.length}
              </div>
              <div>
                <span className="text-xs font-black text-blue-900 block">Tổng Nhân Sự</span>
                <span className="text-[10px] text-blue-600 font-medium">{tasks.length} tổng nhiệm vụ</span>
              </div>
            </div>
            <span className="text-xs font-black text-blue-800">
              {staffWorkload.filter((s) => s.workloadStatus === "NORMAL").length} bình thường
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm nhân sự theo tên, mã NV hoặc vị trí công việc..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#006838] focus:bg-white transition"
          />
        </div>
      </div>

      {/* ── Screen Workload Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 print:hidden">
        {displayedStaff.map((item) => {
          const { staff, total, doingCount, doneCount, reviewCount, helpCount, overdueCount, workloadStatus, completionRate, doingTasks } = item;
          const isOverload = workloadStatus === "OVERLOAD";
          const isFree = workloadStatus === "FREE";

          return (
            <div
              key={staff.empCode}
              className={`p-5 rounded-2xl bg-white border transition shadow-2xs hover:shadow-md space-y-4 flex flex-col justify-between ${
                isOverload
                  ? "border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/20"
                  : isFree
                  ? "border-emerald-200 bg-emerald-50/10"
                  : "border-slate-200"
              }`}
            >
              <div className="space-y-3">
                {/* Staff Header with Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={staff.name} size="md" />
                    <div>
                      <h3 className="font-black text-sm text-slate-900 leading-snug">{staff.name}</h3>
                      <span className="text-[11px] text-slate-500 font-mono font-bold block">
                        MSNV: {staff.empCode} • {staff.position}
                      </span>
                    </div>
                  </div>

                  {isOverload ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shrink-0 flex items-center gap-1 shadow-xs animate-pulse">
                      <IconAlertTriangle size={12} />
                      <span>Quá tải ({doingCount})</span>
                    </span>
                  ) : isFree ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0 border border-emerald-300 flex items-center gap-1">
                      <IconCircleCheck size={12} />
                      <span>Đang rảnh</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0">
                      Bình thường ({doingCount})
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-500 text-[11px]">Tiến độ công việc</span>
                    <span className="font-mono text-[#006838]">{completionRate}% ({doneCount}/{total})</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isOverload ? "bg-rose-500" : "bg-[#006838]"
                      }`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* KPI Micro Badges */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-black">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                    <div>{doingCount}</div>
                    <div className="text-[9px] font-medium text-amber-700">Đang làm</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                    <div>{reviewCount}</div>
                    <div className="text-[9px] font-medium text-blue-700">Chờ duyệt</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                    <div>{doneCount}</div>
                    <div className="text-[9px] font-medium text-emerald-700">Đã xong</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-200">
                    <div>{overdueCount}</div>
                    <div className="text-[9px] font-medium text-rose-700">Quá hạn</div>
                  </div>
                </div>

                {/* Active Doing Tasks Preview */}
                {doingTasks.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      Việc đang làm ({doingTasks.length}):
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                      {doingTasks.slice(0, 4).map((t) => (
                        <div
                          key={t.id}
                          className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                        >
                          <span className="font-bold text-slate-800 truncate flex-1">
                            #{t.code}: {t.title}
                          </span>
                          {isManager && isOverload && (
                            <button
                              type="button"
                              onClick={() => setReassignModal({ task: t, currentAssignee: staff })}
                              className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold shrink-0 transition cursor-pointer"
                              title="Chuyển việc này cho nhân sự khác"
                            >
                              Chuyển bớt
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {isManager && isOverload && doingTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReassignModal({ task: doingTasks[0], currentAssignee: staff })}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  <IconArrowRight size={14} />
                  <span>San sẻ việc ngay</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── MODAL: QUICK REASSIGN WORKLOAD ── */}
      {reassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#006838]">
                <IconBriefcase size={20} />
                <h3 className="text-base font-black text-slate-900">San sẻ / Chuyển việc công việc</h3>
              </div>
              <button
                type="button"
                onClick={() => setReassignModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-900">
                #{reassignModal.task.code}: {reassignModal.task.title}
              </div>
              <div className="text-[11px] text-slate-500">
                Đang giao cho: <span className="font-bold text-rose-700">{reassignModal.currentAssignee.name}</span> (Quá tải)
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-black text-slate-700 block">
                Chọn nhân sự tiếp nhận (Ưu tiên người đang rảnh):
              </label>
              <select
                value={targetAssigneeCode}
                onChange={(e) => setTargetAssigneeCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-[#006838]"
              >
                <option value="">-- Chọn nhân sự tiếp nhận --</option>
                {staffWorkload
                  .filter((s) => s.staff.empCode !== reassignModal.currentAssignee.empCode)
                  .map((s) => (
                    <option key={s.staff.empCode} value={s.staff.empCode}>
                      {s.staff.name} ({s.staff.empCode}) — {s.doingCount === 0 ? "🟢 ĐANG RẢNH (0 việc)" : `${s.doingCount} việc đang làm`}
                    </option>
                  ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setReassignModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer min-h-[40px]"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!targetAssigneeCode || isSubmittingReassign}
                onClick={handleConfirmReassign}
                className="px-5 py-2 rounded-xl bg-[#006838] hover:bg-emerald-800 text-white text-xs font-black shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[40px]"
              >
                {isSubmittingReassign && <IconLoader2 size={16} className="animate-spin" />}
                <span>Xác nhận chuyển việc</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT TEMPLATE: A4 LANDSCAPE OFFICIAL TBS REPORT ── */}
      <div className="hidden print:block font-sans text-black p-4">
        <style jsx global>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 12mm 15mm 12mm 15mm;
            }
            body {
              background: white !important;
              color: black !important;
              font-family: Arial, "Times New Roman", sans-serif;
            }
          }
        `}</style>

        {/* Corporate Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          <div>
            <div className="text-xs font-black uppercase tracking-wider">TẬP ĐOÀN TBS GROUP - VĂN PHÒNG CHUỖI SKECHERS</div>
            <div className="text-sm font-black text-black">{deptName.toUpperCase()}</div>
          </div>
          <div className="text-right text-[11px]">
            <div>Mẫu biểu: TBS-WORK-RP-2026</div>
            <div>Ngày in: {new Date().toLocaleDateString("vi-VN")}</div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center my-4 space-y-1">
          <h1 className="text-lg font-black uppercase tracking-tight">
            BÁO CÁO TIẾN ĐỘ & PHÂN BỔ TẢI CÔNG VIỆC PHÒNG BAN
          </h1>
          <p className="text-xs italic">
            Áp dụng cho đợt Pilot 100 người dùng • Tháng {new Date().getMonth() + 1}/2026
          </p>
        </div>

        {/* KPI Summary Cards for Print */}
        <div className="grid grid-cols-5 gap-2 my-3 text-center text-xs font-bold border border-black p-2 bg-slate-50">
          <div>Tổng công việc: <span className="font-black">{tasks.length}</span></div>
          <div>Đã hoàn thành: <span className="font-black text-emerald-800">{tasks.filter((t) => t.status === "DONE").length}</span></div>
          <div>Đang thực hiện: <span className="font-black text-amber-800">{tasks.filter((t) => t.status === "DOING").length}</span></div>
          <div>Chờ nghiệm thu: <span className="font-black text-blue-800">{tasks.filter((t) => t.status === "REVIEW").length}</span></div>
          <div>Tỷ lệ xong: <span className="font-black">{tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "DONE").length / tasks.length) * 100) : 0}%</span></div>
        </div>

        {/* Table 1: Workload Summary per Staff */}
        <div className="my-3 space-y-1">
          <h3 className="text-xs font-black uppercase">1. Bảng Phân Bổ Tải Nhân Sự</h3>
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-black p-1 text-center w-8">STT</th>
                <th className="border border-black p-1 text-left">Họ và tên</th>
                <th className="border border-black p-1 text-center w-16">MSNV</th>
                <th className="border border-black p-1 text-left">Chức vụ</th>
                <th className="border border-black p-1 text-center w-12">Tổng</th>
                <th className="border border-black p-1 text-center w-14">Đang làm</th>
                <th className="border border-black p-1 text-center w-14">Chờ duyệt</th>
                <th className="border border-black p-1 text-center w-14">Đã xong</th>
                <th className="border border-black p-1 text-center w-14">Tiến độ</th>
                <th className="border border-black p-1 text-center w-24">Tình trạng tải</th>
              </tr>
            </thead>
            <tbody>
              {staffWorkload.map((s, idx) => (
                <tr key={s.staff.empCode} className="border-b border-black">
                  <td className="border border-black p-1 text-center">{idx + 1}</td>
                  <td className="border border-black p-1 font-bold">{s.staff.name}</td>
                  <td className="border border-black p-1 text-center font-mono">{s.staff.empCode}</td>
                  <td className="border border-black p-1">{s.staff.position}</td>
                  <td className="border border-black p-1 text-center font-bold">{s.total}</td>
                  <td className="border border-black p-1 text-center">{s.doingCount}</td>
                  <td className="border border-black p-1 text-center">{s.reviewCount}</td>
                  <td className="border border-black p-1 text-center">{s.doneCount}</td>
                  <td className="border border-black p-1 text-center font-bold">{s.completionRate}%</td>
                  <td className="border border-black p-1 text-center font-bold">
                    {s.workloadStatus === "OVERLOAD"
                      ? "QUÁ TẢI"
                      : s.workloadStatus === "FREE"
                      ? "RẢNH RỖI"
                      : "Bình thường"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table 2: Detailed Tasks List */}
        <div className="my-3 space-y-1">
          <h3 className="text-xs font-black uppercase">2. Danh Sách Chi Tiết Công Việc</h3>
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-black p-1 text-center w-8">STT</th>
                <th className="border border-black p-1 text-center w-16">Mã CV</th>
                <th className="border border-black p-1 text-left">Tên công việc</th>
                <th className="border border-black p-1 text-left w-28">Người thực hiện</th>
                <th className="border border-black p-1 text-center w-14">Ưu tiên</th>
                <th className="border border-black p-1 text-center w-16">Hạn chót</th>
                <th className="border border-black p-1 text-center w-14">Trạng thái</th>
                <th className="border border-black p-1 text-center w-12">Tiến độ</th>
              </tr>
            </thead>
            <tbody>
              {tasks.slice(0, 30).map((t, idx) => (
                <tr key={t.id} className="border-b border-black">
                  <td className="border border-black p-1 text-center">{idx + 1}</td>
                  <td className="border border-black p-1 text-center font-mono font-bold">{t.code}</td>
                  <td className="border border-black p-1 font-medium">{t.title}</td>
                  <td className="border border-black p-1">{t.assignee_name || t.assignee_emp_code}</td>
                  <td className="border border-black p-1 text-center">{t.priority}</td>
                  <td className="border border-black p-1 text-center">{t.due_date ? t.due_date.substring(0, 10) : ""}</td>
                  <td className="border border-black p-1 text-center font-bold">{t.status}</td>
                  <td className="border border-black p-1 text-center">{t.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures Section */}
        <div className="grid grid-cols-2 text-center text-xs pt-6 mt-6 border-t border-black">
          <div>
            <div className="font-bold uppercase">NGƯỜI LẬP BIỂU</div>
            <div className="text-[10px] italic">(Ký và ghi rõ họ tên)</div>
            <div className="h-16"></div>
          </div>
          <div>
            <div className="font-bold uppercase">TRƯỞNG PHÒNG / QUẢN ĐỐC PHÊ DUYỆT</div>
            <div className="text-[10px] italic">(Ký và ghi rõ họ tên)</div>
            <div className="h-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
