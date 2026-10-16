// Thao tác nghiệp vụ của DEMO dưới dạng hàm thuần: nhận state, trả state mới và thông báo kết quả.

import { INCIDENT_PLAN_LABEL, ROLES, STEPS } from "./config";
import { addDays, fmtDM, weekStart } from "./dates";
import { hasArrived, isStepDone, missingOrderConditions, openIncident, supplierOf } from "./engine";
import type { DemoState, FormStatus, Incident, IncidentPlan, Order, RoleKey, StepNo, Thresholds } from "./types";

export interface ActionResult {
  state: DemoState;
  ok: boolean;
  message: string;
}

type Mutator = (draft: DemoState) => { ok: boolean; message: string };

function run(state: DemoState, role: RoleKey, fn: Mutator): ActionResult {
  const draft: DemoState = JSON.parse(JSON.stringify(state));
  const res = fn(draft);
  if (!res.ok) return { state, ok: false, message: res.message };
  draft.log = [{ at: draft.today, role, text: res.message }, ...draft.log].slice(0, 80);
  return { state: draft, ok: true, message: res.message };
}

function findOrder(draft: DemoState, id: string): Order {
  const o = draft.orders.find((x) => x.id === id);
  if (!o) throw new Error(`Không tìm thấy đơn ${id}`);
  return o;
}

function nextIncidentId(draft: DemoState): string {
  return `SC-${String(draft.incidents.length + 1).padStart(3, "0")}`;
}

function complete(o: Order, k: StepNo, day: string) {
  o.steps[k] = { doneAt: day };
}

function depsDone(o: Order, k: StepNo): boolean {
  return STEPS[k].deps.every((d) => isStepDone(o, d));
}

/** Bước 9 hoàn thành khi Lab test đạt và đã ký màu */
function tryCompleteQc(o: Order, day: string) {
  if (o.labPassedAt && o.colorSignedAt && !o.steps[9].doneAt) complete(o, 9, day);
}

// ─── Thời gian ───────────────────────────────────────────────────────────────

/** Đổi ngày giả lập. Hàng thay thế tới hạn về thì sự cố chuyển sang chờ Kho/QC xác nhận. */
export function setToday(state: DemoState, today: string): DemoState {
  const draft: DemoState = JSON.parse(JSON.stringify(state));
  draft.today = today;
  for (const inc of draft.incidents) {
    if (inc.status === "PLAN_AGREED" && inc.replacementEta && inc.replacementEta <= today) inc.status = "AWAITING_CONFIRM";
  }
  return draft;
}

// ─── Kinh doanh · Công nghệ ──────────────────────────────────────────────────

export type DocKey = "bom" | "wink" | "giayMau" | "squatbook";
export type TechKey = "rap" | "dinhMuc";

export const DOC_LABEL: Record<DocKey | TechKey, string> = {
  bom: "BOM",
  wink: "Wink",
  giayMau: "Giày mẫu",
  squatbook: "Squatbook",
  rap: "Rập",
  dinhMuc: "Định mức",
};

export function handoverDoc(state: DemoState, orderId: string, key: DocKey): ActionResult {
  return run(state, "KDCNQC", (d) => {
    const o = findOrder(d, orderId);
    if (o.steps[1].doneAt) return { ok: false, message: "Đơn đã bàn giao đủ thông tin" };
    o.docs[key] = true;
    if (o.docs.bom && o.docs.wink && o.docs.giayMau && o.docs.squatbook) {
      complete(o, 1, d.today);
      return { ok: true, message: `KD bàn giao ${DOC_LABEL[key]} – ${o.code} đủ thông tin, bước 1 hoàn thành` };
    }
    return { ok: true, message: `KD bàn giao ${DOC_LABEL[key]} cho ${o.code}` };
  });
}

export function handoverTech(state: DemoState, orderId: string, key: TechKey): ActionResult {
  return run(state, "KDCNQC", (d) => {
    const o = findOrder(d, orderId);
    if (!o.steps[1].doneAt) return { ok: false, message: "Chờ Kinh doanh bàn giao đủ thông tin đơn (bước 1)" };
    if (o.steps[2].doneAt) return { ok: false, message: "Đã giao Rập và định mức" };
    o.docs[key] = true;
    if (o.docs.rap && o.docs.dinhMuc) {
      complete(o, 2, d.today);
      return { ok: true, message: `CN giao ${DOC_LABEL[key]} – ${o.code} đủ Rập & định mức, bước 2 hoàn thành` };
    }
    return { ok: true, message: `CN giao ${DOC_LABEL[key]} cho ${o.code}` };
  });
}

// ─── Kế hoạch & CCƯ ──────────────────────────────────────────────────────────

export function allocateOrder(state: DemoState, orderId: string): ActionResult {
  return run(state, "KH", (d) => {
    const o = findOrder(d, orderId);
    if (!o.steps[1].doneAt) return { ok: false, message: "Chưa thể phân bổ: Kinh doanh chưa bàn giao đủ thông tin" };
    if (o.steps[3].doneAt) return { ok: false, message: "Đơn đã có trong kế hoạch phân bổ" };
    complete(o, 3, d.today);
    return { ok: true, message: `Đưa ${o.code} vào kế hoạch phân bổ – ${o.factory} / ${o.line}` };
  });
}

export function approvePlan(state: DemoState): ActionResult {
  return run(state, "KH", (d) => {
    const week = weekStart(d.today);
    if (d.planApprovedWeek === week) return { ok: false, message: "Kế hoạch tuần này đã được phê duyệt" };
    d.planApprovedWeek = week;
    return { ok: true, message: "Trưởng bộ phận Kế hoạch phê duyệt kế hoạch phân bổ 4 tuần" };
  });
}

export function issuePlan312(state: DemoState): ActionResult {
  return run(state, "KH", (d) => {
    if (d.planApprovedWeek !== weekStart(d.today)) return { ok: false, message: "Không ban hành khi chưa có phê duyệt của trưởng bộ phận" };
    const targets = d.orders.filter((o) => o.steps[3].doneAt && !o.steps[4].doneAt);
    if (targets.length === 0) return { ok: false, message: "Không có đơn mới cần ban hành trong Kế hoạch 312" };
    targets.forEach((o) => complete(o, 4, d.today));
    return { ok: true, message: `Ban hành Kế hoạch 312: ${targets.length} đơn, gửi Mua hàng kèm thứ tự ưu tiên` };
  });
}

export function sendNoSilent(state: DemoState, orderId: string): ActionResult {
  return run(state, "KH", (d) => {
    const o = findOrder(d, orderId);
    if (!o.noSilent) return { ok: false, message: "Đơn không có yêu cầu No Silent" };
    if (!o.steps[3].doneAt) return { ok: false, message: "Đơn chưa có trong kế hoạch phân bổ" };
    if (o.steps[5].doneAt) return { ok: false, message: "Đã bàn giao No Silent" };
    complete(o, 5, d.today);
    return { ok: true, message: `Bàn giao No Silent của ${o.code} cho Mua hàng` };
  });
}

export function reschedule(state: DemoState, orderId: string, weeks: number, reason: string): ActionResult {
  return run(state, "KH", (d) => {
    const o = findOrder(d, orderId);
    if (!reason.trim()) return { ok: false, message: "Phải ghi lý do khi thay đổi kế hoạch" };
    o.planWeek = addDays(o.planWeek, weeks * 7);
    o.changeNote = reason.trim();
    return { ok: true, message: `Dời ${o.code} ${weeks > 0 ? "+" : ""}${weeks} tuần – lý do: ${reason.trim()}` };
  });
}

/** Cuốn chiếu: luôn giữ 4 tuần liên tục tính từ tuần hiện tại */
export function rollPlanWeeks(state: DemoState): ActionResult {
  return run(state, "KH", (d) => {
    const start = weekStart(d.today);
    const next = [0, 1, 2, 3].map((n) => addDays(start, n * 7));
    if (next.every((w, i) => d.planWeeks[i] === w)) return { ok: false, message: "Kế hoạch đã đủ 4 tuần liên tục" };
    d.planWeeks = next;
    return { ok: true, message: "Cập nhật cuốn chiếu: thêm tuần mới, giữ đủ 4 tuần" };
  });
}

// ─── Mua hàng ────────────────────────────────────────────────────────────────

export function activateOrder(state: DemoState, orderId: string): ActionResult {
  return run(state, "MH", (d) => {
    const o = findOrder(d, orderId);
    if (o.steps[6].doneAt) return { ok: false, message: "Đơn đã đặt hàng" };
    const missing = missingOrderConditions(o);
    if (missing.length > 0) return { ok: false, message: `Chưa đủ điều kiện: thiếu ${missing.map((m) => m.label).join(", ")}` };
    if (!depsDone(o, 6)) {
      const wait = STEPS[6].deps.filter((n) => !isStepDone(o, n));
      return { ok: false, message: `Chờ bước ${wait.join(", ")} hoàn thành` };
    }
    const s = supplierOf(d, o);
    complete(o, 6, d.today);
    d.seq += 1;
    o.poNo = `PO-2610-${d.seq}`;
    o.eta = addDays(d.today, s.leadTime + s.transport);
    o.actualArrival = o.eta;
    o.supplierDelay = 0;
    return { ok: true, message: `Kích hoạt đặt hàng ${o.code}: phát hành ${o.poNo}, ETA ${fmtDM(o.eta)}` };
  });
}

export function reportSupplierDelay(state: DemoState, orderId: string, days: number): ActionResult {
  return run(state, "MH", (d) => {
    const o = findOrder(d, orderId);
    if (!o.eta || hasArrived(o, d.today)) return { ok: false, message: "Chỉ cập nhật ngày về cho PO chưa về" };
    o.supplierDelay = (o.supplierDelay ?? 0) + days;
    o.actualArrival = addDays(o.eta, o.supplierDelay);
    return { ok: true, message: `NCC báo trễ ${o.code} thêm ${days} ngày, ngày về mới ${fmtDM(o.actualArrival)}` };
  });
}

export function sendInboundPlan(state: DemoState): ActionResult {
  return run(state, "MH", (d) => {
    const targets = d.orders.filter((o) => o.steps[4].doneAt && !o.steps[7].doneAt);
    d.inboundPlanSentWeek = weekStart(d.today);
    targets.forEach((o) => complete(o, 7, d.today));
    return { ok: true, message: `Gửi Kho kế hoạch dự kiến nhập hàng 4 tuần (${targets.length} đơn mới)` };
  });
}

export function agreeIncidentPlan(state: DemoState, incidentId: string, plan: IncidentPlan): ActionResult {
  return run(state, "MH", (d) => {
    const inc = d.incidents.find((i) => i.id === incidentId);
    if (!inc || inc.status !== "OPEN") return { ok: false, message: "Sự cố không ở trạng thái chờ phương án" };
    const sup = d.suppliers.find((s) => s.id === inc.supplierId);
    inc.plan = plan;
    if (plan === "GIAM_GIA") {
      inc.replacementEta = d.today;
      inc.status = "AWAITING_CONFIRM";
    } else {
      inc.replacementEta = addDays(d.today, sup?.origin === "NOI_DIA" ? 3 : 7);
      inc.status = "PLAN_AGREED";
    }
    return { ok: true, message: `NCC xác nhận phương án ${INCIDENT_PLAN_LABEL[plan]} cho ${inc.id}` };
  });
}

// ─── Kho / TTPP ──────────────────────────────────────────────────────────────

export function receiveGoods(state: DemoState, orderId: string): ActionResult {
  return run(state, "KHO", (d) => {
    const o = findOrder(d, orderId);
    if (!hasArrived(o, d.today)) return { ok: false, message: "Hàng chưa về kho" };
    if (o.steps[8].doneAt) return { ok: false, message: "Đã tiếp nhận" };
    if (openIncident(d.incidents, o.id, "SO_LUONG")) return { ok: false, message: "Đang có sự cố số lượng chưa đóng" };
    complete(o, 8, d.today);
    o.qcReceivedAt = d.today;
    return { ok: true, message: `Kho tiếp nhận đạt ${o.code}, quét Barcode nhập ô kệ, chuyển mẫu cho QC` };
  });
}

export function reportShortfall(state: DemoState, orderId: string): ActionResult {
  return run(state, "KHO", (d) => {
    const o = findOrder(d, orderId);
    if (!hasArrived(o, d.today) || o.steps[8].doneAt) return { ok: false, message: "Chỉ lập biên bản cho lô đang tiếp nhận" };
    if (openIncident(d.incidents, o.id)) return { ok: false, message: "Đơn đã có sự cố đang mở" };
    const inc: Incident = {
      id: nextIncidentId(d),
      orderId: o.id,
      supplierId: o.supplierId,
      kind: "SO_LUONG",
      note: "Thiếu số lượng so với chứng từ giao hàng",
      createdAt: d.today,
      status: "OPEN",
    };
    d.incidents.push(inc);
    return { ok: true, message: `Kho lập biên bản ${inc.id} (số lượng) cho ${o.code}, hệ thống báo Mua hàng` };
  });
}

/** Kho/QC xác nhận hàng thay thế đã đạt → đóng sự cố (mục 7.3: chỉ đóng khi Kho hoặc QC xác nhận) */
export function confirmIncident(state: DemoState, incidentId: string, role: "KHO" | "KDCNQC"): ActionResult {
  return run(state, role, (d) => {
    const inc = d.incidents.find((i) => i.id === incidentId);
    if (!inc || inc.status !== "AWAITING_CONFIRM") return { ok: false, message: "Hàng thay thế chưa về để xác nhận" };
    if (role === "KHO" && inc.kind !== "SO_LUONG") return { ok: false, message: "Sự cố chất lượng do QC xác nhận" };
    if (role === "KDCNQC" && inc.kind !== "CHAT_LUONG") return { ok: false, message: "Sự cố số lượng do Kho xác nhận" };
    const o = findOrder(d, inc.orderId);
    inc.status = "CLOSED";
    inc.closedAt = d.today;
    if (inc.kind === "SO_LUONG") {
      complete(o, 8, d.today);
      o.qcReceivedAt = d.today;
    } else {
      o.labPassedAt = d.today;
      tryCompleteQc(o, d.today);
    }
    return { ok: true, message: `${role === "KHO" ? "Kho" : "QC"} xác nhận hàng thay thế đạt, đóng sự cố ${inc.id} (${o.code})` };
  });
}

export function scanZone(state: DemoState, zone: string): ActionResult {
  return run(state, "KHO", (d) => {
    const z = d.barcode.find((b) => b.zone === zone);
    if (!z) return { ok: false, message: "Không tìm thấy khu" };
    if (z.scanned >= z.total) return { ok: false, message: `${zone} đã quét đủ 100%` };
    const add = Math.min(60, z.total - z.scanned);
    z.scanned += add;
    return { ok: true, message: `Dán nhãn & quét ${add} ô kệ ${zone}` };
  });
}

export function lockDailyData(state: DemoState): ActionResult {
  return run(state, "KHO", (d) => {
    if (d.reports.some((r) => r.date === d.today)) return { ok: false, message: "Đã chốt dữ liệu hôm nay" };
    d.reports.push({ date: d.today, locked: true, invalidRows: 2 });
    return { ok: true, message: "09:00 chốt dữ liệu cân đối: phát hiện 2 dòng chưa hợp lệ" };
  });
}

export function fixDailyData(state: DemoState): ActionResult {
  return run(state, "KHO", (d) => {
    const r = d.reports.find((x) => x.date === d.today);
    if (!r || r.publishedAt) return { ok: false, message: "Không có dữ liệu chờ sửa" };
    if (r.invalidRows === 0) return { ok: false, message: "Dữ liệu đã hợp lệ" };
    r.invalidRows = 0;
    return { ok: true, message: "Sửa dữ liệu lỗi trước 10:00 – dữ liệu hợp lệ" };
  });
}

export function publishDailyReport(state: DemoState): ActionResult {
  return run(state, "KHO", (d) => {
    const r = d.reports.find((x) => x.date === d.today);
    if (!r) return { ok: false, message: "Cần chốt dữ liệu 09:00 trước khi phát hành" };
    if (r.publishedAt) return { ok: false, message: "Báo cáo hôm nay đã phát hành" };
    if (r.invalidRows > 0) {
      r.publishedAt = "10:55";
      r.onTime = true;
      r.note = "Dữ liệu chưa đủ – đã báo Số hóa";
      return { ok: true, message: "Phát hành báo cáo cân đối 10:55 kèm ghi chú dữ liệu chưa đủ" };
    }
    r.publishedAt = "10:40";
    r.onTime = true;
    return { ok: true, message: "Phát hành báo cáo cân đối đồng bộ 10:40, gửi cảnh báo đơn thiếu" };
  });
}

export function supplyToProduction(state: DemoState, orderId: string): ActionResult {
  return run(state, "KHO", (d) => {
    const o = findOrder(d, orderId);
    if (o.steps[10].doneAt) return { ok: false, message: "Đã cấp vật tư" };
    if (!o.steps[8].doneAt || !o.steps[9].doneAt) return { ok: false, message: "Chưa đủ 100% số lượng và chất lượng để cấp đồng bộ" };
    complete(o, 10, d.today);
    return { ok: true, message: `Lập phiếu xuất đồng bộ ${o.code}, quét Barcode xuất kho, giao xuống ${o.factory}` };
  });
}

// ─── QC ──────────────────────────────────────────────────────────────────────

export function recordLabResult(state: DemoState, orderId: string, pass: boolean): ActionResult {
  return run(state, "KDCNQC", (d) => {
    const o = findOrder(d, orderId);
    if (!o.qcReceivedAt || o.steps[9].doneAt) return { ok: false, message: "Không có mẫu chờ Lab test" };
    if (o.labPassedAt) return { ok: false, message: "Đã có kết quả Lab test đạt" };
    if (openIncident(d.incidents, o.id, "CHAT_LUONG")) return { ok: false, message: "Đang chờ xử lý hàng không đạt" };
    if (pass) {
      o.labPassedAt = d.today;
      tryCompleteQc(o, d.today);
      return { ok: true, message: `QC: Lab test ${o.code} đạt${o.steps[9].doneAt ? ", bước 9 hoàn thành" : ""}` };
    }
    const inc: Incident = {
      id: nextIncidentId(d),
      orderId: o.id,
      supplierId: o.supplierId,
      kind: "CHAT_LUONG",
      note: "Lab test lý tính không đạt",
      createdAt: d.today,
      status: "OPEN",
    };
    d.incidents.push(inc);
    return { ok: true, message: `QC: Lab test ${o.code} KHÔNG ĐẠT – lập ${inc.id}, chuyển Mua hàng xử lý (≤ 2 tuần)` };
  });
}

export function signColor(state: DemoState, orderId: string): ActionResult {
  return run(state, "KDCNQC", (d) => {
    const o = findOrder(d, orderId);
    if (!o.qcReceivedAt || o.colorSignedAt) return { ok: false, message: "Không có mẫu chờ ký màu" };
    o.colorSignedAt = d.today;
    tryCompleteQc(o, d.today);
    return { ok: true, message: `QC ký màu ${o.code}${o.steps[9].doneAt ? ", bước 9 hoàn thành" : ""}` };
  });
}

// ─── Sản xuất ────────────────────────────────────────────────────────────────

export function confirmProductionReceipt(state: DemoState, orderId: string): ActionResult {
  return run(state, "SX", (d) => {
    const o = findOrder(d, orderId);
    if (!o.steps[10].doneAt) return { ok: false, message: "Kho chưa cấp vật tư" };
    if (o.prodConfirmedAt) return { ok: false, message: "Đã xác nhận nhận" };
    o.prodConfirmedAt = d.today;
    return { ok: true, message: `Sản xuất xác nhận nhận đủ vật tư đồng bộ ${o.code}` };
  });
}

// ─── Số hóa & cấu hình ───────────────────────────────────────────────────────

export function setThreshold(state: DemoState, key: keyof Thresholds, value: number, label: string): ActionResult {
  return run(state, "SH", (d) => {
    if (!Number.isFinite(value)) return { ok: false, message: "Giá trị không hợp lệ" };
    const before = d.thresholds[key];
    if (before === value) return { ok: false, message: "Giá trị không đổi" };
    d.thresholds[key] = value;
    return { ok: true, message: `Đổi ngưỡng "${label}" từ ${before} thành ${value}` };
  });
}

export function setFormStatus(state: DemoState, key: string, status: FormStatus["status"]): ActionResult {
  return run(state, "SH", (d) => {
    const f = d.forms.find((x) => x.key === key);
    if (!f) return { ok: false, message: "Không tìm thấy biểu mẫu" };
    f.status = status;
    return { ok: true, message: `Cập nhật trạng thái ${f.name}` };
  });
}

export function roleName(role: RoleKey): string {
  return ROLES.find((r) => r.key === role)?.name ?? role;
}
