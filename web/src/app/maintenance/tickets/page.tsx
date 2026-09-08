'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconAlertTriangle, IconClockHour4, IconCircleCheck, IconTool } from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import FilterSelect from '@/components/FilterSelect';
import DateRangeFilter, { inDateRange } from '@/components/DateRangeFilter';
import RefreshButton from '@/components/RefreshButton';

type CategoryOption = { id: string; name: string };

type Ticket = {
  id: string;
  ticketCode: string;
  machineCode: string;
  machineName: string;
  zone: string | null;
  factoryName: string | null;
  reporter: string;
  mechanic: string | null;
  errorType: string;
  status: 'PENDING' | 'ACCEPTED' | 'DONE';
  statusLabel: string;
  reportedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
};

function renderTicketStatusBadge(status: Ticket['status'], label: string) {
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'ACCEPTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
      <span>{label}</span>
    </span>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

export default function MaintenanceTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [factories, setFactories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFactoryId, setFilterFactoryId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function load(force = false) {
    try {
      force ? setRefreshing(true) : setLoading(true);
      setError(null);
      const fresh = force ? '&fresh=1' : '';
      const settled = await Promise.allSettled([
        fetch(`/api/maintenance/tickets${force ? '?fresh=1' : ''}`).then((r) => r.json()),
        fetch(`/api/maintenance/categories?type=FACTORY${fresh}`).then((r) => r.json()),
      ]);
      const [ticketsRes, facRes] = settled.map((s) => (s.status === 'fulfilled' ? s.value : { success: false, error: String(s.reason) }));
      if (ticketsRes.success && Array.isArray(ticketsRes.data)) {
        setTickets(ticketsRes.data);
      } else {
        setTickets([]);
        console.warn('Failed to load tickets from tbsMayMoc:', ticketsRes.error);
        setError(ticketsRes.error || 'Không lấy được dữ liệu');
      }
      if (facRes.success) setFactories(facRes.data || []);
    } catch (err) {
      console.warn('Failed to fetch tickets from tbsMayMoc:', err);
      setTickets([]);
    } finally {
      force ? setRefreshing(false) : setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesQ =
        !q || t.ticketCode.toLowerCase().includes(q) || t.machineCode.toLowerCase().includes(q) || t.machineName.toLowerCase().includes(q);
      const matchesStatus = !filterStatus || t.status === filterStatus;
      const matchesFactory = !filterFactoryId || t.factoryName === filterFactoryId;
      const matchesDate = inDateRange(t.reportedAt, dateFrom, dateTo);
      return matchesQ && matchesStatus && matchesFactory && matchesDate;
    });
  }, [tickets, search, filterStatus, filterFactoryId, dateFrom, dateTo]);

  const stats = useMemo(() => {
    let pending = 0, accepted = 0, done = 0;
    for (const t of filtered) {
      if (t.status === 'PENDING') pending++;
      else if (t.status === 'ACCEPTED') accepted++;
      else done++;
    }
    return { total: filtered.length, pending, accepted, done };
  }, [filtered]);

  return (
    <MaintenanceShell title="Nhu Cầu Sửa Chữa" subtitle="Quản lý yêu cầu khắc phục sự cố MMTB (Work Orders) — SKECHERS / TBS Group II">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Nhu Cầu Sửa Chữa Thiết Bị</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{filtered.length} ticket sự cố trong hệ thống</p>
          </div>
          <RefreshButton onClick={() => load(true)} loading={refreshing} />
        </div>

        {/* Status Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Tổng số sự cố', value: stats.total, icon: IconTool, border: 'border-blue-200', text: 'text-blue-700', bg: 'bg-blue-50/60' },
            { label: 'Chưa tiếp nhận', value: stats.pending, icon: IconAlertTriangle, border: 'border-rose-200', text: 'text-rose-700', bg: 'bg-rose-50/60' },
            { label: 'Đang xử lý', value: stats.accepted, icon: IconClockHour4, border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50/60' },
            { label: 'Đã hoàn thành', value: stats.done, icon: IconCircleCheck, border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50/60' },
          ].map((c) => (
            <div key={c.label} className={`bg-white rounded-xl border ${c.border} p-3.5 shadow-2xs`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</span>
                <div className={`p-1.5 rounded-md ${c.bg}`}>
                  <c.icon size={16} className={c.text} />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">{c.value}</div>
            </div>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã ticket, mã máy, tên máy..."
            className="min-w-[220px] flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#006838]"
          />
          <FilterSelect
            value={filterFactoryId}
            onChange={setFilterFactoryId}
            options={factories.map((f) => ({ id: f.name, name: f.name }))}
            placeholder="Tất cả nhà máy"
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          />
          <FilterSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { id: 'PENDING', name: 'Chưa tiếp nhận' },
              { id: 'ACCEPTED', name: 'Đang xử lý' },
              { id: 'DONE', name: 'Đã hoàn thành' },
            ]}
            placeholder="Tất cả trạng thái"
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          />
          <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 whitespace-nowrap">
                <th className="p-3">Mã Ticket</th>
                <th className="p-3">Thiết Bị</th>
                <th className="p-3">Khu Vực / Nhà Máy</th>
                <th className="p-3">Người Báo</th>
                <th className="p-3">Bảo Trì Phụ Trách</th>
                <th className="p-3">Loại Lỗi</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3 text-right">Thời Gian Báo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 whitespace-nowrap">
              {loading && (
                <tr>
                  <td className="p-4 text-slate-400 text-center" colSpan={8}>Đang tải danh sách ticket...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && !error && (
                <tr>
                  <td className="p-4 text-slate-400 text-center" colSpan={8}>
                    {tickets.length === 0 ? 'Chưa có sự cố nào trong hệ thống' : 'Không tìm thấy sự cố phù hợp'}
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/90 transition-colors">
                  <td className="p-3 font-mono font-bold text-[#006838]">{t.ticketCode}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{t.machineName}</div>
                    <div className="font-mono text-[11px] text-slate-500">{t.machineCode}</div>
                  </td>
                  <td className="p-3 text-slate-600">{t.factoryName ? `${t.factoryName} > ${t.zone ?? '—'}` : (t.zone ?? '—')}</td>
                  <td className="p-3 text-slate-700 font-medium">{t.reporter}</td>
                  <td className="p-3 font-semibold text-slate-900">{t.mechanic ?? '—'}</td>
                  <td className="p-3 font-medium text-rose-700">{t.errorType}</td>
                  <td className="p-3">{renderTicketStatusBadge(t.status, t.statusLabel)}</td>
                  <td className="p-3 font-mono text-slate-500 text-right">{formatDateTime(t.reportedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MaintenanceShell>
  );
}

