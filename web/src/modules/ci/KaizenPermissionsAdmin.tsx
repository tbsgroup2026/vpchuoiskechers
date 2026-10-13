"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IconShieldCheck,
  IconUserPlus,
  IconSearch,
  IconFilter,
  IconTrash,
  IconEdit,
  IconCheck,
  IconX,
  IconRefresh,
  IconClock,
  IconAward,
  IconUserCheck,
  IconBuildingFactory2,
  IconArrowLeft,
  IconExternalLink,
  IconAlertCircle,
  IconDeviceFloppy,
  IconSparkles,
} from "@tabler/icons-react";

interface PermissionRecord {
  id: string;
  emp_code: string;
  emp_name: string;
  role_type: "IE" | "CI_LEAD" | "JUDGE" | "APPROVER" | "ADMIN";
  factory_scope: string;
  department?: string;
  position?: string;
  note?: string;
  is_active: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface RoleStats {
  total: number;
  active: number;
  ie: number;
  ci_lead: number;
  judge: number;
  approver: number;
}

const ROLE_DEFINITIONS: Record<
  string,
  { label: string; shortLabel: string; desc: string; icon: string; bg: string; text: string; border: string }
> = {
  IE: {
    label: "Kỹ Sư Đo Lường IE",
    shortLabel: "Kỹ sư IE",
    desc: "Đo lường & xác nhận thời gian trước/sau cải tiến, tính toán giây tiết kiệm",
    icon: "⏱️",
    bg: "bg-sky-50",
    text: "text-sky-900",
    border: "border-sky-300",
  },
  CI_LEAD: {
    label: "Ban CI Lead",
    shortLabel: "CI Lead",
    desc: "Điều phối toàn diện chương trình Kaizen, phân công & phê duyệt triển khai",
    icon: "🚀",
    bg: "bg-indigo-50",
    text: "text-indigo-900",
    border: "border-indigo-300",
  },
  JUDGE: {
    label: "Ban Giám Khảo",
    shortLabel: "Giám khảo",
    desc: "Chấm điểm sáng kiến theo Bareme chuyên gia 5 tiêu chí (Hiệu quả, khả thi, nhân rộng...)",
    icon: "⚖️",
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-300",
  },
  APPROVER: {
    label: "Cấp Phê Duyệt",
    shortLabel: "Phê duyệt",
    desc: "Ký duyệt đề xuất, cho phép triển khai và ban hành chính thức",
    icon: "✅",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    border: "border-emerald-300",
  },
  ADMIN: {
    label: "Quản Trị Viên Hệ Thống",
    shortLabel: "Admin",
    desc: "Toàn quyền quản trị phân quyền, hệ thống và cơ sở dữ liệu Kaizen",
    icon: "🛡️",
    bg: "bg-purple-50",
    text: "text-purple-900",
    border: "border-purple-300",
  },
};

const FACTORY_OPTIONS = [
  { value: "ALL", label: "Toàn bộ chuỗi (Tất cả nhà máy)" },
  { value: "Nhà Máy Miền Đông", label: "Nhà Máy Miền Đông (NMMĐ)" },
  { value: "Kiên Giang 1", label: "Nhà máy Kiên Giang 1 (KG1)" },
  { value: "Kiên Giang 2", label: "Nhà máy Kiên Giang 2 (KG2)" },
  { value: "Kiên Giang 3", label: "Nhà máy Kiên Giang 3 (KG3)" },
  { value: "Hoàn Thiện Đế", label: "Xưởng Hoàn Thiện Đế" },
  { value: "Văn phòng Chuỗi", label: "Văn phòng Chuỗi Supply Chain" },
];

export default function KaizenPermissionsAdmin() {
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [stats, setStats] = useState<RoleStats>({
    total: 0,
    active: 0,
    ie: 0,
    ci_lead: 0,
    judge: 0,
    approver: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [factoryFilter, setFactoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Add Form State
  const [msnvInput, setMsnvInput] = useState("");
  const [empNameInput, setEmpNameInput] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["IE"]);
  const [factoryScopeInput, setFactoryScopeInput] = useState("ALL");
  const [deptInput, setDeptInput] = useState("");
  const [positionInput, setPositionInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<{ found: boolean; message: string } | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<PermissionRecord | null>(null);
  const [editFactoryScope, setEditFactoryScope] = useState("ALL");
  const [editNote, setEditNote] = useState("");
  const [editIsActive, setEditIsActive] = useState(1);

  // Delete Confirm Modal State
  const [deletingRecord, setDeletingRecord] = useState<PermissionRecord | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getAuthToken = () => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("tbs_token") ||
      localStorage.getItem("tbs_jwt_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("tbs_token") ||
      ""
    );
  };

  // Fetch Permissions
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await fetch("/api/ci-kaizen/permissions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPermissions(json.data);
        if (json.stats) {
          setStats(json.stats);
        }
      } else {
        showToast(json.error || "Không thể tải danh sách phân quyền", "error");
      }
    } catch (err: any) {
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // MSNV Employee Lookup
  const handleLookupEmployee = async (codeToLookup?: string) => {
    const code = (codeToLookup || msnvInput).trim().toUpperCase();
    if (!code) {
      setLookupFeedback(null);
      return;
    }

    try {
      setIsLookingUp(true);
      setLookupFeedback(null);
      const res = await fetch(`/api/employees/lookup?msnv=${encodeURIComponent(code)}`);
      const json = await res.json();

      if (json.success && json.data) {
        const emp = json.data;
        setEmpNameInput(emp.name || emp.full_name || "");
        setDeptInput(emp.workshop_id || emp.department || "");
        setPositionInput(emp.position || emp.vtcv || "");
        if (emp.factory_id) {
          // Try to match factory option
          const matched = FACTORY_OPTIONS.find((f) =>
            emp.factory_id.toLowerCase().includes(f.value.toLowerCase())
          );
          if (matched) {
            setFactoryScopeInput(matched.value);
          }
        }
        setLookupFeedback({
          found: true,
          message: `Đã tìm thấy: ${emp.name} (${emp.position || emp.vtcv || "CBNV"})`,
        });
      } else {
        setLookupFeedback({
          found: false,
          message: "Không tìm thấy hồ sơ nhân sự tự động, bạn có thể nhập tên thủ công.",
        });
      }
    } catch (err) {
      setLookupFeedback({
        found: false,
        message: "Lỗi kết nối khi tra cứu nhân sự.",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Toggle role selection
  const handleToggleRole = (roleKey: string) => {
    if (selectedRoles.includes(roleKey)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== roleKey));
      } else {
        showToast("Vui lòng chọn ít nhất một vai trò", "info");
      }
    } else {
      setSelectedRoles([...selectedRoles, roleKey]);
    }
  };

  // Add permission handler
  const handleAddPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsnv = msnvInput.trim().toUpperCase();
    const cleanName = empNameInput.trim();

    if (!cleanMsnv) {
      showToast("Vui lòng nhập Mã số nhân viên (MSNV)", "error");
      return;
    }
    if (!cleanName) {
      showToast("Vui lòng nhập Họ và tên nhân viên", "error");
      return;
    }
    if (selectedRoles.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 vai trò phân quyền", "error");
      return;
    }

    try {
      setSubmitting(true);
      const token = getAuthToken();
      const res = await fetch("/api/ci-kaizen/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          emp_code: cleanMsnv,
          emp_name: cleanName,
          roles: selectedRoles,
          factory_scope: factoryScopeInput,
          department: deptInput,
          position: positionInput,
          note: noteInput,
          is_active: 1,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Phân quyền thành công!", "success");
        // Reset form
        setMsnvInput("");
        setEmpNameInput("");
        setDeptInput("");
        setPositionInput("");
        setNoteInput("");
        setSelectedRoles(["IE"]);
        setLookupFeedback(null);
        // Refresh list
        fetchPermissions();
      } else {
        showToast(json.error || json.message || "Không thể phân quyền", "error");
      }
    } catch (err: any) {
      showToast("Lỗi gửi dữ liệu lên máy chủ", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (record: PermissionRecord) => {
    try {
      const newStatus = record.is_active === 1 ? 0 : 1;
      const token = getAuthToken();
      const res = await fetch("/api/ci-kaizen/permissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: record.id,
          is_active: newStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPermissions((prev) =>
          prev.map((p) => (p.id === record.id ? { ...p, is_active: newStatus } : p))
        );
        showToast(
          newStatus === 1
            ? `Đã kích hoạt quyền cho ${record.emp_name}`
            : `Đã tạm khóa quyền của ${record.emp_name}`,
          "success"
        );
      } else {
        showToast(json.error || "Không thể cập nhật trạng thái", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối", "error");
    }
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      setSubmitting(true);
      const token = getAuthToken();
      const res = await fetch("/api/ci-kaizen/permissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: editingRecord.id,
          factory_scope: editFactoryScope,
          note: editNote,
          is_active: editIsActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Cập nhật phân quyền thành công!", "success");
        setEditingRecord(null);
        fetchPermissions();
      } else {
        showToast(json.error || "Lỗi cập nhật", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Permission
  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    try {
      setSubmitting(true);
      const token = getAuthToken();
      const res = await fetch(`/api/ci-kaizen/permissions?id=${encodeURIComponent(deletingRecord.id)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        showToast("Đã xóa phân quyền thành công!", "success");
        setDeletingRecord(null);
        fetchPermissions();
      } else {
        showToast(json.error || "Không thể xóa phân quyền", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      if (roleFilter !== "ALL" && p.role_type !== roleFilter) return false;
      if (factoryFilter !== "ALL" && p.factory_scope !== factoryFilter && p.factory_scope !== "ALL")
        return false;
      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && p.is_active !== 1) return false;
        if (statusFilter === "INACTIVE" && p.is_active !== 0) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmp = p.emp_code.toLowerCase().includes(q);
        const matchName = p.emp_name.toLowerCase().includes(q);
        const matchDept = (p.department || "").toLowerCase().includes(q);
        const matchPos = (p.position || "").toLowerCase().includes(q);
        const matchNote = (p.note || "").toLowerCase().includes(q);
        if (!matchEmp && !matchName && !matchDept && !matchPos && !matchNote) return false;
      }
      return true;
    });
  }, [permissions, roleFilter, factoryFilter, statusFilter, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 transition-all transform animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200"
              : toastMessage.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200"
              : "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <IconCheck size={18} className="text-emerald-600" />
          ) : toastMessage.type === "error" ? (
            <IconAlertCircle size={18} className="text-rose-600" />
          ) : (
            <IconSparkles size={18} className="text-sky-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide uppercase">
              <IconShieldCheck size={14} />
              <span>Hệ Thống Phân Quyền Vận Hành Kaizen TBS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Quản Lý Phân Quyền CI / IE & Ban Giám Khảo
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Trang cấp quyền chủ động: Thêm nhân sự, phân bổ chức năng đo lường thời gian cho kỹ sư IE, 
              điều phối Ban CI Lead, phân công Ban Giám Khảo chấm điểm và Cấp phê duyệt theo MSNV.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="/work/kaizen/admin/judging"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/20 hover:border-white/40 shadow-xs"
            >
              <IconAward size={16} />
              <span>Quản Lý BGK</span>
            </a>
            <a
              href="/work/kaizen/ie-queue"
              className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-xs font-bold transition-all flex items-center gap-2 border border-sky-400/30 shadow-xs"
            >
              <IconClock size={16} />
              <span>Hàng Chờ IE</span>
            </a>
            <button
              type="button"
              onClick={fetchPermissions}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <IconRefresh size={16} className={loading ? "animate-spin" : ""} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center text-xl shrink-0 border border-sky-400/20">
              ⏱️
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kỹ Sư IE</div>
              <div className="text-xl font-black text-white">{stats.ie} nhân sự</div>
              <div className="text-[10px] text-sky-300/80">Xác nhận thời gian</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xl shrink-0 border border-indigo-400/20">
              🚀
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ban CI Lead</div>
              <div className="text-xl font-black text-white">{stats.ci_lead} nhân sự</div>
              <div className="text-[10px] text-indigo-300/80">Điều phối Kaizen</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xl shrink-0 border border-amber-400/20">
              ⚖️
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ban Giám Khảo</div>
              <div className="text-xl font-black text-white">{stats.judge} nhân sự</div>
              <div className="text-[10px] text-amber-300/80">Chấm điểm Bareme</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xl shrink-0 border border-emerald-400/20">
              ✅
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cấp Phê Duyệt</div>
              <div className="text-xl font-black text-white">{stats.approver} nhân sự</div>
              <div className="text-[10px] text-emerald-300/80">Ký duyệt triển khai</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form (Left/Top) + List Table (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ADD FORM CARD */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <IconUserPlus size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Thêm Nhân Sự Phân Quyền</h2>
                <p className="text-xs text-slate-500">Tra cứu theo MSNV và phân vai trò hoạt động</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddPermissions} className="space-y-4 text-xs">
            {/* MSNV Input with Auto-lookup */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Mã Số Nhân Viên (MSNV) *</span>
                <span className="text-[11px] text-slate-500 font-normal">Tự động tra cứu hồ sơ</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={msnvInput}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setMsnvInput(val);
                    if (val.trim().length >= 4) {
                      handleLookupEmployee(val);
                    } else {
                      setLookupFeedback(null);
                    }
                  }}
                  onBlur={() => handleLookupEmployee()}
                  placeholder="Ví dụ: 210602002, 202608001..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-mono text-xs font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:bg-white focus:text-slate-950 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleLookupEmployee()}
                  disabled={isLookingUp || !msnvInput.trim()}
                  className="absolute right-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <IconSearch size={13} className={isLookingUp ? "animate-spin" : ""} />
                  <span>Tra cứu</span>
                </button>
              </div>

              {/* Lookup Feedback Preview */}
              {lookupFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border font-medium ${
                    lookupFeedback.found
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                      : "bg-amber-50 text-amber-900 border-amber-300"
                  }`}
                >
                  {lookupFeedback.found ? <IconCheck size={16} className="text-emerald-700" /> : <IconAlertCircle size={16} className="text-amber-700" />}
                  <span>{lookupFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Employee Full Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Họ và Tên CBNV *</label>
              <input
                type="text"
                value={empNameInput}
                onChange={(e) => setEmpNameInput(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:bg-white focus:text-slate-950 focus:outline-hidden"
              />
            </div>

            {/* Department & Position */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Bộ Phận / Xưởng</label>
                <input
                  type="text"
                  value={deptInput}
                  onChange={(e) => setDeptInput(e.target.value)}
                  placeholder="Ví dụ: Kỹ Thuật IE, May..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:bg-white focus:text-slate-950 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Chức Danh / Vị Trí</label>
                <input
                  type="text"
                  value={positionInput}
                  onChange={(e) => setPositionInput(e.target.value)}
                  placeholder="Ví dụ: Kỹ sư IE, Trưởng ban..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:bg-white focus:text-slate-950 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Roles Selection (Multi-select) */}
            <div className="space-y-2 pt-1">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Vai Trò Phân Quyền *</span>
                <span className="text-[11px] text-indigo-700 font-medium">
                  (Có thể chọn cùng lúc nhiều vai trò)
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => {
                  const isChecked = selectedRoles.includes(key);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => handleToggleRole(key)}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isChecked
                          ? `${def.bg} ${def.border} ring-2 ring-indigo-500 shadow-xs`
                          : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-lg shrink-0 mt-0.5">{def.icon}</span>
                      <div className="min-w-0">
                        <div className={`font-black text-xs ${isChecked ? def.text : "text-slate-900"}`}>
                          {def.shortLabel}
                        </div>
                        <div className={`text-[10px] leading-tight mt-0.5 line-clamp-2 ${isChecked ? def.text : "text-slate-600"} font-medium`}>
                          {def.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Factory Scope */}
            <div className="space-y-1.5 pt-1">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <IconBuildingFactory2 size={15} className="text-slate-600" />
                <span>Phạm Vi Nhà Máy Phụ Trách</span>
              </label>
              <select
                value={factoryScopeInput}
                onChange={(e) => setFactoryScopeInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:bg-white focus:text-slate-950 focus:outline-hidden"
              >
                {FACTORY_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value} className="text-slate-900 bg-white">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Ghi Chú Phân Công</label>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Ví dụ: Phụ trách chuyền may KG1, Giám khảo Vòng 1..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:bg-white focus:text-slate-950 focus:outline-hidden"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <IconDeviceFloppy size={16} />
              <span>{submitting ? "Đang lưu phân quyền..." : "Cấp Quyền & Thêm Vào Hệ Thống"}</span>
            </button>
          </form>
        </div>

        {/* LIST & FILTER TABLE (RIGHT) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Danh Sách Nhân Sự Phân Quyền</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black">
                  {filteredPermissions.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500">Kỹ sư IE, Ban CI Lead, Giám khảo và Phê duyệt đang vận hành</p>
            </div>

            {/* Quick search */}
            <div className="relative min-w-[200px]">
              <IconSearch size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm MSNV, tên, bộ phận..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold focus:outline-hidden"
            >
              <option value="ALL" className="text-slate-900">Tất cả vai trò</option>
              <option value="IE" className="text-slate-900">⏱️ Kỹ sư IE</option>
              <option value="CI_LEAD" className="text-slate-900">🚀 Ban CI Lead</option>
              <option value="JUDGE" className="text-slate-900">⚖️ Ban Giám Khảo</option>
              <option value="APPROVER" className="text-slate-900">✅ Cấp Phê Duyệt</option>
              <option value="ADMIN" className="text-slate-900">🛡️ Admin</option>
            </select>

            {/* Factory Filter */}
            <select
              value={factoryFilter}
              onChange={(e) => setFactoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold focus:outline-hidden"
            >
              <option value="ALL" className="text-slate-900">Tất cả nhà máy</option>
              {FACTORY_OPTIONS.filter((f) => f.value !== "ALL").map((f) => (
                <option key={f.value} value={f.value} className="text-slate-900">
                  {f.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold focus:outline-hidden"
            >
              <option value="ALL" className="text-slate-900">Tất cả trạng thái</option>
              <option value="ACTIVE" className="text-slate-900">Đang hoạt động</option>
              <option value="INACTIVE" className="text-slate-900">Đang tạm khóa</option>
            </select>

            {(searchQuery || roleFilter !== "ALL" || factoryFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("ALL");
                  setFactoryFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
              >
                Đặt lại lọc
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase">
                  <th className="p-3">CBNV</th>
                  <th className="p-3">Vai Trò</th>
                  <th className="p-3">Phạm Vi</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <IconRefresh size={20} className="animate-spin mx-auto mb-2 text-indigo-600" />
                      <span>Đang tải danh sách phân quyền...</span>
                    </td>
                  </tr>
                ) : filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <div className="text-2xl mb-1">🔍</div>
                      <div className="font-bold text-slate-700">Không tìm thấy phân quyền nào</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Thử thay đổi bộ lọc hoặc thêm phân quyền mới bằng form bên trái
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((record) => {
                    const roleDef = ROLE_DEFINITIONS[record.role_type] || ROLE_DEFINITIONS.IE;
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Member Details */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{record.emp_name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                            <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                              {record.emp_code}
                            </span>
                            {record.department && (
                              <span className="text-slate-500 truncate max-w-[140px]">
                                {record.department}
                              </span>
                            )}
                          </div>
                          {record.note && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">
                              💬 {record.note}
                            </div>
                          )}
                        </td>

                        {/* Role Badge */}
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${roleDef.bg} ${roleDef.text} ${roleDef.border}`}
                          >
                            <span>{roleDef.icon}</span>
                            <span>{roleDef.shortLabel}</span>
                          </span>
                        </td>

                        {/* Factory Scope */}
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200">
                            {record.factory_scope === "ALL" ? "🌐 Toàn chuỗi" : record.factory_scope}
                          </span>
                        </td>

                        {/* Active Toggle Switch */}
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(record)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                              record.is_active === 1
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                : "bg-slate-100 text-slate-600 border border-slate-300"
                            }`}
                            title="Click để bật / tắt trạng thái hoạt động"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                record.is_active === 1 ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            <span>{record.is_active === 1 ? "Hoạt động" : "Tạm khóa"}</span>
                          </button>
                        </td>

                        {/* Action Buttons */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(record);
                                setEditFactoryScope(record.factory_scope || "ALL");
                                setEditNote(record.note || "");
                                setEditIsActive(record.is_active);
                              }}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer"
                              title="Chỉnh sửa ghi chú & phạm vi"
                            >
                              <IconEdit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingRecord(record)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                              title="Xóa phân quyền"
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <IconEdit size={18} className="text-indigo-600" />
                <span>Chỉnh Sửa Phân Quyền</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <IconX size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  {editingRecord.emp_name}
                </div>
                <div className="text-slate-600">
                  MSNV: <span className="font-mono font-bold text-indigo-700">{editingRecord.emp_code}</span> | Vai trò:{" "}
                  <span className="font-bold text-slate-800">{ROLE_DEFINITIONS[editingRecord.role_type]?.label || editingRecord.role_type}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Phạm Vi Nhà Máy Phụ Trách</label>
                <select
                  value={editFactoryScope}
                  onChange={(e) => setEditFactoryScope(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:border-indigo-600 focus:outline-hidden"
                >
                  {FACTORY_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value} className="text-slate-900 bg-white">
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Ghi Chú Phân Công</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Trạng Thái Kích Hoạt</label>
                <div className="flex items-center gap-4 text-slate-800 font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editIsActive === 1}
                      onChange={() => setEditIsActive(1)}
                    />
                    <span>Hoạt động</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editIsActive === 0}
                      onChange={() => setEditIsActive(0)}
                    />
                    <span>Tạm khóa</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <IconCheck size={16} />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Phân Quyền</h3>
              <p className="text-xs text-slate-600">
                Bạn có chắc chắn muốn thu hồi quyền{" "}
                <span className="font-bold text-slate-800">
                  {ROLE_DEFINITIONS[deletingRecord.role_type]?.shortLabel}
                </span>{" "}
                của CBNV{" "}
                <span className="font-bold text-slate-900">{deletingRecord.emp_name}</span> (
                <span className="font-mono text-indigo-700 font-bold">{deletingRecord.emp_code}</span>)?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <IconTrash size={16} />
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
