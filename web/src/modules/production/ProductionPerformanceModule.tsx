'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IconSettings,
  IconRefresh,
  IconCalendar,
  IconChevronLeft,
  IconMaximize,
  IconMinimize,
  IconDeviceTv,
} from '@tabler/icons-react';
import PphSettingsView from './PphSettingsView';

// ============================================================================
// Trang "Hiệu suất Nhà máy" — MÀN HÌNH LỚN (TV xưởng): nền tối + neon.
//  • Tổng quan: 5 ô hàng 1 (PPH Tổ hợp + KG1/KG2/KG3/HTĐ) + tóm tắt + biểu đồ + Top Lỗi.
//  • Bấm 1 nhà máy → dashboard chi tiết theo Xưởng (PX MAY / PX GÒ...), Line, biểu đồ giờ,
//    lưới tình trạng tổ, Top Lỗi (nhóm nguyên nhân hụt chỉ tiêu 5M1E).
//  • Cài Đặt: cấu hình Line + hiển thị nhà máy + ràng buộc thời gian + nhóm nguyên nhân (combobox).
// ============================================================================

type PphSlot = {
  slot: string;
  actualQty: number | null;
  filled: boolean;
  submittedBy?: string | null;
  submittedAt?: string | null;
  shortfallReason?: string | null;
  shortfallSolution?: string | null;
  shortfallCauseGroup?: string | null;
  errorCount?: number | null;
};
export type PphLeaf = {
  id: string;
  name: string;
  path: string;
  areaId: string | null;
  areaName: string | null;
  // Ảnh sản phẩm — Admin tải lên ở Cài Đặt (gắn theo điểm quét, xem PphSettingsView.tsx), null =
  // chưa có ảnh, hiện tạm mã hàng dạng chữ thay chỗ.
  imageUrl: string | null;
  // PPH CHUẨN theo mã giày (IE cung cấp, xem PphShoePphTargetsView.tsx) — server đã tự tra đúng
  // Xưởng/Nhà máy, null nếu chưa khai Model/mã lạ/Xưởng không có trong file IE. CHỈ dùng để hiện ô
  // "PPH" (mục tiêu) thay cho số tự tính — không ảnh hưởng % PPH/PPH TH/Mục tiêu-giờ, xem TeamPanel.
  pphStandard: number | null;
  setup: {
    workerCount: number;
    model: string;
    plannedQty: number;
    targetRft: number;
    productionHours: number | null;
    // Người nộp Đầu ca — dùng khi Tổ CHƯA có khung số lượng nào để lấy tên nhắc giọng đọc (xem
    // pphLastReporterName()); các chỗ khác dùng setup KHÔNG cần field này, luôn optional.
    submittedBy?: string | null;
  } | null;
  slots: PphSlot[];
  pphLatest: number | null;
  efficiencyPctLatest: number | null;
  perHourTarget: number;
  cumulativeActual: number;
  cumulativeTarget: number;
  // 'paused' — điểm quét đang được đánh dấu Tạm ngưng sản xuất ở Cài Đặt (leaf.paused = true bên
  // backend) — KHÔNG còn bị tính missing/late nữa dù có nhập hay không, xem entryStatus ở
  // GET /dashboard (_worker.js).
  entryStatus: 'ontime' | 'late' | 'missing' | 'paused';
  // Chất lượng RFT — CỘNG DỒN cả ngày, chỉ tính trên các khung ĐÃ nhập kèm Số lỗi (khung dữ liệu cũ
  // trước khi có cột này thì bỏ qua, không bịa 100%) — null nếu chưa khung nào có số liệu. Xem công
  // thức thật ở backend (_worker.js, /dashboard): (SLTH các khung có lỗi − tổng lỗi) / SLTH đó.
  cumulativeErrors: number | null;
  qualityPct: number | null;
};
export type PphFactory = { id: string; name: string; leaves: PphLeaf[] };
export type DashLine = { id: string; areaId: string; name: string; sortOrder: number; leafIds: string[] };
// 1 "Line" đã chọn để xem trang riêng — nhận diện bằng tên Xưởng + tên Line + danh sách điểm quét.
export type LineSel = { areaName: string; name: string; leafIds: string[] };
export type FactoryConfig = {
  factoryId: string;
  targetPphPct: number | null;
  title: string | null;
  gddh: string | null;
  qlcl: string | null;
  th: string | null;
};

export const POLL_MS = 60_000;
export const DEFAULT_TARGET_PPH = 100;
// Bề rộng "thiết kế" khi phóng to toàn màn hình — nội dung dựng ở bề rộng này rồi SCALE cho lấp đầy
// chiều cao màn hình (canh giữa), khỏi dư khoảng trống / khỏi phải cuộn.
export const FS_DESIGN_W = 1600;
const LOI_COLORS = ['#fb7185', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#94a3b8'];

type Tone = 'ok' | 'warn' | 'bad' | 'none';
const TONE: Record<Tone, { text: string; ring: string; chipBg: string; chipBorder: string; bar: string }> = {
  ok: { text: 'text-emerald-300', ring: '#34d399', chipBg: 'bg-emerald-500/10', chipBorder: 'border-emerald-400/40', bar: '#34d399' },
  warn: { text: 'text-amber-300', ring: '#fbbf24', chipBg: 'bg-amber-500/10', chipBorder: 'border-amber-400/40', bar: '#fbbf24' },
  bad: { text: 'text-rose-300', ring: '#fb7185', chipBg: 'bg-rose-500/10', chipBorder: 'border-rose-400/40', bar: '#fb7185' },
  none: { text: 'text-slate-400', ring: '#475569', chipBg: 'bg-slate-700/30', chipBorder: 'border-slate-600/40', bar: '#475569' },
};
// Bản màu cho khung nền TRẮNG (chỉ dùng ở cấp Line, xem prop `light`) — màu chữ đậm hơn hẳn bản
// TONE gốc (vốn nhạt để nổi trên nền tối) vì trên nền trắng chữ nhạt sẽ mờ khó đọc.
const TONE_LIGHT: Record<Tone, { text: string; ring: string; chipBg: string; chipBorder: string; bar: string }> = {
  ok: { text: 'text-emerald-700', ring: '#0d7a5c', chipBg: 'bg-emerald-50', chipBorder: 'border-emerald-300', bar: '#0d7a5c' },
  warn: { text: 'text-amber-700', ring: '#d97706', chipBg: 'bg-amber-50', chipBorder: 'border-amber-300', bar: '#d97706' },
  bad: { text: 'text-rose-700', ring: '#e11d48', chipBg: 'bg-rose-50', chipBorder: 'border-rose-300', bar: '#e11d48' },
  none: { text: 'text-slate-500', ring: '#94a3b8', chipBg: 'bg-slate-100', chipBorder: 'border-slate-300', bar: '#94a3b8' },
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('vi-VN');
}
// Làm tròn LÊN mốc trục "đẹp" (1/2/5 × 10^n) rồi nhân với số khoảng chia — dùng vẽ trục trái/phải
// biểu đồ giờ (VD max thật 950 → mốc đẹp 200 → trần trục 1200, chia đều 6 khoảng 0-200-...-1200,
// giống đúng bảng mẫu Excel thay vì trần lẻ theo đúng số liệu thật).
function niceAxisMax(rawMax: number, divisions: number): number {
  if (rawMax <= 0) return divisions;
  const rawStep = rawMax / divisions;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const niceStep = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10) * magnitude;
  return niceStep * divisions;
}
// Mảng cộng dồn: [3,1,2] → [3,4,6]. Hàm thuần (không phải component) nên gán biến trong vòng lặp OK.
function cumSum(nums: number[]): number[] {
  const out: number[] = [];
  let s = 0;
  for (const n of nums) {
    s += n;
    out.push(s);
  }
  return out;
}
export function todayVNStr(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
// Nhãn ngắn "Line {Xưởng} {số}" (VD "Line May 6") — DÙNG CHUNG cho tiêu đề bảng (pphLineTitle) LẪN
// câu nhắc giọng đọc (xem LineBoard, tính năng nhắc trễ nhập bằng âm thanh). Tên Line lưu trong DB
// LUÔN dạng "Line {số}" (khảo sát thật, không ngoại lệ) nên chỉ cần tách số, ghép lại cùng tên
// Xưởng — KHÔNG cần đổi dữ liệu Line trong Cài Đặt.
export function pphLineShortLabel(areaName: string, lineName: string): string {
  const num = lineName.match(/(\d+)\s*$/)?.[1];
  return `Line ${areaName}${num ? ` ${num}` : ` ${lineName}`}`;
}
// Tiêu đề cấp Line (dùng chung cho header trong app LẪN PphViewClient.tsx — sửa 1 chỗ, cả 2 nơi
// đổi theo), khớp đúng cách cấp Nhà máy đang ghi ("Kết quả sản xuất — {Nhà máy}") — trước đây cấp
// Line lỡ ghi "kế hoạch" (sai — đây là số liệu THỰC HIỆN, không phải kế hoạch) và thiếu hẳn tên Xưởng.
export function pphLineTitle(areaName: string, lineName: string): string {
  return `Bảng Kết quả sản xuất - ${pphLineShortLabel(areaName, lineName)}`;
}
// Tiêu đề cấp XƯỞNG GỘP (khác cấp Line ở trên) — dùng cho TV chiếu gộp TOÀN BỘ Line/Chuyền rời rạc
// trong 1 Xưởng thành 1 màn hình (VD Gò: 5 Chuyền độc lập, không có Tổ con, trước đây mỗi Chuyền
// phải chiếu 1 TV riêng — gộp lại cho dễ quan sát cả Xưởng cùng lúc). Xem PphViewWorkshopClient.tsx.
// Ghi "PX" (Phân Xưởng) thay vì "Line" vì đây KHÔNG PHẢI 1 Line/Chuyền cụ thể nữa — cố tình tách
// hàm riêng thay vì sửa pphLineShortLabel/pphLineTitle để KHÔNG ảnh hưởng tiêu đề của mọi Line đơn
// lẻ khác (MAY, từng Chuyền Gò khi xem riêng...) — những chỗ đó vẫn giữ nguyên chữ "Line" như cũ.
export function pphWorkshopTitle(areaName: string, factoryName: string): string {
  const num = factoryName.match(/(\d+)\s*$/)?.[1];
  return `Bảng Kết quả sản xuất - PX ${areaName}${num ? ` ${num}` : ''}`;
}
// Nhắc trễ nhập bằng GIỌNG ĐỌC THẬT (file ghi âm người thật, xem LineBoard) — thay hẳn Web Speech
// API cũ (phụ thuộc máy TV có cài giọng tiếng Việt hay không). Mỗi file ĐÃ chứa SẴN nguyên câu (VD
// to-01.mp3 = "Tổ 01 tiến hành nhập sản lượng đi") — không ghép thêm gì nữa, không còn đọc tên
// Line/tên người nộp (tên người là tập hợp không giới hạn, không thu âm hết được — vẫn hiện trên
// màn hình như cũ, chỉ bỏ khỏi giọng đọc). File đặt tại public/audio/tv-alert/, quy ước tên: "Tổ N"
// → to-NN.mp3, "Chuyền N" → chuyen-NN.mp3, tên khu vực khác tra PPH_ALERT_NAME_FILE_MAP.
export const PPH_ALERT_AUDIO_BASE = '/audio/tv-alert/';
const PPH_ALERT_NAME_FILE_MAP: Record<string, string> = {
  'Đầu vào': 'dau-vao.mp3',
  'Phụ trợ in ép': 'phu-tro-in-ep.mp3',
  'Điều hành QL': 'dieu-hanh-ql.mp3',
  'BP mài rửa': 'bp-mai-rua.mp3',
  'BP dán': 'bp-dan.mp3',
  'BP Sơn': 'bp-son.mp3',
};
// Trả null nếu tên lạ hoặc chưa có file ghi âm tương ứng — chỗ gọi tự bỏ qua đoạn đó (không kẹt).
function pphAlertNameAudioFile(name: string): string | null {
  const toMatch = name.match(/^Tổ\s+(\d+)$/);
  if (toMatch) return `${PPH_ALERT_AUDIO_BASE}to-${toMatch[1].padStart(2, '0')}.mp3`;
  const chuyenMatch = name.match(/^Chuyền\s+(\d+)$/);
  if (chuyenMatch) return `${PPH_ALERT_AUDIO_BASE}chuyen-${chuyenMatch[1].padStart(2, '0')}.mp3`;
  const fixed = PPH_ALERT_NAME_FILE_MAP[name];
  return fixed ? `${PPH_ALERT_AUDIO_BASE}${fixed}` : null;
}
function formatDateVN(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
function toneFor(pct: number | null | undefined, target = DEFAULT_TARGET_PPH): Tone {
  if (pct == null || !Number.isFinite(pct)) return 'none';
  if (pct >= target) return 'ok';
  if (pct >= 75) return 'warn';
  return 'bad';
}

// Gộp 1 tập điểm quét (leaf) — sản lượng lũy kế THỰC TẾ vs chỉ tiêu (theo giờ đã trôi qua) và
// chỉ tiêu CẢ NGÀY. pct = thực tế / chỉ tiêu-tới-giờ (đang bám kịp hay không).
function rollup(leaves: PphLeaf[]) {
  let actual = 0;
  let proTarget = 0;
  let fullTarget = 0;
  let perHourTargetSum = 0;
  let workers = 0;
  const models = new Set<string>();
  for (const l of leaves) {
    actual += l.cumulativeActual || 0;
    proTarget += l.cumulativeTarget || 0;
    // Số khung số lượng THẬT của leaf này (8, hoặc hơn nếu Tổ khai Thời gian sản xuất > 8 giờ) —
    // không còn cố định ×8, xem buildPphSlots() bên _worker.js.
    fullTarget += (l.perHourTarget || 0) * l.slots.length;
    perHourTargetSum += l.perHourTarget || 0;
    workers += l.setup?.workerCount || 0;
    if (l.setup?.model) models.add(l.setup.model);
  }
  fullTarget = Math.round(fullTarget);
  const pct = proTarget > 0 ? round1((actual / proTarget) * 100) : null;
  const fullPct = fullTarget > 0 ? round1((actual / fullTarget) * 100) : null;
  return {
    actual: Math.round(actual),
    proTarget: Math.round(proTarget),
    fullTarget,
    // Tổng Mục tiêu/giờ của MỌI leaf CỘNG LẠI (đang chạy song song cùng lúc) — dùng để hiện
    // "MT/giờ" tổng hợp, KHÔNG suy ngược từ fullTarget/8 nữa (sai khi các leaf có Thời gian sản
    // xuất khác nhau — leaf tăng ca có nhiều khung hơn leaf ca thường).
    perHourTargetSum: Math.round(perHourTargetSum * 10) / 10,
    workers,
    models: models.size,
    pct,
    fullPct,
    remaining: Math.max(0, fullTarget - Math.round(actual)),
    hasSetup: leaves.some((l) => l.setup),
  };
}

// Sản lượng theo giờ (gộp) — cột thực tế/giờ, đường chỉ tiêu lũy kế, đường %PPH lũy kế.
function hourlySeries(leaves: PphLeaf[]) {
  if (!leaves.length) return [];
  // Hợp nhất mọi mốc giờ xuất hiện ở BẤT KỲ leaf nào — không còn giả định mọi leaf có cùng số
  // khung (leaf tăng ca có nhiều khung hơn leaf ca thường 8 giờ), xem buildPphSlots() bên
  // _worker.js. Sắp theo thời gian thật — chuỗi "HH:MM" so sánh trực tiếp được vì luôn 2 chữ số.
  const slotSet = new Set<string>();
  for (const l of leaves) for (const s of l.slots) slotSet.add(s.slot);
  const slots = [...slotSet].sort();
  let cumA = 0;
  let cumT = 0;
  return slots.map((slot) => {
    let a = 0;
    let t = 0;
    let has = false;
    for (const l of leaves) {
      const s = l.slots.find((x) => x.slot === slot);
      if (!s) continue; // Leaf này không có khung giờ này (ca ngắn hơn) — không tính vào chỉ tiêu giờ đó.
      t += l.perHourTarget || 0;
      if (s.actualQty != null) {
        a += s.actualQty;
        has = true;
      }
    }
    cumA += a;
    cumT += t;
    return {
      slot,
      actual: has ? Math.round(a) : null,
      target: Math.round(t),
      // Luỹ kế (cộng dồn từ đầu ca tới hết khung giờ này) — dùng để vẽ cột TĂNG DẦN đều trong ngày
      // (giống bảng mẫu Excel) thay vì cột từng giờ riêng lẻ lên xuống thất thường.
      cumActual: Math.round(cumA),
      cumTarget: Math.round(cumT),
      pph: has && cumT > 0 ? round1((cumA / cumT) * 100) : null,
    };
  });
}

type BreakItem = { name: string; count: number; pct: number };

// Gộp các mục nhỏ (ngoài top N) vào 1 mục "Khác" cho biểu đồ tròn khỏi vụn.
function capItems(items: BreakItem[], total: number, n = 6): BreakItem[] {
  if (items.length <= n) return items;
  const head = items.slice(0, n);
  const restCount = items.slice(n).reduce((a, b) => a + b.count, 0);
  head.push({ name: 'Khác', count: restCount, pct: total > 0 ? round1((restCount / total) * 100) : 0 });
  return head;
}

// Gộp theo `keyOf(khung)` (nhóm nguyên nhân HOẶC giải pháp) — trọng số = LƯỢNG HỤT THẬT của
// khung đó (Mục tiêu/giờ của leaf trừ Số lượng thực tế đã nhập), KHÔNG phải đếm 1 lượt/khung như
// trước. VD 2 khung cùng "Thiếu người" hụt 16 + 16 thì cộng dồn thành 32 (chiếm phần trăm lớn
// hơn hẳn 1 khung "Máy hư" hụt 11), đúng phản ánh mức ảnh hưởng thật, không chỉ tần suất xuất hiện.
function weightedTally(leaves: PphLeaf[], keyOf: (s: PphSlot) => string | null | undefined) {
  const sums = new Map<string, number>();
  let total = 0;
  for (const l of leaves) {
    for (const s of l.slots) {
      if (!s.filled || s.actualQty == null || !l.perHourTarget) continue;
      const key = (keyOf(s) || '').trim();
      if (!key) continue;
      const deficit = l.perHourTarget - s.actualQty;
      if (deficit <= 0) continue; // Khung đạt/vượt chỉ tiêu — không tính vào Pareto hụt chỉ tiêu.
      sums.set(key, (sums.get(key) || 0) + deficit);
      total += deficit;
    }
  }
  const items: BreakItem[] = [...sums.entries()]
    .map(([name, count]) => ({ name, count: round1(count), pct: total > 0 ? round1((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
  return { total: round1(total), items: capItems(items, total) };
}

// Top nguyên nhân = nhóm nguyên nhân hụt chỉ tiêu (5M1E), gia trọng theo lượng hụt thật.
function topLoi(leaves: PphLeaf[]) {
  return weightedTally(leaves, (s) => s.shortfallCauseGroup);
}

// Top giải pháp = giải pháp khắc phục (ô "Giải pháp" nhập tay ở form quét), CÙNG công thức gia
// trọng theo lượng hụt như Top nguyên nhân. `filterCause` (khi bấm chọn 1 nguyên nhân bên biểu đồ
// kia) chỉ tính trên đúng những khung giờ có shortfallCauseGroup khớp — mỗi khung vốn đã nhập CẢ
// nguyên nhân LẪN giải pháp cùng lúc ở form quét, nên đây là mối liên hệ THẬT, không phải suy diễn.
function topSolution(leaves: PphLeaf[], filterCause?: string | null) {
  return weightedTally(leaves, (s) => {
    if (filterCause && s.shortfallCauseGroup !== filterCause) return null;
    return s.shortfallSolution;
  });
}

// Gom các điểm quét của 1 Xưởng thành các "Line" (admin gán tay ở Cài Đặt). Chưa cấu hình gì →
// mỗi điểm quét là 1 line. Có cấu hình → theo cấu hình + điểm nào chưa gán thì đứng riêng 1 line.
// `id` mỗi nhóm trả về DÙNG LÀM MÃ LINE CHO LINK XEM TV RIÊNG (/pph-view/[lineId]) — ưu tiên
// DashLine.id thật (đã cấu hình ở Cài Đặt); Xưởng CHƯA cấu hình thì mỗi điểm quét tự đứng riêng
// 1 "Line" (fallback y hệt logic hiển thị cũ), khi đó dùng thẳng leaf.id làm mã — LUÔN có đúng 1
// mã ổn định cho mọi ô Line hiện ra, dù đã cấu hình DashLine hay chưa.
function areaToLines(areaId: string, areaLeaves: PphLeaf[], lines: DashLine[]) {
  const byId = new Map(areaLeaves.map((l) => [l.id, l]));
  const configured = lines.filter((l) => l.areaId === areaId).sort((a, b) => a.sortOrder - b.sortOrder);
  if (configured.length === 0) return areaLeaves.map((l) => ({ id: l.id, name: l.name, leaves: [l] }));
  const used = new Set<string>();
  const out = configured.map((ln) => {
    const ls = ln.leafIds.map((id) => byId.get(id)).filter((x): x is PphLeaf => !!x);
    ls.forEach((l) => used.add(l.id));
    return { id: ln.id, name: ln.name, leaves: ls };
  });
  for (const l of areaLeaves) if (!used.has(l.id)) out.push({ id: l.id, name: l.name, leaves: [l] });
  return out;
}

// ============================================================================
// CHẾ ĐỘ DEMO — số liệu MINH HOẠ để trình bày giao diện cho sếp. Bật/tắt ở trang Cài Đặt.
// KHÔNG ghi gì vào CSDL: chỉ lấy CẤU TRÚC cây thật (tên Nhà máy/Xưởng/Tổ) rồi tự sinh số liệu.
// ============================================================================
const DEMO_KEY = 'pph_demo_mode';
function readDemo(): boolean {
  try {
    return localStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
}

const Q_SLOTS = ['08:30', '09:30', '10:30', '11:30', '13:30', '14:30', '15:30', '16:30'];
const Q_SLOT_MIN = [510, 570, 630, 690, 810, 870, 930, 990];
const DEMO_MODELS = ['SK-GoRun-2026', 'ADV-Ultra-4', 'PW-Flex-3', 'NB-FreshX', 'SK-MaxCushion'];
const DEMO_CAUSES = ['Con người', 'Máy móc', 'Nguyên vật liệu', 'Phương pháp', 'Đo lường'];
const DEMO_SOLUTIONS = [
  'Bổ sung người hỗ trợ chuyền',
  'Cân bằng lại chuyền',
  'Gọi bảo trì xử lý máy',
  'Kèm cặp thao tác cho công nhân',
  'Cấp bù nguyên vật liệu kịp thời',
  'Rà soát lại mục tiêu với IE',
];

function seededRand(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function nowVNMin(): number {
  const vn = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return vn.getUTCHours() * 60 + vn.getUTCMinutes();
}

function buildDemoData(realFactories: PphFactory[]): {
  factories: PphFactory[];
  lines: DashLine[];
  configs: FactoryConfig[];
} {
  const nowMin = nowVNMin();
  let filledCount = Q_SLOT_MIN.filter((m) => nowMin >= m + 12).length;
  filledCount = Math.max(2, Math.min(8, filledCount || 2));

  const factories: PphFactory[] = realFactories.map((f) => ({
    id: f.id,
    name: f.name,
    leaves: f.leaves.map((leaf, li) => {
      const rnd = seededRand(leaf.id + f.id);
      const planned = 340 + Math.floor(rnd() * 140);
      const perHour = Math.round((planned / 8) * 10) / 10;
      const workerCount = 22 + Math.floor(rnd() * 26);
      const model = DEMO_MODELS[Math.floor(rnd() * DEMO_MODELS.length)];
      const targetRft = 94 + Math.round(rnd() * 5);
      const tier = rnd();
      const baseRatio = tier < 0.16 ? 0.62 + rnd() * 0.12 : tier < 0.4 ? 0.78 + rnd() * 0.12 : 0.94 + rnd() * 0.13;
      const slots: PphSlot[] = Q_SLOTS.map((slot, i) => {
        if (i >= filledCount) return { slot, actualQty: null, filled: false, shortfallCauseGroup: null };
        const actual = Math.max(0, Math.round(perHour * baseRatio * (0.9 + rnd() * 0.2)));
        const under = actual < perHour * 0.95;
        const cause = under && rnd() < 0.65 ? DEMO_CAUSES[Math.floor(rnd() * DEMO_CAUSES.length)] : null;
        const solution = cause ? DEMO_SOLUTIONS[Math.floor(rnd() * DEMO_SOLUTIONS.length)] : null;
        const errorCount = Math.max(0, Math.round(actual * rnd() * 0.08));
        return {
          slot,
          actualQty: actual,
          filled: true,
          submittedBy: 'Demo',
          submittedAt: null,
          shortfallReason: cause ? `${cause} › (demo)` : null,
          shortfallSolution: solution,
          shortfallCauseGroup: cause,
          errorCount,
        };
      });
      const done = slots.filter((s) => s.filled);
      const cumulativeActual = done.reduce((a, s) => a + (s.actualQty || 0), 0);
      const cumulativeTarget = Math.round(perHour * done.length);
      // Số lỗi/% Quality demo — cùng công thức RFT với backend thật (_worker.js /dashboard), chỉ
      // khác nguồn số là random thay vì dữ liệu quét thật.
      const cumulativeErrors = done.reduce((a, s) => a + (s.errorCount || 0), 0);
      const qualityPct = done.length > 0 && cumulativeActual > 0 ? Math.round(((cumulativeActual - cumulativeErrors) / cumulativeActual) * 1000) / 10 : null;
      const latest = done[done.length - 1] || null;
      void li;
      return {
        id: leaf.id,
        name: leaf.name,
        path: leaf.path,
        areaId: leaf.areaId,
        areaName: leaf.areaName,
        // Giữ nguyên ảnh THẬT đã tải lên (nếu có) dù đang ở Chế độ Demo — chỉ số liệu là giả, ảnh
        // sản phẩm vẫn nên hiện đúng thực tế.
        imageUrl: leaf.imageUrl,
        // Chế độ Demo — số liệu toàn bộ là giả nên không tra PPH chuẩn IE thật, luôn rớt về số tự
        // tính (targetPphPerWorker) như trước khi có tính năng này.
        pphStandard: null,
        setup: { workerCount, model, plannedQty: planned, targetRft, productionHours: 8 },
        slots,
        pphLatest: latest ? latest.actualQty : null,
        efficiencyPctLatest: latest && perHour > 0 ? Math.round(((latest.actualQty || 0) / perHour) * 1000) / 10 : null,
        perHourTarget: perHour,
        cumulativeActual,
        cumulativeTarget,
        entryStatus: 'ontime' as const,
        cumulativeErrors: done.length > 0 ? cumulativeErrors : null,
        qualityPct,
      };
    }),
  }));

  const lines: DashLine[] = [];
  for (const f of factories) {
    const byArea = new Map<string, PphLeaf[]>();
    for (const l of f.leaves) {
      if (!l.areaId) continue;
      const arr = byArea.get(l.areaId) || [];
      arr.push(l);
      byArea.set(l.areaId, arr);
    }
    for (const [areaId, ls] of byArea) {
      // Chỉ "gom Line" minh hoạ khi Xưởng đủ nhiều tổ (≥ 6). Ít hơn thì để từng tổ/chuyền đứng riêng.
      if (ls.length < 6) continue;
      for (let i = 0; i < ls.length; i += 5) {
        lines.push({
          id: `demo_${areaId}_${i}`,
          areaId,
          name: `Line ${Math.floor(i / 5) + 1}`,
          sortOrder: i,
          leafIds: ls.slice(i, i + 5).map((x) => x.id),
        });
      }
    }
  }

  const configs: FactoryConfig[] = factories.map((f) => ({
    factoryId: f.id,
    targetPphPct: 100,
    title: `KẾT QUẢ SẢN XUẤT — ${f.name.toUpperCase()}`,
    gddh: 'Quân',
    qlcl: 'Nữ',
    th: 'Tú',
  }));

  return { factories, lines, configs };
}

// ============================================================================

export default function ProductionPerformanceModule() {
  const [showSettings, setShowSettings] = useState(false);
  const [factories, setFactories] = useState<PphFactory[]>([]);
  const [lines, setLines] = useState<DashLine[]>([]);
  const [configs, setConfigs] = useState<FactoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => todayVNStr());
  const [factoryId, setFactoryId] = useState<string | null>(null);
  // Đã bấm vào 1 Line/Chuyền/điểm quét trong trang Nhà máy → xem trang riêng của Line đó.
  const [lineSel, setLineSel] = useState<LineSel | null>(null);
  const [fs, setFs] = useState(false);
  const [fsScale, setFsScale] = useState(1);
  const [demo, setDemo] = useState(() => readDemo());
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const firstLoadRef = useRef(true);
  const isToday = selectedDate === todayVNStr();

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Phóng to → SCALE nội dung LUÔN LẤP ĐẦY BỀ NGANG màn hình, chấp nhận cuộn dọc nếu nội dung dài
  // hơn màn hình. ĐÃ THỬ lấy Math.min(theo chiều ngang, theo chiều cao) để dashboard cao (cấp
  // Line/Tổng quan nhiều Tổ) không cần cuộn — nhưng làm content bị co nhỏ lại để vừa CHIỀU CAO,
  // gây dư khoảng trống rõ rệt 2 bên trái phải (lỗi người dùng báo cáo lại, nặng hơn hẳn việc phải
  // cuộn dọc) — quay lại CHỈ scale theo bề ngang: không bao giờ còn dư khoảng trống ngang, đổi lại
  // dashboard rất cao (VD Tổng quan Tổ hợp có 60+ Tổ) vẫn cần cuộn dọc — chấp nhận được, vì lấp đầy
  // ngang quan trọng hơn theo phản hồi thực tế.
  /* eslint-disable react-hooks/set-state-in-effect -- scale là trạng thái SUY RA từ đo layout, không phải cascading render vô nghĩa */
  useEffect(() => {
    if (!fs) {
      setFsScale(1);
      return;
    }
    const fit = () => {
      const s = window.innerWidth / FS_DESIGN_W;
      setFsScale(Number.isFinite(s) && s > 0 ? Math.min(s, 3) : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener('resize', fit);
    const iv = window.setInterval(fit, 3000);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
      window.clearInterval(iv);
    };
  }, [fs]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const load = useCallback(
    async (opts?: { silent?: boolean; fresh?: boolean; date?: string }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const d = opts?.date || selectedDate;
        // Lần tải ĐẦU (chưa có dữ liệu) luôn lấy MỚI — để chắc chắn có areaId/nhóm nguyên nhân
        // ngay sau khi deploy (bản cache 5 phút có thể còn hình dạng cũ). Các lượt poll sau dùng cache.
        const fresh = opts?.fresh || firstLoadRef.current ? '&fresh=1' : '';
        const [dashRes, lineRes, cfgRes] = await Promise.allSettled([
          fetch(`/api/pph/dashboard?date=${d}${fresh}`).then((r) => r.json()),
          fetch('/api/pph/dashboard-lines').then((r) => r.json()),
          fetch('/api/pph/factory-config').then((r) => r.json()),
        ]);
        if (dashRes.status === 'fulfilled' && dashRes.value?.success && dashRes.value.data) {
          const realFactories: PphFactory[] = dashRes.value.data.factories || [];
          if (demo) {
            // CHẾ ĐỘ DEMO — giữ cấu trúc cây thật, tự sinh số liệu + Line + cấu hình mẫu.
            const dd = buildDemoData(realFactories);
            setFactories(dd.factories);
            setLines(dd.lines);
            setConfigs(dd.configs);
          } else {
            setFactories(realFactories);
            if (lineRes.status === 'fulfilled' && lineRes.value?.success) setLines(lineRes.value.lines || []);
            if (cfgRes.status === 'fulfilled' && cfgRes.value?.success) setConfigs(cfgRes.value.configs || []);
          }
          setError(null);
          setLastUpdated(new Date());
          if (firstLoadRef.current) firstLoadRef.current = false;
        } else {
          setError(
            (dashRes.status === 'fulfilled' && dashRes.value?.error) || 'Không tải được dữ liệu',
          );
        }
      } catch {
        setError('Không kết nối được tới hệ thống');
      } finally {
        setLoading(false);
      }
    },
    [selectedDate, demo],
  );

  useEffect(() => {
    // Tải khi đổi ngày / chế độ (load đổi theo selectedDate+demo) + poll mỗi 60s nếu đang xem hôm nay.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() là fetch bất đồng bộ, setState chạy sau await
    load();
    if (!isToday) return;
    const t = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(t);
  }, [load, isToday]);

  // Bật/tắt Demo ở tab khác (hoặc tab này) → tự cập nhật.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DEMO_KEY) setDemo(readDemo());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const factory = factories.find((f) => f.id === factoryId) ?? null;
  const factoryCfg = factory ? configs.find((c) => c.factoryId === factory.id) : undefined;
  const factoryTargetPph = factoryCfg?.targetPphPct ?? DEFAULT_TARGET_PPH;
  // Điểm quét của Line đang chọn — lọc lại từ dữ liệu MỚI mỗi lần render để số liệu luôn cập nhật.
  const lineLeaves = factory && lineSel ? factory.leaves.filter((l) => lineSel.leafIds.includes(l.id)) : [];

  function toggleFs() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else rootRef.current?.requestFullscreen().catch(() => {});
  }

  if (showSettings) {
    return (
      <PphSettingsView
        onClose={() => {
          setShowSettings(false);
          setDemo(readDemo());
          load({ fresh: true });
        }}
      />
    );
  }

  // Cấp Line đổi hẳn sang nền trắng cho dễ nhìn khi đọc bảng số liệu (Tổng quan/Nhà máy vẫn giữ
  // nền tối) — light-theme CSS đã xây sẵn khắp các component con, chỉ cần bật/tắt qua prop này.
  const isLineView = !!(factory && lineSel && lineLeaves.length > 0);

  return (
    <div
      ref={rootRef}
      className={`w-full max-w-full ${
        isLineView ? 'bg-white text-tbs-dark' : 'bg-[#0a1a2f] bg-[radial-gradient(ellipse_at_top,#0f2b4a_0%,#0a1a2f_60%)] text-slate-200'
      } ${
        // Cuộn dọc được khi phóng to (scale giờ chỉ theo bề ngang — xem ghi chú ở effect tính
        // fsScale — nội dung có thể cao hơn màn hình thật) — bình thường (không phóng to) vẫn
        // overflow-hidden như cũ, trang cha /work tự cuộn.
        fs ? 'flex items-start justify-center overflow-y-auto' : `overflow-hidden rounded-3xl border ${isLineView ? 'border-gray-200' : 'border-cyan-500/20'}`
      }`}
    >
      <div
        ref={contentRef}
        className={fs ? 'shrink-0' : 'w-full'}
        style={fs ? { width: FS_DESIGN_W, transform: `scale(${fsScale})`, transformOrigin: 'top center' } : undefined}
      >
      {/* Header */}
      <div className={`relative flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 ${isLineView ? 'border-gray-100' : 'border-cyan-500/15'}`}>
        <div className="flex min-w-0 items-center gap-3">
          {/* Logo TBS bên trái — CHỈ cấp Line (giống hệt TV, xem PphViewClient.tsx), Tổng quan/Nhà
              máy giữ nguyên không đổi. */}
          {isLineView && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/images/tbs-logo.png" alt="TBS" className="h-8 w-auto shrink-0 object-contain sm:h-9" />
          )}
          {factory && lineSel && lineLeaves.length > 0 ? (
            <button
              type="button"
              onClick={() => setLineSel(null)}
              className={`flex h-9 items-center gap-1 rounded-lg border px-2.5 text-xs font-bold ${
                isLineView ? 'border-gray-200 bg-gray-100 text-tbs-dark hover:bg-gray-200' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
              }`}
            >
              <IconChevronLeft size={15} /> {factory.name}
            </button>
          ) : factory ? (
            <button
              type="button"
              onClick={() => {
                setLineSel(null);
                setFactoryId(null);
              }}
              className="flex h-9 items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
            >
              <IconChevronLeft size={15} /> Tổng quan
            </button>
          ) : null}
          {/* Cấp Line — tiêu đề CĂN GIỮA hàng (đúng ảnh mẫu, khớp cách TV đã làm ở PphViewClient.tsx)
              nhưng CHỈ từ xl: trở lên (≥1280px) — màn hẹp hơn thì giữ nguyên vị trí cũ (ngay sau nút
              back) vì bên phải hàng này còn lịch/nút làm mới/toàn màn hình/cài đặt, absolute-center
              ở màn hẹp dễ đè lên đám nút đó. Tổng quan/Nhà máy không đổi gì (giữ nguyên luồng cũ). */}
          <div className={`min-w-0 ${isLineView ? 'xl:absolute xl:left-1/2 xl:top-1/2 xl:max-w-[45%] xl:-translate-x-1/2 xl:-translate-y-1/2 xl:text-center' : ''}`}>
            <h2 className={`truncate text-lg font-black uppercase tracking-wide sm:text-2xl ${isLineView ? 'text-tbs-dark' : 'text-white'}`}>
              {factory && lineSel && lineLeaves.length > 0
                ? pphLineTitle(lineSel.areaName, lineSel.name)
                : factory
                  ? factoryCfg?.title || `Kết quả sản xuất — ${factory.name}`
                  : 'Kết quả sản xuất — Hệ thống Nhà máy'}
            </h2>
            {/* Cấp Line đổi hẳn dòng phụ thành câu mô tả bảng (giống bảng mẫu Excel) thay vì lặp lại
                tên Nhà máy (đã gộp vào dòng tiêu đề chính ở trên rồi, xem nhánh trên). */}
            {factory && lineSel && lineLeaves.length > 0 && (
              <p className={`truncate text-[11px] font-bold sm:text-xs ${isLineView ? 'text-cyan-700' : 'text-cyan-300'}`}>
                Bảng tiến độ và năng suất sản xuất ({lineLeaves.length} điểm quét)
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Khối ngày/giờ ĐÃ BỎ khỏi đây theo yêu cầu — chỉ giữ lại ở trang chiếu TV riêng
              (PphViewClient.tsx), không hiện ở Tổng quan/Nhà máy/Line trong app nữa. */}
          <label
            className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 ${
              isLineView ? 'border-gray-200 bg-gray-50 text-tbs-dark' : 'border-cyan-500/25 bg-cyan-500/5 text-cyan-100'
            }`}
          >
            <IconCalendar size={15} className={`shrink-0 ${isLineView ? 'text-gray-500' : 'text-cyan-400'}`} />
            <input
              type="date"
              value={selectedDate}
              max={todayVNStr()}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className={`w-[112px] bg-transparent text-sm font-bold outline-none ${isLineView ? 'text-tbs-dark [color-scheme:light]' : 'text-cyan-100 [color-scheme:dark]'}`}
            />
          </label>
          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayVNStr())}
              className={`h-9 rounded-lg border px-2.5 text-sm font-bold ${
                isLineView ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
              }`}
            >
              Hôm nay
            </button>
          )}
          {factory && !lineSel && (
            <button
              type="button"
              onClick={() => copyTvLinkFactory(factory.id)}
              title="Lấy link TV (xem riêng cả Nhà máy, không cần đăng nhập)"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/15"
            >
              <IconDeviceTv size={16} /> Lấy link TV
            </button>
          )}
          <button
            type="button"
            onClick={() => load({ fresh: true })}
            title="Làm mới"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              isLineView ? 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100' : 'border-cyan-500/25 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/15'
            }`}
          >
            <IconRefresh size={16} />
          </button>
          <button
            type="button"
            onClick={toggleFs}
            title="Toàn màn hình"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              isLineView ? 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100' : 'border-cyan-500/25 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/15'
            }`}
          >
            {fs ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            title="Cài đặt"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              isLineView ? 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100' : 'border-cyan-500/25 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/15'
            }`}
          >
            <IconSettings size={16} />
          </button>
        </div>
      </div>

      {demo && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/30 bg-amber-500/15 px-4 py-2 text-xs font-black text-amber-200 sm:px-6">
          <span>⚠ CHẾ ĐỘ DEMO — số liệu MINH HOẠ để trình bày giao diện, KHÔNG phải dữ liệu thật.</span>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="rounded-md border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 font-bold hover:bg-amber-500/30"
          >
            Tắt ở Cài đặt
          </button>
        </div>
      )}

      <div className="space-y-3 p-3 sm:p-5">
        {loading && factories.length === 0 ? (
          <div className="py-24 text-center text-sm font-semibold text-slate-400">Đang tải dữ liệu...</div>
        ) : error && factories.length === 0 ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 py-10 text-center text-sm font-semibold text-rose-300">⚠️ {error}</div>
        ) : factories.length === 0 ? (
          <div className="space-y-2 py-20 text-center text-sm text-slate-400">
            <p>Chưa có Nhà máy nào được cấu hình.</p>
            <button type="button" onClick={() => setShowSettings(true)} className="font-bold text-cyan-300 hover:underline">
              Vào Cài Đặt để thêm Nhà máy / Xưởng / Chuyền / Tổ →
            </button>
          </div>
        ) : factory && lineSel && lineLeaves.length > 0 ? (
          <LineBoard sel={lineSel} leaves={lineLeaves} targetPph={factoryTargetPph} light tv />
        ) : factory ? (
          <FactoryBoard factory={factory} lines={lines} configs={configs} onPickLine={setLineSel} />
        ) : (
          <OverviewBoard
            factories={factories}
            configs={configs}
            onPick={(id) => {
              setLineSel(null);
              setFactoryId(id);
            }}
          />
        )}

        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[11px] font-semibold ${
            isLineView ? 'border-gray-100 text-gray-500' : 'border-cyan-500/15 text-slate-500'
          }`}
        >
          <span>
            {isToday
              ? `Cập nhật tự động mỗi 60s · lần cuối ${lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}`
              : `Đang xem lại ngày ${formatDateVN(selectedDate)}`}
          </span>
          <span className="tracking-wide">MAKE GOOD SHOES FOR A BRIGHTER TOMORROW</span>
        </div>
      </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vòng cung tỉ lệ %
function Gauge({ pct, size = 92, tone, hideText = false, light = false }: { pct: number | null; size?: number; tone: Tone; hideText?: boolean; light?: boolean }) {
  const stroke = hideText ? Math.max(5, size * 0.16) : 9;
  const r = (size - stroke - 4) / 2;
  const c = 2 * Math.PI * r;
  const safe = pct != null && Number.isFinite(pct) ? pct : null;
  const v = safe == null ? 0 : Math.max(0, Math.min(100, safe));
  const t = light ? TONE_LIGHT : TONE;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={light ? '#e2e8f0' : '#1e3a5f'} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={t[tone].ring}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {!hideText && (
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className={`${light ? 'fill-tbs-dark' : 'fill-white'} font-black`} fontSize={size * 0.26}>
          {safe == null ? '—' : `${Math.round(safe)}%`}
        </text>
      )}
    </svg>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className={`min-w-0 rounded-lg border px-1.5 py-2 text-center ${tone ? `${TONE[tone].chipBg} ${TONE[tone].chipBorder}` : 'border-cyan-500/20 bg-cyan-500/5'}`}>
      <div className="text-[9px] font-bold uppercase leading-tight tracking-wide text-slate-400">{label}</div>
      <div className={`truncate text-base font-black tabular-nums sm:text-lg ${tone ? TONE[tone].text : 'text-white'}`}>{value}</div>
    </div>
  );
}

// 1 card gồm 2 nửa "Chỉ tiêu | Thực hiện" ngăn nhau bằng 1 vạch dọc (như ảnh mẫu).
function PairCard({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  tone,
  light = false,
  compact = false,
  tv = false,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  tone?: Tone;
  light?: boolean;
  // Cấp Line — hàng "chỉ tiêu" giờ chỉ còn phụ (Chi tiết các tổ mới là trọng tâm cần to/rõ), thu
  // nhỏ lại để nhường chỗ, khác AreaPanel (Tổng quan/Nhà máy) vẫn giữ nguyên cỡ cũ.
  compact?: boolean;
  // Trang chiếu TV RIÊNG 1 Line (PphViewClient) — NGƯỢC LẠI với compact: số to hẳn lên (đọc được
  // từ xa) nhưng vẫn giữ đệm gọn + BỎ bo góc (đồng bộ khối vuông góc kiểu bảng KPI) để hàng chỉ
  // tiêu không chiếm quá nhiều chiều cao, nhường chỗ cho "Tình trạng các tổ" vừa lọt 1 màn hình.
  tv?: boolean;
}) {
  const t = light ? TONE_LIGHT : TONE;
  const rounded = tv ? '' : 'rounded-xl';
  const pad = tv ? 'px-2 py-1.5' : compact ? 'px-2 py-1' : 'px-2 py-2.5';
  const labelSize = compact ? 'text-[9px]' : 'text-[10px]';
  const valueSize = tv ? 'text-3xl' : compact ? 'text-sm' : light ? 'text-2xl' : 'text-xl';
  return (
    <div className={`flex overflow-hidden ${rounded} border ${light ? 'border-gray-200 bg-gray-50' : 'border-cyan-500/20 bg-cyan-500/5'}`}>
      <div className={`min-w-0 flex-1 text-center ${pad}`}>
        <div className={`font-bold uppercase leading-tight tracking-wide ${labelSize} ${light ? 'text-gray-600' : 'text-slate-400'}`}>{leftLabel}</div>
        <div className={`truncate font-black tabular-nums ${valueSize} ${light ? 'text-tbs-dark' : 'text-white'}`}>{leftValue}</div>
      </div>
      <div className={`w-px shrink-0 ${light ? 'bg-gray-200' : 'bg-cyan-500/25'}`} />
      <div className={`min-w-0 flex-1 text-center ${pad} ${tone ? t[tone].chipBg : ''}`}>
        <div className={`font-bold uppercase leading-tight tracking-wide ${labelSize} ${light ? 'text-gray-600' : 'text-slate-400'}`}>{rightLabel}</div>
        <div className={`truncate font-black tabular-nums ${valueSize} ${tone ? t[tone].text : light ? 'text-tbs-dark' : 'text-white'}`}>{rightValue}</div>
      </div>
    </div>
  );
}

function ProgressBar({ pct, tone, light = false }: { pct: number | null; tone: Tone; light?: boolean }) {
  const v = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  const t = light ? TONE_LIGHT : TONE;
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full ${light ? 'bg-gray-200' : 'bg-[#12263f]'}`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${v}%`, backgroundColor: t[tone].ring }} />
    </div>
  );
}

function Panel({
  title,
  right,
  children,
  light = false,
  tv = false,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  light?: boolean;
  // Trang chiếu TV (Line/Nhà máy) — bỏ bo góc, đồng bộ khối vuông góc kiểu bảng KPI đã dùng khắp
  // các component con khác (PairCard/RefStat...) khi tv=true, KHÔNG đổi gì khi tv=false (mặc định)
  // — mọi nơi đang gọi Panel không truyền tv vẫn y hệt như cũ.
  tv?: boolean;
}) {
  return (
    // min-w-0 — Panel thường nằm làm 1 Ô trong lưới grid (VD 5 thẻ Tổ cấp Line) — không có dòng
    // này, 1 ô có nội dung không chịu co (VD số % dài không tự động dòng ở RefStat) sẽ ép nguyên
    // hàng grid rộng ra theo, tràn khỏi khung phóng to (min-width mặc định của ô grid là "auto",
    // không phải 0).
    <div className={`min-w-0 border p-3 sm:p-3.5 ${tv ? '' : 'rounded-2xl'} ${light ? 'border-gray-100 bg-white shadow-sm' : 'border-cyan-500/20 bg-[#0d2136]/80'}`}>
      {(title || right) && (
        <div className="mb-2.5 flex items-center justify-between gap-2">
          {title && <h3 className={`text-sm font-black uppercase tracking-wide ${light ? 'text-tbs-dark' : 'text-cyan-100'}`}>{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// Nhãn phân mục ĐỨNG NGOÀI card (khác Panel title — nằm trong khung bo góc riêng) — vạch màu +
// chữ hoa đậm, dùng cho các khối lớn cấp Line (VD "Chi tiết các tổ sản xuất") giống bảng mẫu Excel.
function SectionLabel({ light = false, children }: { light?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className={`h-3.5 w-1 shrink-0 rounded-full ${light ? 'bg-accent' : 'bg-cyan-400'}`} />
      <h3 className={`text-sm font-black uppercase tracking-wide ${light ? 'text-tbs-dark' : 'text-cyan-100'}`}>{children}</h3>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Biểu đồ cột theo giờ — THUẦN <div> (flexbox), chiều cao cột tính bằng px (không %), nhẹ, đọc rõ trên TV.
// Số sản lượng nằm TRONG cột (cột cao) hoặc ngay trên đầu cột (cột thấp) — không chồng chữ.
// (Biểu đồ tròn bên dưới dùng SVG tĩnh — cũng không thư viện, không animation.)
function HourlyChart({
  leaves,
  height = 200,
  light = false,
  tv = false,
}: {
  leaves: PphLeaf[];
  height?: number;
  light?: boolean;
  // Trang chiếu TV RIÊNG 1 Line + hàng chỉ số cấp Line ở trang thường (LineBoard, xem prop tv) —
  // MỌI số trong biểu đồ (trục, nhãn giờ, số sản lượng) to hẳn lên, đọc được từ xa.
  tv?: boolean;
}) {
  const data = useMemo(() => hourlySeries(leaves), [leaves]);
  const t = light ? TONE_LIGHT : TONE;
  if (!data.length) return <div className={`py-8 text-center text-xs ${light ? 'text-gray-400' : 'text-slate-500'}`}>Chưa có dữ liệu.</div>;
  const barH = Math.max(64, height - 18);
  const N = data.length;
  const AXIS_DIVS = 6;
  // Cột TỪNG GIỜ riêng (KHÔNG cộng dồn luỹ kế) — mỗi cột = đúng sản lượng giờ đó, tô màu theo
  // ĐÚNG giờ đó có đạt mục tiêu/giờ hay không (đỏ/vàng/xanh). Đường Mục tiêu vẽ từ target/giờ
  // (thường không đổi suốt ca nên nằm THẲNG NGANG) — nhìn là biết ngay cột dưới hay trên mục tiêu.
  const rawMax = Math.max(1, ...data.map((d) => Math.max(d.actual ?? 0, d.target)));
  const niceMax = niceAxisMax(rawMax, AXIS_DIVS);
  const leftTicks = Array.from({ length: AXIS_DIVS + 1 }, (_, i) => Math.round((niceMax / AXIS_DIVS) * i));
  const barPx = (d: (typeof data)[number]) => (d.actual == null ? 0 : Math.max(3, Math.round((d.actual / niceMax) * barH)));
  const targetPts = data.map((d, i) => `${((i + 0.5) / N) * 100},${100 - Math.min(1, d.target / niceMax) * 100}`).join(' ');
  // Đường %PPH thực hiện — thang RIÊNG bên phải (0..maxPct), luỹ kế sẵn trong d.pph (actual/target
  // tính tới hết khung giờ đó — vẫn giữ luỹ kế cho đường này, phản ánh đúng hiệu suất chung tới
  // giờ hiện tại, khác với cột bên dưới giờ đã đổi lại thành riêng từng giờ).
  const rawMaxPct = Math.max(120, ...data.map((d) => d.pph ?? 0));
  const maxPct = niceAxisMax(rawMaxPct, AXIS_DIVS);
  const rightTicks = Array.from({ length: AXIS_DIVS + 1 }, (_, i) => Math.round((maxPct / AXIS_DIVS) * i));
  const pphPts = data
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.pph != null)
    .map(({ d, i }) => `${((i + 0.5) / N) * 100},${100 - ((d.pph as number) / maxPct) * 100}`)
    .join(' ');
  const axisW = tv ? 44 : 34;
  const tickCls = tv ? 'text-sm' : 'text-[9px]';
  return (
    <div>
      {/* Chú thích — cột/đường mục tiêu/đường %PPH, giống đúng bảng mẫu Excel. */}
      <div className={`mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-bold ${tv ? 'text-xs' : 'text-[10px]'}`}>
        <span className={`flex items-center gap-1 ${light ? 'text-gray-500' : 'text-slate-300'}`}>
          <span className="h-2 w-2.5 rounded-sm" style={{ backgroundColor: t.ok.bar }} /> Thực hiện
        </span>
        <span className={`flex items-center gap-1 ${light ? 'text-gray-500' : 'text-slate-300'}`}>
          <svg width="14" height="8"><line x1="0" y1="4" x2="14" y2="4" stroke={light ? '#94a3b8' : '#cbd5e1'} strokeWidth={2} strokeDasharray="3 2" /></svg> Mục tiêu
        </span>
        <span className="flex items-center gap-1 text-amber-500">
          <svg width="14" height="8"><line x1="0" y1="4" x2="14" y2="4" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" /></svg> %PPH
        </span>
      </div>
      <div className="flex items-stretch gap-1.5">
        {/* Trục trái — sản lượng theo giờ (0..niceMax). */}
        <div className="flex shrink-0 flex-col justify-between text-right" style={{ height: barH, width: axisW }}>
          {leftTicks
            .slice()
            .reverse()
            .map((v) => (
              <span key={v} className={`${tickCls} font-semibold leading-none ${light ? 'text-gray-400' : 'text-slate-500'}`}>
                {fmtInt(v)}
              </span>
            ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height: barH }}>
          {/* Gạch ngang mốc trục — kẻ mờ, giúp so cột với mục tiêu nhanh hơn. */}
          {leftTicks.map((v) => (
            <div
              key={v}
              className={`absolute left-0 right-0 border-t ${light ? 'border-gray-100' : 'border-white/10'}`}
              style={{ bottom: `${(v / niceMax) * 100}%` }}
            />
          ))}
          <div className="relative flex h-full items-end gap-0.5">
            {data.map((d, i) => {
              const px = barPx(d);
              const inside = px >= 26;
              // Tô màu cột theo ĐÚNG giờ đó — đạt/gần đạt/chưa đạt mục tiêu/giờ (khác d.pph, vốn
              // là hiệu suất LUỸ KẾ tới giờ đó, không phản ánh đúng riêng giờ này).
              const hourPct = d.actual != null && d.target > 0 ? round1((d.actual / d.target) * 100) : null;
              const tone: Tone = hourPct == null ? 'none' : toneFor(hourPct);
              return (
                <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                  {/* z-10: nhãn số PHẢI luôn nổi TRÊN đường/chấm %PPH (svg + dot vẽ SAU trong DOM,
                      mặc định đè lên số khi %PPH ~100% trùng ngay đỉnh cột) — xem 2 lớp overlay
                      bên dưới, không có z-index nên mặc định vẽ sau = đè lên trước. */}
                  {d.actual != null && !inside && (
                    <span className={`relative z-10 mb-0.5 text-center font-black leading-none ${tv ? 'text-base' : 'text-[11px]'} ${light ? 'text-tbs-dark' : 'text-slate-100'}`}>{fmtInt(d.actual)}</span>
                  )}
                  <div className="flex w-[58%] max-w-[40px] justify-center rounded-t pt-1" style={{ height: px, backgroundColor: t[tone].bar }}>
                    {d.actual != null && inside && (
                      <span className={`relative z-10 font-black leading-none ${tv ? 'text-base' : 'text-[11px]'} ${tone === 'none' ? (light ? 'text-tbs-dark' : 'text-slate-100') : light ? 'text-white' : 'text-[#0a1a2f]'}`}>
                        {fmtInt(d.actual)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke={light ? '#94a3b8' : '#cbd5e1'}
              strokeWidth={2}
              strokeDasharray="4 3"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              points={targetPts}
            />
            {pphPts && (
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                points={pphPts}
              />
            )}
          </svg>
          {/* Trước đây có chấm tròn vàng đánh dấu từng điểm %PPH — bỏ hẳn vì hay đè lên đúng chỗ
              số sản lượng trên đỉnh cột (đường vẫn đủ thể hiện xu hướng, không cần thêm chấm). */}
        </div>
        {/* Trục phải — %PPH (0..maxPct). */}
        <div className="flex shrink-0 flex-col justify-between text-left" style={{ height: barH, width: axisW }}>
          {rightTicks
            .slice()
            .reverse()
            .map((v) => (
              <span key={v} className={`${tickCls} font-semibold leading-none ${light ? 'text-gray-400' : 'text-slate-500'}`}>
                {v}%
              </span>
            ))}
        </div>
      </div>
      {/* Nhãn giờ — canh đúng dưới vùng cột (chừa đúng khổ 2 trục trái/phải bên trên), gap tối
          thiểu (0.5) + overflow-hidden mỗi nhãn: nhiều khung giờ (tăng ca) trong bề ngang hẹp (VD
          cột chart bị ép bớt cạnh ô Sản lượng lũy kế) trước đây chữ đè lên nhau đọc không nổi
          ("08:3009:3010:30..." dính liền) — giờ mỗi nhãn tự cắt gọn trong đúng khổ của nó. */}
      <div className="mt-1 flex gap-1.5">
        <div className="shrink-0" style={{ width: axisW }} />
        <div className="flex min-w-0 flex-1 gap-0.5">
          {data.map((d, i) => (
            <span key={i} className={`min-w-0 flex-1 overflow-hidden text-center font-semibold whitespace-nowrap ${tickCls} ${light ? 'text-gray-400' : 'text-slate-400'}`}>
              {d.slot.slice(0, 5)}
            </span>
          ))}
        </div>
        <div className="shrink-0" style={{ width: axisW }} />
      </div>
    </div>
  );
}

// Biểu đồ tròn (donut) THUẦN SVG — vẽ từng cung bằng stroke-dasharray. Nhẹ, không thư viện.
// Ghi % ngay trên từng lát bánh (lát nhỏ < 7% thì bỏ nhãn cho đỡ rối). KHÔNG có số ở giữa.
// `onSelect` (chỉ dùng cho biểu đồ Top nguyên nhân) cho bấm thẳng vào lát bánh để lọc biểu đồ Top
// giải pháp bên cạnh — lát đang chọn giữ nguyên độ đậm, các lát khác mờ đi (opacity) để dễ nhận ra.
function Donut({
  items,
  total,
  size = 124,
  selectedName,
  onSelect,
  light = false,
}: {
  items: BreakItem[];
  total: number;
  size?: number;
  selectedName?: string | null;
  onSelect?: (name: string) => void;
  light?: boolean;
}) {
  const stroke = Math.round(size * 0.34);
  const cx = size / 2;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ends = cumSum(items.map((it) => it.count));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto block h-auto w-full max-w-[150px] overflow-visible">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={light ? '#e2e8f0' : '#12263f'} strokeWidth={stroke} />
      {total > 0 &&
        items.map((it, i) => {
          const start = ends[i] - it.count;
          const len = (it.count / total) * circ;
          const dimmed = !!selectedName && selectedName !== it.name;
          return (
            <circle
              key={it.name}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={LOI_COLORS[i % LOI_COLORS.length]}
              opacity={dimmed ? 0.3 : 1}
              onClick={onSelect ? () => onSelect(it.name) : undefined}
              style={onSelect ? { cursor: 'pointer' } : undefined}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-(start / total) * circ}
              transform={`rotate(-90 ${cx} ${cx})`}
            />
          );
        })}
      {total > 0 &&
        items.map((it, i) => {
          if (it.pct < 7) return null;
          const start = ends[i] - it.count;
          const ang = ((start + it.count / 2) / total) * 2 * Math.PI - Math.PI / 2;
          return (
            <text
              key={it.name}
              x={cx + r * Math.cos(ang)}
              y={cx + r * Math.sin(ang)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.092}
              className="fill-white font-black"
              stroke="#0b1f34"
              strokeWidth={size * 0.02}
              paintOrder="stroke"
              opacity={selectedName && selectedName !== it.name ? 0.3 : 1}
              onClick={onSelect ? () => onSelect(it.name) : undefined}
              style={{ strokeLinejoin: 'round', cursor: onSelect ? 'pointer' : undefined }}
            >
              {Math.round(it.pct)}%
            </text>
          );
        })}
    </svg>
  );
}

// Top Lỗi / Top Giải pháp — biểu đồ tròn chiếm 2/5, danh sách chi tiết bên phải 3/5. `kind="loi"`
// cho bấm chọn 1 nguyên nhân (donut LẪN dòng trong danh sách đều bấm được) — `onSelectCause` báo
// lên component cha (TopLoiGiaiPhapPanels) để lọc lại `kind="giaiphap"` bên cạnh qua `filterCause`.
function LoiPie({
  leaves,
  kind = 'loi',
  filterCause,
  selectedCause,
  onSelectCause,
  light = false,
  compact = false,
}: {
  leaves: PphLeaf[];
  kind?: 'loi' | 'giaiphap';
  filterCause?: string | null;
  selectedCause?: string | null;
  onSelectCause?: (name: string | null) => void;
  light?: boolean;
  // Dùng khi hiện NHIỀU LoiPie cạnh nhau (tách theo Xưởng, xem TopLoiGiaiPhapPanels) — donut nhỏ
  // lại, xếp DỌC (donut trên, chú thích dưới) thay vì ngang, để 2+ cái vừa 1 hàng.
  compact?: boolean;
}) {
  const { total, items } = useMemo(
    () => (kind === 'loi' ? topLoi(leaves) : topSolution(leaves, filterCause)),
    [leaves, kind, filterCause],
  );
  const clickable = kind === 'loi' && !!onSelectCause;
  if (total === 0)
    return (
      <div className={`text-center text-xs ${compact ? 'py-4 text-[10px]' : 'py-10'} ${light ? 'text-gray-400' : 'text-slate-500'}`}>
        {kind === 'loi'
          ? 'Chưa có lượt hụt chỉ tiêu nào.'
          : filterCause
            ? `Chưa có giải pháp nào ghi nhận cho "${filterCause}".`
            : 'Chưa có giải pháp nào được ghi nhận.'}
      </div>
    );
  const toggle = (name: string) => onSelectCause?.(selectedCause === name ? null : name);
  return (
    <div className={compact ? 'flex flex-col items-center gap-1.5' : 'flex items-center justify-center gap-3'}>
      <div className={compact ? 'w-full max-w-[96px] shrink-0' : 'w-[42%] max-w-[160px] shrink-0'}>
        <Donut
          items={items}
          total={total}
          size={compact ? 84 : 124}
          selectedName={kind === 'loi' ? selectedCause : undefined}
          onSelect={clickable ? toggle : undefined}
          light={light}
        />
      </div>
      <ul className={compact ? 'w-full min-w-0 space-y-0.5 text-[9px]' : 'min-w-0 shrink space-y-1 text-[11px]'}>
        {items.map((it, i) => {
          const isSelected = kind === 'loi' && selectedCause === it.name;
          return (
            <li key={it.name}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => toggle(it.name)}
                className={`flex w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition ${
                  clickable ? `cursor-pointer ${light ? 'hover:bg-gray-100' : 'hover:bg-white/10'}` : ''
                } ${isSelected ? (light ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-300' : 'bg-cyan-500/15 ring-1 ring-inset ring-cyan-400/40') : ''}`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: LOI_COLORS[i % LOI_COLORS.length] }} />
                <span className={`min-w-0 flex-1 truncate ${light ? 'text-gray-600' : 'text-slate-300'}`}>{it.name}</span>
                <span className={`shrink-0 font-bold tabular-nums ${light ? 'text-tbs-dark' : 'text-white'}`}>{it.pct}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Gói chung 1 cặp Top nguyên nhân / Top giải pháp. Nhận DANH SÁCH Xưởng (areas) thay vì 1 mảng
// leaves phẳng — >1 Xưởng thì mỗi khung tự chia nhỏ thành N biểu đồ tròn compact (1/Xưởng, xem
// LoiPie compact) xếp cạnh nhau; đúng 1 nhóm (VD cấp Tổng quan gộp cả tổ hợp) thì hiện y hệt bản
// gốc — 1 biểu đồ to, không chia. State "đang chọn nguyên nhân" tách RIÊNG theo từng Xưởng (key
// bằng area.id) để bấm lọc ở Xưởng này không ảnh hưởng Xưởng kia; tự mất khi unmount màn hình.
function TopLoiGiaiPhapPanels({ areas, light = false }: { areas: { id: string; name: string; leaves: PphLeaf[] }[]; light?: boolean }) {
  const [selectedByArea, setSelectedByArea] = useState<Record<string, string | null>>({});
  const compact = areas.length > 1;
  const labelCls = `mb-1 truncate text-center text-[9px] font-black uppercase tracking-wide ${light ? 'text-gray-500' : 'text-slate-400'}`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Panel light={light} title="Top nguyên nhân">
        <div className={compact ? 'grid grid-cols-2 gap-2' : undefined}>
          {areas.map((a) => (
            <div key={a.id} className="min-w-0">
              {compact && <div className={labelCls}>{a.name}</div>}
              <LoiPie
                leaves={a.leaves}
                kind="loi"
                selectedCause={selectedByArea[a.id] ?? null}
                onSelectCause={(name) => setSelectedByArea((s) => ({ ...s, [a.id]: s[a.id] === name ? null : name }))}
                light={light}
                compact={compact}
              />
            </div>
          ))}
        </div>
      </Panel>
      <Panel light={light} title="Top giải pháp">
        <div className={compact ? 'grid grid-cols-2 gap-2' : undefined}>
          {areas.map((a) => (
            <div key={a.id} className="min-w-0">
              {compact && <div className={labelCls}>{a.name}</div>}
              <LoiPie leaves={a.leaves} kind="giaiphap" filterCause={selectedByArea[a.id] ?? null} light={light} compact={compact} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
function OverviewBoard({
  factories,
  configs,
  onPick,
}: {
  factories: PphFactory[];
  configs: FactoryConfig[];
  onPick: (id: string) => void;
}) {
  const allLeaves = useMemo(() => factories.flatMap((f) => f.leaves), [factories]);
  const groupRoll = rollup(allLeaves);

  const tiles = [
    { key: '__all__', name: 'PPH Tổ hợp', roll: groupRoll, target: DEFAULT_TARGET_PPH, clickable: false },
    ...factories.map((f) => ({
      key: f.id,
      name: `PPH ${f.name}`,
      roll: rollup(f.leaves),
      target: configs.find((c) => c.factoryId === f.id)?.targetPphPct ?? DEFAULT_TARGET_PPH,
      clickable: true,
    })),
  ];

  return (
    <>
      {/* Hàng 1 — 5 ô PPH, SỐ TO */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => {
          const tone = toneFor(t.roll.pct, t.target);
          const Tag = t.clickable ? 'button' : 'div';
          return (
            <Tag
              key={t.key}
              {...(t.clickable ? { type: 'button' as const, onClick: () => onPick(t.key) } : {})}
              className={`flex flex-col gap-1.5 rounded-2xl border p-3.5 text-left transition ${TONE[tone].chipBorder} ${
                t.key === '__all__' ? 'bg-cyan-500/10' : `${TONE[tone].chipBg} ${t.clickable ? 'hover:brightness-125' : ''}`
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs font-black uppercase tracking-wide text-slate-300">{t.name}</span>
                <Gauge pct={t.roll.pct} size={44} tone={tone} hideText />
              </div>
              <div className={`text-[2.5rem] font-black leading-none tabular-nums sm:text-5xl ${TONE[tone].text}`}>
                {t.roll.pct == null ? '—' : `${Math.round(t.roll.pct)}%`}
              </div>
              <div className="text-xs font-bold text-slate-400">
                {fmtInt(t.roll.actual)} / {fmtInt(t.roll.fullTarget)} đôi
              </div>
              {t.clickable && <div className="text-[10px] font-bold text-cyan-400">Bấm xem chi tiết ›</div>}
            </Tag>
          );
        })}
      </div>

      {/* Hàng 2 — tóm tắt từng nhà máy */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {factories.map((f) => {
          const r = rollup(f.leaves);
          const target = configs.find((c) => c.factoryId === f.id)?.targetPphPct ?? DEFAULT_TARGET_PPH;
          const tone = toneFor(r.pct, target);
          return (
            <Panel key={f.id} title={f.name} right={<span className="text-[11px] font-bold text-slate-400">{f.leaves.length} điểm quét</span>}>
              <div className="grid grid-cols-2 gap-2">
                <StatBox label="Mục tiêu SL" value={fmtInt(r.fullTarget)} />
                <StatBox label="Thực hiện" value={fmtInt(r.actual)} tone={tone} />
              </div>
              <div className="mt-2.5 space-y-1">
                <ProgressBar pct={r.fullPct} tone={tone} />
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400">{r.fullPct == null ? '—' : `${r.fullPct}%`} kế hoạch ngày</span>
                  <span className="text-amber-300">Còn {fmtInt(r.remaining)} đôi</span>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Hàng 3 — biểu đồ giờ toàn tổ hợp */}
      <Panel
        title="Sản lượng theo giờ — Toàn Tổ hợp"
        right={
          <span className="flex flex-wrap items-center gap-x-3 text-xs font-bold">
            <span className="text-amber-300">MT/giờ {fmtInt(groupRoll.perHourTargetSum)}</span>
            <span className="text-white">
              {fmtInt(groupRoll.actual)} / {fmtInt(groupRoll.fullTarget)} đôi
            </span>
          </span>
        }
      >
        <HourlyChart leaves={allLeaves} height={200} />
      </Panel>

      {/* Hàng 4 — lưới tổ toàn tổ hợp (full, nhiều tổ nên để rộng) */}
      <Panel title="Tình trạng đạt chỉ tiêu">
        <ToStatusGrid leaves={allLeaves} target={DEFAULT_TARGET_PPH} wide />
      </Panel>

      {/* Hàng 5 — Top Lỗi + Top Giải pháp (biểu đồ tròn). Gộp cả Tổ hợp thành 1 nhóm duy nhất
          (KHÔNG tách theo Xưởng ở cấp này — chỉ tách ở cấp Nhà máy, xem FactoryBoard) nên
          TopLoiGiaiPhapPanels tự hiện lại đúng bản gốc, 1 biểu đồ to. */}
      <TopLoiGiaiPhapPanels areas={[{ id: '__all__', name: 'Toàn tổ hợp', leaves: allLeaves }]} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Popup: các khung giờ hụt chỉ tiêu của 1 điểm quét — nguyên nhân + giải pháp DO USER NHẬP ở form quét.
function ShortfallModal({ leaf, target = DEFAULT_TARGET_PPH, onClose }: { leaf: PphLeaf; target?: number; onClose: () => void }) {
  const filledSlots = leaf.slots.filter((s) => s.filled);
  const reasonRows = leaf.slots.filter((s) => s.filled && (s.shortfallReason || s.shortfallSolution || s.shortfallCauseGroup));
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-cyan-500/30 bg-[#0d2136] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-base font-black text-white">{leaf.name}</h4>
            <p className="truncate text-[11px] text-slate-400">{leaf.path}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
          >
            Đóng
          </button>
        </div>

        <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-cyan-300">Sản lượng theo từng giờ</p>
        {filledSlots.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-400">Điểm quét này chưa nhập giờ nào.</p>
        ) : (
          <div className="mb-3 overflow-x-auto rounded-xl border border-cyan-500/15">
            <table className="w-full min-w-[280px] border-collapse text-center">
              <thead>
                <tr className="bg-[#0a1a2f]/60">
                  <th className="p-1.5 text-left text-[10px] font-black uppercase tracking-wide text-slate-400">Giờ</th>
                  <th className="p-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">SL</th>
                  <th className="p-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Mục tiêu</th>
                  <th className="p-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">%PPH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {filledSlots.map((s, i) => {
                  const tgt = leaf.perHourTarget;
                  const pct = s.actualQty != null && tgt > 0 ? round1((s.actualQty / tgt) * 100) : null;
                  const tone: Tone = pct == null ? 'none' : toneFor(pct, target);
                  return (
                    <tr key={i}>
                      <td className="p-1.5 text-left text-xs font-bold text-cyan-100">{s.slot}</td>
                      <td className="p-1.5 text-xs font-bold text-white">{s.actualQty == null ? '—' : fmtInt(s.actualQty)}</td>
                      <td className="p-1.5 text-xs text-slate-400">{fmtInt(tgt)}</td>
                      <td className="p-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-black ${TONE[tone].chipBg} ${TONE[tone].text}`}>
                          {pct == null ? '—' : `${Math.round(pct)}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-cyan-300">Nguyên nhân &amp; giải pháp</p>
        {reasonRows.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-400">Chưa có khung giờ nào được nhập nguyên nhân / giải pháp.</p>
        ) : (
          <div className="space-y-2">
            {reasonRows.map((s, i) => {
              const tgt = leaf.perHourTarget;
              const under = s.actualQty != null && tgt > 0 && s.actualQty < tgt;
              return (
                <div key={i} className={`rounded-xl border p-2.5 ${under ? 'border-rose-400/30 bg-rose-500/5' : 'border-cyan-500/15 bg-[#0a1a2f]/50'}`}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold">
                    <span className="text-cyan-100">{s.slot}</span>
                    <span className={under ? 'text-rose-300' : 'text-slate-300'}>
                      SL {s.actualQty == null ? '—' : fmtInt(s.actualQty)} / MT {fmtInt(tgt)}
                    </span>
                  </div>
                  {s.shortfallReason && (
                    <p className="text-xs text-slate-200">
                      <span className="font-bold text-rose-300">Nguyên nhân:</span> {s.shortfallReason}
                    </p>
                  )}
                  {s.shortfallSolution && (
                    <p className="text-xs text-slate-200">
                      <span className="font-bold text-emerald-300">Giải pháp:</span> {s.shortfallSolution}
                    </p>
                  )}
                  {s.submittedBy && <p className="mt-0.5 text-[10px] text-slate-500">Người nhập: {s.submittedBy}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ToStatusGrid({
  leaves,
  target,
  wide = false,
  light = false,
  tableView = false,
}: {
  leaves: PphLeaf[];
  target: number;
  wide?: boolean;
  light?: boolean;
  tableView?: boolean;
}) {
  const [openLeaf, setOpenLeaf] = useState<PphLeaf | null>(null);
  const t = light ? TONE_LIGHT : TONE;
  const bandColors = light ? BAND_LIGHT : BAND_DARK;
  const cells = leaves.map((l) => {
    const pct = l.cumulativeTarget > 0 ? round1((l.cumulativeActual / l.cumulativeTarget) * 100) : null;
    // SL (sản lượng luỹ kế thật) đi kèm PPH — cùng điều kiện "chưa có chỉ tiêu -> chưa có gì" với
    // pct, để 1 ô không bị lệch kiểu "SL 0 / PPH —" gây hiểu nhầm là đã bắt đầu quét.
    const actual = l.cumulativeTarget > 0 ? l.cumulativeActual : null;
    return { leaf: l, id: l.id, name: l.name, pct, actual, tone: toneFor(pct, target) };
  });
  const met = cells.filter((c) => c.tone === 'ok').length;
  const active = cells.filter((c) => c.pct != null).length;

  // Cấp Line (tableView=true, ĐỘC LẬP với light — cấp Line vẫn nền tối như cấp 1/2) đổi hẳn sang
  // bảng ngang (hàng = chỉ số, cột = Tổ) giống bảng mẫu Excel người dùng gửi, thay cho lưới ô màu
  // đang dùng ở Tổng quan/Nhà máy (wide, giữ nguyên).
  if (tableView) {
    return (
      <>
        {/* overflow-hidden ở khung NGOÀI (không phải overflow-x-auto như trước) để góc bo tròn
            LUÔN cắt gọn nội dung — trước đây chỉ overflow-x-auto, dòng cuối "% đạt PPH" có nền màu
            (pill) đôi khi chớm tràn qua góc bo tròn dưới đáy khung. Cuộn ngang chuyển vào khung
            TRONG (overflow-x-auto riêng), không ảnh hưởng phần cắt góc của khung ngoài. */}
        <div className={`overflow-hidden rounded-xl border ${light ? 'border-gray-100' : 'border-cyan-500/15'}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-center">
            <thead>
              <tr className={light ? 'bg-gray-100' : 'bg-[#0a1a2f]/60'}>
                <th className={`p-2 text-left text-sm font-black uppercase tracking-wide ${light ? 'text-gray-600' : 'text-slate-400'}`}>Chỉ số</th>
                {cells.map((c) => (
                  <th key={c.id} className={`p-2 text-base font-black uppercase tracking-wide ${light ? 'text-tbs-dark' : 'text-slate-300'}`}>
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${light ? 'divide-gray-100' : 'divide-cyan-500/10'}`}>
              <tr>
                <td className={`p-2 text-left text-sm font-bold ${light ? 'text-gray-600' : 'text-slate-400'}`}>SL lũy kế thực hiện</td>
                {cells.map((c) => (
                  <td key={c.id} className={`p-2 text-3xl font-black ${light ? 'text-tbs-dark' : 'text-white'}`}>
                    {c.actual == null ? '—' : fmtInt(c.actual)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className={`p-2 text-left text-sm font-bold ${light ? 'text-gray-600' : 'text-slate-400'}`}>% đạt PPH</td>
                {cells.map((c) => {
                  const band = bandFor(c.pct);
                  const cellCls = `rounded px-3 py-2 text-xl font-black ${bandColors[band].chipBg} ${bandColors[band].text}`;
                  return (
                    <td key={c.id} className="p-2">
                      {/* MỌI ô đều bấm được (không chỉ vàng/đỏ như trước) — xem thêm số liệu từng
                          giờ của Tổ đó, không chỉ riêng lý do hụt. */}
                      <button type="button" onClick={() => setOpenLeaf(c.leaf)} className={`${cellCls} cursor-pointer hover:brightness-95`}>
                        {c.pct == null ? '—' : `${Math.round(c.pct)}%`}
                      </button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        </div>
        {openLeaf && <ShortfallModal leaf={openLeaf} target={target} onClose={() => setOpenLeaf(null)} />}
      </>
    );
  }

  return (
    <>
      <p className="mb-2 text-[11px] font-bold text-slate-400">
        {met}/{active || leaves.length} đạt · <span className="text-emerald-300">xanh = đạt</span> ·{' '}
        <span className="text-amber-300">vàng = gần đạt</span> · <span className="text-rose-300">đỏ = chưa đạt</span> — bấm vào 1 ô để xem
        số liệu từng giờ
      </p>
      <div
        className={`grid gap-1.5 ${
          wide ? 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 2xl:grid-cols-10' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5'
        }`}
      >
        {cells.map((c) => {
          // MỌI ô đều bấm được (không chỉ vàng/đỏ như trước) — xem thêm số liệu từng giờ của Tổ
          // đó, không chỉ riêng lý do hụt.
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setOpenLeaf(c.leaf)}
              className={`cursor-pointer rounded-lg border px-1.5 py-1.5 text-center hover:brightness-125 ${t[c.tone].chipBg} ${t[c.tone].chipBorder}`}
            >
              <div className="truncate text-[10px] font-bold text-slate-300">{c.name}</div>
              <div className="mt-0.5 flex items-stretch">
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-[8px] font-semibold uppercase text-slate-500">SL</div>
                  <div className="truncate text-xs font-black leading-tight text-slate-200">{c.actual == null ? '—' : c.actual}</div>
                </div>
                <div className="min-w-0 flex-1 border-l border-white/10 pl-1 text-left">
                  <div className="text-[8px] font-semibold uppercase text-slate-500">PPH</div>
                  <div className={`truncate text-xs font-black leading-tight ${t[c.tone].text}`}>
                    {c.pct == null ? '—' : `${Math.round(c.pct)}%`}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {openLeaf && <ShortfallModal leaf={openLeaf} target={target} onClose={() => setOpenLeaf(null)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
export function FactoryBoard({
  factory,
  lines,
  configs,
  onPickLine,
  light = false,
  tv = false,
}: {
  factory: PphFactory;
  lines: DashLine[];
  configs: FactoryConfig[];
  onPickLine: (sel: LineSel) => void;
  // Trang chiếu TV RIÊNG 1 Nhà máy (PphViewFactoryClient.tsx) — xem AreaPanel/Panel.
  light?: boolean;
  tv?: boolean;
}) {
  const cfg = configs.find((c) => c.factoryId === factory.id);
  const targetPph = cfg?.targetPphPct ?? DEFAULT_TARGET_PPH;

  const areas = useMemo(() => {
    const m = new Map<string, { id: string; name: string; leaves: PphLeaf[] }>();
    for (const l of factory.leaves) {
      // Dữ liệu cache cũ có thể thiếu areaId — suy tạm từ path ("Nhà máy › Xưởng › ...").
      const aid = l.areaId || `path:${(l.path || '').split('›')[1]?.trim() || '—'}`;
      const aname = l.areaName || (l.path || '').split('›')[1]?.trim() || 'Chưa phân xưởng';
      const cur = m.get(aid) || { id: aid, name: aname, leaves: [] };
      cur.leaves.push(l);
      m.set(aid, cur);
    }
    return [...m.values()];
  }, [factory]);

  // Điểm quét ĐÃ hiện riêng ở khối Line phía trên (Line chỉ gộp ĐÚNG 1 điểm quét — xem AreaPanel,
  // VD Gò mỗi Chuyền tự thành 1 Line) thì KHÔNG hiện lại ở bảng "Tình trạng các tổ sản xuất" bên
  // dưới nữa, tránh trùng lặp y hệt số liệu — Line NHIỀU điểm quét (VD MAY, mỗi Line gộp 5 Tổ) vẫn
  // hiện đủ TỪNG điểm quét ở đây bình thường, vì khối Line phía trên chỉ gộp số TỔNG, không thấy
  // chi tiết riêng từng Tổ như bảng này.
  const singleLeafLineIds = useMemo(() => {
    const s = new Set<string>();
    for (const l of lines) {
      if (l.leafIds.length === 1) s.add(l.leafIds[0]);
    }
    return s;
  }, [lines]);
  const statusLeaves = useMemo(
    () => factory.leaves.filter((l) => !singleLeafLineIds.has(l.id)),
    [factory.leaves, singleLeafLineIds],
  );

  // 3 Xưởng NẰM NGANG 1 HÀNG cho dễ nhìn (như ảnh mẫu). 4+ Xưởng thì tối đa 3 cột rồi xuống dòng.
  const areaCols =
    areas.length <= 1
      ? ''
      : areas.length === 2
        ? 'md:grid-cols-2'
        : areas.length === 3
          ? 'lg:grid-cols-3'
          : 'md:grid-cols-2 xl:grid-cols-3';

  return (
    <>
      <div className={`grid gap-3 ${areaCols}`}>
        {areas.map((a) => (
          <AreaPanel key={a.id} area={a} lines={lines} targetPph={targetPph} onPickLine={onPickLine} light={light} tv={tv} />
        ))}
      </div>

      {/* Hàng dưới — lưới tổ (rộng) + Top Lỗi / Top Giải pháp (gọn) chung 1 hàng như ảnh mẫu — ẨN
          hẳn trên TV (khớp đúng cách LineBoard đã bỏ "Tình trạng các tổ" cho TV cấp Line) để vừa 1
          màn hình không cần cuộn, TV thật không ai cuộn được. */}
      {!tv && (
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel light={light} title={`Tình trạng các tổ sản xuất (${statusLeaves.length} điểm quét)`}>
            <ToStatusGrid leaves={statusLeaves} target={targetPph} light={light} />
          </Panel>
          <TopLoiGiaiPhapPanels areas={areas} light={light} />
        </div>
      )}
    </>
  );
}

// Copy link xem RIÊNG 1 Line (không cần đăng nhập, dùng chiếu TV cố định tại chuyền) — mã Line
// qua query string ?lineId=... (KHÔNG dùng path segment /pph-view/[lineId]: site build static
// export, không thể sinh sẵn trang cho mọi Line lúc build vì Line có thể thêm mới sau khi deploy),
// tách hẳn khỏi /work (xem route pph-view + ghi chú RequireAuth).
// Ưu tiên link RÚT GỌN (/tv/<mã>, tra ở backend ra đúng lineId — xem /api/pph/tv-short-link) cho
// dễ gõ tay trên đầu thu TV; lỡ mất mạng/lỗi server thì fallback về link dài như trước (không để
// người dùng tay không chỉ vì 1 lượt gọi API thất bại — link dài luôn hoạt động song song).
async function copyTvLink(lineId: string) {
  const longUrl = `${window.location.origin}/pph-view?lineId=${lineId}`;
  try {
    const res = await fetch('/api/pph/tv-short-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineId }),
    }).then((r) => r.json());
    if (res?.success && res.code) {
      const shortUrl = `${window.location.origin}/tv/${res.code}`;
      await navigator.clipboard.writeText(shortUrl);
      alert(`Đã sao chép link TV (rút gọn):\n${shortUrl}`);
      return;
    }
  } catch {
    // Rơi xuống fallback link dài bên dưới.
  }
  navigator.clipboard
    .writeText(longUrl)
    .then(() => alert(`Đã sao chép link TV:\n${longUrl}`))
    .catch(() => alert(`Không sao chép được — link TV: ${longUrl}`));
}

// Giống hệt copyTvLink() ở trên nhưng cho CẢ 1 Nhà máy (PphViewFactoryClient.tsx) — nút "📺 Lấy
// link TV" ở đầu trang khi đang xem cấp Nhà máy (xem chỗ gọi trong component chính bên dưới).
async function copyTvLinkFactory(factoryId: string) {
  const longUrl = `${window.location.origin}/pph-view-factory?factoryId=${factoryId}`;
  try {
    const res = await fetch('/api/pph/tv-short-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factoryId }),
    }).then((r) => r.json());
    if (res?.success && res.code) {
      const shortUrl = `${window.location.origin}/tv/${res.code}`;
      await navigator.clipboard.writeText(shortUrl);
      alert(`Đã sao chép link TV Nhà máy (rút gọn):\n${shortUrl}`);
      return;
    }
  } catch {
    // Rơi xuống fallback link dài bên dưới.
  }
  navigator.clipboard
    .writeText(longUrl)
    .then(() => alert(`Đã sao chép link TV Nhà máy:\n${longUrl}`))
    .catch(() => alert(`Không sao chép được — link TV: ${longUrl}`));
}

// Giống hệt copyTvLinkFactory() nhưng gộp CẢ 1 XƯỞNG (PphViewWorkshopClient.tsx) — icon "📺" mới ở
// góc ô "% Sản lượng" (xem AreaPanel bên dưới), CHỈ hiện cho Xưởng tên "Gò" theo đúng phạm vi đã
// chốt — Xưởng khác (May, Đầu vào...) không đổi gì, vẫn xem từng Line riêng như cũ.
async function copyTvLinkWorkshop(areaId: string) {
  const longUrl = `${window.location.origin}/pph-view-workshop?areaId=${areaId}`;
  try {
    const res = await fetch('/api/pph/tv-short-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaId }),
    }).then((r) => r.json());
    if (res?.success && res.code) {
      const shortUrl = `${window.location.origin}/tv/${res.code}`;
      await navigator.clipboard.writeText(shortUrl);
      alert(`Đã sao chép link TV gộp Xưởng (rút gọn):\n${shortUrl}`);
      return;
    }
  } catch {
    // Rơi xuống fallback link dài bên dưới.
  }
  navigator.clipboard
    .writeText(longUrl)
    .then(() => alert(`Đã sao chép link TV gộp Xưởng:\n${longUrl}`))
    .catch(() => alert(`Không sao chép được — link TV: ${longUrl}`));
}

function AreaPanel({
  area,
  lines,
  targetPph,
  onPickLine,
  light = false,
  tv = false,
}: {
  area: { id: string; name: string; leaves: PphLeaf[] };
  lines: DashLine[];
  targetPph: number;
  onPickLine: (sel: LineSel) => void;
  // Trang chiếu TV RIÊNG 1 Nhà máy (PphViewFactoryClient) — y hệt cách LineBoard/TeamPanel đã làm
  // cho TV cấp Line: chữ to hơn, bỏ bo góc, bỏ hẳn mọi nút bấm/điều hướng (TV không ai chạm vào).
  light?: boolean;
  tv?: boolean;
}) {
  const r = rollup(area.leaves);
  const tone = toneFor(r.pct, targetPph);
  const toneColors = light ? TONE_LIGHT : TONE;
  const lineGroups = useMemo(() => areaToLines(area.id, area.leaves, lines), [area.id, area.leaves, lines]);
  // Có cấu hình Line ở Cài Đặt → LUÔN hiện (kể cả 1 Line). Chưa cấu hình → hiện khi Xưởng có ≥ 2 tổ.
  const configuredForArea = useMemo(() => lines.some((l) => l.areaId === area.id), [lines, area.id]);
  const showLines = configuredForArea || lineGroups.length >= 2;
  const mtPerHour = r.perHourTargetSum;
  const singlePoint = area.leaves.length === 1;

  return (
    <Panel
      light={light}
      tv={tv}
      title={
        <span className="flex items-center gap-2">
          {!light && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
          {area.name}
        </span>
      }
      right={
        !tv && singlePoint ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyTvLink(area.leaves[0].id);
              }}
              title="Sao chép link TV (xem riêng, không cần đăng nhập)"
              className={`rounded-lg border p-1 ${light ? 'border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'}`}
            >
              <IconDeviceTv size={14} />
            </button>
            <button
              type="button"
              onClick={() => onPickLine({ areaName: area.name, name: area.name, leafIds: [area.leaves[0].id] })}
              className={`rounded-lg border px-2 py-1 text-[11px] font-bold ${light ? 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'}`}
            >
              Chi tiết ›
            </button>
          </div>
        ) : undefined
      }
    >
      {/* Hàng đầu — 2 card ghép đôi (Chỉ tiêu | Thực hiện) + vòng % Sản lượng, như ảnh mẫu */}
      <div className="flex items-stretch gap-2">
        <div className="grid flex-1 grid-cols-2 gap-2">
          <PairCard
            leftLabel="Target PPH"
            leftValue={`${targetPph}%`}
            rightLabel="Thực hiện"
            rightValue={r.pct == null ? '—' : `${r.pct}%`}
            tone={tone}
            light={light}
            tv={tv}
          />
          <PairCard
            leftLabel="Target sản lượng"
            leftValue={fmtInt(r.fullTarget)}
            rightLabel="Thực hiện"
            rightValue={fmtInt(r.actual)}
            tone={tone}
            light={light}
            tv={tv}
          />
        </div>
        <div
          className={`relative flex shrink-0 flex-col items-center justify-center border px-3 ${tv ? '' : 'rounded-xl'} ${light ? 'border-gray-200 bg-gray-50' : 'border-cyan-500/20 bg-cyan-500/5'}`}
        >
          {/* Icon lấy link TV GỘP cả Xưởng — CHỈ Gò (5 Chuyền độc lập không Tổ con, gộp quan sát 1
              màn hình theo yêu cầu riêng, KHÔNG áp dụng Xưởng khác) — đặt góc phải-trên đè lên ô
              gauge, không chiếm thêm chỗ trong layout. */}
          {!tv && area.name === 'Gò' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyTvLinkWorkshop(area.id);
              }}
              title="Lấy link TV gộp cả Xưởng (xem riêng, không cần đăng nhập)"
              className={`absolute -right-1.5 -top-1.5 rounded-full border p-1 ${light ? 'border-gray-200 bg-white text-gray-500 hover:bg-gray-100' : 'border-cyan-500/30 bg-[#0a1a2f] text-cyan-200 hover:bg-cyan-500/20'}`}
            >
              <IconDeviceTv size={12} />
            </button>
          )}
          <Gauge pct={r.pct} size={tv ? 84 : 66} tone={tone} light={light} />
          <span className={`-mt-0.5 font-black uppercase tracking-wide ${tv ? 'text-xs' : 'text-[8px]'} ${light ? 'text-gray-500' : 'text-slate-400'}`}>
            % Sản lượng
          </span>
        </div>
      </div>

      {/* Hàng Line — cấu hình ở trang Cài Đặt, hiện trực tiếp lên đây. Xưởng chưa chia Line thì chừa
          khoảng trống VÔ HÌNH (không viền, không chữ) để biểu đồ 3 Xưởng vẫn thẳng hàng nhau. TV
          không cho bấm (dùng div thay button, bỏ hẳn nút sao chép link — đang Ở TRÊN TV rồi). */}
      <div className="mt-2.5 min-h-[4.25rem]">
        {showLines && (
          <div className="grid w-full grid-cols-3 gap-1.5 sm:grid-cols-5">
            {lineGroups.map((lg, i) => {
              const lr = rollup(lg.leaves);
              const lt = toneFor(lr.pct, targetPph);
              const cardCls = `w-full border px-2 py-1.5 text-center ${tv ? '' : 'rounded-lg transition hover:brightness-125'} ${toneColors[lt].chipBg} ${toneColors[lt].chipBorder}`;
              const inner = (
                <>
                  <div className={`truncate font-black uppercase tracking-wide ${tv ? 'text-xs' : 'text-[10px]'} ${light ? 'text-gray-500' : 'text-slate-300'}`}>
                    {lg.name}
                  </div>
                  <div className={`font-black ${tv ? 'text-2xl' : 'text-base'} ${toneColors[lt].text}`}>{lr.pct == null ? '—' : `${Math.round(lr.pct)}%`}</div>
                  <div className={`font-semibold ${tv ? 'text-xs' : 'text-[10px]'} ${light ? 'text-gray-500' : 'text-slate-400'}`}>
                    {fmtInt(lr.actual)} / {fmtInt(lr.fullTarget)}
                  </div>
                </>
              );
              return (
                <div key={`${lg.name}-${i}`} className="relative">
                  {tv ? (
                    <div className={cardCls}>{inner}</div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPickLine({ areaName: area.name, name: lg.name, leafIds: lg.leaves.map((l) => l.id) })}
                      className={cardCls}
                    >
                      {inner}
                    </button>
                  )}
                  {/* Sao chép link TV riêng của Line này — KHÔNG trigger chọn xem (stopPropagation),
                      đặt góc trên-phải đè lên thẻ chính, không chiếm thêm chỗ trong lưới. ẨN riêng
                      cho Xưởng Gò — đã có icon TV GỘP cả Xưởng ở ô "% Sản lượng" phía trên (xem
                      copyTvLinkWorkshop), giữ thêm icon riêng từng Line ở đây dễ gây nhầm quay lại
                      dùng 5 link rời rạc cũ theo đúng điều không muốn nữa. */}
                  {!tv && area.name !== 'Gò' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyTvLink(lg.id);
                      }}
                      title="Sao chép link TV (xem riêng, không cần đăng nhập)"
                      className="absolute right-0.5 top-0.5 rounded bg-slate-900/60 p-0.5 text-slate-300 hover:bg-slate-900/90 hover:text-cyan-300"
                    >
                      <IconDeviceTv size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Biểu đồ giờ + lũy kế NẰM CẠNH NHAU (như ảnh mẫu) — min-w-0 trên CẢ 2 cột để nội dung
          (số/chữ dài khi có dữ liệu thật) co lại đúng khổ cột thay vì đẩy tràn ra ngoài panel. Cột
          lũy kế TV rộng hơn (190px thay 104px) khớp đúng cách LineBoard đã làm — chữ to hơn cần
          nhiều chỗ hơn. Tailwind cần thấy TRỌN VẸN từng chuỗi class ngay trong mã nguồn (không ghép
          chuỗi động), nên viết đủ 2 nhánh tv/không tv riêng biệt thay vì nội suy biến số. */}
      <div className={`mt-2.5 grid min-w-0 gap-2 ${tv ? 'lg:grid-cols-[1fr_190px]' : 'lg:grid-cols-[1fr_104px]'}`}>
        <div
          className={`min-w-0 overflow-hidden border p-2.5 ${tv ? '' : 'rounded-xl'} ${light ? 'border-gray-100 bg-gray-50' : 'border-cyan-500/15 bg-[#0a1a2f]/60'}`}
        >
          <div className={`mb-1 flex items-center justify-between font-bold ${tv ? 'text-sm' : 'text-[11px]'}`}>
            <span className={light ? 'text-tbs-dark' : 'text-cyan-100'}>Sản lượng theo giờ</span>
            <span className={light ? 'text-amber-600' : 'text-amber-300'}>MT/giờ {fmtInt(mtPerHour)}</span>
          </div>
          <HourlyChart leaves={area.leaves} height={tv ? 120 : 116} light={light} tv={tv} />
        </div>
        <div
          className={`flex min-w-0 flex-col justify-center overflow-hidden border ${tv ? 'p-2' : 'p-1.5'} ${tv ? '' : 'rounded-xl'} text-center ${light ? 'border-gray-100 bg-gray-50' : 'border-cyan-500/15 bg-[#0a1a2f]/60'}`}
        >
          <div className={`truncate font-black uppercase tracking-wide ${tv ? 'text-xs' : 'text-[9px]'} ${light ? 'text-gray-500' : 'text-slate-400'}`}>
            Sản lượng lũy kế
          </div>
          <div className={`truncate font-black leading-tight ${tv ? 'text-4xl' : 'text-xl'} ${light ? 'text-tbs-dark' : 'text-white'}`}>{fmtInt(r.actual)}</div>
          <div className={`truncate font-semibold ${tv ? 'text-sm' : 'text-[10px]'} ${light ? 'text-gray-600' : 'text-slate-400'}`}>/ {fmtInt(r.fullTarget)} đôi</div>
          <div className="mt-1.5">
            <ProgressBar pct={r.fullPct} tone={tone} light={light} />
          </div>
          <div className={`mt-1.5 leading-none ${light ? 'text-gray-500' : 'text-slate-400'} ${tv ? 'text-[11px] font-bold' : 'text-[10px] font-bold'}`}>Còn lại</div>
          <div className={`truncate font-black leading-tight ${tv ? 'text-2xl' : 'text-base'} ${light ? 'text-amber-600' : 'text-amber-300'}`}>
            {fmtInt(r.remaining)} đôi
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// TRANG RIÊNG CỦA 1 LINE — bấm 1 ô Line ở trang Nhà máy thì vào đây. Thiết kế tương tự trang Nhà
// máy nhưng 1 cấp xuống: mỗi Tổ trong Line là 1 panel riêng. Line chỉ có 1 điểm quét (VD Chuyền ở
// Gò) → hiện chi tiết đúng điểm quét đó (kèm bảng 8 khung giờ).
// `sel` không còn dùng trong thân hàm (tiêu đề Line giờ hiện ở header ngoài cùng của trang, xem
// nhánh factory && lineSel ở component cha) — vẫn giữ trong type vì component cha vẫn truyền vào.
// Thẻ Tổ hiện GIẢM DẦN theo số Tổ (VD 30, 29, 28...) — chỉ đổi thứ tự HIỂN THỊ ở lưới "Chi tiết
// các tổ sản xuất" cấp Line (rollup/HourlyChart phía trên KHÔNG dùng hàm này, thứ tự cộng dồn
// không quan trọng). Tên Tổ luôn dạng "Tổ {số}" (khảo sát thật trong DB, không có ngoại lệ) nên
// tách số cuối cùng ra so sánh; leaf hiếm gặp không có số cuối thì giữ nguyên vị trí tương đối
// (đẩy xuống cuối, không random) để không vỡ layout nếu phát sinh dữ liệu lạ.
function sortLeavesTeamDesc(leaves: PphLeaf[]): PphLeaf[] {
  const numOf = (name: string) => {
    const m = name.match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : null;
  };
  return [...leaves].sort((a, b) => {
    const na = numOf(a.name);
    const nb = numOf(b.name);
    if (na != null && nb != null) return nb - na;
    if (na != null) return -1;
    if (nb != null) return 1;
    return 0;
  });
}

export function LineBoard({
  sel,
  leaves,
  targetPph,
  light = false,
  tv = false,
  alertOverdue = false,
  audioUnlocked = false,
}: {
  sel: LineSel;
  leaves: PphLeaf[];
  targetPph: number;
  light?: boolean;
  // Trang chiếu TV RIÊNG 1 Line (PphViewClient) — hàng chỉ số nén gọn CHIỀU CAO + bỏ bo góc (số
  // vẫn to, dễ đọc từ xa) để "Tình trạng các tổ" phía dưới vừa lọt 1 màn hình không cần cuộn (TV
  // không ai cuộn được) — xem cơ chế co giãn theo CẢ chiều cao lẫn chiều ngang ở PphViewClient.tsx.
  tv?: boolean;
  // Chớp đỏ thẻ Tổ nào ĐANG trễ nhập (xem TeamPanel) — CHỈ PphViewClient bật, trang thường không
  // truyền prop này (mặc định false) theo đúng phạm vi đã chốt "ở link màn hình TV".
  alertOverdue?: boolean;
  // Đã bấm icon loa mở khoá âm thanh chưa (icon + xử lý bấm nằm ở PphViewClient.tsx, bên cạnh ô
  // ngày giờ trên header — component này chỉ ĐỌC trạng thái để quyết có phát hay không).
  audioUnlocked?: boolean;
}) {
  const r = rollup(leaves);
  const tone = toneFor(r.pct, targetPph);
  const teamCards = useMemo(() => sortLeavesTeamDesc(leaves), [leaves]);

  // Nhắc TRỄ NHẬP bằng file ghi âm thật (xem PPH_ALERT_AUDIO_BASE ở trên) — CHỈ bật khi alertOverdue
  // (đúng phạm vi đã chốt "ở link màn hình TV cấp Line", xem PphViewClient), song song với chớp đỏ
  // đã có ở TeamPanel (âm thanh KHÔNG thay thế, chỉ nhắc thêm — chớp đỏ vẫn chạy độc lập dù mất âm
  // thanh). Trình duyệt CHẶN tự phát âm thanh CÓ TIẾNG trừ khi có 1 lượt bấm thật — TV không ai
  // đứng cạnh liên tục để cấu hình được `chrome://settings`/`edge://settings` (đã thử, không khả
  // thi vì màn hình treo cao/không remote được), nên đổi sang icon loa (icon + xử lý bấm nằm ở
  // PphViewClient.tsx, cạnh ô ngày giờ trên header — audioUnlocked truyền vào ĐÂY qua prop): ai bật
  // máy lên bấm 1 cái vào đó là nghe tiếng xác nhận NGAY. Nhược điểm: chỉ mở khoá cho ĐÚNG LẦN TẢI
  // TRANG này — tải lại trang (kể cả tự động khi có bản deploy mới) sẽ mất khoá, icon tự quay lại
  // trạng thái "tắt tiếng" để ai đó thấy mà bấm lại — giới hạn CỨNG của trình duyệt (không có cách
  // nào để 1 lượt bấm "nhớ" sang lượt tải trang sau, localStorage cũng không giúp được vì trình
  // duyệt xét user gesture THẬT của đúng lượt tải đó, không phải cờ do web tự đặt).
  const lastAnnouncedRef = useRef<Map<string, number>>(new Map());
  // Hàng chờ phát TUẦN TỰ — nhiều Tổ trễ cùng lúc phải đọc lần lượt, không chồng tiếng lên nhau.
  const audioQueueRef = useRef<{ id: string; name: string }[]>([]);
  const audioPlayingRef = useRef(false);
  const missingLeaves = useMemo(
    () => (alertOverdue ? leaves.filter((l) => l.entryStatus === 'missing') : []),
    [alertOverdue, leaves],
  );

  useEffect(() => {
    if (!alertOverdue || !audioUnlocked) return;
    const REPEAT_MS = 5 * 60 * 1000;

    // Phát 1 mục trong hàng chờ (file đã chứa sẵn nguyên câu, xem PPH_ALERT_AUDIO_BASE ở trên), xong
    // mới sang mục kế tiếp. Thiếu file (chưa thu tên đó) → onerror cũng coi như xong đoạn đó, tự bỏ
    // qua chứ không kẹt hàng chờ.
    const playQueue = () => {
      if (audioPlayingRef.current) return;
      const item = audioQueueRef.current.shift();
      if (!item) return;
      const url = pphAlertNameAudioFile(item.name);
      if (!url) {
        playQueue();
        return;
      }
      audioPlayingRef.current = true;
      const done = () => {
        audioPlayingRef.current = false;
        playQueue();
      };
      const a = new Audio(url);
      a.onended = done;
      a.onerror = done;
      a.play().catch(done);
    };

    const announce = () => {
      const now = Date.now();
      for (const leaf of missingLeaves) {
        const last = lastAnnouncedRef.current.get(leaf.id) || 0;
        if (now - last < REPEAT_MS) continue;
        lastAnnouncedRef.current.set(leaf.id, now);
        audioQueueRef.current.push({ id: leaf.id, name: leaf.name });
      }
      playQueue();
      // Tổ đã hết trễ (vừa nhập xong) → xoá khỏi bộ nhớ, để NẾU sau này lại trễ lần nữa (hiếm) thì
      // tính lại từ đầu, nhắc ngay thay vì phải chờ đủ 5 phút kể từ lần trễ TRƯỚC đó.
      const missingIds = new Set(missingLeaves.map((l) => l.id));
      for (const id of [...lastAnnouncedRef.current.keys()]) {
        if (!missingIds.has(id)) lastAnnouncedRef.current.delete(id);
      }
    };
    announce();
    const iv = setInterval(announce, 20_000);
    return () => clearInterval(iv);
  }, [alertOverdue, audioUnlocked, missingLeaves]);

  // Tỉ lệ 2 cột hàng chỉ số ĐÚNG BẰNG 2/5 : 3/5 (khớp lưới 5 thẻ Tổ bên dưới, xem "Chi tiết các tổ
  // sản xuất") — cột trái rộng bằng đúng 2 thẻ Tổ, cột phải (biểu đồ giờ + lũy kế) rộng bằng đúng 3
  // thẻ Tổ, để đường phân cách giữa 2 cột thẳng hàng với đường phân cách giữa thẻ Tổ thứ 2 và thứ 3.
  const topRow = (
    <div className={`grid ${tv ? 'gap-1' : 'gap-1.5'} lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-stretch`}>
      <div className={`flex flex-col justify-center ${tv ? 'gap-0.5' : 'gap-1'}`}>
        <div>
          {!tv && (
            <div className={`text-[9px] font-black uppercase tracking-wide ${light ? 'text-gray-500' : 'text-slate-400'}`}>
              Chỉ tiêu PPH &amp; thực hiện
            </div>
          )}
          <PairCard
            leftLabel="Target PPH"
            leftValue={`${targetPph}%`}
            rightLabel="Thực hiện PPH"
            rightValue={r.pct == null ? '—' : `${r.pct}%`}
            tone={tone}
            light={light}
            compact={!tv}
            tv={tv}
          />
        </div>
        <div>
          {!tv && (
            <div className={`text-[9px] font-black uppercase tracking-wide ${light ? 'text-gray-500' : 'text-slate-400'}`}>
              Chỉ tiêu sản lượng nổi bật
            </div>
          )}
          <PairCard
            leftLabel="Target sản lượng"
            leftValue={fmtInt(r.fullTarget)}
            rightLabel="Thực hiện sản lượng"
            rightValue={fmtInt(r.actual)}
            tone={tone}
            light={light}
            compact={!tv}
            tv={tv}
          />
        </div>
      </div>
      {/* Sản lượng theo giờ + lũy kế NẰM CẠNH NHAU — đúng khuôn cấp Nhà máy (xem AreaPanel),
          thay cho ô số tĩnh cũ để nhìn ra ngay giờ nào Line đang hụt chỉ tiêu. */}
      {/* Tailwind CẦN thấy trọn vẹn TỪNG chuỗi class arbitrary-value ngay trong mã nguồn để build ra
          đúng CSS — ghép chuỗi động kiểu `lg:grid-cols-[1fr_${w}px]` sẽ KHÔNG được nhận diện, mất
          hẳn class đó khi build thật (khác lúc chạy dev). Viết đủ 2 nhánh tv/không tv riêng biệt. */}
      <div className={`grid min-w-0 ${tv ? 'gap-1 lg:grid-cols-[1fr_190px]' : 'gap-2 lg:grid-cols-[1fr_130px]'}`}>
        <div className={`min-w-0 overflow-hidden border ${tv ? '' : 'rounded-xl'} p-2.5 ${light ? 'border-gray-100 bg-gray-50' : 'border-cyan-500/15 bg-[#0a1a2f]/60'}`}>
          <div className={`mb-1 flex items-center justify-between font-bold ${tv ? 'text-sm' : 'text-[11px]'}`}>
            <span className={light ? 'text-tbs-dark' : 'text-cyan-100'}>Sản lượng theo giờ</span>
            <span className={light ? 'text-amber-600' : 'text-amber-300'}>MT/giờ {fmtInt(r.perHourTargetSum)}</span>
          </div>
          <HourlyChart leaves={leaves} height={tv ? 90 : 116} light={light} tv={tv} />
        </div>
        <div
          className={`flex min-w-0 flex-col justify-center overflow-hidden border ${tv ? '' : 'rounded-xl'} ${tv ? 'p-2' : 'p-1.5'} text-center ${light ? 'border-gray-100 bg-gray-50' : 'border-cyan-500/15 bg-[#0a1a2f]/60'}`}
        >
          <div className={`truncate font-black uppercase tracking-wide ${tv ? 'text-xs' : 'text-[9px]'} ${light ? 'text-gray-500' : 'text-slate-400'}`}>Sản lượng lũy kế</div>
          <div className={`truncate font-black leading-tight ${tv ? 'text-4xl' : 'text-xl'} ${light ? 'text-tbs-dark' : 'text-white'}`}>{fmtInt(r.actual)}</div>
          <div className={`truncate font-semibold ${tv ? 'text-sm' : 'text-[10px]'} ${light ? 'text-gray-600' : 'text-slate-400'}`}>/ {fmtInt(r.fullTarget)} đôi</div>
          <div className="mt-1.5">
            <ProgressBar pct={r.fullPct} tone={tone} light={light} />
          </div>
          {/* "Còn lại" — số quan trọng nhất trong ô này (biết ngay còn thiếu bao nhiêu). Tách 2 dòng
              (nhãn riêng, số riêng) thay vì nhét chung 1 dòng — số được rảnh chỗ to hẳn lên mà
              không lo tràn ngang/bị "truncate" cắt mất, dù khung không quá rộng. */}
          <div className={`mt-1.5 leading-none ${light ? 'text-gray-500' : 'text-slate-400'} ${tv ? 'text-[11px] font-bold' : 'text-[9px] font-semibold'}`}>Còn lại</div>
          <div className={`truncate font-black leading-tight ${tv ? 'text-2xl' : 'text-base'} ${light ? 'text-amber-600' : 'text-amber-300'}`}>{fmtInt(r.remaining)} đôi</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Hàng chỉ số — không còn tiêu đề riêng (trước đây lặp lại "MAY › LINE 7 · N điểm quét",
          trùng với tiêu đề trang ở header ngoài cùng, xem dòng phụ "Bảng tiến độ..." đã gộp lên đó
          rồi) — giống đúng ảnh mẫu, khung chỉ số vào thẳng nội dung. Bản TV bỏ hẳn Panel (bo góc +
          đệm rộng) dùng khung vuông góc riêng, đệm mỏng hơn hẳn — tiết kiệm chiều cao. */}
      {tv ? (
        <div className={`border p-1.5 ${light ? 'border-gray-200 bg-white' : 'border-cyan-500/20 bg-[#0d2136]/80'}`}>{topRow}</div>
      ) : (
        <Panel light={light}>{topRow}</Panel>
      )}

      {/* Nhãn riêng cho khối thẻ Tổ — trước đây các thẻ hiện thẳng không có tiêu đề gì, thiếu hẳn
          dòng phân mục so với bảng mẫu Excel (có "CHI TIẾT CÁC TỔ SẢN XUẤT" rõ ràng). Line CHỈ 1
          điểm quét (VD Gò — mỗi Chuyền 1 Line riêng) TRƯỚC ĐÂY hiện bảng "Chi tiết 8 khung giờ"
          (SlotTable) thay vì thẻ Tổ — ĐÃ BỎ theo yêu cầu (ô số lớn nhìn xa dễ hơn hẳn bảng dày đặc
          chữ trên TV, đổi lại mất chi tiết nguyên nhân/giải pháp/người nhập từng khung giờ — chấp
          nhận đánh đổi này, xem lại ở /pph-scan nếu cần chi tiết đó) — giờ CHỈ 1 khuôn TeamPanel
          duy nhất cho mọi số lượng điểm quét, tự nhiên ra đúng 1 thẻ khi Line chỉ có 1 Tổ/Chuyền. */}
      <SectionLabel light={light}>Chi tiết các tổ sản xuất</SectionLabel>
      {/* Cố định 4 thẻ/hàng (khác trước — 3 thẻ/hàng làm Line nhiều Tổ quá cao, lúc phóng to
          phải thu nhỏ hết để vừa chiều cao, thừa khoảng trống 2 bên) — ít hàng hơn giúp cấp
          Line lấp đầy màn hình khi phóng to giống hệt cấp Tổng quan/Nhà máy. Bản TV giãn cách
          rộng hơn (gap-5 thay gap-3) — bỏ hẳn hàng "Tình trạng các tổ" bên dưới (trùng lặp,
          SLTH/% đạt đã có sẵn ngay trong từng thẻ) nên thẻ Tổ được rảnh hẳn chỗ, giãn cách rộng
          hơn cho đỡ dồn cụm, cùng lúc cơ chế co giãn tự tính lại tỉ lệ to hơn (bớt hẳn 1 khối
          nội dung, PphViewClient.tsx tự scale to hơn theo đúng chiều cao còn trống). */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 ${tv ? 'gap-5' : 'gap-3'}`}>
        {teamCards.map((l) => (
          <TeamPanel key={l.id} leaf={l} light={light} tv={tv} alertOverdue={alertOverdue} />
        ))}
      </div>
      {!tv && (
        <>
          <SectionLabel light={light}>{`Tình trạng các tổ (${leaves.length} điểm quét)`}</SectionLabel>
          <Panel light={light}>
            <ToStatusGrid leaves={teamCards} target={targetPph} light={light} tableView />
          </Panel>
        </>
      )}
    </>
  );
}

// 5 mức màu riêng cho các ô % ở khối kết quả (% Đạt / % PPH) — theo ĐÚNG thang người dùng chốt,
// khác hẳn thang 3 mức ok/warn/bad (Tone) đang dùng ở nơi khác trong file này: đỏ ≤85, cam
// (85-90), vàng [90-95), xanh [95-100], hồng >100 (vượt target vẫn tính tích cực, tô riêng màu
// hồng thay vì gộp chung màu xanh của "đạt đúng target").
type PctBand = 'red' | 'orange' | 'yellow' | 'green' | 'pink' | 'none';
function bandFor(pct: number | null | undefined): PctBand {
  if (pct == null || !Number.isFinite(pct)) return 'none';
  if (pct > 100) return 'pink';
  if (pct >= 95) return 'green';
  if (pct >= 90) return 'yellow';
  if (pct > 85) return 'orange';
  return 'red';
}
// Màu ĐẬM/BÃO HOÀ (không phải pastel nhạt như trước) — khớp đúng độ "nổi" của ảnh mẫu Excel, dễ
// đọc từ xa hơn hẳn trên màn hình lớn/TV xưởng sản xuất.
// Màu RỰC/THUẦN (hex thẳng theo đúng yêu cầu người dùng — "Đỏ #FF0000 / Vàng #FFD700 / Xanh lá
// nhạt #90EE90 / Hồng #FF55FF") thay cho tông Tailwind pastel/đậm trước đó — chữ trong ô nền SÁNG
// (Vàng, Cam, Xanh lá nhạt) đổi ĐEN đậm cho dễ đọc, ô nền TỐI (Đỏ, Hồng) giữ chữ trắng.
const BAND_LIGHT: Record<PctBand, { text: string; chipBg: string; chipBorder: string }> = {
  red: { text: 'text-white', chipBg: 'bg-[#FF0000]', chipBorder: 'border-black' },
  orange: { text: 'text-black', chipBg: 'bg-[#FFA500]', chipBorder: 'border-black' },
  yellow: { text: 'text-black', chipBg: 'bg-[#FFD700]', chipBorder: 'border-black' },
  green: { text: 'text-black', chipBg: 'bg-[#90EE90]', chipBorder: 'border-black' },
  pink: { text: 'text-white', chipBg: 'bg-[#FF55FF]', chipBorder: 'border-black' },
  none: { text: 'text-gray-400', chipBg: 'bg-gray-100', chipBorder: 'border-black' },
};
// Bản màu cho nền TỐI (cấp Line giờ đồng bộ nền tối với cấp Tổng quan/Nhà máy) — cùng 5 mức
// ngưỡng, chỉ đổi tông màu cho rõ trên nền tối (chữ sáng, nền mờ trong suốt) giống cách TONE/
// TONE_LIGHT đã tách ở trên.
const BAND_DARK: Record<PctBand, { text: string; chipBg: string; chipBorder: string }> = {
  red: { text: 'text-rose-300', chipBg: 'bg-rose-500/10', chipBorder: 'border-rose-400/40' },
  orange: { text: 'text-orange-300', chipBg: 'bg-orange-500/10', chipBorder: 'border-orange-400/40' },
  yellow: { text: 'text-amber-300', chipBg: 'bg-amber-500/10', chipBorder: 'border-amber-400/40' },
  green: { text: 'text-emerald-300', chipBg: 'bg-emerald-500/10', chipBorder: 'border-emerald-400/40' },
  pink: { text: 'text-pink-300', chipBg: 'bg-pink-500/10', chipBorder: 'border-pink-400/40' },
  none: { text: 'text-slate-400', chipBg: 'bg-slate-700/30', chipBorder: 'border-slate-600/40' },
};

// Ô chỉ số kiểu bảng Excel mẫu — nhãn phía trên (chữ nhỏ, viết hoa), khối màu chứa giá trị bên
// dưới. tone="plan" = khối xanh đậm (số liệu KẾ HOẠCH/mục tiêu, giống ảnh mẫu), tone=Tone (ok/
// warn/bad/none) = tô 3 mức cũ; `band` (nếu truyền) THẮNG tone — tô theo đúng 5 mức màu % ở trên,
// chỉ dùng cho 2 ô % Đạt/% PPH.
function RefStat({
  label,
  value,
  tone = 'plan',
  band,
  small = false,
  light = false,
  tv = false,
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'plan' | Tone;
  band?: PctBand;
  small?: boolean;
  light?: boolean;
  // Chữ/số to hơn hẳn khi chiếu TV (đứng xa mới đọc được) — chỉ có tác dụng khi light=true.
  tv?: boolean;
}) {
  const t = light ? TONE_LIGHT : TONE;
  const bandColors = light ? BAND_LIGHT : BAND_DARK;
  // Cấp Line (light) — phong cách "bảng biểu truyền thống" theo ĐÚNG ảnh mẫu thật: góc vuông
  // (không bo tròn), KHÔNG viền đen quanh từng ô (chỉ khối màu đặc, cách nhau bằng khoảng gap) —
  // tone="plan" xanh lá NHẠT + chữ đen để phân biệt rõ với khối "chỉ tiêu" (MiniStat, vẫn xanh
  // đậm) — CHỈ áp dụng khi light=true; cấp Tổng quan/Nhà máy (dark) giữ nguyên như cũ.
  const valueCls = band
    ? `${light ? '' : `border ${bandColors[band].chipBorder}`} ${bandColors[band].chipBg} ${bandColors[band].text}`
    : tone === 'plan'
      ? light
        ? 'bg-[#90EE90] text-black'
        : 'border border-emerald-500/20 bg-emerald-900/60 text-emerald-100'
      : `border ${t[tone].chipBorder} ${t[tone].chipBg} ${t[tone].text}`;
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <div
        className={`w-full truncate text-center font-bold uppercase tracking-wide ${
          light ? (tv ? 'text-base text-gray-700' : 'text-xs text-gray-600') : 'text-[8px] text-slate-400'
        }`}
      >
        {label}
      </div>
      <div
        className={`w-full truncate text-center font-black ${light ? 'rounded-none' : 'rounded-lg'} ${
          small ? (light ? 'py-1 text-base' : 'py-0.5 text-xs') : light ? (tv ? 'py-2 text-5xl' : 'py-2 text-3xl') : 'py-1 text-sm'
        } ${valueCls}`}
      >
        {value}
      </div>
    </div>
  );
}

// Hàng chỉ số DẠNG LIỆT KÊ (nhãn trái, số phải, không viền/không ô màu) — dùng cho 4 chỉ số đầu
// mỗi thẻ Tổ (SL KH/Ngày, PPH, LĐ/TGLV, SLKH/Giờ), khác hẳn RefStat (có ô màu riêng) — theo đúng
// bảng mẫu, gọn hơn hẳn để thẻ Tổ đỡ cao.
// Ô chỉ số THIẾT LẬP/KẾ HOẠCH kiểu bảng Excel mẫu — nhãn nhỏ phía trên, số to trong khối màu bên
// dưới. 2 tông xanh xen kẽ (tone 'a' đậm/tone 'b' vừa) giữa các ô liền nhau, đúng ảnh mẫu — khác
// RefStat (số liệu THỰC HIỆN, tông màu riêng + có thể tô theo % đạt).
function MiniStat({
  label,
  value,
  tone,
  light = false,
  tv = false,
}: {
  label: string;
  value: React.ReactNode;
  tone: 'a' | 'b';
  light?: boolean;
  // Chữ/số to hơn hẳn khi chiếu TV (đứng xa mới đọc được) — trước đây chỉ phân biệt theo `light`,
  // cùng cỡ chữ dù trong app (xem gần) hay TV (xem xa). Chỉ có tác dụng khi light=true.
  tv?: boolean;
}) {
  // Cấp Line — BỎ viền đen quanh ô (theo đúng ảnh mẫu thật — chỉ là khối màu đặc, không viền),
  // chữ to hơn hẳn để dễ đọc từ xa.
  // tone='b' cấp Line/TV (light) đổi màu theo yêu cầu — #99CC33 (xanh chanh, đợt trước là #99FF00
  // nhưng người dùng thấy quá chói nên đổi dịu hơn) — CHỈ light=true (cấp Line/TV), Tổng quan/Nhà
  // máy (dark) giữ nguyên emerald như cũ, không đụng tới. Chữ ĐEN thay vì trắng (nền quá sáng, chữ
  // trắng sẽ mờ khó đọc) — khớp đúng quy ước nền sáng/chữ đen đã dùng ở BAND_LIGHT (VD nền
  // #90EE90/#FFD700 cũng chữ đen) trong chính file này.
  const bg = light
    ? tone === 'a'
      ? 'bg-emerald-800 text-white'
      : 'bg-[#99CC33] text-black'
    : tone === 'a'
      ? 'border border-emerald-500/25 bg-emerald-900/70 text-emerald-100'
      : 'border border-emerald-400/25 bg-emerald-700/40 text-emerald-100';
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <div
        className={`w-full truncate text-center font-bold uppercase tracking-wide ${
          light ? (tv ? 'text-sm text-gray-600' : 'text-[9px] text-gray-500') : 'text-[8px] text-slate-400'
        }`}
      >
        {label}
      </div>
      <div className={`w-full truncate py-1.5 text-center font-black ${light ? `rounded-none ${tv ? 'text-3xl' : 'text-lg'}` : 'rounded-lg text-base'} ${bg}`}>
        {value}
      </div>
    </div>
  );
}

// 1 Tổ trong Line = 1 card — bố cục theo ĐÚNG bảng mẫu Excel người dùng gửi (không dùng biểu đồ):
// 4 chỉ số đầu (SLKH/Ngày, PPH, LĐ, TGLV) + SLKH/Giờ + SLKH L.Kế đều dạng Ô MÀU (MiniStat, 2 tông
// xen kẽ) — TRƯỚC ĐÂY liệt kê chữ gọn, đã đổi lại theo đúng ảnh mẫu (yêu cầu người dùng). Mã hàng +
// ảnh sản phẩm (nếu Admin đã tải lên ở Cài Đặt — xem PphSettingsView.tsx, chưa có thì tạm hiện mã
// hàng dạng pill thay chỗ). Khối kết quả SLTH/PPH TH kèm % tô màu theo target (RefStat).
// Hàng "Số lỗi"/"% Quality" — nay ĐÃ CÓ nguồn dữ liệu thật (cột error_count, nhập bắt buộc ở form
// quét từng khung giờ — xem PphScanClient.tsx) nên thêm lại vào TeamPanelBody, cộng dồn cả ngày
// giống SLTH/%ĐẠT/PPH TH/%PPH (không còn là số bịa tạm như ghi chú cũ ở đây).
function TeamPanel({
  leaf,
  light = false,
  tv = false,
  alertOverdue = false,
}: {
  leaf: PphLeaf;
  light?: boolean;
  // Chữ/số to hơn hẳn khi chiếu TV (đứng xa mới đọc được) — trước đây MiniStat/RefStat chỉ phân
  // biệt theo `light`, chưa phân biệt "trong app" với "chiếu TV" nên cùng 1 cỡ chữ cho cả 2, dù
  // khoảng cách xem khác hẳn nhau. Chỉ ảnh hưởng nhánh light=true (cấp Line/TV).
  tv?: boolean;
  // CHỈ bật ở màn chiếu TV (PphViewClient truyền vào) — trang thường KHÔNG bật (người dùng chốt
  // "ở link màn hình TV" khi hỏi lại phạm vi). Tổ nào ĐÃ TỚI GIỜ khung hiện tại mà CHƯA nhập
  // (entryStatus "missing" — tính sẵn ở backend, xem pphResolveStatus) thì chớp đỏ toàn thẻ liên
  // tục — dừng NGAY khi họ nhập xong (entryStatus đổi khỏi "missing" ở lần poll tiếp theo, mỗi 60s).
  alertOverdue?: boolean;
}) {
  const isOverdue = alertOverdue && leaf.entryStatus === 'missing';
  // Không có sẵn "người phụ trách" cố định cho 1 Tổ — chỉ có tên người NHẬP từng khung giờ riêng lẻ
  // (leaf.slots[].submittedBy). Lấy tên từ khung GẦN NHẤT theo đúng mốc giờ nộp thật (submittedAt),
  // không phải theo thứ tự khung trong ngày — phòng trường hợp ai đó quay lại nhập bù 1 khung cũ
  // SAU khi đã nhập khung mới hơn, vẫn ra đúng người nhập gần đây nhất theo THỜI GIAN THẬT.
  const lastSubmitter = isOverdue
    ? leaf.slots
        .filter((s) => s.filled && s.submittedBy && s.submittedAt)
        .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))[0]?.submittedBy || null
    : null;
  const r = rollup([leaf]);
  const workerCount = leaf.setup?.workerCount ?? null;
  const productionHours = leaf.setup?.productionHours ?? null;
  const model = leaf.setup?.model ?? null;
  const plannedQtyDay = leaf.setup?.plannedQty ?? null;
  // PPH (sản lượng/người/giờ) suy từ Mục tiêu/giờ chia Lao động — hệ thống chưa lưu SAM (thời
  // gian định mức riêng theo mã hàng) nên đây là giá trị GẦN ĐÚNG, không phải công thức PPH chuẩn
  // ngành may; đủ dùng để so % đạt so với mục tiêu (tỉ lệ actual/target không đổi dù công thức nào).
  // GIỮ NGUYÊN dùng cho PPH TH/% PPH — 2 ô đó vẫn phải bám đúng kế hoạch thật công nhân nhập, KHÔNG
  // đổi theo PPH chuẩn IE (xem displayTargetPph riêng bên dưới, chỉ dùng cho Ô HIỂN THỊ "PPH").
  const targetPphPerWorker = workerCount ? leaf.perHourTarget / workerCount : null;
  const actualPphPerWorker = targetPphPerWorker != null && r.pct != null ? (targetPphPerWorker * r.pct) / 100 : null;
  // Ô "PPH" hiển thị — ƯU TIÊN PPH chuẩn IE theo mã giày (leaf.pphStandard, server đã tra sẵn đúng
  // Xưởng/Nhà máy) nếu có, rớt về số tự tính (targetPphPerWorker) khi chưa khai Model/mã lạ/Xưởng
  // ngoài phạm vi file IE — CHỈ đổi con số HIỆN RA ở đây, không đụng gì tới targetPphPerWorker/
  // actualPphPerWorker phía trên (PPH TH/% PPH vẫn tính từ kế hoạch thật như cũ).
  const displayTargetPph = leaf.pphStandard ?? targetPphPerWorker;
  const fmt2 = (n: number) => n.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Cấp Line (light) — phong cách "bảng biểu truyền thống" theo ảnh mẫu: KHÔNG dùng Panel dùng
  // chung (bo góc lớn, viền mờ) nữa — tự dựng khung riêng góc vuông + viền đen sắc nét, sát nhau
  // kiểu ô cờ/bảng tính. Cấp Tổng quan/Nhà máy (dark) không đụng tới, vẫn dùng Panel như cũ.
  const isPaused = leaf.entryStatus === 'paused';
  if (light) {
    return (
      <div
        className={
          isOverdue
            ? 'animate-blink-red-alert border-2 shadow-sm'
            : isPaused
              ? 'border-2 border-slate-300 bg-slate-50 shadow-sm'
              : 'border-2 border-black bg-white shadow-sm'
        }
      >
        <div className={`flex items-center justify-center border-b-2 py-1.5 ${isPaused ? 'border-slate-300' : 'border-black'}`}>
          <span
            className={`truncate px-3 font-extrabold uppercase tracking-wide ${isPaused ? 'text-slate-500' : 'text-emerald-800'} ${tv ? 'text-3xl' : 'text-xl'}`}
          >
            {leaf.name}
          </span>
        </div>
        <div className="p-1.5">
          {/* Tạm ngưng sản xuất (leaf.paused bật ở Cài Đặt) — thẻ trung tính, KHÔNG chớp đỏ/không
              nhắc giọng đọc (LineBoard đã tự loại khỏi missingLeaves vì entryStatus != 'missing'),
              phân biệt rõ với "quên nhập" (vẫn còn chớp đỏ như cũ) thay vì hiện 1 thẻ trống toàn
              gạch ngang trông như lỗi dữ liệu. */}
          {isPaused ? (
            <div className={`flex flex-col items-center justify-center gap-1.5 ${tv ? 'py-10' : 'py-6'}`}>
              <span className={`font-black uppercase tracking-wide text-slate-400 ${tv ? 'text-2xl' : 'text-base'}`}>⏸ Tạm ngưng sản xuất</span>
            </div>
          ) : /* Trễ nhập — xếp CHỒNG 2 khối bằng CSS grid (cùng 1 ô [1/1], khối cao hơn quyết định
              chiều cao chung) rồi cho ĐỘI opacity NGƯỢC NHAU, animation CÙNG mốc thời lượng với nền
              đỏ-trắng ở khung ngoài (animate-blink-red-alert) — nền trắng hiện đủ thông tin như
              thường, nền đỏ CHỈ còn tên người nhập gần nhất (nếu có) + dòng nhắc + ảnh, không cần
              JS đo/đồng bộ thời gian riêng. */
          isOverdue ? (
            <div className="grid">
              <div className="col-start-1 row-start-1 animate-blink-content-normal">
                <TeamPanelBody
                  leaf={leaf}
                  r={r}
                  model={model}
                  plannedQtyDay={plannedQtyDay}
                  workerCount={workerCount}
                  productionHours={productionHours}
                  displayTargetPph={displayTargetPph}
                  actualPphPerWorker={actualPphPerWorker}
                  fmt2={fmt2}
                  tv={tv}
                />
              </div>
              {/* Chia đúng 2 nửa theo chiều cao ô (grid đã stretch ô này bằng đúng chiều cao
                  TeamPanelBody bên cạnh) — nửa trên tên người nhập + khẩu hiệu, nửa dưới ảnh to
                  hết cỡ (object-cover tự cắt cho vừa khung, không méo ảnh). */}
              <div className="col-start-1 row-start-1 flex animate-blink-content-warning flex-col">
                <div className="flex flex-none flex-col items-center justify-center gap-1 py-1.5">
                  {lastSubmitter && <span className={`truncate font-black text-rose-800 ${tv ? 'text-2xl' : 'text-base'}`}>{lastSubmitter}</span>}
                  <span className={`text-center font-black uppercase leading-tight text-rose-700 ${tv ? 'text-3xl' : 'text-xl'}`}>Nhập Sản Lượng Đi!!!!</span>
                </div>
                <div className="flex-1 overflow-hidden bg-white">
                  {/* object-contain (không phải cover) — HIỆN TRỌN VẸN ảnh, tự thu nhỏ cho vừa khung
                      thay vì phóng to hết cỡ rồi cắt bớt cạnh (trước đây cover cắt mất hàng icon
                      dưới cùng của ảnh) — nền trắng lấp khoảng dư 2 bên/trên dưới, khớp màu nền
                      trắng sẵn có của chính ảnh, không lộ viền. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/dwl2xtbqa/image/upload/v1789779633/thkiengiangshoes/pph_overdue_slogan_pic.jpg"
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          ) : (
            <TeamPanelBody
              leaf={leaf}
              r={r}
              model={model}
              plannedQtyDay={plannedQtyDay}
              workerCount={workerCount}
              productionHours={productionHours}
              displayTargetPph={displayTargetPph}
              actualPphPerWorker={actualPphPerWorker}
              fmt2={fmt2}
              tv={tv}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Panel
      light={light}
      title={
        <span className="mx-auto inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 px-3 py-1 text-cyan-100">
          <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
          {leaf.name}
        </span>
      }
    >
      {isPaused ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-8">
          <span className="text-base font-black uppercase tracking-wide text-slate-400">⏸ Tạm ngưng sản xuất</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            <MiniStat label="SLKH/Ngày" value={plannedQtyDay != null ? fmtInt(plannedQtyDay) : '—'} tone="a" />
            <MiniStat label="PPH" value={displayTargetPph != null ? fmt2(displayTargetPph) : '—'} tone="b" />
            <MiniStat label="LĐ" value={workerCount != null ? fmtInt(workerCount) : '—'} tone="a" />
            <MiniStat label="TGLV" value={productionHours != null ? String(productionHours).replace('.', ',') : '—'} tone="b" />
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <MiniStat label="SLKH/Giờ" value={fmtInt(leaf.perHourTarget)} tone="a" />
            <MiniStat label="SLKH L.Kế" value={fmtInt(r.proTarget)} tone="b" />
          </div>

          <div className="mt-2.5 flex justify-center">
            {leaf.imageUrl ? (
              <div className="flex w-full items-stretch gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={leaf.imageUrl} alt={model || ''} className="w-16 shrink-0 rounded-lg border border-emerald-200 object-cover" />
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 truncate rounded border border-emerald-500/20 bg-emerald-900/60 px-2.5 py-2 text-center text-emerald-100">
                  <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">Mã hàng</div>
                  <div className="truncate text-base font-black">{model || '—'}</div>
                </div>
              </div>
            ) : (
              <div className="inline-flex max-w-full items-center gap-1.5 truncate rounded border border-emerald-500/20 bg-emerald-900/60 px-3 py-2 text-emerald-100">
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide opacity-80">Mã hàng:</span>
                <span className="truncate text-base font-black">{model || '—'}</span>
              </div>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <RefStat label="SLTH" value={fmtInt(r.actual)} tone="plan" />
            <RefStat label="% Đạt" value={r.pct == null ? '—' : `${r.pct}%`} band={bandFor(r.pct)} />
            <RefStat label="PPH TH" value={actualPphPerWorker != null ? fmt2(actualPphPerWorker) : '—'} tone="plan" />
            <RefStat label="% PPH" value={r.pct == null ? '—' : `${r.pct}%`} band={bandFor(r.pct)} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <RefStat label="Số lỗi" value={leaf.cumulativeErrors != null ? fmtInt(leaf.cumulativeErrors) : '—'} tone="plan" />
            <RefStat label="% Quality" value={leaf.qualityPct == null ? '—' : `${leaf.qualityPct}%`} band={bandFor(leaf.qualityPct)} />
          </div>
        </>
      )}
    </Panel>
  );
}

// Thân thẻ Tổ (cấp Line, light) — TÁCH RIÊNG khỏi TeamPanel để dùng lại được y hệt cho cả trạng
// thái bình thường LẪN lớp "nền trắng" khi xếp chồng cảnh báo trễ (xem TeamPanel, animate-blink-
// content-normal) mà không phải chép lại 2 lần cùng 1 đống JSX.
function TeamPanelBody({
  leaf,
  r,
  model,
  plannedQtyDay,
  workerCount,
  productionHours,
  displayTargetPph,
  actualPphPerWorker,
  fmt2,
  tv = false,
}: {
  leaf: PphLeaf;
  r: ReturnType<typeof rollup>;
  model: string | null;
  plannedQtyDay: number | null;
  workerCount: number | null;
  productionHours: number | null;
  displayTargetPph: number | null;
  actualPphPerWorker: number | null;
  fmt2: (n: number) => string;
  tv?: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-4 gap-1">
        <MiniStat label="SLKH/Ngày" value={plannedQtyDay != null ? fmtInt(plannedQtyDay) : '—'} tone="a" light tv={tv} />
        <MiniStat label="PPH" value={displayTargetPph != null ? fmt2(displayTargetPph) : '—'} tone="b" light tv={tv} />
        <MiniStat label="LĐ" value={workerCount != null ? fmtInt(workerCount) : '—'} tone="a" light tv={tv} />
        <MiniStat label="TGLV" value={productionHours != null ? String(productionHours).replace('.', ',') : '—'} tone="b" light tv={tv} />
      </div>

      {/* Cột trái (2/5): SLKH/Giờ + SLKH L.Kế xếp CHỒNG — cột phải (3/5, rộng hơn hẳn để ảnh
          sản phẩm có chỗ hiện rõ): Mã hàng + ảnh sản phẩm xếp CHỒNG — đúng tỉ lệ ảnh mẫu. */}
      <div className="mt-1 grid grid-cols-5 gap-1">
        <div className="col-span-2 flex flex-col gap-1">
          <MiniStat label="SLKH/Giờ" value={fmtInt(leaf.perHourTarget)} tone="a" light tv={tv} />
          {/* Theo yêu cầu người dùng — đổi tone "b" (xanh chanh #99CC33) sang "a" (xanh đậm) để
              cùng màu với SLKH/Giờ ngay phía trên, không còn xen kẽ 2 tông như trước. */}
          <MiniStat label="SLKH L.Kế" value={fmtInt(r.proTarget)} tone="a" light tv={tv} />
        </div>
        <div className="col-span-3 flex flex-col gap-1">
          <div className={`truncate bg-white px-1 py-1 text-center font-extrabold uppercase tracking-wide text-tbs-dark ${tv ? 'text-xl' : 'text-sm'}`}>
            {model || '—'}
          </div>
          {/* aspect-[4/3] cố định — TRƯỚC ĐÂY dùng flex-1 (giãn theo khoảng trống còn lại), mà
              khối cha cao THEO NỘI DUNG (không có chiều cao cố định từ bên ngoài) nên flex-1
              không có gì để giãn vào, ảnh tự rơi về đúng tỉ lệ GỐC của từng ảnh giày (ảnh dọc/
              ngang/vuông khác nhau) — mỗi Tổ 1 chiều cao khối ảnh khác nhau, lệch hẳn cả hàng.
              aspect-ratio tính chiều cao từ chiều RỘNG cột (luôn có sẵn, đều nhau mọi Tổ) nên
              LUÔN ra cùng 1 chiều cao bất kể ảnh gốc tỉ lệ gì. */}
          {/* w-[78%] mx-auto — thu nhỏ thêm 1 lần nữa theo yêu cầu (trước 90%, giờ 78%), vẫn giữ tỉ
              lệ aspect-[4/3] nên chiều cao tự co theo đúng tỉ lệ, không lệch. */}
          {leaf.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={leaf.imageUrl} alt={model || ''} className="mx-auto aspect-[4/3] w-[78%] object-cover" />
          ) : (
            <div className="mx-auto flex aspect-[4/3] w-[78%] items-center justify-center bg-gray-50 text-center text-[9px] font-bold text-gray-400">
              Chưa có ảnh
            </div>
          )}
        </div>
      </div>

      {/* Khối kết quả — không viền đen (chỉ khối màu đặc), chữ to, đúng ảnh mẫu thật. */}
      <div className="mt-1 grid grid-cols-2 gap-1">
        <RefStat label="SLTH" value={fmtInt(r.actual)} light tv={tv} tone="plan" />
        {/* Bỏ dấu "%" ở GIÁ TRỊ cho gọn (VD 55% -> 55) — nhãn "% ĐẠT/% PPH/% QUALITY" phía trên đã
            đủ nói rõ đây là phần trăm, không cần lặp lại dấu % trong số — CHỈ áp dụng cấp Line/TV
            (light), Tổng quan/Nhà máy (dark, block TeamPanel phía trên) giữ nguyên có dấu %. */}
        <RefStat label="% ĐẠT" value={r.pct == null ? '—' : String(r.pct)} light tv={tv} band={bandFor(r.pct)} />
        <RefStat label="PPH TH" value={actualPphPerWorker != null ? fmt2(actualPphPerWorker) : '—'} light tv={tv} tone="plan" />
        <RefStat label="% PPH" value={r.pct == null ? '—' : String(r.pct)} light tv={tv} band={bandFor(r.pct)} />
      </div>

      {/* Chất lượng RFT — cộng dồn cả ngày (khớp cách SLTH/%ĐẠT/PPHTH/%PPH đã cộng dồn ở trên),
          null (—) khi chưa khung giờ nào có Số lỗi thay vì bịa ra 100%. */}
      <div className="mt-1 grid grid-cols-2 gap-1">
        <RefStat label="SỐ LỖI" value={leaf.cumulativeErrors != null ? fmtInt(leaf.cumulativeErrors) : '—'} light tv={tv} tone="plan" />
        <RefStat label="% QUALITY" value={leaf.qualityPct == null ? '—' : String(leaf.qualityPct)} light tv={tv} band={bandFor(leaf.qualityPct)} />
      </div>
    </>
  );
}

