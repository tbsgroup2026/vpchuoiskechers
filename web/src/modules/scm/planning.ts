// Kế hoạch phân bổ cuốn chiếu 4 tuần và Kế hoạch 312: hàm thuần dùng chung cho worker, giao diện và vitest.

import { addDays, diffDays, weekday } from "./engine";

export type PlanStatus = "DRAFT" | "PENDING" | "APPROVED" | "ISSUED";

export const PLAN_STATUS: { key: PlanStatus; label: string }[] = [
  { key: "DRAFT", label: "Nháp" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "ISSUED", label: "Đã ban hành" },
];

export interface AllocLine {
  order_id: string;
  week_start: string;
  plant: string;
  line: string;
}

export interface PlanOrder {
  id: string;
  code: string;
  qty: number;
  ship_date: string;
}

/** Thứ Hai của tuần chứa ngày d */
export function mondayOf(d: string): string {
  return addDays(d, -(weekday(d) - 1));
}

/** 4 tuần liên tục bắt đầu từ thứ Hai weekStart */
export function planWeeks(weekStart: string): string[] {
  return [0, 1, 2, 3].map((i) => addDays(weekStart, i * 7));
}

/** Ưu tiên 312: xếp theo ngày xuất tăng dần, trùng ngày thì theo mã đơn; mỗi đơn đúng một thứ tự */
export function rankPriority(orders: PlanOrder[]): Map<string, number> {
  const sorted = [...orders].sort((a, b) => a.ship_date.localeCompare(b.ship_date) || a.code.localeCompare(b.code));
  return new Map(sorted.map((o, i) => [o.id, i + 1]));
}

export interface WeekLoad {
  week: string;
  load: number;
  capacity: number;
  over: boolean;
  overLines: string[];
  /** Chi tiết từng nhà máy · chuyền (kế hoạch Tầng 2) */
  lines: { plant: string; line: string; load: number; capacity: number; over: boolean }[];
}

/** Tải so với năng lực từng tuần; tuần vượt khi có chuyền nào tải lớn hơn năng lực của chuyền đó */
export function capacityByWeek(
  weeks: string[],
  lines: AllocLine[],
  orders: PlanOrder[],
  capacityOf: (plant: string, line: string, week: string) => number,
): WeekLoad[] {
  const qty = new Map(orders.map((o) => [o.id, Number(o.qty) || 0]));
  return weeks.map((week) => {
    const byLine = new Map<string, { plant: string; line: string; load: number }>();
    for (const l of lines.filter((x) => x.week_start === week && x.plant)) {
      const key = `${l.plant}|${l.line}`;
      const cur = byLine.get(key) ?? { plant: l.plant, line: l.line, load: 0 };
      cur.load += qty.get(l.order_id) ?? 0;
      byLine.set(key, cur);
    }
    let load = 0;
    let capacity = 0;
    const overLines: string[] = [];
    const detail: WeekLoad["lines"] = [];
    for (const v of byLine.values()) {
      const cap = capacityOf(v.plant, v.line, week);
      detail.push({ ...v, capacity: cap, over: v.load > cap });
      load += v.load;
      capacity += cap;
      if (v.load > cap) overLines.push(`${v.plant} · ${v.line}`);
    }
    return { week, load, capacity, over: overLines.length > 0, overLines, lines: detail.sort((a, b) => `${a.plant}${a.line}`.localeCompare(`${b.plant}${b.line}`)) };
  });
}

/** Quy tắc kiểm tra kế hoạch (mục 4.2) */
export function validatePlan(weeks: string[], lines: AllocLine[]): string[] {
  const errors: string[] = [];
  if (weeks.length !== 4) errors.push("Kế hoạch phải có đủ 4 tuần");
  for (let i = 1; i < weeks.length; i++) {
    if (diffDays(weeks[i], weeks[i - 1]) !== 7) errors.push("4 tuần phải liên tục");
  }
  const seen = new Set<string>();
  for (const l of lines) {
    if (!weeks.includes(l.week_start)) errors.push(`Đơn ${l.order_id} được xếp vào tuần ngoài kế hoạch (${l.week_start})`);
    const key = `${l.order_id}|${l.week_start}`;
    if (seen.has(key)) errors.push(`Đơn ${l.order_id} có hơn một nhà máy·chuyền trong tuần ${l.week_start}`);
    seen.add(key);
  }
  return errors;
}

/** Chỉ ban hành khi đã duyệt, không tuần nào vượt năng lực và kế hoạch hợp lệ */
export function canIssue(status: PlanStatus, loads: WeekLoad[], errors: string[]): { ok: boolean; reason?: string } {
  if (status !== "APPROVED") return { ok: false, reason: "Kế hoạch chưa được trưởng bộ phận phê duyệt" };
  const over = loads.filter((w) => w.over);
  if (over.length) return { ok: false, reason: `Có ${over.length} tuần vượt năng lực: ${over.map((w) => w.overLines.join(", ")).join("; ")}` };
  if (errors.length) return { ok: false, reason: errors[0] };
  return { ok: true };
}

/** Thêm tuần mới: luôn giữ đủ 4 tuần; tuần cũ nhất chuyển sang sản xuất, giữ lại phân bổ 3 tuần sau */
export function rollForward(weekStart: string, lines: AllocLine[]): { weekStart: string; carried: AllocLine[]; released: AllocLine[] } {
  const next = addDays(weekStart, 7);
  return {
    weekStart: next,
    carried: lines.filter((l) => l.week_start >= next),
    released: lines.filter((l) => l.week_start < next),
  };
}

/** Chuyển trạng thái hợp lệ của kế hoạch */
export const PLAN_TRANSITIONS: Record<string, { from: PlanStatus[]; to: PlanStatus }> = {
  submit: { from: ["DRAFT"], to: "PENDING" },
  approve: { from: ["PENDING"], to: "APPROVED" },
  reopen: { from: ["PENDING", "APPROVED"], to: "DRAFT" },
  issue: { from: ["APPROVED"], to: "ISSUED" },
};
