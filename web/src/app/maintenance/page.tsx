'use client';

import { useEffect, useMemo, useState } from 'react';
import NavLink from "@/components/NavLink";
import {
  IconDeviceLaptop,
  IconAlertTriangle,
  IconClockHour4,
  IconBulb,
  IconCircleCheck,
  IconArrowRight,
  IconStopwatch,
  IconTool,
  IconGauge,
  IconFilter,
  IconSearch,
  IconX,
  IconFlask,
  IconCalendar,
  IconBuildingFactory,
  IconBuildingFactory2,
  IconBuildingWarehouse,
  IconBuildingSkyscraper,
  IconBuildingCommunity,
  IconBuilding,
  IconTrophy,
  IconBulbFilled,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconChartLine,
  IconChartBar,
  IconClipboardList,
} from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import StatCardRow from '@/components/StatCardRow';
import FilterSelect from '@/components/FilterSelect';
import DateRangeFilter, { inDateRange } from '@/components/DateRangeFilter';
import ParetoChart, { type ParetoItem } from '@/components/charts/ParetoChart';
import TrendChart, { type TrendPoint } from '@/components/charts/TrendChart';
import Sparkline from '@/components/charts/Sparkline';
import MultiLineComparisonChart, { type ComparisonSeries } from '@/components/charts/MultiLineComparisonChart';
import UnitBarChart from '@/components/charts/UnitBarChart';
import { readMaintenanceCache, writeMaintenanceCache } from '@/lib/maintenanceCache';
import { EquipmentScope, getCurrentMmtbScope } from '@/lib/equipmentScope';

type Machine = {
  id: string;
  statusName: string;
  status?: string;
  code: string;
  name: string;
  machineTypeName: string | null;
  factoryId: string | null;
  areaId: string | null;
  areaName: string | null;
  lineId: string | null;
  lineName: string | null;
};
type ScheduleMachine = { id: string; status: 'unscheduled' | 'overdue' | 'upcoming' | 'scheduled' };
type Proposal = { id: string; resolved: boolean };

type CategoryOption = { id: string; name: string; parent?: { id: string; name: string; parent?: { id: string; name: string } | null } | null };

type OverviewIncident = {
  id: string;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  categoryName: string | null;
  machineId: string;
  machineCode: string;
  machineName: string;
  machineTypeName: string | null;
  areaName: string | null;
  lineName: string | null;
};

type OverviewLog = { id: string; partsReplaced: string | null };

type PartsPayload = { parts?: { partId: string; name: string; quantity: number }[]; note?: string };

function normalizeStatus(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').trim().toLowerCase();
}

function minutesBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function fmtMin(n: number | null): string {
  return n == null ? '—' : `${round1(n)}`;
}

// "yyyy-mm" -> ngày 1 và ngày cuối tháng (Date.UTC, không lệch múi giờ vì chỉ cần đúng NGÀY lịch).
function monthToDateRange(monthStr: string): { from: string; to: string } {
  const [y, m] = monthStr.split('-').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${monthStr}-01`, to: `${monthStr}-${pad(lastDay)}` };
}
// Tháng hiện tại theo giờ VN (UTC+7) dạng "yyyy-mm" — dùng làm mặc định khi vừa vào trang.
function currentMonthVN(): string {
  const vn = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `${vn.getUTCFullYear()}-${String(vn.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Tổng Quan = so sánh GIỮA CÁC NHÀ MÁY (Tổ Hợp Kiên Giang / Nhà Máy Miền Đông / Văn Phòng Chuỗi),
// không phải xem chi tiết 1 nhà máy — nên tính riêng 1 bộ KPI gọn (MTTA/MTTR/MTTD/Số Sự Cố/
// Downtime) cho TỪNG khu vực để xếp cạnh nhau. Miền Đông/Văn phòng CHƯA có hệ thống MMTB thật kết
// nối (xem mmtbScopeIsUnconnected trong _worker.js) nên luôn trả 0 — khung so sánh đã sẵn sàng để
// tự động hiện số thật ngay khi 2 khu vực đó có dữ liệu, không cần sửa lại code.
type ScopeKpi = { mtta: number; mttr: number; mttd: number; count: number; downtime: number };
const ZERO_SCOPE_KPI: ScopeKpi = { mtta: 0, mttr: 0, mttd: 0, count: 0, downtime: 0 };

function computeScopeKpi(rawIncidents: { acceptedAt: string | null; completedAt: string | null; createdAt: string }[]): ScopeKpi {
  const enriched = rawIncidents.map((i) => ({
    mtta: i.acceptedAt ? minutesBetween(i.createdAt, i.acceptedAt) : null,
    mttr: i.acceptedAt && i.completedAt ? minutesBetween(i.acceptedAt, i.completedAt) : null,
    mttd: i.completedAt ? minutesBetween(i.createdAt, i.completedAt) : null,
  }));
  const mttaVals = enriched.filter((i) => i.mtta != null).map((i) => i.mtta as number);
  const mttrVals = enriched.filter((i) => i.mttr != null).map((i) => i.mttr as number);
  const mttdVals = enriched.filter((i) => i.mttd != null).map((i) => i.mttd as number);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);
  return {
    mtta: avg(mttaVals),
    mttr: avg(mttrVals),
    mttd: avg(mttdVals),
    count: rawIncidents.length,
    downtime: mttdVals.reduce((s, n) => s + n, 0),
  };
}

// ════════════════════════════════════════════════════════════════════════
// TỔNG QUAN HIỆU SUẤT 6 ĐƠN VỊ (scope=ALL) — 4 nhà máy con thật trong Tổ Hợp
// Kiên Giang (KG 1/KG 2/KG 3/HTĐ KG — lấy factoryId thật qua categories?type=FACTORY, KHÔNG lấy
// "VP KV KG") + Nhà Máy Miền Đông + Văn Phòng Chuỗi (2 khu vực sau chưa kết nối hệ thống MMTB thật
// nên luôn ra 0, xem mmtbScopeIsUnconnected trong _worker.js).
// ════════════════════════════════════════════════════════════════════════
type CompUnitKey = 'KG1' | 'KG2' | 'KG3' | 'HTD' | 'EAST' | 'OFFICE';
type CompUnitDef = {
  key: CompUnitKey;
  label: string;
  scope: EquipmentScope;
  factoryNameMatch: string | null;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
};
const COMPARISON_UNIT_DEFS: CompUnitDef[] = [
  { key: 'KG1', label: 'KG1', scope: 'KIEN_GIANG', factoryNameMatch: 'KG 1', icon: IconBuildingFactory, color: '#2563eb' },
  { key: 'KG2', label: 'KG2', scope: 'KIEN_GIANG', factoryNameMatch: 'KG 2', icon: IconBuildingFactory2, color: '#7c3aed' },
  { key: 'KG3', label: 'KG3', scope: 'KIEN_GIANG', factoryNameMatch: 'KG 3', icon: IconBuildingWarehouse, color: '#d97706' },
  { key: 'HTD', label: 'HTĐ', scope: 'KIEN_GIANG', factoryNameMatch: 'HTĐ KG', icon: IconBuildingCommunity, color: '#0d9488' },
  { key: 'EAST', label: 'SK MD', scope: 'EAST', factoryNameMatch: null, icon: IconBuildingSkyscraper, color: '#e11d48' },
  { key: 'OFFICE', label: 'VP2', scope: 'OFFICE', factoryNameMatch: null, icon: IconBuilding, color: '#9333ea' },
];

type CompDailyPoint = { day: string; mttr: number; count: number; downtime: number };
type CompUnitData = { kpi: ScopeKpi; prevKpi: ScopeKpi; daily: CompDailyPoint[] };
const ZERO_COMP_DATA: CompUnitData = { kpi: ZERO_SCOPE_KPI, prevKpi: ZERO_SCOPE_KPI, daily: [] };

// Kỳ liền trước — cùng độ dài (số ngày), nằm ngay trước kỳ đang xem — dùng để tính "% so với kỳ
// trước" trên mỗi card, khớp đúng ảnh mẫu.
function previousPeriod(dateFrom: string, dateTo: string): { from: string; to: string } {
  const from = new Date(`${dateFrom}T00:00:00Z`);
  const to = new Date(`${dateTo}T00:00:00Z`);
  const lengthDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  const prevTo = new Date(from.getTime() - 86400000);
  const prevFrom = new Date(prevTo.getTime() - (lengthDays - 1) * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(prevFrom), to: fmt(prevTo) };
}

// null = không tính được % có ý nghĩa (kỳ trước = 0 mà kỳ này > 0, chia cho 0) — hiện "—" thay vì %.
function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return round1(((current - previous) / previous) * 100);
}

// Gộp sự cố theo NGÀY trong khoảng [dateFrom, dateTo] (tính MTTR trung bình + số sự cố mỗi ngày) —
// dùng cho sparkline trong card VÀ biểu đồ so sánh nhiều đơn vị theo ngày. Luôn trả đủ 1 điểm / 1
// ngày trong khoảng (kể cả ngày không có sự cố = 0) để trục X các đơn vị khớp nhau.
function buildDailySeries(incidents: { createdAt: string; acceptedAt: string | null; completedAt: string | null }[], dateFrom: string, dateTo: string): CompDailyPoint[] {
  const byDay = new Map<string, { mttrSum: number; mttrN: number; count: number; mttdSum: number; mttdN: number }>();
  for (const i of incidents) {
    const day = i.createdAt.slice(0, 10);
    let b = byDay.get(day);
    if (!b) { b = { mttrSum: 0, mttrN: 0, count: 0, mttdSum: 0, mttdN: 0 }; byDay.set(day, b); }
    b.count++;
    if (i.acceptedAt && i.completedAt) {
      b.mttrSum += minutesBetween(i.acceptedAt, i.completedAt);
      b.mttrN++;
    }
    if (i.completedAt) {
      b.mttdSum += minutesBetween(i.createdAt, i.completedAt);
      b.mttdN++;
    }
  }
  const days: CompDailyPoint[] = [];
  const d = new Date(`${dateFrom}T00:00:00Z`);
  const end = new Date(`${dateTo}T00:00:00Z`);
  while (d <= end) {
    const key = d.toISOString().slice(0, 10);
    const b = byDay.get(key);
    days.push({
      day: key,
      mttr: b && b.mttrN ? round1(b.mttrSum / b.mttrN) : 0,
      count: b ? b.count : 0,
      downtime: b && b.mttdN ? round1(b.mttdSum / b.mttdN) : 0,
    });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

// Dữ liệu MẪU (giả lập) — CHỈ để test giao diện khi bấm nút "Xem Dữ Liệu Mẫu" (Nhà Máy Miền Đông/
// Văn Phòng Chuỗi thật sự luôn = 0 vì chưa kết nối hệ thống, khó thấy hết được cả 6 card/6 đường
// biểu đồ trông thế nào khi có đủ số liệu) — KHÔNG BAO GIỜ tự động bật, không ghi đè dữ liệu thật,
// chỉ hiện tạm trong phiên xem hiện tại.
function generateMockCompData(dateFrom: string, dateTo: string, seed: number): CompUnitData {
  const days: CompDailyPoint[] = [];
  const d = new Date(`${dateFrom}T00:00:00Z`);
  const end = new Date(`${dateTo}T00:00:00Z`);
  const totalDays = Math.max(1, Math.round((end.getTime() - d.getTime()) / 86400000) + 1);
  let i = 0;
  while (d <= end) {
    const base = 5 + seed * 1.5;
    // Dốc lên RÕ theo thời gian, kết thúc ở góc phải trên (biên độ dốc lớn hơn hẳn dao động nhỏ) —
    // khớp đúng ảnh mẫu (đường xéo hẳn lên góc phải trên, không phẳng ngang).
    const trend = (i / totalDays) * (14 + seed * 1.5);
    const wiggle = Math.sin(i / 2.5 + seed) * 0.8 + Math.random() * 0.6;
    const mttr = Math.max(1, round1(base + trend + wiggle));
    const count = Math.max(0, Math.round(2 + seed + Math.random() * 4));
    const downtime = Math.max(1, round1(mttr * 1.8 + Math.random() * 2));
    days.push({ day: d.toISOString().slice(0, 10), mttr, count, downtime });
    d.setUTCDate(d.getUTCDate() + 1);
    i++;
  }
  const avgMttr = days.length ? round1(days.reduce((s, p) => s + p.mttr, 0) / days.length) : 0;
  const totalCount = days.reduce((s, p) => s + p.count, 0);
  const kpi: ScopeKpi = {
    mtta: round1(avgMttr * 0.6),
    mttr: avgMttr,
    mttd: round1(avgMttr * 1.8),
    count: totalCount,
    downtime: round1(totalCount * avgMttr * 1.8),
  };
  const prevFactor = round1(0.85 + Math.random() * 0.3);
  const prevKpi: ScopeKpi = {
    mtta: round1(kpi.mtta * prevFactor),
    mttr: round1(kpi.mttr * prevFactor),
    mttd: round1(kpi.mttd * prevFactor),
    count: Math.round(kpi.count * prevFactor),
    downtime: round1(kpi.downtime * prevFactor),
  };
  return { kpi, prevKpi, daily: days };
}

// 2 dòng tách riêng (khớp đúng ảnh mẫu) — dòng 1: mũi tên + % (đậm, có màu), dòng 2: "so với kỳ
// trước" (nhạt, nhỏ hơn) — KHÔNG gộp chung 1 dòng như trước.
function DeltaBadge({ percent }: { percent: number | null }) {
  if (percent === null) return (
    <div className="leading-tight shrink-0">
      <div className="text-base font-extrabold text-slate-400">—</div>
      <div className="text-xs font-semibold text-slate-500">so với kỳ trước</div>
    </div>
  );
  if (percent === 0) return (
    <div className="leading-tight shrink-0">
      <div className="inline-flex items-center gap-1 text-base font-extrabold text-slate-500">
        <IconMinus size={17} /> 0%
      </div>
      <div className="text-xs font-semibold text-slate-500">so với kỳ trước</div>
    </div>
  );
  const decreased = percent < 0; // mũi tên LUÔN khớp đúng chiều tăng/giảm thật; màu: giảm = đỏ, tăng = xanh (theo yêu cầu)
  return (
    <div className="leading-tight shrink-0">
      <div className={`inline-flex items-center gap-1 text-base font-extrabold ${decreased ? 'text-rose-600' : 'text-emerald-600'}`}>
        {decreased ? <IconTrendingDown size={17} /> : <IconTrendingUp size={17} />}
        {Math.abs(percent)}%
      </div>
      <div className="text-xs font-semibold text-slate-500">so với kỳ trước</div>
    </div>
  );
}

export default function OverviewPage() {
  // Trang này phục vụ 2 mục đích: (1) tab "Tổng Quan" khoanh đỏ ở /work (scope=ALL) — bảng SO SÁNH
  // giữa 3 khu vực; (2) tab "Tổng Quan" RIÊNG trong sidebar của từng nhà máy (scope=KIEN_GIANG/
  // OFFICE/EAST) — vẫn xem chi tiết PHÂN TÍCH của ĐÚNG khu vực đó (bộ lọc + KPI + Xu hướng/Pareto/
  // Độ tin cậy), y như trước khi có bảng so sánh. `detailScope` = khu vực THẬT SỰ cần tải dữ liệu
  // phân tích chi tiết — khi đang ở "Tổng Quan" (ALL) thì phần chi tiết bên dưới bảng so sánh vẫn
  // luôn là của Tổ Hợp Kiên Giang (khu vực duy nhất có dữ liệu thật); các cache key dùng CHUNG theo
  // detailScope nên vào thẳng /maintenance?scope=KIEN_GIANG hay /maintenance?scope=ALL đều khớp 1
  // dữ liệu, không tải trùng.
  const scope = getCurrentMmtbScope();
  const detailScope: EquipmentScope = scope === 'ALL' ? 'KIEN_GIANG' : scope;
  const dck = (key: string) => `${key}_${detailScope}`;

  // ---- Khối tóm tắt nhanh ----
  const [machines, setMachines] = useState<Machine[]>(() => readMaintenanceCache<Machine[]>(dck('overview_machines')) || []);
  const [scheduleMachines, setScheduleMachines] = useState<ScheduleMachine[]>(() => readMaintenanceCache<ScheduleMachine[]>(dck('overview_schedule')) || []);
  const [proposals, setProposals] = useState<Proposal[]>(() => readMaintenanceCache<Proposal[]>(dck('overview_proposals')) || []);
  const [quickLoading, setQuickLoading] = useState(() => readMaintenanceCache<Machine[]>(dck('overview_machines')) === null);

  // ---- Bộ lọc phân tích (Nhà máy/Phân xưởng/Line + thời gian) — mặc định THÁNG HIỆN TẠI, khớp
  // đúng trang Tổng Quan thật bên thkiengiangshoes. ----
  const [factories, setFactories] = useState<CategoryOption[]>(() => readMaintenanceCache<CategoryOption[]>(dck('overview_factories')) || []);
  const [areas, setAreas] = useState<CategoryOption[]>(() => readMaintenanceCache<CategoryOption[]>(dck('overview_areas')) || []);
  const [lines, setLines] = useState<CategoryOption[]>(() => readMaintenanceCache<CategoryOption[]>(dck('overview_lines')) || []);
  const [pFactoryId, setPFactoryId] = useState('');
  const [pAreaId, setPAreaId] = useState('');
  const [pLineId, setPLineId] = useState('');
  const [pMonth, setPMonth] = useState(currentMonthVN());
  const [pDateFrom, setPDateFrom] = useState(() => monthToDateRange(pMonth).from);
  const [pDateTo, setPDateTo] = useState(() => monthToDateRange(pMonth).to);

  // ---- Dữ liệu phân tích ----
  const [incidents, setIncidents] = useState<OverviewIncident[]>(() => readMaintenanceCache<OverviewIncident[]>(dck('overview_incidents')) || []);
  const [logs, setLogs] = useState<OverviewLog[]>(() => readMaintenanceCache<OverviewLog[]>(dck('overview_logs')) || []);
  const [loading, setLoading] = useState(() => readMaintenanceCache<OverviewIncident[]>(dck('overview_incidents')) === null);
  const [, setError] = useState<string | null>(null);
  const [reliabilitySearch, setReliabilitySearch] = useState('');
  const [detailMachineCode, setDetailMachineCode] = useState<string | null>(null);

  // ---- Dữ liệu mẫu (bật/tắt cạnh nút Lọc) ----
  const [appliedFilters, setAppliedFilters] = useState({ factoryId: '', areaId: '', lineId: '', dateFrom: pDateFrom, dateTo: pDateTo });

  // ---- Tổng Quan Hiệu Suất 6 Đơn Vị (KG1/KG2/KG3/HTĐ/Miền Đông/Văn Phòng Chuỗi) — CHỈ dùng khi
  // scope=ALL. Mặc định khoảng ngày = tháng hiện tại, khớp đúng ảnh mẫu.
  const [compDateFrom, setCompDateFrom] = useState(() => monthToDateRange(currentMonthVN()).from);
  const [compDateTo, setCompDateTo] = useState(() => monthToDateRange(currentMonthVN()).to);
  const compCacheKey = `overview_comparison_${compDateFrom}_${compDateTo}`;
  const [compData, setCompData] = useState<Record<CompUnitKey, CompUnitData>>(() => {
    const cached = readMaintenanceCache<Record<CompUnitKey, CompUnitData>>(compCacheKey);
    if (cached) return cached;
    const zero = {} as Record<CompUnitKey, CompUnitData>;
    COMPARISON_UNIT_DEFS.forEach((u) => { zero[u.key] = ZERO_COMP_DATA; });
    return zero;
  });
  const [compLoading, setCompLoading] = useState(() => readMaintenanceCache(compCacheKey) === null);
  const [compMetric, setCompMetric] = useState<'mttr' | 'downtime'>('mttr');
  // Nút "Xem Dữ Liệu Mẫu" — bật tạm dữ liệu giả lập đủ 6 đơn vị để test giao diện (KHÔNG lưu cache,
  // KHÔNG ảnh hưởng compData thật) — xem generateMockCompData phía trên.
  const [compTestMode, setCompTestMode] = useState(false);
  // Tăng lên mỗi lần bấm "Lọc" để ép tải lại dù khoảng ngày không đổi (VD dữ liệu tbsMayMoc vừa
  // cập nhật) — khoảng ngày tự động tải lại ngay khi đổi rồi (không cần bấm), nút này chỉ để làm
  // mới thủ công.
  const [compRefreshNonce, setCompRefreshNonce] = useState(0);

  async function loadOverview(params: { factoryId: string; areaId: string; lineId: string; dateFrom: string; dateTo: string }) {
    try {
      // KHÔNG bật setLoading(true) — nếu đã có cache thì giữ nguyên hiện ngay, chỉ âm thầm tải mới.
      setError(null);
      const qs = new URLSearchParams();
      if (params.factoryId) qs.set('factoryId', params.factoryId);
      if (params.areaId) qs.set('areaId', params.areaId);
      if (params.lineId) qs.set('lineId', params.lineId);
      if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
      if (params.dateTo) qs.set('dateTo', params.dateTo);
      qs.set('scope', detailScope);
      const res = await fetch(`/api/maintenance/overview-report?${qs}`);
      const result = await res.json();
      if (result.success) {
        setIncidents(result.incidents || []);
        setLogs(result.logs || []);
        writeMaintenanceCache(dck('overview_incidents'), result.incidents || []);
        writeMaintenanceCache(dck('overview_logs'), result.logs || []);
      } else {
        console.warn('Failed to load overview-report:', result.error);
        setError(result.error || 'Không lấy được dữ liệu phân tích');
      }
    } catch (err) {
      console.warn('Failed to fetch overview-report:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const settled = await Promise.allSettled([
          fetch(`/api/maintenance/machines?scope=${detailScope}`).then((r) => r.json()),
          fetch(`/api/maintenance/schedule?scope=${detailScope}`).then((r) => r.json()),
          fetch(`/api/maintenance/proposals?scope=${detailScope}`).then((r) => r.json()),
          fetch(`/api/maintenance/categories?type=FACTORY&scope=${detailScope}`).then((r) => r.json()),
          fetch(`/api/maintenance/categories?type=AREA&scope=${detailScope}`).then((r) => r.json()),
          fetch(`/api/maintenance/categories?type=PRODUCTION_LINE&scope=${detailScope}`).then((r) => r.json()),
        ]);
        const [machinesRes, scheduleRes, proposalsRes, facRes, areaRes, lineRes] = settled.map((s) =>
          s.status === 'fulfilled' ? s.value : { success: false },
        );
        if (machinesRes.success) {
          setMachines(machinesRes.data || []);
          writeMaintenanceCache(dck('overview_machines'), machinesRes.data || []);
        }
        if (scheduleRes.success) {
          setScheduleMachines(scheduleRes.machines || []);
          writeMaintenanceCache(dck('overview_schedule'), scheduleRes.machines || []);
        }
        if (proposalsRes.success) {
          setProposals(proposalsRes.data || []);
          writeMaintenanceCache(dck('overview_proposals'), proposalsRes.data || []);
        }
        if (facRes.success) {
          setFactories(facRes.data || []);
          writeMaintenanceCache(dck('overview_factories'), facRes.data || []);
        }
        if (areaRes.success) {
          setAreas(areaRes.data || []);
          writeMaintenanceCache(dck('overview_areas'), areaRes.data || []);
        }
        if (lineRes.success) {
          setLines(lineRes.data || []);
          writeMaintenanceCache(dck('overview_lines'), lineRes.data || []);
        }
      } catch {
        /* khối tóm tắt nhanh — lỗi không chặn phần phân tích bên dưới */
      } finally {
        setQuickLoading(false);
      }
    })();
    loadOverview({ factoryId: '', areaId: '', lineId: '', dateFrom: pDateFrom, dateTo: pDateTo });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tra factoryId THẬT của 4 nhà máy con KG1/KG2/KG3/HTĐ từ danh sách `factories` (đã tải sẵn ở
  // effect trên, dùng chung detailScope=KIEN_GIANG) — không tự bịa/hard-code id, lấy đúng theo tên.
  const compUnits = useMemo(
    () =>
      COMPARISON_UNIT_DEFS.map((u) => ({
        ...u,
        factoryId: u.factoryNameMatch ? factories.find((f) => f.name.trim() === u.factoryNameMatch)?.id || null : null,
      })),
    [factories]
  );

  // Tải dữ liệu So Sánh 6 Đơn Vị — CHỈ cần khi đang ở tab "Tổng Quan" (ALL, khoanh đỏ ở /work); các
  // tab "Tổng Quan" riêng trong sidebar từng nhà máy không hiện phần này. Mỗi đơn vị gọi 2 lượt
  // (kỳ hiện tại + kỳ liền trước, xem previousPeriod) — chạy song song bằng Promise.allSettled.
  useEffect(() => {
    if (scope !== 'ALL') return;
    // 4 đơn vị KG cần factoryId thật trước — chờ `factories` tải xong (effect trên) rồi mới gọi.
    const kgUnitsReady = compUnits.filter((u) => u.factoryNameMatch).every((u) => u.factoryId);
    if (!kgUnitsReady) return;

    // Đã có cache đúng khoảng ngày này thì không hiện "Đang lọc..." — giữ nguyên dữ liệu cũ hiện
    // ngay, chỉ âm thầm tải mới ở nền (khớp cách các trang khác trong /maintenance đang làm).
    if (readMaintenanceCache(compCacheKey) === null) setCompLoading(true);

    const { from: prevFrom, to: prevTo } = previousPeriod(compDateFrom, compDateTo);

    Promise.allSettled(
      compUnits.map((u) => {
        const qsCur = new URLSearchParams({ scope: u.scope, dateFrom: compDateFrom, dateTo: compDateTo });
        if (u.factoryId) qsCur.set('factoryId', u.factoryId);
        const qsPrev = new URLSearchParams({ scope: u.scope, dateFrom: prevFrom, dateTo: prevTo });
        if (u.factoryId) qsPrev.set('factoryId', u.factoryId);
        return Promise.all([
          fetch(`/api/maintenance/overview-report?${qsCur}`).then((r) => r.json()),
          fetch(`/api/maintenance/overview-report?${qsPrev}`).then((r) => r.json()),
        ]);
      })
    ).then((results) => {
      const next = {} as Record<CompUnitKey, CompUnitData>;
      results.forEach((res, i) => {
        const u = compUnits[i];
        if (res.status !== 'fulfilled') {
          next[u.key] = ZERO_COMP_DATA;
          return;
        }
        const [curRes, prevRes] = res.value;
        const curIncidents = curRes.success ? curRes.incidents || [] : [];
        const prevIncidents = prevRes.success ? prevRes.incidents || [] : [];
        next[u.key] = {
          kpi: computeScopeKpi(curIncidents),
          prevKpi: computeScopeKpi(prevIncidents),
          daily: buildDailySeries(curIncidents, compDateFrom, compDateTo),
        };
      });
      setCompData(next);
      writeMaintenanceCache(compCacheKey, next);
      setCompLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, compDateFrom, compDateTo, compUnits, compRefreshNonce]);

  // Bấm 1 tháng ở icon lịch -> set khoảng ngày trọn tháng đó + lọc ngay (không cần bấm nút "Lọc"
  // thêm). Đổi qua khoảng ngày tuỳ chỉnh (DateRangeFilter) thì bỏ chọn tháng (setPMonth rỗng) —
  // tránh icon lịch hiện sai tháng không khớp bộ lọc đang áp dụng thật.
  function handlePickMonth(monthStr: string) {
    setPMonth(monthStr);
    if (!monthStr) return;
    const { from, to } = monthToDateRange(monthStr);
    setPDateFrom(from);
    setPDateTo(to);
    const params = { factoryId: pFactoryId, areaId: pAreaId, lineId: pLineId, dateFrom: from, dateTo: to };
    setAppliedFilters(params);
    loadOverview(params);
  }

  const areaOptions = useMemo(
    () => areas.filter((a) => !pFactoryId || a.parent?.id === pFactoryId).map((a) => ({ id: a.id, name: a.name })),
    [areas, pFactoryId]
  );
  const lineOptions = useMemo(
    () =>
      lines
        .filter((l) => (!pAreaId || l.parent?.id === pAreaId) && (!pFactoryId || l.parent?.parent?.id === pFactoryId))
        .map((l) => ({ id: l.id, name: l.name })),
    [lines, pAreaId, pFactoryId]
  );

  function handleApplyFilter() {
    const params = { factoryId: pFactoryId, areaId: pAreaId, lineId: pLineId, dateFrom: pDateFrom, dateTo: pDateTo };
    setAppliedFilters(params);
    loadOverview(params);
  }

  // ---- So Sánh 6 Đơn Vị — dữ liệu dựng sẵn cho card/biểu đồ/xếp hạng/bảng/nhận xét (chỉ dùng khi
  // scope=ALL, nhưng tính vô điều kiện — rẻ, không gọi API thêm, compData rỗng thì ra toàn 0). ----
  const compSeries: ComparisonSeries[] = useMemo(
    () => compUnits.map((u) => ({ key: u.key, label: u.label, color: u.color })),
    [compUnits]
  );

  // compTestMode bật -> thay compData thật bằng dữ liệu mẫu (chỉ để test giao diện), mọi tính toán
  // bên dưới (biểu đồ/xếp hạng/bảng/nhận xét/card) đều đọc qua effectiveCompData này.
  const effectiveCompData = useMemo(() => {
    if (!compTestMode) return compData;
    const mock = {} as Record<CompUnitKey, CompUnitData>;
    compUnits.forEach((u, i) => { mock[u.key] = generateMockCompData(compDateFrom, compDateTo, i); });
    return mock;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compTestMode, compData, compUnits, compDateFrom, compDateTo]);

  const compChartData = useMemo(() => {
    const refDaily = effectiveCompData[compUnits[0]?.key]?.daily || [];
    return refDaily.map((_, idx) => {
      const row: Record<string, number | string> = { label: (effectiveCompData[compUnits[0].key]?.daily[idx]?.day || '').slice(5) };
      for (const u of compUnits) {
        const point = effectiveCompData[u.key]?.daily[idx];
        row[u.key] = point ? (compMetric === 'mttr' ? point.mttr : point.downtime) : 0;
      }
      return row;
    });
  }, [compUnits, effectiveCompData, compMetric]);

  // "Downtime TB" = downtime trung bình MỖI sự cố (tổng downtime / số sự cố), KHÔNG phải tổng cộng
  // dồn (tổng downtime thô đã có riêng ở bảng chi tiết/biểu đồ cột) — đúng nghĩa "trung bình".
  function avgDowntime(kpi: ScopeKpi): number {
    return kpi.count > 0 ? round1(kpi.downtime / kpi.count) : 0;
  }

  const rankedUnits = useMemo(() => {
    const withValue = compUnits.map((u) => {
      const d = effectiveCompData[u.key] || ZERO_COMP_DATA;
      const value = compMetric === 'mttr' ? d.kpi.mttr : avgDowntime(d.kpi);
      const prevValue = compMetric === 'mttr' ? d.prevKpi.mttr : avgDowntime(d.prevKpi);
      return { ...u, value, delta: deltaPercent(value, prevValue) };
    });
    const maxValue = Math.max(1, ...withValue.map((u) => u.value));
    return withValue.sort((a, b) => a.value - b.value).map((u) => ({ ...u, ratio: u.value / maxValue }));
  }, [compUnits, effectiveCompData, compMetric]);

  // Nhận xét nhanh — sinh rule-based từ dữ liệu 6 đơn vị (không gọi AI/API ngoài).
  const compInsights = useMemo(() => {
    const withKpi = compUnits.map((u) => ({ ...u, ...(effectiveCompData[u.key] || ZERO_COMP_DATA) }));
    const connected = withKpi.filter((u) => u.kpi.count > 0);
    if (connected.length === 0) return { lines: [] as string[], conclusion: '' };
    const bestMttr = [...connected].sort((a, b) => a.kpi.mttr - b.kpi.mttr)[0];
    const worstMttr = [...connected].sort((a, b) => b.kpi.mttr - a.kpi.mttr)[0];
    const mostIncidents = [...connected].sort((a, b) => b.kpi.count - a.kpi.count)[0];
    const worsening = [...connected]
      .map((u) => ({ ...u, delta: deltaPercent(u.kpi.mttr, u.prevKpi.mttr) }))
      .filter((u) => u.delta !== null && u.delta > 0)
      .sort((a, b) => (b.delta as number) - (a.delta as number))[0];
    const lines: string[] = [];
    lines.push(`${bestMttr.label} đang có hiệu suất tốt nhất về thời gian xử lý (${fmtMin(bestMttr.kpi.mttr)} phút).`);
    if (worstMttr.key !== bestMttr.key) lines.push(`${worstMttr.label} có thời gian xử lý cao nhất (${fmtMin(worstMttr.kpi.mttr)} phút) và đang cần ưu tiên cải thiện.`);
    lines.push(`${mostIncidents.label} có số sự cố nhiều nhất (${mostIncidents.kpi.count} sự cố).`);
    if (worsening) lines.push(`${worsening.label} đang có xu hướng xấu đi (thời gian xử lý tăng ${worsening.delta}% so với kỳ trước).`);
    const conclusion = `${bestMttr.label} là đơn vị hiệu quả nhất hiện tại, trong khi ${worstMttr.label} cần được ưu tiên cải thiện.`;
    return { lines, conclusion };
  }, [compUnits, effectiveCompData]);

  const effectiveIncidents: OverviewIncident[] = incidents;
  const effectiveLogs: OverviewLog[] = logs;

  const enriched = useMemo(
    () =>
      effectiveIncidents.map((i) => ({
        ...i,
        mtta: i.acceptedAt ? minutesBetween(i.createdAt, i.acceptedAt) : null,
        mttr: i.acceptedAt && i.completedAt ? minutesBetween(i.acceptedAt, i.completedAt) : null,
        mttd: i.completedAt ? minutesBetween(i.createdAt, i.completedAt) : null,
      })),
    [effectiveIncidents]
  );

  const kpi = useMemo(() => {
    const mttaVals = enriched.filter((i) => i.mtta != null).map((i) => i.mtta as number);
    const mttrVals = enriched.filter((i) => i.mttr != null).map((i) => i.mttr as number);
    const mttdVals = enriched.filter((i) => i.mttd != null).map((i) => i.mttd as number);
    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);
    return {
      mtta: avg(mttaVals),
      mttr: avg(mttrVals),
      mttd: avg(mttdVals),
      count: enriched.length,
      downtime: mttdVals.reduce((s, n) => s + n, 0),
    };
  }, [enriched]);

  const trendData: TrendPoint[] = useMemo(() => {
    type Bucket = { key: number; label: string; mttaSum: number; mttaN: number; mttrSum: number; mttrN: number; mttdSum: number; mttdN: number; downtime: number };
    const buckets = new Map<number, Bucket>();
    for (const i of enriched) {
      const d = new Date(i.createdAt);
      const wk = isoWeek(d);
      const key = d.getUTCFullYear() * 100 + wk;
      let b = buckets.get(key);
      if (!b) {
        b = { key, label: `Tuần ${wk}`, mttaSum: 0, mttaN: 0, mttrSum: 0, mttrN: 0, mttdSum: 0, mttdN: 0, downtime: 0 };
        buckets.set(key, b);
      }
      if (i.mtta != null) { b.mttaSum += i.mtta; b.mttaN++; }
      if (i.mttr != null) { b.mttrSum += i.mttr; b.mttrN++; }
      if (i.mttd != null) { b.mttdSum += i.mttd; b.mttdN++; b.downtime += i.mttd; }
    }
    return Array.from(buckets.values())
      .sort((a, b) => a.key - b.key)
      .map((b) => ({
        label: b.label,
        mtta: b.mttaN ? round1(b.mttaSum / b.mttaN) : 0,
        mttr: b.mttrN ? round1(b.mttrSum / b.mttrN) : 0,
        mttd: b.mttdN ? round1(b.mttdSum / b.mttdN) : 0,
        downtime: round1(b.downtime),
      }));
  }, [enriched]);

  const paretoByLine: ParetoItem[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of enriched) {
      if (i.mttd == null) continue;
      const key = i.lineName || i.areaName || 'Khác';
      map.set(key, (map.get(key) ?? 0) + i.mttd);
    }
    return Array.from(map, ([label, value]) => ({ label, value: Math.round(value) }));
  }, [enriched]);

  const paretoByMachine: ParetoItem[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of enriched) map.set(i.machineCode, (map.get(i.machineCode) ?? 0) + 1);
    return Array.from(map, ([label, value]) => ({ label, value }));
  }, [enriched]);

  const paretoByCategory: ParetoItem[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of enriched) {
      const key = i.categoryName || 'Chưa phân loại';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map, ([label, value]) => ({ label, value }));
  }, [enriched]);

  const paretoByParts: ParetoItem[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of effectiveLogs) {
      if (!l.partsReplaced) continue;
      try {
        const parsed: PartsPayload = JSON.parse(l.partsReplaced);
        if (Array.isArray(parsed.parts)) {
          for (const p of parsed.parts) {
            if (!p?.name) continue;
            map.set(p.name, (map.get(p.name) ?? 0) + (Number(p.quantity) || 1));
          }
        }
      } catch {
        /* ignore */
      }
    }
    return Array.from(map, ([label, value]) => ({ label, value }));
  }, [effectiveLogs]);

  const monthlyReport = useMemo(() => {
    type MBucket = { mttaSum: number; mttaN: number; mttrSum: number; mttrN: number; mttdSum: number; mttdN: number; sortKey: number };
    const map = new Map<string, MBucket>();
    for (const i of enriched) {
      const d = new Date(i.createdAt);
      const label = `Th${d.getMonth() + 1}/${d.getFullYear()}`;
      const sortKey = d.getFullYear() * 100 + d.getMonth();
      let b = map.get(label);
      if (!b) { b = { mttaSum: 0, mttaN: 0, mttrSum: 0, mttrN: 0, mttdSum: 0, mttdN: 0, sortKey }; map.set(label, b); }
      if (i.mtta != null) { b.mttaSum += i.mtta; b.mttaN++; }
      if (i.mttr != null) { b.mttrSum += i.mttr; b.mttrN++; }
      if (i.mttd != null) { b.mttdSum += i.mttd; b.mttdN++; }
    }
    const months = Array.from(map.entries()).sort((a, b) => a[1].sortKey - b[1].sortKey);
    return {
      months: months.map(([label]) => label),
      rows: [
        { metric: 'MTTA (phút)', values: months.map(([, b]) => (b.mttaN ? round1(b.mttaSum / b.mttaN) : null)), mean: round1(kpi.mtta) },
        { metric: 'MTTR (phút)', values: months.map(([, b]) => (b.mttrN ? round1(b.mttrSum / b.mttrN) : null)), mean: round1(kpi.mttr) },
        { metric: 'MTTD (phút)', values: months.map(([, b]) => (b.mttdN ? round1(b.mttdSum / b.mttdN) : null)), mean: round1(kpi.mttd) },
      ],
    };
  }, [enriched, kpi]);

  const reliability = useMemo(() => {
    type RBucket = { code: string; name: string; type: string; events: number[]; mttrSum: number; mttrN: number; downtime: number; count: number };
    const map = new Map<string, RBucket>();
    for (const i of enriched) {
      let r = map.get(i.machineCode);
      if (!r) { r = { code: i.machineCode, name: i.machineName, type: i.machineTypeName || '—', events: [], mttrSum: 0, mttrN: 0, downtime: 0, count: 0 }; map.set(i.machineCode, r); }
      r.count++;
      r.events.push(new Date(i.createdAt).getTime());
      if (i.mttr != null) { r.mttrSum += i.mttr; r.mttrN++; }
      if (i.mttd != null) r.downtime += i.mttd;
    }
    return Array.from(map.values())
      .map((r) => {
        const sorted = [...r.events].sort((a, b) => a - b);
        let mtbf: number | null = null;
        if (sorted.length >= 2) {
          const gaps: number[] = [];
          for (let k = 1; k < sorted.length; k++) gaps.push((sorted[k] - sorted[k - 1]) / 60000);
          mtbf = gaps.reduce((s, n) => s + n, 0) / gaps.length;
        }
        return { code: r.code, name: r.name, type: r.type, count: r.count, mtbf, mttr: r.mttrN ? r.mttrSum / r.mttrN : null, downtime: round1(r.downtime) };
      })
      .sort((a, b) => b.count - a.count);
  }, [enriched]);

  const reliabilityFiltered = useMemo(() => {
    const q = reliabilitySearch.trim().toLowerCase();
    if (!q) return reliability;
    return reliability.filter((r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }, [reliability, reliabilitySearch]);

  const detailIncidents = useMemo(
    () => (detailMachineCode ? enriched.filter((i) => i.machineCode === detailMachineCode).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []),
    [detailMachineCode, enriched]
  );

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    machines.forEach((m) => map.set(m.statusName || m.status || 'Đang sử dụng', (map.get(m.statusName || m.status || 'Đang sử dụng') ?? 0) + 1));
    return Array.from(map, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [machines]);
  const overdueMaintenance = scheduleMachines.filter((m) => m.status === 'overdue').length;
  const upcomingMaintenance = scheduleMachines.filter((m) => m.status === 'upcoming').length;
  const pendingProposals = proposals.filter((p) => !p.resolved).length;
  const shortcuts = [
    { label: 'Danh Sách MMTB', href: '/maintenance/machines', icon: IconDeviceLaptop, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Bảo Dưỡng MMTB', href: '/maintenance/schedule', icon: IconClockHour4, bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Nhu Cầu Sửa Chữa', href: '/maintenance/tickets', icon: IconAlertTriangle, bg: 'bg-rose-50', text: 'text-rose-600' },
    { label: 'Đề Xuất Cải Tiến', href: '/maintenance/proposals', icon: IconBulb, bg: 'bg-violet-50', text: 'text-violet-600' },
  ];

  return (
    <MaintenanceShell title="Tổng Quan MMTB" subtitle="Phân tích MTTA/MTTR/MTTD, Pareto sự cố & độ tin cậy thiết bị — SKECHERS / TBS Group II">
      <div className="space-y-6">
        {scope === 'ALL' ? (
          /* Tab "Tổng Quan" khoanh đỏ ở /work (scope=ALL) — dashboard SO SÁNH 6 đơn vị (KG1/KG2/
             KG3/HTĐ trong Tổ Hợp Kiên Giang + Nhà Máy Miền Đông + Văn Phòng Chuỗi), KHÔNG phải chi
             tiết 1 nhà máy. Miền Đông/Văn Phòng Chuỗi chưa có hệ thống MMTB thật kết nối nên luôn
             hiện 0 — khung sẵn sàng tự hiện số thật ngay khi 2 khu vực đó có dữ liệu. */
          <div>
            {/* Header + bộ lọc khoảng ngày — rộng bằng đúng hàng 6 ô bên dưới (không kéo margin âm
                ra ngoài lề trang, khớp đúng ảnh mẫu: header vẫn nằm trong lề trang bình thường,
                chỉ bo góc nhẹ thay vì bo tròn lớn), sát luôn xuống hàng 6 ô bên dưới (mt-2). */}
            <div className="bg-gradient-to-r from-[#1e4d8c] to-[#2f74c4] rounded-lg p-5 sm:p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <IconBuildingFactory size={30} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-wide">Tổng Quan Hiệu Suất 6 Đơn Vị</h1>
                  <p className="text-sm sm:text-base text-blue-100/90 font-medium mt-0.5">So sánh hiệu suất xử lý sự cố MMTB theo thời gian thực</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DateRangeFilter from={compDateFrom} to={compDateTo} onFromChange={setCompDateFrom} onToChange={setCompDateTo} />
                <button
                  onClick={() => setCompRefreshNonce((n) => n + 1)}
                  disabled={compLoading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#006838] text-white text-sm font-bold hover:bg-[#00552d] disabled:opacity-50 h-[42px] shrink-0 cursor-pointer"
                >
                  <IconFilter size={14} /> {compLoading ? 'Đang lọc...' : 'Lọc'}
                </button>
                <button
                  onClick={() => setCompTestMode((v) => !v)}
                  title="Bật/tắt dữ liệu mẫu để test giao diện — không phải dữ liệu thật"
                  className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold h-[42px] shrink-0 cursor-pointer border ${
                    compTestMode ? 'bg-amber-400 text-amber-950 border-amber-400 hover:bg-amber-300' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                  }`}
                >
                  <IconFlask size={14} /> {compTestMode ? 'Đang xem dữ liệu mẫu' : 'Data Test'}
                </button>
              </div>
            </div>

          <div className="space-y-4 mt-2">
            {/* 6 card KPI (Thời gian xử lý trung bình / MTTR) + sparkline + % so kỳ trước — nền màu
                pastel riêng từng đơn vị, khớp đúng ảnh mẫu (không phải nền trắng), gần như không có
                khoảng cách giữa các card để đọc liền thành 1 dải màu. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
              {compUnits.map((u) => {
                const d = effectiveCompData[u.key] || ZERO_COMP_DATA;
                const delta = deltaPercent(d.kpi.mttr, d.prevKpi.mttr);
                const spark = d.daily.map((p) => ({ value: p.mttr }));
                return (
                  <div key={u.key} className="rounded-2xl p-3" style={{ backgroundColor: `${u.color}1f` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: u.color }}>
                        <u.icon size={20} className="text-white" />
                      </div>
                      <span className="text-lg font-extrabold text-slate-800 truncate">{u.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{fmtMin(d.kpi.mttr)}</span>
                      <span className="text-2xl font-bold text-slate-500">phút</span>
                    </div>
                    <p className="text-sm text-slate-600 font-bold">Thời gian xử lý TB</p>
                    <div className="flex items-end justify-between gap-2 mt-1">
                      <DeltaBadge percent={delta} />
                      <div className="w-20 shrink-0"><Sparkline data={spark} color={u.color} height={30} /></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Biểu đồ so sánh 6 đường + Xếp hạng hiệu suất */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider">
                      <IconChartLine size={28} className="text-[#006838]" /> Xu Hướng Theo Ngày
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Biểu đồ thể hiện chỉ số theo ngày trong kỳ đang xem</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                    <button
                      onClick={() => setCompMetric('mttr')}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${compMetric === 'mttr' ? 'bg-[#006838] text-white' : 'text-slate-500'}`}
                    >
                      Thời gian trung bình xử lý (phút)
                    </button>
                    <button
                      onClick={() => setCompMetric('downtime')}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${compMetric === 'downtime' ? 'bg-[#006838] text-white' : 'text-slate-500'}`}
                    >
                      Downtime TB (phút)
                    </button>
                  </div>
                </div>
                {compLoading && compChartData.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">Đang tải biểu đồ so sánh...</div>
                ) : (
                  <MultiLineComparisonChart data={compChartData} series={compSeries} valueLabel={compMetric === 'mttr' ? 'Thời gian trung bình (phút)' : 'Downtime TB (phút)'} />
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider">
                    <IconTrophy size={20} className="text-amber-500" /> Xếp Hạng Hiệu Suất
                  </h2>
                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                    <button
                      onClick={() => setCompMetric('mttr')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${compMetric === 'mttr' ? 'bg-[#006838] text-white' : 'text-slate-500'}`}
                    >
                      Thời gian xử lý TB
                    </button>
                    <button
                      onClick={() => setCompMetric('downtime')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${compMetric === 'downtime' ? 'bg-[#006838] text-white' : 'text-slate-500'}`}
                    >
                      Downtime TB
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {rankedUnits.map((u, idx) => {
                    const decreased = u.delta !== null && u.delta < 0; // xanh = tăng, đỏ = giảm (khớp yêu cầu)
                    return (
                      <div key={u.key} className="flex items-center gap-3">
                        <span className="w-6 text-base font-extrabold text-slate-400 shrink-0">{idx + 1}</span>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: u.color }}>
                          <u.icon size={20} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-base font-bold text-slate-800 truncate">{u.label}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-base font-mono font-extrabold text-slate-900">{fmtMin(u.value)}p</span>
                              {u.delta === null ? (
                                <span className="text-sm font-bold text-slate-400 w-14 text-right">—</span>
                              ) : (
                                <span className={`inline-flex items-center gap-0.5 text-sm font-bold w-14 justify-end ${decreased ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {decreased ? <IconTrendingDown size={15} /> : <IconTrendingUp size={15} />}
                                  {Math.abs(u.delta)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(4, u.ratio * 100)}%`, backgroundColor: u.color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bảng chi tiết + Biểu đồ cột + Nhận xét nhanh */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 overflow-x-auto">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                  <IconClipboardList size={24} className="text-[#006838]" /> Chi Tiết Theo Nhà Máy
                </h2>
                <table className="w-full text-left border-collapse text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-3 border border-slate-200">Nhà Máy</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center">Thời Gian TB<br />(phút)</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center">Tổng Sự Cố</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center">Downtime<br />(phút)</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center">So Với<br />Kỳ Trước</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compUnits.map((u) => {
                      const d = effectiveCompData[u.key] || ZERO_COMP_DATA;
                      const delta = deltaPercent(d.kpi.mttr, d.prevKpi.mttr);
                      return (
                        <tr key={u.key} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 border border-slate-200 font-bold text-slate-800">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: u.color }} />
                              {u.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-mono font-bold text-slate-800">{fmtMin(d.kpi.mttr)}</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-mono font-bold text-slate-800">{d.kpi.count}</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-mono font-bold text-slate-800">{fmtMin(d.kpi.downtime)}</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center">
                            {delta === null ? <span className="text-slate-400 font-bold">—</span> : (
                              <span className={`font-bold ${delta <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{delta > 0 ? '+' : ''}{delta}%</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5">
                <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  <IconChartBar size={15} className="text-[#006838]" /> Tổng Số Sự Cố Theo Đơn Vị
                </h2>
                <UnitBarChart data={compUnits.map((u) => ({ label: u.label, value: (effectiveCompData[u.key] || ZERO_COMP_DATA).kpi.count, color: u.color }))} valueLabel="Số sự cố" height={260} />
              </div>

              <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <IconBulbFilled size={16} className="text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Nhận Xét Nhanh</h2>
                </div>
                {compInsights.lines.length === 0 ? (
                  <p className="text-xs text-slate-400">Chưa đủ dữ liệu để nhận xét trong kỳ này.</p>
                ) : (
                  <>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {compInsights.lines.map((line, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <IconArrowRight size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs font-bold text-emerald-800 mt-3 pt-3 border-t border-emerald-200/70">{compInsights.conclusion}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          </div>
        ) : (
          /* Tab "Tổng Quan" RIÊNG trong sidebar từng nhà máy (Kiên Giang/Miền Đông/Văn phòng) —
             giữ nguyên như trước khi có bảng so sánh: bộ lọc Nhà máy/Phân xưởng/Line/Chọn theo
             tháng/Khoảng thời gian tuỳ chỉnh + 5 ô KPI, khớp đúng trang Tổng Quan thật bên
             thkiengiangshoes. */
          <>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3 flex flex-wrap items-center gap-2">
              <FilterSelect
                value={pFactoryId}
                onChange={(v) => { setPFactoryId(v); setPAreaId(''); setPLineId(''); }}
                options={factories.map((f) => ({ id: f.id, name: f.name }))}
                placeholder="Tất cả nhà máy"
                className="flex-1 min-w-[130px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              />
              <FilterSelect
                value={pAreaId}
                onChange={(v) => { setPAreaId(v); setPLineId(''); }}
                options={areaOptions}
                placeholder="Tất cả phân xưởng"
                className="flex-1 min-w-[130px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              />
              <FilterSelect
                value={pLineId}
                onChange={setPLineId}
                options={lineOptions}
                placeholder="Tất cả line"
                className="flex-1 min-w-[110px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              />
              <div className="relative shrink-0">
                <IconCalendar size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="month"
                  value={pMonth}
                  onChange={(e) => handlePickMonth(e.target.value)}
                  title="Chọn theo tháng"
                  className="pl-7 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold h-[34px] w-[132px]"
                />
              </div>
              <DateRangeFilter
                from={pDateFrom}
                to={pDateTo}
                onFromChange={(v) => { setPMonth(''); setPDateFrom(v); }}
                onToChange={(v) => { setPMonth(''); setPDateTo(v); }}
              />
              <button
                onClick={handleApplyFilter}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#006838] text-white text-xs font-bold hover:bg-[#00552d] disabled:opacity-50 h-[34px] shrink-0 cursor-pointer"
              >
                <IconFilter size={13} /> {loading ? 'Đang lọc...' : 'Lọc'}
              </button>
            </div>

            <StatCardRow
              items={[
                { key: 'mtta', label: 'MTTA', sub: 'Chờ tiếp nhận', value: `${fmtMin(kpi.mtta)} phút`, icon: IconStopwatch, bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
                { key: 'mttr', label: 'MTTR', sub: 'Thời gian xử lý', value: `${fmtMin(kpi.mttr)} phút`, icon: IconTool, bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', text: 'text-indigo-600' },
                { key: 'mttd', label: 'MTTD', sub: 'Thời gian dừng máy', value: `${fmtMin(kpi.mttd)} phút`, icon: IconGauge, bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600' },
                { key: 'count', label: 'Tổng Sự Cố', sub: 'Số vụ việc', value: `${kpi.count}`, icon: IconAlertTriangle, bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600' },
                { key: 'downtime', label: 'Tổng Downtime', sub: 'Tổng dừng máy', value: `${fmtMin(kpi.downtime)} phút`, icon: IconClockHour4, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
              ]}
            />
          </>
        )}

        {/* Tổng Quan RIÊNG từng nhà máy (scope !== 'ALL') — Xu Hướng/Pareto/Báo Cáo Tháng/Độ Tin
            Cậy/Lối Tắt, giữ nguyên như trước khi có dashboard 6 đơn vị. Không hiện ở tab "Tổng
            Quan" khoanh đỏ (scope=ALL) — đã có dashboard riêng đầy đủ ở trên rồi. */}
        {scope !== 'ALL' && (
        <>
        {/* Trend Analysis Section */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Xu Hướng Thời Gian Phản Hồi Theo Tuần</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Biểu đồ theo dõi tổng thời gian dừng máy (Downtime) và các chỉ số MTTA/MTTR/MTTD
              </p>
            </div>
          </div>
          {loading ? <div className="p-8 text-center text-xs text-slate-400">Đang tải biểu đồ xu hướng...</div> : <TrendChart data={trendData} />}
        </div>

        {/* Pareto Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Pareto — Downtime Theo Line / Phân Xưởng</h2>
            {loading ? <div className="p-8 text-center text-xs text-slate-400">Đang tải...</div> : <ParetoChart data={paretoByLine} valueLabel="Downtime (phút)" barColor="#006838" />}
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Pareto — Top Máy Gặp Sự Cố Nhiều Nhất</h2>
            {loading ? <div className="p-8 text-center text-xs text-slate-400">Đang tải...</div> : <ParetoChart data={paretoByMachine} valueLabel="Số lượng sự cố" barColor="#1d4ed8" />}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Pareto — Phân Loại Danh Mục Hư hỏng</h2>
            {loading ? <div className="p-8 text-center text-xs text-slate-400">Đang tải...</div> : <ParetoChart data={paretoByCategory} valueLabel="Số lượng sự cố" barColor="#b91c1c" />}
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Pareto — Linh Kiện & Phụ Tùng Thay Thế Nhiều Nhất</h2>
            {loading ? <div className="p-8 text-center text-xs text-slate-400">Đang tải...</div> : <ParetoChart data={paretoByParts} valueLabel="Số lượng thay thế" barColor="#b45309" />}
          </div>
        </div>

        {/* Monthly Downtime Report */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Báo Cáo Tổng Hợp Downtime Theo Tháng</h2>
          {monthlyReport.months.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Chưa có dữ liệu thống kê tháng</div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 whitespace-nowrap">
                    <th className="p-3">Chỉ số chỉ tiêu</th>
                    {monthlyReport.months.map((m) => (
                      <th key={m} className="p-3">{m}</th>
                    ))}
                    <th className="p-3 text-right">Trung bình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {monthlyReport.rows.map((row) => (
                    <tr key={row.metric} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{row.metric}</td>
                      {row.values.map((v, idx) => (
                        <td key={idx} className="p-3 font-mono">{v == null ? '—' : v}</td>
                      ))}
                      <td className="p-3 font-mono font-bold text-[#006838] text-right">{row.mean}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reliability Equipment Registry Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Phân Tích Độ Tin Cậy Thiết Bị (Reliability Registry)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Danh sách xếp hạng máy móc theo tần suất sự cố, MTBF & MTTR</p>
            </div>
            <div className="relative">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={reliabilitySearch}
                onChange={(e) => setReliabilitySearch(e.target.value)}
                placeholder="Tìm mã hoặc tên thiết bị..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-64 focus:outline-none focus:border-[#006838]"
              />
            </div>
          </div>

          {reliabilityFiltered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{reliability.length === 0 ? 'Chưa có dữ liệu sự cố trong khoảng lọc' : 'Không tìm thấy thiết bị phù hợp'}</div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/80 rounded-lg max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100/90 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 whitespace-nowrap">
                    <th className="p-3">Mã / Tên Thiết Bị</th>
                    <th className="p-3">Chủng Loại</th>
                    <th className="p-3 text-center">Số Lần Lỗi</th>
                    <th className="p-3 text-right">MTBF (phút)</th>
                    <th className="p-3 text-right">MTTR (phút)</th>
                    <th className="p-3 text-right">Downtime (phút)</th>
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 whitespace-nowrap">
                  {reliabilityFiltered.map((r) => (
                    <tr key={r.code} className="hover:bg-slate-50/90 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="font-mono text-[11px] text-[#006838] font-semibold">{r.code}</div>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">{r.type}</td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono font-bold text-[11px]">
                          {r.count}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-right text-slate-800">{fmtMin(r.mtbf)}</td>
                      <td className="p-3 font-mono text-right text-slate-800">{fmtMin(r.mttr)}</td>
                      <td className="p-3 font-mono text-right font-bold text-rose-700">{r.downtime}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => setDetailMachineCode(r.code)} className="px-2.5 py-1 rounded-md bg-emerald-50 text-[#006838] border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer">
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Operational Shortcuts */}
        {quickLoading ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 text-center text-xs text-slate-400">Đang tải lối tắt vận hành...</div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Truy Cập Nhanh Phân Hệ</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {shortcuts.map((s) => (
                <NavLink key={s.href} href={s.href} className="flex items-center gap-3 rounded-xl bg-white border border-slate-200/80 p-3.5 hover:border-emerald-300 hover:shadow-xs transition-all">
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <s.icon size={20} className={s.text} />
                  </div>
                  <span className="text-xs font-bold text-slate-900">{s.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {/* Equipment History Modal */}
      {detailMachineCode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setDetailMachineCode(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Lịch Sử Sự Cố Thiết Bị</h3>
                <p className="font-mono text-xs text-[#006838] font-bold mt-0.5">Mã máy: {detailMachineCode}</p>
              </div>
              <button onClick={() => setDetailMachineCode(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <IconX size={18} />
              </button>
            </div>
            <div className="overflow-y-auto space-y-2.5 pr-1">
              {detailIncidents.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Chưa ghi nhận sự cố cho thiết bị này</p>}
              {detailIncidents.map((i) => (
                <div key={i.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900">{new Date(i.createdAt).toLocaleString('vi-VN')}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">{i.categoryName ?? 'Chưa phân loại'}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-slate-600 font-medium pt-1 border-t border-slate-200/50">
                    <span>MTTA: <b className="font-mono text-slate-900">{fmtMin(i.mtta)} ph</b></span>
                    <span>MTTR: <b className="font-mono text-slate-900">{fmtMin(i.mttr)} ph</b></span>
                    <span>MTTD: <b className="font-mono text-slate-900">{fmtMin(i.mttd)} ph</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </MaintenanceShell>
  );
}
