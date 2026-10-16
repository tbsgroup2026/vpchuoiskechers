// Engine luồng 10 bước: hạn chót tính ngược, trạng thái do server tính, điểm nghẽn, leo thang.
// Hàm thuần (không đọc D1, không phụ thuộc React) để worker và vitest dùng chung.

import { OWNER_DEPT_NAME, STEPS, STEP_NOS, type OwnerDept, type ScmSettings, type StepNo } from "./config";

// ─── Ngày (chuỗi YYYY-MM-DD, lịch Asia/Ho_Chi_Minh) ──────────────────────────

const DAY = 86400000;
const toMs = (d: string) => Date.parse(`${d.slice(0, 10)}T00:00:00Z`);
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (d: string, n: number) => fromMs(toMs(d) + n * DAY);
/** Số ngày từ b tới a (a − b) */
export const diffDays = (a: string, b: string) => Math.round((toMs(a) - toMs(b)) / DAY);
const maxDate = (...ds: (string | null | undefined)[]) => ds.filter(Boolean).sort().pop() ?? null;
/** Thứ trong tuần theo kiểu 1 = thứ Hai … 7 = Chủ nhật */
export const weekday = (d: string) => ((new Date(toMs(d)).getUTCDay() + 6) % 7) + 1;
export const onOrAfterWeekday = (d: string, wd: number) => addDays(d, (wd - weekday(d) + 7) % 7);

/** Ngày hôm nay theo giờ Việt Nam */
export function vnToday(now: number = Date.now()): string {
  return new Date(now + 7 * 3600000).toISOString().slice(0, 10);
}

export function fmtDMY(d?: string | null): string {
  if (!d) return "";
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

// ─── Kiểu dữ liệu ─────────────────────────────────────────────────────────────

export type StepStatus = "done" | "doing" | "late" | "blocked" | "pending" | "na";
export type OrderState = "complete" | "blocked" | "late" | "on_track";

export interface OrderInput {
  ship_date: string;
  supplier_lead_time: number;
  transport_days: number;
  no_silent: boolean;
  /** Nguồn hàng của NCC chính: nội địa kiểm 3 ngày, nhập khẩu 7 ngày */
  origin?: "NOI_DIA" | "NHAP_KHAU";
  eta?: string | null;
}

/** Ngày hoàn thành của từng bước (YYYY-MM-DD hoặc datetime), null nếu chưa xong */
export type DoneMap = Partial<Record<StepNo, string | null>>;

export interface WaitingOn {
  step: StepNo;
  owner: OwnerDept;
  label: string;
}

export interface StepView {
  no: StepNo;
  owner: OwnerDept;
  status: StepStatus;
  due: string;
  doneAt: string | null;
  daysLeft: number;
  daysLate: number;
  doneLate: boolean;
  reason: string;
  waitingOn?: WaitingOn;
}

export interface OrderView {
  steps: StepView[];
  state: OrderState;
  progress: number;
  /** Bước gây vướng chính (để hiện cột "đang vướng ở") */
  stuck: { step: StepNo; owner: OwnerDept; text: string } | null;
  infoDeadline: string;
}

// ─── Hạn chót ────────────────────────────────────────────────────────────────

/** Hạn chót KD/CN = Ngày xuất − (Lead time NCC + Vận chuyển + ngày sản xuất + ngày xử lý BOM) */
export function infoDeadline(shipDate: string, leadTime: number, transport: number, s: ScmSettings): string {
  return addDays(shipDate, -(leadTime + transport + s.production_days + s.bom_days));
}

/** Chuỗi phép tính để hiển thị, ví dụ "35 + 10 + 30 + 3 = 78 ngày" */
export function infoDeadlineFormula(leadTime: number, transport: number, s: ScmSettings): string {
  const total = leadTime + transport + s.production_days + s.bom_days;
  return `${leadTime} + ${transport} + ${s.production_days} + ${s.bom_days} = ${total} ngày`;
}

const done = (m: DoneMap, k: StepNo) => (m[k] ? String(m[k]).slice(0, 10) : null);

/**
 * Hạn của từng bước. Bước đã xong dùng ngày xong thật làm mốc cho bước sau;
 * bước chưa xong dùng hạn dự kiến của chính nó, để bước sau vẫn có hạn và phát hiện được "Bị chặn".
 */
export function computeDueDates(o: OrderInput, m: DoneMap, s: ScmSettings): Record<StepNo, string> {
  const due = {} as Record<StepNo, string>;
  const base = (k: StepNo) => done(m, k) ?? due[k];
  const inspect = o.origin === "NOI_DIA" ? s.inspect_domestic_days : s.inspect_import_days;

  due[1] = infoDeadline(o.ship_date, o.supplier_lead_time, o.transport_days, s);
  due[2] = o.eta ?? addDays(o.ship_date, -s.production_days);
  due[3] = addDays(base(1), s.plan_days);
  due[4] = onOrAfterWeekday(base(3), s.plan312_weekday);
  due[5] = addDays(base(3), s.no_silent_days);
  const base5 = o.no_silent ? base(5) : base(3);
  due[6] = addDays(maxDate(base(2), base5)!, s.order_days);
  due[7] = onOrAfterWeekday(addDays(base(4), 1), s.inbound_plan_weekday);
  const arrival = o.eta ?? addDays(base(6), o.supplier_lead_time + o.transport_days);
  due[8] = addDays(maxDate(arrival, base(6))!, inspect);
  due[9] = addDays(base(8), Math.max(Math.ceil(s.lab_hours / 24), s.color_days));
  due[10] = addDays(o.ship_date, -(s.sew_to_export_days + s.supply_lead_days));
  return due;
}

// ─── Trạng thái ──────────────────────────────────────────────────────────────

const isNa = (o: OrderInput, k: StepNo) => k === 5 && !o.no_silent;
const isClosed = (o: OrderInput, m: DoneMap, k: StepNo) => isNa(o, k) || Boolean(done(m, k));

/** Một bước chỉ được đánh dấu Hoàn thành khi mọi bước phụ thuộc đã Hoàn thành */
export function canComplete(o: OrderInput, m: DoneMap, k: StepNo): { ok: boolean; missing: StepNo[] } {
  const missing = STEPS[k].deps.filter((d) => !isClosed(o, m, d));
  return { ok: missing.length === 0, missing };
}

/** Các bước đã xong phụ thuộc (trực tiếp hoặc gián tiếp) vào bước k, sẽ bị hoàn tác theo */
export function undoCascade(m: DoneMap, k: StepNo): StepNo[] {
  const out = new Set<StepNo>();
  const visit = (x: StepNo) => {
    for (const n of STEP_NOS) {
      if (STEPS[n].deps.includes(x) && !out.has(n)) {
        out.add(n);
        visit(n);
      }
    }
  };
  visit(k);
  return STEP_NOS.filter((n) => out.has(n) && done(m, n));
}

export function computeOrderView(o: OrderInput, m: DoneMap, today: string, s: ScmSettings): OrderView {
  const due = computeDueDates(o, m, s);
  const views = {} as Record<StepNo, StepView>;

  for (const k of STEP_NOS) {
    const meta = STEPS[k];
    const doneAt = done(m, k);
    const v: StepView = {
      no: k,
      owner: meta.owner,
      status: "pending",
      due: due[k],
      doneAt,
      daysLeft: diffDays(due[k], today),
      daysLate: 0,
      doneLate: false,
      reason: "",
    };

    if (isNa(o, k)) {
      views[k] = { ...v, status: "na", reason: "Không áp dụng (đơn không có No Silent)" };
      continue;
    }
    if (doneAt) {
      const late = diffDays(doneAt, due[k]);
      views[k] = { ...v, status: "done", doneLate: late > 0, daysLate: Math.max(0, late), reason: late > 0 ? `Hoàn thành trễ ${late} ngày` : "Hoàn thành đúng hạn" };
      continue;
    }

    const open = meta.deps.filter((d) => !isClosed(o, m, d));
    if (open.length) {
      // Truy tới bước gốc đang giữ chân (bước chưa xong mà mọi phụ thuộc của nó đã xong)
      const first = views[open.find((d) => views[d].status === "late" || views[d].status === "blocked") ?? open[0]];
      const waitingOn = first.waitingOn ?? { step: first.no, owner: first.owner, label: STEPS[first.no].short };
      const reached = today >= due[k];
      views[k] = {
        ...v,
        status: reached ? "blocked" : "pending",
        daysLate: reached ? Math.max(0, diffDays(today, due[k])) : 0,
        reason: `Chờ bước ${waitingOn.step} (${OWNER_DEPT_NAME[waitingOn.owner]})`,
        waitingOn,
      };
      continue;
    }

    if (today > due[k]) {
      const late = diffDays(today, due[k]);
      views[k] = { ...v, status: "late", daysLate: late, reason: `Trễ hạn ${late} ngày` };
    } else {
      views[k] = { ...v, status: "doing", reason: v.daysLeft === 0 ? "Đến hạn hôm nay" : `Còn ${v.daysLeft} ngày` };
    }
  }

  const list = STEP_NOS.map((k) => views[k]);
  const closed = list.filter((v) => v.status === "done" || v.status === "na").length;
  const state: OrderState = closed === 10 ? "complete" : list.some((v) => v.status === "blocked") ? "blocked" : list.some((v) => v.status === "late") ? "late" : "on_track";

  let stuck: OrderView["stuck"] = null;
  const lateStep = list.find((v) => v.status === "late");
  const blockedStep = list.find((v) => v.status === "blocked");
  const doingStep = list.find((v) => v.status === "doing");
  if (blockedStep?.waitingOn) {
    const root = views[blockedStep.waitingOn.step];
    stuck = { step: root.no, owner: root.owner, text: `Bước ${root.no} ${STEPS[root.no].short}: ${root.reason}` };
  } else if (lateStep) {
    stuck = { step: lateStep.no, owner: lateStep.owner, text: `Bước ${lateStep.no} ${STEPS[lateStep.no].short}: ${lateStep.reason}` };
  } else if (doingStep) {
    stuck = { step: doingStep.no, owner: doingStep.owner, text: `Bước ${doingStep.no} ${STEPS[doingStep.no].short}: ${doingStep.reason}` };
  }

  return { steps: list, state, progress: Math.round((closed / 10) * 100), stuck, infoDeadline: due[1] };
}

/** Điểm rủi ro để sắp xếp "rủi ro cao trước" */
export function riskScore(v: OrderView, shipDate: string, today: string): number {
  const stateW = { blocked: 3000, late: 2000, on_track: 1000, complete: 0 }[v.state];
  const maxLate = Math.max(0, ...v.steps.map((s) => s.daysLate));
  const shipSoon = Math.max(0, 120 - diffDays(shipDate, today));
  return stateW + maxLate * 10 + shipSoon;
}

// ─── Điểm nghẽn theo bộ phận ─────────────────────────────────────────────────

export interface Bottleneck {
  owner: OwnerDept;
  late: number;
  blocking: number;
  total: number;
}

/**
 * Với mỗi bộ phận: số bước bộ phận đó đang trễ + số bước phía sau đang bị chặn vì chờ bộ phận đó.
 */
export function computeBottlenecks(views: OrderView[]): Bottleneck[] {
  const map = new Map<OwnerDept, Bottleneck>();
  const get = (o: OwnerDept) => map.get(o) ?? map.set(o, { owner: o, late: 0, blocking: 0, total: 0 }).get(o)!;
  for (const v of views) {
    for (const s of v.steps) {
      if (s.status === "late") get(s.owner).late++;
      if (s.status === "blocked" && s.waitingOn) get(s.waitingOn.owner).blocking++;
    }
  }
  return Array.from(map.values())
    .map((b) => ({ ...b, total: b.late + b.blocking }))
    .filter((b) => b.total > 0)
    .sort((a, b) => b.total - a.total);
}

// ─── Leo thang ───────────────────────────────────────────────────────────────

/**
 * Cấp 1: còn ≤ N ngày mà chưa xong. Cấp 2: đã quá hạn. Cấp 3: quá hạn ≥ M ngày.
 * Chỉ bước đang giữ việc (Đang làm/Trễ hạn) mới leo thang; bước bị chặn đã được tính vào bước gốc.
 */
export function escalationLevel(v: StepView, s: ScmSettings): 0 | 1 | 2 | 3 {
  if (v.status === "late") return v.daysLate >= s.escalate_l3_days ? 3 : 2;
  if (v.status === "doing" && v.daysLeft <= s.escalate_l1_days) return 1;
  return 0;
}
