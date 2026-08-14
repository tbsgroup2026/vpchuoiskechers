"use client";

import { useEffect, useState } from "react";
import { IconPlus, IconTrash, IconEdit, IconLoader2 } from "@tabler/icons-react";

interface OpsApp {
  id: number;
  department_id: number;
  name: string;
  description: string | null;
  icon: string;
  href: string | null;
  is_featured: number;
}

interface OpsDepartment {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  apps: OpsApp[];
}

const ICON_OPTIONS = ["app", "plane", "calendar"];

export default function OpsHubAdminPage() {
  const [departments, setDepartments] = useState<OpsDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  const [deptModal, setDeptModal] = useState<{ editing: OpsDepartment | null } | null>(null);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", imageUrl: "", sortOrder: 0 });

  const [appModal, setAppModal] = useState<{ editing: OpsApp | null } | null>(null);
  const [appForm, setAppForm] = useState({ name: "", description: "", icon: "app", href: "", isFeatured: false, sortOrder: 0 });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/ops-departments");
    const data = await res.json();
    setDepartments(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const selectedDept = departments.find((d) => d.id === selectedDeptId) || null;

  function openAddDept() {
    setDeptForm({ name: "", description: "", imageUrl: "", sortOrder: departments.length + 1 });
    setDeptModal({ editing: null });
  }
  function openEditDept(d: OpsDepartment) {
    setDeptForm({ name: d.name, description: d.description || "", imageUrl: d.image_url || "", sortOrder: d.sort_order });
    setDeptModal({ editing: d });
  }
  async function saveDept(e: React.FormEvent) {
    e.preventDefault();
    const editing = deptModal?.editing;
    const url = editing ? `/api/ops-departments/${editing.id}` : "/api/ops-departments";
    await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deptForm),
    });
    setDeptModal(null);
    load();
  }
  async function deleteDept(d: OpsDepartment) {
    if (!confirm(`Xoá phòng ban "${d.name}" và toàn bộ ứng dụng con?`)) return;
    await fetch(`/api/ops-departments/${d.id}`, { method: "DELETE" });
    if (selectedDeptId === d.id) setSelectedDeptId(null);
    load();
  }

  function openAddApp() {
    setAppForm({ name: "", description: "", icon: "app", href: "", isFeatured: false, sortOrder: (selectedDept?.apps.length || 0) + 1 });
    setAppModal({ editing: null });
  }
  function openEditApp(a: OpsApp) {
    setAppForm({ name: a.name, description: a.description || "", icon: a.icon, href: a.href || "", isFeatured: !!a.is_featured, sortOrder: 0 });
    setAppModal({ editing: a });
  }
  async function saveApp(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDept) return;
    const editing = appModal?.editing;
    const url = editing ? `/api/ops-apps/${editing.id}` : "/api/ops-apps";
    await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...appForm, departmentId: selectedDept.id }),
    });
    setAppModal(null);
    load();
  }
  async function deleteApp(a: OpsApp) {
    if (!confirm(`Xoá ứng dụng "${a.name}"?`)) return;
    await fetch(`/api/ops-apps/${a.id}`, { method: "DELETE" });
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <IconLoader2 size={22} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-tbs-dark">Phòng ban &amp; Ứng dụng (Trang chủ)</h1>
        <p className="text-xs text-gray-500 mt-1">Quản lý nội dung hiển thị ở khối &quot;Phòng ban &amp; công cụ điều hành&quot; trên trang chủ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-4 space-y-2 h-fit">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-500 uppercase">Phòng ban</span>
            <button onClick={openAddDept} className="p-1.5 rounded-lg bg-accent text-white hover:bg-accent-light"><IconPlus size={13} /></button>
          </div>
          {departments.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedDeptId(d.id)}
              className={`p-3 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition ${
                selectedDeptId === d.id ? "bg-accent-wash border border-accent/30" : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-tbs-dark truncate">{d.name}</div>
                <div className="text-[10px] text-gray-400">{d.apps.length} ứng dụng</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); openEditDept(d); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><IconEdit size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteDept(d); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><IconTrash size={12} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5">
          {!selectedDept ? (
            <div className="text-center py-16 text-gray-400 text-sm">Chọn 1 phòng ban để quản lý ứng dụng</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-tbs-dark">Ứng dụng của &quot;{selectedDept.name}&quot;</h2>
                <button onClick={openAddApp} className="px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-light inline-flex items-center gap-1.5">
                  <IconPlus size={13} /> Thêm ứng dụng
                </button>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                {selectedDept.apps.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">Chưa có ứng dụng nào</div>
                ) : (
                  selectedDept.apps.map((a) => (
                    <div key={a.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-tbs-dark">{a.name}</div>
                        <div className="text-gray-500">{a.description || "—"} {a.href && <span className="text-accent font-mono ml-1">({a.href})</span>}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEditApp(a)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><IconEdit size={12} /></button>
                        <button onClick={() => deleteApp(a)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><IconTrash size={12} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {deptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-tbs-dark">{deptModal.editing ? "Sửa" : "Thêm"} phòng ban</h2>
            <form onSubmit={saveDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Tên phòng ban *</label>
                <input required value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mô tả</label>
                <textarea rows={2} value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Ảnh banner (đường dẫn trong /public)</label>
                <input value={deptForm.imageUrl} onChange={(e) => setDeptForm({ ...deptForm, imageUrl: e.target.value })} placeholder="/images/KGLV/Tên ảnh.png" className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-accent" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setDeptModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-light">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {appModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-tbs-dark">{appModal.editing ? "Sửa" : "Thêm"} ứng dụng</h2>
            <form onSubmit={saveApp} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Tên ứng dụng *</label>
                <input required value={appForm.name} onChange={(e) => setAppForm({ ...appForm, name: e.target.value })} className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mô tả</label>
                <textarea rows={2} value={appForm.description} onChange={(e) => setAppForm({ ...appForm, description: e.target.value })} className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Icon</label>
                <select value={appForm.icon} onChange={(e) => setAppForm({ ...appForm, icon: e.target.value })} className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-accent">
                  {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Đường dẫn (href, để trống nếu chưa có trang)</label>
                <input value={appForm.href} onChange={(e) => setAppForm({ ...appForm, href: e.target.value })} placeholder="/business-trip" className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-accent" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={appForm.isFeatured} onChange={(e) => setAppForm({ ...appForm, isFeatured: e.target.checked })} className="rounded text-accent focus:ring-accent" />
                <span className="font-semibold">Hiển thị ở &quot;Ứng dụng thường dùng&quot;</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAppModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-light">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
