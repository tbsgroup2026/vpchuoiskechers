"use client";

import React, { useState, useEffect } from "react";
import NavLink from "@/components/NavLink";
import { IconSettings, IconPlus, IconTrash, IconRefresh, IconArrowLeft, IconCheck } from "@tabler/icons-react";

const SYSTEM_ROLES = [
  { code: "SUPER_ADMIN", title: "Quản Trị Viên Hệ Thống" },
  { code: "ADMIN", title: "Quản Trị Viên" },
  { code: "TONG_GIAM_DOC", title: "Tổng Giám Đốc" },
  { code: "PHO_TONG_GIAM_DOC", title: "Phó Tổng Giám Đốc" },
  { code: "GIAM_DOC", title: "Giám Đốc Phân Hệ" },
  { code: "PHO_GIAM_DOC", title: "Phó Giám Đốc Phân Hệ" },
  { code: "TRUONG_PHONG", title: "Trưởng Phòng" },
  { code: "IE", title: "Kỹ Sư IE (Industrial Engineering)" },
  { code: "LE_TAN", title: "Lễ Tân Văn Phòng" },
  { code: "QC_MANAGER", title: "Quản Lý Quality Control" },
  { code: "KY_THUAT_VIEN", title: "Kỹ Thuật Viên Bảo Trì" },
  { code: "CBCNV", title: "Chuyên Viên Vận Hành (CBCNV)" },
  { code: "NHAN_VIEN", title: "Nhân Viên Vận Hành" },
  { code: "QUAN_LY_KHU_VUC", title: "Quản Lý Đa Đơn Vị" },
];

export default function AdminWorkspaceConfigPage() {
  const [selectedRole, setSelectedRole] = useState("SUPER_ADMIN");
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [newRoute, setNewRoute] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("IconChevronRight");
  const [newSortOrder, setNewSortOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch(`/api/admin/workspace-config?role=${selectedRole}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setConfigs(json.data || []);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [selectedRole]);

  const handleAddConfig = async () => {
    if (!newRoute.trim() || !newLabel.trim()) {
      showToast("⚠️ Vui lòng nhập đầy đủ Route và Nhãn hiển thị");
      return;
    }
    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/admin/workspace-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role: selectedRole,
          route: newRoute.trim(),
          label: newLabel.trim(),
          icon: newIcon.trim() || "IconChevronRight",
          sort_order: Number(newSortOrder) || 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✅ Đã thêm route cấu hình mới cho role!");
        setNewRoute("");
        setNewLabel("");
        fetchConfigs();
      } else {
        showToast(`❌ ${json.error || "Lỗi khi thêm"}`);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa route này khỏi cấu hình role?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch(`/api/admin/workspace-config?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        showToast("🗑️ Đã xóa cấu hình route thành công!");
        fetchConfigs();
      } else {
        showToast(`❌ ${json.error || "Lỗi khi xóa"}`);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl text-sm font-semibold border border-slate-700">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <NavLink href="/work" className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            <IconArrowLeft size={20} />
          </NavLink>
          <div>
            <h1 className="text-xl font-black text-slate-900">Quản Lý Cấu Hình Workspace Cho Tất Cả Role</h1>
            <p className="text-xs text-slate-500 mt-0.5">Tùy biến danh sách menu / route hiển thị trên Sidebar cho từng vai trò người dùng trong hệ thống</p>
          </div>
        </div>

        <button
          onClick={fetchConfigs}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
        >
          <IconRefresh size={16} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Selector List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-xs">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider px-2 mb-2">Danh Sách Role Hệ Thống</h2>
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {SYSTEM_ROLES.map((r) => (
              <button
                key={r.code}
                onClick={() => setSelectedRole(r.code)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                  selectedRole === r.code
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span>{r.title}</span>
                <span className="font-mono text-[10px] opacity-75">{r.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Route Configuration Table & Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Add New Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <IconPlus size={18} className="text-blue-600" /> Thêm Route Cấu Hình Cho Role: <span className="text-blue-600 font-mono">{selectedRole}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Đường Dẫn Route (VD: /work/tasks):</label>
                <input
                  type="text"
                  placeholder="/work/..."
                  value={newRoute}
                  onChange={(e) => setNewRoute(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Nhãn Hiển Thị (Label):</label>
                <input
                  type="text"
                  placeholder="VD: Task Board Trello"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Icon Tabler Name:</label>
                <input
                  type="text"
                  placeholder="IconChartBar"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Thứ Tự Sắp Xếp (Sort):</label>
                <input
                  type="number"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  disabled={submitting}
                  onClick={handleAddConfig}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <IconPlus size={16} /> {submitting ? "Đang lưu..." : "Thêm Route Vào Cấu Hình"}
                </button>
              </div>
            </div>
          </div>

          {/* Configured Routes List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span>Danh Sách Route Cấu Hình Hợp Lệ</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Role: {selectedRole} ({configs.length} routes)
              </span>
            </h3>

            {/* Mandatory Routes Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium space-y-1">
              <div className="font-bold flex items-center gap-1">📌 2 Route Cố Định Tự Động Đính Kèm Mọi Role:</div>
              <ul className="list-disc list-inside font-mono text-[11px] space-y-0.5 text-amber-800">
                <li>/work/room-booking (Đăng Ký Phòng Họp)</li>
                <li>/work/business-trip (Đăng Ký Công Tác)</li>
              </ul>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">⏳ Đang tải danh sách route...</div>
            ) : configs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                ⚠️ Role này chưa có cấu hình riêng trong DB (Hệ thống đang tự động Fallback về menu mặc định tối thiểu).
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {configs.map((c) => (
                  <div key={c.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between transition">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-mono text-[11px] font-bold">
                        {c.sort_order}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{c.label}</div>
                        <div className="text-[11px] text-blue-600 font-mono">{c.route}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[10px]">
                        {c.icon || "IconChevronRight"}
                      </span>
                      <button
                        onClick={() => handleDeleteConfig(c.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Xóa route khỏi role"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
