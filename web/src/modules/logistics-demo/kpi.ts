// KPI tự động (mục 7.8) và KPI cá nhân theo vị trí (mục 10), cách tính điểm theo mục 10.8.
// Chỉ số có dữ liệu trong demo được tính từ engine; chỉ số chưa có nguồn dữ liệu dùng số mẫu và gắn nhãn.

import { diffDays } from "./dates";
import { hasArrived, stepOnTime, supplyDeadline, syncPercent, type OrderView } from "./engine";
import type { DemoState, DeptKey, StepNo } from "./types";

export type KpiKind = "rate" | "max" | "zero";

export interface KpiValue {
  /** rate/max: tỷ lệ 0..1 · zero: số lỗi */
  actual: number | null;
  sample?: boolean;
  detail?: string;
}

export interface KpiDef {
  name: string;
  kind: KpiKind;
  /** rate: chỉ tiêu tối thiểu · max: ngưỡng tối đa · zero: 0 */
  target: number;
  weight: number;
  proposal?: boolean;
  value: (m: Metrics) => KpiValue;
}

export interface PositionDef {
  dept: DeptKey;
  title: string;
  kpis: KpiDef[];
}

export interface Metrics {
  step: (k: StepNo) => KpiValue;
  reportOnTime: KpiValue;
  barcode: KpiValue;
  syncAvg: KpiValue;
  incidentIn14: KpiValue;
  supplierOnTime: KpiValue;
  qcLateLots: KpiValue;
  prodSameDay: KpiValue;
  sample: (v: number, detail?: string) => KpiValue;
}

export function buildMetrics(state: DemoState, views: OrderView[]): Metrics {
  const step = (k: StepNo): KpiValue => {
    const r = stepOnTime(views, k);
    return { actual: r.rate, detail: `${r.onTime}/${r.done} lượt đúng hạn` };
  };
  const hist = state.reports;
  const reportOnTime: KpiValue = { actual: hist.length ? hist.filter((r) => r.onTime).length / hist.length : null, detail: `${hist.filter((r) => r.onTime).length}/${hist.length} báo cáo` };
  const total = state.barcode.reduce((s, z) => s + z.total, 0);
  const scanned = state.barcode.reduce((s, z) => s + z.scanned, 0);
  const barcode: KpiValue = { actual: total ? scanned / total : null, detail: `${scanned}/${total} ô kệ` };
  const near = state.orders.filter((o) => diffDays(supplyDeadline(o, state.thresholds), state.today) <= 28 && !o.steps[10].doneAt);
  const syncAvg: KpiValue = {
    actual: near.length ? near.reduce((s, o) => s + syncPercent(o, state.today), 0) / near.length / 100 : null,
    detail: `${near.length} đơn có hạn cấp trong 4 tuần`,
  };
  const closed = state.incidents.filter((i) => i.status === "CLOSED" && i.closedAt);
  const in14 = closed.filter((i) => diffDays(i.closedAt!, i.createdAt) <= state.thresholds.incidentDays);
  const openOver = state.incidents.filter((i) => i.status !== "CLOSED" && diffDays(state.today, i.createdAt) > state.thresholds.incidentDays);
  const incTotal = closed.length + openOver.length;
  const incidentIn14: KpiValue = incTotal
    ? { actual: in14.length / incTotal, detail: `${in14.length}/${incTotal} sự cố đóng trong hạn` }
    : { actual: 1, detail: "Chưa có sự cố quá hạn" };
  const arrived = state.orders.filter((o) => hasArrived(o, state.today) && o.eta);
  const onTimeArr = arrived.filter((o) => o.actualArrival! <= o.eta!);
  const supplierOnTime: KpiValue = { actual: arrived.length ? onTimeArr.length / arrived.length : null, detail: `${onTimeArr.length}/${arrived.length} lô` };
  const qcLate = views.filter((v) => v.steps[9].status === "late" || v.steps[9].doneLate).length;
  const qcLateLots: KpiValue = { actual: qcLate, detail: `${qcLate} lô quá hạn` };
  const supplied = state.orders.filter((o) => o.steps[10].doneAt && o.prodConfirmedAt);
  const sameDay = supplied.filter((o) => o.prodConfirmedAt === o.steps[10].doneAt);
  const prodSameDay: KpiValue = { actual: supplied.length ? sameDay.length / supplied.length : null, detail: `${sameDay.length}/${supplied.length} phiếu` };
  const sample = (v: number, detail = "Số mẫu – chưa có nguồn dữ liệu trong demo"): KpiValue => ({ actual: v, sample: true, detail });
  return { step, reportOnTime, barcode, syncAvg, incidentIn14, supplierOnTime, qcLateLots, prodSameDay, sample };
}

/** Mức đạt của một chỉ số (0..1) theo mục 10.8 */
export function attainment(def: KpiDef, v: KpiValue): number | null {
  if (v.actual === null) return null;
  if (def.kind === "zero") return v.actual <= 0 ? 1 : v.actual === 1 ? 0.5 : 0;
  if (def.kind === "max") return v.actual <= def.target ? 1 : def.target === 0 ? 0 : Math.max(0, def.target / v.actual);
  return def.target === 0 ? 1 : Math.min(1, v.actual / def.target);
}

export function positionScore(p: PositionDef, m: Metrics): { score: number | null; rows: { def: KpiDef; value: KpiValue; att: number | null }[] } {
  const rows = p.kpis.map((def) => {
    const value = def.value(m);
    return { def, value, att: attainment(def, value) };
  });
  const scored = rows.filter((r) => r.att !== null);
  if (scored.length === 0) return { score: null, rows };
  const weightSum = scored.reduce((s, r) => s + r.def.weight, 0);
  const score = (scored.reduce((s, r) => s + r.att! * r.def.weight, 0) / weightSum) * 100;
  return { score, rows };
}

export function grade(score: number | null): { label: string; cls: string } {
  if (score === null) return { label: "Chưa đủ dữ liệu", cls: "bg-slate-100 text-slate-600" };
  if (score >= 95) return { label: "Xuất sắc", cls: "bg-emerald-600 text-white" };
  if (score >= 85) return { label: "Tốt", cls: "bg-emerald-100 text-emerald-800" };
  if (score >= 70) return { label: "Đạt", cls: "bg-amber-100 text-amber-900" };
  return { label: "Cần cải thiện", cls: "bg-rose-100 text-rose-800" };
}

const rate = (name: string, target: number, weight: number, value: KpiDef["value"], proposal = false): KpiDef => ({ name, kind: "rate", target, weight, value, proposal });
const max = (name: string, target: number, weight: number, value: KpiDef["value"], proposal = true): KpiDef => ({ name, kind: "max", target, weight, value, proposal });
const zero = (name: string, weight: number, value: KpiDef["value"]): KpiDef => ({ name, kind: "zero", target: 0, weight, value });

export const POSITIONS: PositionDef[] = [
  {
    dept: "KH",
    title: "Trưởng bộ phận Kế hoạch & CCƯ",
    kpis: [
      rate("Kế hoạch tuần ban hành đúng hạn", 1, 30, (m) => m.step(4)),
      rate("Kế hoạch luôn đủ 4 tuần liên tục", 1, 25, (m) => m.sample(1, "Kiểm tra cuốn chiếu trên màn hình Kế hoạch")),
      rate("Điểm nghẽn của bộ phận xử lý trong ngày", 0.9, 25, (m) => m.sample(0.86), true),
      max("Đơn phải đổi lịch do kế hoạch sai", 0.05, 20, (m) => m.sample(0.04)),
    ],
  },
  {
    dept: "KH",
    title: "Nhân viên điều phối Kế hoạch 312 và No Silent",
    kpis: [
      rate("Kế hoạch 312 gửi đúng hạn", 1, 30, (m) => m.step(4)),
      rate("No Silent bàn giao đúng thời hạn quy định", 1, 40, (m) => m.step(5)),
      rate("312 cập nhật trong 1 ngày khi đổi ngày xuất", 0.95, 30, (m) => m.sample(0.97), true),
    ],
  },
  {
    dept: "MH",
    title: "Trưởng bộ phận Mua hàng",
    kpis: [
      rate("Kế hoạch nhập hàng 4 tuần gửi Kho đúng hạn", 1, 25, (m) => m.step(7)),
      rate("NCC giao đúng hạn", 0.9, 30, (m) => m.supplierOnTime, true),
      rate("Sự cố NCC đóng trong 2 tuần", 1, 30, (m) => m.incidentIn14),
      rate("Đơn đủ điều kiện được đặt đúng hạn", 0.95, 15, (m) => m.step(6), true),
    ],
  },
  {
    dept: "MH",
    title: "Nhân viên mua hàng (theo nhóm vật tư/NCC)",
    kpis: [
      rate("Đặt hàng No Silent trong 3 ngày", 1, 30, (m) => m.step(6)),
      rate("NCC trong nhóm giao đúng hạn", 0.9, 30, (m) => m.supplierOnTime, true),
      rate("PO đủ thông tin đơn và NCC", 1, 15, (m) => m.sample(1, "Hệ thống bắt buộc PO gắn đơn và NCC")),
      rate("Cập nhật ngày về trong ngày khi NCC báo đổi", 1, 15, (m) => m.sample(1), true),
      rate("Báo đúng bộ phận khi đơn thiếu điều kiện", 1, 10, (m) => m.sample(1, "Hệ thống tự ghi bộ phận chịu trách nhiệm")),
    ],
  },
  {
    dept: "KHO",
    title: "Trưởng Trung tâm phân phối",
    kpis: [
      rate("Đáp ứng 100% số lượng và chất lượng vật tư đồng bộ", 1, 30, (m) => m.syncAvg),
      rate("Cấp xuống sản xuất trước kế hoạch may ít nhất 2 tuần", 1, 25, (m) => m.step(10)),
      rate("Báo cáo cân đối phát hành trước 11:00", 1, 20, (m) => m.reportOnTime),
      rate("Ô kệ quét Barcode", 1, 15, (m) => m.barcode),
      max("Sai lệch kiểm kê", 0.02, 10, (m) => m.sample(0.018)),
    ],
  },
  {
    dept: "KHO",
    title: "Nhân viên tiếp nhận hàng",
    kpis: [
      rate("Lô tiếp nhận kiểm tra trong hạn (3/7 ngày)", 1, 40, (m) => m.step(8)),
      rate("Chứng từ đối chiếu đủ và đúng", 1, 25, (m) => m.sample(0.98)),
      rate("Hàng ngoài kế hoạch báo Mua hàng trong ngày", 1, 20, (m) => m.sample(1)),
      rate("Chuyển QC đúng ngày", 1, 15, (m) => m.sample(1), true),
    ],
  },
  {
    dept: "KHO",
    title: "Nhân viên cân đối đồng bộ vật tư",
    kpis: [
      rate("Chốt 09:00 và phát hành trước 11:00", 1, 50, (m) => m.reportOnTime),
      rate("Cảnh báo đơn thiếu 2 tuần tới gửi cùng báo cáo", 1, 25, (m) => m.sample(1, "Hệ thống tự gửi khi phát hành")),
      max("Dòng dữ liệu bị sửa tay", 0.03, 25, (m) => m.sample(0.02)),
    ],
  },
  {
    dept: "KHO",
    title: "Nhân viên cấp phát vật tư đồng bộ",
    kpis: [
      rate("Đơn cấp đủ trước ít nhất 2 tuần", 1, 45, (m) => m.step(10)),
      rate("Bộ cấp đúng số lượng, chất lượng, không bị trả lại", 1, 35, (m) => m.sample(1)),
      rate("Xác nhận nhận của sản xuất ghi trong ngày", 1, 20, (m) => m.prodSameDay),
    ],
  },
  {
    dept: "KD",
    title: "Nhân viên Kinh doanh (theo dõi đơn)",
    kpis: [
      rate("Bàn giao đúng deadline", 1, 50, (m) => m.step(1)),
      rate("Thông tin đủ, không phải bổ sung sau", 0.95, 30, (m) => m.sample(0.9), true),
      rate("Báo đổi ngày xuất trong 1 ngày", 1, 20, (m) => m.sample(1), true),
    ],
  },
  {
    dept: "CN",
    title: "Nhân viên Công nghệ (Rập, định mức)",
    kpis: [
      rate("Rập và định mức giao trước khi hàng về", 1, 50, (m) => m.step(2)),
      rate("Xử lý BOM trên hệ thống trong 3 ngày", 1, 20, (m) => m.sample(0.95)),
      rate("Định mức đúng, không điều chỉnh lại sau khi cấp", 0.98, 30, (m) => m.sample(0.99), true),
    ],
  },
  {
    dept: "QC",
    title: "Trưởng QC",
    kpis: [
      zero("Lô quá hạn Lab test hoặc ký màu", 40, (m) => m.qcLateLots),
      rate("Báo cáo QC phát hành đúng hạn", 1, 30, (m) => m.step(9)),
      rate("Cảnh báo cấp 2 xử lý trong ngày", 0.9, 30, (m) => m.sample(0.92), true),
    ],
  },
  {
    dept: "SH",
    title: "Trưởng nhóm Số hóa",
    kpis: [
      rate("Mốc nghiệm thu đạt đúng hạn (số mốc / 4)", 1, 40, (m) => m.sample(1, "Chưa tới mốc M1")),
      rate("Dashboard và báo cáo hoàn thành theo kế hoạch pha", 1, 30, (m) => m.sample(0.9)),
      rate("Mức hài lòng người dùng (≥ 4/5)", 0.8, 30, (m) => m.sample(0.82, "Khảo sát cuối pha (số mẫu)"), true),
    ],
  },
  {
    dept: "SX",
    title: "Tổ trưởng / chuyền trưởng sản xuất",
    kpis: [
      rate("Xác nhận nhận vật tư trong ngày", 1, 50, (m) => m.prodSameDay),
      rate("Báo thiếu/hỏng vật tư trong ca", 1, 50, (m) => m.sample(1), true),
    ],
  },
];

export interface SupplierKpi {
  id: string;
  name: string;
  lots: number;
  onTime: number | null;
  quality: number | null;
  incidents: number;
  avgIncidentDays: number | null;
}

export function supplierKpis(state: DemoState): SupplierKpi[] {
  return state.suppliers.map((s) => {
    const orders = state.orders.filter((o) => o.supplierId === s.id);
    const arrived = orders.filter((o) => hasArrived(o, state.today) && o.eta);
    const inspected = orders.filter((o) => o.qcReceivedAt);
    const incs = state.incidents.filter((i) => i.supplierId === s.id);
    const qualityFails = new Set(incs.filter((i) => i.kind === "CHAT_LUONG").map((i) => i.orderId));
    const closed = incs.filter((i) => i.closedAt);
    return {
      id: s.id,
      name: s.name,
      lots: arrived.length,
      onTime: arrived.length ? arrived.filter((o) => o.actualArrival! <= o.eta!).length / arrived.length : null,
      quality: inspected.length ? inspected.filter((o) => !qualityFails.has(o.id)).length / inspected.length : null,
      incidents: incs.length,
      avgIncidentDays: closed.length ? closed.reduce((sum, i) => sum + diffDays(i.closedAt!, i.createdAt), 0) / closed.length : null,
    };
  });
}
