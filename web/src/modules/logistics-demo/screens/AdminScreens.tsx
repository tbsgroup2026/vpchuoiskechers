"use client";

// Màn hình Số hóa & cấu hình, KPI tự động, RACI & Rủi ro.

import React, { useEffect, useState } from "react";
import { IconAdjustments, IconChartDots, IconFileText, IconHistory, IconPlugConnected, IconShieldCheck, IconUsersGroup } from "@tabler/icons-react";
import { roleName, setFormStatus, setThreshold } from "../actions";
import { DEPTS, RACI_COLUMNS, RACI_ROWS, RISKS, ROLES, THRESHOLD_META } from "../config";
import { fmtDM } from "../dates";
import { POSITIONS, buildMetrics, grade, positionScore, supplierKpis, type KpiDef, type KpiValue } from "../kpi";
import { useDemo } from "../store";
import type { DeptKey, FormStatus, Thresholds } from "../types";
import { Btn, Card, CardHeader, Empty, ProgressBar, ProposalTag, Stat, Table, Td, Th, ViewOnlyBanner, cx } from "../ui";
import { phaseProgress } from "./ProgressScreen";

// ═══════════════════════════════════════════════════════════════════════════
// SỐ HÓA & CẤU HÌNH
// ═══════════════════════════════════════════════════════════════════════════

const FORM_FLOW: { key: FormStatus["status"]; label: string }[] = [
  { key: "NHAP", label: "Bản nháp" },
  { key: "GOP_Y", label: "Đang góp ý" },
  { key: "THONG_NHAT", label: "Đã thống nhất" },
  { key: "DA_KY", label: "Đã ký duyệt" },
];

export function DigitalScreen() {
  const { state, canEdit, apply } = useDemo();
  const edit = canEdit("sh");
  const progress = phaseProgress(state);
  const signed = state.forms.filter((f) => f.status === "DA_KY").length;
  const total = state.barcode.reduce((s, z) => s + z.total, 0);
  const scanned = state.barcode.reduce((s, z) => s + z.scanned, 0);
  const noExcel = 1 + signed;

  return (
    <div className="space-y-4">
      {!edit ? <ViewOnlyBanner ownerName={DEPTS.SH.name} /> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pha 1 · Biểu mẫu & lead time" value={`${progress.P1}%`} hint="Mốc M1 cuối T4" />
        <Stat label="Pha 2 · Barcode & SAP" value={`${progress.P2}%`} hint="Mốc M2 cuối T9" />
        <Stat label="Biểu mẫu chuẩn đã ký" value={`${signed}/3`} tone={signed === 3 ? "good" : "warn"} />
        <Stat label="Báo cáo đã bỏ Excel" value={`${noExcel}/9`} hint="Mục tiêu 100% cuối Pha 4" tone="warn" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader icon={<IconFileText size={20} />} title="Chuẩn hóa 3 biểu mẫu chung" subtitle="Ký duyệt đủ 3 biểu mẫu là điều kiện qua mốc M1" />
          <ul className="divide-y divide-slate-100">
            {state.forms.map((f) => (
              <li key={f.key} className="space-y-2 px-4 py-3">
                <div className="text-xs font-bold text-slate-900">{f.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {FORM_FLOW.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      disabled={!edit}
                      onClick={() => apply((st) => setFormStatus(st, f.key, s.key))}
                      className={cx(
                        "min-h-[34px] rounded-full border px-3 text-xs font-bold transition-colors",
                        f.status === s.key ? "border-[#006838] bg-[#006838] text-white" : "border-slate-200 bg-white text-slate-600",
                        edit ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-70",
                        f.status === s.key && edit && "hover:bg-[#00522c]",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader icon={<IconPlugConnected size={20} />} title="Kết nối dữ liệu nguồn" subtitle="Nhập một lần tại nguồn; nguồn lỗi thì hiện thời điểm cập nhật cuối và cảnh báo Số hóa" />
          <ul className="divide-y divide-slate-100 text-xs">
            <li className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="font-bold text-slate-900">SAP ZMB52 – tồn kho</div>
                <div className="text-slate-500">Cập nhật cuối {fmtDM(state.today)} 06:00 · lịch 4 lần/ngày</div>
              </div>
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900">Chạy thử (T5–T7)</span>
            </li>
            <li className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="font-bold text-slate-900">Barcode kho – Nhập/Xuất/Tồn theo ô kệ</div>
                <div className="text-slate-500">
                  {scanned}/{total} ô kệ đã có mã
                </div>
              </div>
              <div className="w-28">
                <ProgressBar value={total ? (scanned / total) * 100 : 0} />
              </div>
            </li>
            <li className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="font-bold text-slate-900">Biểu mẫu nhập tại nguồn</div>
                <div className="text-slate-500">Kế hoạch 312, PO, tiếp nhận, Lab test, ký màu</div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">Đang dùng trong demo</span>
            </li>
          </ul>
        </Card>
      </div>

      <ThresholdCard edit={edit} />

      <Card>
        <CardHeader icon={<IconHistory size={20} />} title="Nhật ký thao tác" subtitle="Lưu lịch sử thay đổi: ai, khi nào, nội dung (mục 7.8)" />
        {state.log.length === 0 ? (
          <Empty text="Chưa có thao tác." />
        ) : (
          <ul className="max-h-[320px] divide-y divide-slate-100 overflow-y-auto">
            {state.log.slice(0, 30).map((l, i) => (
              <li key={`${l.at}-${i}`} className="grid grid-cols-[auto_1fr] gap-x-3 px-4 py-2 text-xs">
                <span className="font-mono text-[11px] text-slate-500">{fmtDM(l.at)}</span>
                <span>
                  <span className="font-bold text-slate-800">{roleName(l.role)}</span> <span className="text-slate-600">· {l.text}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ThresholdCard({ edit }: { edit: boolean }) {
  const { state, apply } = useDemo();
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(Object.fromEntries(THRESHOLD_META.map((m) => [m.key, String(state.thresholds[m.key])])));
  }, [state.thresholds]);

  const commit = (key: keyof Thresholds, label: string, min: number, max: number) => {
    const n = Number(draft[key]);
    if (!Number.isFinite(n) || n < min || n > max) {
      setDraft((d) => ({ ...d, [key]: String(state.thresholds[key]) }));
      return;
    }
    if (n !== state.thresholds[key]) apply((s) => setThreshold(s, key, n, label));
  };

  return (
    <Card>
      <CardHeader
        icon={<IconAdjustments size={20} />}
        title="Ngưỡng thời gian & SLA"
        subtitle="Đổi ngưỡng là toàn bộ hạn chót, trạng thái, cảnh báo và KPI tính lại ngay. Ngưỡng gắn nhãn Đề xuất chờ Ban điều hành chốt."
      />
      <Table minWidth={640}>
        <thead>
          <tr>
            <Th>Ngưỡng</Th>
            <Th>Giá trị</Th>
            <Th>Nguồn</Th>
          </tr>
        </thead>
        <tbody>
          {THRESHOLD_META.map((m) => (
            <tr key={m.key}>
              <Td>
                <div className="font-bold text-slate-900">{m.label}</div>
                {m.note ? <div className="text-[11px] text-slate-500">{m.note}</div> : null}
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={m.min}
                    max={m.max}
                    value={draft[m.key] ?? ""}
                    disabled={!edit}
                    onChange={(e) => setDraft((d) => ({ ...d, [m.key]: e.target.value }))}
                    onBlur={() => commit(m.key, m.label, m.min, m.max)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commit(m.key, m.label, m.min, m.max);
                    }}
                    className="min-h-[38px] w-20 rounded-xl border border-slate-300 bg-white px-2 text-xs font-bold tabular-nums disabled:bg-slate-100 disabled:text-slate-500"
                    aria-label={m.label}
                  />
                  <span className="text-[11px] text-slate-500">{m.unit}</span>
                </div>
              </Td>
              <Td>
                {m.source === "DE_XUAT" ? (
                  <ProposalTag />
                ) : (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">Theo tài liệu</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI TỰ ĐỘNG
// ═══════════════════════════════════════════════════════════════════════════

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

function targetText(def: KpiDef): string {
  if (def.kind === "zero") return "0";
  if (def.kind === "max") return `≤ ${Math.round(def.target * 1000) / 10}%`;
  return def.target >= 1 ? "100%" : `≥ ${Math.round(def.target * 100)}%`;
}

function actualText(def: KpiDef, v: KpiValue): string {
  if (v.actual === null) return "—";
  if (def.kind === "zero") return String(v.actual);
  return `${Math.round(v.actual * 1000) / 10}%`;
}

export function KpiScreen() {
  const { state, views } = useDemo();
  const role = state.role;
  const metrics = buildMetrics(state, views);
  const roleDepts = ROLES.find((r) => r.key === role)?.depts ?? [];
  const positions = role === "BDH" ? POSITIONS : POSITIONS.filter((p) => roleDepts.includes(p.dept));
  const showSuppliers = role === "BDH" || role === "MH" || role === "KDCNQC";
  const suppliers = supplierKpis(state);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 sm:flex-row sm:items-center sm:justify-between">
        <span>Giai đoạn chạy thử (Pha 4): bảng điểm chỉ để xem, không gắn thưởng phạt. Công thức chờ các bộ phận thống nhất ở Pha 3.</span>
        <span className="text-sky-800">
          {role === "BDH" ? "Ban điều hành xem tất cả" : `Đang xem KPI của: ${ROLES.find((r) => r.key === role)?.name}`}
        </span>
      </div>

      {role === "BDH" ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="NCC giao đúng hạn" value={pct(metrics.supplierOnTime.actual)} hint={metrics.supplierOnTime.detail} />
          <Stat label="Mua hàng đặt đúng hạn" value={pct(metrics.step(6).actual)} hint={metrics.step(6).detail} />
          <Stat label="Kho tiếp nhận đúng hạn" value={pct(metrics.step(8).actual)} hint={metrics.step(8).detail} />
          <Stat label="Cấp đồng bộ trước 2 tuần" value={pct(metrics.step(10).actual)} hint={metrics.step(10).detail} />
        </div>
      ) : null}

      {showSuppliers ? (
        <Card>
          <CardHeader icon={<IconChartDots size={20} />} title="KPI nhà cung cấp" subtitle="Giao đúng hạn = lô đúng hạn / tổng lô · Chất lượng = lô đạt / tổng lô · Thời gian xử lý sự cố = TB ngày từ biên bản đến đóng" />
          <Table minWidth={640}>
            <thead>
              <tr>
                <Th>NCC</Th>
                <Th>Lô đã về</Th>
                <Th>Giao đúng hạn</Th>
                <Th>Chất lượng</Th>
                <Th>Sự cố</Th>
                <Th>TB xử lý</Th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <Td className="font-bold text-slate-900">{s.name}</Td>
                  <Td className="tabular-nums">{s.lots}</Td>
                  <Td className={cx("font-bold tabular-nums", s.onTime !== null && s.onTime < 0.9 ? "text-rose-700" : "text-slate-800")}>{pct(s.onTime)}</Td>
                  <Td className={cx("font-bold tabular-nums", s.quality !== null && s.quality < 1 ? "text-amber-700" : "text-slate-800")}>{pct(s.quality)}</Td>
                  <Td className="tabular-nums">{s.incidents}</Td>
                  <Td className="tabular-nums">{s.avgIncidentDays === null ? "—" : `${Math.round(s.avgIncidentDays * 10) / 10} ngày`}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {positions.length === 0 ? (
          <Card>
            <Empty text="Vai hiện tại chưa có bộ KPI cá nhân." />
          </Card>
        ) : (
          positions.map((p) => {
            const { score, rows } = positionScore(p, metrics);
            const g = grade(score);
            return (
              <Card key={p.title}>
                <CardHeader
                  icon={<IconUsersGroup size={20} />}
                  title={p.title}
                  subtitle={DEPTS[p.dept as DeptKey].name}
                  right={
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black tabular-nums text-slate-900">{score === null ? "—" : Math.round(score)}</span>
                      <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-black", g.cls)}>{g.label}</span>
                    </div>
                  }
                />
                <ul className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <li key={r.def.name} className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800">
                          {r.def.name} {r.def.proposal ? <ProposalTag /> : null}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Chỉ tiêu {targetText(r.def)} · trọng số {r.def.weight}% · {r.value.detail}
                          {r.value.sample ? " (số mẫu)" : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black tabular-nums text-slate-900">{actualText(r.def, r.value)}</div>
                        <div className="text-[11px] text-slate-500">đạt {r.att === null ? "—" : `${Math.round(r.att * 100)}%`}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })
        )}
      </div>

      <Card>
        <CardHeader title="Cách tính điểm (mục 10.8)" subtitle="Điểm = Σ (mức đạt × trọng số). Mức đạt = thực tế / chỉ tiêu, tối đa 100%. Chỉ tiêu bằng 0: 0 lỗi đạt 100%, 1 lỗi 50%, từ 2 lỗi 0%." />
        <div className="flex flex-wrap gap-2 px-4 py-3 text-[11px] font-bold">
          {[95, 85, 70, 0].map((s) => {
            const g = grade(s);
            const range = s === 95 ? "≥ 95" : s === 85 ? "85 – < 95" : s === 70 ? "70 – < 85" : "< 70";
            return (
              <span key={s} className={cx("rounded-full px-2.5 py-1", g.cls)}>
                {range}: {g.label}
              </span>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RACI & RỦI RO
// ═══════════════════════════════════════════════════════════════════════════

const OPEN_POINTS = [
  "Ngày bắt đầu: giả định T1 là tuần 42/2026, kéo dài 18 tuần",
  "Ngưỡng sai lệch tồn kho chấp nhận ở Pha 2 (đề xuất ≤ 2%)",
  "Số ngày cụ thể cho \"đúng thời hạn\" bàn giao No Silent (demo đặt 5 ngày)",
  "Quyền xem của Số hóa đối với nội dung nghiệp vụ của bộ phận khác",
  "Gắn tên người phụ trách vào ma trận RACI",
  "Các ngưỡng đề xuất: cấp leo thang, lịch hằng ngày/hằng tuần, hạn bản điều chỉnh báo cáo",
  "Công thức KPI tự động: các bộ phận thống nhất ở Pha 3",
  "Danh sách nhân sự, trọng số và chỉ tiêu KPI cá nhân",
  "Có cần màn hình riêng cho Sản xuất hay không",
];

export function RaciScreen() {
  const cellCls = (c: string) =>
    c.includes("A") ? "bg-[#006838] text-white" : c === "R" ? "bg-emerald-100 text-emerald-900" : c === "C" ? "bg-sky-50 text-sky-800" : "bg-slate-50 text-slate-500";
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader icon={<IconShieldCheck size={20} />} title="Ma trận trách nhiệm (RACI)" subtitle="R: thực hiện · A: chịu trách nhiệm cuối cùng · C: được hỏi ý kiến · I: được thông báo" />
        <Table minWidth={640}>
          <thead>
            <tr>
              <Th>Hạng mục</Th>
              {RACI_COLUMNS.map((c) => (
                <Th key={c} className="text-center">
                  {c}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RACI_ROWS.map((r) => (
              <tr key={r.item}>
                <Td className="font-semibold text-slate-900">{r.item}</Td>
                {r.cells.map((c, i) => (
                  <Td key={i} className="text-center">
                    <span className={cx("inline-flex min-w-[38px] justify-center rounded-md px-1.5 py-1 text-[11px] font-black", cellCls(c))}>{c}</span>
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Rủi ro chính khi chuyển từ Excel sang phần mềm" />
          <ul className="divide-y divide-slate-100">
            {RISKS.map((r) => (
              <li key={r.risk} className="space-y-1 px-4 py-3 text-xs">
                <div className="flex items-start gap-2">
                  <span
                    className={cx(
                      "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black",
                      r.level === "Cao" ? "bg-rose-600 text-white" : r.level === "Trung bình" ? "bg-amber-400 text-amber-950" : "bg-slate-200 text-slate-700",
                    )}
                  >
                    {r.level}
                  </span>
                  <span className="font-bold text-slate-900">{r.risk}</span>
                </div>
                <div className="text-slate-600">{r.mitigation}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Điểm cần Ban điều hành xác nhận (mục 14)" />
          <ol className="list-decimal space-y-1.5 py-3 pl-9 pr-4 text-xs text-slate-700">
            {OPEN_POINTS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <div className="border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">
            Người phụ trách ghi theo chức danh; mọi tên NCC, mã đơn trong demo là hư cấu.
          </div>
        </Card>
      </div>
    </div>
  );
}
