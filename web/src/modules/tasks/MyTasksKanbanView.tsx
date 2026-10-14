"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  IconChecklist,
  IconPlus,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconAlertTriangle,
  IconBellRinging,
  IconLifebuoy,
  IconMessage,
  IconPaperclip,
  IconStar,
  IconUserCheck,
  IconSend,
  IconArrowLeft,
  IconX,
  IconFileText,
  IconCrown,
  IconUser,
  IconUserPlus,
  IconUsers,
  IconClipboardList,
  IconSearch,
  IconFilter,
  IconTag,
  IconCalendarEvent,
  IconActivity,
  IconChevronRight,
  IconChevronLeft,
  IconCircleCheck,
  IconBulb,
  IconEye,
  IconArrowUpRight,
  IconTrendingUp,
  IconBuilding,
  IconHeart,
  IconFilePlus,
  IconLoader2,
  IconTrash,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconExternalLink,
  IconDownload,
  IconUpload,
  IconPhoto,
  IconBolt,
  IconCopy,
  IconShieldCheck,
  IconArrowBackUp,
  IconLock,
} from "@tabler/icons-react";

import { getCurrentUser, normalizeEmpCode, getSystemUser } from "@/lib/userProfiles";
import { uploadCloudinaryFile } from "@/lib/cloudinary";
import { uploadFileToR2 } from "@/lib/imageCompressor";
import UserAvatar from "@/components/UserAvatar";
import DepartmentWorkloadReport from "./DepartmentWorkloadReport";

// Fallback dummy structure for external imports
export const STAFF_MEMBERS: Array<{ empCode: string; name: string; position: string }> = [];

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: "doc" | "xls" | "pdf" | "img" | "other";
  size?: string;
  uploadedAt: string;
}

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  description: string;
  department_id: string;
  project_id?: string;
  assignee_emp_code: string;
  assignee_name: string;
  reporter_emp_code: string;
  reviewer_emp_code?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  start_date: string;
  due_date: string;
  status: "BACKLOG" | "TO_DO" | "DOING" | "NEED_HELP" | "REVIEW" | "DONE";
  progress: number;
  tags: string;
  checklist: Array<{ id: string; title: string; completed: boolean; assignee_name?: string; assignee_emp_code?: string }>;
  attachments?: TaskAttachment[];
  result_description?: string;
  reject_reason?: string;
  completed_at?: string;
  help_reason?: string;
  help_image_url?: string;
  help_notified_to?: string;
  manager_review_comment?: string;
  performance_rating?: number;
  performance_score?: number;
  updated_at?: string;
}

export function parseChecklist(checklist: any): Array<{ id: string; title: string; completed: boolean; assignee_name?: string; assignee_emp_code?: string }> {
  if (Array.isArray(checklist)) return checklist;
  if (typeof checklist === 'string' && checklist.trim()) {
    try {
      let parsed = JSON.parse(checklist);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {}
  }
  return [];
}

const KANBAN_COLUMNS: Array<{
  key: TaskItem["status"];
  title: string;
  color: string;
  badge: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  addBtnColor: string;
  IconComponent: any;
}> = [
  {
    key: "BACKLOG",
    title: "Ý tưởng & Nhu cầu",
    color: "bg-blue-50/90 border-blue-200 text-blue-950 font-black",
    badge: "bg-blue-200 text-blue-900 border border-blue-300 font-mono",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    addBtnColor: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
    IconComponent: IconBulb,
  },
  {
    key: "TO_DO",
    title: "Cần làm (To Do)",
    color: "bg-slate-50/90 border-slate-200 text-slate-900 font-black",
    badge: "bg-slate-200 text-slate-900 border border-slate-300 font-mono",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    borderColor: "border-slate-200",
    addBtnColor: "text-slate-600 hover:text-slate-800 hover:bg-slate-50",
    IconComponent: IconChecklist,
  },
  {
    key: "DOING",
    title: "Đang thực hiện",
    color: "bg-amber-50/90 border-amber-200 text-amber-950 font-black",
    badge: "bg-amber-200 text-amber-900 border border-amber-300 font-mono",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200",
    addBtnColor: "text-amber-600 hover:text-amber-800 hover:bg-amber-50",
    IconComponent: IconClock,
  },
  {
    key: "REVIEW",
    title: "Chờ duyệt (Review)",
    color: "bg-indigo-50/90 border-indigo-200 text-indigo-950 font-black",
    badge: "bg-indigo-200 text-indigo-900 border border-indigo-300 font-mono",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    borderColor: "border-indigo-200",
    addBtnColor: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-300",
    IconComponent: IconEye,
  },
  {
    key: "DONE",
    title: "Hoàn thành (Done)",
    color: "bg-emerald-50/90 border-emerald-200 text-emerald-950 font-black",
    badge: "bg-[#006838] text-white border border-emerald-700 font-mono",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    addBtnColor: "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50",
    IconComponent: IconCircleCheck,
  },
  {
    key: "NEED_HELP",
    title: "Cần trợ giúp",
    color: "bg-rose-50/90 border-rose-200 text-rose-950 font-black",
    badge: "bg-rose-600 text-white border border-rose-700 font-mono",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    borderColor: "border-rose-200",
    addBtnColor: "text-rose-600 hover:text-rose-800 hover:bg-rose-50",
    IconComponent: IconAlertTriangle,
  },
];

interface MyTasksKanbanViewProps {
  projectId?: string;
  projectName?: string;
}

export default function MyTasksKanbanView({ projectId, projectName }: MyTasksKanbanViewProps = {}) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Drag & drop state
  const draggedTaskIdRef = useRef<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskItem["status"] | null>(null);

  // Result submission modal before DONE
  const [pendingDoneTask, setPendingDoneTask] = useState<TaskItem | null>(null);
  const [resultText, setResultText] = useState("");
  const [resultError, setResultError] = useState<string | null>(null);

  // Help Request Modal before NEED_HELP
  const [pendingHelpTask, setPendingHelpTask] = useState<TaskItem | null>(null);
  const [helpReasonText, setHelpReasonText] = useState("");
  const [helpImageUrl, setHelpImageUrl] = useState<string | null>(null);
  const [helpError, setHelpError] = useState<string | null>(null);

  // OCC Concurrency Conflict Modal state
  const [conflictModal, setConflictModal] = useState<{
    task: TaskItem;
    serverTask: any;
    message: string;
    onReload: () => void;
    onOverwrite: () => void;
  } | null>(null);

  // Smart polling references (pauses when document.hidden, resumes on visibilitychange)
  const lastSyncTimeRef = useRef<string>("");
  const isPollingRef = useRef<boolean>(false);

  // Create Task Modal & Attachments
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TaskItem["priority"]>("MEDIUM");
  const [newDueDate, setNewDueDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [newAssigneeEmpCode, setNewAssigneeEmpCode] = useState<string>("202608001");
  const [newChecklist, setNewChecklist] = useState<
    { id: string; title: string; completed: boolean; assignee_name?: string; assignee_emp_code?: string }[]
  >([]);
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState("");
  const [detailNewChecklistTitle, setDetailNewChecklistTitle] = useState("");
  const [newAttachments, setNewAttachments] = useState<TaskAttachment[]>([]);
  const [isUploadingNewTaskFile, setIsUploadingNewTaskFile] = useState(false);
  const newTaskFileInputRef = useRef<HTMLInputElement>(null);
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);

  // Project Filtering - can be set via props (from ProjectsOverviewPage) or URL params
  const [activeProjectFilter, setActiveProjectFilter] = useState<string | null>(projectId || null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(projectName || null);

  // View Mode & Instant Search/Filter States
  const [viewMode, setViewMode] = useState<"KANBAN" | "LIST">("KANBAN");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [reporterFilter, setReporterFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [memberFilter, setMemberFilter] = useState<string>("ALL");
  const [staffList, setStaffList] = useState<Array<{ empCode: string; name: string; position: string; department?: string }>>([]);
  const [assigneeSearchText, setAssigneeSearchText] = useState("");

  // Scope Tab: Việc của tôi (MY) vs Việc chung phòng ban (DEPT)
  const [scopeTab, setScopeTab] = useState<"MY" | "DEPT">("MY");

  // Rejection Modal before DOING
  const [pendingRejectTask, setPendingRejectTask] = useState<TaskItem | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Quick Create Modal (5s)
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAssignee, setQuickAssignee] = useState("");
  const [quickDueDate, setQuickDueDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10));
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Workload & A4 Report Modal
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState(false);

  // Mobile View States (< 768px)
  const [mobileActiveCol, setMobileActiveCol] = useState<string>("DOING");
  const [mobileStatusSheetTask, setMobileStatusSheetTask] = useState<TaskItem | null>(null);

  // File Upload Progress & Network Resilience
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Bottom Widgets States
  const [recentTab, setRecentTab] = useState<"ALL" | "MY" | "ASSIGNED" | "DONE">("ALL");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(14);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeUser = isMounted ? getCurrentUser() : null;
  const normalizedCode = activeUser?.empCode ? normalizeEmpCode(activeUser.empCode) : "";
  const sysUser = normalizedCode ? getSystemUser(normalizedCode) : null;

  const combinedRoles = Array.from(
    new Set([
      ...(Array.isArray(activeUser?.roles) ? activeUser.roles : []),
      ...(Array.isArray(sysUser?.roles) ? sysUser.roles : []),
    ])
  );
  const roleCode = sysUser?.roleCode || activeUser?.roleCode || "";
  const managementLevel = activeUser?.managementLevel || sysUser?.roleLevel || 4;
  const deptCode = (sysUser?.department || activeUser?.departmentCode || activeUser?.department || "").toUpperCase();

  const isAdmin =
    combinedRoles.includes("admin") ||
    roleCode === "SUPER_ADMIN" ||
    normalizedCode === "202608001";

  const isExec =
    isAdmin ||
    managementLevel <= 2 ||
    combinedRoles.includes("ceo") ||
    roleCode === "TONG_GIAM_DOC" ||
    roleCode === "GIAM_DOC";

  const isTP =
    !isExec &&
    (roleCode === "TRUONG_PHONG" ||
      roleCode === "TP" ||
      combinedRoles.includes("manager") ||
      combinedRoles.includes("department_head") ||
      managementLevel === 3);

  const isStaffOnly = !isAdmin && !isExec && !isTP;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
        const deptFilter = isTP && deptCode ? `?department=${encodeURIComponent(deptCode)}` : "";
        const res = await fetch(`/api/users${deptFilter}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          const users = json.users || json.data || [];
          if (Array.isArray(users) && users.length > 0) {
            const mapped = users.map((u: any) => ({
              empCode: String(u.emp_code || u.empCode || u.id),
              name: String(u.name || ""),
              position: String(u.title || u.vtcv_hien_tai || "Cán Bộ"),
              department: String(u.department || u.phong_ban_hien_tai || ""),
            }));
            setStaffList(mapped);
            if (mapped.length > 0) {
              setNewAssigneeEmpCode((prev) => (prev && mapped.some((m: any) => m.empCode === prev) ? prev : mapped[0].empCode));
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch users list", e);
      }
    };
    if (isMounted) {
      fetchUsers();
    }
  }, [isMounted, isTP, deptCode]);

  const activeStaffList = useMemo(() => {
    if (staffList.length > 0) return staffList;
    if (activeUser) {
      return [
        {
          empCode: activeUser.empCode || "202608001",
          name: activeUser.name || "Cán Bộ",
          position: activeUser.title || "Nhân viên",
          department: deptCode || "",
        },
      ];
    }
    return [];
  }, [staffList, activeUser, deptCode]);

  const filteredModalStaffList = useMemo(() => {
    if (!assigneeSearchText.trim()) return activeStaffList;
    const q = assigneeSearchText.toLowerCase().trim();
    return activeStaffList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.empCode.toLowerCase().includes(q) ||
        s.position.toLowerCase().includes(q) ||
        (s.department && s.department.toLowerCase().includes(q))
    );
  }, [activeStaffList, assigneeSearchText]);

  const fetchTasks = async (targetMember?: string) => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const selectedMember = targetMember !== undefined ? targetMember : memberFilter;
      const url = selectedMember && selectedMember !== "ALL"
        ? `/api/tasks?assignee_emp_code=${encodeURIComponent(selectedMember)}`
        : "/api/tasks";
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks.map((t: any) => ({ ...t, checklist: parseChecklist(t.checklist) })));
        if (data.latestUpdatedAt) {
          lastSyncTimeRef.current = data.latestUpdatedAt;
        }
      }
    } catch {
      console.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const smartPollTasks = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const selectedMember = memberFilter;
      const base = selectedMember && selectedMember !== "ALL"
        ? `/api/tasks?assignee_emp_code=${encodeURIComponent(selectedMember)}`
        : "/api/tasks";
      const sep = base.includes("?") ? "&" : "?";
      const url = lastSyncTimeRef.current ? `${base}${sep}updated_since=${encodeURIComponent(lastSyncTimeRef.current)}` : base;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.latestUpdatedAt) {
          lastSyncTimeRef.current = data.latestUpdatedAt;
        }
        if (data.notModified) {
          return;
        }
        if (data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
          setTasks(data.tasks.map((t: any) => ({ ...t, checklist: parseChecklist(t.checklist) })));
        }
      }
    } catch {
      // background polling error ignored
    } finally {
      isPollingRef.current = false;
    }
  }, [memberFilter]);

  useEffect(() => {
    const interval = setInterval(smartPollTasks, 8000);
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        smartPollTasks();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [smartPollTasks]);

  useEffect(() => {
    // If projectId was passed as prop, don't read from URL
    if (!projectId && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prj = params.get("project") || params.get("project_id") || params.get("board");
      const name = params.get("name") || params.get("projectName");
      if (prj) {
        setActiveProjectFilter(prj);
        if (name) setActiveProjectName(decodeURIComponent(name));
      }
    }
    fetchTasks();
  }, [projectId]);

  const myCode = normalizedCode || activeUser?.empCode || "";
  const myTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      return (
        t.assignee_emp_code === myCode ||
        t.reporter_emp_code === myCode ||
        (t.assignee_name && activeUser?.name && t.assignee_name.toLowerCase().includes(activeUser.name.toLowerCase()))
      );
    }).length;
  }, [tasks, myCode, activeUser]);

  const deptTasksCount = tasks.length;

  const displayTasks = tasks.filter((t) => {
    if (scopeTab === "MY") {
      const isMine =
        t.assignee_emp_code === myCode ||
        t.reporter_emp_code === myCode ||
        (t.assignee_name && activeUser?.name && t.assignee_name.toLowerCase().includes(activeUser.name.toLowerCase()));
      if (!isMine) return false;
    }

    if (activeProjectFilter) {
      const p = activeProjectFilter.toUpperCase();
      const matchesProject =
        (t.project_id && t.project_id.toUpperCase() === p) ||
        (t.department_id && t.department_id.toUpperCase().includes(p)) ||
        (t.code && t.code.toUpperCase().includes(p)) ||
        (t.tags && t.tags.toUpperCase().includes(p));
      if (!matchesProject) return false;
    }

    return true;
  });

  const filteredTasks = displayTasks.filter((t) => {
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (reporterFilter !== "ALL" && t.reporter_emp_code !== reporterFilter && t.assignee_emp_code !== reporterFilter) return false;
    if (tagFilter !== "ALL" && (!t.tags || !t.tags.toUpperCase().includes(tagFilter))) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.assignee_name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }
    return true;
  });

  const totalCount = filteredTasks.length;
  const doingCount = filteredTasks.filter((t) => t.status === "DOING" || t.status === "TO_DO").length;
  const doneCount = filteredTasks.filter((t) => t.status === "DONE").length;
  const needHelpCount = filteredTasks.filter((t) => t.status === "NEED_HELP" || t.priority === "URGENT").length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Filter tasks for Recent Tasks Widget
  const recentWidgetTasks = filteredTasks.filter((t) => {
    if (recentTab === "MY") return t.assignee_emp_code === "202608001" || t.reporter_emp_code === "202608001";
    if (recentTab === "ASSIGNED") return t.assignee_emp_code === "202608001";
    if (recentTab === "DONE") return t.status === "DONE";
    return true;
  });

  // Group all matching tasks by calendar day (1-30) for Sep 2026
  const calendarTasksByDay = React.useMemo(() => {
    const map: Record<number, TaskItem[]> = {};
    for (let day = 1; day <= 30; day++) {
      map[day] = [];
    }
    filteredTasks.forEach((t) => {
      if (!t.due_date) return;
      const dStr = t.due_date.substring(0, 10);
      const parts = dStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const dayNum = parseInt(parts[2], 10);
        if (year === 2026 && month === 9 && dayNum >= 1 && dayNum <= 30) {
          if (!map[dayNum]) map[dayNum] = [];
          map[dayNum].push(t);
        }
      }
    });
    return map;
  }, [filteredTasks]);

  // Group ACTIVE (non-DONE) tasks for calendar dot indicators
  const activeCalendarTasksByDay = React.useMemo(() => {
    const map: Record<number, TaskItem[]> = {};
    for (let day = 1; day <= 30; day++) {
      map[day] = [];
    }
    filteredTasks.forEach((t) => {
      if (!t.due_date) return;
      if (t.status === "DONE") return; // Do not show pending dot indicator for completed tasks

      const dStr = t.due_date.substring(0, 10);
      const parts = dStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const dayNum = parseInt(parts[2], 10);
        if (year === 2026 && month === 9 && dayNum >= 1 && dayNum <= 30) {
          if (!map[dayNum]) map[dayNum] = [];
          map[dayNum].push(t);
        }
      }
    });
    return map;
  }, [filteredTasks]);

  const handleMoveStatus = async (task: TaskItem, newStatus: TaskItem["status"]) => {
    const isReporter = (task.reporter_emp_code === myCode);
    const isSelfAssigned = (task.reporter_emp_code === myCode && task.assignee_emp_code === myCode);
    const canDirectlyApprove = isAdmin || isExec || isTP || isReporter;

    // Task Dependency Guard: Chặn chuyển sang DOING nếu task phụ thuộc chưa hoàn thành
    if (newStatus === "DOING" && (task as any).is_blocked) {
      const pred = (task as any).blocked_by;
      alert(
        `🔒 KHÔNG THỂ BẮT ĐẦU (DOING)!\n\nNhiệm vụ này đang bị chặn bởi công việc [${pred?.code || (task as any).blocked_by_task_id}]: "${pred?.title || "Chưa hoàn thành"}".\n\nNhiệm vụ phụ thuộc phải được hoàn thành (DONE) trước khi bạn bắt đầu nhiệm vụ này!`
      );
      return;
    }

    if (newStatus === "DONE") {
      setPendingDoneTask(task);
      setResultText(task.result_description || "");
      setResultError(null);
      return;
    }

    if (newStatus === "NEED_HELP") {
      setPendingHelpTask(task);
      setHelpReasonText(task.help_reason || "");
      setHelpImageUrl(task.help_image_url || null);
      setHelpError(null);
      return;
    }

    const previousTasks = [...tasks];
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));

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
          status: newStatus,
          expected_updated_at: task.updated_at,
        }),
      });
      const data = await res.json();
      if (res.status === 409 || data.conflict) {
        setTasks(previousTasks);
        setConflictModal({
          task,
          serverTask: data.currentTask,
          message: data.error || "Dữ liệu công việc vừa được cập nhật bởi thành viên khác.",
          onReload: () => {
            fetchTasks();
            setConflictModal(null);
          },
          onOverwrite: async () => {
            setConflictModal(null);
            try {
              const retryRes = await fetch("/api/tasks", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ taskId: task.id, status: newStatus, force: true }),
              });
              const retryData = await retryRes.json();
              if (retryRes.ok && retryData.success) {
                fetchTasks();
              } else {
                alert(`Lỗi ghi đè: ${retryData.error || "Thất bại"}`);
              }
            } catch {
              alert("Lỗi kết nối khi ghi đè");
            }
          },
        });
        return;
      }
      if (!res.ok || !data.success) {
        setTasks(previousTasks);
        alert(`Lỗi khi chuyển trạng thái: ${data.error || "Không thể cập nhật"}`);
      }
    } catch {
      setTasks(previousTasks);
      alert("Lỗi kết nối máy chủ khi chuyển trạng thái!");
    }
  };

  const handleConfirmSubmitHelp = async () => {
    if (!helpReasonText || helpReasonText.trim().length < 5) {
      setHelpError("BẮT BUỘC: Nhập mô tả chi tiết vướng mắc (tối thiểu 5 ký tự) để gửi Trưởng phòng!");
      return;
    }

    if (!pendingHelpTask) return;

    const taskToUpdate = pendingHelpTask;
    const previousTasks = [...tasks];

    const managerName = taskToUpdate.department_id === "HÀNH_CHÍNH"
      ? "Nguyễn Thị Mai (Trưởng Phòng Hành Chính Nhân Sự)"
      : "Phạm Nguyễn Anh Huy (IT Lead / Trưởng Phòng IT & CĐS)";

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskToUpdate.id
          ? {
              ...t,
              status: "NEED_HELP",
              help_reason: helpReasonText.trim(),
              help_image_url: helpImageUrl || undefined,
              help_notified_to: managerName,
            }
          : t
      )
    );

    setPendingHelpTask(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId: taskToUpdate.id,
          status: "NEED_HELP",
          helpReason: helpReasonText.trim(),
          helpImageUrl: helpImageUrl || "",
          helpNotifiedTo: managerName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTasks(previousTasks);
        alert(`Lỗi khi gửi báo cáo: ${data.error || "Không thể lưu"}`);
      }
    } catch {
      setTasks(previousTasks);
      alert("Lỗi kết nối khi gửi báo cáo!");
    }
  };

  const handleConfirmSubmitDone = async () => {
    if (!resultText || resultText.trim().length < 5) {
      setResultError("BẮT BUỘC: Nhập mô tả tóm tắt kết quả công việc đã thực hiện (tối thiểu 5 ký tự)!");
      return;
    }

    if (!pendingDoneTask) return;

    const taskToUpdate = pendingDoneTask;
    const isReporter = (taskToUpdate.reporter_emp_code === myCode);
    const isSelfAssigned = (taskToUpdate.reporter_emp_code === myCode && taskToUpdate.assignee_emp_code === myCode);
    const canDirectlyApprove = isAdmin || isExec || isTP || isReporter;

    // If staff submitting task assigned by someone else -> status is REVIEW (Chờ nghiệm thu)
    const targetStatus = canDirectlyApprove || isSelfAssigned ? "DONE" : "REVIEW";
    const previousTasks = [...tasks];

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskToUpdate.id
          ? {
              ...t,
              status: targetStatus,
              progress: targetStatus === "DONE" ? 100 : 90,
              result_description: resultText.trim(),
            }
          : t
      )
    );

    setPendingDoneTask(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId: taskToUpdate.id,
          status: targetStatus,
          resultDescription: resultText.trim(),
          expected_updated_at: taskToUpdate.updated_at,
        }),
      });
      const data = await res.json();
      if (res.status === 409 || data.conflict) {
        setTasks(previousTasks);
        setConflictModal({
          task: taskToUpdate,
          serverTask: data.currentTask,
          message: data.error || "Dữ liệu công việc vừa được cập nhật bởi thành viên khác.",
          onReload: () => {
            fetchTasks();
            setConflictModal(null);
          },
          onOverwrite: async () => {
            setConflictModal(null);
            try {
              const retryRes = await fetch("/api/tasks", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  taskId: taskToUpdate.id,
                  status: targetStatus,
                  resultDescription: resultText.trim(),
                  force: true,
                }),
              });
              const retryData = await retryRes.json();
              if (retryRes.ok && retryData.success) {
                fetchTasks();
              } else {
                alert(`Lỗi ghi đè: ${retryData.error || "Thất bại"}`);
              }
            } catch {
              alert("Lỗi kết nối khi ghi đè");
            }
          },
        });
        return;
      }
      if (!res.ok || !data.success) {
        setTasks(previousTasks);
        alert(`Lỗi khi nộp kết quả: ${data.error || "Không thể cập nhật"}`);
      } else {
        if (targetStatus === "REVIEW") {
          alert(`Đã nộp kết quả công việc! Công việc đã chuyển sang cột "Chờ duyệt (Review)" để Trưởng phòng / Người giao việc nghiệm thu.`);
        } else {
          alert(`Đã nghiệm thu hoàn tất công việc #${taskToUpdate.code}!`);
        }
      }
    } catch {
      setTasks(previousTasks);
      alert("Lỗi kết nối khi nộp kết quả!");
    }
  };

  // Luồng Duyệt nghiệm thu (Chỉ Trưởng phòng, Quản đốc, Lãnh đạo hoặc Người giao việc)
  const handleApproveTask = async (task: TaskItem) => {
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: "DONE",
              progress: 100,
              reject_reason: undefined,
            }
          : t
      )
    );

    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask((prev) => (prev ? { ...prev, status: "DONE", progress: 100, reject_reason: undefined } : null));
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
          status: "DONE",
          progress: 100,
          resultDescription: task.result_description || "Đã nghiệm thu đạt yêu cầu",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTasks(previousTasks);
        alert(`Lỗi khi duyệt: ${data.error || "Không thể duyệt"}`);
      } else {
        alert(`Đã duyệt ĐẠT nghiệm thu công việc #${task.code}!`);
      }
    } catch {
      setTasks(previousTasks);
      alert("Lỗi kết nối khi duyệt nghiệm thu!");
    }
  };

  // Luồng Bắt làm lại (Trả về DOING kèm lý do bắt buộc)
  const handleConfirmReject = async () => {
    if (!rejectReasonText || rejectReasonText.trim().length < 5) {
      setRejectError("BẮT BUỘC: Nhập lý do bắt làm lại (tối thiểu 5 ký tự) để nhân viên nắm rõ!");
      return;
    }
    if (!pendingRejectTask) return;

    const taskToUpdate = pendingRejectTask;
    const reason = rejectReasonText.trim();
    const previousTasks = [...tasks];

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskToUpdate.id
          ? {
              ...t,
              status: "DOING",
              progress: 50,
              reject_reason: reason,
            }
          : t
      )
    );

    if (selectedTask && selectedTask.id === taskToUpdate.id) {
      setSelectedTask((prev) => (prev ? { ...prev, status: "DOING", reject_reason: reason } : null));
    }

    setPendingRejectTask(null);
    setRejectReasonText("");
    setRejectError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId: taskToUpdate.id,
          status: "DOING",
          rejectReason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTasks(previousTasks);
        alert(`Lỗi khi trả về: ${data.error || "Không thể cập nhật"}`);
      } else {
        alert(`Đã yêu cầu làm lại công việc #${taskToUpdate.code}. Nhân viên sẽ nhận được thông báo kèm lý do.`);
      }
    } catch {
      setTasks(previousTasks);
      alert("Lỗi kết nối khi yêu cầu làm lại!");
    }
  };

  // Nhân bản công việc (Duplicate)
  const handleDuplicateTask = async (task: TaskItem) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const newDueDate = new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);
      const clonedChecklist = (task.checklist || []).map((c) => ({
        ...c,
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        completed: false,
      }));

      const bodyData = {
        title: `${task.title} (Bản sao)`,
        description: task.description || "",
        department_id: task.department_id || deptCode || "IT_CDS",
        assignee_emp_code: task.assignee_emp_code,
        assignee_name: task.assignee_name,
        priority: task.priority,
        due_date: newDueDate,
        tags: task.tags || "TASK",
        checklist: clonedChecklist,
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (res.ok && data.success && data.task) {
        const created = { ...data.task, checklist: parseChecklist(data.task.checklist) };
        setTasks((prev) => [created, ...prev]);
        alert(`Đã nhân bản công việc thành công thành mã #${created.code}!`);
      } else {
        alert(`Lỗi nhân bản: ${data.error || "Không thể tạo bản sao"}`);
      }
    } catch (e) {
      console.error("Duplicate task failed", e);
      alert("Lỗi kết nối khi nhân bản task!");
    }
  };

  // Tạo nhanh công việc (Quick Create 5s)
  const handleQuickCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTitle.trim()) {
      alert("Vui lòng nhập tiêu đề công việc!");
      return;
    }
    setQuickSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const targetAssignee = quickAssignee || newAssigneeEmpCode || activeUser?.empCode || "202608001";
      const staffObj = activeStaffList.find((s) => s.empCode === targetAssignee) || activeStaffList[0] || {
        empCode: targetAssignee,
        name: activeUser?.name || "Cán Bộ",
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: quickTitle.trim(),
          description: "Tạo nhanh từ thanh thao tác",
          department_id: deptCode || "IT_CDS",
          assignee_emp_code: staffObj.empCode,
          assignee_name: staffObj.name,
          priority: "MEDIUM",
          due_date: quickDueDate,
          tags: "QUICK_TASK",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.task) {
        const created = { ...data.task, checklist: parseChecklist(data.task.checklist) };
        setTasks((prev) => [created, ...prev]);
        setIsQuickCreating(false);
        setQuickTitle("");
        alert(`Đã tạo nhanh công việc #${created.code}!`);
      } else {
        alert(`Lỗi tạo nhanh: ${data.error || "Không thể tạo"}`);
      }
    } catch {
      alert("Lỗi kết nối khi tạo nhanh công việc!");
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleToggleChecklist = async (taskId: string, checklistId: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedChecklist = (t.checklist || []).map((c) => (c.id === checklistId ? { ...c, completed } : c));
          const doneCount = updatedChecklist.filter((c) => c.completed).length;
          const newProgress = updatedChecklist.length > 0 ? Math.round((doneCount / updatedChecklist.length) * 100) : t.progress;

          return {
            ...t,
            checklist: updatedChecklist,
            progress: newProgress,
          };
        }
        return t;
      })
    );

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => {
        if (!prev) return null;
        const updatedChecklist = (prev.checklist || []).map((c) => (c.id === checklistId ? { ...c, completed } : c));
        const doneCount = updatedChecklist.filter((c) => c.completed).length;
        const newProgress = updatedChecklist.length > 0 ? Math.round((doneCount / updatedChecklist.length) * 100) : prev.progress;
        return { ...prev, checklist: updatedChecklist, progress: newProgress };
      });
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId,
          checklistId,
          completed,
        }),
      });
    } catch (e) {
      console.error("Failed to update checklist item", e);
    }
  };

  const handleAssignChecklistMember = async (taskId: string, checklistId: string, assigneeName: string, assigneeEmpCode: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedChecklist = (t.checklist || []).map((c) =>
            c.id === checklistId ? { ...c, assignee_name: assigneeName, assignee_emp_code: assigneeEmpCode } : c
          );
          return { ...t, checklist: updatedChecklist };
        }
        return t;
      })
    );

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => {
        if (!prev) return null;
        const updatedChecklist = (prev.checklist || []).map((c) =>
          c.id === checklistId ? { ...c, assignee_name: assigneeName, assignee_emp_code: assigneeEmpCode } : c
        );
        return { ...prev, checklist: updatedChecklist };
      });
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const currentTask = tasks.find((t) => t.id === taskId);
      if (currentTask) {
        const updatedChecklist = (currentTask.checklist || []).map((c) =>
          c.id === checklistId ? { ...c, assignee_name: assigneeName, assignee_emp_code: assigneeEmpCode } : c
        );
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            taskId,
            checklist: updatedChecklist,
          }),
        });
      }
    } catch (e) {
      console.error("Failed to persist checklist assignment", e);
    }
  };

  const handleAddChecklistItemToTask = async (taskId: string) => {
    if (!detailNewChecklistTitle.trim()) return;
    const newItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: detailNewChecklistTitle.trim(),
      completed: false,
    };

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const updatedChecklist = [...(currentTask.checklist || []), newItem];
    const doneCount = updatedChecklist.filter((c) => c.completed).length;
    const newProgress = updatedChecklist.length > 0 ? Math.round((doneCount / updatedChecklist.length) * 100) : 0;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, checklist: updatedChecklist, progress: newProgress } : t))
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, checklist: updatedChecklist, progress: newProgress } : null));
    }

    setDetailNewChecklistTitle("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId,
          checklist: updatedChecklist,
          progress: newProgress,
        }),
      });
    } catch (e) {
      console.error("Failed to add checklist item to task", e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn XÓA công việc này khỏi hệ thống không?")) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(null);
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      await fetch(`/api/tasks?taskId=${encodeURIComponent(taskId)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };

  const handleDeleteChecklistItem = async (taskId: string, checklistId: string) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const currentChecklist = parseChecklist(currentTask.checklist);
    const updatedChecklist = currentChecklist.filter((c) => c.id !== checklistId);
    const doneCount = updatedChecklist.filter((c) => c.completed).length;
    const newProgress = updatedChecklist.length > 0 ? Math.round((doneCount / updatedChecklist.length) * 100) : 0;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, checklist: updatedChecklist, progress: newProgress } : t))
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, checklist: updatedChecklist, progress: newProgress } : null));
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId,
          checklist: updatedChecklist,
          progress: newProgress,
        }),
      });
    } catch (e) {
      console.error("Failed to delete checklist item", e);
    }
  };

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const taskFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUploadToTask = async (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingFile(true);
      setUploadProgress(15);
      setUploadError(null);
      let fileUrl = "";

      // 1. Try uploading to Cloudflare R2 with progress and auto-retry
      try {
        const r2Res = await uploadFileToR2(file, "TASK_DOC", {
          onProgress: (pct) => setUploadProgress(pct),
          retries: 3,
        });
        if (r2Res && (r2Res.url || r2Res.fileUrl)) {
          fileUrl = r2Res.url || r2Res.fileUrl;
        }
      } catch (r2Err: any) {
        console.warn("R2 upload fallback to Cloudinary / Blob:", r2Err);
        // 2. Fallback to Cloudinary
        try {
          const isImg = file.type.startsWith("image/");
          const uploadRes = await uploadCloudinaryFile(file, {
            category: "task_document",
            fileType: isImg ? "image" : "auto",
          });
          if (uploadRes.secure_url) {
            fileUrl = uploadRes.secure_url;
            setUploadProgress(100);
          }
        } catch {
          fileUrl = URL.createObjectURL(file);
          setUploadProgress(100);
        }
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

      const newAttachment: TaskAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        url: fileUrl,
        type: docType,
        size: formattedSize,
        uploadedAt: new Date().toLocaleDateString("vi-VN"),
      };

      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const updatedAttachments = [...(targetTask.attachments || []), newAttachment];

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, attachments: updatedAttachments } : t))
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, attachments: updatedAttachments } : null));
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId,
          attachments: updatedAttachments,
        }),
      });
    } catch (err: any) {
      setUploadError("Lỗi tải tệp: " + (err.message || "Vui lòng thử lại"));
      alert("Lỗi tải tệp: " + err.message);
    } finally {
      setIsUploadingFile(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (taskId: string, attachmentId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const updatedAttachments = (targetTask.attachments || []).filter((a) => a.id !== attachmentId);

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, attachments: updatedAttachments } : t))
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, attachments: updatedAttachments } : null));
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId,
          attachments: updatedAttachments,
        }),
      });
    } catch (e) {
      console.error("Failed to delete attachment", e);
    }
  };

  const handleFileUploadToNewTask = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingNewTaskFile(true);
      setUploadProgress(15);
      setUploadError(null);
      let fileUrl = "";

      // 1. Try uploading to Cloudflare R2 with progress and auto-retry
      try {
        const r2Res = await uploadFileToR2(file, "TASK_DOC", {
          onProgress: (pct) => setUploadProgress(pct),
          retries: 3,
        });
        if (r2Res && (r2Res.url || r2Res.fileUrl)) {
          fileUrl = r2Res.url || r2Res.fileUrl;
        }
      } catch (r2Err: any) {
        console.warn("R2 upload fallback to Cloudinary / Blob:", r2Err);
        try {
          const isImg = file.type.startsWith("image/");
          const uploadRes = await uploadCloudinaryFile(file, {
            category: "task_document",
            fileType: isImg ? "image" : "auto",
          });
          if (uploadRes.secure_url) {
            fileUrl = uploadRes.secure_url;
            setUploadProgress(100);
          }
        } catch {
          fileUrl = URL.createObjectURL(file);
          setUploadProgress(100);
        }
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

      setNewAttachments((prev) => [...prev, attachmentItem]);
    } catch (err: any) {
      setUploadError("Lỗi tải tệp: " + (err.message || "Vui lòng thử lại"));
      alert("Lỗi tải tệp: " + err.message);
    } finally {
      setIsUploadingNewTaskFile(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmittingTask) return;

    // Auto-commit pending checklist item title if user typed text but forgot to click "+ Thêm"
    const finalChecklist = [...newChecklist];
    if (newChecklistItemTitle.trim()) {
      finalChecklist.push({
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: newChecklistItemTitle.trim(),
        completed: false,
      });
    }

    const selectedStaff = activeStaffList.find((s) => s.empCode === newAssigneeEmpCode) || activeStaffList[0] || {
      empCode: activeUser?.empCode || "202608001",
      name: activeUser?.name || "Người tạo",
      position: "Cán Bộ",
      department: deptCode || "",
    };
    const taskAttachments = [...newAttachments];

    const createdTask: TaskItem = {
      id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      department_id: activeProjectFilter || "IT_DIGITAL",
      project_id: activeProjectFilter || undefined,
      assignee_emp_code: selectedStaff.empCode,
      assignee_name: selectedStaff.name,
      reporter_emp_code: activeUser?.empCode || "202608001",
      priority: newPriority,
      start_date: new Date().toISOString().substring(0, 10),
      due_date: newDueDate,
      status: "TO_DO",
      progress: 0,
      tags: activeProjectFilter ? `TASK,${activeProjectFilter}` : "TASK",
      checklist: finalChecklist,
      attachments: taskAttachments,
      result_description: "",
    };

    // INSTANT OPTIMISTIC UI UPDATE (0ms delay)
    setTasks((prev) => [createdTask, ...prev]);
    setIsCreating(false);
    setNewTitle("");
    setNewDesc("");
    setNewDueDate(new Date().toISOString().substring(0, 10));
    setNewChecklist([]);
    setNewChecklistItemTitle("");
    setNewAttachments([]);

    // PERSIST IN BACKGROUND
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: createdTask.id,
          code: createdTask.code,
          title: createdTask.title,
          description: createdTask.description,
          priority: createdTask.priority,
          due_date: createdTask.due_date,
          project_id: createdTask.project_id,
          assignee_emp_code: createdTask.assignee_emp_code,
          assignee_name: createdTask.assignee_name,
          department_id: createdTask.department_id,
          tags: createdTask.tags,
          checklist: finalChecklist,
          attachments: taskAttachments,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data && data.success && data.task) {
        setTasks((prev) =>
          prev.map((t) => (t.id === createdTask.id ? { ...data.task, checklist: parseChecklist(data.task.checklist) } : t))
        );
      }
    } catch (e) {
      console.error("Background task creation error", e);
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* SECTION 1: HEADER / HERO BANNER (Matches Screenshot 100%) */}
      <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Right Half Skechers Headquarters Photo with smooth white gradient fade to left */}
        <div
          className="absolute top-0 right-0 bottom-0 w-full md:w-3/5 bg-cover bg-right-top opacity-90 transition-transform duration-700 pointer-events-none"
          style={{ backgroundImage: `url('/images/KGLV/cdtt-2-goc-hinh-vp2.png')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
        </div>

        {/* Left Content Area */}
        <div className="relative z-10 space-y-2 max-w-xl">
          {/* Breadcrumb with Orange Accent Symbol */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="text-amber-500 font-bold text-sm">🔸</span>
            <Link href="/work" className="hover:text-[#006838] transition font-medium">
              Work Hub
            </Link>
            <span className="text-slate-400">›</span>
            <span className="text-slate-800 font-bold">Công việc</span>
          </div>

          {/* Main Title with Green Underline Accent */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bảng Quản Lý Công Việc
            </h1>
            <div className="w-16 h-1 bg-[#006838] rounded-full mt-1.5" />
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm font-semibold text-slate-600 flex flex-wrap items-center gap-2 pt-0.5">
            <span>Theo dõi tiến độ</span>
            <span className="text-slate-400 font-bold">·</span>
            <span>Phối hợp hiệu quả</span>
            <span className="text-slate-400 font-bold">·</span>
            <span>Hoàn thành đúng hạn</span>
          </p>
        </div>

        {/* Right Corner Script Slogan (Matches Screenshot Exactly) */}
        <div className="relative z-10 hidden sm:flex flex-col items-end shrink-0 text-right">
          <span className="text-xl sm:text-2xl font-black italic tracking-wide text-slate-800 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
            "Good People
          </span>
          <span className="text-xl sm:text-2xl font-black italic tracking-wide text-slate-800 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
            Great Work"
          </span>
          <div className="w-12 h-1 bg-[#006838] rounded-full mt-1.5" />
        </div>
      </div>

      {/* SECTION 2: ROW OF 4 STAT CARDS (Matches Screenshot 100%) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tasks */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 shrink-0">
              <IconClipboardList size={22} />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
              <IconTrendingUp size={12} /> +0%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">{totalCount}</div>
            <div className="text-xs font-bold text-slate-800">Tổng công việc</div>
            <div className="text-[11px] text-slate-400 font-medium">Được giao & theo dõi</div>
          </div>
        </div>

        {/* Card 2: Doing Tasks */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100 shrink-0">
              <IconClock size={22} />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5">
              <IconTrendingUp size={12} /> +0%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">{doingCount}</div>
            <div className="text-xs font-bold text-slate-800">Đang thực hiện</div>
            <div className="text-[11px] text-slate-400 font-medium">Trong quá trình làm</div>
          </div>
        </div>

        {/* Card 3: Completed Tasks */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200 shrink-0">
              <IconCheck size={22} />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
              <IconTrendingUp size={12} /> +0%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {doneCount} / {totalCount}
            </div>
            <div className="text-xs font-bold text-slate-800">Hoàn thành</div>
            <div className="text-[11px] text-slate-400 font-medium">Tỷ lệ hoàn tất</div>
          </div>
        </div>

        {/* Card 4: Urgent / Need Help (Pink background with Red Border - Fail-safe Contrast Fix) */}
        <div className="bg-rose-50/70 rounded-xl p-4 border-2 border-rose-400 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold border border-rose-300 shrink-0">
              <IconAlertTriangle size={22} className="animate-pulse" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black text-rose-700">
              0%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-950 tracking-tight font-mono">{needHelpCount}</div>
            <div className="text-xs font-black text-rose-900">Cần hỗ trợ / Gặp sự cố</div>
            <div className="text-[11px] text-rose-700 font-bold">Công việc cần xử lý</div>
          </div>
        </div>
      </div>

      {/* Project Filter Active Banner */}
      {activeProjectFilter && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 text-white shadow-md border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 font-black text-base">
              📌
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40">
                  KANBAN BOARD DỰ ÁN CỤ THỂ
                </span>
                <span className="text-xs font-mono text-amber-400">[{activeProjectFilter}]</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                {activeProjectName || `Bảng Công Việc Dự Án ${activeProjectFilter}`}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveProjectFilter(null);
              setActiveProjectName(null);
              if (typeof window !== "undefined") {
                window.history.replaceState({}, "", window.location.pathname);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700 shrink-0"
          >
            <span>✖️ Xem tất cả dự án</span>
          </button>
        </div>
      )}

      {/* SECTION 3: FILTER BAR + ACTION BUTTON (Matches Screenshot 100%) */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col gap-3">
        {/* Row 1: Scope Switcher & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setScopeTab("MY")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                scopeTab === "MY"
                  ? "bg-white text-[#006838] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <IconUser size={15} />
              <span>Việc Của Tôi</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                scopeTab === "MY" ? "bg-emerald-100 text-[#006838]" : "bg-slate-200 text-slate-700"
              }`}>
                {myTasksCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setScopeTab("DEPT")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                scopeTab === "DEPT"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <IconUsers size={15} />
              <span>Việc Chung Phòng Ban</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                scopeTab === "DEPT" ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-700"
              }`}>
                {tasks.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWorkloadModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Xem phân bổ tải nhân sự phòng ban, xuất Excel và in báo cáo chuẩn A4"
            >
              <IconFileSpreadsheet size={15} />
              <span>Báo Cáo Tải &amp; Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setQuickTitle("");
                setQuickAssignee(activeUser?.empCode || "");
                setIsQuickCreating(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <IconBolt size={15} />
              <span>+ Tạo Nhanh (5s)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 rounded-lg bg-[#006838] hover:bg-[#004d29] text-white text-xs font-black shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <IconPlus size={16} />
              <span>Tạo Công Việc Mới</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown 1: Priority */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-[#006838] transition cursor-pointer appearance-none"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="URGENT">🔴 URGENT (Gấp)</option>
              <option value="HIGH">🟠 HIGH (Cao)</option>
              <option value="MEDIUM">🔵 MEDIUM (Trung bình)</option>
              <option value="LOW">⚪ LOW (Thấp)</option>
            </select>
            <IconFilter size={15} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Dropdown TP: Managed Department Member Filter */}
          {(isTP || isExec) && (
            <div className="relative">
              <select
                value={memberFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setMemberFilter(val);
                  fetchTasks(val);
                }}
                className="pl-8 pr-8 py-2 rounded-lg bg-emerald-50/90 border border-emerald-300 text-xs font-black text-emerald-950 outline-none focus:border-[#006838] transition cursor-pointer appearance-none shadow-2xs"
              >
                <option value="ALL">👥 Toàn Bộ Phòng Ban ({deptCode || "Tất Cả"})</option>
                {activeStaffList.map((s) => (
                  <option key={s.empCode} value={s.empCode}>
                    👤 {s.name} ({s.position})
                  </option>
                ))}
              </select>
              <IconUsers size={15} className="absolute left-2.5 top-2.5 text-emerald-700 pointer-events-none" />
            </div>
          )}

          {/* Badge Staff: Personal View Indicator */}
          {isStaffOnly && (
            <div className="px-3 py-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5 shrink-0">
              <IconUserCheck size={16} className="text-blue-600 shrink-0" />
              <span>Bảng công việc cá nhân ({activeUser?.name || "Bản thân"})</span>
            </div>
          )}

          {/* Dropdown 2: Assignee / Reporter */}
          <div className="relative">
            <select
              value={reporterFilter}
              onChange={(e) => setReporterFilter(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-[#006838] transition cursor-pointer appearance-none"
            >
              <option value="ALL">Phân công (Tất cả)</option>
              {activeStaffList.map((s) => (
                <option key={s.empCode} value={s.empCode}>
                  {s.name}
                </option>
              ))}
            </select>
            <IconUser size={15} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Dropdown 3: Tag */}
          <div className="relative">
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-[#006838] transition cursor-pointer appearance-none"
            >
              <option value="ALL">Tất cả nhãn</option>
              <option value="KAIZEN">Kaizen / Cải tiến</option>
              <option value="AUTOMATION">Automation</option>
              <option value="DIGITAL">Digital</option>
              <option value="ANDON">Andon</option>
              <option value="SAFETY">An toàn</option>
              <option value="ISO">Quy trình ISO</option>
            </select>
            <IconTag size={15} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Tìm mã task, tiêu đề, người làm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#006838] transition"
            />
            <IconSearch size={15} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* SECTION 4: KANBAN BOARD 6 COLUMNS (Matches Screenshot 100%) */}
      {viewMode === "LIST" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                  <th className="p-3">Mã Task</th>
                  <th className="p-3">Tên Công Việc</th>
                  <th className="p-3">Người Phụ Trách</th>
                  <th className="p-3">Ưu Tiên</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3">Tiến Độ</th>
                  <th className="p-3">Hạn Chót</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      Chưa có công việc nào thỏa điều kiện tìm kiếm
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => setSelectedTask(t)}>
                      <td className="p-3 font-mono text-amber-800 font-black">#{t.code}</td>
                      <td className="p-3 text-slate-900 font-black max-w-[260px] truncate">{t.title}</td>
                      <td className="p-3 text-slate-700 flex items-center gap-2">
                        <UserAvatar name={t.assignee_name} size="xs" />
                        <span className="truncate">{t.assignee_name}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          t.priority === "URGENT" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-800">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-[10px]">
                          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${t.progress}%` }} />
                          </div>
                          <span>{t.progress}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] font-mono">{t.due_date}</td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedTask(t)}
                          className="px-3 py-1 rounded-lg bg-emerald-50 text-[#006838] hover:bg-emerald-100 font-black text-[11px]"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board: Mobile 1-Column Tab vs Desktop 6-Column Grid */
        <div className="space-y-3">
          {/* Mobile Column Tab Switcher (< 768px) */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => {
                if (col.key === "NEED_HELP") {
                  return t.status === "NEED_HELP" || (t.priority === "URGENT" && t.status !== "DONE");
                }
                return t.status === col.key;
              });
              const isSelected = mobileActiveCol === col.key;
              const IconComp = col.IconComponent;
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => setMobileActiveCol(col.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 min-h-[44px] cursor-pointer ${
                    isSelected
                      ? `${col.badge} shadow-xs ring-2 ring-[#006838]/30`
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <IconComp size={16} />
                  <span>{col.title}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? "bg-white/80" : "bg-slate-100"}`}>
                    {colTasks.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-start w-full md:min-w-[1100px] lg:min-w-0">
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = filteredTasks.filter((t) => {
                  if (col.key === "NEED_HELP") {
                    return t.status === "NEED_HELP" || (t.priority === "URGENT" && t.status !== "DONE");
                  }
                  return t.status === col.key;
                });
                const isTargetColumn = dragOverCol === col.key;
                const IconComp = col.IconComponent;
                const isMobileHidden = mobileActiveCol !== col.key;

                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverCol !== col.key) setDragOverCol(col.key);
                    }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (dragOverCol !== col.key) setDragOverCol(col.key);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverCol === col.key) setDragOverCol(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const droppedTaskId =
                      e.dataTransfer.getData("text/plain") ||
                      draggedTaskIdRef.current ||
                      (typeof window !== "undefined" ? (window as any)._draggedTaskId : null) ||
                      draggedTaskId;

                    setDragOverCol(null);
                    setDraggedTaskId(null);
                    draggedTaskIdRef.current = null;
                    if (typeof window !== "undefined") (window as any)._draggedTaskId = null;

                    if (droppedTaskId) {
                      const task = tasks.find((t) => t.id === droppedTaskId);
                      if (task && task.status !== col.key) {
                        handleMoveStatus(task, col.key);
                      }
                    }
                  }}
                  className={`rounded-xl p-3 border transition-all duration-200 space-y-3 min-h-[500px] flex-col bg-white border-slate-200/90 shadow-2xs ${
                    isTargetColumn ? "ring-2 ring-[#006838] bg-emerald-50/20" : ""
                  } ${isMobileHidden ? "hidden md:flex" : "flex"}`}
                >
                  {/* Column Header with Icon */}
                  <div className="flex items-center justify-between font-bold text-xs text-slate-800 pb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-5 h-5 rounded-full ${col.iconBg} ${col.iconColor} flex items-center justify-center shrink-0`}>
                        <IconComp size={13} />
                      </div>
                      <span className="truncate">{col.title}</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-extrabold shrink-0 border border-slate-200">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Cards or Empty State */}
                  <div className="space-y-3 flex-1 overflow-y-auto min-h-[360px] flex flex-col">
                    {colTasks.length === 0 ? (
                      /* Empty State Requirement (Matches Screenshot Exactly) */
                      <div className="flex flex-col items-center justify-center p-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 my-auto min-h-[220px]">
                        <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center mb-2 shadow-2xs border border-slate-100">
                          <IconFilePlus size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Chưa có công việc</span>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[150px] leading-snug font-medium">
                          Kéo thả card vào đây hoặc nhấn "Tạo Công Việc Mới"
                        </p>
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const isBeingDragged = draggedTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", task.id);
                              e.dataTransfer.effectAllowed = "move";
                              draggedTaskIdRef.current = task.id;
                              if (typeof window !== "undefined") (window as any)._draggedTaskId = task.id;
                              setDraggedTaskId(task.id);
                            }}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setDragOverCol(null);
                              draggedTaskIdRef.current = null;
                              if (typeof window !== "undefined") (window as any)._draggedTaskId = null;
                            }}
                            className={`p-3 rounded-lg bg-white border shadow-2xs hover:shadow transition-all space-y-2 group cursor-grab active:cursor-grabbing relative select-none ${
                              isBeingDragged
                                ? "opacity-30 border-2 border-dashed border-[#006838] scale-95 shadow-none"
                                : task.status === "NEED_HELP"
                                ? "border-rose-400 bg-rose-50/30"
                                : task.priority === "URGENT"
                                ? "border-amber-400 bg-amber-50/20"
                                : "border-slate-200 hover:border-[#006838]"
                            }`}
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                #{task.code}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  task.priority === "URGENT"
                                    ? "bg-rose-100 text-rose-700"
                                    : task.priority === "HIGH"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>

                            {/* Task Dependency Lock Badge */}
                            {(task as any).is_blocked && (
                              <div
                                className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black flex items-center gap-1 border border-rose-300 w-fit"
                                title={`Bị chặn bởi #${(task as any).blocked_by?.code || (task as any).blocked_by_task_id}: ${(task as any).blocked_by?.title || "Chưa hoàn thành"}`}
                              >
                                <IconLock size={11} className="text-rose-600" />
                                <span>Bị chặn bởi #{(task as any).blocked_by?.code || (task as any).blocked_by_task_id}</span>
                              </div>
                            )}

                            {/* Cross-Department Project Task Badge */}
                            {(task as any).is_external_project_task && (
                              <div className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-black border border-blue-200 w-fit">
                                🤝 {(task as any).external_project_label || `Dự án ngoài: ${(task as any).project_id}`}
                              </div>
                            )}

                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#006838] transition-colors leading-snug">
                              {task.title}
                            </h4>

                            {/* Help Alert Box: only show when task is actually in NEED_HELP status */}
                            {task.status === "NEED_HELP" && (
                              <div className="p-2 rounded-lg bg-rose-100/90 border border-rose-300 space-y-1 text-[10px]">
                                <div className="flex items-center justify-between font-black text-rose-900 uppercase tracking-tight">
                                  <span className="flex items-center gap-1">
                                    <IconAlertTriangle size={13} className="text-rose-600 shrink-0 animate-pulse" />
                                    Cần Trưởng Phòng Hỗ Trợ
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black">
                                    HOT
                                  </span>
                                </div>
                                {task.help_reason ? (
                                  <p className="text-[10px] text-rose-900 font-bold line-clamp-2 italic">
                                    "{task.help_reason}"
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-rose-800 font-semibold italic">
                                    Công việc đang chờ Trưởng phòng xử lý
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Rejection / Redo Banner: show when task has reject_reason and is in DOING */}
                            {task.reject_reason && task.status === "DOING" && (
                              <div className="p-2 rounded-lg bg-rose-50 border border-rose-300 space-y-1 text-[10px]">
                                <div className="flex items-center gap-1 font-black text-rose-900 uppercase tracking-tight">
                                  <IconArrowBackUp size={13} className="text-rose-600 shrink-0" />
                                  Yêu Cầu Làm Lại
                                </div>
                                <p className="text-[10px] text-rose-800 font-bold line-clamp-2 italic">
                                  "{task.reject_reason}"
                                </p>
                              </div>
                            )}

                            {/* Review Banner: show when task is in REVIEW status */}
                            {task.status === "REVIEW" && (
                              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 space-y-1.5 text-[10px]">
                                <div className="flex items-center justify-between font-black text-indigo-900 uppercase tracking-tight">
                                  <span className="flex items-center gap-1">
                                    <IconShieldCheck size={13} className="text-indigo-600 shrink-0" />
                                    Chờ Nghiệm Thu
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-black">
                                    REVIEW
                                  </span>
                                </div>
                                {task.result_description && (
                                  <p className="text-[10px] text-indigo-950 font-medium line-clamp-2 italic bg-white/80 p-1 rounded border border-indigo-100">
                                    "{task.result_description}"
                                  </p>
                                )}
                                {(isTP || isExec || activeUser?.empCode === task.reporter_emp_code) && (
                                  <div className="flex items-center gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveTask(task)}
                                      className="flex-1 py-1 px-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                                    >
                                      <IconCheck size={12} />
                                      Duyệt đạt
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPendingRejectTask(task);
                                        setRejectReasonText("");
                                        setRejectError(null);
                                      }}
                                      className="flex-1 py-1 px-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                                    >
                                      <IconArrowBackUp size={12} />
                                      Làm lại
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                <span>Tiến độ</span>
                                <span className="font-mono">{task.progress}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-[#006838] rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            </div>

                            {/* Attachments Badge */}
                            {task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0 && (
                              <div
                                className="flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 w-fit transition cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewAttachment(task.attachments![0]);
                                }}
                                title="Bấm để xem pop-up tab tài liệu đính kèm"
                              >
                                <IconPaperclip size={12} className="shrink-0 text-blue-600" />
                                <span>{task.attachments.length} file ({task.attachments[0].type.toUpperCase()})</span>
                              </div>
                            )}

                            {/* Checklist Badge */}
                            {task.checklist && Array.isArray(task.checklist) && task.checklist.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-[#006838] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                                <IconChecklist size={12} className="shrink-0" />
                                <span>Checklist ({task.checklist.filter((c) => c.completed).length}/{task.checklist.length})</span>
                              </div>
                            )}

                            {/* Footer Card Info */}
                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                              <div className="flex items-center gap-1 truncate max-w-[100px]">
                                <UserAvatar name={task.assignee_name} size="xs" />
                                <span className="truncate">{task.assignee_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMobileStatusSheetTask(task);
                                  }}
                                  className="md:hidden px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#006838] border border-slate-200 text-[10px] font-bold flex items-center gap-0.5 min-h-[36px]"
                                  title="Đổi trạng thái cột"
                                >
                                  <span>Đổi cột ▾</span>
                                </button>
                                <span className="font-mono text-slate-400 shrink-0">{task.due_date}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateTask(task);
                                  }}
                                  title="Nhân bản công việc này"
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                                >
                                  <IconCopy size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Column Bottom Link "+ Thêm công việc" (Matches Screenshot) */}
                  <button
                    type="button"
                    onClick={() => {
                      setNewPriority("MEDIUM");
                      setIsCreating(true);
                    }}
                    className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${col.addBtnColor}`}
                  >
                    <span className="text-sm font-extrabold">+</span>
                    <span>Thêm công việc</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* SECTION 5: ROW OF 3 BOTTOM WIDGETS (Matches Screenshot 100%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* WIDGET 1 (LEFT, WIDEST): CÔNG VIỆC GẦN ĐÂY */}
        <div className="lg:col-span-6 bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Công việc gần đây</h3>

            {/* Tab Filter Pills */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setRecentTab("ALL")}
                className={`px-2.5 py-1 rounded-md transition-all ${recentTab === "ALL" ? "bg-white text-emerald-800 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"}`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setRecentTab("MY")}
                className={`px-2.5 py-1 rounded-md transition-all ${recentTab === "MY" ? "bg-white text-emerald-800 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"}`}
              >
                Của tôi
              </button>
              <button
                type="button"
                onClick={() => setRecentTab("ASSIGNED")}
                className={`px-2.5 py-1 rounded-md transition-all ${recentTab === "ASSIGNED" ? "bg-white text-emerald-800 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"}`}
              >
                Được giao
              </button>
              <button
                type="button"
                onClick={() => setRecentTab("DONE")}
                className={`px-2.5 py-1 rounded-md transition-all ${recentTab === "DONE" ? "bg-white text-emerald-800 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"}`}
              >
                Đã hoàn thành
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {recentWidgetTasks.length === 0 ? (
              /* Empty State requirement (Matches Screenshot Exactly) */
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-1.5 rounded-lg bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-2xs border border-slate-100 mb-1">
                  <IconClipboardList size={26} />
                </div>
                <div className="text-xs font-bold text-slate-800">Chưa có công việc nào</div>
                <p className="text-[11px] text-slate-400 font-medium">Hãy tạo công việc mới để bắt đầu!</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px] tracking-wider">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Tiêu đề công việc</th>
                    <th className="pb-2">Người phụ trách</th>
                    <th className="pb-2">Thời gian</th>
                    <th className="pb-2">Trạng thái</th>
                    <th className="pb-2 text-right">Mức độ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {recentWidgetTasks.slice(0, 5).map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="hover:bg-slate-50 transition cursor-pointer text-slate-700"
                    >
                      <td className="py-2.5 font-mono text-[11px] text-amber-800 font-bold">#{t.code}</td>
                      <td className="py-2.5 font-bold text-slate-900 max-w-[160px] truncate">{t.title}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5 truncate max-w-[110px]">
                          <UserAvatar name={t.assignee_name} size="xs" />
                          <span className="truncate">{t.assignee_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-500">{t.due_date}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          t.status === "DONE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          t.priority === "URGENT" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* WIDGET 2 (MIDDLE): LỊCH LÀM VIỆC (Matches Screenshot 100%) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Lịch làm việc</h3>
            <a href="#" className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition">
              Xem tất cả
            </a>
          </div>

          {/* Month Header Navigation */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer">
              <IconChevronLeft size={15} />
            </button>
            <span className="font-mono">Tháng 9, 2026</span>
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer">
              <IconChevronRight size={15} />
            </button>
          </div>

          {/* Calendar Month Grid */}
          <div className="space-y-1">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
              <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-700">
              <div className="p-1 text-slate-300">31</div>
              {[...Array(30)].map((_, i) => {
                const day = i + 1;
                const isSelected = day === selectedCalendarDay;
                const isToday = day === 14;
                const activeDayTasks = activeCalendarTasksByDay[day] || [];
                const hasTasks = activeDayTasks.length > 0;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedCalendarDay(day)}
                    className={`relative p-1 rounded-full transition-all cursor-pointer text-xs font-mono font-bold flex items-center justify-center w-7 h-7 mx-auto ${
                      isSelected
                        ? "bg-[#006838] text-white font-black shadow-2xs"
                        : isToday
                        ? "ring-2 ring-[#006838] text-[#006838] font-black hover:bg-emerald-50"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {day}
                    {hasTasks && (
                      <span
                        className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-amber-300" : "bg-emerald-600"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Task List */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-600">
                Hạn chót ngày {selectedCalendarDay}/09/2026:
              </span>
              <span className="font-mono font-black text-[#006838] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {(calendarTasksByDay[selectedCalendarDay] || []).length} CV
              </span>
            </div>
            {(calendarTasksByDay[selectedCalendarDay] || []).length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Không có công việc đến hạn ngày này.</p>
            ) : (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {(calendarTasksByDay[selectedCalendarDay] || []).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="p-1.5 rounded bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-black text-amber-800 bg-amber-100 px-1 rounded shrink-0">#{t.code}</span>
                      <span className="text-[11px] font-bold text-slate-800 truncate">{t.title}</span>
                    </div>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0 uppercase">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WIDGET 3 (RIGHT): HOẠT ĐỘNG GẦN ĐÂY (Matches Screenshot 100%) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Hoạt động gần đây</h3>
            <a href="#" className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition">
              Xem tất cả
            </a>
          </div>

          {/* Activity Feed List */}
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                <IconBuilding size={13} />
              </div>
              <div>
                <p className="text-slate-800 font-bold leading-snug">Bạn đã truy cập Work Hub</p>
                <span className="text-[10px] text-slate-400 font-mono">Vài giây trước</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
                <IconHeart size={13} />
              </div>
              <div>
                <p className="text-slate-800 font-bold leading-snug">Hệ thống đã sẵn sàng</p>
                <span className="text-[10px] text-slate-400 font-mono">1 phút trước</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                <IconClock size={13} />
              </div>
              <div>
                <p className="text-slate-800 font-bold leading-snug">Không có cập nhật mới</p>
                <span className="text-[10px] text-slate-400 font-mono">Hãy bắt đầu tạo công việc!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: FOOTER (Matches Screenshot 100%) */}
      <footer className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <div className="font-black text-slate-800 tracking-wider">TBS GROUP</div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Together for a better tomorrow</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <a href="#" className="hover:text-slate-800 transition">Hỗ trợ</a>
          <span>|</span>
          <a href="#" className="hover:text-slate-800 transition">Hướng dẫn</a>
          <span>|</span>
          <a href="#" className="hover:text-slate-800 transition">Liên hệ</a>
          <span className="text-slate-400 font-mono text-[11px]">v1.0.0</span>
        </div>
      </footer>

      {/* MODAL 1: CREATE TASK */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Tạo Công Việc Mới</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tiêu đề công việc <span className="text-rose-500 font-black ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tiêu đề công việc..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-[#006838]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả công việc..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-[#006838]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Hạn deadline (Ngày hoàn thành) <span className="text-rose-500 font-black ml-0.5">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-[#006838] bg-slate-50"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Người phụ trách thực hiện</label>
                  <span className="text-[10px] text-slate-400 font-medium">({filteredModalStaffList.length} nhân sự)</span>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Tìm nhanh theo tên, MSNV, chức vụ..."
                  value={assigneeSearchText}
                  onChange={(e) => setAssigneeSearchText(e.target.value)}
                  className="w-full mb-1.5 px-2.5 py-1 text-xs border border-slate-200 rounded-md focus:border-[#006838] outline-none bg-slate-50"
                />
                <select
                  value={newAssigneeEmpCode}
                  onChange={(e) => setNewAssigneeEmpCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-[#006838] bg-white"
                >
                  {filteredModalStaffList.map((staff) => (
                    <option key={staff.empCode} value={staff.empCode}>
                      👤 {staff.name} — {staff.position} ({staff.empCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-[#006838]"
                >
                  <option value="LOW">⚪ Thấp (LOW)</option>
                  <option value="MEDIUM">🔵 Trung bình (MEDIUM)</option>
                  <option value="HIGH">🟠 Ưu tiên cao (HIGH)</option>
                  <option value="URGENT">🔴 Khẩn cấp (URGENT)</option>
                </select>
              </div>

              {/* Document Attachments Section for Task Creation */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <IconPaperclip size={15} className="text-[#006838]" />
                    <span>Tài Liệu Liên Quan (Word, Excel, PDF, Hình Ảnh)</span>
                  </label>
                  <div>
                    <input
                      type="file"
                      ref={newTaskFileInputRef}
                      onChange={handleFileUploadToNewTask}
                      accept=".doc,.docx,.xls,.xlsx,.csv,.pdf,.png,.jpg,.jpeg,.gif,.webp,.zip"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => newTaskFileInputRef.current?.click()}
                      disabled={isUploadingNewTaskFile}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition disabled:opacity-50 active:scale-95"
                    >
                      <IconUpload size={13} />
                      <span>{isUploadingNewTaskFile ? "Đang tải..." : "Thêm Tài Liệu"}</span>
                    </button>
                  </div>
                </div>

                {/* Upload Progress & Network Retry Alert */}
                {isUploadingNewTaskFile && (
                  <div className="space-y-1 p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                      <span>Đang nén ảnh & tải lên R2...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-emerald-100 overflow-hidden">
                      <div
                        className="h-full bg-[#006838] transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {uploadError && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between gap-2">
                    <span>{uploadError}</span>
                    <button
                      type="button"
                      onClick={() => newTaskFileInputRef.current?.click()}
                      className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {newAttachments.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {newAttachments.map((att) => (
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
                          onClick={() => setNewAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                          className="text-rose-500 hover:text-rose-700 p-0.5 rounded transition cursor-pointer"
                        >
                          <IconX size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Checklist Creation */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IconChecklist size={15} className="text-[#006838]" />
                    <span>Danh Sách Hạng Mục Cần Thực Hiện (Checklist)</span>
                  </span>
                  {newChecklist.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {newChecklist.length} hạng mục
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nhập tên hạng mục cần thực hiện..."
                    value={newChecklistItemTitle}
                    onChange={(e) => setNewChecklistItemTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newChecklistItemTitle.trim()) {
                          setNewChecklist((prev) => [
                            ...prev,
                            {
                              id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                              title: newChecklistItemTitle.trim(),
                              completed: false,
                            },
                          ]);
                          setNewChecklistItemTitle("");
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-[#006838]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newChecklistItemTitle.trim()) {
                        setNewChecklist((prev) => [
                          ...prev,
                          {
                            id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            title: newChecklistItemTitle.trim(),
                            completed: false,
                          },
                        ]);
                        setNewChecklistItemTitle("");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 font-bold text-xs flex items-center gap-1 shrink-0"
                  >
                    <IconPlus size={14} />
                    <span>Thêm/Chỉnh sửa</span>
                  </button>
                </div>

                {newChecklist.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {newChecklist.map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-slate-200 text-xs">
                        <span className="font-bold text-slate-800">{idx + 1}. {item.title}</span>
                        <button
                          type="button"
                          onClick={() => setNewChecklist((prev) => prev.filter((c) => c.id !== item.id))}
                          className="text-rose-500 hover:text-rose-700 p-0.5 rounded transition"
                        >
                          <IconX size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingTask}
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-5 py-2 rounded-lg bg-[#006838] hover:bg-[#004d29] disabled:opacity-50 text-white text-xs font-black shadow-2xs transition flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingTask ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" />
                      <span>Đang tạo thẻ...</span>
                    </>
                  ) : (
                    <span>Tạo Thẻ Công Việc</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DONE / REVIEW RESULT */}
      {pendingDoneTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <IconCheck className="text-emerald-600" />
                <span>
                  {(isTP || isExec || activeUser?.empCode === pendingDoneTask.reporter_emp_code || pendingDoneTask.reporter_emp_code === pendingDoneTask.assignee_emp_code)
                    ? "Nghiệm Thu Hoàn Tất Công Việc"
                    : "Nộp Kết Quả Chờ Nghiệm Thu"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setPendingDoneTask(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {(isTP || isExec || activeUser?.empCode === pendingDoneTask.reporter_emp_code || pendingDoneTask.reporter_emp_code === pendingDoneTask.assignee_emp_code) ? (
                <>
                  Bạn đang hoàn thành và nghiệm thu đạt công việc <strong className="text-slate-900">#{pendingDoneTask.code}</strong> sang trạng thái <strong>DONE (Hoàn Thành)</strong>.
                </>
              ) : (
                <>
                  Bạn đang nộp kết quả công việc <strong className="text-slate-900">#{pendingDoneTask.code}</strong>. Công việc sẽ được chuyển sang cột <strong>REVIEW (Chờ duyệt)</strong> để Trưởng phòng / Người giao việc nghiệm thu.
                </>
              )}
            </p>

            {resultError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {resultError}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                Tóm tắt kết quả công việc <span className="text-rose-500 font-black ml-0.5">*</span> <span className="text-[10px] text-rose-600 font-bold ml-1">(Bắt buộc tối thiểu 5 ký tự)</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Nhập mô tả kết quả hoàn thành, đường dẫn tài liệu hoặc sản phẩm..."
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-[#006838]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingDoneTask(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitDone}
                className="px-4 py-2 rounded-lg bg-[#006838] text-white text-xs font-black shadow-2xs hover:bg-[#004d29] transition flex items-center gap-1.5 cursor-pointer"
              >
                <IconSend size={15} />
                <span>
                  {(isTP || isExec || activeUser?.empCode === pendingDoneTask.reporter_emp_code || pendingDoneTask.reporter_emp_code === pendingDoneTask.assignee_emp_code)
                    ? "Xác Nhận Nghiệm Thu (DONE)"
                    : "Gửi Nộp Chờ Duyệt (REVIEW)"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SUBMIT HELP REQUEST */}
      {pendingHelpTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-rose-900 tracking-tight flex items-center gap-2">
                <IconAlertTriangle className="text-rose-600" />
                <span>Báo Cáo Báo Động Vướng Mắc</span>
              </h3>
              <button
                type="button"
                onClick={() => setPendingHelpTask(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            {helpError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {helpError}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                Nội dung lý do cần hỗ trợ <span className="text-rose-500 font-black ml-0.5">*</span> <span className="text-[10px] text-rose-600 font-bold ml-1">(Bắt buộc)</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Mô tả sự cố hoặc lý do cần trợ giúp..."
                value={helpReasonText}
                onChange={(e) => setHelpReasonText(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingHelpTask(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitHelp}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-black shadow-2xs hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <IconBellRinging size={15} />
                <span>Gửi Báo Động Cho Trưởng Phòng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TASK DETAILS & CHECKLIST */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto font-sans relative">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs font-mono font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                    #{selectedTask.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                    {selectedTask.status}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-snug tracking-tight">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <IconFileText size={15} />
                <span>Mô Tả Nhiệm Vụ</span>
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium leading-relaxed">
                {selectedTask.description || "Không có mô tả chi tiết."}
              </div>
            </div>

            {/* Reject Reason Banner if present */}
            {selectedTask.reject_reason && selectedTask.status === "DOING" && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-900 uppercase">
                  <IconArrowBackUp size={16} className="text-rose-600" />
                  <span>Yêu Cầu Làm Lại Từ Cấp Quản Lý:</span>
                </div>
                <p className="text-xs text-rose-900 font-bold italic leading-relaxed">
                  "{selectedTask.reject_reason}"
                </p>
              </div>
            )}

            {/* Review Banner if in REVIEW */}
            {selectedTask.status === "REVIEW" && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900 uppercase flex items-center gap-1.5">
                    <IconShieldCheck size={16} className="text-indigo-600" />
                    <span>Công việc đang chờ nghiệm thu kết quả</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-black">
                    REVIEW
                  </span>
                </div>
                {selectedTask.result_description && (
                  <div className="text-xs text-indigo-950 font-medium bg-white/90 p-3 rounded-lg border border-indigo-100">
                    <strong className="block mb-1 text-slate-700">Tóm tắt kết quả nộp:</strong>
                    {selectedTask.result_description}
                  </div>
                )}
                {(isTP || isExec || activeUser?.empCode === selectedTask.reporter_emp_code) && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApproveTask(selectedTask)}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <IconCheck size={16} />
                      <span>Duyệt Đạt (Chuyển DONE 100%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingRejectTask(selectedTask);
                        setRejectReasonText("");
                        setRejectError(null);
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <IconArrowBackUp size={16} />
                      <span>Bắt Làm Lại (Chuyển DOING)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Attachments Section (Word, Excel, PDF, Images) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <IconPaperclip size={16} className="text-[#006838]" />
                  <span>Tài Liệu Liên Quan (Word, Excel, PDF, Hình Ảnh)</span>
                </h4>
                <div>
                  <input
                    type="file"
                    ref={taskFileInputRef}
                    onChange={(e) => handleFileUploadToTask(e, selectedTask.id)}
                    accept=".doc,.docx,.xls,.xlsx,.csv,.pdf,.png,.jpg,.jpeg,.gif,.webp,.zip"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => taskFileInputRef.current?.click()}
                    disabled={isUploadingFile}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50 active:scale-95"
                  >
                    <IconUpload size={14} />
                    <span>{isUploadingFile ? "Đang tải lên..." : "Tải Tài Liệu Lên"}</span>
                  </button>
                </div>
              </div>

              {/* Upload Progress & Network Retry Alert */}
              {isUploadingFile && (
                <div className="space-y-1 p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                    <span>Đang nén ảnh & tải lên R2...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-emerald-100 overflow-hidden">
                    <div
                      className="h-full bg-[#006838] transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {uploadError && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between gap-2">
                  <span>{uploadError}</span>
                  <button
                    type="button"
                    onClick={() => taskFileInputRef.current?.click()}
                    className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTask.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white flex items-center justify-between gap-2.5 transition shadow-2xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {att.type === "doc" && (
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                            <IconFileText size={18} />
                          </div>
                        )}
                        {att.type === "xls" && (
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                            <IconFileSpreadsheet size={18} />
                          </div>
                        )}
                        {att.type === "pdf" && (
                          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold">
                            <IconFileTypePdf size={18} />
                          </div>
                        )}
                        {att.type === "img" && (
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                            <IconPhoto size={18} />
                          </div>
                        )}
                        {att.type === "other" && (
                          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold">
                            <IconPaperclip size={18} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => setPreviewAttachment(att)}
                            className="text-xs font-bold text-slate-900 hover:text-[#006838] truncate block text-left w-full cursor-pointer"
                            title="Bấm để xem pop-up tab tài liệu"
                          >
                            {att.name}
                          </button>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {att.size || "File"} • {att.uploadedAt}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#006838] hover:bg-emerald-50 transition cursor-pointer"
                          title="Xem pop-up tab tài liệu"
                        >
                          <IconEye size={14} />
                        </button>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.name}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#006838] hover:bg-emerald-50 transition"
                          title="Tải xuống tài liệu"
                        >
                          <IconDownload size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(selectedTask.id, att.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Xóa tài liệu"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Chưa có tài liệu đính kèm. Bấm <strong>"Tải Tài Liệu Lên"</strong> để thêm file Word (.docx), Excel (.xlsx), PDF hoặc Hình ảnh!
                </div>
              )}
            </div>

            {/* Checklist Section */}
            {(() => {
              const currentChecklist = parseChecklist(selectedTask.checklist);
              const doneCount = currentChecklist.filter((c) => c.completed).length;

              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <IconChecklist size={16} className="text-[#006838]" />
                      <span>Danh Sách Hạng Mục Cần Thực Hiện</span>
                    </h4>
                    {currentChecklist.length > 0 && (
                      <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {doneCount} / {currentChecklist.length} ({Math.round((doneCount / currentChecklist.length) * 100)}%)
                      </span>
                    )}
                  </div>

                  {/* Quick Add Checklist Item */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Thêm hạng mục mới cần thực hiện..."
                      value={detailNewChecklistTitle}
                      onChange={(e) => setDetailNewChecklistTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddChecklistItemToTask(selectedTask.id);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-[#006838]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddChecklistItemToTask(selectedTask.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#006838] hover:bg-[#004d29] text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                    >
                      <IconPlus size={14} />
                      <span>Thêm/Chỉnh sửa</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {currentChecklist.length > 0 ? (
                      currentChecklist.map((chk) => (
                        <div
                          key={chk.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl border bg-white border-slate-200 shadow-2xs group"
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={chk.completed}
                              onChange={(e) => handleToggleChecklist(selectedTask.id, chk.id, e.target.checked)}
                              className="w-4 h-4 text-[#006838] rounded border-slate-300 focus:ring-[#006838] cursor-pointer shrink-0"
                            />
                            <span className={`text-xs truncate ${chk.completed ? "line-through text-slate-400 font-medium" : "text-slate-800 font-bold"}`}>
                              {chk.title}
                            </span>
                          </label>
                          <div className="flex items-center gap-2 shrink-0">
                            {chk.assignee_name && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {chk.assignee_name}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteChecklistItem(selectedTask.id, chk.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Xóa hạng mục"
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 font-medium italic p-2.5 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        Chưa có hạng mục công việc nào. Nhập tiêu đề ở trên và bấm "Thêm" để bắt đầu!
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-slate-500 font-bold">
                Phân công: <strong className="text-slate-800">{selectedTask.assignee_name || "Chưa gán"}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDuplicateTask(selectedTask)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Tạo bản sao của công việc này"
                >
                  <IconCopy size={15} />
                  <span>Nhân Bản</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Xóa công việc này khỏi hệ thống"
                >
                  <IconTrash size={15} />
                  <span>Xóa Công Việc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition cursor-pointer active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DOCUMENT PREVIEW POP-UP TAB */}
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

      {/* MODAL 6: REJECT & REDO (Bắt làm lại) */}
      {pendingRejectTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-rose-900 tracking-tight flex items-center gap-2">
                <IconArrowBackUp className="text-rose-600" />
                <span>Yêu Cầu Làm Lại Công Việc</span>
              </h3>
              <button
                type="button"
                onClick={() => setPendingRejectTask(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Bạn đang yêu cầu nhân viên làm lại task <strong className="text-slate-900">#{pendingRejectTask.code}</strong>: "{pendingRejectTask.title}". Task sẽ chuyển về trạng thái <strong>ĐANG LÀM (DOING)</strong>.
            </p>

            {rejectError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {rejectError}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                Lý do bắt buộc làm lại <span className="text-rose-500 font-black ml-0.5">*</span> <span className="text-[10px] text-rose-600 font-bold ml-1">(Tối thiểu 5 ký tự)</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Nêu rõ điểm chưa đạt, hạng mục cần chỉnh sửa bổ sung..."
                value={rejectReasonText}
                onChange={(e) => setRejectReasonText(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingRejectTask(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-black shadow-2xs hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <IconArrowBackUp size={15} />
                <span>Xác Nhận Yêu Cầu Làm Lại</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: QUICK CREATE TASK (Tạo nhanh 5s) */}
      {isQuickCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <IconBolt className="text-amber-500" />
                <span>⚡ Tạo Nhanh Công Việc (5 Giây)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickCreating(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tên công việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ví dụ: Kiểm tra báo cáo Kaizen tuần 42..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-[#006838]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Người phụ trách
                </label>
                <select
                  value={quickAssignee}
                  onChange={(e) => setQuickAssignee(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-[#006838] bg-white"
                >
                  {activeStaffList.map((staff) => (
                    <option key={staff.empCode} value={staff.empCode}>
                      👤 {staff.name} — {staff.position} ({staff.empCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Hạn hoàn thành (Deadline)
                </label>
                <input
                  type="date"
                  value={quickDueDate}
                  onChange={(e) => setQuickDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-[#006838] bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickCreating(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={quickSubmitting}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-black shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {quickSubmitting ? (
                    <>
                      <IconLoader2 size={15} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <IconBolt size={15} />
                      <span>Tạo Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: MOBILE STATUS BOTTOM SHEET (Touch-friendly >= 48px buttons) */}
      {mobileStatusSheetTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  #{mobileStatusSheetTask.code}
                </span>
                <h3 className="text-sm font-black text-slate-900 truncate mt-1">
                  {mobileStatusSheetTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileStatusSheetTask(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <IconX size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-bold">
              Chọn trạng thái chuyển nhanh cho công việc:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {KANBAN_COLUMNS.map((col) => {
                const isCurrent = mobileStatusSheetTask.status === col.key;
                return (
                  <button
                    key={col.key}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      const taskToMove = mobileStatusSheetTask;
                      setMobileStatusSheetTask(null);
                      handleMoveStatus(taskToMove, col.key as any);
                    }}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-between min-h-[48px] cursor-pointer ${
                      isCurrent
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : `${col.badge} hover:opacity-90 shadow-2xs active:scale-98`
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <col.IconComponent size={18} />
                      <span>{col.title}</span>
                    </div>
                    {isCurrent ? (
                      <span className="text-[11px] font-bold text-slate-400">(Cột hiện tại)</span>
                    ) : (
                      <IconChevronRight size={16} />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setMobileStatusSheetTask(null)}
              className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition min-h-[44px] cursor-pointer"
            >
              Đóng menu
            </button>
          </div>
        </div>
      )}

      {/* MODAL 9: OPTIMISTIC CONCURRENCY CONTROL (OCC) CONFLICT MODAL */}
      {conflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <IconAlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Xung đột dữ liệu đồng thời</h3>
                <p className="text-xs text-slate-500">Hai người cùng chỉnh sửa một công việc</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
              <p className="font-bold">{conflictModal.message}</p>
              <p className="text-[11px] text-rose-600">
                Mã công việc: <span className="font-mono font-bold">#{conflictModal.task.code}</span>
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có thể <strong>Nạp lại dữ liệu</strong> để xem nội dung mới nhất từ đồng nghiệp, hoặc chọn <strong>Ghi đè</strong> nếu bạn chắc chắn muốn lưu thay đổi của mình.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={conflictModal.onReload}
                className="px-4 py-2.5 rounded-xl bg-[#006838] hover:bg-emerald-800 text-white text-xs font-black shadow transition cursor-pointer min-h-[44px]"
              >
                Nạp lại dữ liệu mới
              </button>
              <button
                type="button"
                onClick={conflictModal.onOverwrite}
                className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer min-h-[44px]"
              >
                Ghi đè dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workload & A4 Report Modal */}
      {isWorkloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative border border-slate-200">
            <button
              type="button"
              onClick={() => setIsWorkloadModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer z-10"
              title="Đóng modal"
            >
              <IconX size={20} />
            </button>
            <DepartmentWorkloadReport
              tasks={tasks.map((t) => ({
                id: t.id,
                code: t.code,
                title: t.title,
                status: t.status,
                progress: t.progress,
                priority: t.priority,
                due_date: t.due_date,
                assignee_emp_code: t.assignee_emp_code,
                assignee_name: t.assignee_name,
                reporter_emp_code: t.reporter_emp_code,
                department_id: t.department_id || deptCode || "TBS",
                project_id: t.project_id,
                result_description: t.result_description,
                updated_at: t.updated_at,
              }))}
              staffList={activeStaffList.map((s) => ({
                empCode: s.empCode,
                name: s.name,
                position: s.position,
                department: s.department || deptCode || "TBS",
              }))}
              deptName={deptCode || "Phòng Ban Pilot TBS"}
              isManager={!isStaffOnly}
              onTaskReassigned={() => {
                fetchTasks();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
