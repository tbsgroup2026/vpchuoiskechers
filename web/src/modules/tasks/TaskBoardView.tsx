"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/userProfiles";
import DepartmentOverviewGrid, { DEFAULT_DEPARTMENTS } from "./DepartmentOverviewGrid";
import {
  IconPlus,
  IconCheck,
  IconStar,
  IconClock,
  IconRefresh,
  IconArrowLeft,
  IconUser,
  IconCalendar,
  IconChevronRight,
  IconCircleCheck,
  IconAlertCircle,
  IconSearch,
  IconFolder,
  IconSparkles,
  IconShieldCheck,
  IconLayoutDashboard,
  IconChecklist,
  IconBuilding,
  IconBell,
  IconGridDots,
  IconFileText,
  IconDownload,
  IconAlarm,
  IconReport,
  IconChartPie,
  IconUsers,
  IconMenu2,
  IconX,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

// Mock data for department staff members (for Employee workload tab)
const STAFF_MEMBERS = [
  { empCode: "202608001", name: "Phạm Nguyễn Anh Huy", position: "Lập trình viên", dept: "Phòng IT & CĐS" },
  { empCode: "202608002", name: "Nguyễn Văn Hùng", position: "Chuyên viên CDS", dept: "Phòng IT & CĐS" },
  { empCode: "202608003", name: "Trần Thị Mai", position: "Quản lý Dự án", dept: "Phối Hợp Chuỗi Skechers" },
  { empCode: "202608004", name: "Lê Hoàng Nam", position: "Chuyên viên QC", dept: "Ban An Toàn & QC" },
  { empCode: "202608005", name: "Đặng Thu Thảo", position: "Hành chính ISO", dept: "Phòng Hành Chính Nhân Sự" },
];

function UserAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const getInitials = (n: string) => {
    if (!n) return "PH";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-xs font-black",
    lg: "w-11 h-11 text-sm font-black",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-[#006838] text-white flex items-center justify-center font-extrabold shadow-sm shrink-0 ring-2 ring-emerald-100`}
    >
      {getInitials(name)}
    </div>
  );
}

export default function TaskBoardView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deptParam = searchParams.get("dept");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewTab, setViewTab] = useState<"KANBAN" | "EMPLOYEE_VIEW" | "DEPT_OVERVIEW">("KANBAN");
  const [activeNavTab, setActiveNavTab] = useState<string>("KANBAN_PROJECT");
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [lists, setLists] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Keyboard shortcut Ctrl+K to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const roleLevel = currentUser?.roleLevel ?? 3;
  const isExec = roleLevel <= 2;
  const isTP = roleLevel <= 3;
  const isAccessDenied = false;

  useEffect(() => {
    if (isExec && !deptParam) {
      setViewTab("DEPT_OVERVIEW");
    }
  }, [isExec, deptParam]);

  const userDeptCode = (currentUser?.departmentCode || currentUser?.department || "").toUpperCase();
  const activeDepartment = deptParam || (isTP && !isExec ? userDeptCode || "IT_DIGITAL" : "IT_DIGITAL");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterColor, setFilterColor] = useState<string>("ALL");

  // Drag and drop states
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);

  // Form State for New Card Modal
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [cardTitle, setCardTitle] = useState("");
  const [cardDesc, setCardDesc] = useState("");
  const [cardAssignee, setCardAssignee] = useState("");
  const [cardDeadline, setCardDeadline] = useState("");

  // Form State for New Board Modal
  const [isAddBoardModalOpen, setIsAddBoardModalOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardType, setBoardType] = useState("personal");

  // Project list state
  const [projects, setProjects] = useState([
    {
      id: "PRJ-AUTOMATION",
      name: "Dự Án Tự Động Hóa Dây Chuyền & CĐS IT",
      dept: "Phòng IT & Chuyển Đổi Số",
      tag: "AUTOMATION & AI",
      tagBg: "bg-purple-100 text-purple-700 border-purple-200",
      progress: 83,
      tasksCount: 3,
      iconType: "automation",
      borderLeft: "border-l-purple-500",
      color: "hover:border-purple-400 hover:shadow-purple-50",
    },
    {
      id: "PRJ-SKECHERS-RETAIL",
      name: "Dự Án Vận Hành Chuỗi Skechers HQ & Store",
      dept: "Phối Hợp Chuỗi Skechers",
      tag: "SKECHERS RETAIL",
      tagBg: "bg-emerald-100 text-[#006838] border-emerald-200",
      progress: 75,
      tasksCount: 2,
      iconType: "retail",
      borderLeft: "border-l-emerald-500",
      color: "hover:border-emerald-400 hover:shadow-emerald-50",
    },
    {
      id: "PRJ-ADMIN-EXPENSE",
      name: "Dự Án Số Hóa Hành Chính & Đăng Ký Xe",
      dept: "Phòng Hành Chính Nhân Sự",
      tag: "HÀNH CHÍNH & ISO",
      tagBg: "bg-amber-100 text-amber-800 border-amber-200",
      progress: 60,
      tasksCount: 2,
      iconType: "admin",
      borderLeft: "border-l-amber-500",
      color: "hover:border-amber-400 hover:shadow-amber-50",
    },
    {
      id: "PRJ-KAIZEN-152",
      name: "Dự Án Sáng Kiến Cải Tiến Kaizen & 1-5-2",
      dept: "Ban 2.2 / CI-152",
      tag: "KAIZEN 1-5-2",
      tagBg: "bg-blue-100 text-blue-800 border-blue-200",
      progress: 80,
      tasksCount: 3,
      iconType: "kaizen",
      borderLeft: "border-l-blue-500",
      color: "hover:border-blue-400 hover:shadow-blue-50",
    },
    {
      id: "PRJ-GEMBA-SAFETY",
      name: "Dự Án An Toàn Lao Động & Kiểm Soát Gemba",
      dept: "Ban An Toàn & QC",
      tag: "GEMBA SAFETY",
      tagBg: "bg-rose-100 text-rose-800 border-rose-200",
      progress: 50,
      tasksCount: 2,
      iconType: "safety",
      borderLeft: "border-l-rose-500",
      color: "hover:border-rose-400 hover:shadow-rose-50",
    },
  ]);

  // Add Project Modal state
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [newPrjName, setNewPrjName] = useState("");
  const [newPrjDept, setNewPrjDept] = useState("");
  const [newPrjTag, setNewPrjTag] = useState("");
  const [newPrjColor, setNewPrjColor] = useState("green");

  const PROJECT_COLOR_MAP: Record<string, { tagBg: string; borderLeft: string; border: string }> = {
    green: {
      tagBg: "bg-emerald-100 text-[#006838] border-emerald-200",
      borderLeft: "border-l-emerald-500",
      border: "hover:border-emerald-400 hover:shadow-emerald-50",
    },
    blue: {
      tagBg: "bg-blue-100 text-blue-800 border-blue-200",
      borderLeft: "border-l-blue-500",
      border: "hover:border-blue-400 hover:shadow-blue-50",
    },
    purple: {
      tagBg: "bg-purple-100 text-purple-700 border-purple-200",
      borderLeft: "border-l-purple-500",
      border: "hover:border-purple-400 hover:shadow-purple-50",
    },
    amber: {
      tagBg: "bg-amber-100 text-amber-800 border-amber-200",
      borderLeft: "border-l-amber-500",
      border: "hover:border-amber-400 hover:shadow-amber-50",
    },
    rose: {
      tagBg: "bg-rose-100 text-rose-800 border-rose-200",
      borderLeft: "border-l-rose-500",
      border: "hover:border-rose-400 hover:shadow-rose-50",
    },
  };

  const handleAddProject = () => {
    if (!newPrjName.trim() || !newPrjTag.trim()) {
      showToast("⚠️ Vui lòng nhập đủ Tên dự án và Nhãn phân loại!");
      return;
    }
    const colorCfg = PROJECT_COLOR_MAP[newPrjColor] || PROJECT_COLOR_MAP.green;
    const slug = newPrjTag.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "");
    const newId = `PRJ-${slug}-${Date.now().toString(36).toUpperCase()}`;
    setProjects((prev) => [
      ...prev,
      {
        id: newId,
        name: newPrjName.trim(),
        dept: newPrjDept.trim() || "Văn Phòng Chuỗi SKECHERS",
        tag: newPrjTag.trim().toUpperCase(),
        tagBg: colorCfg.tagBg,
        progress: 0,
        tasksCount: 0,
        iconType: "automation",
        borderLeft: colorCfg.borderLeft,
        color: colorCfg.border,
      },
    ]);
    setNewPrjName("");
    setNewPrjDept("");
    setNewPrjTag("");
    setNewPrjColor("green");
    setIsAddProjectModalOpen(false);
    showToast(`✨ Dự án "${newPrjName.trim()}" đã được thêm thành công!`);
  };

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingCard, setReviewingCard] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (isExec && deptParam) {
      const isValid = DEFAULT_DEPARTMENTS.some((d) => d.id.toUpperCase() === deptParam.toUpperCase());
      if (!isValid) {
        showToast(`⚠️ Không tìm thấy thông tin phòng ban [${deptParam}]. Đã quay về danh sách.`);
        router.push("/work/tasks");
      }
    }
  }, [isExec, deptParam, router]);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const url = deptParam ? `/api/task-boards?department_id=${encodeURIComponent(deptParam)}` : "/api/task-boards";
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        setIsUnauthenticated(true);
        return;
      }
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setBoards(json.data);
          if (!selectedBoardId || !json.data.some((b: any) => b.id === selectedBoardId)) {
            setSelectedBoardId(json.data[0].id);
          }
        } else {
          setBoards([]);
          setSelectedBoardId("");
        }
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const fetchCards = async (boardId: string) => {
    if (!boardId) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch(`/api/task-cards?board_id=${boardId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const json = await res.json();
        if (json.success) {
          setLists(json.lists || []);
          setCards(json.cards || []);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchBoards();
  }, [deptParam]);

  useEffect(() => {
    if (selectedBoardId) {
      fetchCards(selectedBoardId);
    }
  }, [selectedBoardId]);

  const handleCreateBoard = async () => {
    if (!boardName.trim()) {
      showToast("⚠️ Vui lòng nhập tên bảng công việc");
      return;
    }
    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/task-boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: boardName.trim(), type: boardType }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✅ Đã tạo Bảng Công Việc mới thành công!");
        setIsAddBoardModalOpen(false);
        setBoardName("");
        await fetchBoards();
        if (json.id) setSelectedBoardId(json.id);
      } else {
        showToast(`❌ ${json.error || "Lỗi khi tạo bảng"}`);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCard = async () => {
    if (!cardTitle.trim()) {
      showToast("⚠️ Vui lòng nhập tiêu đề công việc");
      return;
    }
    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/task-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          board_id: selectedBoardId,
          list_id: selectedListId,
          title: cardTitle.trim(),
          description: cardDesc,
          assignee_id: cardAssignee.trim() || null,
          deadline: cardDeadline || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✅ Đã tạo thẻ công việc mới thành công!");
        setIsAddCardModalOpen(false);
        setCardTitle("");
        setCardDesc("");
        fetchCards(selectedBoardId);
      } else {
        showToast(`❌ ${json.error || "Lỗi khi tạo thẻ"}`);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async (cardId: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch(`/api/task-cards/${cardId}/complete`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        showToast("🎉 " + json.message);
        fetchCards(selectedBoardId);
      } else {
        showToast(`❌ ${json.error || "Lỗi khi cập nhật"}`);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    }
  };

  const handleMoveCardList = async (cardId: string, newListId: string) => {
    const prevCards = [...cards];
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, list_id: newListId } : c)));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/task-cards", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: cardId, list_id: newListId }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("↔️ Đã chuyển thẻ công việc sang danh sách mới");
      } else {
        setCards(prevCards);
      }
    } catch (e) {
      setCards(prevCards);
    }
  };

  const handleManagerReviewSubmit = async () => {
    if (!reviewingCard) return;
    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch(`/api/task-cards/${reviewingCard.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("⭐ " + json.message);
        setIsReviewModalOpen(false);
        fetchCards(selectedBoardId);
      } else {
        showToast(`❌ ${json.error || "Lỗi khi nghiệm thu"}`);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  // Analytics Computation
  const totalCardsCount = cards.length;
  const redCardsCount = cards.filter((c) => c.color_state === "red").length;
  const yellowCardsCount = cards.filter((c) => c.color_state === "yellow").length;
  const greenCardsCount = cards.filter((c) => c.color_state === "green" || !c.color_state).length;
  const doneCardsCount = cards.filter((c) => c.status === "done" || c.status === "DONE").length;
  const doingCardsCount = cards.filter((c) => c.status === "in_progress" || c.status === "DOING").length;

  // Filtered Cards Logic
  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.assignee_id && c.assignee_id.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesColor = true;
    if (filterColor === "red") matchesColor = c.color_state === "red";
    else if (filterColor === "yellow") matchesColor = c.color_state === "yellow";
    else if (filterColor === "doing") matchesColor = c.status === "in_progress" || c.status === "DOING";
    else if (filterColor === "done") matchesColor = c.status === "done" || c.status === "DONE";

    return matchesSearch && matchesColor;
  });

  if (isUnauthenticated) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-md text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <IconAlertCircle size={36} />
        </div>
        <h2 className="text-xl font-black text-slate-900">Yêu Cầu Đăng Nhập Hệ Thống</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Phân hệ Task Board Kanban yêu cầu xác thực tài khoản cá nhân để làm việc với các thẻ công việc.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#006838] hover:bg-[#004d29] text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <span>Đăng nhập ngay</span>
        </Link>
      </div>
    );
  }

  if (isAccessDenied) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-2xs">
          <IconShieldCheck size={36} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Không Có Quyền Truy Cập</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Màn hình Bảng Quản Lý Công Việc &amp; Tiến Độ Phòng Ban chỉ dành cho Trưởng Phòng trở lên và Ban Quản Trị. Vui lòng liên hệ quản trị viên nếu cần cấp quyền.
        </p>
        <Link
          href="/work"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#006838] hover:bg-[#004d29] text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <IconArrowLeft size={16} />
          <span>Quay lại Trang Chủ Work Hub</span>
        </Link>
      </div>
    );
  }



  const renderSidebarContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full">
      {/* Top Logo Section */}
      <div className="p-4 border-b border-slate-200/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* TBS Group Logo */}
          <img
            src="/images/tbs-logo.png"
            alt="TBS Group Logo"
            className="h-7 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <div className="h-5 w-px bg-slate-300"></div>
          {/* Skechers Logo */}
          <img
            src="/images/skechers-logo.png"
            alt="Skechers Logo"
            className="h-5 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
        {isMobile && (
          <button
            onClick={() => setIsSidebarMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <IconX size={18} />
          </button>
        )}
      </div>

      {/* Navigation Items Scroll Area */}
      <div className="p-3 space-y-6 flex-1 overflow-y-auto scrollbar-thin">
        {/* WORK BOARD Group */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            WORK BOARD
          </span>

          <button
            onClick={() => {
              setViewTab("KANBAN");
              setActiveNavTab("KANBAN_PROJECT");
              if (isMobile) setIsSidebarMobileOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              viewTab === "KANBAN"
                ? "bg-[#006838] text-white shadow-xs font-black"
                : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <IconChecklist size={17} className={viewTab === "KANBAN" ? "text-white" : "text-slate-500"} />
            <span>Bảng Công Việc</span>
          </button>

          <Link
            href="/work/projects"
            onClick={() => isMobile && setIsSidebarMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition"
          >
            <IconFolder size={17} className="text-slate-500" />
            <span>Dự Án</span>
          </Link>

          <button
            onClick={() => {
              setViewTab("EMPLOYEE_VIEW");
              setActiveNavTab("EMPLOYEE");
              if (isMobile) setIsSidebarMobileOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              viewTab === "EMPLOYEE_VIEW"
                ? "bg-[#006838] text-white shadow-xs font-black"
                : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <IconUsers size={17} className={viewTab === "EMPLOYEE_VIEW" ? "text-white" : "text-slate-500"} />
            <span>Nhân Viên Phòng Ban</span>
          </button>

          <button
            onClick={() => {
              setViewTab("DEPT_OVERVIEW");
              setActiveNavTab("DEPT_OVERVIEW");
              if (isMobile) setIsSidebarMobileOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              viewTab === "DEPT_OVERVIEW"
                ? "bg-[#006838] text-white shadow-xs font-black"
                : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <IconChartPie size={17} className={viewTab === "DEPT_OVERVIEW" ? "text-white" : "text-slate-500"} />
            <span>Tổng Quan</span>
          </button>

          <Link
            href="/work/reports"
            onClick={() => isMobile && setIsSidebarMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition"
          >
            <IconReport size={17} className="text-slate-500" />
            <span>Báo Cáo</span>
          </Link>

          <Link
            href="/work/kaizen"
            onClick={() => isMobile && setIsSidebarMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition"
          >
            <IconSparkles size={17} className="text-amber-500" />
            <span>Sáng Kiến Kaizen</span>
          </Link>

          <Link
            href="/work/gei"
            onClick={() => isMobile && setIsSidebarMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition"
          >
            <IconShieldCheck size={17} className="text-blue-500" />
            <span>Kiểm Soát GEI</span>
          </Link>
        </div>

        {/* LIÊN KẾT NHANH Group */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            LIÊN KẾT NHANH
          </span>

          <button
            type="button"
            onClick={() => {
              setIsAddProjectModalOpen(true);
              if (isMobile) setIsSidebarMobileOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition text-left"
          >
            <IconPlus size={16} className="text-emerald-600" />
            <span>Tạo Dự Án</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (lists.length > 0) setSelectedListId(lists[0].id);
              setIsAddCardModalOpen(true);
              if (isMobile) setIsSidebarMobileOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition text-left"
          >
            <IconPlus size={16} className="text-[#006838]" />
            <span>Tạo Công Việc</span>
          </button>

          <button
            type="button"
            onClick={() => {
              showToast("📊 Chức năng xuất báo cáo Excel đang sẵn sàng ở thanh công cụ!");
              if (isMobile) setIsSidebarMobileOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition text-left"
          >
            <IconDownload size={16} className="text-slate-500" />
            <span>Xuất Báo Cáo</span>
          </button>

          <Link
            href="/work/help"
            onClick={() => isMobile && setIsSidebarMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition"
          >
            <IconFileText size={16} className="text-slate-500" />
            <span>Hướng Dẫn Sử Dụng</span>
          </Link>
        </div>
      </div>

      {/* Bottom Card: Plant image with Slogan */}
      <div className="p-3">
        <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-900 shadow-md group">
          <img
            src="/images/tbs-factory-plant.png"
            alt="People Process Sustainability"
            className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/tbs-gate.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent"></div>
          <div className="absolute bottom-2.5 right-2.5 text-right space-y-0.5 pointer-events-none">
            <span className="block text-[9px] font-black uppercase text-slate-300 tracking-widest drop-shadow-md">
              PEOPLE
            </span>
            <span className="block text-[9px] font-black uppercase text-emerald-400 tracking-widest drop-shadow-md">
              PROCESS
            </span>
            <span className="block text-[9px] font-black uppercase text-slate-100 tracking-widest drop-shadow-md">
              SUSTAINABILITY
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#F4F6F5] text-slate-800 flex font-sans antialiased overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Render Sidebar Content Helper */}
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarMobileOpen && (
        <div
          onClick={() => setIsSidebarMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        ></div>
      )}

      {/* 1A. DESKTOP PERMANENT SIDEBAR (Width: 240px, Fixed/Pinned Flex) */}
      <aside className="hidden lg:flex flex-col justify-between w-60 shrink-0 bg-[#F8FAF9] border-r border-slate-200/80 h-full z-20 overflow-hidden">
        {renderSidebarContent(false)}
      </aside>

      {/* 1B. MOBILE DRAWER SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#F8FAF9] border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 lg:hidden ${
          isSidebarMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* 2. MAIN CONTENT AREA (Independent Vertical Scroll) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar (Fixed / Shrink-0) */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarMobileOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              <IconMenu2 size={20} />
            </button>

            <Link
              href="/work"
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#006838] text-[#006838] hover:text-white border border-emerald-200 text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs group cursor-pointer"
              title="Quay lại Trang Chủ Work Hub"
            >
              <IconArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Quay lại Trang Chủ</span>
            </Link>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block leading-tight">
                TBS WORK BOARD HUB
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:block">
                Quản lý Bảng Công Việc &amp; Tiến Độ Phòng Ban
              </span>
            </div>
          </div>

          {/* Search bar with Ctrl+K shortcut badge */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                id="main-header-search"
                type="text"
                placeholder="Tìm kiếm dự án, công việc, thành viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-16 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#006838] focus:bg-white transition"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <span className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-500 rounded text-[10px] font-mono font-bold shadow-2xs">
                  Ctrl K
                </span>
              </div>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-full transition"
              title="Thông báo"
            >
              <IconBell size={18} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            <button
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-full transition hidden sm:block"
              title="Lưới ứng dụng"
            >
              <IconGridDots size={18} />
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Dynamic User Profile Lockup */}
            <div className="flex items-center gap-2.5">
              <UserAvatar name={currentUser?.name || currentUser?.fullName || "Phạm Nguyễn Anh Huy"} size="md" />
              <div className="hidden xl:block text-left">
                <div className="text-xs font-black text-slate-900 leading-tight">
                  {currentUser?.name || currentUser?.fullName || "Phạm Nguyễn Anh Huy"}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {currentUser?.roleName || currentUser?.position || "NV - Lập trình"}
                </div>
              </div>
              <IconChevronDown size={14} className="text-slate-400 hidden xl:block" />
            </div>
          </div>
        </header>

        {/* Page Main Scroll Area */}
        <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* 3. HERO TITLE SECTION */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 z-10 max-w-2xl">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Bảng Công Việc &amp; Tiến Độ Phòng Ban
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Theo dõi, phân bổ và kiểm soát tiến độ công việc – dự án
              </p>
            </div>

            {/* Right side banner background overlay & 3-line slogan */}
            <div className="relative md:absolute right-0 top-0 bottom-0 w-full md:w-1/2 flex items-center justify-end p-6 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10 hidden md:block"></div>
              <img
                src="/images/tbs-gate.jpg"
                alt="Skechers TBS Building"
                className="absolute inset-0 w-full h-full object-cover object-right opacity-25 md:opacity-30 rounded-2xl md:rounded-none"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="relative z-20 text-right space-y-0.5">
                <span className="block text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider drop-shadow-xs">
                  LÀM ĐÚNG
                </span>
                <span className="block text-xs sm:text-sm font-black text-[#006838] uppercase tracking-wider drop-shadow-xs">
                  LÀM ĐỦ
                </span>
                <span className="block text-xs sm:text-sm font-black text-emerald-600 uppercase tracking-wider drop-shadow-xs">
                  LÀM TỐT HƠN MỖI NGÀY
                </span>
              </div>
            </div>
          </div>

          {/* 4. UNDERLINE NAVIGATION TABS */}
          <div className="border-b border-slate-200 flex items-center gap-6 overflow-x-auto scrollbar-none text-xs font-bold pt-1">
            <button
              onClick={() => {
                setViewTab("KANBAN");
                setActiveNavTab("KANBAN_PROJECT");
              }}
              className={`pb-3 transition flex items-center gap-1.5 shrink-0 cursor-pointer border-b-2 ${
                viewTab === "KANBAN" && activeNavTab === "KANBAN_PROJECT"
                  ? "border-[#006838] text-[#006838] font-black"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <IconChecklist size={16} className={viewTab === "KANBAN" ? "text-[#006838]" : "text-slate-400"} />
              <span>Bảng Kanban Project</span>
            </button>

            <button
              onClick={() => {
                setViewTab("EMPLOYEE_VIEW");
                setActiveNavTab("EMPLOYEE");
              }}
              className={`pb-3 transition flex items-center gap-1.5 shrink-0 cursor-pointer border-b-2 ${
                viewTab === "EMPLOYEE_VIEW"
                  ? "border-[#006838] text-[#006838] font-black"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Theo Nhân Viên Phòng Ban</span>
            </button>

            <button
              onClick={() => {
                setViewTab("DEPT_OVERVIEW");
                setActiveNavTab("DEPT_OVERVIEW");
              }}
              className={`pb-3 transition flex items-center gap-1.5 shrink-0 cursor-pointer border-b-2 ${
                viewTab === "DEPT_OVERVIEW"
                  ? "border-[#006838] text-[#006838] font-black"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Overview Các Phòng Ban</span>
            </button>

            <Link
              href="/work/projects"
              className="pb-3 text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 shrink-0 border-b-2 border-transparent"
            >
              <span>Dự Án Liên Phòng Ban</span>
            </Link>

            <div className="flex items-center gap-1 pb-3 shrink-0 text-slate-600 hover:text-slate-900 cursor-pointer">
              <Link href="/work/kaizen" className="flex items-center gap-1">
                <span className="text-slate-400 hover:text-slate-600 font-normal">×</span>
                <span>Sáng Kiến Kaizen &amp; 1-5-2</span>
              </Link>
            </div>

            <div className="flex items-center gap-1 pb-3 shrink-0 text-slate-600 hover:text-slate-900 cursor-pointer">
              <Link href="/work/gei" className="flex items-center gap-1">
                <span className="text-slate-400 hover:text-slate-600 font-normal">×</span>
                <span>Kiểm Soát GEI</span>
              </Link>
            </div>
          </div>

          {/* Conditional Rendering for Department Overview View */}
          {viewTab === "DEPT_OVERVIEW" ? (
            <DepartmentOverviewGrid
              onSelectDepartment={(deptId) => {
                router.push(`/work/tasks?dept=${encodeURIComponent(deptId)}`);
                setViewTab("KANBAN");
              }}
            />
          ) : (
            <>
              {/* 5. 5 KPI CARDS SUMMARY */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* Total Cards */}
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006838] flex items-center justify-center shrink-0">
                    <IconFolder size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      TỔNG THẺ CÔNG VIỆC
                    </span>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{totalCardsCount}</div>
                  </div>
                </div>

                {/* Overdue Deadline */}
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <IconAlarm size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider block">
                      QUÁ HẠN DEADLINE
                    </span>
                    <div className="text-xl font-black text-rose-900 mt-0.5">{redCardsCount}</div>
                  </div>
                </div>

                {/* Upcoming (24h) */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <IconClock size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
                      SẮP ĐẾN HẠN (24H)
                    </span>
                    <div className="text-xl font-black text-amber-900 mt-0.5">{yellowCardsCount}</div>
                  </div>
                </div>

                {/* On-Time Progress */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <IconRefresh size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block">
                      TRONG HẠN ĐÚNG TIẾN ĐỘ
                    </span>
                    <div className="text-xl font-black text-blue-900 mt-0.5">{greenCardsCount}</div>
                  </div>
                </div>

                {/* Completed */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006838] flex items-center justify-center shrink-0">
                    <IconCircleCheck size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#006838] tracking-wider block">
                      ĐÃ HOÀN THÀNH
                    </span>
                    <div className="text-xl font-black text-[#006838] mt-0.5">{doneCardsCount}</div>
                  </div>
                </div>
              </div>

              {/* Conditional View Tabs Content */}
              {viewTab === "EMPLOYEE_VIEW" ? (
                /* EMPLOYEE WORKLOAD & PERFORMANCE VIEW */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#006838] to-emerald-800 text-white border border-emerald-700 shadow-sm flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black flex items-center gap-2">
                        <IconUsers size={22} className="text-emerald-200" />
                        <span>Theo Dõi Khối Lượng Công Việc &amp; KPI Nhân Sự Phòng Ban</span>
                      </h2>
                      <p className="text-xs text-emerald-100 font-medium">
                        Phạm vi: {deptParam || activeDepartment} • Trưởng Phòng &amp; Ban Quản Trị giám sát tiến độ công việc từng nhân viên
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewTab("KANBAN")}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer"
                    >
                      ← Bảng Kanban
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {STAFF_MEMBERS.map((staff) => {
                      const staffCards = cards.filter(
                        (c) =>
                          c.assignee_id === staff.empCode ||
                          c.assignee_id === staff.name ||
                          (c.assignee_name && c.assignee_name.toLowerCase().includes(staff.name.toLowerCase()))
                      );
                      const total = staffCards.length;
                      const done = staffCards.filter((c) => c.status === "done" || c.status === "DONE").length;
                      const doing = staffCards.filter((c) => c.status === "in_progress" || c.status === "DOING").length;
                      const review = staffCards.filter((c) => c.status === "pending_review" || c.status === "REVIEW").length;
                      const help = staffCards.filter((c) => c.status === "need_help" || c.status === "NEED_HELP").length;
                      const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

                      return (
                        <div
                          key={staff.empCode}
                          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar name={staff.name} size="md" />
                                <div>
                                  <h3 className="font-extrabold text-slate-900 text-sm">{staff.name}</h3>
                                  <span className="text-[10px] text-slate-500 font-mono font-bold block">
                                    MSNV: {staff.empCode} • {staff.position}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1 pt-1">
                              <div className="flex items-center justify-between text-xs font-extrabold">
                                <span className="text-slate-500">Tiến Độ Hoàn Thành</span>
                                <span className="text-[#006838] font-mono">
                                  {progressPct}% ({done}/{total})
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-emerald-500 to-[#006838] h-full transition-all duration-500 rounded-full"
                                  style={{ width: `${progressPct}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-1 text-[10px] font-black pt-1">
                              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-900 text-center border border-amber-200">
                                Đang làm: {doing}
                              </div>
                              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-900 text-center border border-blue-200">
                                Chờ duyệt: {review}
                              </div>
                              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-900 text-center border border-emerald-200">
                                Xong: {done}
                              </div>
                              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-900 text-center border border-rose-200">
                                Cần giúp: {help}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                              Danh Sách Nhiệm Vụ ({total})
                            </span>
                            {staffCards.length > 0 ? (
                              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                {staffCards.map((c) => (
                                  <div
                                    key={c.id}
                                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs flex items-center justify-between transition"
                                  >
                                    <span className="font-bold text-slate-800 truncate max-w-[170px]" title={c.title}>
                                      {c.title}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                        c.status === "done" || c.status === "DONE"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : c.status === "pending_review" || c.status === "REVIEW"
                                          ? "bg-indigo-100 text-indigo-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {c.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic block py-1">
                                Chưa được giao thẻ công việc
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* KANBAN MAIN VIEW */
                <>
                  {/* 6. PROJECT BOARDS GRID (Phân Loại Công Việc Theo Dự Án) */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#006838] flex items-center justify-center shrink-0">
                          <IconStar size={18} />
                        </div>
                        <div>
                          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                            Phân Loại Công Việc Theo Dự Án (Project Boards)
                          </h2>
                          <p className="text-xs text-slate-500 font-medium">
                            Bấm vào từng Dự Án để mở ngay Bảng Kanban Công Việc Cá Nhân/Dự Án riêng biệt
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400">{projects.length} Dự Án Đang Vận Hành</span>
                        {isTP && (
                          <button
                            type="button"
                            onClick={() => setIsAddProjectModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006838] text-white text-xs font-black hover:bg-emerald-800 transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            <IconPlus size={14} />
                            <span>Thêm Dự Án</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.map((prj) => (
                        <Link
                          key={prj.id}
                          href={`/work?dept=my-tasks&project=${prj.id}&name=${encodeURIComponent(prj.name)}`}
                          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-all duration-150 group cursor-pointer flex flex-col justify-between h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006838]"
                        >
                          <div className="space-y-3">
                            {/* Top Row: Icon + Title & Code */}
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 group-hover:text-[#006838] transition-colors">
                                <IconFolder size={18} stroke={1.75} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3
                                  className="text-[15px] font-semibold text-slate-900 truncate group-hover:text-[#006838] transition-colors"
                                  title={prj.name}
                                >
                                  {prj.name}
                                </h3>
                                <span className="text-[12px] font-mono text-slate-500 block mt-0.5">
                                  {prj.id.toLowerCase()}
                                </span>
                              </div>
                            </div>

                            {/* Department Row */}
                            <div className="flex items-center justify-between text-[12px] pt-3 border-t border-slate-100">
                              <span className="text-slate-500">Đơn vị quản lý</span>
                              <span className="text-[13px] font-medium text-slate-800 truncate">
                                {prj.dept}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between text-[12px]">
                                <span className="text-slate-500">Tiến độ tổng thể</span>
                                <span className={`text-[13px] font-medium ${prj.progress === 100 ? "text-[#006838]" : "text-[#006838]"}`}>
                                  {prj.progress}%
                                </span>
                              </div>
                              <div
                                className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"
                                role="progressbar"
                                aria-valuenow={prj.progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <div
                                  className="h-full bg-[#006838] rounded-full transition-all duration-300"
                                  style={{ width: `${prj.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Card Action Footer */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[13px]">
                            <span className="text-slate-500 font-medium">
                              {prj.tasksCount} thẻ công việc active
                            </span>
                            <span className="text-[#006838] font-semibold group-hover:underline flex items-center gap-1 shrink-0">
                              Mở bảng Kanban <IconChevronRight size={14} stroke={1.75} />
                            </span>
                          </div>
                        </Link>
                      ))}

                      {/* Add New Project Card */}
                      {isTP && (
                        <button
                          type="button"
                          onClick={() => setIsAddProjectModalOpen(true)}
                          className="p-5 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#006838] bg-white hover:bg-emerald-50/20 transition-all duration-150 group flex flex-col items-center justify-center gap-2 min-h-[200px] cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#006838] border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <IconPlus size={18} />
                          </div>
                          <div className="text-center">
                            <div className="text-[14px] font-semibold text-slate-800 group-hover:text-[#006838]">
                              Thêm dự án mới
                            </div>
                            <div className="text-[12px] text-slate-500 mt-0.5">Tạo dự án mới để quản lý công việc</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 7. FILTER BAR & ACTIONS */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                      {/* Wide Search Box */}
                      <div className="relative flex-1 min-w-[240px]">
                        <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm thẻ công việc theo tên, mã, người phụ trách..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#006838] focus:bg-white transition"
                        />
                      </div>

                      {/* Status Filter Chips */}
                      <div className="flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none text-xs font-bold py-0.5">
                        <button
                          type="button"
                          onClick={() => setFilterColor("ALL")}
                          className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                            filterColor === "ALL"
                              ? "bg-[#006838] text-white shadow-xs font-black"
                              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                          }`}
                        >
                          Tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterColor("red")}
                          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                            filterColor === "red"
                              ? "bg-rose-600 text-white shadow-xs font-black"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                          <span>Quá hạn ({redCardsCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterColor("yellow")}
                          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                            filterColor === "yellow"
                              ? "bg-amber-500 text-white shadow-xs font-black"
                              : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                          <span>Sắp hạn ({yellowCardsCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterColor("doing")}
                          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                            filterColor === "doing"
                              ? "bg-blue-600 text-white shadow-xs font-black"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                          <span>Đang thực hiện ({doingCardsCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterColor("done")}
                          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                            filterColor === "done"
                              ? "bg-[#006838] text-white shadow-xs font-black"
                              : "bg-emerald-50 text-[#006838] hover:bg-emerald-100 border border-emerald-200/60"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <span>Đã hoàn thành ({doneCardsCount})</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Board Selector & Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {boards.length > 0 && (
                        <select
                          value={selectedBoardId}
                          onChange={(e) => setSelectedBoardId(e.target.value)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#006838]"
                        >
                          {boards.map((b) => (
                            <option key={b.id} value={b.id}>
                              📌 {b.name} ({b.type})
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsAddBoardModalOpen(true)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition border border-slate-200 cursor-pointer"
                      >
                        <IconPlus size={15} /> <span>Tạo Board</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast("📊 Bắt đầu tải file Excel danh sách thẻ công việc...")}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition border border-slate-200 cursor-pointer"
                      >
                        <IconDownload size={15} /> <span>Xuất Excel</span>
                      </button>
                    </div>
                  </div>

                  {/* 8. KANBAN BOARD (TO DO / DOING / REVIEW / DONE) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    {lists.map((list) => {
                      const listCards = filteredCards.filter((c) => c.list_id === list.id);

                      return (
                        <div
                          key={list.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverListId !== list.id) setDragOverListId(list.id);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            if (dragOverListId === list.id) setDragOverListId(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const cardId = e.dataTransfer.getData("text/plain") || draggedCardId;
                            if (cardId) {
                              const card = cards.find((c) => c.id === cardId);
                              if (card && card.list_id !== list.id) {
                                handleMoveCardList(card.id, list.id);
                              }
                            }
                            setDragOverListId(null);
                            setDraggedCardId(null);
                          }}
                          className={`p-3.5 rounded-2xl border transition-all duration-150 space-y-3 min-h-[450px] ${
                            dragOverListId === list.id
                              ? "bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/30 shadow-md"
                              : "bg-[#EFEFEF]/70 border-slate-200/80"
                          }`}
                        >
                          {/* Column Header */}
                          <div className="flex items-center justify-between px-1">
                            <h3 className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
                              <span>{list.name}</span>
                              <span className="w-5 h-5 rounded-full bg-slate-300/80 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                {listCards.length}
                              </span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedListId(list.id);
                                setIsAddCardModalOpen(true);
                              }}
                              className="p-1 hover:bg-slate-300/60 text-slate-600 rounded-lg transition cursor-pointer"
                              title="Thêm thẻ vào cột này"
                            >
                              <IconPlus size={16} />
                            </button>
                          </div>

                          {/* Cards List */}
                          <div className="space-y-3">
                            {listCards.map((card) => {
                              const borderPriorityColor =
                                card.color_state === "red"
                                  ? "border-l-rose-500"
                                  : card.color_state === "yellow"
                                  ? "border-l-amber-500"
                                  : "border-l-emerald-500";

                              return (
                                <div
                                  key={card.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", card.id);
                                    e.dataTransfer.effectAllowed = "move";
                                    setDraggedCardId(card.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedCardId(null);
                                    setDragOverListId(null);
                                  }}
                                  className={`bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-2 group cursor-grab active:cursor-grabbing select-none border-l-4 ${borderPriorityColor} ${
                                    draggedCardId === card.id ? "opacity-40 border-dashed border-blue-500 scale-95" : ""
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-extrabold text-slate-900 text-xs line-clamp-2 leading-snug">
                                      {card.title}
                                    </h4>
                                    <IconChevronRight size={15} className="text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                  </div>

                                  {card.description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                      {card.description}
                                    </p>
                                  )}

                                  {/* Code & Tag Chips */}
                                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[9px] uppercase tracking-wider">
                                      PRJ-AUTOMATION
                                    </span>
                                    {card.color_state === "red" && (
                                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[9px]">
                                        Cao
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                                    {card.deadline ? (
                                      <span className="flex items-center gap-1 font-mono">
                                        <IconCalendar size={12} className="text-slate-400" />
                                        {card.deadline.substring(0, 10)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">Không deadline</span>
                                    )}

                                    {card.assignee_id && (
                                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                                        👤 {card.assignee_id}
                                      </span>
                                    )}
                                  </div>

                                  {/* Actions based on card status */}
                                  <div className="pt-1.5 flex items-center justify-between">
                                    {card.status === "in_progress" && (
                                      <button
                                        type="button"
                                        onClick={() => handleMarkComplete(card.id)}
                                        className="w-full py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                                      >
                                        <IconCheck size={13} /> Hoàn Thành
                                      </button>
                                    )}

                                    {card.status === "pending_review" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReviewingCard(card);
                                          setReviewRating(5);
                                          setReviewComment("");
                                          setIsReviewModalOpen(true);
                                        }}
                                        className="w-full py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        ⏳ Chờ Nghiệm Thu
                                      </button>
                                    )}

                                    {(card.status === "need_help" || card.status === "NEED_HELP") && (
                                      <div className="w-full py-1 px-2 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded-lg text-[10px] flex items-center justify-between animate-pulse">
                                        <span>🚨 Cần Trợ Giúp</span>
                                        <span className="text-rose-600 font-black">Báo TP</span>
                                      </div>
                                    )}

                                    {(card.status === "done" || card.status === "DONE") && (
                                      <div className="w-full py-1 px-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-black rounded-lg text-[10px] flex items-center justify-between">
                                        <span>✅ Đã Hoàn Thành</span>
                                        <span className="text-amber-600 font-bold">Done</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Empty Column State */}
                            {listCards.length === 0 && (
                              <div className="p-8 text-center border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-400">
                                <IconFileText size={24} className="text-slate-300" />
                                <span className="text-xs font-medium italic">Không có thẻ công việc</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Add Board Modal */}
      {isAddBoardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Tạo Bảng Công Việc Mới</h2>
              <button
                onClick={() => setIsAddBoardModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Bảng Công Việc:</label>
                <input
                  type="text"
                  placeholder="VD: Board Sản Xuất Chuyền May 5..."
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:border-[#006838]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phạm Vi (Type):</label>
                <select
                  value={boardType}
                  onChange={(e) => setBoardType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-[#006838]"
                >
                  <option value="personal">Personal (Bảng cá nhân)</option>
                  <option value="department">Department (Bảng phòng ban)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddBoardModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                disabled={submitting}
                onClick={handleCreateBoard}
                className="px-4 py-2 bg-[#006838] hover:bg-[#004d29] text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                {submitting ? "Đang tạo..." : "Tạo Bảng Mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add Project Modal */}
      {isAddProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Thêm Dự Án Mới</h2>
              <button
                onClick={() => setIsAddProjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Dự Án (Bắt buộc):</label>
                <input
                  type="text"
                  placeholder="VD: Dự Án Tự Động Hóa Chuyền..."
                  value={newPrjName}
                  onChange={(e) => setNewPrjName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:border-[#006838]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nhãn Phân Loại (Tag):</label>
                <input
                  type="text"
                  placeholder="VD: AUTOMATION & AI"
                  value={newPrjTag}
                  onChange={(e) => setNewPrjTag(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phòng Phụ Trách:</label>
                <input
                  type="text"
                  placeholder="VD: Phòng IT & Chuyển Đổi Số"
                  value={newPrjDept}
                  onChange={(e) => setNewPrjDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Màu Chủ Đạo Dự Án:</label>
                <select
                  value={newPrjColor}
                  onChange={(e) => setNewPrjColor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="green">Xanh Lá (Skechers Retail / Standard)</option>
                  <option value="purple">Tím (Automation & AI)</option>
                  <option value="amber">Vàng/Cam (Hành Chính & ISO)</option>
                  <option value="blue">Xanh Dương (Kaizen 1-5-2)</option>
                  <option value="rose">Đỏ (Gemba Safety)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddProjectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProject}
                className="px-4 py-2 bg-[#006838] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                Tạo Dự Án
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Card Modal */}
      {isAddCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Thêm Thẻ Công Việc Mới</h2>
              <button
                onClick={() => setIsAddCardModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cột Danh Sách:</label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu Đề Công Việc (Bắt buộc):</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề thẻ công việc..."
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 outline-none focus:border-[#006838]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô Tả Chi Tiết:</label>
                <textarea
                  rows={3}
                  placeholder="Nhập ghi chú chi tiết công việc..."
                  value={cardDesc}
                  onChange={(e) => setCardDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#006838]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MSNV Người Thực Hiện:</label>
                  <input
                    type="text"
                    placeholder="VD: 202608001"
                    value={cardAssignee}
                    onChange={(e) => setCardAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Hạn deadline <span className="text-rose-500 font-black ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={cardDeadline}
                    onChange={(e) => setCardDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddCardModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                disabled={submitting}
                onClick={handleCreateCard}
                className="px-4 py-2 bg-[#006838] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                {submitting ? "Đang tạo..." : "Tạo Thẻ Công Việc"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Manager Review Modal */}
      {isReviewModalOpen && reviewingCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-amber-700">
                Nghiệm Thu: <span className="text-slate-900">{reviewingCard.title}</span>
              </h2>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chấm Điểm Đánh Giá (1 - 5 Sao):</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`p-2 rounded-xl border font-bold transition flex items-center gap-1 cursor-pointer ${
                        reviewRating >= star
                          ? "bg-amber-100 text-amber-800 border-amber-300 shadow-2xs"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}
                    >
                      ⭐ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nhận Xét Nghiệm Thu:</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ghi chú đánh giá chất lượng hoàn thành..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#006838]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                disabled={submitting}
                onClick={handleManagerReviewSubmit}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                {submitting ? "Đang xử lý..." : "Xác Nhận Nghiệm Thu & Đóng Thẻ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
