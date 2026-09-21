"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getCurrentUser } from "@/lib/userProfiles";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
import HomeNew, { TaskItem, NotificationItem } from "./HomeNew";
import HomeClassic from "./HomeClassic";
import {
  IconUsers,
  IconLayoutGrid,
  IconFileText,
  IconFolder,
  IconSettings,
} from "@tabler/icons-react";

interface WorkspaceHomeViewProps {
  userName?: string;
  userCode?: string;
  userTitle?: string;
  userDept?: string;
  visibleDepartments?: any[];
  onSelectDept?: (deptId: string) => void;
  currentUser?: any;
  selectedDept?: string | null;
}

export default function WorkspaceHomeView({
  userName,
  userCode,
  userTitle,
  userDept,
  visibleDepartments = [],
  onSelectDept,
  currentUser: currentUserProp,
  selectedDept,
}: WorkspaceHomeViewProps) {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [dashboardMode, setDashboardMode] = useState<"personal" | "department">("personal");

  const { can, isExecutiveOrAdmin } = usePermission();
  const hasDeptPermission = useMemo(() => {
    return (
      isExecutiveOrAdmin ||
      can(PERMISSIONS.WORK_MANAGE_DEPT) ||
      can(PERMISSIONS.WORK_VIEW_ALL_DEPTS)
    );
  }, [isExecutiveOrAdmin, can]);

  useEffect(() => {
    function loadActiveUser() {
      if (currentUserProp) {
        setActiveUser(currentUserProp);
      } else {
        const cur = getCurrentUser();
        if (cur) {
          setActiveUser(cur);
        } else {
          setActiveUser({
            name: userName || "Phạm Nguyễn Anh Huy",
            empCode: userCode || "202608001",
            title: userTitle || "Trưởng Phòng IT & CĐS",
            department: userDept || "IT - Team Chuyển Đổi Số",
          });
        }
      }
    }

    loadActiveUser();

    if (typeof window !== "undefined") {
      window.addEventListener("tbs_profile_updated", loadActiveUser);
      return () => window.removeEventListener("tbs_profile_updated", loadActiveUser);
    }
  }, [currentUserProp, userName, userCode, userTitle, userDept]);

  // Shared data state from API endpoints
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  // Active user details
  const activeName = activeUser?.name || userName || "Phạm Nguyễn Anh Huy";
  const activeCode = activeUser?.empCode || userCode || "202608001";
  const activeTitle = activeUser?.title || userTitle || "Trưởng Phòng IT & CĐS";
  const activeDept = activeUser?.department || userDept || "IT - Team Chuyển Đổi Số";

  // 1. Fetch Real Tasks for current user from D1 database
  useEffect(() => {
    let isMountedFetch = true;
    async function fetchRealTasks() {
      setIsLoadingTasks(true);
      try {
        const emp = activeCode ? `?empCode=${encodeURIComponent(activeCode)}` : "";
        const res = await fetch(`/api/tasks${emp}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.tasks)) {
            if (isMountedFetch) setTasks(json.tasks);
          }
        }
      } catch (err) {
        console.warn("Could not fetch real tasks for dashboard:", err);
      } finally {
        if (isMountedFetch) setIsLoadingTasks(false);
      }
    }
    fetchRealTasks();
    return () => {
      isMountedFetch = false;
    };
  }, [activeCode]);

  // 2. Fetch Real Notifications from database
  useEffect(() => {
    let isMountedFetch = true;
    async function fetchRealNotifications() {
      setIsLoadingNotifications(true);
      try {
        const res = await fetch("/api/notifications?limit=5", { cache: "no-store" });
        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            if (isMountedFetch) {
              const mapped = json.data.map((item: any, idx: number) => ({
                id: item.id || `notif-${idx}`,
                title: item.title || item.message,
                department: item.department || item.targetUser || "Khối IT & HR",
                date: item.created_at ? new Date(item.created_at).toLocaleDateString("vi-VN") : "Hôm nay",
                dotColor: idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-blue-500" : "bg-emerald-500",
              }));
              setNotifications(mapped);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch real notifications:", err);
      } finally {
        if (isMountedFetch) setIsLoadingNotifications(false);
      }
    }
    fetchRealNotifications();
    return () => {
      isMountedFetch = false;
    };
  }, []);

  // Compute 100% Real Dynamic KPIs from tasks array
  const kpiStats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(
      (t) => t.status === "DOING" || t.status === "IN_PROGRESS" || t.status === "TO_DO"
    ).length;
    const done = tasks.filter((t) => t.status === "DONE" || t.status === "COMPLETED").length;
    const needsAttention = tasks.filter(
      (t) =>
        t.status === "URGENT" ||
        t.status === "NEED_HELP" ||
        t.priority === "URGENT" ||
        t.priority === "HIGH" ||
        t.priority === "VERY_HIGH" ||
        t.priority === "Rất cao" ||
        t.priority === "Cao"
    ).length;

    return { total, inProgress, done, needsAttention };
  }, [tasks]);

  // Urgent Tasks List mapped strictly from real tasks
  const urgentTaskList = useMemo(() => {
    return tasks.slice(0, 5).map((t) => {
      const rawPriority = (t.priority || "").toUpperCase();
      const rawStatus = (t.status || "").toUpperCase();
      const isDone = rawStatus === "DONE" || rawStatus === "COMPLETED";
      const isDoing = rawStatus === "DOING" || rawStatus === "IN_PROGRESS";

      let priorityLabel = "Trung bình";
      let priorityStyle = "bg-amber-50 text-amber-800 border border-amber-200/80";
      if (rawPriority === "URGENT" || rawPriority === "VERY_HIGH" || rawPriority === "RẤT CAO") {
        priorityLabel = "Rất cao";
        priorityStyle = "bg-rose-50 text-rose-700 border border-rose-200/80";
      } else if (rawPriority === "HIGH" || rawPriority === "CAO") {
        priorityLabel = "Cao";
        priorityStyle = "bg-rose-50 text-rose-700 border border-rose-200/80";
      } else if (rawPriority === "LOW" || rawPriority === "THẤP") {
        priorityLabel = "Thấp";
        priorityStyle = "bg-slate-100 text-slate-700 border border-slate-200";
      }

      let statusLabel = "Cần làm";
      let statusStyle = "bg-rose-50 text-rose-700 border border-rose-200/80";
      if (isDone) {
        statusLabel = "Hoàn thành";
        statusStyle = "bg-emerald-50 text-emerald-800 border border-emerald-200/80";
      } else if (isDoing) {
        statusLabel = "Đang làm";
        statusStyle = "bg-amber-50 text-amber-800 border border-amber-200/80";
      }

      const isPrimaryAction = t.department_id !== "HÀNH_CHÍNH";

      return {
        id: t.id,
        title: t.title,
        subTitle: t.assignee_name || t.code || activeName,
        dueDate: t.due_date || "—",
        dept: t.department_id || "IT_DIGITAL",
        priority: priorityLabel,
        priorityStyle,
        status: statusLabel,
        statusStyle,
        isPrimaryAction,
      };
    });
  }, [tasks, activeName]);

  // Operational Modules in 3x2 Grid
  const operationalModules = [
    {
      id: "my_tasks",
      title: "Công việc cá nhân",
      subtitle: "Theo dõi & xử lý task",
      icon: IconFileText,
      iconBg: "bg-slate-100 text-[#006838]",
      route: "/work?dept=my-tasks",
    },
    {
      id: "tasks",
      title: "Bảng công việc phòng ban",
      subtitle: "Tiến độ & nghiệm thu",
      icon: IconUsers,
      iconBg: "bg-slate-100 text-slate-700",
      route: "/work/tasks",
    },
    {
      id: "projects",
      title: "Dự án liên phòng ban",
      subtitle: "Tiến độ dự án phối hợp",
      icon: IconFolder,
      iconBg: "bg-slate-100 text-slate-700",
      route: "/work/projects",
    },
    {
      id: "hr",
      title: "Nhân sự – Hành chính",
      subtitle: "Tuyển dụng, tài sản & văn thư",
      icon: IconUsers,
      iconBg: "bg-slate-100 text-slate-700",
      route: "/hr",
    },
    {
      id: "ci",
      title: "CN-CI (Cải tiến liên tục)",
      subtitle: "Sáng kiến Kaizen & 4.0",
      icon: IconSettings,
      iconBg: "bg-slate-100 text-slate-700",
      route: "/work/cn-ci",
    },
    {
      id: "documents",
      title: "Tài liệu & Biểu mẫu",
      subtitle: "Quy trình, biểu mẫu nội bộ",
      icon: IconLayoutGrid,
      iconBg: "bg-slate-100 text-[#006838]",
      route: "/documents/templates",
    },
  ];

  const allowedModules = useMemo(() => {
    if (!visibleDepartments || visibleDepartments.length === 0) {
      return operationalModules;
    }
    const allowedIds = new Set(visibleDepartments.map((d: any) => d.id));
    return operationalModules.filter((m) => allowedIds.has(m.id) || m.id === "documents" || m.id === "my_tasks");
  }, [visibleDepartments]);

  // When selectedDept === "home" or path is /work/home, render HomeNew (New Home UI)
  // When selectedDept is NOT "home" (e.g. null, overview, or default), render HomeClassic (Classic Dashboard UI)
  const isHomeView =
    selectedDept === "home" ||
    (typeof window !== "undefined" &&
      (window.location.search.includes("dept=home") || window.location.pathname.endsWith("/work/home")));

  return isHomeView ? (
    <HomeNew
      activeName={activeName}
      activeCode={activeCode}
      activeTitle={activeTitle}
      activeDept={activeDept}
      activeUser={activeUser}
      dashboardMode={dashboardMode}
      setDashboardMode={setDashboardMode}
      hasDeptPermission={hasDeptPermission}
      tasks={tasks}
      isLoadingTasks={isLoadingTasks}
      kpiStats={kpiStats}
      urgentTaskList={urgentTaskList}
      allowedModules={allowedModules}
      notifications={notifications}
      isLoadingNotifications={isLoadingNotifications}
    />
  ) : (
    <HomeClassic
      activeName={activeName}
      activeCode={activeCode}
      activeTitle={activeTitle}
      activeDept={activeDept}
      activeUser={activeUser}
      dashboardMode={dashboardMode}
      setDashboardMode={setDashboardMode}
      hasDeptPermission={hasDeptPermission}
      tasks={tasks}
      isLoadingTasks={isLoadingTasks}
      notifications={notifications}
      isLoadingNotifications={isLoadingNotifications}
    />
  );
}
