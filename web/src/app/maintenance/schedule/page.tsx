'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconDeviceLaptop,
  IconCalendarCheck,
  IconAlertTriangle,
  IconClockHour4,
  IconCircleCheck,
  IconFilter,
  IconCalendar,
  IconPhoto,
  IconUser,
  IconUserCheck,
  IconBuildingFactory,
  IconMapPin,
  IconClock,
  IconTool,
  IconX,
} from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import StatCardRow from '@/components/StatCardRow';
import FilterSelect from '@/components/FilterSelect';
import RefreshButton from '@/components/RefreshButton';
import Pagination from '@/components/Pagination';
import DateRangeFilter, { inDateRange } from '@/components/DateRangeFilter';

const PAGE_SIZE = 50;
import { mmtbTabCache } from '@/lib/mmtbTabCache';
import { getCurrentMmtbScope } from '@/lib/equipmentScope';

type ScheduleMachine = {
  id: string;
  code: string;
  name: string;
  factoryId: string | null;
  factoryName: string | null;
  areaId: string | null;
  areaName: string | null;
  scheduled: boolean;
  periodId: string | null;
  periodName: string | null;
  periodDays: number | null;
  lastMaintenanceDate: string | null;
  dueDate: string | null;
  daysLeft: number | null;
  status: 'unscheduled' | 'overdue' | 'upcoming' | 'scheduled';
};

type Period = { id: string; name: string; days: number | null };

type LogEntry = {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  factoryName: string | null;
  areaName: string | null;
  technicianName: string;
  technicianCode: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  repairDetail: string;
  partsReplaced: string | null;
  incidentDescription: string | null;
  // Các trường dưới đây API thật đã trả sẵn (đã xác nhận qua curl) nhưng trước giờ chưa dùng tới —
  // cần cho tab "DTBD Thực Tế" (ảnh trước/sau, chu kỳ đã gán, ghi chú lần bảo trì kế tiếp).
  repairNote: string | null;
  periodName: string | null;
  nextMaintenanceDueAt: string | null;
  nextMaintenanceNote: string | null;
  imagesBefore: string[];
  proofImages: string[];
};

function renderScheduleStatusBadge(m: ScheduleMachine) {
  if (m.status === 'unscheduled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>Chưa lên lịch</span>
      </span>
    );
  }
  if (m.status === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
        <span>Quá hạn {Math.abs(m.daysLeft ?? 0)} ngày</span>
      </span>
    );
  }
  if (m.status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        <span>Còn {m.daysLeft} ngày</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
      <span>Còn {m.daysLeft} ngày</span>
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function todayInputValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Tab = 'assign' | 'track' | 'actual';

// "yyyy-Www" (giá trị <input type="week">, tuần ISO Thứ 2 -> Chủ Nhật) -> ngày đầu/cuối tuần đó.
function weekToDateRangeLocal(weekStr: string): { from: string; to: string } {
  const [yearStr, weekPart] = weekStr.split('-W');
  const year = Number(yearStr);
  const week = Number(weekPart);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return { from: fmt(monday), to: fmt(sunday) };
}

// "yyyy-mm" -> ngày 1 tới ngày cuối tháng đó.
function monthToDateRangeLocal(monthStr: string): { from: string; to: string } {
  const [y, m] = monthStr.split('-').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${monthStr}-01`, to: `${monthStr}-${pad(lastDay)}` };
}

export default function MaintenanceSchedulePage() {
  // Mỗi khu vực có dữ liệu MMTB riêng — cache key phải theo scope (xem machines/page.tsx).
  const scope = getCurrentMmtbScope();
  const ck = (key: string) => `${key}_${scope}`;

  const [machines, setMachines] = useState<ScheduleMachine[]>(() => mmtbTabCache.get<ScheduleMachine[]>(ck('schedule_machines')) ?? []);
  // Chỉ tính "Máy đã kiểm kê" (đã xuất hiện ≥1 lần trong nhật ký Kiểm Kê) — khớp đúng cách trang
  // Danh Sách MMTB thật đang lọc. Dùng chung cache key với trang Máy Móc để 2 trang khớp số liệu.
  const [verifiedCodes, setVerifiedCodes] = useState<Set<string>>(() => new Set(mmtbTabCache.get<string[]>(ck('machines_verified')) ?? []));
  const [periods, setPeriods] = useState<Period[]>(() => mmtbTabCache.get<Period[]>(ck('schedule_periods')) ?? []);
  const [completedThisMonth, setCompletedThisMonth] = useState(() => mmtbTabCache.get<number>(ck('schedule_completed')) ?? 0);
  const [logs, setLogs] = useState<LogEntry[]>(() => mmtbTabCache.get<LogEntry[]>(ck('schedule_logs')) ?? []);
  const [loading, setLoading] = useState(() => !mmtbTabCache.has(ck('schedule_machines')));
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('assign');

  const [refreshing, setRefreshing] = useState(false);
  // Bấm ô "Bảo trì quá hạn"/"Sắp đến hạn" -> lọc thẳng bảng ở tab "Lên Lịch Bảo Trì" theo đúng
  // trạng thái đó (bấm lại để bỏ lọc). Ô "Hoàn thành tháng này" không lọc theo status được (số này
  // tính từ log bảo trì riêng) nên bấm vào sẽ chuyển sang tab "Theo Dõi Lịch Trình" thay vì lọc.
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<'overdue' | 'upcoming' | null>(null);

  // Bộ lọc tab "DTBD Thực Tế" — ĐẶT Ở TRANG CHA (không phải trong ActualMaintenanceTab) vì hàng lọc
  // này nằm riêng, bên TRÊN hàng tab (xem khối "Bộ lọc tìm kiếm" ngay trước hàng TABS).
  const [aFactoryId, setAFactoryId] = useState('');
  const [aAreaId, setAAreaId] = useState('');
  const [aDateFrom, setADateFrom] = useState('');
  const [aDateTo, setADateTo] = useState('');
  const [aWeek, setAWeek] = useState('');
  const [aMonth, setAMonth] = useState('');

  const load = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      setError(null);
      const fresh = force ? '&fresh=1' : '';
      const settled = await Promise.allSettled([
        fetch(`/api/maintenance/schedule?scope=${scope}${fresh}`).then((r) => r.json()),
        fetch(`/api/maintenance/logs?scope=${scope}${fresh}`).then((r) => r.json()),
        fetch(`/api/maintenance/inventory-log?scope=${scope}${fresh}`).then((r) => r.json()),
      ]);
      const [scheduleRes, logsRes, inventoryLogRes] = settled.map((s) => (s.status === 'fulfilled' ? s.value : { success: false, error: String(s.reason) }));
      if (scheduleRes.success) {
        // Backend thoáng qua trả "success:true" nhưng machines rỗng khi quá tải — nếu tin ngay sẽ
        // xoá trắng danh sách đang có mỗi lần rời trang rồi quay lại (xem machines/page.tsx). CHỈ
        // ghi đè bằng mảng rỗng khi trước đó thật sự chưa có gì.
        const newMachines: ScheduleMachine[] = scheduleRes.machines || [];
        const prevMachines = mmtbTabCache.get<ScheduleMachine[]>(ck('schedule_machines'));
        if (newMachines.length > 0 || !prevMachines || prevMachines.length === 0) {
          setMachines(newMachines);
          mmtbTabCache.set(ck('schedule_machines'), newMachines);
        } else {
          console.warn('Bỏ qua kết quả rỗng bất thường từ tbsMayMoc (schedule_machines) — giữ dữ liệu cũ');
        }
        setPeriods(scheduleRes.periods || []);
        setCompletedThisMonth(scheduleRes.completedThisMonth || 0);
        mmtbTabCache.set(ck('schedule_periods'), scheduleRes.periods || []);
        mmtbTabCache.set(ck('schedule_completed'), scheduleRes.completedThisMonth || 0);
      } else {
        console.warn('Failed to load schedule from tbsMayMoc:', scheduleRes.error);
        setError(scheduleRes.error || 'Không lấy được dữ liệu lịch bảo trì');
      }
      if (logsRes.success) {
        setLogs(logsRes.data || []);
        mmtbTabCache.set(ck('schedule_logs'), logsRes.data || []);
      }
      if (inventoryLogRes.success && Array.isArray(inventoryLogRes.rows)) {
        const codes = new Set<string>(inventoryLogRes.rows.map((r: any) => r.machine?.code).filter(Boolean));
        setVerifiedCodes(codes);
        mmtbTabCache.set(ck('machines_verified'), [...codes]);
      } else {
        console.warn('Failed to load inventory-log from tbsMayMoc:', inventoryLogRes.error);
      }
    } catch (err) {
      console.warn('Failed to fetch schedule from tbsMayMoc:', err);
    } finally {
      force ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    // Cache còn mới (<2 phút) -> bỏ hẳn lượt tải nền (xem lib/mmtbTabCache.ts).
    if (!mmtbTabCache.isFresh(ck('schedule_machines'))) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifiedMachines = useMemo(
    () => machines.filter((m) => verifiedCodes.has(m.code)),
    [machines, verifiedCodes]
  );

  const factoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    verifiedMachines.forEach((m) => { if (m.factoryId && m.factoryName) map.set(m.factoryId, m.factoryName); });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [verifiedMachines]);

  const stats = useMemo(() => {
    let overdue = 0, upcoming = 0, assigned = 0;
    for (const m of verifiedMachines) {
      if (m.status === 'overdue') overdue++;
      else if (m.status === 'upcoming') upcoming++;
      // Đã gán lịch bảo dưỡng = CÒN "scheduled" (có chu kỳ bảo trì gán sẵn), bất kể hiện đang quá
      // hạn/sắp đến hạn/trong hạn — khác "status === 'scheduled'" chỉ tính riêng máy đang trong hạn.
      if (m.scheduled) assigned++;
    }
    return { total: verifiedMachines.length, overdue, upcoming, assigned, completedThisMonth };
  }, [verifiedMachines, completedThisMonth]);

  // ---- Dữ liệu cho bộ lọc + lưới "DTBD Thực Tế" ----
  const aAreaOptions = useMemo(() => {
    const map = new Map<string, string>();
    verifiedMachines.forEach((m) => {
      if (m.areaId && m.areaName && (!aFactoryId || m.factoryId === aFactoryId)) map.set(m.areaId, m.areaName);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [verifiedMachines, aFactoryId]);

  const aDateRange = useMemo(() => {
    if (aDateFrom || aDateTo) return { from: aDateFrom, to: aDateTo };
    if (aWeek) return weekToDateRangeLocal(aWeek);
    if (aMonth) return monthToDateRangeLocal(aMonth);
    return { from: '', to: '' };
  }, [aDateFrom, aDateTo, aWeek, aMonth]);

  const aFilteredLogs = useMemo(() => {
    const areaName = aAreaId ? aAreaOptions.find((a) => a.id === aAreaId)?.name : null;
    return logs
      .filter(
        (l) =>
          (!aFactoryId || factoryOptions.find((f) => f.id === aFactoryId)?.name === l.factoryName) &&
          (!areaName || l.areaName === areaName) &&
          inDateRange(l.endTime, aDateRange.from, aDateRange.to),
      )
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
  }, [logs, aFactoryId, factoryOptions, aAreaId, aAreaOptions, aDateRange]);

  function handlePickADateRange(from: string, to: string) { setADateFrom(from); setADateTo(to); setAWeek(''); setAMonth(''); }
  function handlePickAWeek(v: string) { setAWeek(v); setADateFrom(''); setADateTo(''); setAMonth(''); }
  function handlePickAMonth(v: string) { setAMonth(v); setADateFrom(''); setADateTo(''); setAWeek(''); }

  return (
    <MaintenanceShell title="Bảo Dưỡng MMTB" subtitle="Kế hoạch bảo trì định kỳ, kiểm tra & lập lịch thiết bị — SKECHERS / TBS Group II">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Kế Hoạch & Lịch Bảo Dưỡng MMTB</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{stats.total} máy trong chương trình quản lý lịch bảo trì</p>
          </div>
          <RefreshButton onClick={() => load(true)} loading={refreshing} />
        </div>

        {/* Status Ribbon — bấm "Quá hạn"/"Sắp đến hạn" để lọc bảng tab "Lên Lịch Bảo Trì"; bấm
            "Hoàn thành tháng này" để chuyển sang tab "Theo Dõi Lịch Trình" */}
        <StatCardRow
          items={[
            { key: 'total', label: 'Tổng số thiết bị', value: stats.total, icon: IconDeviceLaptop, bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-300', active: tab === 'assign' && !scheduleStatusFilter, onClick: () => { setTab('assign'); setScheduleStatusFilter(null); } },
            { key: 'assigned', label: 'Máy Đã Gán Lịch', value: stats.assigned, icon: IconCalendarCheck, bg: 'bg-teal-50', iconBg: 'bg-teal-100', text: 'text-teal-600' },
            { key: 'overdue', label: 'Bảo trì quá hạn', value: stats.overdue, icon: IconAlertTriangle, bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-300', active: tab === 'assign' && scheduleStatusFilter === 'overdue', onClick: () => { setTab('assign'); setScheduleStatusFilter((prev) => (prev === 'overdue' ? null : 'overdue')); } },
            { key: 'upcoming', label: 'Sắp đến hạn', value: stats.upcoming, icon: IconClockHour4, bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-300', active: tab === 'assign' && scheduleStatusFilter === 'upcoming', onClick: () => { setTab('assign'); setScheduleStatusFilter((prev) => (prev === 'upcoming' ? null : 'upcoming')); } },
            { key: 'completed', label: 'Hoàn thành tháng này', value: stats.completedThisMonth, icon: IconCircleCheck, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-300', active: tab === 'track', onClick: () => setTab('track') },
          ]}
        />

        {/* Bộ lọc "DTBD Thực Tế" — hàng riêng full-width, chỉ hiện khi đang ở tab này, nằm TRÊN
            hàng tab (đúng bố cục ảnh mẫu). */}
        {tab === 'actual' && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <IconFilter size={16} className="text-[#006838]" />
                Bộ lọc tìm kiếm
              </div>
              {(aFactoryId || aAreaId || aDateFrom || aDateTo || aWeek || aMonth) && (
                <button
                  type="button"
                  onClick={() => { setAFactoryId(''); setAAreaId(''); setADateFrom(''); setADateTo(''); setAWeek(''); setAMonth(''); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Xoá bộ lọc
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <label className="block">
                <span className="block text-[11px] font-bold text-slate-500 mb-1">Nhà máy</span>
                <FilterSelect
                  value={aFactoryId}
                  onChange={(v) => { setAFactoryId(v); setAAreaId(''); }}
                  options={factoryOptions}
                  placeholder="Tất cả nhà máy"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-bold text-slate-500 mb-1">Phân xưởng</span>
                <FilterSelect
                  value={aAreaId}
                  onChange={setAAreaId}
                  options={aAreaOptions}
                  placeholder={aFactoryId ? 'Tất cả phân xưởng' : 'Chọn nhà máy trước'}
                  disabled={!aFactoryId}
                />
              </label>
              {/* Chiếm 2 cột — cần đủ chỗ cho 2 ô ngày (từ/đến) nằm cạnh nhau, ép vào 1 cột như các
                  ô 1-input khác sẽ bị tràn/chồng lên ô kế bên. */}
              <label className="block sm:col-span-2 lg:col-span-2">
                <span className="block text-[11px] font-bold text-slate-500 mb-1">Khoảng ngày</span>
                <DateRangeFilter
                  from={aDateFrom}
                  to={aDateTo}
                  onFromChange={(v) => handlePickADateRange(v, aDateTo)}
                  onToChange={(v) => handlePickADateRange(aDateFrom, v)}
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-bold text-slate-500 mb-1">Chọn theo tuần</span>
                <div className="relative">
                  <IconCalendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="week"
                    value={aWeek}
                    onChange={(e) => handlePickAWeek(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold h-[38px]"
                  />
                </div>
              </label>
              <label className="block">
                <span className="block text-[11px] font-bold text-slate-500 mb-1">Chọn theo tháng</span>
                <div className="relative">
                  <IconCalendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="month"
                    value={aMonth}
                    onChange={(e) => handlePickAMonth(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold h-[38px]"
                  />
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
          {[
            { key: 'assign' as Tab, label: 'Lên Lịch Bảo Trì' },
            { key: 'track' as Tab, label: 'Theo Dõi Lịch Trình' },
            { key: 'actual' as Tab, label: 'DTBD Thực Tế' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                tab === t.key ? 'bg-[#006838] text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-xs text-slate-400">Đang tải dữ liệu lịch bảo trì...</div>
        ) : (
          <>
            {tab === 'assign' && (
              <AssignTab machines={verifiedMachines} periods={periods} factoryOptions={factoryOptions} onAssigned={load} statusFilter={scheduleStatusFilter} />
            )}
            {tab === 'track' && <TrackTab machines={verifiedMachines} logs={logs} factoryOptions={factoryOptions} />}
            {tab === 'actual' && <ActualMaintenanceTab logs={aFilteredLogs} />}
          </>
        )}
      </div>
    </MaintenanceShell>
  );
}

// ============================== TAB 1: LÊN LỊCH BẢO TRÌ ==============================

function AssignTab({
  machines,
  periods,
  factoryOptions,
  onAssigned,
  statusFilter,
}: {
  machines: ScheduleMachine[];
  periods: Period[];
  factoryOptions: { id: string; name: string }[];
  onAssigned: () => Promise<void>;
  statusFilter: 'overdue' | 'upcoming' | null;
}) {
  const [search, setSearch] = useState('');
  const [factoryId, setFactoryId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [periodId, setPeriodId] = useState('');
  const [anchorDate, setAnchorDate] = useState(todayInputValue());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const areaOptions = useMemo(() => {
    const map = new Map<string, string>();
    machines.forEach((m) => {
      if (m.areaId && m.areaName && (!factoryId || m.factoryId === factoryId)) map.set(m.areaId, m.areaName);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [machines, factoryId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return machines.filter((m) => {
      const matchesQ = !q || m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
      const matchesFactory = !factoryId || m.factoryId === factoryId;
      const matchesArea = !areaId || m.areaId === areaId;
      const matchesStatus = !statusFilter || m.status === statusFilter;
      return matchesQ && matchesFactory && matchesArea && matchesStatus;
    });
  }, [machines, search, factoryId, areaId, statusFilter]);

  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search, factoryId, areaId, statusFilter]);
  const pageItems = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (filtered.every((m) => prev.has(m.id))) return new Set();
      return new Set(filtered.map((m) => m.id));
    });
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!periodId) {
      setFormError('Vui lòng chọn Chu kỳ bảo trì');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/maintenance/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineIds: Array.from(selected), maintenancePeriodId: periodId, anchorDate }),
      });
      const result = await res.json();
      if (!result.success) {
        setFormError(result.error || 'Không gán được lịch bảo trì');
        return;
      }
      setShowAssignForm(false);
      setSelected(new Set());
      setPeriodId('');
      await onAssigned();
    } catch {
      setFormError('Không kết nối được tới hệ thống MMTB');
    } finally {
      setSubmitting(false);
    }
  }

  const allChecked = filtered.length > 0 && filtered.every((m) => selected.has(m.id));

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-2.5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã tài sản, tên máy..."
          className="min-w-[220px] flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
        />
        <FilterSelect
          value={factoryId}
          onChange={(v) => { setFactoryId(v); setAreaId(''); }}
          options={factoryOptions}
          placeholder="Tất cả nhà máy"
        />
        <FilterSelect
          value={areaId}
          onChange={setAreaId}
          options={areaOptions}
          placeholder={factoryId ? 'Tất cả khu vực' : 'Chọn nhà máy trước'}
          disabled={!factoryId}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#eef7f2] text-xs font-semibold text-tbs-dark uppercase border-b border-emerald-100 whitespace-nowrap">
              <th className="p-4 w-10">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4" />
              </th>
              <th className="p-4">Mã Tài Sản</th>
              <th className="p-4">Tên Máy</th>
              <th className="p-4">Nhà Máy</th>
              <th className="p-4">Khu Vực</th>
              <th className="p-4">Chu Kỳ Hiện Tại</th>
              <th className="p-4">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700 whitespace-nowrap">
            {filtered.length === 0 && (
              <tr><td className="p-4 text-gray-400" colSpan={7}>Không có máy phù hợp</td></tr>
            )}
            {pageItems.map((m) => {
              return (
                <tr key={m.id} className={`hover:bg-slate-50/90 transition-colors ${selected.has(m.id) ? 'bg-emerald-50/50' : ''}`}>
                  <td className="p-3"><input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} className="w-4 h-4 rounded text-[#006838]" /></td>
                  <td className="p-3 font-mono font-bold text-[#006838]">{m.code}</td>
                  <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                  <td className="p-3 text-slate-600">{m.factoryName ?? '-'}</td>
                  <td className="p-3 text-slate-600">{m.areaName ?? '-'}</td>
                  <td className="p-3 text-slate-600">{m.periodName ?? '-'}</td>
                  <td className="p-3">{renderScheduleStatusBadge(m)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {showAssignForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAssign} className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-tbs-dark">Gán Lịch Bảo Trì</h3>
            <p className="text-xs text-gray-500">Áp dụng cho <span className="font-bold text-accent">{selected.size}</span> máy đã chọn</p>
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">⚠️ {formError}</div>
            )}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-600">Chu kỳ bảo trì *</span>
              <div className="grid grid-cols-2 gap-2">
                {periods.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPeriodId(p.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                      periodId === p.id ? 'bg-accent text-white border-accent' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-xs font-semibold text-gray-600 space-y-1">
              <span>Ngày bắt đầu tính *</span>
              <input
                type="date"
                value={anchorDate}
                onChange={(e) => setAnchorDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal"
                required
              />
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAssignForm(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">
                Huỷ
              </button>
              <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-light disabled:opacity-50">
                {submitting ? 'Đang lưu...' : 'Áp Dụng'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================== TAB 2: THEO DÕI BẢO TRÌ ==============================

function TrackTab({
  machines,
  logs,
  factoryOptions,
}: {
  machines: ScheduleMachine[];
  logs: LogEntry[];
  factoryOptions: { id: string; name: string }[];
}) {
  const [factoryId, setFactoryId] = useState('');
  const [areaId, setAreaId] = useState('');

  // Xưởng lọc theo Nhà máy đã chọn — giống hệt pattern ở Tab 1 (UnscheduledMachinesXxx), dựng từ
  // chính danh sách máy (machines đã có sẵn areaId/areaName/factoryId).
  const areaOptions = useMemo(() => {
    const map = new Map<string, string>();
    machines.forEach((m) => {
      if (m.areaId && m.areaName && (!factoryId || m.factoryId === factoryId)) map.set(m.areaId, m.areaName);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [machines, factoryId]);

  const needsAction = useMemo(() => {
    return machines
      .filter(
        (m) =>
          (m.status === 'overdue' || m.status === 'upcoming') &&
          (!factoryId || m.factoryId === factoryId) &&
          (!areaId || m.areaId === areaId),
      )
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  }, [machines, factoryId, areaId]);

  // LogEntry (lịch sử bảo trì) chỉ có tên Xưởng dạng chữ, không có ID riêng — so tên qua
  // areaOptions (đã lọc đúng Nhà máy) giống cách factoryName đang được so tên bên dưới.
  const filteredLogs = useMemo(() => {
    const areaName = areaId ? areaOptions.find((a) => a.id === areaId)?.name : null;
    return logs.filter(
      (l) =>
        (!factoryId || factoryOptions.find((f) => f.id === factoryId)?.name === l.factoryName) &&
        (!areaName || l.areaName === areaName),
    );
  }, [logs, factoryId, factoryOptions, areaId, areaOptions]);

  const [needsActionPage, setNeedsActionPage] = useState(1);
  useEffect(() => {
    setNeedsActionPage(1);
  }, [factoryId, areaId]);
  const needsActionPageItems = useMemo(
    () => needsAction.slice((needsActionPage - 1) * PAGE_SIZE, needsActionPage * PAGE_SIZE),
    [needsAction, needsActionPage]
  );

  const [logsPage, setLogsPage] = useState(1);
  useEffect(() => {
    setLogsPage(1);
  }, [factoryId, areaId]);
  const logsPageItems = useMemo(
    () => filteredLogs.slice((logsPage - 1) * PAGE_SIZE, logsPage * PAGE_SIZE),
    [filteredLogs, logsPage]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-2.5">
        <FilterSelect
          value={factoryId}
          onChange={(v) => { setFactoryId(v); setAreaId(''); }}
          options={factoryOptions}
          placeholder="Tất cả nhà máy"
        />
        <FilterSelect
          value={areaId}
          onChange={setAreaId}
          options={areaOptions}
          placeholder={factoryId ? 'Tất cả khu vực' : 'Chọn nhà máy trước'}
          disabled={!factoryId}
        />
      </div>

      <div>
        <h2 className="text-sm font-extrabold text-tbs-dark mb-2 flex items-center gap-1.5">
          <IconAlertTriangle size={16} className="text-rose-500" /> Cần Xử Lý ({needsAction.length})
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eef7f2] text-xs font-semibold text-tbs-dark uppercase border-b border-emerald-100 whitespace-nowrap">
                <th className="p-4">Mã Tài Sản</th>
                <th className="p-4">Tên Máy</th>
                <th className="p-4">Nhà Máy</th>
                <th className="p-4">Khu Vực</th>
                <th className="p-4">Chu Kỳ</th>
                <th className="p-4">Hạn Tiếp Theo</th>
                <th className="p-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 whitespace-nowrap">
              {needsAction.length === 0 && (
                <tr><td className="p-4 text-gray-400" colSpan={7}>Không có máy nào cần xử lý — mọi thứ đều trong hạn 🎉</td></tr>
              )}
              {needsActionPageItems.map((m) => {
                return (
                  <tr key={m.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#006838]">{m.code}</td>
                    <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                    <td className="p-3 text-slate-600">{m.factoryName ?? '-'}</td>
                    <td className="p-3 text-slate-600">{m.areaName ?? '-'}</td>
                    <td className="p-3 text-slate-600">{m.periodName ?? '-'}</td>
                    <td className="p-3 font-mono text-slate-700">{formatDate(m.dueDate)}</td>
                    <td className="p-3">{renderScheduleStatusBadge(m)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={needsActionPage} totalItems={needsAction.length} pageSize={PAGE_SIZE} onPageChange={setNeedsActionPage} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-extrabold text-tbs-dark mb-2 flex items-center gap-1.5">
          <IconCircleCheck size={16} className="text-emerald-500" /> Lịch Sử Đã Bảo Trì ({filteredLogs.length})
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eef7f2] text-xs font-semibold text-tbs-dark uppercase border-b border-emerald-100 whitespace-nowrap">
                <th className="p-4">Mã Máy</th>
                <th className="p-4">Tên Máy</th>
                <th className="p-4">Nhà Máy / Khu Vực</th>
                <th className="p-4">Kỹ Thuật Viên</th>
                <th className="p-4">Thời Gian Hoàn Thành</th>
                <th className="p-4">Thời Lượng</th>
                <th className="p-4">Nội Dung Sửa Chữa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {filteredLogs.length === 0 && (
                <tr><td className="p-4 text-gray-400" colSpan={7}>Chưa có lịch sử bảo trì nào</td></tr>
              )}
              {logsPageItems.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/80 transition align-top">
                  <td className="p-4 font-mono font-bold text-accent whitespace-nowrap">{l.machineCode}</td>
                  <td className="p-4 font-semibold text-tbs-dark whitespace-nowrap">{l.machineName}</td>
                  <td className="p-4 whitespace-nowrap">{l.factoryName ?? '-'} / {l.areaName ?? '-'}</td>
                  <td className="p-4 whitespace-nowrap">{l.technicianName} ({l.technicianCode})</td>
                  <td className="p-4 whitespace-nowrap">{formatDateTime(l.endTime)}</td>
                  <td className="p-4 whitespace-nowrap">{l.durationMinutes} phút</td>
                  <td className="p-4 min-w-[220px]">{l.repairDetail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={logsPage} totalItems={filteredLogs.length} pageSize={PAGE_SIZE} onPageChange={setLogsPage} />
        </div>
      </div>
    </div>
  );
}

// ============================== TAB 3: DTBD THỰC TẾ ==============================
// Lưới thẻ (không phải bảng) — bộ lọc (Nhà máy/Phân xưởng/ngày/tuần/tháng) nằm ở trang cha (ngang
// hàng nút "Làm mới dữ liệu"/trên hàng tab) — component này chỉ nhận `logs` ĐÃ LỌC SẴN, thuần hiển
// thị lưới thẻ + popup chi tiết khi bấm vào 1 thẻ.
function ActualMaintenanceTab({ logs }: { logs: LogEntry[] }) {
  const [detailLog, setDetailLog] = useState<LogEntry | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-slate-500">{logs.length} lượt Duy Tu Bảo Dưỡng</p>

      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-xs text-gray-400">
          Chưa có lượt Duy Tu Bảo Dưỡng nào khớp bộ lọc
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {logs.map((l) => {
            const cover = (l.proofImages || [])[0] || (l.imagesBefore || [])[0] || null;
            return (
              <div
                key={l.id}
                onClick={() => setDetailLog(l)}
                className="rounded-2xl bg-white border border-gray-200/90 shadow-sm hover:shadow-md hover:border-accent/60 transition-all cursor-pointer overflow-hidden flex flex-col"
              >
                <div className="relative h-28 bg-gray-100 border-b border-gray-100 overflow-hidden flex items-center justify-center">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 text-gray-300">
                      <IconPhoto size={26} />
                      <span className="text-[10px] font-bold">Chưa có ảnh</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white flex items-center justify-between text-[10px] font-bold">
                    <span className="flex items-center gap-1 truncate max-w-[70%]">
                      <IconUser size={12} className="text-gray-300 shrink-0" />
                      <span className="truncate">{l.technicianName}</span>
                    </span>
                    <span className="font-mono text-[9px] text-emerald-300 shrink-0">{l.machineCode}</span>
                  </div>
                </div>
                <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-tbs-dark text-xs line-clamp-1" title={l.machineName}>{l.machineName}</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug" title={l.repairDetail}>{l.repairDetail}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-1 border-t border-gray-100">
                      <span className="flex items-center gap-1 truncate">
                        <IconBuildingFactory size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate">{l.factoryName ?? '—'}</span>
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <IconMapPin size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate">{l.areaName ?? '—'}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold pt-1 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <IconClock size={12} /> {formatDateTime(l.endTime)}
                    </span>
                    <span>{l.durationMinutes} phút</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailLog && <MaintenanceLogDetailModal log={detailLog} onClose={() => setDetailLog(null)} />}
    </div>
  );
}

function MaintenanceLogDetailModal({ log: l, onClose }: { log: LogEntry; onClose: () => void }) {
  const imagesBefore = l.imagesBefore || [];
  const proofImages = l.proofImages || [];
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] lg:max-w-6xl xl:max-w-7xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-tbs-dark">{l.machineName}</h3>
              <p className="text-xs text-gray-400 font-mono">{l.machineCode}</p>
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center shrink-0 cursor-pointer">
              <IconX size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <IconUserCheck size={15} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 font-semibold">Kỹ thuật viên</p>
                <p className="font-bold text-tbs-dark">{l.technicianName} ({l.technicianCode})</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <IconClock size={15} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 font-semibold">Thời gian</p>
                <p className="font-bold text-tbs-dark">Nhận: {formatDateTime(l.startTime)}</p>
                <p className="text-gray-500">Xong: {formatDateTime(l.endTime)} · {l.durationMinutes} phút</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <IconTool size={15} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 font-semibold">Vị trí</p>
                <p className="font-bold text-tbs-dark">{l.factoryName ?? '—'} / {l.areaName ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <IconCalendarCheck size={15} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 font-semibold">Chu kỳ bảo dưỡng</p>
                <p className="font-bold text-tbs-dark">{l.periodName ?? 'Không gán chu kỳ (bảo trì chủ động)'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3 space-y-2">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Nội dung sửa chữa</p>
              <p className="text-sm font-semibold text-emerald-800 whitespace-pre-wrap">{l.repairDetail}</p>
            </div>
            {l.partsReplaced && (
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Linh kiện thay thế</p>
                <p className="text-sm text-emerald-800">{l.partsReplaced}</p>
              </div>
            )}
            {l.repairNote && (
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Ghi chú</p>
                <p className="text-sm text-emerald-800 whitespace-pre-wrap">{l.repairNote}</p>
              </div>
            )}
          </div>

          {(l.nextMaintenanceNote || l.nextMaintenanceDueAt) && (
            <div className="rounded-2xl bg-sky-50/60 border border-sky-100 p-3 space-y-1">
              <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wide mb-1">Nội dung bảo trì lần tới</p>
              {l.nextMaintenanceNote && <p className="text-sm text-sky-800 whitespace-pre-wrap">{l.nextMaintenanceNote}</p>}
              {l.nextMaintenanceDueAt && <p className="text-xs text-sky-600 mt-1">Hạn tiếp theo: {formatDate(l.nextMaintenanceDueAt)}</p>}
            </div>
          )}

          {imagesBefore.length > 0 && (
            <div className="rounded-2xl bg-amber-50/60 border border-amber-100 p-3">
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide mb-1.5">Ảnh trước khi sửa</p>
              <div className="grid grid-cols-4 gap-2">
                {imagesBefore.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full aspect-square rounded-lg object-cover border border-gray-200" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {proofImages.length > 0 && (
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3 mt-5">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-1.5">Ảnh hoàn thành</p>
              <div className="grid grid-cols-4 gap-2">
                {proofImages.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full aspect-square rounded-lg object-cover border border-gray-200" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {imagesBefore.length === 0 && proofImages.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <IconPhoto size={16} /> Không có ảnh
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
