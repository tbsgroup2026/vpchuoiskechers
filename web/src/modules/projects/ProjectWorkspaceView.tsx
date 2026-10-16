"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  IconFolder,
  IconUsers,
  IconChecklist,
  IconClock,
  IconShield,
  IconPlus,
  IconArrowLeft,
  IconAlertTriangle,
  IconLock,
  IconLockOpen,
  IconFilter,
  IconSearch,
  IconBuilding,
  IconTrendingUp,
  IconSparkles,
  IconCheck,
  IconX,
  IconBriefcase,
  IconCalendar,
  IconChevronRight,
  IconRefresh,
  IconLoader2,
  IconBolt,
  IconFlame,
} from "@tabler/icons-react";
import { getCurrentUser } from "@/lib/userProfiles";
import UserAvatar from "@/components/UserAvatar";

const ALL_DEPARTMENTS = [
  { id: "IT_DIGITAL", name: "Phòng IT & Chuyển Đổi Số" },
  { id: "P_SX", name: "Phòng Sản Xuất & Chuyền May" },
  { id: "P_QC", name: "Phòng Quản Lý Chất Lượng (QC)" },
  { id: "P_HR_ADMIN", name: "Phòng Hành Chính Nhân Sự" },
  { id: "P_MMTB", name: "Phòng Máy Móc Thiết Bị & Bảo Trì" },
  { id: "P_KE_TOAN", name: "Phòng Tài Chính Kế Toán" },
  { id: "P_KHO_VAN", name: "Phòng Kho Vận & Xuất Nhập Khẩu" },
  { id: "P_KE_HOACH", name: "Phòng Kế Hoạch Sản Xuất" },
  { id: "P_KAIZEN_152", name: "Ban Cải Tiến Kaizen 1-5-2" },
  { id: "P_GEMBA", name: "Ban An Toàn & Gemba 5S" },
  { id: "RETAIL_SKECHERS", name: "Khối Chuỗi Cửa Hàng Skechers" },
  { id: "BAN_GIAM_DOC", name: "Ban Tổng Giám Đốc" },
];

export interface ProjectMember {
  empCode: string;
  name: string;
  department: string;
  role: string;
}

export interface ProjectData {
  id: string;
  code: string;
  name: string;
  description: string;
  target_outcome?: string;
  lead_department: string;
  collaborating_departments: string[];
  manager_id?: string;
  manager_emp_code?: string;
  manager_name: string;
  status: "ACTIVE" | "PLANNING" | "PAUSED" | "COMPLETED";
  progress: number;
  start_date: string;
  end_date: string;
  tasks_count?: number;
  done_tasks_count?: number;
  members: ProjectMember[];
}

export interface ProjectTask {
  id: string;
  code: string;
  title: string;
  status: string;
  progress: number;
  priority: string;
  due_date: string;
  assignee_emp_code: string;
  assignee_name: string;
  assignee_department?: string;
  department_id: string;
  project_id: string;
  parent_task_id?: string;
  blocked_by_task_id?: string;
  is_blocked?: boolean;
  blocked_by?: { id: string; code: string; title: string; status: string } | null;
}

export interface BottleneckItem {
  project_id: string;
  project_code: string;
  project_name: string;
  task_id: string;
  task_code: string;
  task_title: string;
  assignee_name: string;
  assignee_emp_code: string;
  department_id: string;
  status: string;
  progress: number;
  due_date: string;
  blocked_tasks_count: number;
  blocked_task_codes?: string[];
  reason: string;
}

export default function ProjectWorkspaceView() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [bottlenecks, setBottlenecks] = useState<BottleneckItem[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [staffList, setStaffList] = useState<Array<{ empCode: string; name: string; position: string; department: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Filter States
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("ALL");
  const [taskSearchText, setTaskSearchText] = useState("");

  // Modal States
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Project Form
  const [newPrjName, setNewPrjName] = useState("");
  const [newPrjCode, setNewPrjCode] = useState("");
  const [newPrjDesc, setNewPrjDesc] = useState("");
  const [newPrjOutcome, setNewPrjOutcome] = useState("");
  const [newPrjLeadDept, setNewPrjLeadDept] = useState("IT_DIGITAL");
  const [newPrjCollabDepts, setNewPrjCollabDepts] = useState<string[]>(["P_SX", "P_QC"]);
  const [newPrjManagerCode, setNewPrjManagerCode] = useState("");
  const [newPrjStartDate, setNewPrjStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [newPrjEndDate, setNewPrjEndDate] = useState(new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10));

  // New Task in Project Form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10));
  const [newTaskBlockedBy, setNewTaskBlockedBy] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.empCode) {
      setNewPrjManagerCode(user.empCode);
    }
  }, []);

  // Fetch users for staff pickers
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
        const res = await fetch("/api/users", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          const list = json.users || json.data || [];
          if (Array.isArray(list)) {
            setStaffList(
              list.map((u: any) => ({
                empCode: String(u.emp_code || u.empCode || u.id),
                name: String(u.name || ""),
                position: String(u.title || u.vtcv_hien_tai || "Cán Bộ"),
                department: String(u.department || u.phong_ban_hien_tai || ""),
              }))
            );
          }
        }
      } catch (e) {
        console.warn("Failed to fetch users", e);
      }
    };
    fetchUsers();
  }, []);

  // Fetch projects list and bottlenecks
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/projects", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.projects)) {
          setProjects(data.projects);
          setBottlenecks(data.bottlenecks || []);
          if (data.projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(data.projects[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load projects", e);
      showToast("❌ Lỗi khi tải danh sách dự án");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch tasks for the selected project
  const fetchProjectTasks = async (projId: string) => {
    if (!projId) return;
    try {
      setLoadingTasks(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch(`/api/tasks?project_id=${encodeURIComponent(projId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        } else {
          setTasks([]);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch project tasks", e);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId || p.code === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // Bottleneck tasks in selected project
  const selectedProjectBottlenecks = useMemo(() => {
    if (!selectedProject) return [];
    return bottlenecks.filter(
      (b) => b.project_id === selectedProject.id || b.project_code === selectedProject.code
    );
  }, [bottlenecks, selectedProject]);

  // Filtered Tasks in Selected Project
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = taskStatusFilter === "ALL" || t.status === taskStatusFilter;
      const matchSearch =
        !taskSearchText.trim() ||
        t.title.toLowerCase().includes(taskSearchText.toLowerCase()) ||
        t.code.toLowerCase().includes(taskSearchText.toLowerCase()) ||
        (t.assignee_name && t.assignee_name.toLowerCase().includes(taskSearchText.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [tasks, taskStatusFilter, taskSearchText]);

  // Quick Status change with Task Dependency enforcement
  const handleQuickStatusChange = async (task: ProjectTask, targetStatus: string) => {
    if (targetStatus === "DOING" && task.is_blocked) {
      const pred = task.blocked_by;
      alert(
        `🔒 KHÔNG THỂ BẮT ĐẦU!\n\nCông việc này đang bị chặn bởi nhiệm vụ [${pred?.code || task.blocked_by_task_id}]: "${pred?.title || "Chưa hoàn thành"}".\n\nBạn phải hoàn thành công việc phụ thuộc trước khi bắt đầu công việc này!`
      );
      return;
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId: task.id,
          status: targetStatus,
          progress: targetStatus === "DONE" ? 100 : targetStatus === "DOING" ? Math.max(task.progress, 25) : 0,
          resultDescription: targetStatus === "DONE" ? "Đã nghiệm thu hoàn tất nhiệm vụ dự án" : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ Đã chuyển trạng thái sang ${targetStatus}`);
        fetchProjectTasks(selectedProjectId);
        fetchProjects();
      } else {
        alert(data.error || "Không thể cập nhật trạng thái");
      }
    } catch {
      alert("Lỗi kết nối khi cập nhật trạng thái");
    }
  };

  // Create Project Submit Handler
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrjName.trim()) {
      alert("Vui lòng nhập tên dự án");
      return;
    }
    const manager = staffList.find((s) => s.empCode === newPrjManagerCode) || currentUser;

    setSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newPrjName.trim(),
          code: newPrjCode.trim() || undefined,
          description: newPrjDesc.trim(),
          target_outcome: newPrjOutcome.trim(),
          lead_department: newPrjLeadDept,
          collaborating_departments: newPrjCollabDepts,
          manager_emp_code: manager?.empCode,
          manager_name: manager?.name,
          start_date: newPrjStartDate,
          end_date: newPrjEndDate,
          status: "ACTIVE",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`🎉 ${data.message}`);
        setIsCreateProjectModalOpen(false);
        setNewPrjName("");
        setNewPrjDesc("");
        setNewPrjOutcome("");
        await fetchProjects();
        if (data.id) setSelectedProjectId(data.id);
      } else {
        alert(data.error || "Lỗi khi tạo dự án mới");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  // Add Task to Project Submit Handler
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      alert("Vui lòng nhập tiêu đề công việc");
      return;
    }
    if (!selectedProject) return;

    const assignee = staffList.find((s) => s.empCode === newTaskAssignee);

    setSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          project_id: selectedProject.id,
          department_id: selectedProject.lead_department,
          assignee_emp_code: assignee?.empCode || currentUser?.empCode,
          assignee_name: assignee?.name || currentUser?.name,
          assignee_department: assignee?.department || selectedProject.lead_department,
          priority: newTaskPriority,
          due_date: newTaskDueDate,
          blocked_by_task_id: newTaskBlockedBy || null,
          status: "TO_DO",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("✓ Đã thêm công việc vào dự án thành công!");
        setIsAddTaskModalOpen(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskBlockedBy("");
        fetchProjectTasks(selectedProject.id);
        fetchProjects();
      } else {
        alert(data.error || "Lỗi khi thêm công việc");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 space-y-4 animate-pulse">
        <div className="h-14 bg-slate-200 rounded-3xl w-full" />
        <div className="h-28 bg-slate-200 rounded-3xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-slate-200 rounded-3xl" />
          <div className="h-44 bg-slate-200 rounded-3xl" />
          <div className="h-44 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  const userRoleLevel = currentUser?.roleLevel ?? (currentUser?.managementLevel ?? 4);
  const canCreateProject = userRoleLevel <= 3 || ["SUPER_ADMIN", "ADMIN", "TRUONG_PHONG", "TONG_GIAM_DOC", "GIAM_DOC"].includes((currentUser?.roleCode || "").toUpperCase());

  return (
    <div className="w-full space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <IconSparkles size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/work"
            className="px-3.5 py-2 bg-slate-100 hover:bg-[#006838] text-slate-700 hover:text-white rounded-2xl transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-200 cursor-pointer"
          >
            <IconArrowLeft size={16} />
            <span>Quay lại Work Hub</span>
          </Link>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <IconFolder size={20} className="text-[#006838]" />
              <span>Dự Án Liên Phòng Ban (Cross-Department Projects)</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              TBS Group • Quản lý dự án hợp tác, đường găng &amp; phát hiện nút thắt cổ chai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={fetchProjects}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <IconRefresh size={16} />
          </button>
          {canCreateProject ? (
            <button
              type="button"
              onClick={() => setIsCreateProjectModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#006838] hover:bg-emerald-800 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <IconPlus size={16} />
              <span>+ Khởi Tạo Dự Án Mới</span>
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-2xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center gap-1.5 border border-slate-200 cursor-not-allowed" title="Chỉ Trưởng phòng hoặc Ban Giám Đốc mới có thẩm quyền khởi tạo dự án">
              <IconLock size={15} />
              <span>Chỉ Cấp Quản Lý tạo dự án</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 1. BẢNG TỔNG HỢP NÚT THẮT CỔ CHAI (BOTTLENECK DETECTOR) ── */}
      {bottlenecks.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-300 shadow-md space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-rose-800">
              <div className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <IconFlame size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
                  <span>Hệ Thống Cảnh Báo Nút Thắt Cổ Chai (Bottleneck Detector)</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-black">
                    {bottlenecks.length} điểm nghẽn
                  </span>
                </h2>
                <p className="text-[11px] text-rose-700 font-medium">
                  Phát hiện công việc trễ hạn hoặc đang chặn từ 2 nhiệm vụ khác nhưng tiến độ &lt; 50%
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-black text-rose-500 tracking-wider hidden sm:block">
              Ưu tiên xử lý ngay
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bottlenecks.map((b) => (
              <div
                key={b.task_id}
                className="p-3.5 rounded-2xl bg-white border-2 border-rose-400 shadow-xs space-y-2 hover:shadow-md transition relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-600 text-white text-[9px] font-mono font-black rounded-bl-xl uppercase">
                  Nút thắt
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono">
                  <span className="font-bold text-slate-800">{b.project_code}</span>
                  <span>•</span>
                  <span>#{b.task_code}</span>
                </div>

                <h3 className="text-xs font-black text-slate-900 line-clamp-2" title={b.task_title}>
                  {b.task_title}
                </h3>

                <p className="text-[11px] text-rose-700 font-semibold bg-rose-50 p-2 rounded-xl border border-rose-200">
                  {b.reason}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                  <span className="font-bold text-slate-700">Phụ trách: {b.assignee_name}</span>
                  <span className="font-mono text-rose-600 font-bold">Hạn: {b.due_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. DANH SÁCH TẤT CẢ DỰ ÁN (PROJECT CARDS GRID) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <IconBriefcase size={18} className="text-[#006838]" />
            <span>Danh Sách Dự Án Đang Vận Hành ({projects.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Bấm vào thẻ dự án để mở chi tiết</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const isSelected = p.id === selectedProject?.id;
            const pBottlenecksCount = bottlenecks.filter(
              (b) => b.project_id === p.id || b.project_code === p.code
            ).length;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-3.5 flex flex-col justify-between ${
                  isSelected
                    ? "bg-white border-[#006838] shadow-md ring-2 ring-emerald-100"
                    : "bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-black border border-slate-200">
                      {p.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {pBottlenecksCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono text-[10px] font-black flex items-center gap-1 border border-rose-200 animate-pulse">
                          <IconAlertTriangle size={11} /> {pBottlenecksCount} nghẽn
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-100 text-[#006838]"
                            : p.status === "PLANNING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                    {p.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Lead and Collaborating Departments */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#006838] font-bold border border-emerald-200">
                      Chủ trì: {p.lead_department}
                    </span>
                    {Array.isArray(p.collaborating_departments) &&
                      p.collaborating_departments.slice(0, 3).map((dept) => (
                        <span
                          key={dept}
                          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                        >
                          +{dept}
                        </span>
                      ))}
                    {Array.isArray(p.collaborating_departments) && p.collaborating_departments.length > 3 && (
                      <span className="px-1 py-0.5 text-slate-400 font-mono text-[9px]">
                        +{p.collaborating_departments.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Tiến độ dự án</span>
                      <span className="font-mono text-[#006838] font-black">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#006838] h-full rounded-full transition-all duration-500"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Manager and Dates */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="font-bold text-slate-700">PM: {p.manager_name}</span>
                    <span className="font-mono">
                      {p.start_date} → {p.end_date}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. CHI TIẾT DỰ ÁN ĐANG CHỌN (SELECTED PROJECT DETAIL) ── */}
      {selectedProject && (
        <div className="space-y-6 pt-2">
          {/* Project Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl space-y-4 border border-slate-700 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40">
                  DỰ ÁN LIÊN PHÒNG BAN
                </span>
                <span className="text-amber-400 font-mono text-xs font-bold">[{selectedProject.code}]</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-white/10 text-white">
                  {selectedProject.status}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsAddTaskModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#006838] hover:bg-emerald-600 text-white text-xs font-black shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <IconPlus size={16} />
                <span>+ Thêm Nhiệm Vụ Vào Dự Án</span>
              </button>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{selectedProject.name}</h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-3xl leading-relaxed mt-1">
                {selectedProject.description}
              </p>
            </div>

            {selectedProject.target_outcome && (
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-emerald-200">
                <span className="font-black text-white">🎯 Mục tiêu đầu ra: </span>
                <span>{selectedProject.target_outcome}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-white/10">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">Phòng ban chủ trì</span>
                <span className="font-bold text-white">{selectedProject.lead_department}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">Quản trị dự án (PM)</span>
                <span className="font-bold text-white">{selectedProject.manager_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">Thời gian triển khai</span>
                <span className="font-mono text-emerald-300 font-bold">
                  {selectedProject.start_date} → {selectedProject.end_date}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">Tiến độ hoàn thành</span>
                <span className="font-mono text-amber-300 font-bold">{selectedProject.progress}%</span>
              </div>
            </div>
          </div>

          {/* Members & Tasks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left: Project Members List */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <IconUsers size={18} className="text-blue-600" />
                  <span>Thành Viên Dự Án ({selectedProject.members.length})</span>
                </h3>
              </div>

              <div className="space-y-2">
                {selectedProject.members.map((m) => (
                  <div
                    key={m.empCode}
                    className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar name={m.name} size="sm" />
                      <div>
                        <span className="text-xs font-black text-slate-900 block leading-tight">{m.name}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{m.department}</span>
                      </div>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black shrink-0 ${
                        m.role === "PROJECT_MANAGER"
                          ? "bg-purple-100 text-purple-900 border border-purple-300"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {m.role === "PROJECT_MANAGER" ? "PM" : m.role}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">🔒 Quyền hạn dự án:</p>
                <p>
                  PM điều phối công việc liên phòng ban trong phạm vi dự án này mà không làm ảnh hưởng bảo mật riêng
                  của từng phòng ban gốc.
                </p>
              </div>
            </div>

            {/* Right: Project Tasks Table with Task Dependencies */}
            <div className="lg:col-span-3 p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <IconChecklist size={18} className="text-[#006838]" />
                    <span>Nhiệm Vụ Dự Án ({filteredTasks.length})</span>
                  </h3>
                  {selectedProjectBottlenecks.length > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full border border-rose-300">
                      ⚠️ {selectedProjectBottlenecks.length} nút thắt
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-initial">
                    <IconSearch size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên/mã task..."
                      value={taskSearchText}
                      onChange={(e) => setTaskSearchText(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#006838]"
                    />
                  </div>

                  {/* Filter Status */}
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#006838]"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="TO_DO">Chưa làm (TO_DO)</option>
                    <option value="DOING">Đang làm (DOING)</option>
                    <option value="REVIEW">Chờ duyệt (REVIEW)</option>
                    <option value="DONE">Hoàn thành (DONE)</option>
                  </select>
                </div>
              </div>

              {loadingTasks ? (
                <div className="py-12 text-center text-slate-400 text-xs">Đang tải nhiệm vụ dự án...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  Chưa có nhiệm vụ nào trong dự án này. Hãy bấm <strong>+ Thêm Nhiệm Vụ Vào Dự Án</strong> để bắt đầu!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTasks.map((t) => {
                    const isBottleneck = selectedProjectBottlenecks.some((b) => b.task_id === t.id);
                    const isCrossDept = Boolean(
                      t.assignee_department && t.assignee_department !== selectedProject.lead_department
                    );

                    return (
                      <div
                        key={t.id}
                        className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                          isBottleneck
                            ? "bg-rose-50/70 border-rose-400 ring-2 ring-rose-200 shadow-xs"
                            : t.is_blocked
                            ? "bg-amber-50/40 border-amber-300"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500">#{t.code}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                t.status === "DONE"
                                  ? "bg-emerald-100 text-[#006838]"
                                  : t.status === "REVIEW"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : t.status === "DOING"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {t.status}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">• Ưu tiên: {t.priority}</span>

                            {/* Cross-department badge */}
                            {isCrossDept && (
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black border border-blue-200">
                                🤝 Phối hợp: {t.assignee_department}
                              </span>
                            )}

                            {/* Task Dependency Lock */}
                            {t.is_blocked && (
                              <span
                                className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black flex items-center gap-1 border border-rose-300"
                                title={`Bị chặn bởi [${t.blocked_by?.code || t.blocked_by_task_id}]: ${
                                  t.blocked_by?.title || "Chưa xong"
                                }`}
                              >
                                <IconLock size={12} />
                                <span>Bị chặn bởi #{t.blocked_by?.code || t.blocked_by_task_id}</span>
                              </span>
                            )}

                            {/* Bottleneck Badge */}
                            {isBottleneck && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center gap-1 shadow-xs animate-pulse">
                                <IconFlame size={12} />
                                <span>Nút thắt cổ chai</span>
                              </span>
                            )}
                          </div>

                          {/* Quick status actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {t.status === "TO_DO" && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(t, "DOING")}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                  t.is_blocked
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                                }`}
                                title={t.is_blocked ? "Bị khóa: Cần hoàn thành công việc phụ thuộc trước" : "Bắt đầu làm"}
                              >
                                {t.is_blocked ? <IconLock size={13} /> : <IconBolt size={13} />}
                                <span>Làm ngay</span>
                              </button>
                            )}

                            {t.status === "DOING" && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(t, "REVIEW")}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                              >
                                Gửi duyệt
                              </button>
                            )}

                            {t.status === "REVIEW" && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(t, "DONE")}
                                className="px-2.5 py-1 rounded-lg bg-[#006838] hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <IconCheck size={13} />
                                <span>Duyệt đạt</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Task Title & Details */}
                        <div>
                          <h4 className="text-sm font-black text-slate-900 leading-snug">{t.title}</h4>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">Người làm: {t.assignee_name}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-slate-600">Hạn: {t.due_date}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono font-bold">
                            <span>Tiến độ:</span>
                            <span className="text-[#006838]">{t.progress}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL TẠO DỰ ÁN MỚI ── */}
      {isCreateProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 relative border border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateProjectModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <IconX size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006838] flex items-center justify-center shrink-0">
                <IconFolder size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Khởi Tạo Dự Án Liên Phòng Ban Mới</h3>
                <p className="text-xs text-slate-500">Mã tự sinh theo chuẩn TBS: PRJ-YYYY-XXX</p>
              </div>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Tên Dự Án *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tự Động Hóa Dây Chuyền & Chuyển Đổi Số Kho 2026"
                  value={newPrjName}
                  onChange={(e) => setNewPrjName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Mô Tả Dự Án</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả phạm vi và ý nghĩa của dự án..."
                  value={newPrjDesc}
                  onChange={(e) => setNewPrjDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#006838]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Mục Tiêu / Kết Quả Đầu Ra</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giảm 20% thời gian luân chuyển, 100% hồ sơ số hóa"
                  value={newPrjOutcome}
                  onChange={(e) => setNewPrjOutcome(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#006838]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Phòng Ban Chủ Trì *</label>
                  <select
                    value={newPrjLeadDept}
                    onChange={(e) => setNewPrjLeadDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                  >
                    {ALL_DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Project Manager (PM) *</label>
                  <select
                    value={newPrjManagerCode}
                    onChange={(e) => setNewPrjManagerCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                  >
                    {staffList.map((s) => (
                      <option key={s.empCode} value={s.empCode}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Collaborating Departments Multi-select */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5">
                  Phòng Ban Phối Hợp (Chọn nhiều)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {ALL_DEPARTMENTS.filter((d) => d.id !== newPrjLeadDept).map((dept) => {
                    const isChecked = newPrjCollabDepts.includes(dept.id);
                    return (
                      <label
                        key={dept.id}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                          isChecked ? "bg-emerald-100 text-[#006838]" : "hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPrjCollabDepts((prev) => [...prev, dept.id]);
                            } else {
                              setNewPrjCollabDepts((prev) => prev.filter((id) => id !== dept.id));
                            }
                          }}
                          className="accent-[#006838]"
                        />
                        <span className="truncate">{dept.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Ngày Bắt Đầu</label>
                  <input
                    type="date"
                    value={newPrjStartDate}
                    onChange={(e) => setNewPrjStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Ngày Kết Thúc</label>
                  <input
                    type="date"
                    value={newPrjEndDate}
                    onChange={(e) => setNewPrjEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateProjectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#006838] hover:bg-emerald-800 text-white text-xs font-black shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <IconLoader2 size={15} className="animate-spin" />}
                  <span>Tạo Dự Án Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL THÊM CÔNG VIỆC VÀO DỰ ÁN (VỚI RÀNG BUỘC PHỤ THUỘC) ── */}
      {isAddTaskModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 relative border border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddTaskModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <IconX size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006838] flex items-center justify-center shrink-0">
                <IconChecklist size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Thêm Nhiệm Vụ Vào Dự Án</h3>
                <p className="text-xs text-slate-500">{selectedProject.name}</p>
              </div>
            </div>

            <form onSubmit={handleAddTaskSubmit} className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Tiêu Đề Công Việc *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình tích hợp API quét barcode"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Mô Tả Chi Tiết</label>
                <textarea
                  rows={2}
                  placeholder="Chi tiết yêu cầu kỹ thuật hoặc bàn giao..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#006838]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Người Thực Hiện (Cross-Dept)</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                  >
                    <option value="">-- Chọn nhân sự --</option>
                    {staffList.map((s) => (
                      <option key={s.empCode} value={s.empCode}>
                        {s.name} ({s.department || "TBS"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Mức Độ Ưu Tiên</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                  >
                    <option value="HIGH">🔴 Cao (HIGH)</option>
                    <option value="MEDIUM">🟡 Trung bình (MEDIUM)</option>
                    <option value="LOW">🟢 Thấp (LOW)</option>
                  </select>
                </div>
              </div>

              {/* Ràng Buộc Phụ Thuộc (Blocked By) */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                <label className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <IconLock size={15} />
                  <span>Ràng Buộc Phụ Thuộc (Task Dependencies)</span>
                </label>
                <p className="text-[11px] text-amber-700">
                  Chọn công việc đi trước phải hoàn thành (DONE) thì công việc này mới được phép bắt đầu:
                </p>
                <select
                  value={newTaskBlockedBy}
                  onChange={(e) => setNewTaskBlockedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                >
                  <option value="">-- Không có (Làm độc lập) --</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.code}: {t.title} ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Hạn Chót (Due Date)</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#006838] hover:bg-emerald-800 text-white text-xs font-black shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <IconLoader2 size={15} className="animate-spin" />}
                  <span>Thêm Vào Dự Án</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
