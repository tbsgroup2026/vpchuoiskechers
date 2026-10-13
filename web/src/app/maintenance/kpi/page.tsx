'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import {
  IconGauge,
  IconClockHour4,
  IconWifi,
  IconRepeat,
  IconActivity,
  IconCalendarStats,
  IconChartDonut,
  IconStar,
  IconCoin,
  IconBox,
  IconFlask,
  IconTrendingUp,
  IconTrendingDown,
  IconTool,
  IconAlertTriangle,
  IconCircleCheck,
  IconBuildingFactory,
  IconBuildingFactory2,
  IconBuildingWarehouse,
  IconBuildingCommunity,
  IconBuildingSkyscraper,
  IconBuilding,
  IconMedal,
} from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import Sparkline from '@/components/charts/Sparkline';
import UnitBarChart from '@/components/charts/UnitBarChart';
import UnitDonutChart from '@/components/charts/UnitDonutChart';
import { EquipmentScope, getCurrentMmtbScope } from '@/lib/equipmentScope';

type KpiIncident = {
  id: string;
  createdAt: string;
  completedAt: string | null;
  categoryName: string | null;
  machineCode: string;
  machineName: string;
};

type ScheduleMachineRow = { id: string; code: string; name: string; status: 'unscheduled' | 'overdue' | 'upcoming' | 'scheduled' };
type MachineRow = { id: string; code: string; name: string };
type InventoryRow = { machine?: { code?: string } };

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function minutesBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
function fmtVND(n: number): string {
  return `${Math.round(n).toLocaleString('en-US')} ₫`;
}

const REPEAT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày — theo lựa chọn đã chốt
const WEEK_BUCKET_COUNT = 8;
const MONTH_BUCKET_COUNT = 6;

type Bucket = { label: string; from: string; to: string };

// 8 tuần gần nhất (Thứ 2 -> Chủ Nhật), tính theo giờ VN.
function buildWeekBuckets(count: number): Bucket[] {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOfWeek = todayUTC.getUTCDay() || 7;
  const thisMonday = new Date(todayUTC);
  thisMonday.setUTCDate(todayUTC.getUTCDate() - (dayOfWeek - 1));
  const buckets: Bucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const monday = new Date(thisMonday);
    monday.setUTCDate(thisMonday.getUTCDate() - i * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    buckets.push({ label: `${String(monday.getUTCDate()).padStart(2, '0')}/${String(monday.getUTCMonth() + 1).padStart(2, '0')}`, from: isoDate(monday), to: isoDate(sunday) });
  }
  return buckets;
}

// 6 tháng gần nhất (trọn tháng dương lịch).
function buildMonthBuckets(count: number): Bucket[] {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const buckets: Bucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    buckets.push({ label: `Th${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`, from: isoDate(d), to: isoDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), lastDay))) });
  }
  return buckets;
}

function inBucket(createdAt: string, b: Bucket): boolean {
  const day = createdAt.slice(0, 10);
  return day >= b.from && day <= b.to;
}

// So kỳ hiện tại (bucket cuối) với kỳ liền trước — tăng = xanh, giảm = đỏ, khớp đúng quy ước chung
// của cả trang (xem "Chi Tiết Theo Nhà Máy" ở Tổng Quan), không xét ý nghĩa tốt/xấu riêng từng KPI.
function calcDelta(trend: { value: number }[]): number | null {
  if (trend.length < 2) return null;
  const prev = trend[trend.length - 2].value;
  const curr = trend[trend.length - 1].value;
  if (prev === 0) return curr === 0 ? 0 : null;
  return round1(((curr - prev) / prev) * 100);
}

// Sinh dữ liệu GIẢ LẬP có dáng hợp lý cho từng chỉ số — CHỈ dùng khi bật "Data Test", không đụng
// dữ liệu thật, giống hệt cách nút "Data Test" ở trang Tổng Quan 6 đơn vị đang làm.
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function mockTrend(buckets: Bucket[], base: number, amplitude: number, seed: number): { label: string; value: number }[] {
  const rand = seededRandom(seed);
  return buckets.map((b) => ({ label: b.label, value: round1(Math.max(0, base + (rand() - 0.5) * amplitude)) }));
}

function DeltaTag({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs font-bold text-slate-400">— so với kỳ trước</span>;
  if (pct === 0) return <span className="text-xs font-bold text-slate-400">— 0% so với kỳ trước</span>;
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
      {up ? <IconTrendingUp size={13} /> : <IconTrendingDown size={13} />}
      {Math.abs(pct)}% so với kỳ trước
    </span>
  );
}

// ---- Hàng tóm tắt trên cùng: icon + tiêu đề, số lớn, % so kỳ trước, sparkline nhỏ bên phải ----
function SummaryCard({
  icon: Icon,
  bg,
  iconBg,
  iconColor,
  sparkColor,
  title,
  value,
  trend,
  prevTrend,
}: {
  icon: any;
  bg: string;
  iconBg: string;
  iconColor: string;
  sparkColor: string;
  title: string;
  value: string;
  trend: { value: number }[];
  prevTrend?: number[] | null;
}) {
  const delta = calcDelta(trend);
  const prevData = prevTrend && prevTrend.length === trend.length ? prevTrend.map((v) => ({ value: v })) : null;
  return (
    <div className={`rounded-xl p-4 ${bg} flex items-center gap-3`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={16} className={iconColor} />
          </div>
          <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide truncate">{title}</h3>
        </div>
        <div className="text-2xl font-extrabold text-slate-900">{value}</div>
        <div className="mt-1">
          <DeltaTag pct={delta} />
        </div>
      </div>
      <div className="w-24 h-10 shrink-0">
        <Sparkline data={trend} color={sparkColor} height={40} prevData={prevData} />
      </div>
    </div>
  );
}

// ---- Khung 1 thẻ chi tiết: icon + tiêu đề (trái), nhãn đơn vị tĩnh (phải) ----
function DetailCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  unitPill,
  description,
  formula,
  children,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  unitPill: string;
  // Câu ngắn ngay dưới tiêu đề, nói rõ biểu đồ này ĐO CÁI GÌ (khác với `formula` ở chân thẻ, vốn nói
  // CÁCH TÍNH chi tiết) — để nhìn tiêu đề là hiểu ngay đang xem chỉ số gì, không cần đọc hết cả thẻ.
  description: string;
  formula: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={16} className={iconColor} />
          </div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">{title}</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 shrink-0 ml-2">{unitPill}</span>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">{description}</p>
      <div className="flex-1">{children}</div>
      <p className="text-[10px] text-slate-400 mt-3 leading-snug border-t border-slate-100 pt-2">{formula}</p>
    </div>
  );
}

// Chú thích 2 dòng: đường/cột màu (kỳ hiện tại) + đường xám nét đứt (trung bình kỳ trước) — để
// người xem biết ngay đường nét đứt là gì, không phải đoán, giúp phân biệt rõ với đường màu chính.
function ChartLegendRow({ color, periodLabel }: { color: string; periodLabel: string }) {
  return (
    <div className="flex items-center justify-center gap-4 mt-2 text-[10px] font-semibold text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} /> {periodLabel}
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="16" height="8" className="shrink-0">
          <line x1="0" y1="4" x2="16" y2="4" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" />
        </svg>
        Trung bình kỳ trước
      </span>
    </div>
  );
}

function DetailLineChart({
  data,
  color,
  suffix = '',
  prevTrend,
  periodLabel = 'Kỳ này',
}: {
  data: { label: string; value: number }[];
  color: string;
  suffix?: string;
  // Xu hướng KỲ LIỀN TRƯỚC — CÙNG SỐ ĐIỂM với `data`, vẽ thành 1 đường xám nét đứt riêng (lên xuống
  // theo đúng dữ liệu thật của kỳ trước, khớp 1-1 theo vị trí với từng điểm hiện tại).
  prevTrend?: number[] | null;
  periodLabel?: string;
}) {
  if (data.length < 2) return null;
  const hasPrev = !!prevTrend && prevTrend.length === data.length;
  const chartData = hasPrev ? data.map((d, i) => ({ ...d, prevValue: prevTrend![i] })) : data;
  // Tô mờ dần bên dưới đường (gradient fill) — cùng kỹ thuật như Sparkline.tsx, giúp đường xu hướng
  // dễ nhìn hơn thay vì chỉ 1 đường trơn, khớp đúng ảnh mẫu người dùng gửi.
  const gradientId = `detail-fill-${color.replace('#', '')}`;
  return (
    <div>
      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={chartData} margin={{ top: 22, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7ede9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} width={34} />
          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7ede9', fontSize: 11 }} formatter={(v: any) => [`${v}${suffix}`, '']} labelFormatter={(l) => l} />
          {hasPrev && <Line type="monotone" dataKey="prevValue" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }} isAnimationActive={false} />}
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={{ r: 4, fill: color, strokeWidth: 0 }} isAnimationActive={false}>
            <LabelList dataKey="value" position="top" formatter={(v: any) => `${v}`} style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} />
          </Area>
        </ComposedChart>
      </ResponsiveContainer>
      {hasPrev && <ChartLegendRow color={color} periodLabel={periodLabel} />}
    </div>
  );
}

function DetailBarChart({
  data,
  color,
  suffix = '',
  prevTrend,
  periodLabel = 'Kỳ này',
}: {
  data: { label: string; value: number }[];
  color: string;
  suffix?: string;
  prevTrend?: number[] | null;
  periodLabel?: string;
}) {
  if (data.length < 2) return null;
  const hasPrev = !!prevTrend && prevTrend.length === data.length;
  const chartData = hasPrev ? data.map((d, i) => ({ ...d, prevValue: prevTrend![i] })) : data;
  const minVal = Math.min(...data.map((d) => d.value));
  return (
    <div>
      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={chartData} margin={{ top: 22, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7ede9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis domain={[Math.max(0, Math.floor(minVal * 0.85)), 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} width={34} />
          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7ede9', fontSize: 11 }} formatter={(v: any) => [`${v}${suffix}`, '']} labelFormatter={(l) => l} />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={40}>
            <LabelList dataKey="value" position="top" formatter={(v: any) => `${v}${suffix}`} style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} />
          </Bar>
          {hasPrev && <Line type="monotone" dataKey="prevValue" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }} isAnimationActive={false} />}
        </ComposedChart>
      </ResponsiveContainer>
      {hasPrev && <ChartLegendRow color={color} periodLabel={periodLabel} />}
    </div>
  );
}

function DonutChart({ pct, color }: { pct: number; color: string }) {
  const data = [{ value: pct }, { value: Math.max(0, 100 - pct) }];
  return (
    <div className="relative w-28 h-28 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={38} outerRadius={52} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
            <Cell fill={color} />
            <Cell fill="#e2e8f0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-slate-900">{pct}%</span>
        <span className="text-[9px] text-slate-400 font-bold uppercase">OEE</span>
      </div>
    </div>
  );
}

function IconRankList({ icon: Icon, iconColor, items }: { icon: any; iconColor: string; items: { label: string; value: string; valueColor?: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      {items.map((it) => (
        <div key={it.label} className="flex items-center justify-between text-xs gap-2">
          <span className="flex items-center gap-1.5 text-slate-600 min-w-0">
            <Icon size={13} className={`${iconColor} shrink-0`} />
            <span className="truncate">{it.label}</span>
          </span>
          <span className={`font-bold shrink-0 ${it.valueColor || 'text-slate-700'}`}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyDataCard({ icon: Icon, title, reason }: { icon: any; title: string; reason: string }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-200">
          <Icon size={16} className="text-slate-400" />
        </div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
      </div>
      <span className="text-base font-extrabold text-slate-300">Chưa đủ dữ liệu</span>
      <p className="text-[11px] text-slate-400 mt-2 leading-snug">{reason}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SO SÁNH KPI GIỮA CÁC NHÀ MÁY (scope=ALL) — cùng 6 đơn vị với trang Tổng Quan (KG1/KG2/KG3/HTĐ
// trong Tổ Hợp Kiên Giang + Nhà Máy Miền Đông + Văn Phòng Chuỗi), nhưng ở ĐÂY so sánh các chỉ số
// KPI sâu hơn (MTBF/Availability/PM Compliance/Repeat Failure/Breakdown Rate/OEE/PM Effectiveness/
// Chi phí) — mỗi chỉ số 1 biểu đồ cột + xếp hạng riêng, không cần gọn 1 trang.
// ════════════════════════════════════════════════════════════════════════
type CompUnitKey = 'KG1' | 'KG2' | 'KG3' | 'HTD' | 'EAST' | 'OFFICE';
type CompUnitDef = { key: CompUnitKey; label: string; scope: EquipmentScope; factoryNameMatch: string | null; color: string; icon: any };
// Icon riêng từng đơn vị KHỚP ĐÚNG bộ icon đang dùng ở COMPARISON_UNIT_DEFS trang Tổng Quan (ALL) —
// giữ nhất quán hình ảnh 1 đơn vị = 1 icon xuyên suốt cả 2 trang.
const KPI_COMPARE_UNITS: CompUnitDef[] = [
  { key: 'KG1', label: 'KG1', scope: 'KIEN_GIANG', factoryNameMatch: 'KG 1', color: '#2563eb', icon: IconBuildingFactory },
  { key: 'KG2', label: 'KG2', scope: 'KIEN_GIANG', factoryNameMatch: 'KG 2', color: '#7c3aed', icon: IconBuildingFactory2 },
  { key: 'KG3', label: 'KG3', scope: 'KIEN_GIANG', factoryNameMatch: 'KG 3', color: '#d97706', icon: IconBuildingWarehouse },
  { key: 'HTD', label: 'HTĐ', scope: 'KIEN_GIANG', factoryNameMatch: 'HTĐ KG', color: '#0d9488', icon: IconBuildingCommunity },
  { key: 'EAST', label: 'SK MD', scope: 'EAST', factoryNameMatch: null, color: '#e11d48', icon: IconBuildingSkyscraper },
  { key: 'OFFICE', label: 'VP2', scope: 'OFFICE', factoryNameMatch: null, color: '#9333ea', icon: IconBuilding },
];

type CompRealValues = { mtbf: number | null; availability: number | null; repeat: number | null; breakdown: number | null; pmCompliance: number | null };

// Tính 5 chỉ số THẬT cho 1 đơn vị, gộp trên TOÀN khoảng đang xem (không tách theo bucket tuần/
// tháng — mục đích ở đây là SO SÁNH GIỮA CÁC ĐƠN VỊ tại 1 kỳ, không phải xem xu hướng theo thời
// gian của riêng 1 đơn vị như các DetailLineChart/DetailBarChart phía trên) — CÙNG công thức với
// mtbfTrendResult/availabilityTrendResult/repeatFailureTrendResult/breakdownRateTrendResult/
// pmComplianceResult bên dưới, chỉ khác là gộp 1 số duy nhất thay vì theo từng bucket.
function computeUnitReal(incidents: KpiIncident[], machineCount: number, scheduleMachines: ScheduleMachineRow[], rangeFrom: string, rangeTo: string): CompRealValues {
  const byMachine = new Map<string, number[]>();
  for (const i of incidents) {
    if (!byMachine.has(i.machineCode)) byMachine.set(i.machineCode, []);
    byMachine.get(i.machineCode)!.push(new Date(i.createdAt).getTime());
  }
  const gaps: number[] = [];
  for (const times of byMachine.values()) {
    if (times.length < 2) continue;
    const sorted = [...times].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] - sorted[i - 1]) / 3600000);
  }
  const mtbf = gaps.length ? round1(gaps.reduce((s, g) => s + g, 0) / gaps.length) : null;

  let availability: number | null = null;
  if (machineCount > 0) {
    const totalDowntimeMin = incidents.reduce((s, i) => (i.completedAt ? s + minutesBetween(i.createdAt, i.completedAt) : s), 0);
    const periodDays = Math.round((new Date(`${rangeTo}T00:00:00Z`).getTime() - new Date(`${rangeFrom}T00:00:00Z`).getTime()) / 86400000) + 1;
    const denom = periodDays * 24 * 60 * machineCount;
    availability = denom > 0 ? round1(Math.max(0, Math.min(100, (1 - totalDowntimeMin / denom) * 100))) : null;
  }

  let repeat: number | null = null;
  if (incidents.length > 0) {
    const groups = new Map<string, { id: string; time: number }[]>();
    for (const i of incidents) {
      if (!i.categoryName) continue;
      const key = `${i.machineCode}__${i.categoryName}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ id: i.id, time: new Date(i.createdAt).getTime() });
    }
    const repeatIds = new Set<string>();
    for (const items of groups.values()) {
      const sorted = [...items].sort((a, b) => a.time - b.time);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].time - sorted[i - 1].time <= REPEAT_WINDOW_MS) repeatIds.add(sorted[i].id);
      }
    }
    repeat = round1((repeatIds.size / incidents.length) * 100);
  }

  const breakdown = machineCount > 0 ? round1(incidents.length / machineCount) : null;

  let pmCompliance: number | null = null;
  const scheduled = scheduleMachines.filter((m) => m.status !== 'unscheduled');
  if (scheduled.length > 0) {
    const compliant = scheduled.filter((m) => m.status !== 'overdue');
    pmCompliance = round1((compliant.length / scheduled.length) * 100);
  }

  return { mtbf, availability, repeat, breakdown, pmCompliance };
}

type CompBucketTrends = { mtbf: number[]; availability: number[]; repeat: number[]; breakdown: number[] };

// Bản THEO TỪNG BUCKET (tuần/tháng) của computeUnitReal ở trên — dùng để vẽ "Xu Hướng Tổng Điểm"/
// "Breakdown Rate 6 Nhà Máy" (biểu đồ đường nhiều-đơn-vị). KHÔNG tính PM Compliance theo bucket vì
// đây là trạng thái lịch bảo trì HIỆN TẠI (snapshot), không có lịch sử theo tuần/tháng để tách —
// khớp đúng cách pmComplianceResult ở trên cũng chỉ có 1 giá trị hiện tại, không có `.trend`. Cách
// tính lặp lại (repeat) tính cờ 1 LẦN trên toàn bộ `incidents` truyền vào (đã giới hạn sẵn trong
// [rangeFrom,rangeTo]) rồi mới đếm theo bucket — để lần lặp lại nằm sát ranh giới 2 bucket vẫn được
// nhận diện đúng (khớp đúng cách repeatFailureTrendResult ở trên làm).
function computeUnitBucketTrends(incidents: KpiIncident[], machineCount: number, buckets: Bucket[]): CompBucketTrends {
  const mtbf = buckets.map((b) => {
    const bucketIncidents = incidents.filter((i) => inBucket(i.createdAt, b));
    const byMachine = new Map<string, number[]>();
    for (const i of bucketIncidents) {
      if (!byMachine.has(i.machineCode)) byMachine.set(i.machineCode, []);
      byMachine.get(i.machineCode)!.push(new Date(i.createdAt).getTime());
    }
    const gaps: number[] = [];
    for (const times of byMachine.values()) {
      if (times.length < 2) continue;
      const sorted = [...times].sort((a, b2) => a - b2);
      for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] - sorted[i - 1]) / 3600000);
    }
    return gaps.length ? round1(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;
  });

  const availability = buckets.map((b) => {
    if (machineCount === 0) return 0;
    const bucketIncidents = incidents.filter((i) => inBucket(i.createdAt, b));
    const totalDowntimeMin = bucketIncidents.reduce((s, i) => (i.completedAt ? s + minutesBetween(i.createdAt, i.completedAt) : s), 0);
    const periodDays = Math.round((new Date(`${b.to}T00:00:00Z`).getTime() - new Date(`${b.from}T00:00:00Z`).getTime()) / 86400000) + 1;
    const denom = periodDays * 24 * 60 * machineCount;
    return denom > 0 ? round1(Math.max(0, Math.min(100, (1 - totalDowntimeMin / denom) * 100))) : 0;
  });

  const groups = new Map<string, { id: string; time: number }[]>();
  for (const i of incidents) {
    if (!i.categoryName) continue;
    const key = `${i.machineCode}__${i.categoryName}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ id: i.id, time: new Date(i.createdAt).getTime() });
  }
  const repeatIds = new Set<string>();
  for (const items of groups.values()) {
    const sorted = [...items].sort((a, b) => a.time - b.time);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].time - sorted[i - 1].time <= REPEAT_WINDOW_MS) repeatIds.add(sorted[i].id);
    }
  }
  const repeat = buckets.map((b) => {
    const bucketIncidents = incidents.filter((i) => inBucket(i.createdAt, b));
    if (bucketIncidents.length === 0) return 0;
    const repeatInBucket = bucketIncidents.filter((i) => repeatIds.has(i.id)).length;
    return round1((repeatInBucket / bucketIncidents.length) * 100);
  });

  const breakdown = buckets.map((b) => {
    if (machineCount === 0) return 0;
    const count = incidents.filter((i) => inBucket(i.createdAt, b)).length;
    return round1(count / machineCount);
  });

  return { mtbf, availability, repeat, breakdown };
}

function clamp0to100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

// Chuẩn hoá 5 chỉ số THẬT về thang điểm 0-100 theo hướng tốt/xấu riêng từng chỉ số (100 = tốt nhất)
// rồi gộp trung bình thành "Tổng Điểm Đánh Giá" — mốc quy đổi (200h MTBF = 100 điểm, breakdown 2.5
// sự cố/máy = 0 điểm) là ước lượng hợp lý, KHÔNG phải chuẩn ngành, chỉ để có 1 con số so sánh nhanh
// giữa các nhà máy, không thay thế 9 chỉ số chi tiết bên dưới.
function compositeScore(v: CompRealValues): number | null {
  const parts: number[] = [];
  if (v.mtbf !== null) parts.push(clamp0to100((v.mtbf / 200) * 100));
  if (v.availability !== null) parts.push(clamp0to100(v.availability));
  if (v.repeat !== null) parts.push(clamp0to100(100 - v.repeat));
  if (v.breakdown !== null) parts.push(clamp0to100(100 - v.breakdown * 40));
  if (v.pmCompliance !== null) parts.push(clamp0to100(v.pmCompliance));
  return parts.length ? round1(parts.reduce((s, p) => s + p, 0) / parts.length) : null;
}

// Điểm tổng hợp theo TỪNG BUCKET — CHỈ gộp 4 chỉ số có lịch sử theo bucket (bỏ PM Compliance, vì
// chỉ số này chỉ có 1 giá trị hiện tại, không tách được theo tuần/tháng — xem computeUnitBucketTrends).
function compositeScoreTrend(t: CompBucketTrends): number[] {
  return t.mtbf.map((_, i) =>
    round1(
      (clamp0to100((t.mtbf[i] / 200) * 100) + clamp0to100(t.availability[i]) + clamp0to100(100 - t.repeat[i]) + clamp0to100(100 - t.breakdown[i] * 40)) / 4
    )
  );
}

function relDelta(curr: number | null, prev: number | null): number | null {
  if (curr === null || prev === null) return null;
  if (prev === 0) return curr === 0 ? 0 : null;
  return round1(((curr - prev) / prev) * 100);
}
function ptDelta(curr: number | null, prev: number | null): number | null {
  if (curr === null || prev === null) return null;
  return round1(curr - prev);
}
function avgNonNull(arr: (number | null)[]): number | null {
  const vals = arr.filter((v): v is number => v !== null);
  return vals.length ? round1(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
}

// 5 chỉ số thật hiện trong mini-grid của thẻ từng nhà máy — `isRel` = true nghĩa là % chênh lệch
// tính TƯƠNG ĐỐI (relDelta, đúng cách ảnh mẫu hiện %+12.5% cho MTBF/Breakdown vốn không phải %),
// false = chênh lệch ĐIỂM PHẦN TRĂM trực tiếp (ptDelta, đúng cho các chỉ số đã sẵn là % như
// Availability/Repeat Failure/PM Compliance).
const CARD_MINI_METRICS: { field: keyof CompRealValues; label: string; suffix: string; isRel: boolean }[] = [
  { field: 'mtbf', label: 'MTBF', suffix: 'h', isRel: true },
  { field: 'availability', label: 'Avail.', suffix: '%', isRel: false },
  { field: 'repeat', label: 'Repeat', suffix: '%', isRel: false },
  { field: 'breakdown', label: 'B.Down', suffix: '', isRel: true },
  { field: 'pmCompliance', label: 'PM Comp.', suffix: '%', isRel: false },
];

type CompMockValues = CompRealValues & { oee: number; pmEffectiveness: number; maintenanceCost: number; sparePartCost: number };

// Dữ liệu MẪU riêng cho trang so sánh — seed khác hẳn các mock đơn-nhà-máy phía trên để 2 chế độ
// xem không bị trùng dáng số liệu, chỉ dùng khi bật "Data Test".
function mockCompValues(seed: number): CompMockValues {
  const rand = seededRandom(200 + seed * 7);
  return {
    mtbf: round1(40 + rand() * 90),
    availability: round1(84 + rand() * 14),
    repeat: round1(4 + rand() * 22),
    breakdown: round1(0.3 + rand() * 1.6),
    pmCompliance: round1(55 + rand() * 40),
    oee: round1(50 + rand() * 35),
    pmEffectiveness: round1(15 + rand() * 45),
    maintenanceCost: Math.round(700000 + rand() * 1800000),
    sparePartCost: Math.round(8000000 + rand() * 45000000),
  };
}

// Xu hướng mẫu theo bucket — dáng hơi dốc lên theo thời gian (giống mockTrend ở trên) để nhìn Data
// Test có "diễn biến" thay vì phẳng lì, seed riêng theo từng đơn vị để 6 đường không trùng dáng.
function mockCompBucketTrends(buckets: Bucket[], seed: number): CompBucketTrends {
  const rand = seededRandom(300 + seed * 11);
  const n = buckets.length;
  const mtbf = buckets.map((_, i) => round1(40 + seed * 10 + (i / Math.max(1, n - 1)) * 20 + (rand() - 0.5) * 12));
  const availability = buckets.map((_, i) => round1(Math.min(99.5, 84 + seed * 1.5 + (i / Math.max(1, n - 1)) * 6 + (rand() - 0.5) * 4)));
  const repeat = buckets.map((_, i) => round1(Math.max(0, 20 - seed * 2 - (i / Math.max(1, n - 1)) * 5 + (rand() - 0.5) * 6)));
  const breakdown = buckets.map(() => round1(Math.max(0, 0.4 + seed * 0.2 + (rand() - 0.5) * 0.4)));
  return { mtbf, availability, repeat, breakdown };
}

// Cột so sánh 6 đơn vị cho 4 chỉ số CHƯA có dữ liệu thật (OEE/PM Effectiveness/Chi phí) — chỉ có
// số khi bật Data Test (items toàn null lúc tắt) nên hiện "Chưa đủ dữ liệu" thay vì 1 biểu đồ toàn
// cột 0, KHÔNG dùng component riêng vì chỉ 1 chỗ gọi lặp lại 4 lần.
// "Small multiples" — 6 mini-biểu-đồ đường RIÊNG từng nhà máy (1 màu/1 hình nhỏ) thay vì gộp
// chung 1 biểu đồ 6 đường chồng chéo cắt nhau (MultiLineComparisonChart) — 6 đường cùng màu sắc dễ
// lẫn/dễ rối khi cắt nhau liên tục, tách riêng mỗi nhà máy 1 ô nhỏ thì nhìn dáng xu hướng RÕ RÀNG
// hơn hẳn, đánh đổi là khó so trực tiếp 2 nhà máy tại đúng 1 mốc thời gian như kiểu chồng chung.
function UnitTrendGrid({ items, suffix }: { items: { key: string; label: string; color: string; series: number[] }[]; suffix: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {items.map((it) => {
        const latest = it.series.length ? it.series[it.series.length - 1] : null;
        const chartData = it.series.map((v, i) => ({ i, value: v }));
        const gradientId = `mini-fill-${it.key}`;
        return (
          <div key={it.key} className="rounded-lg bg-slate-50 px-2.5 py-2">
            <div className="flex items-center justify-between mb-1 gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: it.color }} /> {it.label}
              </span>
              <span className="text-xs font-extrabold text-slate-800 shrink-0">{latest === null ? '—' : `${latest}${suffix}`}</span>
            </div>
            {/* Có trục Y (vài mốc số) + đường kẻ ngang mờ để có "cột đo" tham chiếu — bản Sparkline
                trần trước đó không có mốc nào nên khó biết đường đang ở tầm giá trị bao nhiêu. */}
            <ResponsiveContainer width="100%" height={56}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={it.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={it.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <YAxis width={26} tickCount={3} tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="value" stroke={it.color} strokeWidth={1.75} fill={`url(#${gradientId})`} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}

// Chú thích nhỏ cho đường nét đứt "Kỳ trước" trên biểu đồ cột — mỗi đơn vị 1 điểm riêng (giá trị
// kỳ trước THẬT của chính đơn vị đó), nối lại thành 1 đường lên xuống, KHÔNG phải 1 mốc trung bình
// chung kẻ ngang qua tất cả các cột.
function PrevLineLegend() {
  return (
    <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] font-semibold text-slate-500">
      <svg width="16" height="8" className="shrink-0">
        <line x1="0" y1="4" x2="16" y2="4" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" />
      </svg>
      Kỳ trước (từng nhà máy)
    </div>
  );
}

function renderMockOnlyBar(
  items: { key: string; label: string; color: string; value: number | null }[],
  prevValues: (number | null)[],
  valueLabel: string
) {
  const hasValue = items.some((it) => it.value !== null);
  if (!hasValue) {
    return <div className="h-[240px] flex items-center justify-center text-xs text-slate-300 font-bold">Chưa đủ dữ liệu</div>;
  }
  return (
    <>
      <UnitBarChart
        data={items.map((it, i) => ({ label: it.label, value: it.value ?? 0, color: it.color, prevValue: prevValues[i] ?? undefined }))}
        valueLabel={valueLabel}
        height={240}
        showPrevLine
      />
      <PrevLineLegend />
    </>
  );
}

export default function KpiControlPage() {
  const scope = getCurrentMmtbScope();
  const detailScope: EquipmentScope = scope === 'ALL' ? 'KIEN_GIANG' : scope;

  const [granularity, setGranularity] = useState<'week' | 'month'>('month');
  const buckets = useMemo(() => (granularity === 'week' ? buildWeekBuckets(WEEK_BUCKET_COUNT) : buildMonthBuckets(MONTH_BUCKET_COUNT)), [granularity]);
  const rangeFrom = buckets[0]?.from;
  const rangeTo = buckets[buckets.length - 1]?.to;
  // Chữ hiển thị khoảng thời gian đang xem — CHỈ hiển thị, không bấm chọn được (tự tính theo bucket).
  const rangeLabel = granularity === 'month' ? `Tháng ${buckets[0]?.label.replace('Th', '')} → Tháng ${buckets[buckets.length - 1]?.label.replace('Th', '')}` : `${buckets[0]?.label} → ${buckets[buckets.length - 1]?.label}`;

  // Kỳ liền trước (cùng độ dài, ngay trước khoảng đang xem) — chỉ để tính đường trung bình nét đứt
  // tham chiếu trên các biểu đồ đường, không hiện lên bất kỳ chỗ nào khác.
  const prevRangeFrom = useMemo(() => {
    if (!rangeFrom || !rangeTo) return '';
    const from = new Date(`${rangeFrom}T00:00:00Z`);
    const to = new Date(`${rangeTo}T00:00:00Z`);
    const lengthDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    const prevTo = new Date(from.getTime() - 86400000);
    const prevFrom = new Date(prevTo.getTime() - (lengthDays - 1) * 86400000);
    return isoDate(prevFrom);
  }, [rangeFrom, rangeTo]);
  const prevRangeTo = useMemo(() => {
    if (!rangeFrom) return '';
    return isoDate(new Date(new Date(`${rangeFrom}T00:00:00Z`).getTime() - 86400000));
  }, [rangeFrom]);

  const [rawIncidents, setRawIncidents] = useState<KpiIncident[]>([]);
  const [prevRawIncidents, setPrevRawIncidents] = useState<KpiIncident[]>([]);
  const [rawMachines, setRawMachines] = useState<MachineRow[]>([]);
  const [rawScheduleMachines, setRawScheduleMachines] = useState<ScheduleMachineRow[]>([]);
  const [verifiedCodes, setVerifiedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ scope: detailScope, dateFrom: rangeFrom, dateTo: rangeTo });
    const prevQs = new URLSearchParams({ scope: detailScope, dateFrom: prevRangeFrom, dateTo: prevRangeTo });
    Promise.allSettled([
      fetch(`/api/maintenance/overview-report?${qs}`).then((r) => r.json()),
      fetch(`/api/maintenance/machines?scope=${detailScope}`).then((r) => r.json()),
      fetch(`/api/maintenance/schedule?scope=${detailScope}`).then((r) => r.json()),
      fetch(`/api/maintenance/inventory-log?scope=${detailScope}`).then((r) => r.json()),
      fetch(`/api/maintenance/overview-report?${prevQs}`).then((r) => r.json()),
    ]).then(([incRes, machRes, schedRes, invRes, prevIncRes]) => {
      if (cancelled) return;
      if (incRes.status === 'fulfilled' && incRes.value?.success) setRawIncidents(incRes.value.incidents || []);
      if (machRes.status === 'fulfilled' && machRes.value?.success) setRawMachines(machRes.value.data || []);
      if (schedRes.status === 'fulfilled' && schedRes.value?.success) setRawScheduleMachines(schedRes.value.machines || []);
      if (invRes.status === 'fulfilled' && invRes.value?.success && Array.isArray(invRes.value.rows)) {
        const codes = new Set<string>((invRes.value.rows as InventoryRow[]).map((r) => r.machine?.code).filter(Boolean) as string[]);
        setVerifiedCodes(codes);
      }
      if (prevIncRes.status === 'fulfilled' && prevIncRes.value?.success) setPrevRawIncidents(prevIncRes.value.incidents || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [detailScope, rangeFrom, rangeTo, prevRangeFrom, prevRangeTo]);

  // Chỉ tính MÁY ĐÃ KIỂM KÊ (xuất hiện ≥1 lần trong nhật ký Kiểm Kê) — khớp đúng cách trang "Danh
  // Sách MMTB" đang lọc, không tính toàn bộ máy trong hệ thống (tránh lẫn dữ liệu chưa xác thực).
  const machines = useMemo(() => rawMachines.filter((m) => verifiedCodes.has(m.code)), [rawMachines, verifiedCodes]);
  const scheduleMachines = useMemo(() => rawScheduleMachines.filter((m) => verifiedCodes.has(m.code)), [rawScheduleMachines, verifiedCodes]);
  const incidents = useMemo(() => rawIncidents.filter((i) => verifiedCodes.has(i.machineCode)), [rawIncidents, verifiedCodes]);
  const prevIncidents = useMemo(() => prevRawIncidents.filter((i) => verifiedCodes.has(i.machineCode)), [prevRawIncidents, verifiedCodes]);

  // Bucket của KỲ LIỀN TRƯỚC — mỗi bucket dịch lùi ĐÚNG bằng tổng độ dài cả khoảng đang xem, khớp
  // 1-1 với từng bucket hiện tại (bucket đầu <-> bucket đầu kỳ trước, ...) để vẽ được 1 đường xu
  // hướng thật (lên xuống theo đúng dữ liệu), không phải 1 mức trung bình phẳng.
  const prevBuckets = useMemo(() => {
    if (!rangeFrom || !rangeTo) return [] as Bucket[];
    const totalWindowDays = Math.round((new Date(`${rangeTo}T00:00:00Z`).getTime() - new Date(`${rangeFrom}T00:00:00Z`).getTime()) / 86400000) + 1;
    return buckets.map((b) => {
      const shiftedFrom = new Date(new Date(`${b.from}T00:00:00Z`).getTime() - totalWindowDays * 86400000);
      const shiftedTo = new Date(new Date(`${b.to}T00:00:00Z`).getTime() - totalWindowDays * 86400000);
      return { label: b.label, from: isoDate(shiftedFrom), to: isoDate(shiftedTo) };
    });
  }, [buckets, rangeFrom, rangeTo]);

  // ---- Xu hướng KỲ LIỀN TRƯỚC theo từng bucket (khớp 1-1 với bucket hiện tại) — chỉ dùng để vẽ
  // đường nét đứt tham chiếu trên biểu đồ, KHÔNG hiện ở nơi nào khác. ----
  const prevMtbfTrend = useMemo(() => {
    return prevBuckets.map((b) => {
      const bucketIncidents = prevIncidents.filter((i) => inBucket(i.createdAt, b));
      const byMachine = new Map<string, number[]>();
      for (const i of bucketIncidents) {
        if (!byMachine.has(i.machineCode)) byMachine.set(i.machineCode, []);
        byMachine.get(i.machineCode)!.push(new Date(i.createdAt).getTime());
      }
      const gaps: number[] = [];
      for (const times of byMachine.values()) {
        if (times.length < 2) continue;
        const sorted = [...times].sort((a, b2) => a - b2);
        for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] - sorted[i - 1]) / 3600000);
      }
      return gaps.length ? round1(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;
    });
  }, [prevBuckets, prevIncidents]);

  const prevRepeatTrend = useMemo(() => {
    const groups = new Map<string, { id: string; time: number }[]>();
    for (const i of prevIncidents) {
      if (!i.categoryName) continue;
      const key = `${i.machineCode}__${i.categoryName}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ id: i.id, time: new Date(i.createdAt).getTime() });
    }
    const repeatIds = new Set<string>();
    for (const items of groups.values()) {
      const sorted = [...items].sort((a, b) => a.time - b.time);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].time - sorted[i - 1].time <= REPEAT_WINDOW_MS) repeatIds.add(sorted[i].id);
      }
    }
    return prevBuckets.map((b) => {
      const bucketIncidents = prevIncidents.filter((i) => inBucket(i.createdAt, b));
      if (bucketIncidents.length === 0) return 0;
      const repeatInBucket = bucketIncidents.filter((i) => repeatIds.has(i.id)).length;
      return round1((repeatInBucket / bucketIncidents.length) * 100);
    });
  }, [prevBuckets, prevIncidents]);

  const prevBreakdownTrend = useMemo(() => {
    if (!machines.length) return prevBuckets.map(() => 0);
    return prevBuckets.map((b) => round1(prevIncidents.filter((i) => inBucket(i.createdAt, b)).length / machines.length));
  }, [prevBuckets, prevIncidents, machines]);

  const prevAvailabilityTrend = useMemo(() => {
    if (!machines.length) return prevBuckets.map(() => 0);
    return prevBuckets.map((b) => {
      const bucketIncidents = prevIncidents.filter((i) => inBucket(i.createdAt, b));
      const totalDowntimeMin = bucketIncidents.reduce((s, i) => (i.completedAt ? s + minutesBetween(i.createdAt, i.completedAt) : s), 0);
      const periodDays = Math.round((new Date(`${b.to}T00:00:00Z`).getTime() - new Date(`${b.from}T00:00:00Z`).getTime()) / 86400000) + 1;
      const denom = periodDays * 24 * 60 * machines.length;
      const pct = denom > 0 ? Math.max(0, Math.min(100, (1 - totalDowntimeMin / denom) * 100)) : 0;
      return round1(pct);
    });
  }, [prevBuckets, prevIncidents, machines]);

  // ---- MTBF (ước lượng) theo từng bucket (tuần/tháng) ----
  const mtbfTrendResult = useMemo(() => {
    const perBucket = buckets.map((b) => {
      const bucketIncidents = incidents.filter((i) => inBucket(i.createdAt, b));
      const byMachine = new Map<string, number[]>();
      for (const i of bucketIncidents) {
        if (!byMachine.has(i.machineCode)) byMachine.set(i.machineCode, []);
        byMachine.get(i.machineCode)!.push(new Date(i.createdAt).getTime());
      }
      const gaps: number[] = [];
      for (const times of byMachine.values()) {
        if (times.length < 2) continue;
        const sorted = [...times].sort((a, b2) => a - b2);
        for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] - sorted[i - 1]) / 3600000);
      }
      return gaps.length ? round1(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;
    });
    if (perBucket.every((v) => v === 0)) return null;

    // Top 5 máy MTBF thấp nhất — tính trên TOÀN BỘ khoảng đang xem (không tách theo bucket).
    const byMachineAll = new Map<string, { name: string; times: number[] }>();
    for (const i of incidents) {
      if (!byMachineAll.has(i.machineCode)) byMachineAll.set(i.machineCode, { name: i.machineName, times: [] });
      byMachineAll.get(i.machineCode)!.times.push(new Date(i.createdAt).getTime());
    }
    const perMachine: { name: string; avgGapHours: number }[] = [];
    for (const v of byMachineAll.values()) {
      if (v.times.length < 2) continue;
      const sorted = [...v.times].sort((a, b) => a - b);
      const gaps: number[] = [];
      for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] - sorted[i - 1]) / 3600000);
      perMachine.push({ name: v.name, avgGapHours: gaps.reduce((s, g) => s + g, 0) / gaps.length });
    }
    const worst = perMachine.sort((a, b) => a.avgGapHours - b.avgGapHours).slice(0, 3);
    return { trend: buckets.map((b, idx) => ({ label: b.label, value: perBucket[idx] })), worst };
  }, [buckets, incidents]);

  // ---- Availability (ước lượng) theo từng bucket ----
  const availabilityTrendResult = useMemo(() => {
    if (!machines.length) return null;
    const trend = buckets.map((b) => {
      const bucketIncidents = incidents.filter((i) => inBucket(i.createdAt, b));
      const totalDowntimeMin = bucketIncidents.reduce((s, i) => (i.completedAt ? s + minutesBetween(i.createdAt, i.completedAt) : s), 0);
      const periodDays = Math.round((new Date(`${b.to}T00:00:00Z`).getTime() - new Date(`${b.from}T00:00:00Z`).getTime()) / 86400000) + 1;
      const denom = periodDays * 24 * 60 * machines.length;
      const pct = denom > 0 ? Math.max(0, Math.min(100, (1 - totalDowntimeMin / denom) * 100)) : 0;
      return { label: b.label, value: round1(pct) };
    });
    return { trend, machineCount: machines.length };
  }, [buckets, incidents, machines]);

  // ---- Repeat Failure — tính cờ "lặp lại" trên TOÀN khoảng đang xem, rồi gộp theo bucket của lần
  // xảy ra SAU (lần được tính là lặp lại) để vẽ xu hướng theo tuần/tháng. ----
  const repeatFailureTrendResult = useMemo(() => {
    if (incidents.length === 0) return null;
    const groups = new Map<string, { code: string; name: string; items: { id: string; time: number }[] }>();
    for (const i of incidents) {
      if (!i.categoryName) continue;
      const key = `${i.machineCode}__${i.categoryName}`;
      if (!groups.has(key)) groups.set(key, { code: i.machineCode, name: i.machineName, items: [] });
      groups.get(key)!.items.push({ id: i.id, time: new Date(i.createdAt).getTime() });
    }
    const repeatIncidentIds = new Set<string>();
    const perMachineRepeat = new Map<string, { name: string; count: number }>();
    for (const g of groups.values()) {
      const sorted = [...g.items].sort((a, b) => a.time - b.time);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].time - sorted[i - 1].time <= REPEAT_WINDOW_MS) {
          repeatIncidentIds.add(sorted[i].id);
          const cur = perMachineRepeat.get(g.code);
          if (cur) cur.count++;
          else perMachineRepeat.set(g.code, { name: g.name, count: 1 });
        }
      }
    }
    const trend = buckets.map((b) => {
      const bucketIncidents = incidents.filter((i) => inBucket(i.createdAt, b));
      if (bucketIncidents.length === 0) return { label: b.label, value: 0 };
      const repeatInBucket = bucketIncidents.filter((i) => repeatIncidentIds.has(i.id)).length;
      return { label: b.label, value: round1((repeatInBucket / bucketIncidents.length) * 100) };
    });
    const worst = Array.from(perMachineRepeat, ([, v]) => v).sort((a, b) => b.count - a.count).slice(0, 4);
    return { trend, repeatCount: repeatIncidentIds.size, total: incidents.length, worst };
  }, [buckets, incidents]);

  // ---- Breakdown Rate theo từng bucket ----
  const breakdownRateTrendResult = useMemo(() => {
    if (!machines.length) return null;
    const trend = buckets.map((b) => {
      const count = incidents.filter((i) => inBucket(i.createdAt, b)).length;
      return { label: b.label, value: round1(count / machines.length) };
    });
    return { trend, totalIncidents: incidents.length, machineCount: machines.length };
  }, [buckets, incidents, machines]);

  // PM Compliance — CHỈ 1 thời điểm hiện tại (trạng thái lịch bảo trì snapshot), không có lịch sử
  // theo tuần/tháng để vẽ xu hướng.
  const pmComplianceResult = useMemo(() => {
    const scheduled = scheduleMachines.filter((m) => m.status !== 'unscheduled');
    if (scheduled.length === 0) return null;
    const compliant = scheduled.filter((m) => m.status !== 'overdue');
    const pct = round1((compliant.length / scheduled.length) * 100);
    const overdueList = scheduled.filter((m) => m.status === 'overdue').slice(0, 4);
    return { pct, scheduledCount: scheduled.length, compliantCount: compliant.length, overdueList };
  }, [scheduleMachines]);

  // ---- Dữ liệu GIẢ LẬP cho "Data Test" — chỉ dùng để xem giao diện, không đụng dữ liệu thật ----
  const mockMtbf = useMemo(() => ({ trend: mockTrend(buckets, 60, 50, 11), worst: [{ name: 'Máy May Lập Trình (mẫu)', avgGapHours: 18 }, { name: 'Máy Cắt (mẫu)', avgGapHours: 26 }, { name: 'Máy Ép (mẫu)', avgGapHours: 34 }] }), [buckets]);
  const mockAvailability = useMemo(() => ({ trend: mockTrend(buckets, 92, 10, 23), machineCount: 120 }), [buckets]);
  const mockRepeat = useMemo(() => ({ trend: mockTrend(buckets, 15, 12, 37), repeatCount: 34, total: 220, worst: [{ name: 'Máy May Lập Trình (mẫu)', count: 6 }, { name: 'Máy Cắt (mẫu)', count: 4 }] }), [buckets]);
  const mockBreakdown = useMemo(() => ({ trend: mockTrend(buckets, 0.15, 0.12, 47), totalIncidents: 220, machineCount: 120 }), [buckets]);
  const mockPmCompliance = useMemo(() => ({ pct: 84.5, scheduledCount: 96, compliantCount: 81, overdueList: [{ id: '1', code: 'x', name: 'Máy May 1 Kim (mẫu)', status: 'overdue' as const }, { id: '2', code: 'y', name: 'Máy Ép Đế (mẫu)', status: 'overdue' as const }] }), []);
  // Mẫu cho 3 chỉ số "Chưa đủ dữ liệu" — CHỈ hiện khi bật Data Test, để xem giao diện đầy đủ; tắt
  // Data Test vẫn về đúng "Chưa đủ dữ liệu" như thật (hệ thống không có dữ liệu thật cho 3 chỉ số này).
  const mockPmEffectiveness = useMemo(() => ({ trend: mockTrend(buckets, 42, 14, 59), before: 18, after: 10 }), [buckets]);
  const mockMaintenanceCost = useMemo(() => ({ trend: mockTrend(buckets, 1250000, 300000, 71), labor: 62, parts: 38 }), [buckets]);
  const mockSparePartCost = useMemo(
    () => ({
      total: 45200000,
      top: [
        { name: 'Kim máy may (mẫu)', cost: 8500000 },
        { name: 'Dây curoa (mẫu)', cost: 6200000 },
        { name: 'Vòng bi (mẫu)', cost: 5100000 },
      ],
    }),
    []
  );

  const effMtbf = testMode ? mockMtbf : mtbfTrendResult;
  const effAvailability = testMode ? mockAvailability : availabilityTrendResult;
  const effRepeat = testMode ? mockRepeat : repeatFailureTrendResult;
  const effBreakdown = testMode ? mockBreakdown : breakdownRateTrendResult;
  const effPmCompliance = testMode ? mockPmCompliance : pmComplianceResult;

  // Xu hướng kỳ liền trước (1 giá trị / bucket) dùng cho đường nét đứt tham chiếu — Data Test dùng
  // dáng mẫu (mockTrend với seed khác), còn lại dùng đúng số thật tính từ kỳ trước đó.
  const mockMtbfPrevTrend = useMemo(() => mockTrend(buckets, 52, 40, 91).map((d) => d.value), [buckets]);
  const mockAvailabilityPrevTrend = useMemo(() => mockTrend(buckets, 88, 8, 93).map((d) => d.value), [buckets]);
  const mockRepeatPrevTrend = useMemo(() => mockTrend(buckets, 18, 10, 95).map((d) => d.value), [buckets]);
  const mockBreakdownPrevTrend = useMemo(() => mockTrend(buckets, 0.17, 0.1, 97).map((d) => d.value), [buckets]);
  const mockPmEffectivenessPrevTrend = useMemo(() => mockTrend(buckets, 34, 12, 99).map((d) => d.value), [buckets]);
  const mockMaintenanceCostPrevTrend = useMemo(() => mockTrend(buckets, 1150, 250, 101).map((d) => d.value), [buckets]); // đơn vị nghìn đồng, khớp thang trục biểu đồ đang chia /1000

  const effMtbfPrevTrend = testMode ? mockMtbfPrevTrend : prevMtbfTrend;
  const effAvailabilityPrevTrend = testMode ? mockAvailabilityPrevTrend : prevAvailabilityTrend;
  const effRepeatPrevTrend = testMode ? mockRepeatPrevTrend : prevRepeatTrend;
  const effBreakdownPrevTrend = testMode ? mockBreakdownPrevTrend : prevBreakdownTrend;
  // "Tháng này"/"Tuần này" trong chú thích — khớp đúng đơn vị đang chọn ở nút Theo Tuần/Theo Tháng.
  const periodLabel = granularity === 'week' ? 'Tuần này' : 'Tháng này';

  // OEE = Availability × Performance × Quality — CHỈ tính (bằng số liệu mẫu) khi bật Data Test, vì
  // hệ thống không có dữ liệu Performance/Quality thật — tắt Data Test luôn hiện "Chưa đủ dữ liệu".
  const mockOeePerformance = 78.4;
  const mockOeeQuality = 95.2;
  const oeeAvailabilityPct = effAvailability ? effAvailability.trend[effAvailability.trend.length - 1].value : 0;
  const oeePct = testMode ? round1((oeeAvailabilityPct * mockOeePerformance * mockOeeQuality) / 10000) : null;

  const fmtHoursAsDays = (hours: number) => {
    const days = hours / 24;
    return days >= 1 ? `${round1(days)} ngày` : `${round1(hours)} giờ`;
  };

  // ────────────────────────────────────────────────────────────────────────
  // SO SÁNH KPI GIỮA CÁC NHÀ MÁY — CHỈ tải khi scope=ALL (xem KpiCompareSection ở trên). Tái dùng
  // granularity/buckets/rangeFrom/rangeTo/testMode đã khai báo phía trên (dùng chung 1 bộ điều
  // khiển cho cả 2 chế độ xem, không tạo state trùng lặp).
  // ────────────────────────────────────────────────────────────────────────
  const [compFactoryIds, setCompFactoryIds] = useState<Record<string, string>>({});
  const [compScopeRaw, setCompScopeRaw] = useState<Record<'KIEN_GIANG' | 'EAST' | 'OFFICE', { machines: any[]; schedule: ScheduleMachineRow[]; verified: Set<string> }>>({
    KIEN_GIANG: { machines: [], schedule: [], verified: new Set() },
    EAST: { machines: [], schedule: [], verified: new Set() },
    OFFICE: { machines: [], schedule: [], verified: new Set() },
  });
  const [compUnitIncidents, setCompUnitIncidents] = useState<Record<CompUnitKey, KpiIncident[]>>({
    KG1: [], KG2: [], KG3: [], HTD: [], EAST: [], OFFICE: [],
  });
  // Sự cố KỲ LIỀN TRƯỚC theo từng đơn vị — CHỈ dùng để tính "% so với kỳ trước" trên thẻ/biểu đồ
  // tổng quan mới (không hiện ở đâu khác) — tái dùng prevRangeFrom/prevRangeTo đã tính sẵn ở trên.
  const [compUnitPrevIncidents, setCompUnitPrevIncidents] = useState<Record<CompUnitKey, KpiIncident[]>>({
    KG1: [], KG2: [], KG3: [], HTD: [], EAST: [], OFFICE: [],
  });
  const [compLoading, setCompLoading] = useState(true);

  // Tra factoryId THẬT của 4 nhà máy con KG1/KG2/KG3/HTĐ — chỉ 1 lượt gọi, không lặp lại theo scope
  // (luôn tra trong Tổ Hợp Kiên Giang, giống compUnits ở trang Tổng Quan).
  useEffect(() => {
    if (scope !== 'ALL') return;
    fetch('/api/maintenance/categories?type=FACTORY&scope=KIEN_GIANG')
      .then((r) => r.json())
      .then((res) => {
        if (!res.success || !Array.isArray(res.data)) return;
        const map: Record<string, string> = {};
        for (const f of res.data) map[String(f.name).trim()] = f.id;
        setCompFactoryIds(map);
      });
  }, [scope]);

  const compUnits = useMemo(
    () => KPI_COMPARE_UNITS.map((u) => ({ ...u, factoryId: u.factoryNameMatch ? compFactoryIds[u.factoryNameMatch] || null : null })),
    [compFactoryIds]
  );

  // Tải máy/lịch bảo trì/kiểm kê theo TỪNG SCOPE gốc (Kiên Giang dùng chung cho cả 4 đơn vị con,
  // lọc lại theo factoryId ở dưới) + sự cố theo TỪNG ĐƠN VỊ (factoryId riêng cho 4 đơn vị KG, không
  // cần cho Miền Đông/Văn Phòng Chuỗi) — chạy song song, khớp đúng cách trang Tổng Quan đang tải
  // compData.
  useEffect(() => {
    if (scope !== 'ALL') return;
    const kgReady = compUnits.filter((u) => u.factoryNameMatch).every((u) => u.factoryId);
    if (!kgReady || !rangeFrom || !rangeTo) return;
    setCompLoading(true);
    const baseScopes: Array<'KIEN_GIANG' | 'EAST' | 'OFFICE'> = ['KIEN_GIANG', 'EAST', 'OFFICE'];
    Promise.allSettled([
      ...baseScopes.map((s) => fetch(`/api/maintenance/machines?scope=${s}`).then((r) => r.json())),
      ...baseScopes.map((s) => fetch(`/api/maintenance/schedule?scope=${s}`).then((r) => r.json())),
      ...baseScopes.map((s) => fetch(`/api/maintenance/inventory-log?scope=${s}`).then((r) => r.json())),
      ...compUnits.map((u) => {
        const qs = new URLSearchParams({ scope: u.scope, dateFrom: rangeFrom, dateTo: rangeTo });
        if (u.factoryId) qs.set('factoryId', u.factoryId);
        return fetch(`/api/maintenance/overview-report?${qs}`).then((r) => r.json());
      }),
      ...compUnits.map((u) => {
        const qs = new URLSearchParams({ scope: u.scope, dateFrom: prevRangeFrom, dateTo: prevRangeTo });
        if (u.factoryId) qs.set('factoryId', u.factoryId);
        return fetch(`/api/maintenance/overview-report?${qs}`).then((r) => r.json());
      }),
    ]).then((results) => {
      const machinesRes = results.slice(0, 3);
      const scheduleRes = results.slice(3, 6);
      const invRes = results.slice(6, 9);
      const incidentsRes = results.slice(9, 9 + compUnits.length);
      const prevIncidentsRes = results.slice(9 + compUnits.length, 9 + compUnits.length * 2);
      const nextScopeRaw = { KIEN_GIANG: compScopeRaw.KIEN_GIANG, EAST: compScopeRaw.EAST, OFFICE: compScopeRaw.OFFICE };
      baseScopes.forEach((s, i) => {
        const m = machinesRes[i];
        const sc = scheduleRes[i];
        const inv = invRes[i];
        const machines = m.status === 'fulfilled' && (m.value as any)?.success ? (m.value as any).data || [] : [];
        const schedule = sc.status === 'fulfilled' && (sc.value as any)?.success ? (sc.value as any).machines || [] : [];
        const verified =
          inv.status === 'fulfilled' && (inv.value as any)?.success && Array.isArray((inv.value as any).rows)
            ? new Set<string>(((inv.value as any).rows as InventoryRow[]).map((r) => r.machine?.code).filter(Boolean) as string[])
            : new Set<string>();
        nextScopeRaw[s] = { machines, schedule, verified };
      });
      setCompScopeRaw(nextScopeRaw);
      const nextIncidents = {} as Record<CompUnitKey, KpiIncident[]>;
      const nextPrevIncidents = {} as Record<CompUnitKey, KpiIncident[]>;
      compUnits.forEach((u, i) => {
        const r = incidentsRes[i];
        nextIncidents[u.key] = r.status === 'fulfilled' && (r.value as any)?.success ? (r.value as any).incidents || [] : [];
        const pr = prevIncidentsRes[i];
        nextPrevIncidents[u.key] = pr.status === 'fulfilled' && (pr.value as any)?.success ? (pr.value as any).incidents || [] : [];
      });
      setCompUnitIncidents(nextIncidents);
      setCompUnitPrevIncidents(nextPrevIncidents);
      setCompLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, compUnits, rangeFrom, rangeTo, prevRangeFrom, prevRangeTo]);

  // Lọc máy/lịch bảo trì THEO TỪNG ĐƠN VỊ (factoryId, chỉ áp dụng cho 4 đơn vị KG — Miền Đông/Văn
  // Phòng Chuỗi lấy nguyên scope) + CHỈ tính máy đã kiểm kê (khớp cách trang này đang lọc ở trên).
  const compUnitMachineCounts = useMemo(() => {
    const result = {} as Record<CompUnitKey, number>;
    compUnits.forEach((u) => {
      const raw = compScopeRaw[u.scope as 'KIEN_GIANG' | 'EAST' | 'OFFICE'];
      const filtered = raw.machines.filter((m: any) => raw.verified.has(m.code) && (u.factoryId ? m.factoryId === u.factoryId : true));
      result[u.key] = filtered.length;
    });
    return result;
  }, [compUnits, compScopeRaw]);

  const compUnitSchedule = useMemo(() => {
    const result = {} as Record<CompUnitKey, ScheduleMachineRow[]>;
    const kgCodeToFactory = new Map<string, string | null>();
    for (const m of compScopeRaw.KIEN_GIANG.machines as any[]) kgCodeToFactory.set(m.code, m.factoryId ?? null);
    compUnits.forEach((u) => {
      const raw = compScopeRaw[u.scope as 'KIEN_GIANG' | 'EAST' | 'OFFICE'];
      result[u.key] = raw.schedule.filter((m) => raw.verified.has(m.code) && (u.factoryId ? kgCodeToFactory.get(m.code) === u.factoryId : true));
    });
    return result;
  }, [compUnits, compScopeRaw]);

  const compRealValues = useMemo(() => {
    const result = {} as Record<CompUnitKey, CompRealValues>;
    compUnits.forEach((u) => {
      const raw = compScopeRaw[u.scope as 'KIEN_GIANG' | 'EAST' | 'OFFICE'];
      const incidents = (compUnitIncidents[u.key] || []).filter((i) => raw.verified.has(i.machineCode));
      result[u.key] = computeUnitReal(incidents, compUnitMachineCounts[u.key] || 0, compUnitSchedule[u.key] || [], rangeFrom, rangeTo);
    });
    return result;
  }, [compUnits, compUnitIncidents, compUnitMachineCounts, compUnitSchedule, compScopeRaw, rangeFrom, rangeTo]);

  // Kỳ liền trước — CÙNG máy/lịch bảo trì hiện tại (coi như gần như không đổi giữa 2 kỳ, khớp đúng
  // cách prevMtbfTrend/prevAvailabilityTrend... ở trên cũng tái dùng chung `machines`), chỉ khác sự
  // cố lấy từ compUnitPrevIncidents. CHỈ dùng để tính "% so với kỳ trước" trên phần Tổng Quan mới.
  const compPrevRealValues = useMemo(() => {
    const result = {} as Record<CompUnitKey, CompRealValues>;
    compUnits.forEach((u) => {
      const raw = compScopeRaw[u.scope as 'KIEN_GIANG' | 'EAST' | 'OFFICE'];
      const incidents = (compUnitPrevIncidents[u.key] || []).filter((i) => raw.verified.has(i.machineCode));
      result[u.key] = computeUnitReal(incidents, compUnitMachineCounts[u.key] || 0, compUnitSchedule[u.key] || [], prevRangeFrom, prevRangeTo);
    });
    return result;
  }, [compUnits, compUnitPrevIncidents, compUnitMachineCounts, compUnitSchedule, compScopeRaw, prevRangeFrom, prevRangeTo]);

  const compBucketTrends = useMemo(() => {
    const result = {} as Record<CompUnitKey, CompBucketTrends>;
    compUnits.forEach((u) => {
      const raw = compScopeRaw[u.scope as 'KIEN_GIANG' | 'EAST' | 'OFFICE'];
      const incidents = (compUnitIncidents[u.key] || []).filter((i) => raw.verified.has(i.machineCode));
      result[u.key] = computeUnitBucketTrends(incidents, compUnitMachineCounts[u.key] || 0, buckets);
    });
    return result;
  }, [compUnits, compUnitIncidents, compUnitMachineCounts, compScopeRaw, buckets]);

  const compMockValues = useMemo(() => {
    const result = {} as Record<CompUnitKey, CompMockValues>;
    compUnits.forEach((u, idx) => { result[u.key] = mockCompValues(idx); });
    return result;
  }, [compUnits]);

  // Mock kỳ trước — seed lệch hẳn so với mock kỳ này (idx+50) để % so kỳ trước ở Data Test có lên
  // có xuống, không phải lúc nào cũng +/- giống hệt nhau.
  const compMockPrevValues = useMemo(() => {
    const result = {} as Record<CompUnitKey, CompMockValues>;
    compUnits.forEach((u, idx) => { result[u.key] = mockCompValues(idx + 50); });
    return result;
  }, [compUnits]);

  const compMockBucketTrends = useMemo(() => {
    const result = {} as Record<CompUnitKey, CompBucketTrends>;
    compUnits.forEach((u, idx) => { result[u.key] = mockCompBucketTrends(buckets, idx); });
    return result;
  }, [compUnits, buckets]);

  function compValue(key: CompUnitKey, field: keyof CompRealValues): number | null {
    return testMode ? compMockValues[key]?.[field] ?? null : compRealValues[key]?.[field] ?? null;
  }
  function compPrevValue(key: CompUnitKey, field: keyof CompRealValues): number | null {
    return testMode ? compMockPrevValues[key]?.[field] ?? null : compPrevRealValues[key]?.[field] ?? null;
  }
  function compMockOnlyValue(key: CompUnitKey, field: 'oee' | 'pmEffectiveness' | 'maintenanceCost' | 'sparePartCost'): number | null {
    return testMode ? compMockValues[key]?.[field] ?? null : null;
  }
  const compItems = (field: keyof CompRealValues) => compUnits.map((u) => ({ key: u.key, label: u.label, color: u.color, value: compValue(u.key, field) }));
  const compMockOnlyItems = (field: 'oee' | 'pmEffectiveness' | 'maintenanceCost' | 'sparePartCost') =>
    compUnits.map((u) => ({ key: u.key, label: u.label, color: u.color, value: compMockOnlyValue(u.key, field) }));

  // "Tổng Điểm Đánh Giá" — gộp 5 chỉ số thật (xem compositeScore) cho TỪNG đơn vị, kỳ này/kỳ trước
  // (tính % chênh lệch) + xu hướng theo bucket (bỏ PM Compliance, xem compositeScoreTrend).
  function compScore(key: CompUnitKey): number | null {
    const v = testMode ? compMockValues[key] : compRealValues[key];
    return v ? compositeScore(v) : null;
  }
  function compPrevScore(key: CompUnitKey): number | null {
    const v = testMode ? compMockPrevValues[key] : compPrevRealValues[key];
    return v ? compositeScore(v) : null;
  }
  function compScoreTrendOf(key: CompUnitKey): number[] {
    const t = testMode ? compMockBucketTrends[key] : compBucketTrends[key];
    return t ? compositeScoreTrend(t) : [];
  }

  return (
    <MaintenanceShell title="KPI Kiểm Soát" subtitle={scope === 'ALL' ? 'So sánh chỉ số KPI giữa các nhà máy' : 'Các chỉ số kiểm soát khi số hoá MMTB'}>
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-[#1e4d8c] to-[#2f74c4] rounded-xl p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              {scope === 'ALL' ? <IconBuildingFactory size={26} className="text-white" /> : <IconGauge size={26} className="text-white" />}
            </div>
            <div>
              {scope === 'ALL' ? (
                <>
                  <h1 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wide">So Sánh KPI Giữa Các Nhà Máy</h1>
                  <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-0.5">Đối chiếu các chỉ số kiểm soát giữa 6 đơn vị, chỉ tính máy đã kiểm kê</p>
                </>
              ) : (
                <>
                  <h1 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wide">KPI Kiểm Soát Khi Số Hoá</h1>
                  <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-0.5">MTTA/MTTR và Downtime đã xem ở tab Tổng Quan — trang này chỉ hiện các chỉ số còn lại, chỉ tính máy đã kiểm kê</p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-white bg-white/10 border border-white/30 rounded-lg px-3 py-2 h-[34px] flex items-center">{rangeLabel}</span>
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 border border-white/30">
              <button
                onClick={() => setGranularity('week')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${granularity === 'week' ? 'bg-white text-[#1e4d8c]' : 'text-white/80'}`}
              >
                Theo Tuần
              </button>
              <button
                onClick={() => setGranularity('month')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${granularity === 'month' ? 'bg-white text-[#1e4d8c]' : 'text-white/80'}`}
              >
                Theo Tháng
              </button>
            </div>
            <button
              onClick={() => setTestMode((v) => !v)}
              title="Bật/tắt dữ liệu mẫu để test giao diện — không phải dữ liệu thật"
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold h-[34px] shrink-0 cursor-pointer border ${
                testMode ? 'bg-amber-400 text-amber-950 border-amber-400 hover:bg-amber-300' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
              }`}
            >
              <IconFlask size={14} /> {testMode ? 'Đang xem dữ liệu mẫu' : 'Data Test'}
            </button>
          </div>
        </div>

        {scope === 'ALL' ? (
          compLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Đang tải dữ liệu so sánh...</div>
          ) : (
            <>
              {/* 6 THẺ NHÀ MÁY — Tổng Điểm Đánh Giá (gộp 5 chỉ số thật, xem compositeScore) + xu
                  hướng nhỏ + mini 5 chỉ số kèm % so kỳ trước, theo đúng bố cục ảnh mẫu. */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                {compUnits.map((u) => {
                  const score = compScore(u.key);
                  const prevScore = compPrevScore(u.key);
                  const scoreDelta = ptDelta(score, prevScore);
                  const trend = compScoreTrendOf(u.key);
                  return (
                    <div key={u.key} className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: u.color }}>
                          <u.icon size={22} className="text-white" />
                        </div>
                        <span className="text-base font-extrabold text-slate-800 truncate">{u.label}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tổng điểm đánh giá</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-3xl font-extrabold text-slate-900">{score === null ? '—' : `${score}%`}</span>
                        <DeltaTag pct={scoreDelta} />
                      </div>
                      <div className="h-9 mt-1.5">
                        <Sparkline data={trend.map((v) => ({ value: v }))} color={u.color} height={36} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                        {CARD_MINI_METRICS.map((m, idx) => {
                          const v = compValue(u.key, m.field);
                          const pv = compPrevValue(u.key, m.field);
                          const d = m.isRel ? relDelta(v, pv) : ptDelta(v, pv);
                          // 5 ô chia lưới 3 cột -> hàng cuối chỉ có 2 ô, dư 1 khoảng trống — ô CUỐI
                          // cùng (PM Compliance) chiếm luôn 2 cột để lấp đầy hàng, không để trống.
                          const isLast = idx === CARD_MINI_METRICS.length - 1;
                          return (
                            <div key={m.field} className={`rounded-lg bg-slate-50 px-2 py-2 ${isLast ? 'col-span-2' : ''}`}>
                              <div className="text-[11px] font-bold text-slate-500 uppercase truncate">{m.label}</div>
                              <div className="text-base font-extrabold text-slate-800">{v === null ? '—' : `${v}${m.suffix}`}</div>
                              {d !== null && (
                                <div className={`text-[11px] font-bold flex items-center gap-0.5 ${d < 0 ? 'text-rose-600' : d > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {d !== 0 && (d < 0 ? <IconTrendingDown size={11} /> : <IconTrendingUp size={11} />)}
                                  {d > 0 ? '+' : ''}{d}%
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* HÀNG TỔNG ĐIỂM: Xu hướng tổng điểm / Donut / Xếp hạng — 3 cách nhìn CÙNG 1 con số
                  tổng hợp, gộp từ 5 chỉ số thật (xem compositeScore). */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconTrendingUp size={18} className="text-[#006838]" /> Xu Hướng Tổng Điểm Đánh Giá 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Điểm tổng hợp trung bình 5 chỉ số thật (MTBF/Availability/Repeat Failure/Breakdown Rate/PM Compliance) của mỗi nhà máy, theo từng tuần/tháng.</p>
                  <UnitTrendGrid items={compUnits.map((u) => ({ key: u.key, label: u.label, color: u.color, series: compScoreTrendOf(u.key) }))} suffix="%" />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconChartDonut size={18} className="text-[#006838]" /> Tổng Điểm Đánh Giá 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Tỷ trọng đóng góp của mỗi nhà máy vào tổng điểm chung tại kỳ đang xem, tâm biểu đồ là điểm trung bình 6 đơn vị.</p>
                  <div className="flex items-center gap-4">
                    <UnitDonutChart
                      data={compUnits.map((u) => ({ label: u.label, value: Math.max(0.5, compScore(u.key) ?? 0), color: u.color }))}
                      centerValue={`${avgNonNull(compUnits.map((u) => compScore(u.key))) ?? '—'}%`}
                      centerLabel="Tổng điểm TB"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {compUnits.map((u) => {
                        const score = compScore(u.key);
                        const d = ptDelta(score, compPrevScore(u.key));
                        return (
                          <div key={u.key} className="flex items-center justify-between text-xs gap-2">
                            <span className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: u.color }} />
                              <span className="truncate text-slate-600 font-semibold">{u.label}</span>
                            </span>
                            <span className="flex items-center gap-1.5 shrink-0">
                              <span className="font-bold text-slate-800">{score === null ? '—' : `${score}%`}</span>
                              {d !== null && (
                                <span className={`text-[10px] font-bold ${d < 0 ? 'text-rose-600' : d > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {d > 0 ? '+' : ''}{d}%
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconMedal size={18} className="text-[#006838]" /> Xếp Hạng 6 Nhà Máy (Tổng Điểm Đánh Giá)
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Sắp xếp 6 nhà máy từ cao xuống thấp theo tổng điểm đánh giá — cao hơn là tốt hơn.</p>
                  <div className="space-y-3">
                    {(() => {
                      const maxScore = Math.max(1, ...compUnits.map((x) => compScore(x.key) ?? 0));
                      return [...compUnits]
                        .map((u) => ({ u, score: compScore(u.key), delta: ptDelta(compScore(u.key), compPrevScore(u.key)) }))
                        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                        .map(({ u, score, delta }, idx) => (
                          <div key={u.key} className="flex items-center gap-2.5">
                            <span className="w-5 text-sm font-extrabold text-slate-400 shrink-0">{idx + 1}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-slate-800 truncate">{u.label}</span>
                                <span className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-mono font-extrabold text-slate-900">{score === null ? '—' : `${score}%`}</span>
                                  {delta !== null && (
                                    <span className={`font-bold ${delta < 0 ? 'text-rose-600' : delta > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                      {delta > 0 ? '+' : ''}{delta}%
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.max(4, ((score ?? 0) / maxScore) * 100)}%`, backgroundColor: u.color }} />
                              </div>
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              </div>

              {/* 9 CÔNG THỨC — mỗi chỉ số 1 khu riêng, CÙNG khuôn hình với hàng tổng điểm ở trên
                  (icon + tiêu đề + biểu đồ, không mô tả/công thức/xếp hạng rườm rà) thay cho
                  KpiCompareSection kiểu cũ. 4 chỉ số đầu có lịch sử theo tuần/tháng nên vẽ "small
                  multiples" (UnitTrendGrid — 6 mini-biểu-đồ riêng từng nhà máy, xem lý do ở trên);
                  PM Compliance chỉ có 1 mốc hiện tại nên vẽ cột; 4 chỉ số cuối (OEE/PM
                  Effectiveness/Chi phí) chưa có dữ liệu thật nên chỉ hiện số khi bật Data Test, tắt
                  thì "Chưa đủ dữ liệu" — dùng renderMockOnlyBar bên dưới. */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconClockHour4 size={18} className="text-[#006838]" /> MTBF 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Thời gian trung bình máy chạy ổn định giữa 2 lần hỏng — càng dài càng tốt.</p>
                  <UnitTrendGrid
                    items={compUnits.map((u) => {
                      const t = testMode ? compMockBucketTrends[u.key] : compBucketTrends[u.key];
                      return { key: u.key, label: u.label, color: u.color, series: t ? t.mtbf : [] };
                    })}
                    suffix="h"
                  />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconWifi size={18} className="text-[#006838]" /> Availability 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Tỷ lệ thời gian máy sẵn sàng hoạt động, không tính thời gian dừng vì sự cố.</p>
                  <UnitTrendGrid
                    items={compUnits.map((u) => {
                      const t = testMode ? compMockBucketTrends[u.key] : compBucketTrends[u.key];
                      return { key: u.key, label: u.label, color: u.color, series: t ? t.availability : [] };
                    })}
                    suffix="%"
                  />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconRepeat size={18} className="text-[#006838]" /> Repeat Failure 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Tỷ lệ sự cố bị hỏng LẶP LẠI cùng lỗi trên cùng máy — càng cao nghĩa là sửa chưa dứt điểm.</p>
                  <UnitTrendGrid
                    items={compUnits.map((u) => {
                      const t = testMode ? compMockBucketTrends[u.key] : compBucketTrends[u.key];
                      return { key: u.key, label: u.label, color: u.color, series: t ? t.repeat : [] };
                    })}
                    suffix="%"
                  />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconActivity size={18} className="text-[#006838]" /> Breakdown Rate 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Mức độ hỏng hóc trung bình mỗi máy trong kỳ — càng thấp càng tốt.</p>
                  <UnitTrendGrid
                    items={compUnits.map((u) => {
                      const t = testMode ? compMockBucketTrends[u.key] : compBucketTrends[u.key];
                      return { key: u.key, label: u.label, color: u.color, series: t ? t.breakdown : [] };
                    })}
                    suffix=""
                  />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconCalendarStats size={18} className="text-[#006838]" /> PM Compliance 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Tỷ lệ máy được bảo trì đúng lịch, không bị trễ hạn (thời điểm hiện tại).</p>
                  <UnitBarChart
                    data={compUnits.map((u) => ({ label: u.label, value: compValue(u.key, 'pmCompliance') ?? 0, color: u.color, prevValue: compPrevValue(u.key, 'pmCompliance') ?? undefined }))}
                    valueLabel="%"
                    height={240}
                    showPrevLine
                  />
                  <PrevLineLegend />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconChartDonut size={18} className="text-[#006838]" /> OEE 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Hiệu suất tổng thể thiết bị — kết hợp khả dụng, hiệu suất chạy máy và chất lượng.</p>
                  {renderMockOnlyBar(compMockOnlyItems('oee'), compUnits.map((u) => compMockPrevValues[u.key]?.oee ?? null), '%')}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconStar size={18} className="text-[#006838]" /> PM Effectiveness 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Mức độ giảm sự cố sau khi thực hiện bảo trì định kỳ — càng cao nghĩa là bảo trì càng hiệu quả.</p>
                  {renderMockOnlyBar(compMockOnlyItems('pmEffectiveness'), compUnits.map((u) => compMockPrevValues[u.key]?.pmEffectiveness ?? null), '%')}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconCoin size={18} className="text-[#006838]" /> Chi Phí Bảo Trì / Máy 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Chi phí bảo trì trung bình phải chi cho mỗi máy trong kỳ.</p>
                  {renderMockOnlyBar(
                    compMockOnlyItems('maintenanceCost').map((it) => ({ ...it, value: it.value === null ? null : Math.round(it.value / 1000) })),
                    compUnits.map((u) => (compMockPrevValues[u.key]?.maintenanceCost != null ? Math.round(compMockPrevValues[u.key].maintenanceCost / 1000) : null)),
                    'Nghìn đ'
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    <IconBox size={18} className="text-[#006838]" /> Chi Phí Phụ Tùng 6 Nhà Máy
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-3">Tổng chi phí phụ tùng/linh kiện đã thay thế trong kỳ.</p>
                  {renderMockOnlyBar(
                    compMockOnlyItems('sparePartCost').map((it) => ({ ...it, value: it.value === null ? null : Math.round(it.value / 1000000) })),
                    compUnits.map((u) => (compMockPrevValues[u.key]?.sparePartCost != null ? Math.round(compMockPrevValues[u.key].sparePartCost / 1000000) : null)),
                    'Triệu đ'
                  )}
                </div>
              </div>
            </>
          )
        ) : loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang tải dữ liệu KPI...</div>
        ) : (
          <>
            {/* Hàng tóm tắt — đúng 3 chỉ số theo ảnh mẫu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {effMtbf ? (
                <SummaryCard
                  icon={IconClockHour4}
                  bg="bg-indigo-50"
                  iconBg="bg-indigo-100"
                  iconColor="text-indigo-600"
                  sparkColor="#6366f1"
                  title="MTBF (Ước Lượng)"
                  value={fmtHoursAsDays(effMtbf.trend[effMtbf.trend.length - 1].value)}
                  trend={effMtbf.trend}
                />
              ) : (
                <div className="rounded-xl p-4 bg-slate-50 border border-dashed border-slate-200 flex items-center text-xs text-slate-400">MTBF: chưa đủ dữ liệu</div>
              )}
              {effAvailability ? (
                <SummaryCard
                  icon={IconWifi}
                  bg="bg-emerald-50"
                  iconBg="bg-emerald-100"
                  iconColor="text-emerald-600"
                  sparkColor="#10b981"
                  title="Availability (Ước Lượng)"
                  value={`${effAvailability.trend[effAvailability.trend.length - 1].value}%`}
                  trend={effAvailability.trend}
                />
              ) : (
                <div className="rounded-xl p-4 bg-slate-50 border border-dashed border-slate-200 flex items-center text-xs text-slate-400">Availability: chưa đủ dữ liệu</div>
              )}
              {effRepeat ? (
                <SummaryCard
                  icon={IconRepeat}
                  bg="bg-rose-50"
                  iconBg="bg-rose-100"
                  iconColor="text-rose-600"
                  sparkColor="#e11d48"
                  title="Repeat Failure"
                  value={`${effRepeat.trend[effRepeat.trend.length - 1].value}%`}
                  trend={effRepeat.trend}
                />
              ) : (
                <div className="rounded-xl p-4 bg-slate-50 border border-dashed border-slate-200 flex items-center text-xs text-slate-400">Repeat Failure: chưa đủ dữ liệu</div>
              )}
            </div>

            {/* Hàng chi tiết 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailCard icon={IconClockHour4} iconBg="bg-indigo-100" iconColor="text-indigo-600" title="MTBF (Ước Lượng)" unitPill="Giờ" description="Đo khoảng thời gian trung bình máy chạy ổn định giữa 2 lần hỏng — càng dài càng tốt." formula="Khoảng cách trung bình giữa 2 lần sự cố liên tiếp của cùng 1 máy.">
                {effMtbf ? (
                  <>
                    <DetailLineChart data={effMtbf.trend} color="#6366f1" suffix="h" prevTrend={effMtbfPrevTrend} periodLabel={periodLabel} />
                    <IconRankList icon={IconTool} iconColor="text-indigo-500" items={effMtbf.worst.map((m) => ({ label: m.name, value: fmtHoursAsDays(m.avgGapHours) }))} />
                  </>
                ) : (
                  <span className="text-base font-extrabold text-slate-300">Chưa đủ dữ liệu (cần ≥2 sự cố/máy)</span>
                )}
              </DetailCard>

              <DetailCard icon={IconWifi} iconBg="bg-emerald-100" iconColor="text-emerald-600" title="Availability (Ước Lượng)" unitPill="%" description="Đo tỷ lệ thời gian máy sẵn sàng hoạt động (không tính thời gian dừng vì sự cố)." formula="1 − (Tổng Downtime / (Số máy × Thời lượng kỳ)) × 100%.">
                {effAvailability ? (
                  <>
                    <DetailBarChart data={effAvailability.trend} color="#10b981" suffix="%" prevTrend={effAvailabilityPrevTrend} periodLabel={periodLabel} />
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <IconGauge size={13} className="text-emerald-500 shrink-0" /> {effAvailability.machineCount} máy đã kiểm kê
                    </div>
                  </>
                ) : (
                  <span className="text-base font-extrabold text-slate-300">Chưa đủ dữ liệu</span>
                )}
              </DetailCard>

              <DetailCard icon={IconRepeat} iconBg="bg-rose-100" iconColor="text-rose-600" title="Repeat Failure" unitPill="Lần" description="Đo tỷ lệ sự cố bị hỏng LẶP LẠI cùng lỗi trên cùng máy — càng cao nghĩa là sửa chưa dứt điểm." formula="Cùng máy + cùng danh mục lỗi, tái diễn trong vòng 30 ngày / tổng số sự cố.">
                {effRepeat ? (
                  <>
                    <DetailLineChart data={effRepeat.trend} color="#e11d48" suffix="%" prevTrend={effRepeatPrevTrend} periodLabel={periodLabel} />
                    <p className="text-[11px] text-slate-400 mt-2">{effRepeat.repeatCount} / {effRepeat.total} sự cố là lặp lại</p>
                    <IconRankList icon={IconAlertTriangle} iconColor="text-rose-500" items={effRepeat.worst.map((m) => ({ label: m.name, value: `${m.count} lần` }))} />
                  </>
                ) : (
                  <span className="text-base font-extrabold text-slate-300">Chưa đủ dữ liệu</span>
                )}
              </DetailCard>
            </div>

            {/* Hàng chi tiết 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailCard icon={IconActivity} iconBg="bg-amber-100" iconColor="text-amber-600" title="Breakdown Rate" unitPill="Sự cố / máy" description="Đo mức độ hỏng hóc trung bình mỗi máy trong kỳ — càng thấp càng tốt." formula="Tổng số sự cố / Tổng số máy trong kỳ đang xem.">
                {effBreakdown ? (
                  <>
                    <DetailLineChart data={effBreakdown.trend} color="#f59e0b" prevTrend={effBreakdownPrevTrend} periodLabel={periodLabel} />
                    <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                      <span>Tổng số sự cố / Tổng số máy trong kỳ đang xem.</span>
                      <span className="font-bold text-slate-600 shrink-0 ml-2">{fmtInt(effBreakdown.totalIncidents)} sự cố / {fmtInt(effBreakdown.machineCount)} máy</span>
                    </p>
                  </>
                ) : (
                  <span className="text-base font-extrabold text-slate-300">Chưa đủ dữ liệu</span>
                )}
              </DetailCard>

              <DetailCard icon={IconCalendarStats} iconBg="bg-teal-100" iconColor="text-teal-600" title="PM Compliance" unitPill="% máy đạt" description="Đo tỷ lệ máy được bảo trì đúng lịch, không bị trễ hạn." formula="% máy đã lên lịch bảo trì mà KHÔNG bị quá hạn / tổng số máy đã lên lịch (thời điểm hiện tại, chưa có lịch sử theo tuần/tháng).">
                {effPmCompliance ? (
                  <>
                    <span className="text-2xl font-extrabold text-slate-900">{effPmCompliance.pct}%</span>
                    <div className="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, Math.max(0, effPmCompliance.pct))}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">{effPmCompliance.compliantCount} / {effPmCompliance.scheduledCount} máy đúng hạn</p>
                    <IconRankList icon={IconCircleCheck} iconColor="text-emerald-500" items={effPmCompliance.overdueList.map((m) => ({ label: m.name, value: 'Quá hạn', valueColor: 'text-rose-600' }))} />
                  </>
                ) : (
                  <span className="text-base font-extrabold text-slate-300">Chưa đủ dữ liệu (chưa có máy nào được lên lịch bảo trì)</span>
                )}
              </DetailCard>

              {testMode && oeePct !== null ? (
                <DetailCard icon={IconChartDonut} iconBg="bg-blue-100" iconColor="text-blue-600" title="OEE" unitPill="Tổng quan" description="Đo hiệu suất tổng thể thiết bị — kết hợp cả khả dụng, hiệu suất chạy máy và chất lượng." formula="OEE = Availability × Performance × Quality — Performance/Quality là DỮ LIỆU MẪU (hệ thống chưa theo dõi sản lượng thật).">
                  <div className="flex items-center gap-4">
                    <DonutChart pct={oeePct} color="#2563eb" />
                    <div className="flex-1 space-y-2.5 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500"><IconWifi size={13} className="text-emerald-500" /> Availability</span>
                        <span className="font-bold text-slate-800">{oeeAvailabilityPct}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500"><IconGauge size={13} className="text-blue-500" /> Performance</span>
                        <span className="font-bold text-slate-800">{mockOeePerformance}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500"><IconCircleCheck size={13} className="text-purple-500" /> Quality</span>
                        <span className="font-bold text-slate-800">{mockOeeQuality}%</span>
                      </div>
                    </div>
                  </div>
                </DetailCard>
              ) : (
                <EmptyDataCard
                  icon={IconChartDonut}
                  title="OEE"
                  reason="Cần dữ liệu sản lượng thực tế + thời gian chu kỳ chuẩn của từng máy — hệ thống hiện chỉ theo dõi sự cố/sửa chữa, chưa theo dõi sản lượng."
                />
              )}
            </div>

            {/* Hàng chưa đủ dữ liệu — bật Data Test thì hiện số liệu mẫu để xem giao diện, tắt thì về
                đúng "Chưa đủ dữ liệu" vì hệ thống chưa có dữ liệu thật cho cả 3 chỉ số này. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testMode ? (
                <DetailCard icon={IconStar} iconBg="bg-yellow-100" iconColor="text-yellow-600" title="PM Effectiveness" unitPill="% giảm sự cố" description="Đo mức độ giảm sự cố sau khi thực hiện bảo trì định kỳ — càng cao nghĩa là bảo trì càng hiệu quả." formula="So sánh số sự cố phát sinh SAU 1 lần bảo trì định kỳ với TRƯỚC đó — số liệu mẫu, hệ thống chưa gắn liên kết bảo trì/sự cố thật.">
                  <DetailLineChart data={mockPmEffectiveness.trend} color="#ca8a04" suffix="%" prevTrend={mockPmEffectivenessPrevTrend} periodLabel={periodLabel} />
                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Trước PM: {mockPmEffectiveness.before} sự cố/tháng</span>
                    <span className="font-bold text-slate-700">Sau PM: {mockPmEffectiveness.after} sự cố/tháng</span>
                  </div>
                </DetailCard>
              ) : (
                <EmptyDataCard
                  icon={IconStar}
                  title="PM Effectiveness"
                  reason="Cần đánh dấu rõ sự cố nào phát sinh SAU 1 lần bảo trì định kỳ để so sánh — hệ thống hiện chưa gắn liên kết giữa lần bảo trì và sự cố sau đó."
                />
              )}

              {testMode ? (
                <DetailCard icon={IconCoin} iconBg="bg-cyan-100" iconColor="text-cyan-600" title="Maintenance Cost / Machine" unitPill="₫ / máy" description="Đo chi phí bảo trì trung bình phải chi cho mỗi máy trong kỳ." formula="Tổng chi phí nhân công + phụ tùng / số máy — số liệu mẫu, hệ thống chưa ghi nhận đơn giá thật.">
                  <span className="text-2xl font-extrabold text-slate-900">{fmtVND(mockMaintenanceCost.trend[mockMaintenanceCost.trend.length - 1].value)}</span>
                  <DetailLineChart data={mockMaintenanceCost.trend.map((d) => ({ label: d.label, value: Math.round(d.value / 1000) }))} color="#0891b2" suffix="k₫" prevTrend={mockMaintenanceCostPrevTrend} periodLabel={periodLabel} />
                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Nhân công: {mockMaintenanceCost.labor}%</span>
                    <span className="text-slate-500">Phụ tùng: {mockMaintenanceCost.parts}%</span>
                  </div>
                </DetailCard>
              ) : (
                <EmptyDataCard
                  icon={IconCoin}
                  title="Maintenance Cost / Machine"
                  reason="Cần đơn giá nhân công + đơn giá phụ tùng — hệ thống hiện chỉ ghi số lượng phụ tùng thay, chưa có đơn giá."
                />
              )}

              {testMode ? (
                <DetailCard icon={IconBox} iconBg="bg-fuchsia-100" iconColor="text-fuchsia-600" title="Spare Part Cost" unitPill="Tổng chi phí" description="Đo tổng chi phí phụ tùng/linh kiện đã thay thế trong kỳ." formula="Tổng chi phí phụ tùng/linh kiện đã thay trong kỳ — số liệu mẫu, danh mục phụ tùng hiện chưa có trường giá.">
                  <span className="text-2xl font-extrabold text-slate-900">{fmtVND(mockSparePartCost.total)}</span>
                  <IconRankList icon={IconBox} iconColor="text-fuchsia-500" items={mockSparePartCost.top.map((p) => ({ label: p.name, value: fmtVND(p.cost) }))} />
                </DetailCard>
              ) : (
                <EmptyDataCard
                  icon={IconBox}
                  title="Spare Part Cost"
                  reason="Cần đơn giá từng phụ tùng/linh kiện — danh mục phụ tùng hiện chưa có trường giá."
                />
              )}
            </div>
          </>
        )}
      </div>
    </MaintenanceShell>
  );
}
