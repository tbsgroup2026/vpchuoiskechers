"use client";

import { useEffect, useState, use as usePromise } from "react";
import { DIRECTORIES, isDirectoryType, DirectoryType, DirectoryDef, DirectoryFieldDef } from "@/lib/directories";
import { IconPlus, IconTrash, IconEdit, IconLoader2 } from "@tabler/icons-react";

interface Row {
  id: number;
  [key: string]: unknown;
}

export default function DirectoryAdminPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = usePromise(params);

  if (!isDirectoryType(type)) {
    return <div className="text-red-600 font-bold">Danh mục không tồn tại: {type}</div>;
  }

  return <DirectoryTable type={type} />;
}

function DirectoryTable({ type }: { type: DirectoryType }) {
  const def: DirectoryDef = DIRECTORIES[type];
  const [rows, setRows] = useState<Row[]>([]);
  const [refData, setRefData] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/directories/${type}`);
    const data = await res.json();
    setRows(data.items || []);

    const refTypes = def.fields.filter((f: DirectoryFieldDef) => f.refType).map((f: DirectoryFieldDef) => f.refType!);
    const refEntries: Record<string, Row[]> = {};
    for (const rt of refTypes) {
      const r = await fetch(`/api/directories/${rt}`);
      const d = await r.json();
      refEntries[rt] = d.items || [];
    }
    setRefData(refEntries);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  function openAdd() {
    setEditing(null);
    const initial: Record<string, unknown> = {};
    for (const f of def.fields) initial[f.key] = f.type === "checkbox" ? false : "";
    setForm(initial);
    setError("");
    setShowModal(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    const initial: Record<string, unknown> = {};
    for (const f of def.fields) initial[f.key] = row[f.key];
    setForm(initial);
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = editing ? `/api/directories/${type}/${editing.id}` : `/api/directories/${type}`;
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Có lỗi xảy ra");
      return;
    }
    setShowModal(false);
    load();
  }

  async function handleDelete(row: Row) {
    if (!confirm(`Xoá "${row.name}"?`)) return;
    const res = await fetch(`/api/directories/${type}/${row.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Không thể xoá");
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-tbs-dark">Danh mục — {def.label}</h1>
          <p className="text-xs text-gray-500 mt-1">Quản lý dữ liệu combobox &quot;{def.label}&quot; dùng trong các biểu mẫu</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-light transition shadow-md inline-flex items-center gap-1.5">
          <IconPlus size={14} /> Thêm mục
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <IconLoader2 size={22} className="animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eef7f2] text-xs font-semibold text-tbs-dark uppercase border-b border-emerald-100">
                {def.fields.map((f: DirectoryFieldDef) => (
                  <th key={f.key} className="p-4">{f.label}</th>
                ))}
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={def.fields.length + 1} className="p-8 text-center text-gray-400">
                    Chưa có dữ liệu
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition">
                    {def.fields.map((f: DirectoryFieldDef) => (
                      <td key={f.key} className="p-4 font-semibold text-tbs-dark">
                        {f.type === "checkbox"
                          ? row[f.key]
                            ? "✔"
                            : "—"
                          : f.refType
                          ? String(refData[f.refType]?.find((r) => r.id === row[f.key])?.name ?? "—")
                          : String(row[f.key] ?? "")}
                      </td>
                    ))}
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => openEdit(row)} className="text-emerald-700 hover:underline inline-flex items-center gap-1">
                        <IconEdit size={12} /> Sửa
                      </button>
                      <button onClick={() => handleDelete(row)} className="text-red-500 hover:underline inline-flex items-center gap-1">
                        <IconTrash size={12} /> Xoá
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-tbs-dark">{editing ? "Sửa" : "Thêm"} {def.label}</h2>
            {error && <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">{error}</div>}
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              {def.fields.map((f: DirectoryFieldDef) => (
                <div key={f.key}>
                  <label className="block font-semibold mb-1">
                    {f.label} {f.required && "*"}
                  </label>
                  {f.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={!!form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                      className="rounded text-accent focus:ring-accent"
                    />
                  ) : f.type === "select" && f.refType ? (
                    <select
                      required={f.required}
                      value={(form[f.key] as string) ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value ? Number(e.target.value) : null })}
                      className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-accent"
                    >
                      <option value="">-- Chọn --</option>
                      {(refData[f.refType] || []).map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name as string}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required={f.required}
                      type="text"
                      value={(form[f.key] as string) ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-accent"
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold">
                  Hủy
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold hover:bg-accent-light">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
