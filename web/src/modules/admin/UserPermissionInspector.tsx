"use client";

import React, { useState, useEffect } from "react";
import {
  IconShieldCheck,
  IconUser,
  IconBuilding,
  IconId,
  IconCheck,
  IconLock,
  IconSearch,
  IconInfoCircle,
} from "@tabler/icons-react";

interface UserItem {
  userId: number;
  empCode: string;
  name: string;
  title: string;
  department: string;
  roleCode: string;
  roles: string[];
}

interface PermissionRule {
  resource: string;
  action: string;
  scope: string;
  source: string;
}

export default function UserPermissionInspector() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedEmpCode, setSelectedEmpCode] = useState<string>("202608001");
  const [inspectedData, setInspectedData] = useState<{
    user: UserItem & { managedDepartmentId?: string; allowedScopes?: string[] };
    permissions: PermissionRule[];
    allowedModules: string[];
  } | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserList = async () => {
      try {
        const res = await fetch("/api/admin/permissions");
        const data = await res.json();
        if (data.success) {
          setUsers(data.users);
        }
      } catch {
        console.error("Failed to load user list");
      }
    };
    loadUserList();
  }, []);

  const inspectUser = async (empCode: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/permissions?empCode=${empCode}`);
      const data = await res.json();
      if (data.success) {
        setInspectedData(data);
      }
    } catch {
      console.error("Inspect user failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmpCode) {
      inspectUser(selectedEmpCode);
    }
  }, [selectedEmpCode]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-lg space-y-2 border border-slate-700">
        <div className="flex items-center gap-2">
          <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/40">
            ADMIN TOOLKIT — PERMISSION INSPECTOR
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Công Cụ Kiểm Tra &amp; Giải Thích Nguồn Gốc Phân Quyền Nhân Viên
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
          Chọn bất kỳ nhân viên nào trong hệ thống để tra cứu danh sách Permission thực tế và nguồn gốc phân quyền (Source: Department / Position / Role / Project / Override).
        </p>
      </div>

      {/* Select Employee Dropdown */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <label className="block text-xs font-black uppercase text-slate-500">
          Chọn Nhân Viên Cần Tra Cứu Phân Quyền
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedEmpCode}
            onChange={(e) => setSelectedEmpCode(e.target.value)}
            className="flex-1 w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#006838] focus:bg-white"
          >
            {users.map((u) => (
              <option key={u.empCode} value={u.empCode}>
                [{u.empCode}] {u.name} — {u.title} ({u.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inspected Employee Details */}
      {inspectedData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* User Profile Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#006838] flex items-center justify-center font-black text-xl border border-emerald-300">
                {inspectedData.user.name.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  #{inspectedData.user.empCode}
                </span>
                <h3 className="text-base font-black text-slate-900">{inspectedData.user.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{inspectedData.user.title}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-bold text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Phòng ban:</span>
                <span className="text-slate-900">{inspectedData.user.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mã Role:</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-mono text-[10px]">
                  {inspectedData.user.roleCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Modules Đợt Render:</span>
                <span className="text-emerald-700 font-black">{inspectedData.allowedModules.length} Modules</span>
              </div>
            </div>
          </div>

          {/* Permissions Matrix & Source Explanation Table */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Ma Trận Phân Quyền Thực Tế &amp; Nguồn Gốc (Permission Source)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black text-[10px] uppercase">
                    <th className="p-3">Resource</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Data Scope</th>
                    <th className="p-3">Nguồn Gốc Cấp Quyền (Permission Source)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {inspectedData.permissions.map((perm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{perm.resource}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#006838] font-mono font-black text-[10px]">
                          {perm.action}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[10px]">
                          {perm.scope}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700 flex items-center gap-1.5">
                        <IconInfoCircle size={14} className="text-blue-500 shrink-0" />
                        <span>{perm.source}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
