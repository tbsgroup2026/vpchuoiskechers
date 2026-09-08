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
} from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import FilterSelect from '@/components/FilterSelect';
import DateRangeFilter, { inDateRange } from '@/components/DateRangeFilter';
import ParetoChart, { type ParetoItem } from '@/components/charts/ParetoChart';
import TrendChart, { type TrendPoint } from '@/components/charts/TrendChart';
import { generateMockOverviewData } from '@/lib/mmtbMockOverview';

type Machine = {
  id: string;
  statusName: string;
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

export default function OverviewPage() {
  // ---- Khối tóm tắt nhanh ----
  const [machines, setMachines] = useState<Machine[]>([]);
  const [scheduleMachines, setScheduleMachines] = useState<ScheduleMachine[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [quickLoading, setQuickLoading] = useState(true);

  // ---- Bộ lọc phân tích (Nhà máy/Phân xưởng/Line + thời gian) ----
  const [factories, setFactories] = useState<CategoryOption[]>([]);
  const [areas, setAreas] = useState<CategoryOption[]>([]);
  const [lines, setLines] = useState<CategoryOption[]>([]);
  const [pFactoryId, setPFactoryId] = useState('');
  const [pAreaId, setPAreaId] = useState('');
  const [pLineId, setPLineId] = useState('');
  const [pDateFrom, setPDateFrom] = useState('');
  const [pDateTo, setPDateTo] = useState('');

  // ---- Dữ liệu phân tích ----
  const [incidents, setIncidents] = useState<OverviewIncident[]>([]);
  const [logs, setLogs] = useState<OverviewLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [reliabilitySearch, setReliabilitySearch] = useState('');
  const [detailMachineCode, setDetailMachineCode] = useState<string | null>(null);

  // ---- Dữ liệu mẫu (bật/tắt cạnh nút Lọc) ----
  const [testDataOn, setTestDataOn] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState({ factoryId: '', areaId: '', lineId: '', dateFrom: '', dateTo: '' });

  async function loadOverview(params: { factoryId: string; areaId: string; lineId: string; dateFrom: string; dateTo: string }) {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams();
      if (params.factoryId) qs.set('factoryId', params.factoryId);
      if (params.areaId) qs.set('areaId', params.areaId);
      if (params.lineId) qs.set('lineId', params.lineId);
      if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
      if (params.dateTo) qs.set('dateTo', params.dateTo);
      const res = await fetch(`/api/maintenance/overview-report${qs.toString() ? `?${qs}` : ''}`);
      const result = await res.json();
      if (result.success) {
        setIncidents(result.incidents || []);
        setLogs(result.logs || []);
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
        setQuickLoading(true);
        const settled = await Promise.allSettled([
          fetch('/api/maintenance/machines').then((r) => r.json()),
          fetch('/api/maintenance/schedule').then((r) => r.json()),
          fetch('/api/maintenance/proposals').then((r) => r.json()),
          fetch('/api/maintenance/categories?type=FACTORY').then((r) => r.json()),
          fetch('/api/maintenance/categories?type=AREA').then((r) => r.json()),
          fetch('/api/maintenance/categories?type=PRODUCTION_LINE').then((r) => r.json()),
        ]);
        const [machinesRes, scheduleRes, proposalsRes, facRes, areaRes, lineRes] = settled.map((s) =>
          s.status === 'fulfilled' ? s.value : { success: false },
        );
        if (machinesRes.success) setMachines(machinesRes.data || []);
        if (scheduleRes.success) setScheduleMachines(scheduleRes.machines || []);
        if (proposalsRes.success) setProposals(proposalsRes.data || []);
        if (facRes.success) setFactories(facRes.data || []);
        if (areaRes.success) setAreas(areaRes.data || []);
        if (lineRes.success) setLines(lineRes.data || []);
      } catch {
        /* khối tóm tắt nhanh — lỗi không chặn phần phân tích bên dưới */
      } finally {
        setQuickLoading(false);
      }
    })();
    loadOverview({ factoryId: '', areaId: '', lineId: '', dateFrom: '', dateTo: '' });
  }, []);

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

  const mockPool = useMemo(() => generateMockOverviewData(machines), [machines]);
  const mockMatchIndex = useMemo(() => {
    const idxs: number[] = [];
    mockPool.incidents.forEach((inc, idx) => {
      if (
        (!appliedFilters.factoryId || inc.factoryId === appliedFilters.factoryId) &&
        (!appliedFilters.areaId || inc.areaId === appliedFilters.areaId) &&
        (!appliedFilters.lineId || inc.lineId === appliedFilters.lineId) &&
        inDateRange(inc.createdAt, appliedFilters.dateFrom, appliedFilters.dateTo)
      ) {
        idxs.push(idx);
      }
    });
    return idxs;
  }, [mockPool, appliedFilters]);
  const filteredMockIncidents = useMemo(() => mockMatchIndex.map((idx) => mockPool.incidents[idx]), [mockMatchIndex, mockPool]);
  const filteredMockLogs = useMemo(() => mockMatchIndex.map((idx) => mockPool.logs[idx]), [mockMatchIndex, mockPool]);
  const showMock = incidents.length === 0 && testDataOn;
  const effectiveIncidents: OverviewIncident[] = incidents.length > 0 ? incidents : showMock ? filteredMockIncidents : [];
  const effectiveLogs: OverviewLog[] = incidents.length > 0 ? logs : showMock ? filteredMockLogs : [];

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
        {/* Top Header & Operational Status Ribbon */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-emerald-800/30 p-5 sm:p-6 text-white shadow-md space-y-4 group">
          {/* Background Real Image & Dark Emerald Gradient Overlay */}
          <img
            src="/images/KGLV/CĐTT 2 LỐI VÀO.png"
            alt="Quản Lý MMTB / Bảo Trì SKECHERS"
            className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#006838]/90 via-[#004d29]/80 to-slate-950/85 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 bg-white/10 backdrop-blur-md px-3 py-0.5 rounded-lg border border-white/15">
                QUẢN LÝ MÁY MÓC THIẾT BỊ (MMTB)
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">Tổng Quan Máy Móc Thiết Bị</h1>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">Báo cáo vận hành thời gian thực & phân tích độ tin cậy MMTB toàn chuỗi SKECHERS</p>
            </div>
            
            {/* Live Status Summary Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Hoạt động: <strong className="font-mono text-emerald-950">{machines.filter(m => normalizeStatus(m.statusName).includes('su dung') || normalizeStatus(m.statusName).includes('operating')).length || machines.length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>Bảo trì: <strong className="font-mono text-amber-950">{machines.filter(m => normalizeStatus(m.statusName).includes('bao tri')).length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Sự cố / Hư: <strong className="font-mono text-rose-950">{machines.filter(m => normalizeStatus(m.statusName).includes('khong su dung') || normalizeStatus(m.statusName).includes('down')).length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <span>Quá hạn: <strong className="font-mono text-slate-900">{overdueMaintenance}</strong></span>
              </div>
            </div>
          </div>

          {/* Single-Row Filter Toolbar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap xl:flex-nowrap items-end gap-2 sm:gap-2.5">
            <label className="flex-1 min-w-[120px]">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nhà máy</span>
              <FilterSelect
                value={pFactoryId}
                onChange={(v) => { setPFactoryId(v); setPAreaId(''); setPLineId(''); }}
                options={factories.map((f) => ({ id: f.id, name: f.name }))}
                placeholder="Tất cả nhà máy"
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium h-[38px]"
              />
            </label>
            <label className="flex-1 min-w-[120px]">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phân xưởng</span>
              <FilterSelect
                value={pAreaId}
                onChange={(v) => { setPAreaId(v); setPLineId(''); }}
                options={areaOptions}
                placeholder="Tất cả phân xưởng"
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium h-[38px]"
              />
            </label>
            <label className="flex-1 min-w-[110px]">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Line</span>
              <FilterSelect
                value={pLineId}
                onChange={setPLineId}
                options={lineOptions}
                placeholder="Tất cả line"
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium h-[38px]"
              />
            </label>
            <label className="shrink-0">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Khoảng thời gian</span>
              <DateRangeFilter from={pDateFrom} to={pDateTo} onFromChange={setPDateFrom} onToChange={setPDateTo} />
            </label>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTestDataOn((v) => !v)}
                title={
                  incidents.length > 0
                    ? 'Đã có sự cố thật khớp bộ lọc — luôn ưu tiên hiện dữ liệu thật'
                    : testDataOn
                      ? 'Đang hiện dữ liệu mẫu — bấm để tắt'
                      : 'Đang tắt dữ liệu mẫu — bấm để bật lại'
                }
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition h-[38px] whitespace-nowrap cursor-pointer ${
                  testDataOn ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <IconFlask size={14} />
                <span>Dữ liệu mẫu: {testDataOn ? 'Bật' : 'Tắt'}</span>
              </button>
              <button
                onClick={handleApplyFilter}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg bg-[#006838] text-white text-xs font-bold hover:bg-[#004d28] disabled:opacity-50 h-[38px] whitespace-nowrap cursor-pointer transition-colors"
              >
                <IconFilter size={14} /> {loading ? 'Đang lọc...' : 'Lọc dữ liệu'}
              </button>
            </div>
          </div>
        </div>

        {/* Industrial KPI Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'MTTA', sub: 'Chờ tiếp nhận', value: `${fmtMin(kpi.mtta)}`, unit: 'phút', icon: IconStopwatch, border: 'border-blue-200', text: 'text-blue-700', bg: 'bg-blue-50/50' },
            { label: 'MTTR', sub: 'Thời gian xử lý', value: `${fmtMin(kpi.mttr)}`, unit: 'phút', icon: IconTool, border: 'border-indigo-200', text: 'text-indigo-700', bg: 'bg-indigo-50/50' },
            { label: 'MTTD', sub: 'Thời gian dừng máy', value: `${fmtMin(kpi.mttd)}`, unit: 'phút', icon: IconGauge, border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50/50' },
            { label: 'Tổng Sự Cố', sub: 'Số vụ việc', value: `${kpi.count}`, unit: 'sự cố', icon: IconAlertTriangle, border: 'border-rose-200', text: 'text-rose-700', bg: 'bg-rose-50/50' },
            { label: 'Tổng Downtime', sub: 'Tổng dừng máy', value: `${fmtMin(kpi.downtime)}`, unit: 'phút', icon: IconClockHour4, border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50/50' },
          ].map((c) => (
            <div key={c.label} className={`bg-white rounded-xl border ${c.border} p-3.5 shadow-2xs`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</span>
                <div className={`p-1.5 rounded-md ${c.bg}`}>
                  <c.icon size={15} className={c.text} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">{c.value}</span>
                <span className="text-xs font-medium text-slate-400">{c.unit}</span>
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-1">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Trend Analysis Section */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Xu Hướng Thời Gian Phản Hồi Theo Tuần</h2>
              <p className="text-xs text-slate-500 mt-0.5">Biểu đồ theo dõi tổng thời gian dừng máy (Downtime) và các chỉ số MTTA/MTTR/MTTD</p>
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
