'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconClockHour4,
  IconCircleCheck,
  IconTool,
  IconX,
  IconMapPin,
  IconUserCircle,
  IconUserCheck,
  IconClock,
  IconPlayerPause,
  IconFlag,
  IconPhoto,
  IconBriefcase,
} from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import StatCardRow from '@/components/StatCardRow';
import FilterSelect from '@/components/FilterSelect';
import DateRangeFilter, { inDateRange } from '@/components/DateRangeFilter';
import RefreshButton from '@/components/RefreshButton';
import Pagination from '@/components/Pagination';
import { readMaintenanceCache, writeMaintenanceCache } from '@/lib/maintenanceCache';
import { getCurrentMmtbScope } from '@/lib/equipmentScope';

const PAGE_SIZE = 50;

type CategoryOption = { id: string; name: string };
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type Ticket = {
  id: string;
  ticketCode: string;
  machineCode: string;
  machineName: string;
  zone: string | null;
  factoryName: string | null;
  location: string | null;
  productionLine: string | null;
  team: string | null;
  reporter: string;
  mechanic: string | null;
  errorType: string;
  errorTypeOther: string | null;
  description: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DONE';
  statusLabel: string;
  priority: Priority | null;
  images: string[];
  beforeImages: string[];
  holdReason: string | null;
  holdAt: string | null;
  reportedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  repairDetail: string | null;
  partsReplaced: string | null;
  repairNote: string | null;
  durationMinutes: number | null;
};

const STATUS_BADGE: Record<Ticket['status'], string> = {
  PENDING: 'bg-rose-500/15 text-rose-700',
  ACCEPTED: 'bg-amber-500/15 text-amber-700',
  DONE: 'bg-emerald-500/15 text-emerald-700',
};

// "Việc khác" — phiếu việc phát sinh KHÔNG gắn máy cụ thể (khác ticket sự cố ở trên, luôn gắn 1
// máy). Chỉ xem (đọc) — khớp đúng phạm vi READ-ONLY của toàn bộ khu vực /maintenance.
type WorkRequestItem = {
  id: string;
  area: { id: string; name: string };
  productionLine: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  description: string;
  status: 'PENDING' | 'ACCEPTED' | 'DONE';
  reporter: { name: string };
  assignedTo: { name: string } | null;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
};

const WORK_REQUEST_STATUS_BADGE: Record<WorkRequestItem['status'], string> = {
  PENDING: 'bg-rose-500/15 text-rose-700',
  ACCEPTED: 'bg-amber-500/15 text-amber-700',
  DONE: 'bg-emerald-500/15 text-emerald-700',
};
const WORK_REQUEST_STATUS_LABEL: Record<WorkRequestItem['status'], string> = {
  PENDING: 'Chưa ai nhận',
  ACCEPTED: 'Đang xử lý',
  DONE: 'Đã hoàn thành',
};

const PRIORITY_INFO: Record<Priority, { label: string; badge: string }> = {
  LOW: { label: 'Thấp', badge: 'bg-slate-100 text-slate-600' },
  MEDIUM: { label: 'Trung bình', badge: 'bg-sky-100 text-sky-700' },
  HIGH: { label: 'Cao', badge: 'bg-amber-100 text-amber-700' },
  URGENT: { label: 'Khẩn cấp', badge: 'bg-rose-100 text-rose-700' },
};

function priorityInfo(p: Priority | string | null): { label: string; badge: string } | null {
  return p && p in PRIORITY_INFO ? PRIORITY_INFO[p as Priority] : null;
}

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

// Số ĐẾM THẬT từ tbsMayMoc (groupBy, không bị cắt bởi limit=200 an toàn D1 phía trên) — dùng cho
// các ô thống kê đầu trang KHI CHƯA lọc gì, tránh hiện sai kiểu "dừng ở 90" trong khi tổng thật
// lớn hơn nhiều (VD 370).
type TicketCounts = { PENDING: number; ACCEPTED: number; DONE: number; total: number };

export default function MaintenanceTicketsPage() {
  // Mỗi khu vực có dữ liệu MMTB riêng — cache key phải theo scope (xem machines/page.tsx).
  const scope = getCurrentMmtbScope();
  const ck = (key: string) => `${key}_${scope}`;

  const [tickets, setTickets] = useState<Ticket[]>(() => readMaintenanceCache<Ticket[]>(ck('tickets')) || []);
  const [ticketCounts, setTicketCounts] = useState<TicketCounts | null>(() => readMaintenanceCache<TicketCounts>(ck('tickets_counts')) || null);
  const [factories, setFactories] = useState<CategoryOption[]>(() => readMaintenanceCache<CategoryOption[]>(ck('tickets_factories')) || []);
  const [workRequests, setWorkRequests] = useState<WorkRequestItem[]>(() => readMaintenanceCache<WorkRequestItem[]>(ck('tickets_work_requests')) || []);
  const [loading, setLoading] = useState(() => readMaintenanceCache<Ticket[]>(ck('tickets')) === null);
  const [error, setError] = useState<string | null>(null);
  const [showWorkRequests, setShowWorkRequests] = useState(false);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFactoryId, setFilterFactoryId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function load(force = false) {
    try {
      if (force) setRefreshing(true);
      setError(null);
      const fresh = force ? '&fresh=1' : '';
      const settled = await Promise.allSettled([
        fetch(`/api/maintenance/tickets?scope=${scope}${force ? '&fresh=1' : ''}`).then((r) => r.json()),
        fetch(`/api/maintenance/categories?type=FACTORY&scope=${scope}${fresh}`).then((r) => r.json()),
        fetch(`/api/maintenance/work-requests?scope=${scope}${fresh}`).then((r) => r.json()),
      ]);
      const [ticketsRes, facRes, workRequestRes] = settled.map((s) => (s.status === 'fulfilled' ? s.value : { success: false, error: String(s.reason) }));
      if (ticketsRes.success && Array.isArray(ticketsRes.data)) {
        // Backend thoáng qua trả "success:true, data:[]" khi quá tải — nếu tin ngay sẽ xoá trắng
        // danh sách đang có mỗi lần rời trang rồi quay lại (xem machines/page.tsx). CHỈ ghi đè bằng
        // mảng rỗng khi trước đó thật sự chưa có gì.
        const prevTickets = readMaintenanceCache<Ticket[]>(ck('tickets'));
        if (ticketsRes.data.length > 0 || !prevTickets || prevTickets.length === 0) {
          setTickets(ticketsRes.data);
          writeMaintenanceCache(ck('tickets'), ticketsRes.data);
          setTicketCounts(ticketsRes.counts || null);
          writeMaintenanceCache(ck('tickets_counts'), ticketsRes.counts || null);
        } else {
          console.warn('Bỏ qua kết quả rỗng bất thường từ tbsMayMoc (tickets) — giữ dữ liệu cũ');
        }
      } else {
        console.warn('Failed to load tickets from tbsMayMoc:', ticketsRes.error);
        setError(ticketsRes.error || 'Không lấy được dữ liệu');
      }
      if (facRes.success) {
        setFactories(facRes.data || []);
        writeMaintenanceCache(ck('tickets_factories'), facRes.data || []);
      }
      if (workRequestRes.success) {
        const items = workRequestRes.data?.items || [];
        setWorkRequests(items);
        writeMaintenanceCache(ck('tickets_work_requests'), items);
      }
    } catch (err) {
      console.warn('Failed to fetch tickets from tbsMayMoc:', err);
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

  // Chưa bấm lọc gì -> dùng ĐÚNG số thật đếm từ server (ticketCounts, không bị giới hạn 200 dòng
  // an toàn D1) thay vì suy từ `filtered` (= tickets khi chưa lọc, đã bị cắt tối đa 200 dòng nên
  // "Tổng số sự cố" không bao giờ vượt quá 200 dù tổng thật lớn hơn, VD 370). Đã lọc thì không có
  // cách nào server đếm hộ đúng theo đúng bộ lọc đó -> vẫn suy từ `filtered` như cũ.
  const noFilterActive = !search.trim() && !filterStatus && !filterFactoryId && !dateFrom && !dateTo;
  const stats = useMemo(() => {
    let pending = 0, accepted = 0, done = 0;
    for (const t of filtered) {
      if (t.status === 'PENDING') pending++;
      else if (t.status === 'ACCEPTED') accepted++;
      else done++;
    }
    if (noFilterActive && ticketCounts) {
      return { total: ticketCounts.total, pending: ticketCounts.PENDING, accepted: ticketCounts.ACCEPTED, done: ticketCounts.DONE };
    }
    return { total: filtered.length, pending, accepted, done };
  }, [filtered, noFilterActive, ticketCounts]);

  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterFactoryId, dateFrom, dateTo]);
  const pageItems = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);

  return (
    <MaintenanceShell title="Nhu Cầu Sửa Chữa" subtitle="Quản lý yêu cầu khắc phục sự cố MMTB (Work Orders) — SKECHERS / TBS Group II">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Nhu Cầu Sửa Chữa Thiết Bị</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{stats.total} ticket sự cố trong hệ thống</p>
          </div>
          <RefreshButton onClick={() => load(true)} loading={refreshing} />
        </div>

        {/* Status Stats Ribbon — bấm để lọc thẳng bảng bên dưới theo đúng trạng thái đó, bấm lại ô
            đang lọc để bỏ lọc, giống hệt cách trang thật đang làm. */}
        <StatCardRow
          items={[
            { key: 'total', label: 'Tổng số sự cố', value: stats.total, icon: IconTool, bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-300', active: !filterStatus, onClick: () => setFilterStatus('') },
            { key: 'PENDING', label: 'Chưa tiếp nhận', value: stats.pending, icon: IconAlertTriangle, bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-300', active: filterStatus === 'PENDING', onClick: () => setFilterStatus((prev) => (prev === 'PENDING' ? '' : 'PENDING')) },
            { key: 'ACCEPTED', label: 'Đang xử lý', value: stats.accepted, icon: IconClockHour4, bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-300', active: filterStatus === 'ACCEPTED', onClick: () => setFilterStatus((prev) => (prev === 'ACCEPTED' ? '' : 'ACCEPTED')) },
            { key: 'DONE', label: 'Đã hoàn thành', value: stats.done, icon: IconCircleCheck, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-300', active: filterStatus === 'DONE', onClick: () => setFilterStatus((prev) => (prev === 'DONE' ? '' : 'DONE')) },
            { key: 'WORK_REQUEST', label: 'Việc khác', value: workRequests.length, icon: IconBriefcase, bg: 'bg-violet-50', iconBg: 'bg-violet-100', text: 'text-violet-600', ring: 'ring-violet-300', onClick: () => setShowWorkRequests(true) },
          ]}
        />

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
                <th className="p-3">Chuyền</th>
                <th className="p-3">Tổ</th>
                <th className="p-3">Ưu Tiên</th>
                <th className="p-3">Người Báo</th>
                <th className="p-3">Bảo Trì Phụ Trách</th>
                <th className="p-3">Loại Lỗi</th>
                <th className="p-3">Lỗi Khác</th>
                <th className="p-3">Nguyên Nhân Sự Cố</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3">Cách Khắc Phục</th>
                <th className="p-3">Linh Kiện Thay Thế</th>
                <th className="p-3">Ghi Chú Thêm</th>
                <th className="p-3 text-right">Số Phút Hoàn Thành</th>
                <th className="p-3 text-right">Thời Gian Báo</th>
                <th className="p-3 text-right">Thời Gian Nhận Việc</th>
                <th className="p-3 text-right">Thời Gian Hoàn Thành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 whitespace-nowrap">
              {loading && (
                <tr>
                  <td className="p-4 text-slate-400 text-center" colSpan={19}>Đang tải danh sách ticket...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && !error && (
                <tr>
                  <td className="p-4 text-slate-400 text-center" colSpan={19}>
                    {tickets.length === 0 ? 'Chưa có sự cố nào trong hệ thống' : 'Không tìm thấy sự cố phù hợp'}
                  </td>
                </tr>
              )}
              {pageItems.map((t) => (
                <tr key={t.id} onClick={() => setDetailTicket(t)} className="hover:bg-slate-50/90 transition-colors cursor-pointer">
                  <td className="p-3 font-mono font-bold text-[#006838]">{t.ticketCode}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{t.machineName}</div>
                    <div className="font-mono text-[11px] text-slate-500">{t.machineCode}</div>
                  </td>
                  <td className="p-3 text-slate-600">{t.factoryName ? `${t.factoryName} > ${t.zone ?? '—'}` : (t.zone ?? '—')}</td>
                  <td className="p-3 text-slate-600">{t.productionLine ?? '—'}</td>
                  <td className="p-3 text-slate-600">{t.team ?? '—'}</td>
                  <td className="p-3">
                    {priorityInfo(t.priority) ? (
                      <span className={`px-2 py-0.5 font-bold rounded ${priorityInfo(t.priority)!.badge}`}>{priorityInfo(t.priority)!.label}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-700 font-medium">{t.reporter}</td>
                  <td className="p-3 font-semibold text-slate-900">{t.mechanic ?? '—'}</td>
                  <td className="p-3 font-medium text-rose-700">{t.errorType}</td>
                  <td className="p-3 max-w-[200px] whitespace-normal text-slate-600">{t.errorTypeOther || '—'}</td>
                  <td className="p-3 max-w-[200px] whitespace-normal text-slate-600">{t.description || '—'}</td>
                  <td className="p-3">{renderTicketStatusBadge(t.status, t.statusLabel)}</td>
                  <td className="p-3 max-w-[200px] whitespace-normal text-slate-600">{t.repairDetail || '—'}</td>
                  <td className="p-3 max-w-[180px] whitespace-normal text-slate-600">{t.partsReplaced || '—'}</td>
                  <td className="p-3 max-w-[180px] whitespace-normal text-slate-600">{t.repairNote || '—'}</td>
                  <td className="p-3 text-right font-mono">{t.durationMinutes != null ? t.durationMinutes : '—'}</td>
                  <td className="p-3 font-mono text-slate-500 text-right">{formatDateTime(t.reportedAt)}</td>
                  <td className="p-3 font-mono text-slate-500 text-right">{formatDateTime(t.acceptedAt)}</td>
                  <td className="p-3 font-mono text-slate-500 text-right">{formatDateTime(t.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      </div>

      {detailTicket && <TicketDetailModal ticket={detailTicket} onClose={() => setDetailTicket(null)} />}
      {showWorkRequests && <WorkRequestListModal items={workRequests} onClose={() => setShowWorkRequests(false)} />}
    </MaintenanceShell>
  );
}

// Khung XEM danh sách "Việc khác" — mở từ ô thống kê "Việc khác". Chỉ xem (đọc), không có nút
// "Tạo mới" — khớp đúng phạm vi READ-ONLY đã chốt cho toàn bộ khu vực /maintenance.
function WorkRequestListModal({ items, onClose }: { items: WorkRequestItem[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-extrabold text-tbs-dark">Việc Khác</h3>
            <p className="text-xs text-gray-400 mt-0.5">Việc phát sinh không gắn máy cụ thể — Tổ Hợp Kiên Giang</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center shrink-0 cursor-pointer">
            <IconX size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-2.5">
          {items.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">Chưa có việc khác nào được ghi nhận</p>
          )}
          {items.map((w) => {
            const location = [w.area.name, w.productionLine?.name, w.team?.name].filter(Boolean).join(' > ');
            return (
              <div key={w.id} className="rounded-2xl border border-gray-100 p-3.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="truncate text-sm font-bold text-tbs-dark">{location}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${WORK_REQUEST_STATUS_BADGE[w.status]}`}>
                    {WORK_REQUEST_STATUS_LABEL[w.status]}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-gray-700">{w.description}</p>
                <p className="mt-1.5 text-xs text-gray-400">
                  Báo bởi {w.reporter.name} · {formatDateTime(w.createdAt)}
                  {w.assignedTo && ` · Đang xử lý: ${w.assignedTo.name}`}
                  {w.status === 'DONE' && w.completedAt && ` · Xong: ${formatDateTime(w.completedAt)}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TicketDetailModal({ ticket: t, onClose }: { ticket: Ticket; onClose: () => void }) {
  const cover = t.images[0] || t.beforeImages[0] || null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-64 shrink-0 bg-slate-100">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="w-full h-48 sm:h-full object-cover" />
            ) : (
              <div className="w-full h-48 sm:h-full flex items-center justify-center text-slate-300">
                <IconPhoto size={40} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_BADGE[t.status]}`}>{t.statusLabel}</span>
                {priorityInfo(t.priority) && (
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${priorityInfo(t.priority)!.badge}`}>
                    <IconFlag size={12} /> Ưu tiên {priorityInfo(t.priority)!.label}
                  </span>
                )}
              </div>
              <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer">
                <IconX size={16} />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-tbs-dark">{t.machineName}</h3>
              <p className="text-xs text-slate-400 font-mono">{t.ticketCode} · {t.machineCode}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <IconMapPin size={15} className="text-[#006838] mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-400 font-semibold">Khu vực / Nhà máy</p>
                  <p className="font-bold text-tbs-dark">{t.factoryName ? `${t.factoryName} > ${t.zone ?? '—'}` : (t.zone ?? '—')}</p>
                  {(t.productionLine || t.team) && (
                    <p className="text-slate-500">{[t.productionLine, t.team].filter(Boolean).join(' > ')}</p>
                  )}
                  {t.location && <p className="text-slate-500">{t.location}</p>}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <IconUserCircle size={15} className="text-[#006838] mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-400 font-semibold">Người báo</p>
                  <p className="font-bold text-tbs-dark">{t.reporter}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <IconUserCheck size={15} className="text-[#006838] mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-400 font-semibold">Bảo trì phụ trách</p>
                  <p className="font-bold text-tbs-dark">{t.mechanic ?? 'Chưa ai nhận'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <IconClock size={15} className="text-[#006838] mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-400 font-semibold">Thời gian</p>
                  <p className="font-bold text-tbs-dark">Báo: {formatDateTime(t.reportedAt)}</p>
                  {t.acceptedAt && <p className="text-slate-500">Nhận: {formatDateTime(t.acceptedAt)}</p>}
                  {t.completedAt && <p className="text-slate-500">Xong: {formatDateTime(t.completedAt)}</p>}
                  {t.durationMinutes != null && <p className="text-slate-500">Mất {t.durationMinutes} phút sửa</p>}
                </div>
              </div>
            </div>

            {(t.repairDetail || t.partsReplaced || t.repairNote) && (
              <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3 space-y-2">
                {t.repairDetail && (
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Cách khắc phục</p>
                    <p className="text-sm font-semibold text-emerald-800 whitespace-pre-wrap">{t.repairDetail}</p>
                  </div>
                )}
                {t.partsReplaced && (
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Linh kiện thay thế</p>
                    <p className="text-sm text-emerald-800">{t.partsReplaced}</p>
                  </div>
                )}
                {t.repairNote && (
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Ghi chú thêm</p>
                    <p className="text-sm text-emerald-800 whitespace-pre-wrap">{t.repairNote}</p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-rose-50/60 border border-rose-100 p-3">
              <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wide mb-1">Loại lỗi</p>
              <p className="text-sm font-semibold text-rose-700">{t.errorType}</p>
              {t.errorTypeOther && (
                <p className="text-sm text-rose-600 mt-1 whitespace-pre-wrap">{t.errorTypeOther}</p>
              )}
              {t.description && t.description !== t.errorType && (
                <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap">{t.description}</p>
              )}
            </div>

            {t.holdReason && (
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <IconPlayerPause size={13} /> Tạm dừng xử lý
                </p>
                <p className="text-xs text-amber-800">{t.holdReason}</p>
                {t.holdAt && <p className="text-[10px] text-amber-500 mt-0.5">{formatDateTime(t.holdAt)}</p>}
              </div>
            )}

            {t.beforeImages.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Ảnh trước khi sửa</p>
                <div className="grid grid-cols-4 gap-2">
                  {t.beforeImages.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full aspect-square rounded-lg object-cover border border-slate-200" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {t.images.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Ảnh báo lỗi</p>
                <div className="grid grid-cols-4 gap-2">
                  {t.images.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full aspect-square rounded-lg object-cover border border-slate-200" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

