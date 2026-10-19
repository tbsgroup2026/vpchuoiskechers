"use client";

// Kế hoạch sản xuất (KHSX) theo ngày: ngày lên chuyền may / gò của từng đơn.
// Là đầu vào của trung tâm phân phối để tính mốc đồng bộ vật tư (may trước 2 tuần, gò trước 1 tuần).

import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { fmtDMY } from "./engine";
import { scmApi } from "./client";
import type { Notify } from "./ScmModule";

type KhsxRow = {
  orderId: string;
  code: string;
  plant: string | null;
  line: string | null;
  style: string | null;
  qty: number;
  shipDate: string;
  sewStart: string | null;
  lastStart: string | null;
  note: string | null;
  suggestSewWeek: string | null;
  syncDueSew: string | null;
  syncDueLast: string | null;
  warnings: string[];
};
type KhsxResponse = { success: boolean; needSite?: boolean; rows: KhsxRow[]; missing: number; canEdit: boolean; today: string; syncSewDays: number; syncLastDays: number };

const btn = "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50";

/** Ô Excel (Date, số serial, chuỗi dd/mm/yyyy hoặc yyyy-mm-dd) → chuỗi dd/mm/yyyy cho server */
function cellToDay(v: unknown): string {
  if (v == null || v === "") return "";
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${String(v.getDate()).padStart(2, "0")}/${String(v.getMonth() + 1).padStart(2, "0")}/${v.getFullYear()}`;
  }
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${String(d.d).padStart(2, "0")}/${String(d.m).padStart(2, "0")}/${d.y}`;
  }
  return String(v).trim();
}

export default function ScmKhsx({ site, notify }: { site: string; notify: Notify }) {
  const [data, setData] = useState<KhsxResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Record<string, { sewStart: string; lastStart: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    if (!site) return;
    setLoading(true);
    try {
      const r = await scmApi<KhsxResponse>(`khsx?site=${encodeURIComponent(site)}`);
      setData(r);
      setDraft({});
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [site, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const list = data?.rows || [];
    const kw = q.trim().toUpperCase();
    return list.filter((r) => (!onlyMissing || !r.sewStart || !r.lastStart) && (!kw || `${r.code} ${r.style || ""} ${r.line || ""}`.toUpperCase().includes(kw)));
  }, [data, onlyMissing, q]);

  const valueOf = (r: KhsxRow) => draft[r.orderId] || { sewStart: r.sewStart || "", lastStart: r.lastStart || "" };
  const dirty = (r: KhsxRow) => {
    const d = draft[r.orderId];
    return Boolean(d && (d.sewStart !== (r.sewStart || "") || d.lastStart !== (r.lastStart || "")));
  };

  const save = async (r: KhsxRow) => {
    const v = valueOf(r);
    setSavingId(r.orderId);
    try {
      const res = await scmApi<{ success: boolean; warnings: string[] }>(`khsx/${encodeURIComponent(r.orderId)}`, { method: "PUT", body: { sewStart: v.sewStart, lastStart: v.lastStart, note: r.note } });
      notify(res.warnings.length ? "err" : "ok", res.warnings.length ? `Đã lưu ${r.code}: ${res.warnings.join(", ")}` : `Đã lưu KHSX đơn ${r.code}`);
      await load();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const downloadTemplate = () => {
    const sheetRows = (data?.rows || []).map((r) => ({
      "Mã đơn": r.code,
      "Chuyền": [r.plant, r.line].filter(Boolean).join(" / "),
      "Ngày xuất": fmtDMY(r.shipDate),
      "Ngày may (dd/mm/yyyy)": r.sewStart ? fmtDMY(r.sewStart) : "",
      "Ngày gò (dd/mm/yyyy)": r.lastStart ? fmtDMY(r.lastStart) : "",
      "Ghi chú": r.note || "",
    }));
    const ws = XLSX.utils.json_to_sheet(sheetRows.length ? sheetRows : [{ "Mã đơn": "", "Chuyền": "", "Ngày xuất": "", "Ngày may (dd/mm/yyyy)": "", "Ngày gò (dd/mm/yyyy)": "", "Ghi chú": "" }]);
    ws["!cols"] = [{ wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KHSX");
    XLSX.writeFile(wb, `KHSX_${site}.xlsx`);
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const pick = (r: Record<string, unknown>, re: RegExp) => {
        const k = Object.keys(r).find((x) => re.test(x.toLowerCase()));
        return k ? r[k] : "";
      };
      const payload = raw
        .map((r) => ({
          code: String(pick(r, /mã\s*đơn|ma\s*don|^code|order/) || "").trim(),
          sewStart: cellToDay(pick(r, /ngày\s*may|ngay\s*may/)),
          lastStart: cellToDay(pick(r, /ngày\s*gò|ngay\s*go/)),
          note: String(pick(r, /ghi\s*chú|ghi\s*chu|note/) || "").trim(),
        }))
        .filter((r) => r.code);
      if (payload.length === 0) throw new Error("Không đọc được dòng nào — cần cột Mã đơn, Ngày may, Ngày gò");
      const res = await scmApi<{ updated: number; notFoundCount: number; notFound: string[]; invalid: { code: string; reason: string }[] }>("khsx/import", { method: "POST", body: { site, rows: payload } });
      const extra = [
        res.notFoundCount ? `${res.notFoundCount} mã không có trong hệ thống (${res.notFound.slice(0, 5).join(", ")}${res.notFoundCount > 5 ? "…" : ""})` : "",
        res.invalid.length ? `${res.invalid.length} dòng sai ngày (${res.invalid.slice(0, 3).map((x) => x.code).join(", ")})` : "",
      ].filter(Boolean).join("; ");
      notify(extra ? "err" : "ok", `Đã cập nhật ${res.updated} đơn${extra ? ". " + extra : ""}`);
      await load();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const canEdit = Boolean(data?.canEdit);
  const dueTone = (d: string | null) => {
    if (!d || !data) return "text-slate-500";
    if (d < data.today) return "text-rose-700 font-bold";
    if (d <= data.today) return "text-amber-700 font-bold";
    return "text-slate-800";
  };

  return (
    <section id="khsx" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900">Kế hoạch sản xuất (KHSX) theo ngày</h3>
          <p className="mt-0.5 text-xs text-slate-600">
            Ngày lên chuyền may và gò của từng đơn. Trung tâm phân phối dùng để tính mốc đồng bộ vật tư: may trước {data?.syncSewDays ?? 14} ngày, gò trước {data?.syncLastDays ?? 7} ngày.
          </p>
          {data && data.missing > 0 && <p className="mt-1 text-xs font-bold text-amber-700">{data.missing} đơn chưa đủ ngày may / gò</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadTemplate} className={`${btn} border border-slate-200 text-slate-700`}>Tải file mẫu (kèm đơn hiện có)</button>
          {canEdit && (
            <label className={`${btn} cursor-pointer bg-[#006838] text-white`}>
              {importing ? "Đang nhập..." : "Nhập từ Excel"}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={importing} onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã đơn, mã giày, chuyền..." className="w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} /> Chỉ đơn thiếu KHSX
        </label>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[960px] text-xs">
          <thead className="bg-slate-50 text-left font-bold text-slate-600">
            <tr>
              <th className="p-2.5">Mã đơn</th>
              <th className="p-2.5">Chuyền</th>
              <th className="p-2.5">Ngày xuất</th>
              <th className="p-2.5">Ngày may</th>
              <th className="p-2.5">Ngày gò</th>
              <th className="p-2.5">Hạn đồng bộ may</th>
              <th className="p-2.5">Hạn đồng bộ gò</th>
              <th className="p-2.5">Lưu ý</th>
              {canEdit && <th className="p-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={9} className="p-4 text-center text-slate-500">Đang tải...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={9} className="p-4 text-center text-slate-500">Không có đơn phù hợp</td></tr>}
            {!loading && rows.map((r) => {
              const v = valueOf(r);
              return (
                <tr key={r.orderId}>
                  <td className="p-2.5">
                    <div className="font-mono font-bold text-slate-900">{r.code}</div>
                    {r.style && <div className="text-[11px] text-slate-500">{r.style}</div>}
                  </td>
                  <td className="p-2.5 text-slate-700">{[r.plant, r.line].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="p-2.5 font-mono">{fmtDMY(r.shipDate)}</td>
                  <td className="p-2.5">
                    {canEdit ? (
                      <input type="date" value={v.sewStart} onChange={(e) => setDraft((d) => ({ ...d, [r.orderId]: { ...v, sewStart: e.target.value } }))} className="rounded-lg border border-slate-200 px-2 py-1.5" />
                    ) : (
                      <span className="font-mono">{r.sewStart ? fmtDMY(r.sewStart) : "—"}</span>
                    )}
                    {!r.sewStart && r.suggestSewWeek && <div className="mt-1 text-[11px] text-slate-500">Phân bổ: tuần {fmtDMY(r.suggestSewWeek)}</div>}
                  </td>
                  <td className="p-2.5">
                    {canEdit ? (
                      <input type="date" value={v.lastStart} onChange={(e) => setDraft((d) => ({ ...d, [r.orderId]: { ...v, lastStart: e.target.value } }))} className="rounded-lg border border-slate-200 px-2 py-1.5" />
                    ) : (
                      <span className="font-mono">{r.lastStart ? fmtDMY(r.lastStart) : "—"}</span>
                    )}
                  </td>
                  <td className={`p-2.5 font-mono ${dueTone(r.syncDueSew)}`}>{r.syncDueSew ? fmtDMY(r.syncDueSew) : "—"}</td>
                  <td className={`p-2.5 font-mono ${dueTone(r.syncDueLast)}`}>{r.syncDueLast ? fmtDMY(r.syncDueLast) : "—"}</td>
                  <td className="p-2.5 text-[11px] text-amber-800">{r.warnings.join("; ") || <span className="text-emerald-700">Đủ</span>}</td>
                  {canEdit && (
                    <td className="p-2.5">
                      <button type="button" onClick={() => save(r)} disabled={!dirty(r) || savingId === r.orderId} className={`${btn} bg-[#006838] text-white`}>
                        {savingId === r.orderId ? "Đang lưu" : "Lưu"}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
