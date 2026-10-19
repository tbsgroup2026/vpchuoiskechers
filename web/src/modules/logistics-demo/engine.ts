// Engine tính toán của DEMO: hạn chót, trạng thái 10 bước, điểm nghẽn, leo thang, cân đối.
// Hàm thuần, không phụ thuộc React, để kiểm thử bằng vitest.

import { DEPTS, PROJECT_START, STEPS, STEP_NOS } from "./config";
import { addDays, diffDays, maxDate, onOrAfterWeekday, weekStart } from "./dates";
import type { DemoState, DeptKey, Incident, Order, StepNo, StepStatus, Supplier, Thresholds } from "./types";

// ─── Hạn chót ────────────────────────────────────────────────────────────────

/** Mục 2.1: Hạn chót KD/CN giao thông tin = Xuất hàng − (LT NCC + Vận chuyển + 30 ngày SX + 3 ngày BOM) */
export function infoDeadline(exportDate: string, leadTime: number, transport: number, t: Thresholds): string {
  return addDays(exportDate, -(leadTime + transport + t.productionDays + t.bomDays));
}

/** Ngày hàng phải về theo công thức = Xuất hàng − 30 ngày sản xuất */
export function plannedArrival(o: Order, t: Thresholds): string {
  return addDays(o.exportDate, -t.productionDays);
}

/** Ngày bắt đầu may = Xuất hàng − số ngày may/hoàn thiện (ngưỡng đề xuất, chỉnh được) */
export function sewDate(o: Order, t: Thresholds): string {
  return addDays(o.exportDate, -t.sewToExportDays);
}

/** Mục 7.7: Ngày cấp = ngày may − 14 ngày */
export function supplyDeadline(o: Order, t: Thresholds): string {
  return addDays(sewDate(o, t), -t.supplyLeadDays);
}

export function inspectDays(s: Supplier, t: Thresholds): number {
  return s.origin === "NOI_DIA" ? t.inspectDomestic : t.inspectImport;
}

export function labDeadline(o: Order, t: Thresholds): string | null {
  return o.qcReceivedAt ? addDays(o.qcReceivedAt, Math.ceil(t.labHours / 24)) : null;
}

export function colorDeadline(o: Order, t: Thresholds): string | null {
  return o.qcReceivedAt ? addDays(o.qcReceivedAt, t.colorDays) : null;
}

export function supplierOf(state: Pick<DemoState, "suppliers">, o: Order): Supplier {
  return state.suppliers.find((s) => s.id === o.supplierId) ?? state.suppliers[0];
}

export function isStepDone(o: Order, k: StepNo): boolean {
  const r = o.steps[k];
  return !!(r && (r.doneAt || r.na));
}

export function hasArrived(o: Order, today: string): boolean {
  return !!(o.steps[6]?.doneAt && o.actualArrival && o.actualArrival <= today);
}

/** ETA đang có hiệu lực (ETA trên PO + số ngày NCC báo trễ) */
export function expectedArrival(o: Order): string | null {
  return o.eta ? addDays(o.eta, o.supplierDelay ?? 0) : null;
}

export function openIncident(incidents: Incident[], orderId: string, kind?: Incident["kind"]): Incident | undefined {
  return incidents.find((i) => i.orderId === orderId && i.status !== "CLOSED" && (!kind || i.kind === kind));
}

/** Các điều kiện kích hoạt đặt hàng (mục 2.1): đủ BOM, Wink, Giày mẫu và No Silent */
export function missingOrderConditions(o: Order): { key: string; label: string; dept: DeptKey }[] {
  const missing: { key: string; label: string; dept: DeptKey }[] = [];
  if (!o.docs.bom) missing.push({ key: "bom", label: "BOM", dept: "KD" });
  if (!o.docs.wink) missing.push({ key: "wink", label: "Wink", dept: "KD" });
  if (!o.docs.giayMau) missing.push({ key: "giayMau", label: "Giày mẫu", dept: "KD" });
  if (o.noSilent && !o.steps[5]?.doneAt) missing.push({ key: "noSilent", label: "No Silent", dept: "KH" });
  return missing;
}

/** Hạn của bước k; null khi chưa xác định được (bước phía trước chưa xong) */
export function stepDeadline(state: DemoState, o: Order, k: StepNo): string | null {
  const t = state.thresholds;
  const s = supplierOf(state, o);
  const d = (n: StepNo) => o.steps[n]?.doneAt ?? null;
  switch (k) {
    case 1:
      return infoDeadline(o.exportDate, s.leadTime, s.transport, t);
    case 2:
      return expectedArrival(o) ?? plannedArrival(o, t);
    case 3:
      return d(1) ? addDays(d(1)!, t.planDays) : null;
    case 4:
      return d(3) ? onOrAfterWeekday(d(3)!, 1) : null;
    case 5: {
      const base = d(4) ?? stepDeadline(state, o, 4);
      return base ? addDays(base, t.noSilentDays) : null;
    }
    case 6: {
      if (!STEPS[6].deps.every((n) => isStepDone(o, n))) return null;
      const base = maxDate(d(2), d(4), d(5));
      return base ? addDays(base, t.orderDays) : null;
    }
    case 7:
      return d(4) ? onOrAfterWeekday(addDays(d(4)!, 1), 2) : null;
    case 8:
      return hasArrived(o, state.today) ? addDays(o.actualArrival!, inspectDays(s, t)) : null;
    case 9:
      return d(8) ? addDays(d(8)!, Math.ceil(t.labHours / 24)) : null;
    case 10:
      return supplyDeadline(o, t);
  }
}

// ─── Trạng thái từng bước ────────────────────────────────────────────────────

export interface WaitingOn {
  step: StepNo;
  dept: DeptKey;
  label: string;
}

export interface StepView {
  no: StepNo;
  status: StepStatus;
  dept: DeptKey;
  deadline: string | null;
  doneAt: string | null;
  /** Số ngày còn lại đến hạn (âm khi đã quá) */
  daysLeft: number | null;
  daysLate: number;
  doneLate: boolean;
  reason: string;
  waitingOn?: WaitingOn;
  /** Bước là nguyên nhân gốc (trễ, NCC trễ, sự cố) chứ không phải bị kéo theo */
  rootCause: boolean;
}

export interface OrderView {
  order: Order;
  supplier: Supplier;
  steps: Record<StepNo, StepView>;
  current: StepView | null;
  complete: boolean;
}

export function computeOrderView(state: DemoState, o: Order): OrderView {
  const today = state.today;
  const supplier = supplierOf(state, o);
  const views = {} as Record<StepNo, StepView>;

  for (const k of STEP_NOS) {
    const meta = STEPS[k];
    const rec = o.steps[k] ?? {};
    const deadline = stepDeadline(state, o, k);
    const base: StepView = {
      no: k,
      status: "pending",
      dept: meta.dept,
      deadline,
      doneAt: rec.doneAt ?? null,
      daysLeft: deadline ? diffDays(deadline, today) : null,
      daysLate: 0,
      doneLate: false,
      reason: "",
      rootCause: false,
    };

    if (rec.na) {
      views[k] = { ...base, status: "na", reason: "Không áp dụng (đơn không có No Silent)" };
      continue;
    }

    if (rec.doneAt) {
      const doneLate = !!deadline && rec.doneAt > deadline;
      views[k] = {
        ...base,
        status: "done",
        doneLate,
        daysLate: doneLate && deadline ? diffDays(rec.doneAt, deadline) : 0,
        reason: doneLate ? `Hoàn thành trễ ${diffDays(rec.doneAt, deadline!)} ngày` : "Hoàn thành đúng hạn",
      };
      continue;
    }

    const pastDue = !!deadline && today > deadline;
    const unfinishedDeps = meta.deps.filter((n) => !isStepDone(o, n)).map((n) => views[n]);

    if (unfinishedDeps.length > 0) {
      const troubled = unfinishedDeps.find((v) => v.status === "late" || v.status === "blocked");
      const root = troubled ?? unfinishedDeps[0];
      const waitingOn: WaitingOn = root.waitingOn ?? { step: root.no, dept: root.dept, label: STEPS[root.no].short };
      let reason = `Chờ bước ${waitingOn.step} – ${DEPTS[waitingOn.dept].name}`;
      if (k === 6) {
        const missing = missingOrderConditions(o);
        if (missing.length > 0) reason = `Chưa đủ điều kiện: thiếu ${missing.map((m) => m.label).join(", ")}`;
      }
      views[k] = {
        ...base,
        status: troubled || pastDue ? "blocked" : "pending",
        daysLate: pastDue ? diffDays(today, deadline!) : 0,
        reason,
        waitingOn,
      };
      continue;
    }

    if (k === 8 && !hasArrived(o, today)) {
      const eta = expectedArrival(o);
      if (eta && today > eta) {
        const late = diffDays(today, eta);
        views[k] = {
          ...base,
          status: "blocked",
          daysLate: late,
          reason: `NCC giao trễ ${late} ngày so với ETA ${eta.slice(8, 10)}/${eta.slice(5, 7)}`,
          waitingOn: { step: 8, dept: "MH", label: "Đôn đốc NCC giao trễ" },
          rootCause: true,
        };
      } else {
        views[k] = { ...base, reason: eta ? `Chờ hàng về – ETA ${eta.slice(8, 10)}/${eta.slice(5, 7)}` : "Chờ hàng về" };
      }
      continue;
    }

    const incidentKind = k === 8 ? "SO_LUONG" : k === 9 ? "CHAT_LUONG" : null;
    const incident = incidentKind ? openIncident(state.incidents, o.id, incidentKind) : undefined;
    if (incident) {
      views[k] = {
        ...base,
        status: "blocked",
        daysLate: pastDue ? diffDays(today, deadline!) : 0,
        reason: `Chờ Mua hàng xử lý hàng không đạt (${incident.id})`,
        waitingOn: { step: k, dept: "MH", label: "Xử lý hàng không đạt" },
        rootCause: true,
      };
      continue;
    }

    if (pastDue) {
      const late = diffDays(today, deadline!);
      views[k] = { ...base, status: "late", daysLate: late, reason: `Trễ hạn ${late} ngày`, rootCause: true };
    } else {
      views[k] = {
        ...base,
        status: "doing",
        reason: base.daysLeft === 0 ? "Đến hạn hôm nay" : `Còn ${base.daysLeft} ngày`,
      };
    }
  }

  const current = STEP_NOS.map((k) => views[k]).find((v) => v.status !== "done" && v.status !== "na") ?? null;
  return { order: o, supplier, steps: views, current, complete: current === null };
}

export function computeAll(state: DemoState): OrderView[] {
  return state.orders.map((o) => computeOrderView(state, o));
}

// ─── Điểm nghẽn ──────────────────────────────────────────────────────────────

export interface Bottleneck {
  key: string;
  step: StepNo;
  dept: DeptKey;
  label: string;
  orders: string[];
  maxDaysLate: number;
  /** Số bước phía sau đang bị chặn vì điểm nghẽn này */
  blockedDownstream: number;
}

export function computeBottlenecks(views: OrderView[]): Bottleneck[] {
  const map = new Map<string, Bottleneck>();
  const keyOf = (s: StepView) => `${s.no}-${s.waitingOn?.dept ?? s.dept}-${s.waitingOn?.label ?? STEPS[s.no].title}`;
  for (const v of views) {
    for (const k of STEP_NOS) {
      const s = v.steps[k];
      if (!s.rootCause) continue;
      const key = keyOf(s);
      const b = map.get(key) ?? {
        key,
        step: k,
        dept: s.waitingOn?.dept ?? s.dept,
        label: s.waitingOn?.label ?? STEPS[k].title,
        orders: [],
        maxDaysLate: 0,
        blockedDownstream: 0,
      };
      if (!b.orders.includes(v.order.code)) b.orders.push(v.order.code);
      b.maxDaysLate = Math.max(b.maxDaysLate, s.daysLate);
      map.set(key, b);
    }
    for (const k of STEP_NOS) {
      const s = v.steps[k];
      if (s.status !== "blocked" || s.rootCause || !s.waitingOn) continue;
      const b = map.get(keyOf(v.steps[s.waitingOn.step]));
      if (b) b.blockedDownstream += 1;
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.orders.length - a.orders.length || b.maxDaysLate - a.maxDaysLate,
  );
}

// ─── Leo thang (mục 7.9) ─────────────────────────────────────────────────────

export interface Escalation {
  key: string;
  level: 1 | 2 | 3;
  orderCode: string;
  step: StepNo | null;
  dept: DeptKey;
  text: string;
  recipient: string;
}

const RECIPIENT: Record<1 | 2 | 3, string> = {
  1: "Người đang giữ việc",
  2: "Trưởng bộ phận đang giữ việc",
  3: "Ban điều hành",
};

export function escalationLevel(status: StepStatus, daysLeft: number | null, daysLate: number, t: Thresholds): 0 | 1 | 2 | 3 {
  if (status === "late" || (status === "blocked" && daysLate > 0)) {
    return daysLate >= t.escalateL3Days ? 3 : 2;
  }
  if (status === "doing" && daysLeft !== null && daysLeft <= t.escalateL1Days) return 1;
  return 0;
}

export function computeEscalations(state: DemoState, views: OrderView[]): Escalation[] {
  const t = state.thresholds;
  const out: Escalation[] = [];
  for (const v of views) {
    for (const k of STEP_NOS) {
      const s = v.steps[k];
      if (!(s.status === "doing" || s.rootCause)) continue;
      const level = escalationLevel(s.status, s.daysLeft, s.daysLate, t);
      if (level === 0) continue;
      const dept = s.waitingOn?.dept ?? s.dept;
      const text =
        level === 1
          ? `Bước ${k} ${STEPS[k].short}: ${s.daysLeft === 0 ? "đến hạn hôm nay" : `còn ${s.daysLeft} ngày`}`
          : `Bước ${k} ${STEPS[k].short}: ${s.reason}`;
      out.push({ key: `${v.order.id}-${k}`, level, orderCode: v.order.code, step: k, dept, text, recipient: RECIPIENT[level] });
    }
  }
  for (const inc of state.incidents) {
    if (inc.status === "CLOSED") continue;
    const age = diffDays(state.today, inc.createdAt);
    if (age <= t.incidentDays) continue;
    const over = age - t.incidentDays;
    const level: 2 | 3 = over >= t.escalateL3Days ? 3 : 2;
    const order = state.orders.find((o) => o.id === inc.orderId);
    out.push({
      key: `inc-${inc.id}`,
      level,
      orderCode: order?.code ?? inc.orderId,
      step: null,
      dept: "MH",
      text: `Sự cố ${inc.id} quá hạn xử lý ${over} ngày (giới hạn ${t.incidentDays} ngày)`,
      recipient: level === 3 ? RECIPIENT[3] : "Trưởng bộ phận Mua hàng",
    });
  }
  return out.sort((a, b) => b.level - a.level);
}

// ─── Cân đối đồng bộ vật tư ──────────────────────────────────────────────────

/** % vật tư đồng bộ của đơn tại hôm nay */
export function syncPercent(o: Order, today: string): number {
  if (o.steps[10]?.doneAt || (o.steps[8]?.doneAt && o.steps[9]?.doneAt)) return 100;
  if (o.steps[8]?.doneAt) return Math.max(o.syncPct, 90);
  if (hasArrived(o, today)) return Math.max(o.syncPct, 75);
  return o.syncPct;
}

export interface ShortageItem {
  order: Order;
  supplyBy: string;
  daysToSupply: number;
  sync: number;
}

/** Đơn còn thiếu vật tư mà hạn cấp rơi vào 2 tuần tới (mục 7.6) */
export function shortageWithin(state: DemoState, days = 14): ShortageItem[] {
  const t = state.thresholds;
  return state.orders
    .filter((o) => !o.steps[10]?.doneAt)
    .map((o) => ({ order: o, supplyBy: supplyDeadline(o, t), sync: syncPercent(o, state.today) }))
    .map((x) => ({ ...x, daysToSupply: diffDays(x.supplyBy, state.today) }))
    .filter((x) => x.daysToSupply <= days && x.sync < 100)
    .sort((a, b) => a.daysToSupply - b.daysToSupply);
}

// ─── Phân bổ năng lực ────────────────────────────────────────────────────────

export const LINE_CAPACITY_PAIRS = 9000;

export interface AllocationCell {
  factory: string;
  line: string;
  week: string;
  orders: Order[];
  load: number;
  over: boolean;
}

export function allocationGrid(state: DemoState): AllocationCell[] {
  const cells: AllocationCell[] = [];
  const lines = Array.from(new Set(state.orders.map((o) => `${o.factory}|${o.line}`))).sort();
  for (const key of lines) {
    const [factory, line] = key.split("|");
    for (const week of state.planWeeks) {
      const orders = state.orders.filter((o) => o.factory === factory && o.line === line && o.planWeek === week);
      const load = orders.reduce((s, o) => s + o.qty, 0);
      cells.push({ factory, line, week, orders, load, over: load > LINE_CAPACITY_PAIRS });
    }
  }
  return cells;
}

/** Kế hoạch cuốn chiếu phải luôn đủ 4 tuần liên tục bắt đầu từ tuần hiện tại */
export function planCoverage(state: DemoState): { ok: boolean; missing: string[] } {
  const start = weekStart(state.today);
  const needed = [0, 1, 2, 3].map((i) => addDays(start, i * 7));
  const missing = needed.filter((w) => !state.planWeeks.includes(w));
  return { ok: missing.length === 0, missing };
}

// ─── Tiến độ dự án ───────────────────────────────────────────────────────────

/** Tuần dự án (T1 = tuần 42/2026) của ngày d */
export function projectWeek(d: string): number {
  return Math.floor(diffDays(d, PROJECT_START) / 7) + 1;
}

export function stepOnTime(views: OrderView[], k: StepNo): { done: number; onTime: number; rate: number | null } {
  const done = views.filter((v) => v.steps[k].status === "done");
  const onTime = done.filter((v) => !v.steps[k].doneLate);
  return { done: done.length, onTime: onTime.length, rate: done.length ? onTime.length / done.length : null };
}
