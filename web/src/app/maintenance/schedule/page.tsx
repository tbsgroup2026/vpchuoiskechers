'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconDeviceLaptop,
  IconAlertTriangle,
  IconClockHour4,
  IconCircleCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCalendarStats,
} from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import StatCardRow from '@/components/StatCardRow';
import FilterSelect from '@/components/FilterSelect';
import RefreshButton from '@/components/RefreshButton';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 50;
import {
  buildMaintenanceCalendarMap,
  buildCalendarWeeks,
  type CalendarCell,
} from '@/lib/maintenanceCalendar';
import { readMaintenanceCache, writeMaintenanceCache } from '@/lib/maintenanceCache';
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

const MONTH_NAMES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

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

type Tab = 'assign' | 'track' | 'calendar';

export default function MaintenanceSchedulePage() {
  // Mỗi khu vực có dữ liệu MMTB riêng — cache key phải theo scope (xem machines/page.tsx).
  const scope = getCurrentMmtbScope();
  const ck = (key: string) => `${key}_${scope}`;

  const [machines, setMachines] = useState<ScheduleMachine[]>(() => readMaintenanceCache<ScheduleMachine[]>(ck('schedule_machines')) || []);
  // Chỉ tính "Máy đã kiểm kê" (đã xuất hiện ≥1 lần trong nhật ký Kiểm Kê) — khớp đúng cách trang
  // Danh Sách MMTB thật đang lọc. Dùng chung cache key với trang Máy Móc để 2 trang khớp số liệu.
  const [verifiedCodes, setVerifiedCodes] = useState<Set<string>>(() => new Set(readMaintenanceCache<string[]>(ck('machines_verified')) || []));
  const [periods, setPeriods] = useState<Period[]>(() => readMaintenanceCache<Period[]>(ck('schedule_periods')) || []);
  const [completedThisMonth, setCompletedThisMonth] = useState(() => readMaintenanceCache<number>(ck('schedule_completed')) || 0);
  const [logs, setLogs] = useState<LogEntry[]>(() => readMaintenanceCache<LogEntry[]>(ck('schedule_logs')) || []);
  const [loading, setLoading] = useState(() => readMaintenanceCache<ScheduleMachine[]>(ck('schedule_machines')) === null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('assign');

  const [refreshing, setRefreshing] = useState(false);
  // Bấm ô "Bảo trì quá hạn"/"Sắp đến hạn" -> lọc thẳng bảng ở tab "Lên Lịch Bảo Trì" theo đúng
  // trạng thái đó (bấm lại để bỏ lọc). Ô "Hoàn thành tháng này" không lọc theo status được (số này
  // tính từ log bảo trì riêng) nên bấm vào sẽ chuyển sang tab "Theo Dõi Lịch Trình" thay vì lọc.
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<'overdue' | 'upcoming' | null>(null);

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
        const prevMachines = readMaintenanceCache<ScheduleMachine[]>(ck('schedule_machines'));
        if (newMachines.length > 0 || !prevMachines || prevMachines.length === 0) {
          setMachines(newMachines);
          writeMaintenanceCache(ck('schedule_machines'), newMachines);
        } else {
          console.warn('Bỏ qua kết quả rỗng bất thường từ tbsMayMoc (schedule_machines) — giữ dữ liệu cũ');
        }
        setPeriods(scheduleRes.periods || []);
        setCompletedThisMonth(scheduleRes.completedThisMonth || 0);
        writeMaintenanceCache(ck('schedule_periods'), scheduleRes.periods || []);
        writeMaintenanceCache(ck('schedule_completed'), scheduleRes.completedThisMonth || 0);
      } else {
        console.warn('Failed to load schedule from tbsMayMoc:', scheduleRes.error);
        setError(scheduleRes.error || 'Không lấy được dữ liệu lịch bảo trì');
      }
      if (logsRes.success) {
        setLogs(logsRes.data || []);
        writeMaintenanceCache(ck('schedule_logs'), logsRes.data || []);
      }
      if (inventoryLogRes.success && Array.isArray(inventoryLogRes.rows)) {
        const codes = new Set<string>(inventoryLogRes.rows.map((r: any) => r.machine?.code).filter(Boolean));
        setVerifiedCodes(codes);
        writeMaintenanceCache(ck('machines_verified'), [...codes]);
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
    load();
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
    let overdue = 0, upcoming = 0;
    for (const m of verifiedMachines) {
      if (m.status === 'overdue') overdue++;
      else if (m.status === 'upcoming') upcoming++;
    }
    return { total: verifiedMachines.length, overdue, upcoming, completedThisMonth };
  }, [verifiedMachines, completedThisMonth]);

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
            { key: 'overdue', label: 'Bảo trì quá hạn', value: stats.overdue, icon: IconAlertTriangle, bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-300', active: tab === 'assign' && scheduleStatusFilter === 'overdue', onClick: () => { setTab('assign'); setScheduleStatusFilter((prev) => (prev === 'overdue' ? null : 'overdue')); } },
            { key: 'upcoming', label: 'Sắp đến hạn', value: stats.upcoming, icon: IconClockHour4, bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-300', active: tab === 'assign' && scheduleStatusFilter === 'upcoming', onClick: () => { setTab('assign'); setScheduleStatusFilter((prev) => (prev === 'upcoming' ? null : 'upcoming')); } },
            { key: 'completed', label: 'Hoàn thành tháng này', value: stats.completedThisMonth, icon: IconCircleCheck, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-300', active: tab === 'track', onClick: () => setTab('track') },
          ]}
        />

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
          {[
            { key: 'assign' as Tab, label: 'Lên Lịch Bảo Trì' },
            { key: 'track' as Tab, label: 'Theo Dõi Lịch Trình' },
            { key: 'calendar' as Tab, label: 'Xem Lịch Tháng' },
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
            {tab === 'calendar' && <CalendarTab machines={verifiedMachines} factoryOptions={factoryOptions} />}
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

  // Xưởng lọc theo Nhà máy đã chọn — giống hệt pattern ở Tab 1 (UnscheduledMachinesXxx) và Tab 3
  // (CalendarTab), dựng từ chính danh sách máy (machines đã có sẵn areaId/areaName/factoryId).
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

// ============================== TAB 3: XEM LỊCH BẢO TRÌ ==============================

function CalendarTab({
  machines,
  factoryOptions,
}: {
  machines: ScheduleMachine[];
  factoryOptions: { id: string; name: string }[];
}) {
  const [factoryId, setFactoryId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedCell, setSelectedCell] = useState<CalendarCell | null>(null);

  const areaOptions = useMemo(() => {
    const map = new Map<string, string>();
    machines.forEach((m) => {
      if (m.areaId && m.areaName && (!factoryId || m.factoryId === factoryId)) map.set(m.areaId, m.areaName);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [machines, factoryId]);

  const filtered = useMemo(() => {
    return machines.filter((m) => (!factoryId || m.factoryId === factoryId) && (!areaId || m.areaId === areaId));
  }, [machines, factoryId, areaId]);

  const now = new Date();
  const monthStart = cursor;
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
  const weeks = useMemo(() => {
    const map = buildMaintenanceCalendarMap(filtered, monthStart, monthEnd, now);
    return buildCalendarWeeks(map, monthStart, monthEnd, now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, cursor]);

  const DOT_COLOR: Record<string, string> = { overdue: 'bg-rose-500', upcoming: 'bg-amber-500', done: 'bg-emerald-500' };
  const DOT_LABEL: Record<string, string> = { overdue: 'Quá hạn', upcoming: 'Sắp đến hạn', done: 'Đã bảo trì' };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-2.5">
        <FilterSelect value={factoryId} onChange={(v) => { setFactoryId(v); setAreaId(''); }} options={factoryOptions} placeholder="Tất cả nhà máy" />
        <FilterSelect value={areaId} onChange={setAreaId} options={areaOptions} placeholder={factoryId ? 'Tất cả khu vực' : 'Chọn nhà máy trước'} disabled={!factoryId} />
        <div className="ml-auto flex items-center gap-3">
          {Object.entries(DOT_LABEL).map(([k, label]) => (
            <span key={k} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-full ${DOT_COLOR[k]}`} />{label}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500">
            <IconChevronLeft size={16} />
          </button>
          <span className="text-sm font-extrabold text-tbs-dark flex items-center gap-1.5">
            <IconCalendarStats size={16} className="text-accent" /> {MONTH_NAMES[cursor.getMonth()]}/{cursor.getFullYear()}
          </span>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500">
            <IconChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="text-[10px] font-bold text-gray-400 pb-1">{w}</div>
          ))}
          {weeks.flatMap((week, wi) =>
            week.map((cell, di) => {
              if (!cell) return <div key={`${wi}-${di}`} />;
              const dotColor = cell.status ? DOT_COLOR[cell.status] : '';
              return (
                <button
                  key={cell.date}
                  onClick={() => cell.machines.length > 0 && setSelectedCell(cell)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-bold border transition ${
                    cell.isToday ? 'border-accent ring-1 ring-accent' : 'border-gray-100'
                  } ${cell.machines.length > 0 ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                >
                  <span className={cell.isToday ? 'text-accent' : 'text-gray-700'}>{cell.day}</span>
                  {cell.status && (
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  )}
                  {cell.machines.length > 1 && <span className="text-[9px] text-gray-400 font-semibold">{cell.machines.length} máy</span>}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {selectedCell && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-tbs-dark">Ngày {formatDate(selectedCell.date)}</h3>
            <div className="space-y-2">
              {selectedCell.machines.map((m, i) => (
                <div key={`${m.id}-${i}`} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div>
                    <div className="text-xs font-bold text-tbs-dark">{m.name}</div>
                    <div className="text-[11px] font-mono text-gray-400">{m.code}</div>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                    m.status === 'overdue' ? 'bg-rose-100 text-rose-700' : m.status === 'upcoming' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {DOT_LABEL[m.status]}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedCell(null)} className="w-full py-2.5 bg-tbs-dark text-white rounded-xl font-bold text-xs">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

