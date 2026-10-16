// Sinh dữ liệu mẫu cố định (cùng seed → cùng dữ liệu). Mọi tên NCC, mã đơn, mẫu giày đều hư cấu.
//
// Cách sinh: với mỗi đơn, lập "kế hoạch thực tế" cho cả 10 bước (ngày dự kiến hoàn thành, có độ lệch ngẫu nhiên),
// sau đó cắt tại ngày hôm nay: bước nào có ngày hoàn thành sau hôm nay thì coi như chưa làm.
// Nhờ vậy các đơn tự rải đều trên luồng và tự sinh ra tình huống đúng hạn / trễ hạn / bị chặn.

import { DEFAULT_THRESHOLDS, DEMO_BASE_DATE, STATE_VERSION, STEPS, STEP_NOS } from "./config";
import { addDays, diffDays, maxDate, onOrAfterWeekday, weekStart, weekday } from "./dates";
import { infoDeadline, inspectDays, sewDate } from "./engine";
import type {
  BarcodeZone,
  DailyReport,
  DemoState,
  FormStatus,
  Incident,
  Order,
  StepNo,
  StepRecord,
  Supplier,
} from "./types";

export const SUPPLIERS: Supplier[] = [
  { id: "NCC01", name: "Dệt may Minh Phát", leadTime: 18, transport: 2, origin: "NOI_DIA" },
  { id: "NCC02", name: "Bao bì Tân Phú", leadTime: 5, transport: 1, origin: "NOI_DIA" },
  { id: "NCC03", name: "Cao su Phương Nam", leadTime: 20, transport: 3, origin: "NOI_DIA" },
  { id: "NCC04", name: "Keo dán Hòa Bình", leadTime: 12, transport: 2, origin: "NOI_DIA" },
  { id: "NCC05", name: "Lotus Textile Co.", leadTime: 30, transport: 12, origin: "NHAP_KHAU" },
  { id: "NCC06", name: "Everbright Leather Ltd.", leadTime: 35, transport: 10, origin: "NHAP_KHAU" },
  { id: "NCC07", name: "Sunrise Mesh Corp.", leadTime: 28, transport: 9, origin: "NHAP_KHAU" },
];

const STYLES = [
  "RN-204 Runner",
  "WL-118 Walker",
  "SL-332 Slip-on",
  "TR-450 Trail",
  "KD-071 Kids",
  "CS-260 Casual",
  "SP-512 Sport",
  "LT-090 Lite",
];

const FACTORIES = ["Nhà máy 1", "Nhà máy 2", "Nhà máy 3"];
const LINES = ["Chuyền A", "Chuyền B", "Chuyền C", "Chuyền D"];

export const HERO_ORDER_ID = "o-hero";
export const HERO_ORDER_CODE = "SO-26-0412";

/** PRNG mulberry32 – xác định, không phụ thuộc Math.random */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptySteps(): Record<StepNo, StepRecord> {
  const s = {} as Record<StepNo, StepRecord>;
  for (const k of STEP_NOS) s[k] = { doneAt: null };
  return s;
}

function buildHeroOrder(): Order {
  // Đơn "nhân vật chính" của tour: hạn bàn giao thông tin còn 1 ngày, đang thiếu Wink.
  const exportDate = "2026-11-24";
  return {
    id: HERO_ORDER_ID,
    code: HERO_ORDER_CODE,
    style: "RN-204 Runner",
    qty: 6000,
    exportDate,
    supplierId: "NCC02",
    noSilent: true,
    docs: { bom: true, wink: false, giayMau: true, squatbook: true, rap: false, dinhMuc: false },
    factory: "Nhà máy 2",
    line: "Chuyền B",
    planWeek: weekStart(sewDate({ exportDate } as Order, DEFAULT_THRESHOLDS)),
    priority: 0,
    steps: emptySteps(),
    syncPct: 20,
    hero: true,
  };
}

export function buildSeedState(today: string = DEMO_BASE_DATE): DemoState {
  const rng = makeRng(20261015);
  const int = (n: number) => Math.floor(rng() * n);
  const t = DEFAULT_THRESHOLDS;
  const orders: Order[] = [buildHeroOrder()];
  const incidents: Incident[] = [];
  let incSeq = 1;
  let poSeq = 101;

  for (let i = 1; i < 40; i++) {
    const sup = SUPPLIERS[(i * 3) % SUPPLIERS.length];
    // Dồn dày các đơn xuất sớm để khâu Kho/QC có việc ở tuần 42, các đơn sau giãn dần đến tháng 2/2027
    const offset = i <= 24 ? Math.round(i * 1.6) : 38 + (i - 24) * 4;
    const exportDate = addDays("2026-10-27", offset + int(3));
    const noSilent = rng() < 0.35;

    // ── Kế hoạch thực tế của 10 bước ──
    const plan: Partial<Record<StepNo, string | null>> = {};
    const info = infoDeadline(exportDate, sup.leadTime, sup.transport, t);
    // Tình huống chọn theo ngày để luôn rơi đúng quanh "hôm nay"
    const near = (d: string | null, from: number, to: number) => !!d && d >= addDays(today, from) && d <= addDays(today, to);
    const missingWink = near(info, -6, 3) && i % 2 === 0;
    plan[1] = missingWink ? null : addDays(info, int(5) - 8 + (rng() < 0.12 ? 9 : 0));
    plan[2] = plan[1] ? addDays(plan[1]!, 1 + int(2)) : null;
    plan[3] = plan[1] ? addDays(plan[1]!, rng() < 0.1 ? 3 : int(2)) : null;
    plan[4] = plan[3] ? addDays(onOrAfterWeekday(plan[3]!, 1), rng() < 0.08 ? 7 : 0) : null;
    plan[5] = noSilent && plan[4] ? addDays(plan[4]!, int(3) + (rng() < 0.15 ? 6 : 0)) : null;
    const ready6 = plan[2] && plan[4] && (!noSilent || plan[5]);
    plan[6] = ready6 ? addDays(maxDate(plan[2], plan[4], plan[5])!, int(3) + (rng() < 0.12 ? 3 : 0)) : null;
    plan[7] = plan[4] ? onOrAfterWeekday(addDays(plan[4]!, 1), 2) : null;

    const eta = plan[6] ? addDays(plan[6]!, sup.leadTime + sup.transport) : null;
    const supplierLateNoNotice = near(eta, -6, -1) && i % 3 === 1;
    const supplierLateNotified = near(eta, 0, 10) && i % 3 === 2;
    let actualArrival: string | null = null;
    let supplierDelay = 0;
    if (eta) {
      if (supplierLateNotified) {
        supplierDelay = 6;
        actualArrival = addDays(eta, 6);
      } else if (supplierLateNoNotice) {
        actualArrival = addDays(eta, 5);
      } else {
        actualArrival = addDays(eta, int(4) - 2);
      }
    }
    const inspect = inspectDays(sup, t);
    plan[8] = actualArrival ? addDays(actualArrival, 1 + int(inspect) + (rng() < 0.1 ? 2 : 0)) : null;
    const labAt = plan[8] ? addDays(plan[8]!, 1 + int(3)) : null;
    const colorAt = plan[8] ? addDays(plan[8]!, 1 + int(2)) : null;
    plan[9] = maxDate(labAt, colorAt);
    plan[10] = plan[9] ? addDays(plan[9]!, 1 + int(3)) : null;
    const qcFail = near(labAt, -20, 0) && i % 3 === 0;
    const qtyFail = !qcFail && near(plan[8] ?? null, -12, 0) && i % 4 === 1;
    const prodConfirm = plan[10] ? addDays(plan[10]!, int(2)) : null;

    // ── Cắt tại hôm nay ──
    const steps = emptySteps();
    const isDone = (k: StepNo) => !!(steps[k].doneAt || steps[k].na);
    for (const k of STEP_NOS) {
      if (k === 5 && !noSilent) {
        steps[5] = { na: true };
        continue;
      }
      const p = plan[k];
      if (!p || p > today) continue;
      if (!STEPS[k].deps.every(isDone)) continue;
      if (k === 8 && (!actualArrival || actualArrival > today)) continue;
      steps[k] = { doneAt: p };
    }

    const code = `SO-26-${String(500 + i * 7).padStart(4, "0")}`;
    const id = `o-${i}`;

    // Sự cố số lượng phát hiện lúc tiếp nhận
    if (qtyFail && steps[8].doneAt) {
      const createdAt = steps[8].doneAt!;
      steps[8] = { doneAt: null };
      incidents.push(makeIncident(`SC-${String(incSeq++).padStart(3, "0")}`, id, sup, "SO_LUONG", createdAt, today, rng));
    }

    const qcReceivedAt: string | null = steps[8].doneAt ?? null;
    let labPassedAt: string | null = qcReceivedAt && labAt && labAt <= today ? labAt : null;
    const colorSignedAt: string | null = qcReceivedAt && colorAt && colorAt <= today ? colorAt : null;

    // Sự cố chất lượng: Lab test không đạt
    if (qcFail && qcReceivedAt && labAt && labAt <= today) {
      labPassedAt = null;
      incidents.push(makeIncident(`SC-${String(incSeq++).padStart(3, "0")}`, id, sup, "CHAT_LUONG", labAt, today, rng));
    }
    if (!(labPassedAt && colorSignedAt)) steps[9] = { doneAt: null };
    if (!steps[8].doneAt || !steps[9].doneAt) steps[10] = { doneAt: null };

    const docsDone = !!steps[1].doneAt;
    const techDone = !!steps[2].doneAt;
    orders.push({
      id,
      code,
      style: STYLES[i % STYLES.length],
      qty: 2000 + 500 * int(13),
      exportDate,
      supplierId: sup.id,
      noSilent,
      docs: {
        bom: docsDone || rng() < 0.7,
        wink: docsDone ? true : missingWink ? false : rng() < 0.5,
        giayMau: docsDone || rng() < 0.6,
        squatbook: docsDone || rng() < 0.5,
        rap: techDone || (docsDone && rng() < 0.4),
        dinhMuc: techDone || (docsDone && rng() < 0.3),
      },
      factory: FACTORIES[i % FACTORIES.length],
      line: LINES[Math.floor(i / 3) % LINES.length],
      planWeek: weekStart(sewDate({ exportDate } as Order, t)),
      priority: 0,
      poNo: steps[6].doneAt ? `PO-2610-${poSeq++}` : null,
      eta: steps[6].doneAt ? eta : null,
      actualArrival: steps[6].doneAt ? actualArrival : null,
      supplierDelay: steps[6].doneAt ? supplierDelay : 0,
      steps,
      qcReceivedAt,
      labPassedAt,
      colorSignedAt,
      syncPct: 5 + int(55),
      prodConfirmedAt: steps[10].doneAt && prodConfirm && prodConfirm <= today ? prodConfirm : null,
    });
  }

  // Thứ tự ưu tiên trong Kế hoạch 312: theo ngày xuất hàng
  orders
    .slice()
    .sort((a, b) => (a.exportDate < b.exportDate ? -1 : a.exportDate > b.exportDate ? 1 : 0))
    .forEach((o, idx) => {
      o.priority = idx + 1;
    });

  const start = weekStart(today);
  return {
    version: STATE_VERSION,
    today,
    role: "BDH",
    screen: "progress",
    suppliers: SUPPLIERS,
    orders,
    incidents,
    reports: seedReports(today),
    barcode: seedBarcode(),
    forms: seedForms(),
    thresholds: { ...DEFAULT_THRESHOLDS },
    planWeeks: [0, 1, 2, 3].map((n) => addDays(start, n * 7)),
    planApprovedWeek: null,
    inboundPlanSentWeek: addDays(start, -7),
    log: [{ at: today, role: "SH", text: "Khởi tạo dữ liệu DEMO (giả lập)" }],
    seq: 1000,
  };
}

function makeIncident(
  id: string,
  orderId: string,
  sup: Supplier,
  kind: Incident["kind"],
  createdAt: string,
  today: string,
  rng: () => number,
): Incident {
  const age = diffDays(today, createdAt);
  const inc: Incident = {
    id,
    orderId,
    supplierId: sup.id,
    kind,
    note: kind === "CHAT_LUONG" ? "Lab test lý tính không đạt (độ bền kéo)" : "Thiếu số lượng so với chứng từ giao hàng",
    createdAt,
    status: "OPEN",
  };
  if (age >= 3 && rng() < 0.7) {
    inc.status = "PLAN_AGREED";
    inc.plan = kind === "CHAT_LUONG" ? "DOI_HANG" : "BU_THIEU";
    inc.replacementEta = addDays(createdAt, sup.origin === "NOI_DIA" ? 6 : 12);
    if (inc.replacementEta <= today) inc.status = "AWAITING_CONFIRM";
  }
  return inc;
}

function seedReports(today: string): DailyReport[] {
  const out: DailyReport[] = [];
  let d = addDays(today, -1);
  let n = 0;
  while (n < 10) {
    const wd = weekday(d);
    if (wd !== 0 && wd !== 6) {
      const late = n === 3;
      out.push({ date: d, locked: true, invalidRows: 0, publishedAt: late ? "11:20" : n % 2 ? "10:35" : "10:50", onTime: !late });
      n++;
    }
    d = addDays(d, -1);
  }
  return out.reverse();
}

function seedBarcode(): BarcodeZone[] {
  // Pha 2 đạt khoảng 10% ở tuần 42: 120/1.200 ô kệ đã quét
  return [
    { zone: "Khu A – Vải & lưới", total: 220, scanned: 80 },
    { zone: "Khu B – Da & giả da", total: 200, scanned: 40 },
    { zone: "Khu C – Đế & cao su", total: 220, scanned: 0 },
    { zone: "Khu D – Phụ liệu", total: 200, scanned: 0 },
    { zone: "Khu E – Bao bì", total: 180, scanned: 0 },
    { zone: "Khu F – Hóa chất & keo", total: 180, scanned: 0 },
  ];
}

function seedForms(): FormStatus[] {
  return [
    { key: "tiep-nhan", name: "Biểu mẫu tiếp nhận kiểm tra", status: "GOP_Y" },
    { key: "can-doi", name: "Biểu mẫu cân đối đồng bộ vật tư", status: "THONG_NHAT" },
    { key: "nhap-hang", name: "Biểu mẫu dự kiến nhập hàng", status: "NHAP" },
  ];
}
