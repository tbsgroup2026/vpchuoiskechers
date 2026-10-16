"use client";

// Màn hình làm việc của Kế hoạch & CCƯ (mục 7.1) và Mua hàng (mục 7.2, 7.3).

import React, { useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconCalculator,
  IconCalendarStats,
  IconCheck,
  IconFileCertificate,
  IconListNumbers,
  IconPackageImport,
  IconSend,
  IconShoppingCart,
  IconTool,
  IconTruckDelivery,
} from "@tabler/icons-react";
import {
  activateOrder,
  agreeIncidentPlan,
  allocateOrder,
  approvePlan,
  issuePlan312,
  reportSupplierDelay,
  reschedule,
  rollPlanWeeks,
  sendInboundPlan,
  sendNoSilent,
} from "../actions";
import { DEPTS, INCIDENT_PLAN_LABEL } from "../config";
import { addDays, diffDays, fmtDM, fmtDMY, weekLabel, weekStart } from "../dates";
import {
  LINE_CAPACITY_PAIRS,
  allocationGrid,
  expectedArrival,
  hasArrived,
  infoDeadline,
  missingOrderConditions,
  planCoverage,
  supplierOf,
} from "../engine";
import { useDemo } from "../store";
import type { IncidentPlan } from "../types";
import { Btn, Card, CardHeader, DueText, Empty, ProposalTag, StatusPill, Table, Td, Th, ViewOnlyBanner, cx } from "../ui";

// ═══════════════════════════════════════════════════════════════════════════
// KẾ HOẠCH & CHUỖI CUNG ỨNG
// ═══════════════════════════════════════════════════════════════════════════

export function PlanningScreen() {
  const { state, views, canEdit, apply } = useDemo();
  const edit = canEdit("kh");
  const week = weekStart(state.today);
  const approved = state.planApprovedWeek === week;
  const coverage = planCoverage(state);

  const toAllocate = views.filter((v) => v.steps[3].status === "doing" || v.steps[3].status === "late");
  const toIssue = views.filter((v) => v.order.steps[3].doneAt && !v.order.steps[4].doneAt);
  const noSilent = views.filter((v) => v.order.noSilent && v.order.steps[3].doneAt && !v.order.steps[5].doneAt);

  return (
    <div className="space-y-4">
      {!edit ? <ViewOnlyBanner ownerName={DEPTS.KH.name} /> : null}

      <Card>
        <CardHeader
          icon={<IconCalendarStats size={20} />}
          title={`Kế hoạch phân bổ cuốn chiếu – ${weekLabel(week)}`}
          subtitle="Lập phân bổ → Trưởng bộ phận phê duyệt → Ban hành Kế hoạch 312 cho Mua hàng → Chuyển kế hoạch Tầng 2 cho nhà máy"
          right={
            <>
              <span
                className={cx(
                  "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                  coverage.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800",
                )}
              >
                {coverage.ok ? "Đủ 4 tuần liên tục" : `Thiếu ${coverage.missing.map((w) => weekLabel(w)).join(", ")}`}
              </span>
              <span
                className={cx(
                  "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                  approved ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900",
                )}
              >
                {approved ? "Đã phê duyệt tuần này" : "Chưa phê duyệt"}
              </span>
            </>
          }
        />
        <div className="flex flex-wrap gap-2 px-4 py-3">
          <Btn variant="secondary" readOnly={!edit} disabled={approved} onClick={() => apply(approvePlan)}>
            <IconCheck size={16} /> Trưởng bộ phận phê duyệt
          </Btn>
          <Btn variant="primary" readOnly={!edit} onClick={() => apply(issuePlan312)}>
            <IconFileCertificate size={16} /> Ban hành Kế hoạch 312 ({toIssue.length} đơn)
          </Btn>
          <Btn variant="secondary" readOnly={!edit} disabled={coverage.ok} onClick={() => apply(rollPlanWeeks)}>
            <IconCalendarStats size={16} /> Cập nhật cuốn chiếu
          </Btn>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Đơn mới chờ đưa vào kế hoạch" subtitle="Kinh doanh đã bàn giao đủ thông tin" />
          {toAllocate.length === 0 ? (
            <Empty text="Không có đơn mới." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {toAllocate.map((v) => (
                <li key={v.order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <div className="text-xs">
                    <div className="font-black text-slate-900">{v.order.code}</div>
                    <div className="text-slate-500">
                      {v.order.qty.toLocaleString("vi-VN")} đôi · xuất {fmtDM(v.order.exportDate)} · {v.order.factory} / {v.order.line}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <DueText daysLeft={v.steps[3].daysLeft} />
                    <Btn small variant="primary" readOnly={!edit} onClick={() => apply((s) => allocateOrder(s, v.order.id))}>
                      Đưa vào kế hoạch
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Bàn giao No Silent cho Mua hàng"
            subtitle={`Hạn: ${state.thresholds.noSilentDays} ngày sau khi ban hành 312`}
            right={<ProposalTag />}
          />
          {noSilent.length === 0 ? (
            <Empty text="Không có No Silent chờ bàn giao." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {noSilent.map((v) => (
                <li key={v.order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <div className="text-xs">
                    <div className="font-black text-slate-900">{v.order.code}</div>
                    <div className="text-slate-500">Hạn {fmtDM(v.steps[5].deadline)}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <DueText daysLeft={v.steps[5].daysLeft} />
                    <Btn small variant="primary" readOnly={!edit} onClick={() => apply((s) => sendNoSilent(s, v.order.id))}>
                      <IconSend size={14} /> Gửi No Silent
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <AllocationCard edit={edit} />
      <Plan312Card />
    </div>
  );
}

function AllocationCard({ edit }: { edit: boolean }) {
  const { state, apply } = useDemo();
  const cells = useMemo(() => allocationGrid(state), [state]);
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const lines = Array.from(new Set(cells.map((c) => `${c.factory}|${c.line}`)));
  const selOrder = state.orders.find((o) => o.id === selected);

  const move = (weeks: number) => {
    if (!selOrder) return;
    if (apply((s) => reschedule(s, selOrder.id, weeks, reason))) {
      setReason("");
      setSelected(null);
    }
  };

  return (
    <Card>
      <CardHeader
        icon={<IconListNumbers size={20} />}
        title="Bảng phân bổ 4 tuần theo nhà máy / chuyền (Tầng 1)"
        subtitle={`Năng lực mỗi chuyền ${LINE_CAPACITY_PAIRS.toLocaleString("vi-VN")} đôi/tuần (giả lập) · bấm vào mã đơn để dời tuần, bắt buộc ghi lý do`}
      />
      <Table minWidth={760}>
        <thead>
          <tr>
            <Th>Nhà máy / chuyền</Th>
            {state.planWeeks.map((w) => (
              <Th key={w}>
                {weekLabel(w)} <span className="font-semibold normal-case text-slate-400">({fmtDM(w)})</span>
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((key) => {
            const [factory, line] = key.split("|");
            return (
              <tr key={key}>
                <Td className="whitespace-nowrap font-bold text-slate-900">
                  {factory} · {line}
                </Td>
                {state.planWeeks.map((w) => {
                  const c = cells.find((x) => x.factory === factory && x.line === line && x.week === w)!;
                  return (
                    <Td key={w} className={cx(c.over && "bg-rose-50")}>
                      <div className={cx("text-[11px] font-bold tabular-nums", c.over ? "text-rose-700" : "text-slate-500")}>
                        {c.load.toLocaleString("vi-VN")} / {LINE_CAPACITY_PAIRS.toLocaleString("vi-VN")}
                        {c.over ? " · vượt năng lực" : ""}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.orders.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setSelected(o.id)}
                            className={cx(
                              "rounded-md border px-1.5 py-0.5 text-[10px] font-bold",
                              selected === o.id ? "border-[#006838] bg-[#006838] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                            )}
                            title={o.changeNote ? `Lý do thay đổi: ${o.changeNote}` : undefined}
                          >
                            {o.code.slice(6)}
                            {o.changeNote ? " ✎" : ""}
                          </button>
                        ))}
                      </div>
                    </Td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>
      {selOrder ? (
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 md:flex-row md:items-center">
          <div className="text-xs font-bold text-slate-800">
            {selOrder.code} · {weekLabel(selOrder.planWeek)}
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Lý do thay đổi (bắt buộc), ví dụ: thiếu năng lực chuyền B"
            className="min-h-[40px] flex-1 rounded-xl border border-slate-300 bg-white px-3 text-xs"
            aria-label="Lý do thay đổi kế hoạch"
          />
          <div className="flex gap-2">
            <Btn small readOnly={!edit} onClick={() => move(-1)}>
              Dời −1 tuần
            </Btn>
            <Btn small readOnly={!edit} onClick={() => move(1)}>
              Dời +1 tuần
            </Btn>
            <Btn small variant="ghost" onClick={() => setSelected(null)}>
              Đóng
            </Btn>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function Plan312Card() {
  const { views } = useDemo();
  const issued = views
    .filter((v) => v.order.steps[4].doneAt && !v.order.steps[10].doneAt)
    .sort((a, b) => a.order.priority - b.order.priority)
    .slice(0, 12);
  return (
    <Card>
      <CardHeader title="Kế hoạch 312 – thứ tự ưu tiên đôn đốc NCC" subtitle="Mỗi đơn có một thứ tự ưu tiên duy nhất; Mua hàng và nhà máy chỉ nhận, không sửa" />
      {issued.length === 0 ? (
        <Empty text="Chưa có đơn ban hành." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Ưu tiên</Th>
              <Th>Đơn</Th>
              <Th>Xuất hàng</Th>
              <Th>Ban hành</Th>
              <Th>Đặt hàng (bước 6)</Th>
            </tr>
          </thead>
          <tbody>
            {issued.map((v) => (
              <tr key={v.order.id}>
                <Td className="font-black tabular-nums text-slate-900">#{v.order.priority}</Td>
                <Td className="font-bold text-slate-900">{v.order.code}</Td>
                <Td>{fmtDM(v.order.exportDate)}</Td>
                <Td>{fmtDM(v.order.steps[4].doneAt)}</Td>
                <Td>
                  <StatusPill status={v.steps[6].status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MUA HÀNG
// ═══════════════════════════════════════════════════════════════════════════

export function PurchasingScreen() {
  const { state, views, canEdit, apply } = useDemo();
  const edit = canEdit("mh");
  const t = state.thresholds;

  const candidates = views
    .filter((v) => !v.order.steps[6].doneAt && (v.order.steps[3].doneAt || diffDays(v.steps[1].deadline!, state.today) <= 10))
    .sort((a, b) => (a.steps[1].deadline! < b.steps[1].deadline! ? -1 : 1));

  const waiting = views
    .filter((v) => v.order.steps[6].doneAt && !hasArrived(v.order, state.today))
    .sort((a, b) => ((expectedArrival(a.order) ?? "") < (expectedArrival(b.order) ?? "") ? -1 : 1));

  return (
    <div className="space-y-4">
      {!edit ? <ViewOnlyBanner ownerName={DEPTS.MH.name} /> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <DeadlineCalculator />
        <Card className="xl:col-span-2">
          <CardHeader
            icon={<IconShoppingCart size={20} />}
            title="Kiểm tra điều kiện & kích hoạt đặt hàng"
            subtitle={`Chỉ đặt hàng khi đủ BOM, Wink, Giày mẫu, No Silent · đặt trong ${t.orderDays} ngày kể từ khi có No Silent`}
          />
          {candidates.length === 0 ? (
            <Empty text="Không có đơn chờ đặt hàng." />
          ) : (
            <Table minWidth={720}>
              <thead>
                <tr>
                  <Th>Đơn / NCC</Th>
                  <Th>Hạn giao TT</Th>
                  <Th>BOM</Th>
                  <Th>Wink</Th>
                  <Th>Giày mẫu</Th>
                  <Th>No Silent</Th>
                  <Th>Trạng thái</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {candidates.map((v) => {
                  const o = v.order;
                  const missing = missingOrderConditions(o);
                  const ready = missing.length === 0 && v.steps[6].status !== "pending" && v.steps[6].status !== "blocked";
                  const cond = (ok: boolean) => (
                    <span className={cx("inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-black", ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700")}>
                      {ok ? "✓" : "✗"}
                    </span>
                  );
                  return (
                    <tr key={o.id}>
                      <Td>
                        <div className="font-black text-slate-900">{o.code}</div>
                        <div className="text-[11px] text-slate-500">{supplierOf(state, o).name}</div>
                      </Td>
                      <Td>
                        <div>{fmtDM(v.steps[1].deadline)}</div>
                        {!o.steps[1].doneAt ? <DueText daysLeft={v.steps[1].daysLeft} /> : <span className="text-[11px] text-emerald-700">Đã giao</span>}
                      </Td>
                      <Td>{cond(o.docs.bom)}</Td>
                      <Td>{cond(o.docs.wink)}</Td>
                      <Td>{cond(o.docs.giayMau)}</Td>
                      <Td>{o.noSilent ? cond(!!o.steps[5].doneAt) : <span className="text-[11px] text-slate-400">Không áp dụng</span>}</Td>
                      <Td>
                        {missing.length > 0 ? (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-rose-700">Chưa đủ điều kiện</span>
                            <div className="flex flex-wrap gap-1">
                              {missing.map((m) => (
                                <span key={m.key} className="text-[10px] text-slate-600">
                                  thiếu {m.label} ({DEPTS[m.dept].name})
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : ready ? (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold text-emerald-700">Đủ điều kiện</span>
                            <div className="text-[11px]">
                              <DueText daysLeft={v.steps[6].daysLeft} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-600">{v.steps[6].reason}</span>
                        )}
                      </Td>
                      <Td>
                        <Btn small variant="primary" readOnly={!edit} disabled={!ready} onClick={() => apply((s) => activateOrder(s, o.id))}>
                          Kích hoạt & phát hành PO
                        </Btn>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader icon={<IconTruckDelivery size={20} />} title="PO đang chờ hàng về – đôn đốc NCC theo thứ tự 312" subtitle="NCC báo trễ: cập nhật ngày về, hệ thống tính lại ảnh hưởng đến ngày cấp vật tư" />
        {waiting.length === 0 ? (
          <Empty text="Không có PO đang chờ hàng." />
        ) : (
          <Table minWidth={760}>
            <thead>
              <tr>
                <Th>Ưu tiên</Th>
                <Th>Đơn / PO</Th>
                <Th>NCC</Th>
                <Th>ETA trên PO</Th>
                <Th>Ngày về dự kiến</Th>
                <Th>Tình trạng</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {waiting.map((v) => {
                const o = v.order;
                const exp = expectedArrival(o);
                const late = exp ? diffDays(state.today, exp) : 0;
                return (
                  <tr key={o.id}>
                    <Td className="font-black tabular-nums">#{o.priority}</Td>
                    <Td>
                      <div className="font-bold text-slate-900">{o.code}</div>
                      <div className="text-[11px] text-slate-500">{o.poNo}</div>
                    </Td>
                    <Td>{supplierOf(state, o).name}</Td>
                    <Td>{fmtDM(o.eta)}</Td>
                    <Td className={cx(o.supplierDelay ? "font-bold text-amber-800" : "")}>
                      {fmtDM(exp)}
                      {o.supplierDelay ? ` (+${o.supplierDelay} ngày)` : ""}
                    </Td>
                    <Td>
                      {late > 0 ? <StatusPill status="blocked" suffix={`NCC trễ ${late} ngày`} /> : <StatusPill status="doing" suffix={`về sau ${-late} ngày`} />}
                    </Td>
                    <Td>
                      <Btn small readOnly={!edit} onClick={() => apply((s) => reportSupplierDelay(s, o.id, 3))}>
                        NCC báo trễ +3 ngày
                      </Btn>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <InboundPlanCard edit={edit} />
        <IncidentCard edit={edit} />
      </div>
    </div>
  );
}

function DeadlineCalculator() {
  const { state } = useDemo();
  const t = state.thresholds;
  const [exportDate, setExportDate] = useState("2026-12-18");
  const [lt, setLt] = useState(35);
  const [vc, setVc] = useState(10);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(exportDate);
  const total = lt + vc + t.productionDays + t.bomDays;
  const result = valid ? infoDeadline(exportDate, lt, vc, t) : null;
  const field = "min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold";
  return (
    <Card>
      <CardHeader icon={<IconCalculator size={20} />} title="Công cụ tính hạn chót giao thông tin" subtitle="Mục 2.1 · ví dụ trong tài liệu được điền sẵn" />
      <div className="space-y-3 px-4 py-3 text-xs">
        <label className="block space-y-1">
          <span className="font-bold text-slate-700">Ngày xuất hàng</span>
          <input type="date" value={exportDate} onChange={(e) => setExportDate(e.target.value)} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="font-bold text-slate-700">Lead time NCC (ngày)</span>
            <input type="number" min={0} value={lt} onChange={(e) => setLt(Number(e.target.value) || 0)} className={field} />
          </label>
          <label className="block space-y-1">
            <span className="font-bold text-slate-700">Vận chuyển (ngày)</span>
            <input type="number" min={0} value={vc} onChange={(e) => setVc(Number(e.target.value) || 0)} className={field} />
          </label>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <div className="text-[11px] font-semibold text-emerald-900">
            Lùi lại {lt} + {vc} + {t.productionDays} + {t.bomDays} = {total} ngày
          </div>
          <div className="mt-0.5 text-lg font-black text-[#006838]">{result ? fmtDMY(result) : "—"}</div>
          <div className="text-[11px] text-emerald-900">Hạn chót Kinh doanh / Công nghệ giao thông tin</div>
        </div>
      </div>
    </Card>
  );
}

function InboundPlanCard({ edit }: { edit: boolean }) {
  const { state, apply } = useDemo();
  const start = weekStart(state.today);
  const weeks = [0, 1, 2, 3].map((n) => addDays(start, n * 7));
  const sentThisWeek = state.inboundPlanSentWeek === start;
  const lots = state.orders
    .filter((o) => o.steps[6].doneAt && !o.steps[8].doneAt)
    .map((o) => ({ o, exp: expectedArrival(o)! }))
    .filter((x) => x.exp >= start && x.exp < addDays(start, 28));
  return (
    <Card>
      <CardHeader
        icon={<IconPackageImport size={20} />}
        title="Kế hoạch dự kiến nhập hàng 4 tuần gửi Kho"
        subtitle="Tổng hợp tự động từ ngày về dự kiến trên PO · gửi Kho vào thứ Ba"
        right={
          <Btn small variant="primary" readOnly={!edit} onClick={() => apply(sendInboundPlan)}>
            <IconSend size={14} /> {sentThisWeek ? "Gửi lại bản cập nhật" : "Gửi kế hoạch cho Kho"}
          </Btn>
        }
      />
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
        {weeks.map((w) => {
          const inWeek = lots.filter((x) => x.exp >= w && x.exp < addDays(w, 7));
          return (
            <div key={w} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="text-[11px] font-black text-slate-700">{weekLabel(w)}</div>
              <div className="text-2xl font-black tabular-nums text-slate-900">{inWeek.length}</div>
              <div className="text-[11px] text-slate-500">lô dự kiến về</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {inWeek.slice(0, 6).map((x) => (
                  <span key={x.o.id} className="rounded bg-white px-1 text-[10px] font-bold text-slate-600">
                    {x.o.code.slice(6)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-100 px-4 py-2 text-[11px] font-semibold text-slate-500">
        {sentThisWeek ? `Đã gửi Kho trong ${weekLabel(start)}` : `Chưa gửi trong ${weekLabel(start)}`}
      </div>
    </Card>
  );
}

const PLANS: IncidentPlan[] = ["DOI_HANG", "BU_THIEU", "GIAM_GIA", "TRA_HANG"];

function IncidentCard({ edit }: { edit: boolean }) {
  const { state, apply } = useDemo();
  const t = state.thresholds;
  const open = state.incidents.filter((i) => i.status !== "CLOSED");
  const closed = state.incidents.filter((i) => i.status === "CLOSED").slice(-3);
  const statusText: Record<string, string> = {
    OPEN: "Chờ NCC xác nhận phương án",
    PLAN_AGREED: "Đang thực hiện phương án",
    AWAITING_CONFIRM: "Chờ Kho/QC xác nhận",
  };
  return (
    <Card>
      <CardHeader
        icon={<IconTool size={20} />}
        title="Xử lý vật tư không đạt với NCC"
        subtitle={`Tối đa ${t.incidentDays} ngày · chỉ đóng khi Kho hoặc QC xác nhận`}
      />
      {open.length === 0 ? (
        <Empty text="Không có sự cố đang mở." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {open.map((inc) => {
            const order = state.orders.find((o) => o.id === inc.orderId)!;
            const age = diffDays(state.today, inc.createdAt);
            const left = t.incidentDays - age;
            return (
              <li key={inc.id} className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="text-xs">
                    <div className="font-black text-slate-900">
                      {inc.id} · {order.code}
                    </div>
                    <div className="text-slate-500">
                      {supplierOf(state, order).name} · {inc.kind === "CHAT_LUONG" ? "Chất lượng" : "Số lượng"} · {inc.note}
                    </div>
                    <div className="mt-0.5 font-semibold text-slate-700">
                      {statusText[inc.status]}
                      {inc.plan ? ` · ${INCIDENT_PLAN_LABEL[inc.plan]}` : ""}
                      {inc.replacementEta && inc.status === "PLAN_AGREED" ? ` · hàng về ${fmtDM(inc.replacementEta)}` : ""}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-[11px] text-slate-500">Lập {fmtDM(inc.createdAt)}</div>
                    <DueText daysLeft={left} />
                    {left < 0 ? (
                      <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-bold text-rose-700">
                        <IconAlertTriangle size={12} /> Leo thang
                      </div>
                    ) : null}
                  </div>
                </div>
                {inc.status === "OPEN" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {PLANS.map((p) => (
                      <Btn key={p} small readOnly={!edit} onClick={() => apply((s) => agreeIncidentPlan(s, inc.id, p))}>
                        {INCIDENT_PLAN_LABEL[p]}
                      </Btn>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {closed.length > 0 ? (
        <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
          Đã đóng gần đây:{" "}
          {closed.map((i) => `${i.id} (${diffDays(i.closedAt!, i.createdAt)} ngày)`).join(", ")}
        </div>
      ) : null}
    </Card>
  );
}

