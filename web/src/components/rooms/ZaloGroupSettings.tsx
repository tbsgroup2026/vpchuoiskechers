"use client";

// Lễ Tân chọn nhóm Zalo nhận thông báo phòng họp:
// - Nhóm Lễ Tân: đơn đặt phòng mới, người đặt tự hủy lịch
// - Nhóm lịch đã xác nhận: lịch được Lễ Tân duyệt / bị từ chối
// Danh sách nhóm = các nhóm bot Zalo đã ghi nhận (bot có trong nhóm và nhóm đã có tin nhắn).

import React, { useEffect, useState } from "react";

type ZaloGroup = { id: string; name: string | null; updatedAt: string | null };

export default function ZaloGroupSettings() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<ZaloGroup[]>([]);
  const [receptionId, setReceptionId] = useState("");
  const [confirmedId, setConfirmedId] = useState("");
  const [botReady, setBotReady] = useState(true);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/rooms/zalo-groups", { headers: authHeaders(), cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không tải được cấu hình");
      setGroups(Array.isArray(data.groups) ? data.groups : []);
      setReceptionId(data.receptionGroupId || "");
      setConfirmedId(data.confirmedGroupId || "");
      setBotReady(Boolean(data.botReady));
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const save = async (sendTest: boolean) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/rooms/zalo-groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ receptionGroupId: receptionId || null, confirmedGroupId: confirmedId || null, sendTest }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.message || "Không lưu được");
      const testText = sendTest ? (data.tested ? " Đã gửi tin thử vào nhóm." : " Gửi tin thử không thành công — kiểm tra bot đã ở trong nhóm.") : "";
      setMsg({ text: `${data.message}.${testText}`, error: sendTest && !data.tested });
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    } finally {
      setSaving(false);
    }
  };

  const label = (g: ZaloGroup) => `${g.name || "Nhóm chưa có tên"} — ${g.id}`;
  const options = (current: string) => {
    const list = [...groups];
    if (current && !list.some((g) => g.id === current)) list.unshift({ id: current, name: "(nhóm đang cài)", updatedAt: null });
    return list;
  };

  return (
    <section className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span>
          <span className="block text-sm font-black text-slate-900">Nhóm Zalo nhận thông báo</span>
          <span className="block text-xs text-slate-600">Chọn nhóm nhận tin khi Lễ Tân duyệt hoặc từ chối lịch họp</span>
        </span>
        <span className="text-xs font-bold text-[#006838] shrink-0">{open ? "Thu gọn" : "Cài đặt"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {!botReady && (
            <p className="text-xs font-semibold p-2.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-900">
              Bot Zalo chưa được cấu hình trên máy chủ (thiếu ZALO_BOT_TOKEN) — chưa gửi được tin.
            </p>
          )}
          {loading ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : (
            <>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Nhóm nhận lịch đã duyệt / bị từ chối</span>
                <select
                  value={confirmedId}
                  onChange={(e) => setConfirmedId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">— Chưa chọn (gửi vào nhóm Lễ Tân) —</option>
                  {options(confirmedId).map((g) => (
                    <option key={g.id} value={g.id}>{label(g)}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Nhóm Lễ Tân (đơn đặt mới, người đặt tự hủy)</span>
                <select
                  value={receptionId}
                  onChange={(e) => setReceptionId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {options(receptionId).map((g) => (
                    <option key={g.id} value={g.id}>{label(g)}</option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-slate-600 leading-relaxed">
                Không thấy nhóm cần chọn? Thêm bot Zalo vào nhóm đó, gửi 1 tin nhắn bất kỳ trong nhóm, rồi bấm <b>Tải lại</b>.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => save(true)} disabled={saving} className="min-h-[40px] px-4 rounded-xl bg-[#006838] text-white text-xs font-black disabled:opacity-50">
                  {saving ? "Đang lưu..." : "Lưu và gửi tin thử"}
                </button>
                <button type="button" onClick={() => save(false)} disabled={saving} className="min-h-[40px] px-4 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold disabled:opacity-50">
                  Chỉ lưu
                </button>
                <button type="button" onClick={load} disabled={loading} className="min-h-[40px] px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold">
                  Tải lại
                </button>
              </div>
            </>
          )}
          {msg && (
            <p className={`text-xs font-semibold p-2.5 rounded-xl border ${msg.error ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>{msg.text}</p>
          )}
        </div>
      )}
    </section>
  );
}
