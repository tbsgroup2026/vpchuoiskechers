"use client";

// Kho thực tế: phiếu kiểm hàng (hàng về / kiểm kê tồn), vị trí Kho → Khu → Kệ → Tầng → Ô, tra cứu, phân quyền.
// Dữ liệu và quyền do API /api/warehouse/* quyết định; giao diện chỉ ẩn nút theo quyền trả về.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  IconArrowLeft,
  IconBarcode,
  IconCamera,
  IconCheck,
  IconClipboardCheck,
  IconDownload,
  IconEdit,
  IconMapPin,
  IconPlus,
  IconPrinter,
  IconRefresh,
  IconSearch,
  IconShieldLock,
  IconTrash,
  IconTruckDelivery,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { getCurrentUser } from "@/lib/userProfiles";
import BarcodeScanner from "@/modules/warehouse/BarcodeScanner";
import { downloadTemplate, exportRows, parseWarehouseFile, type WarehouseRow } from "@/modules/warehouse/importFile";

/* ───────────────────────── kiểu dữ liệu & tiện ích ───────────────────────── */

type Role = "ADMIN" | "MANAGER" | "EDITOR" | "VIEWER";
interface Me { role: Role; isManager: boolean; canEditLocations: boolean; empCode: string; name: string }
interface Location { code: string; warehouse: string; zone?: string; rack?: string; tier?: string; bin?: string; note?: string; item_count?: number; total_qty?: number }
interface Session {
  id: string; type: "RECEIVING" | "STOCKTAKE"; title: string; ref_no?: string; scope?: string; status: "OPEN" | "SUBMITTED" | "APPROVED";
  created_by_name?: string; created_at?: string; approved_by_name?: string; approved_at?: string;
  line_count?: number; counted_lines?: number; diff_lines?: number; expected_total?: number; counted_total?: number;
}
interface Line { item_code: string; location_code: string; name?: string; unit_label?: string; expected_qty: number; counted_qty: number; in_list: number }
interface Scan { id: number; item_code: string; location_code?: string; qty: number; mode: string; emp_name?: string; at: string }
interface StockRow { item_code: string; location_code: string; qty: number; name?: string; unit?: string; updated_at?: string }
interface RoleRow { emp_code: string; role: "MANAGER" | "EDITOR"; emp_name?: string; granted_by?: string; granted_at?: string }

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function api<T = Record<string, unknown>>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/warehouse/${path}`, {
    method: init?.method || "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new ApiError(json.message || json.error || `Lỗi ${res.status}`, res.status);
  return json as T;
}

const fmtNum = (n: unknown) => Number(n || 0).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
const fmtTime = (s?: string) => (s ? new Date(s.replace(" ", "T") + "Z").toLocaleString("vi-VN", { hour12: false }) : "");
const LOC_LABELS = ["Kho", "Khu", "Kệ", "Tầng", "Ô"];

function locLabel(code: string, map: Map<string, Location>): string {
  if (!code) return "Chưa xếp vị trí";
  const l = map.get(code);
  if (!l) return code;
  return [l.warehouse, l.zone, l.rack, l.tier, l.bin]
    .map((v, i) => (v ? `${LOC_LABELS[i]} ${v}` : ""))
    .filter(Boolean)
    .join(" · ");
}

const ROLE_LABEL: Record<Role, string> = { ADMIN: "Admin", MANAGER: "Quản lý kho", EDITOR: "Được sửa vị trí", VIEWER: "Chỉ xem & quét đếm" };
const STATUS_LABEL: Record<Session["status"], { text: string; cls: string }> = {
  OPEN: { text: "Đang đếm", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  SUBMITTED: { text: "Chờ duyệt", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  APPROVED: { text: "Đã duyệt", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const btn = "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = `${btn} bg-emerald-700 text-white hover:bg-emerald-800`;
const btnGhost = `${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const btnDanger = `${btn} border border-red-200 bg-white text-red-600 hover:bg-red-50`;
const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

function Notice({ msg, onClose }: { msg: { kind: "ok" | "err"; text: string } | null; onClose: () => void }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 max-w-[92vw] rounded-xl px-4 py-3 text-sm font-semibold shadow-lg flex items-start gap-3 ${msg.kind === "ok" ? "bg-emerald-700 text-white" : "bg-red-600 text-white"}`} role="status">
      <span className="whitespace-pre-line">{msg.text}</span>
      <button type="button" onClick={onClose} aria-label="Đóng"><IconX size={16} /></button>
    </div>
  );
}

/* ───────────────────────── trang chính ───────────────────────── */

type Tab = "sessions" | "locations" | "lookup" | "roles";

export default function WarehousePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [tab, setTab] = useState<Tab>("sessions");
  const [locations, setLocations] = useState<Location[]>([]);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const notify = useCallback((kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    if (kind === "ok") setTimeout(() => setMsg((m) => (m?.text === text ? null : m)), 3500);
  }, []);
  const locMap = useMemo(() => new Map(locations.map((l) => [l.code, l])), [locations]);

  const loadLocations = useCallback(async () => {
    const r = await api<{ locations: Location[] }>("locations");
    setLocations(r.locations);
  }, []);

  useEffect(() => {
    if (!getCurrentUser()) {
      window.location.href = "/login?redirect=/warehouse";
      return;
    }
    api<Me & { success: boolean }>("me")
      .then((r) => setMe(r))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) window.location.href = "/login?redirect=/warehouse";
        else notify("err", e.message);
      });
    loadLocations().catch(() => {});
  }, [loadLocations, notify]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { key: "sessions", label: "Phiếu kiểm hàng", icon: <IconClipboardCheck size={16} />, show: true },
    { key: "locations", label: "Vị trí & tồn kho", icon: <IconMapPin size={16} />, show: true },
    { key: "lookup", label: "Tra cứu", icon: <IconSearch size={16} />, show: true },
    { key: "roles", label: "Phân quyền", icon: <IconShieldLock size={16} />, show: Boolean(me?.isManager) },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/work" className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50" aria-label="Quay lại">
            <IconArrowLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-black">Kho · Kiểm hàng & vị trí</h1>
            <p className="truncate text-xs text-slate-500">Kế hoạch chuẩn bị & Trung tâm phân phối</p>
          </div>
          {me ? (
            <span className="hidden sm:inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              {me.name} · {ROLE_LABEL[me.role]}
            </span>
          ) : null}
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2" aria-label="Chức năng kho">
          {tabs.filter((t) => t.show).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${tab === t.key ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 pb-24">
        {!me ? (
          <p className="py-16 text-center text-sm text-slate-500">Đang tải…</p>
        ) : tab === "sessions" ? (
          <SessionsTab me={me} locMap={locMap} locations={locations} notify={notify} />
        ) : tab === "locations" ? (
          <LocationsTab me={me} locations={locations} reload={loadLocations} notify={notify} />
        ) : tab === "lookup" ? (
          <LookupTab locMap={locMap} notify={notify} />
        ) : (
          <RolesTab me={me} notify={notify} />
        )}
      </main>
      <Notice msg={msg} onClose={() => setMsg(null)} />
    </div>
  );
}

type Notify = (kind: "ok" | "err", text: string) => void;

/* ───────────────────────── phiếu kiểm hàng ───────────────────────── */

function SessionsTab({ me, locMap, locations, notify }: { me: Me; locMap: Map<string, Location>; locations: Location[]; notify: Notify }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [scanNow, setScanNow] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<{ sessions: Session[] }>("sessions");
      setSessions(r.sessions);
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  if (openId) {
    return <SessionDetail id={openId} me={me} locMap={locMap} locations={locations} notify={notify} autoCamera={scanNow} onBack={() => { setOpenId(null); setScanNow(false); load(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-black">Phiếu kiểm hàng</h2>
        <div className="flex gap-2">
          <button type="button" className={btnGhost} onClick={load}><IconRefresh size={14} /> Tải lại</button>
          {me.canEditLocations ? (
            <button type="button" className={btnPrimary} onClick={() => setCreating(true)}><IconPlus size={14} /> Tạo phiếu</button>
          ) : null}
        </div>
      </div>

      {sessions.some((s) => s.status === "OPEN") ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-black text-emerald-900"><IconBarcode size={18} /> Quét đếm ngay</p>
          <div className="flex flex-wrap gap-2">
            {sessions.filter((s) => s.status === "OPEN").slice(0, 4).map((s) => (
              <button
                key={s.id}
                type="button"
                className={btnPrimary}
                onClick={() => { setScanNow(true); setOpenId(s.id); }}
              >
                <IconCamera size={14} /> {s.type === "RECEIVING" ? "Kiểm hàng về" : "Kiểm kê"}: {s.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {creating ? <CreateSessionForm notify={notify} onDone={(id) => { setCreating(false); if (id) setOpenId(id); else load(); }} /> : null}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Đang tải…</p>
      ) : sessions.length === 0 ? (
        <div className={`${card} text-center text-sm text-slate-500`}>
          Chưa có phiếu kiểm nào.{me.canEditLocations ? " Bấm “Tạo phiếu” để bắt đầu." : " Quản lý kho sẽ tạo phiếu để bạn quét đếm."}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sessions.map((s) => {
            const pct = s.line_count ? Math.round(((s.counted_lines || 0) / s.line_count) * 100) : 0;
            return (
              <button key={s.id} type="button" onClick={() => setOpenId(s.id)} className={`${card} text-left hover:border-emerald-300`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      {s.type === "RECEIVING" ? <IconTruckDelivery size={14} /> : <IconClipboardCheck size={14} />}
                      {s.type === "RECEIVING" ? "Kiểm hàng về" : "Kiểm kê tồn kho"} · {s.id}
                    </p>
                    <p className="mt-1 truncate text-sm font-black">{s.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {s.ref_no ? `Số phiếu/PO: ${s.ref_no} · ` : ""}{s.scope ? `Phạm vi: ${s.scope} · ` : ""}{s.created_by_name} · {fmtTime(s.created_at)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_LABEL[s.status].cls}`}>{STATUS_LABEL[s.status].text}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-600">
                  Đã đếm {s.counted_lines || 0}/{s.line_count || 0} dòng · Thực đếm {fmtNum(s.counted_total)} / sổ sách {fmtNum(s.expected_total)}
                  {s.diff_lines ? <span className="font-bold text-red-600"> · {s.diff_lines} dòng lệch</span> : null}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateSessionForm({ notify, onDone }: { notify: Notify; onDone: (id?: string) => void }) {
  const [type, setType] = useState<Session["type"]>("RECEIVING");
  const [title, setTitle] = useState("");
  const [refNo, setRefNo] = useState("");
  const [scope, setScope] = useState("");
  const [rows, setRows] = useState<WarehouseRow[] | null>(null);
  const [fileInfo, setFileInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      const r = await parseWarehouseFile(f);
      if (!r.matched.includes("itemCode")) throw new Error("Không thấy cột Mã hàng/Barcode trong file. Hãy dùng file mẫu.");
      setRows(r.rows);
      setFileInfo(`${f.name}: ${r.rows.length} dòng · cột nhận diện: ${r.matched.join(", ")}${r.unmatched.length ? ` · bỏ qua: ${r.unmatched.join(", ")}` : ""}`);
    } catch (e) {
      setRows(null);
      setFileInfo("");
      notify("err", (e as Error).message);
    }
  };

  const submit = async () => {
    if (type === "RECEIVING" && !rows?.length && !confirm("Chưa có file danh sách hàng về. Tạo phiếu trống và chỉ quét đếm?")) return;
    setBusy(true);
    try {
      const r = await api<{ id: string; lines: number; failed: number; errors: { row: number; reason: string }[] }>("sessions", {
        method: "POST",
        body: { type, title, refNo, scope, rows: rows || [] },
      });
      notify("ok", `Đã tạo phiếu ${r.id} với ${r.lines} dòng${r.failed ? `; ${r.failed} dòng lỗi (ví dụ dòng ${r.errors[0]?.row}: ${r.errors[0]?.reason})` : ""}`);
      onDone(r.id);
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${card} space-y-3 border-emerald-200`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black">Tạo phiếu kiểm</h3>
        <button type="button" onClick={() => onDone()} aria-label="Đóng" className="text-slate-400 hover:text-slate-700"><IconX size={18} /></button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {(["RECEIVING", "STOCKTAKE"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-xl border p-3 text-left ${type === t ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}
          >
            <p className="flex items-center gap-1.5 text-sm font-black">
              {t === "RECEIVING" ? <IconTruckDelivery size={16} /> : <IconClipboardCheck size={16} />}
              {t === "RECEIVING" ? "Kiểm hàng vừa về" : "Kiểm kê đối chiếu tồn kho"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {t === "RECEIVING"
                ? "Import phiếu nhập/packing list (số lượng dự kiến), quét đếm thực nhận, duyệt để cộng vào tồn theo vị trí cất."
                : "Lấy tồn sổ sách hiện tại (hoặc import file tồn), quét vị trí rồi quét hàng, duyệt để cập nhật tồn theo số thực đếm."}
            </p>
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs font-bold text-slate-600">Tên phiếu
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "RECEIVING" ? "VD: Hàng về NCC ABC 16/10" : "VD: Kiểm kê Kho 1 khu A"} />
        </label>
        <label className="text-xs font-bold text-slate-600">{type === "RECEIVING" ? "Số phiếu nhập / PO" : "Ghi chú số tham chiếu"}
          <input className={input} value={refNo} onChange={(e) => setRefNo(e.target.value)} />
        </label>
        {type === "STOCKTAKE" ? (
          <label className="text-xs font-bold text-slate-600">Phạm vi vị trí (để trống = toàn kho)
            <input className={input} value={scope} onChange={(e) => setScope(e.target.value.toUpperCase())} placeholder="VD: KHO1-A hoặc KHO1-A-K01" />
          </label>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className={`${btnGhost} cursor-pointer`}>
          <IconUpload size={14} /> {type === "RECEIVING" ? "Import danh sách hàng về" : "Import file tồn (không bắt buộc)"}
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <button type="button" className={btnGhost} onClick={() => downloadTemplate(type === "RECEIVING" ? "receiving" : "stock")}>
          <IconDownload size={14} /> Tải file mẫu
        </button>
        {rows ? <button type="button" className="text-xs text-red-600 underline" onClick={() => { setRows(null); setFileInfo(""); }}>Bỏ file</button> : null}
      </div>
      {fileInfo ? <p className="text-xs text-slate-600">{fileInfo}</p> : null}
      {type === "STOCKTAKE" && !rows ? <p className="text-xs text-slate-500">Không import file: số sổ sách lấy từ tồn kho hiện tại trên hệ thống trong phạm vi đã chọn.</p> : null}
      <div className="flex justify-end">
        <button type="button" className={btnPrimary} disabled={busy} onClick={submit}><IconCheck size={14} /> {busy ? "Đang tạo…" : "Tạo phiếu"}</button>
      </div>
    </div>
  );
}

type LineFilter = "all" | "pending" | "diff" | "ok" | "extra";

/** Mã vừa quét đang chờ xác nhận */
interface PendingScan {
  code: string;
  name: string;
  unit: string;
  expected: number;
  counted: number;
  inList: boolean;
  /** Vị trí hiện tại của dòng trong phiếu (null: mã chưa có trong phiếu) */
  fromLocation: string | null;
  received: string;
  location: string;
}

/** Kệ = Kho-Khu-Kệ; Ô = Tầng-Ô trong kệ đó */
const rackKeyOf = (l: Location) => [l.warehouse, l.zone, l.rack].filter(Boolean).join("-");
const binLabelOf = (l: Location) => [l.tier && `Tầng ${l.tier}`, l.bin && `Ô ${l.bin}`].filter(Boolean).join(" · ") || l.code;

function ScanConfirm({ value, type, locations, busy, onChange, onSave, onCancel }: {
  value: PendingScan;
  type: Session["type"];
  locations: Location[];
  busy: boolean;
  onChange: (v: PendingScan) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const racks = useMemo(() => Array.from(new Set(locations.map(rackKeyOf))).filter(Boolean).sort(), [locations]);
  const cur = locations.find((l) => l.code === value.location);
  const [rack, setRack] = useState(cur ? rackKeyOf(cur) : "");
  const bins = locations.filter((l) => rackKeyOf(l) === rack);
  const qtyRef = useRef<HTMLInputElement>(null);
  useEffect(() => { qtyRef.current?.focus(); qtyRef.current?.select(); }, []);
  const receiving = type === "RECEIVING";
  const received = Number(value.received);
  const over = receiving && value.expected > 0 && received > value.expected;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 sm:items-center" role="dialog" aria-modal="true" aria-label="Xác nhận mã vừa quét">
      <form
        className="w-full max-w-md space-y-3 rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl"
        onSubmit={(e) => { e.preventDefault(); onSave(); }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Mã hàng</p>
            <p className="break-all font-mono text-lg font-black text-slate-900">{value.code}</p>
            <p className="text-xs text-slate-500">{value.name || (value.inList ? "" : "Mã ngoài danh sách phiếu")}{value.unit ? ` · ${value.unit}` : ""}</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600" aria-label="Bỏ qua mã này">Bỏ qua</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-bold text-slate-500">{receiving ? "SL đặt" : "Tồn sổ sách"}</p>
            <p className="text-xl font-black tabular-nums text-slate-900">{fmtNum(value.expected)}</p>
            {value.counted > 0 ? <p className="text-[11px] text-slate-500">Đã ghi trước: {fmtNum(value.counted)}</p> : null}
          </div>
          <label className="rounded-2xl border-2 border-emerald-300 px-3 py-2">
            <span className="text-[11px] font-bold text-emerald-800">{receiving ? "SL nhận" : "SL thực đếm"}</span>
            <input
              ref={qtyRef}
              className="w-full bg-transparent text-xl font-black tabular-nums text-slate-900 outline-none"
              value={value.received}
              onChange={(e) => onChange({ ...value, received: e.target.value })}
              inputMode="decimal"
              aria-label={receiving ? "Số lượng nhận" : "Số lượng thực đếm"}
            />
          </label>
        </div>
        {over ? <p className="text-xs font-bold text-amber-700">Nhận nhiều hơn số đặt {fmtNum(received - value.expected)}</p> : null}

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500">Kệ</span>
            <select
              className={input}
              value={rack}
              onChange={(e) => { setRack(e.target.value); onChange({ ...value, location: "" }); }}
              aria-label="Kệ"
            >
              <option value="">{receiving ? "Chưa xếp" : "Chọn kệ"}</option>
              {racks.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500">Ô</span>
            <select
              className={input}
              value={value.location}
              onChange={(e) => onChange({ ...value, location: e.target.value })}
              disabled={!rack}
              aria-label="Ô"
            >
              <option value="">{rack ? "Chọn ô" : "Chọn kệ trước"}</option>
              {bins.map((l) => <option key={l.code} value={l.code}>{binLabelOf(l)}</option>)}
            </select>
          </label>
        </div>
        {rack && !value.location ? <p className="text-xs text-amber-700">Chọn ô trong kệ {rack}, hoặc để trống kệ nếu chưa xếp.</p> : null}

        <button type="submit" className={`${btnPrimary} w-full justify-center py-3 text-base`} disabled={busy || (Boolean(rack) && !value.location)}>
          <IconCheck size={18} /> {busy ? "Đang lưu…" : "Lưu / scan tiếp"}
        </button>
      </form>
    </div>
  );
}

function SessionDetail({ id, me, locMap, locations, notify, autoCamera, onBack }: { id: string; me: Me; locMap: Map<string, Location>; locations: Location[]; notify: Notify; autoCamera?: boolean; onBack: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [currentLoc, setCurrentLoc] = useState("");
  const [qty, setQty] = useState("1");
  const [mode, setMode] = useState<"add" | "set">("add");
  const [codeInput, setCodeInput] = useState("");
  const [camera, setCamera] = useState(Boolean(autoCamera));
  const [last, setLast] = useState<{ ok: boolean; text: string; sub?: string } | null>(null);
  const [filter, setFilter] = useState<LineFilter>("all");
  const [search, setSearch] = useState("");
  const [defaultLoc, setDefaultLoc] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingScan | null>(null);
  const [confirmEach, setConfirmEach] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const queue = useRef(Promise.resolve());
  const linesRef = useRef<Line[]>([]);
  // Mã vừa lưu/bỏ qua: camera bỏ qua mã này vài giây để không mở lại ngay khi còn chĩa vào món hàng
  const doneRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  linesRef.current = lines;

  // Nhớ lựa chọn "xác nhận sau mỗi lần quét" theo từng máy
  useEffect(() => {
    try { if (localStorage.getItem("wh_confirm_each") === "0") setConfirmEach(false); } catch {}
  }, []);
  const toggleConfirmEach = (v: boolean) => {
    setConfirmEach(v);
    try { localStorage.setItem("wh_confirm_each", v ? "1" : "0"); } catch {}
  };

  const load = useCallback(async () => {
    try {
      const r = await api<{ session: Session; lines: Line[]; scans: Scan[] }>(`sessions/${encodeURIComponent(id)}`);
      setSession(r.session);
      setLines(r.lines);
      setScans(r.scans);
    } catch (e) {
      notify("err", (e as Error).message);
    }
  }, [id, notify]);

  useEffect(() => { load(); }, [load]);

  const open = session?.status === "OPEN";

  // Mỗi mã quét được xử lý tuần tự để số đếm không bị lệch khi quét nhanh
  const handleCode = useCallback((raw: string) => {
    const c = raw.trim().toUpperCase().replace(/\s+/g, "");
    if (!c) return;
    queue.current = queue.current.then(async () => {
      if (locMap.has(c)) {
        setCurrentLoc(c);
        setLast({ ok: true, text: `Vị trí hiện tại: ${c}`, sub: locLabel(c, locMap) });
        return;
      }
      try {
        const r = await api<{ line: Line; outOfList: boolean; expectedAt: { location_code: string; qty: number }[] }>(`sessions/${encodeURIComponent(id)}/scan`, {
          method: "POST",
          body: { itemCode: c, locationCode: currentLoc, qty: Number(qty) || 1, mode },
        });
        const l = r.line;
        setLines((prev) => {
          const i = prev.findIndex((x) => x.item_code === l.item_code && x.location_code === l.location_code);
          const next = [...prev];
          if (i >= 0) next[i] = { ...next[i], counted_qty: l.counted_qty };
          else next.unshift({ ...l, in_list: 0 });
          return next;
        });
        const diff = Number(l.counted_qty) - Number(l.expected_qty);
        const warn = r.outOfList
          ? r.expectedAt.length
            ? `Sai vị trí? Sổ sách ở: ${r.expectedAt.map((x) => `${x.location_code} (${fmtNum(x.qty)})`).join(", ")}`
            : "Mã ngoài danh sách phiếu"
          : diff === 0 ? "Đủ số lượng" : diff > 0 ? `Thừa ${fmtNum(diff)}` : `Còn thiếu ${fmtNum(-diff)}`;
        const at = l.location_code ? ` · tại ${l.location_code}` : " · chưa gắn vị trí";
        setLast({ ok: !r.outOfList, text: `${l.item_code} · ${l.name || ""}`, sub: `Đếm ${fmtNum(l.counted_qty)} / sổ ${fmtNum(l.expected_qty)} ${l.unit_label || ""}${at} · ${warn}` });
        if (r.outOfList) { try { navigator.vibrate?.([80, 60, 80]); } catch {} }
        if (mode === "set") setMode("add");
      } catch (e) {
        setLast({ ok: false, text: (e as Error).message });
      }
    });
  }, [currentLoc, id, locMap, mode, qty]);

  /** Mã vừa quét: mã vị trí thì đổi vị trí đang đếm; mã hàng thì mở màn xác nhận (hoặc ghi ngay nếu tắt xác nhận) */
  const onScanned = (raw: string) => {
    const c = raw.trim().toUpperCase().replace(/\s+/g, "");
    if (!c) return;
    if (!confirmEach || locMap.has(c)) {
      handleCode(c);
      return;
    }
    const all = linesRef.current.filter((l) => l.item_code === c);
    const line = all.find((l) => l.location_code === currentLoc) || all.find((l) => Number(l.counted_qty) < Number(l.expected_qty)) || all[0] || null;
    const counted = Number(line?.counted_qty || 0);
    const expected = Number(line?.expected_qty || 0);
    setPending({
      code: c,
      name: line?.name || "",
      unit: line?.unit_label || "",
      expected,
      counted,
      inList: Boolean(line && Number(line.in_list)),
      fromLocation: line ? line.location_code : null,
      received: String(counted > 0 ? counted + (Number(qty) || 1) : expected > 0 ? expected : Number(qty) || 1),
      location: line?.location_code || currentLoc,
    });
  };

  const submitInput = (e: React.FormEvent) => {
    e.preventDefault();
    onScanned(codeInput);
    setCodeInput("");
    inputRef.current?.focus();
  };

  const savePending = async () => {
    if (!pending) return;
    const received = Number(pending.received);
    if (!Number.isFinite(received) || received < 0) {
      notify("err", "Số lượng nhận phải là số ≥ 0");
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ line: Line; outOfList: boolean }>(`sessions/${encodeURIComponent(id)}/scan`, {
        method: "POST",
        body: {
          itemCode: pending.code,
          locationCode: pending.location,
          qty: received,
          mode: "set",
          ...(session?.type === "RECEIVING" && pending.fromLocation !== null ? { fromLocation: pending.fromLocation } : {}),
        },
      });
      const l = r.line;
      const diff = Number(l.counted_qty) - Number(l.expected_qty);
      const status = r.outOfList ? "Mã ngoài danh sách phiếu" : diff === 0 ? "Đủ số lượng" : diff > 0 ? `Thừa ${fmtNum(diff)}` : `Còn thiếu ${fmtNum(-diff)}`;
      setLast({
        ok: !r.outOfList,
        text: `Đã lưu ${l.item_code}${l.name ? ` · ${l.name}` : ""}`,
        sub: `${fmtNum(l.counted_qty)} / ${fmtNum(l.expected_qty)} ${l.unit_label || ""} · ${l.location_code ? `tại ${l.location_code}` : "chưa gắn vị trí"} · ${status}`,
      });
      if (pending.location) setCurrentLoc(pending.location);
      doneRef.current = { code: pending.code, at: Date.now() };
      setPending(null);
      await load();
      inputRef.current?.focus();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const act = async (path: string, body?: unknown, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    try {
      await api(`sessions/${encodeURIComponent(id)}${path}`, { method: path ? "POST" : "DELETE", body });
      notify("ok", "Đã cập nhật phiếu");
      if (!path) onBack();
      else load();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const stats = useMemo(() => {
    const s = { all: lines.length, pending: 0, diff: 0, ok: 0, extra: 0 };
    lines.forEach((l) => {
      if (!Number(l.in_list)) s.extra++;
      if (Number(l.counted_qty) === 0 && Number(l.expected_qty) !== 0) s.pending++;
      else if (Number(l.counted_qty) === Number(l.expected_qty)) s.ok++;
      if (Number(l.counted_qty) !== Number(l.expected_qty) && Number(l.counted_qty) !== 0) s.diff++;
    });
    return s;
  }, [lines]);

  const shown = useMemo(() => {
    const q = search.trim().toUpperCase();
    return lines.filter((l) => {
      const c = Number(l.counted_qty), e = Number(l.expected_qty);
      if (filter === "pending" && !(c === 0 && e !== 0)) return false;
      if (filter === "diff" && !(c !== e && c !== 0)) return false;
      if (filter === "ok" && c !== e) return false;
      if (filter === "extra" && Number(l.in_list)) return false;
      if (q && !l.item_code.includes(q) && !(l.name || "").toUpperCase().includes(q) && !l.location_code.includes(q)) return false;
      return true;
    });
  }, [lines, filter, search]);

  const exportResult = () =>
    exportRows(`ket_qua_${id}.xlsx`, ["Mã hàng", "Tên hàng", "ĐVT", "Vị trí", "Sổ sách", "Thực đếm", "Chênh lệch", "Ngoài danh sách"],
      lines.map((l) => [l.item_code, l.name || "", l.unit_label || "", l.location_code, Number(l.expected_qty), Number(l.counted_qty), Number(l.counted_qty) - Number(l.expected_qty), Number(l.in_list) ? "" : "Có"]));

  if (!session) return <p className="py-10 text-center text-sm text-slate-500">Đang tải phiếu…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <button type="button" onClick={onBack} className="mb-1 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"><IconArrowLeft size={14} /> Danh sách phiếu</button>
          <h2 className="text-base font-black">{session.title}</h2>
          <p className="text-xs text-slate-500">
            {session.type === "RECEIVING" ? "Kiểm hàng về" : "Kiểm kê tồn kho"} · {session.id}
            {session.ref_no ? ` · Số phiếu/PO ${session.ref_no}` : ""}{session.scope ? ` · Phạm vi ${session.scope}` : ""}
            {session.approved_at ? ` · Duyệt bởi ${session.approved_by_name} lúc ${fmtTime(session.approved_at)}` : ""}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_LABEL[session.status].cls}`}>{STATUS_LABEL[session.status].text}</span>
      </div>

      {open ? (
        <div className={`${card} space-y-3`}>
          {session.type === "STOCKTAKE" || currentLoc ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-600">Vị trí đang đếm:</span>
              {currentLoc ? (
                <span className="rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-800">{currentLoc} · {locLabel(currentLoc, locMap)}</span>
              ) : (
                <span className="text-slate-500">Không bắt buộc. Quét nhãn vị trí hoặc chọn bên cạnh để đếm theo từng ô</span>
              )}
              <select className="rounded-lg border border-slate-200 px-2 py-1" value={currentLoc} onChange={(e) => setCurrentLoc(e.target.value)} aria-label="Chọn vị trí">
                <option value="">Không gắn vị trí</option>
                {locations.filter((l) => !session.scope || l.code.startsWith(session.scope)).map((l) => (
                  <option key={l.code} value={l.code}>{l.code}</option>
                ))}
              </select>
            </div>
          ) : null}
          <form onSubmit={submitInput} className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <IconBarcode size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                autoFocus
                className={`${input} pl-9 text-base`}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Quét bằng súng bắn mã hoặc gõ mã rồi Enter"
                inputMode="text"
                autoComplete="off"
              />
            </div>
            <input className={`${input} w-24`} value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" aria-label="Số lượng mỗi lần quét" title="Số lượng mỗi lần quét" />
            <select className="rounded-xl border border-slate-200 px-2 text-xs font-bold" value={mode} onChange={(e) => setMode(e.target.value as "add" | "set")} aria-label="Cách ghi số">
              <option value="add">Cộng dồn</option>
              <option value="set">Ghi đè (1 lần)</option>
            </select>
            <button type="submit" className={btnPrimary}><IconCheck size={14} /> Ghi</button>
            <button type="button" className={btnGhost} onClick={() => setCamera((v) => !v)}><IconCamera size={14} /> {camera ? "Tắt camera" : "Mở camera"}</button>
          </form>
          {camera ? (
            <BarcodeScanner
              paused={Boolean(pending)}
              onDetected={(c) => {
                if (c.trim().toUpperCase() === doneRef.current.code && Date.now() - doneRef.current.at < 3000) return;
                // Điền mã vào ô nhập như súng bắn mã rồi xử lý (tương đương bấm Enter)
                setCodeInput(c);
                onScanned(c);
                setTimeout(() => setCodeInput((v) => (v === c ? "" : v)), 1200);
              }}
              onClose={() => setCamera(false)}
            />
          ) : null}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={confirmEach} onChange={(e) => toggleConfirmEach(e.target.checked)} />
            Hiện màn xác nhận sau mỗi lần quét (sửa số lượng, kệ, ô)
          </label>
          {last ? (
            <div className={`rounded-xl border px-3 py-2 ${last.ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`} aria-live="polite">
              <p className={`text-sm font-black ${last.ok ? "text-emerald-800" : "text-red-700"}`}>{last.text}</p>
              {last.sub ? <p className="text-xs text-slate-600">{last.sub}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {pending && session ? (
        <ScanConfirm
          value={pending}
          type={session.type}
          locations={locations.filter((l) => !session.scope || l.code.startsWith(session.scope))}
          busy={busy}
          onChange={setPending}
          onSave={savePending}
          onCancel={() => { doneRef.current = { code: pending.code, at: Date.now() }; setPending(null); inputRef.current?.focus(); }}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {([
          ["all", `Tất cả (${stats.all})`],
          ["pending", `Chưa đếm (${stats.pending})`],
          ["diff", `Lệch (${stats.diff})`],
          ["ok", `Đủ (${stats.ok})`],
          ["extra", `Ngoài danh sách (${stats.extra})`],
        ] as [LineFilter, string][]).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === k ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>{label}</button>
        ))}
        <input className={`${input} ml-auto max-w-[220px] py-1.5`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Lọc mã/tên/vị trí" aria-label="Lọc dòng" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
            <tr>
              <th className="px-3 py-2">Mã hàng</th>
              <th className="px-3 py-2">Tên hàng</th>
              <th className="px-3 py-2">Vị trí</th>
              <th className="px-3 py-2 text-right">Sổ sách</th>
              <th className="px-3 py-2 text-right">Thực đếm</th>
              <th className="px-3 py-2 text-right">Chênh lệch</th>
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, 500).map((l) => {
              const diff = Number(l.counted_qty) - Number(l.expected_qty);
              return (
                <tr key={`${l.item_code}|${l.location_code}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs font-bold">{l.item_code}{!Number(l.in_list) ? <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800">ngoài DS</span> : null}</td>
                  <td className="px-3 py-2">{l.name || "—"}<span className="text-xs text-slate-400"> {l.unit_label}</span></td>
                  <td className="px-3 py-2 text-xs" title={l.location_code}>{locLabel(l.location_code, locMap)}</td>
                  <td className="px-3 py-2 text-right">{fmtNum(l.expected_qty)}</td>
                  <td className="px-3 py-2 text-right font-bold">{fmtNum(l.counted_qty)}</td>
                  <td className={`px-3 py-2 text-right font-bold ${diff === 0 ? "text-emerald-700" : diff > 0 ? "text-amber-700" : "text-red-600"}`}>{diff > 0 ? "+" : ""}{fmtNum(diff)}</td>
                </tr>
              );
            })}
            {shown.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">Không có dòng nào</td></tr> : null}
          </tbody>
        </table>
      </div>
      {shown.length > 500 ? <p className="text-xs text-slate-500">Đang hiện 500/{shown.length} dòng, hãy dùng bộ lọc hoặc xuất Excel.</p> : null}

      <div className={`${card} flex flex-wrap items-center gap-2`}>
        <button type="button" className={btnGhost} onClick={exportResult}><IconDownload size={14} /> Xuất Excel kết quả</button>
        <button type="button" className={btnGhost} onClick={load}><IconRefresh size={14} /> Tải lại</button>
        {open ? <button type="button" className={btnPrimary} disabled={busy} onClick={() => act("/submit", {}, "Hoàn tất đếm và gửi Quản lý kho duyệt?")}><IconCheck size={14} /> Hoàn tất đếm</button> : null}
        {me.isManager && session.status !== "APPROVED" ? (
          <>
            {session.type === "RECEIVING" ? (
              <select className="rounded-xl border border-slate-200 px-2 py-2 text-xs" value={defaultLoc} onChange={(e) => setDefaultLoc(e.target.value)} aria-label="Vị trí cất mặc định">
                <option value="">Vị trí cất cho hàng chưa xếp…</option>
                {locations.map((l) => <option key={l.code} value={l.code}>{l.code}</option>)}
              </select>
            ) : null}
            <button
              type="button"
              className={btnPrimary}
              disabled={busy}
              onClick={() => act("/approve", { applyStock: true, defaultLocation: defaultLoc }, session.type === "RECEIVING"
                ? "Duyệt phiếu và CỘNG số thực đếm vào tồn kho theo vị trí cất?"
                : "Duyệt phiếu và GHI ĐÈ tồn kho bằng số thực đếm (dòng chưa đếm sẽ về 0)?")}
            >
              <IconClipboardCheck size={14} /> Duyệt & cập nhật tồn
            </button>
            {session.status === "SUBMITTED" ? <button type="button" className={btnGhost} disabled={busy} onClick={() => act("/reopen", {})}>Mở lại để đếm tiếp</button> : null}
            <button type="button" className={btnDanger} disabled={busy} onClick={() => act("", undefined, "Xóa phiếu này cùng toàn bộ số đếm?")}><IconTrash size={14} /> Xóa phiếu</button>
          </>
        ) : null}
      </div>

      {scans.length ? (
        <details className={card}>
          <summary className="cursor-pointer text-xs font-bold text-slate-600">Lượt quét gần nhất</summary>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {scans.map((s) => (
              <li key={s.id}>{fmtTime(s.at)} · {s.emp_name} · {s.item_code} {s.location_code ? `@ ${s.location_code}` : ""} · {s.mode === "set" ? "ghi đè" : "+"}{fmtNum(s.qty)}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/* ───────────────────────── vị trí & tồn kho ───────────────────────── */

const emptyLoc = { warehouse: "", zone: "", rack: "", tier: "", bin: "", note: "", oldCode: "" };

function LocationsTab({ me, locations, reload, notify }: { me: Me; locations: Location[]; reload: () => Promise<void>; notify: Notify }) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [form, setForm] = useState<typeof emptyLoc | null>(null);
  const [stockForm, setStockForm] = useState<{ itemCode: string; itemName: string; unit: string; qty: string; locationCode: string; fromLocation: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const locMap = useMemo(() => new Map(locations.map((l) => [l.code, l])), [locations]);

  const shown = useMemo(() => {
    const f = filter.trim().toUpperCase();
    return f ? locations.filter((l) => l.code.includes(f) || (l.note || "").toUpperCase().includes(f)) : locations;
  }, [filter, locations]);

  const loadStock = useCallback(async (code: string) => {
    try {
      const r = await api<{ stock: StockRow[] }>(`stock?location=${encodeURIComponent(code)}`);
      setStock(r.stock.filter((s) => s.location_code === code));
    } catch (e) {
      notify("err", (e as Error).message);
    }
  }, [notify]);

  useEffect(() => { if (selected) loadStock(selected); }, [selected, loadStock]);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    try {
      notify("ok", await fn());
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveLocation = () => run(async () => {
    const r = await api<{ code: string }>("locations", { method: "POST", body: form });
    setForm(null);
    await reload();
    setSelected(r.code);
    return `Đã lưu vị trí ${r.code}`;
  });

  const deleteLocation = (code: string) => {
    if (!confirm(`Xóa vị trí ${code}?`)) return;
    run(async () => {
      await api(`locations?code=${encodeURIComponent(code)}`, { method: "DELETE" });
      setSelected(null);
      await reload();
      return `Đã xóa vị trí ${code}`;
    });
  };

  const importFile = async (f: File | undefined, kind: "locations" | "stock") => {
    if (!f) return;
    try {
      const { rows, matched } = await parseWarehouseFile(f);
      if (kind === "stock" && !matched.includes("itemCode")) throw new Error("File tồn kho cần cột Mã hàng");
      let mode: "replace" | "add" = "replace";
      if (kind === "stock") {
        if (!confirm(`Import ${rows.length} dòng tồn kho.\nOK = GHI ĐÈ số tồn tại các vị trí trong file\nCancel = chọn cách khác`)) {
          if (!confirm("CỘNG THÊM số lượng trong file vào tồn hiện có?")) return;
          mode = "add";
        }
      }
      await run(async () => {
        const r = await api<{ imported: number; failed: number; errors: { row: number; reason: string }[] }>(`${kind}/import`, { method: "POST", body: { rows, mode } });
        await reload();
        if (selected) await loadStock(selected);
        return `Đã import ${r.imported} dòng${r.failed ? `; ${r.failed} dòng lỗi (ví dụ dòng ${r.errors[0]?.row}: ${r.errors[0]?.reason})` : ""}`;
      });
    } catch (e) {
      notify("err", (e as Error).message);
    }
  };

  const saveStock = () => run(async () => {
    await api("stock", { method: "POST", body: { ...stockForm, qty: Number(stockForm?.qty) || 0 } });
    const target = stockForm!.locationCode;
    setStockForm(null);
    await reload();
    setSelected(target);
    await loadStock(target);
    return "Đã cập nhật vị trí hàng";
  });

  const printLabels = async () => {
    const list = shown.slice(0, 300);
    if (!list.length) return;
    const imgs = await Promise.all(list.map((l) => QRCode.toDataURL(l.code, { width: 220, margin: 1 })));
    const w = window.open("", "_blank");
    if (!w) return notify("err", "Trình duyệt chặn cửa sổ in. Hãy cho phép pop-up.");
    const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Nhãn vị trí kho</title><style>
      body{font-family:Arial,sans-serif;margin:8mm} .g{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}
      .l{border:1px solid #333;border-radius:4mm;padding:3mm;text-align:center;break-inside:avoid} img{width:38mm;height:38mm}
      .c{font-weight:700;font-size:13pt;margin-top:1mm} .d{font-size:9pt;color:#444}</style></head><body><div class="g">
      ${list.map((l, i) => `<div class="l"><img src="${imgs[i]}" alt=""><div class="c">${esc(l.code)}</div><div class="d">${esc(locLabel(l.code, locMap))}</div></div>`).join("")}
      </div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const sel = selected ? locMap.get(selected) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input className={`${input} max-w-xs`} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Lọc theo mã vị trí, VD KHO1-A-K01" aria-label="Lọc vị trí" />
        <span className="text-xs text-slate-500">{shown.length} vị trí</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className={btnGhost} onClick={printLabels}><IconPrinter size={14} /> In nhãn QR ({Math.min(shown.length, 300)})</button>
          {me.canEditLocations ? (
            <>
              <button type="button" className={btnPrimary} onClick={() => setForm({ ...emptyLoc })}><IconPlus size={14} /> Thêm vị trí</button>
              <label className={`${btnGhost} cursor-pointer`}>
                <IconUpload size={14} /> Import vị trí
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { importFile(e.target.files?.[0], "locations"); e.target.value = ""; }} />
              </label>
              <button type="button" className={btnGhost} onClick={() => downloadTemplate("locations")}><IconDownload size={14} /> Mẫu vị trí</button>
            </>
          ) : null}
          {me.isManager ? (
            <>
              <label className={`${btnGhost} cursor-pointer`}>
                <IconUpload size={14} /> Import tồn kho
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { importFile(e.target.files?.[0], "stock"); e.target.value = ""; }} />
              </label>
              <button type="button" className={btnGhost} onClick={() => downloadTemplate("stock")}><IconDownload size={14} /> Mẫu tồn kho</button>
            </>
          ) : null}
        </div>
      </div>
      {!me.canEditLocations ? (
        <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">Bạn chỉ có quyền xem. Sửa vị trí do Quản lý kho hoặc người được Quản lý kho cấp quyền thực hiện.</p>
      ) : null}

      {form ? (
        <div className={`${card} space-y-3 border-emerald-200`}>
          <h3 className="text-sm font-black">{form.oldCode ? `Sửa vị trí ${form.oldCode}` : "Thêm vị trí"}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
            {(["warehouse", "zone", "rack", "tier", "bin"] as const).map((k, i) => (
              <label key={k} className="text-xs font-bold text-slate-600">{LOC_LABELS[i]}{k === "warehouse" ? " *" : ""}
                <input className={input} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value.toUpperCase() })} />
              </label>
            ))}
            <label className="col-span-2 text-xs font-bold text-slate-600 sm:col-span-1">Ghi chú
              <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
          </div>
          <p className="text-xs text-slate-500">Mã vị trí: <b>{[form.warehouse, form.zone, form.rack, form.tier, form.bin].map((x) => x.trim()).filter(Boolean).join("-") || "—"}</b></p>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setForm(null)}>Hủy</button>
            <button type="button" className={btnPrimary} disabled={busy || !form.warehouse.trim()} onClick={saveLocation}><IconCheck size={14} /> Lưu</button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="max-h-[65vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white">
          {shown.length === 0 ? <p className="p-6 text-center text-sm text-slate-400">Chưa có vị trí nào</p> : null}
          {shown.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setSelected(l.code)}
              className={`flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 text-left hover:bg-emerald-50/50 ${selected === l.code ? "bg-emerald-50" : ""}`}
            >
              <span className="min-w-0">
                <span className="block font-mono text-xs font-black">{l.code}</span>
                <span className="block truncate text-xs text-slate-500">{locLabel(l.code, locMap)}{l.note ? ` · ${l.note}` : ""}</span>
              </span>
              <span className="shrink-0 text-right text-xs text-slate-600">{l.item_count || 0} mã<br />{fmtNum(l.total_qty)}</span>
            </button>
          ))}
        </div>

        <div className={card}>
          {!sel ? (
            <p className="py-10 text-center text-sm text-slate-400">Chọn một vị trí để xem hàng đang cất</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-black">{sel.code}</p>
                  <p className="text-xs text-slate-500">{locLabel(sel.code, locMap)}{sel.note ? ` · ${sel.note}` : ""}</p>
                </div>
                {me.canEditLocations ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={btnGhost} onClick={() => setStockForm({ itemCode: "", itemName: "", unit: "", qty: "", locationCode: sel.code, fromLocation: "" })}><IconPlus size={14} /> Xếp hàng vào</button>
                    <button type="button" className={btnGhost} onClick={() => setForm({ warehouse: sel.warehouse || "", zone: sel.zone || "", rack: sel.rack || "", tier: sel.tier || "", bin: sel.bin || "", note: sel.note || "", oldCode: sel.code })}><IconEdit size={14} /> Sửa</button>
                    <button type="button" className={btnDanger} onClick={() => deleteLocation(sel.code)} aria-label="Xóa vị trí"><IconTrash size={14} /></button>
                  </div>
                ) : null}
              </div>

              {stockForm ? (
                <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                  <p className="text-xs font-black">{stockForm.fromLocation ? `Chuyển ${stockForm.itemCode} từ ${stockForm.fromLocation}` : "Đặt số lượng hàng tại vị trí"}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <input className={input} placeholder="Mã hàng *" value={stockForm.itemCode} disabled={Boolean(stockForm.fromLocation)} onChange={(e) => setStockForm({ ...stockForm, itemCode: e.target.value.toUpperCase() })} />
                    <input className={input} placeholder="Tên hàng" value={stockForm.itemName} onChange={(e) => setStockForm({ ...stockForm, itemName: e.target.value })} />
                    <input className={input} placeholder="ĐVT" value={stockForm.unit} onChange={(e) => setStockForm({ ...stockForm, unit: e.target.value })} />
                    <input className={input} placeholder="Số lượng" inputMode="decimal" value={stockForm.qty} onChange={(e) => setStockForm({ ...stockForm, qty: e.target.value })} />
                    <select className={input} value={stockForm.locationCode} onChange={(e) => setStockForm({ ...stockForm, locationCode: e.target.value })} aria-label="Vị trí đích">
                      <option value="">Chọn vị trí đích…</option>
                      {locations.map((l) => <option key={l.code} value={l.code}>{l.code}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" className={btnGhost} onClick={() => setStockForm(null)}>Hủy</button>
                    <button type="button" className={btnPrimary} disabled={busy || !stockForm.itemCode || !stockForm.locationCode} onClick={saveStock}><IconCheck size={14} /> Lưu</button>
                  </div>
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-500"><tr><th className="py-1.5">Mã hàng</th><th>Tên</th><th className="text-right">Tồn</th>{me.canEditLocations ? <th /> : null}</tr></thead>
                  <tbody>
                    {stock.map((s) => (
                      <tr key={s.item_code} className="border-t border-slate-100">
                        <td className="py-2 font-mono text-xs font-bold">{s.item_code}</td>
                        <td className="text-xs">{s.name || "—"} <span className="text-slate-400">{s.unit}</span></td>
                        <td className="text-right font-bold">{fmtNum(s.qty)}</td>
                        {me.canEditLocations ? (
                          <td className="whitespace-nowrap text-right">
                            <button type="button" className="px-1 text-xs font-bold text-emerald-700 hover:underline" onClick={() => setStockForm({ itemCode: s.item_code, itemName: s.name || "", unit: s.unit || "", qty: String(s.qty), locationCode: sel.code, fromLocation: "" })}>Sửa SL</button>
                            <button type="button" className="px-1 text-xs font-bold text-blue-700 hover:underline" onClick={() => setStockForm({ itemCode: s.item_code, itemName: s.name || "", unit: s.unit || "", qty: String(s.qty), locationCode: "", fromLocation: sel.code })}>Chuyển</button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                    {stock.length === 0 ? <tr><td colSpan={4} className="py-6 text-center text-xs text-slate-400">Vị trí đang trống</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── tra cứu ───────────────────────── */

type LookupResult =
  | { kind: "location"; location: Location; items: { item_code: string; qty: number; name?: string; unit?: string }[] }
  | { kind: "item"; item: { code: string; name?: string; unit?: string }; locations: { location_code: string; qty: number }[] }
  | { kind: "unknown"; code: string };

function LookupTab({ locMap, notify }: { locMap: Map<string, Location>; notify: Notify }) {
  const [q, setQ] = useState("");
  const [camera, setCamera] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const lookup = useCallback(async (raw: string) => {
    const c = raw.trim();
    if (!c) return;
    setQ(c);
    try {
      setResult(await api<LookupResult>(`lookup?code=${encodeURIComponent(c)}`));
    } catch (e) {
      notify("err", (e as Error).message);
    }
  }, [notify]);

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); lookup(q); }} className="flex flex-wrap gap-2">
        <input autoFocus className={`${input} min-w-[220px] flex-1 text-base`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quét hoặc nhập mã hàng / mã vị trí" aria-label="Mã cần tra cứu" />
        <button type="submit" className={btnPrimary}><IconSearch size={14} /> Tra cứu</button>
        <button type="button" className={btnGhost} onClick={() => setCamera((v) => !v)}><IconCamera size={14} /> {camera ? "Tắt camera" : "Mở camera"}</button>
      </form>
      {camera ? <BarcodeScanner onDetected={(c) => { setCamera(false); lookup(c); }} onClose={() => setCamera(false)} /> : null}

      {result?.kind === "unknown" ? <div className={`${card} text-sm text-slate-500`}>Không tìm thấy mã <b>{result.code}</b> trong danh mục hàng hay vị trí.</div> : null}
      {result?.kind === "item" ? (
        <div className={card}>
          <p className="font-mono text-sm font-black">{result.item.code}</p>
          <p className="text-xs text-slate-500">{result.item.name || "Chưa có tên"} {result.item.unit ? `· ${result.item.unit}` : ""}</p>
          <p className="mt-3 text-xs font-bold text-slate-600">Đang cất tại {result.locations.length} vị trí · tổng {fmtNum(result.locations.reduce((a, b) => a + Number(b.qty), 0))}</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {result.locations.map((l) => (
              <li key={l.location_code} className="flex items-center justify-between py-2 text-sm">
                <span><span className="font-mono text-xs font-bold">{l.location_code}</span><br /><span className="text-xs text-slate-500">{locLabel(l.location_code, locMap)}</span></span>
                <b>{fmtNum(l.qty)}</b>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result?.kind === "location" ? (
        <div className={card}>
          <p className="font-mono text-sm font-black">{result.location.code}</p>
          <p className="text-xs text-slate-500">{locLabel(result.location.code, locMap)}{result.location.note ? ` · ${result.location.note}` : ""}</p>
          <ul className="mt-3 divide-y divide-slate-100">
            {result.items.map((i) => (
              <li key={i.item_code} className="flex items-center justify-between py-2 text-sm">
                <span><span className="font-mono text-xs font-bold">{i.item_code}</span> <span className="text-xs text-slate-500">{i.name}</span></span>
                <b>{fmtNum(i.qty)} <span className="text-xs font-normal text-slate-400">{i.unit}</span></b>
              </li>
            ))}
            {result.items.length === 0 ? <li className="py-4 text-center text-xs text-slate-400">Vị trí đang trống</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────── phân quyền ───────────────────────── */

function RolesTab({ me, notify }: { me: Me; notify: Notify }) {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [empCode, setEmpCode] = useState("");
  const [role, setRole] = useState<"MANAGER" | "EDITOR">("EDITOR");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRoles((await api<{ roles: RoleRow[] }>("roles")).roles);
    } catch (e) {
      notify("err", (e as Error).message);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ empName: string }>("roles", { method: "POST", body: { empCode, role } });
      notify("ok", `Đã cấp quyền cho ${r.empName}`);
      setEmpCode("");
      load();
    } catch (err) {
      notify("err", (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (r: RoleRow) => {
    if (!confirm(`Bỏ quyền ${r.role === "MANAGER" ? "Quản lý kho" : "sửa vị trí"} của ${r.emp_name || r.emp_code}?`)) return;
    try {
      await api(`roles?empCode=${encodeURIComponent(r.emp_code)}`, { method: "DELETE" });
      notify("ok", "Đã bỏ quyền");
      load();
    } catch (e) {
      notify("err", (e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={grant} className={`${card} flex flex-wrap items-end gap-2`}>
        <label className="text-xs font-bold text-slate-600">MSNV
          <input className={input} value={empCode} onChange={(e) => setEmpCode(e.target.value.toUpperCase())} placeholder="VD 202608001" required />
        </label>
        <label className="text-xs font-bold text-slate-600">Quyền
          <select className={input} value={role} onChange={(e) => setRole(e.target.value as "MANAGER" | "EDITOR")}>
            <option value="EDITOR">Được sửa vị trí</option>
            {me.role === "ADMIN" ? <option value="MANAGER">Quản lý kho</option> : null}
          </select>
        </label>
        <button type="submit" className={btnPrimary} disabled={busy}><IconPlus size={14} /> Cấp quyền</button>
        <p className="w-full text-xs text-slate-500">
          Quản lý kho: sửa vị trí, import tồn, duyệt phiếu kiểm và cấp quyền sửa vị trí. Người được sửa vị trí: thêm/sửa vị trí, xếp/chuyển hàng, tạo phiếu kiểm.
          {me.role !== "ADMIN" ? " Chỉ Admin hệ thống chỉ định được Quản lý kho." : ""}
        </p>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
            <tr><th className="px-3 py-2">Nhân viên</th><th className="px-3 py-2">Quyền</th><th className="px-3 py-2">Cấp bởi</th><th /></tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.emp_code} className="border-t border-slate-100">
                <td className="px-3 py-2"><b>{r.emp_name}</b> <span className="text-xs text-slate-500">{r.emp_code}</span></td>
                <td className="px-3 py-2 text-xs font-bold">{r.role === "MANAGER" ? "Quản lý kho" : "Được sửa vị trí"}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{r.granted_by} · {fmtTime(r.granted_at)}</td>
                <td className="px-3 py-2 text-right">
                  {r.role === "EDITOR" || me.role === "ADMIN" ? <button type="button" className={btnDanger} onClick={() => revoke(r)} aria-label="Bỏ quyền"><IconTrash size={14} /></button> : null}
                </td>
              </tr>
            ))}
            {roles.length === 0 ? <tr><td colSpan={4} className="px-3 py-8 text-center text-xs text-slate-400">Chưa phân quyền cho ai</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
