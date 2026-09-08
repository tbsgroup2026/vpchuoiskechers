"use client";

import React, { useState, useEffect } from "react";
import {
  IconUserPlus,
  IconFileUpload,
  IconTrash,
  IconSearch,
  IconEdit,
  IconKey,
  IconUserCheck,
  IconX,
  IconRefresh
} from "@tabler/icons-react";
import { GembaUserScope } from "./types";
import { UserProfile } from "@/lib/userProfiles";

interface GembaUserManagementViewProps {
  currentUser: UserProfile | null;
}

export default function GembaUserManagementView({ currentUser }: GembaUserManagementViewProps) {
  const [users, setUsers] = useState<GembaUserScope[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [editingUser, setEditingUser] = useState<GembaUserScope | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gemba/users");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setUsers(json.data || []);
        }
      }
    } catch (err) {
      console.warn("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tbs_user_custom_avatar");
      alert("Đã xoá sạch cache hệ thống!");
      window.location.reload();
    }
  };

  const handleSaveUserScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch("/api/gemba/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_code: editingUser.emp_code,
          factory_id: editingUser.factory_id,
          workshop_id: editingUser.workshop_id,
          line_id: editingUser.line_id,
          team_id: editingUser.team_id,
          gemba_role: editingUser.gemba_role,
          mmtb_token: editingUser.mmtb_token,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          alert("Cập nhật phân quyền Gemba User thành công!");
          setIsModalOpen(false);
          fetchUsers();
        } else {
          alert(json.message || "Lỗi cập nhật!");
        }
      }
    } catch (err) {
      alert("Lỗi kết nối!");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.emp_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.department || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-4 bg-slate-100/70 min-h-screen font-sans text-slate-900">
      {/* Top Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setEditingUser({
                id: "",
                emp_code: "EMP-001",
                gemba_role: "OPERATOR",
                factory_id: "fac_nmmd",
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <IconUserPlus size={18} />
            <span>Thêm User</span>
          </button>

          <button
            onClick={() => alert("Tính năng Import CSV đang sẵn sàng!")}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <IconFileUpload size={18} />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleClearCache}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <IconTrash size={18} />
            <span>Xoá cache</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã NV, tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 w-56"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">USERNAME</th>
                <th className="py-3 px-3">HỌ TÊN</th>
                <th className="py-3 px-3">NHÓM / CHỨC DANH</th>
                <th className="py-3 px-3">NHÀ MÁY</th>
                <th className="py-3 px-3">LINE / TỔ</th>
                <th className="py-3 px-3">QUYỀN GEMBA</th>
                <th className="py-3 px-3">TOKEN MMTB</th>
                <th className="py-3 px-3">TRẠNG THÁI</th>
                <th className="py-3 px-3 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredUsers.map((u) => (
                <tr key={u.id || u.emp_code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {u.emp_code}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                    {u.name || "N/A"}
                  </td>
                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                    {u.title || u.department || "Nhân Viên"}
                  </td>
                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                    {u.factory_name || "NM SK MIỀN ĐỒNG"}
                  </td>
                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                    {u.line_name || "LINE CHẶT 1"} - {u.team_name || "Cắt"}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                      {u.gemba_role || u.role_code || "OPERATOR"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {u.mmtb_token || "TK-9982"}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {u.status || "ACTIVE"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap space-x-1">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                      title="Sửa phân quyền"
                    >
                      <IconEdit size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Scope */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                Phân Quyền & Gán Phạm Vi Gemba
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUserScope} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã nhân viên (Username)</label>
                <input
                  type="text"
                  required
                  value={editingUser.emp_code}
                  onChange={(e) => setEditingUser({ ...editingUser, emp_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quyền Gemba</label>
                <select
                  value={editingUser.gemba_role}
                  onChange={(e) => setEditingUser({ ...editingUser, gemba_role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                >
                  <option value="ADMIN">Admin Chuỗi</option>
                  <option value="GD_NHAMAY">Giám Đốc Nhà Máy</option>
                  <option value="CN_CI_KHU_VUC">CN-CI Khu vực</option>
                  <option value="QLCL_KHU_VUC">QLCL Khu vực</option>
                  <option value="MMTB_KHU_VUC">MMTB Khu vực</option>
                  <option value="DOC_CONG">Đốc công / ĐH phân xưởng</option>
                  <option value="TRUONG_LINE">Trưởng Line</option>
                  <option value="TO_TRUONG">Tổ trưởng</option>
                  <option value="OPERATOR">Công nhân / Operator</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phân xưởng (PX)</label>
                  <select
                    value={editingUser.workshop_id || "ws_dau_vao"}
                    onChange={(e) => setEditingUser({ ...editingUser, workshop_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  >
                    <option value="ws_go">PX Gò</option>
                    <option value="ws_may">PX May</option>
                    <option value="ws_dau_vao">PX Đầu vào</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Line / Tổ</label>
                  <select
                    value={editingUser.line_id || "line_chat1"}
                    onChange={(e) => setEditingUser({ ...editingUser, line_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  >
                    <option value="line_chat1">LINE CHẶT 1</option>
                    <option value="line_inep1">LINE IN ÉP 1</option>
                    <option value="line_htg1">LINE_HTG 1</option>
                    <option value="line_htm1">LINE_HTM 1</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Token MMTB</label>
                <input
                  type="text"
                  placeholder="VD: TK-9982"
                  value={editingUser.mmtb_token || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, mmtb_token: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Lưu phân quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
