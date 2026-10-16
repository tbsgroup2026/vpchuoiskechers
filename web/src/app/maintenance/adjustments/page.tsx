'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconArrowsExchange,
  IconDeviceLaptop,
  IconUsers,
  IconRepeat,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import DateRangeFilter, { inDateRange } from '@/components/DateRangeFilter';
import FilterSelect from '@/components/FilterSelect';
import RefreshButton from '@/components/RefreshButton';
import TopScrollTable from '@/components/TopScrollTable';
import { getCurrentMmtbScope } from "@/lib/equipmentScope";

// Dữ liệu MMTB tách theo khu vực (Văn phòng / Miền Đông / Kiên Giang) như các trang bảo trì khác của VP Chuỗi
const withMmtbScope = (u: string) => `${u}${u.includes("?") ? "&" : "?"}scope=${getCurrentMmtbScope()}`;


type AdjustmentRow = {
  id: string;
  createdAt: string;
  fromLocationLabel: string | null;
  toLocationLabel: string;
  action: string | null;
  // Chỉ có giá trị khi action="ADJUST" — lý do chuyển máy (đổi mã giày, máy hư...).
  adjustmentReason: string | null;
  user: { id: string; name: string; employeeCode: string };
  machine: { code: string; name: string };
  factoryName: string | null;
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${d.toLocaleDateString('vi-VN')} ${time}`;
}

const PAGE_SIZE = 50;

// Tab "Máy Điều Chỉnh" — theo dõi/quản lý lịch sử dùng tính năng "Điều chỉnh máy" ở tab Kiểm kê
// (app/web-m của tbsMayMoc): chuyển hàng loạt máy từ khu vực này sang khu vực khác vì 1 lý do cụ
// thể (đổi mã giày, máy hư...), KHÁC "Kiểm Kê" (quét xác nhận vị trí thực tế, không nhất thiết có
// lý do). Dùng LẠI đúng /api/maintenance/inventory-log (đã có sẵn cho Kiểm Kê) — chỉ lọc riêng
// action="ADJUST", không cần route proxy mới. Chỉ là trang BÁO CÁO — bước điều chỉnh thật vẫn làm
// ở app/web-m của tbsMayMoc.
export default function AdjustmentsPage() {
  const [rows, setRows] = useState<AdjustmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [factoryName, setFactoryName] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  async function load(force = false) {
    try {
      force ? setRefreshing(true) : setLoading(true);
      setError(null);
      const res = await fetch(withMmtbScope(`/api/maintenance/inventory-log${force ? '?fresh=1' : ''}`));
      const result = await res.json();
      if (result.success) {
        const all = (result.rows as AdjustmentRow[]) || [];
        setRows(all.filter((r) => r.action === 'ADJUST'));
      } else {
        console.warn('Failed to load inventory-log from tbsMayMoc:', result.error);
        setError(result.error || 'Không lấy được dữ liệu');
      }
    } catch (err) {
      console.warn('Failed to fetch inventory-log from tbsMayMoc:', err);
    } finally {
      force ? setRefreshing(false) : setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const factoryOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.factoryName).filter((n): n is string => !!n))).sort((a, b) => a.localeCompare(b, 'vi')),
    [rows],
  );
  const reasonOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.adjustmentReason).filter((n): n is string => !!n))).sort((a, b) => a.localeCompare(b, 'vi')),
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!factoryName || r.factoryName === factoryName) &&
          (!reasonFilter || r.adjustmentReason === reasonFilter) &&
          inDateRange(r.createdAt, dateFrom, dateTo),
      ),
    [rows, factoryName, reasonFilter, dateFrom, dateTo],
  );

  const stats = useMemo(
    () => ({
      // "Lần điều chỉnh" = số MỐC GIỜ khác nhau (mỗi lần bấm "Hoàn tất" ghi nhiều dòng cùng 1 mốc
      // createdAt, xem ghi chú AdjustmentRow ở trên) — vẫn đếm được đúng dù bảng bên dưới giờ tách
      // phẳng theo từng máy, không còn gộp hiển thị theo lượt nữa.
      totalBatches: new Set(filteredRows.map((r) => r.createdAt)).size,
      totalMachines: new Set(filteredRows.map((r) => r.machine.code)).size,
      totalEmployees: new Set(filteredRows.map((r) => r.user.id)).size,
      totalReasons: new Set(filteredRows.map((r) => r.adjustmentReason).filter(Boolean)).size,
    }),
    [filteredRows],
  );

  // Đổi bộ lọc → luôn về trang 1.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ trang hiện tại theo bộ lọc, không phải fetch
  useEffect(() => {
    setPage(1);
  }, [factoryName, reasonFilter, dateFrom, dateTo]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredRows, currentPage],
  );

  const hasActiveFilter = !!factoryName || !!reasonFilter || !!dateFrom || !!dateTo;
  function clearFilters() {
    setFactoryName('');
    setReasonFilter('');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <MaintenanceShell title="Máy Điều Chỉnh" subtitle="Lịch sử điều chỉnh vị trí máy (đổi mã giày, máy hư...) — Tổ hợp Kiên Giang">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-2.5">
          <FilterSelect
            value={factoryName}
            onChange={setFactoryName}
            options={factoryOptions.map((n) => ({ id: n, name: n }))}
            placeholder="Tất cả nhà máy"
          />
          <FilterSelect
            value={reasonFilter}
            onChange={setReasonFilter}
            options={reasonOptions.map((n) => ({ id: n, name: n }))}
            placeholder="Tất cả lý do"
          />
          <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
          {!dateFrom && !dateTo && <span className="text-xs text-gray-400">Tất cả ngày</span>}
          {hasActiveFilter && (
            <button onClick={clearFilters} className="text-xs font-bold text-gray-500 hover:text-tbs-dark underline">
              Xoá bộ lọc
            </button>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-extrabold text-tbs-dark">Máy Điều Chỉnh</h1>
          <RefreshButton onClick={() => load(true)} loading={refreshing} />
        </div>

        {/* Lỗi kết nối tbsMayMoc chỉ log console (F12), không hiện banner ngoài trang — đúng quy
            ước các trang MMTB khác (theo yêu cầu người dùng). */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Lần điều chỉnh', value: stats.totalBatches, icon: IconRepeat, bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600' },
            { label: 'Máy đã điều chỉnh', value: stats.totalMachines, icon: IconDeviceLaptop, bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
            { label: 'Nhân viên', value: stats.totalEmployees, icon: IconUsers, bg: 'bg-violet-50', iconBg: 'bg-violet-100', text: 'text-violet-600' },
            { label: 'Lý do khác nhau', value: stats.totalReasons, icon: IconArrowsExchange, bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600' },
          ].map((c) => (
            <div key={c.label} className={`flex items-center gap-3 rounded-2xl ${c.bg} p-4 shadow-sm`}>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${c.iconBg}`}>
                <c.icon size={20} className={c.text} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-extrabold text-tbs-dark">{c.value}</div>
                <div className="truncate text-xs font-semibold text-gray-500">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-xs text-gray-400">Đang tải...</div>
        )}
        {!loading && filteredRows.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-xs text-gray-400">
            {rows.length === 0 ? 'Chưa có lượt điều chỉnh máy nào trong 90 ngày gần đây' : 'Không tìm thấy lượt nào phù hợp'}
          </div>
        )}
        {!loading && filteredRows.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
            <TopScrollTable>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#eef7f2] text-xs font-semibold text-tbs-dark uppercase border-b border-emerald-100 whitespace-nowrap">
                    <th className="p-4">Thời Gian</th>
                    <th className="p-4">Máy</th>
                    <th className="p-4">Nhà Máy</th>
                    <th className="p-4">Từ Vị Trí</th>
                    <th className="p-4">Đến Vị Trí</th>
                    <th className="p-4">Lý Do</th>
                    <th className="p-4">Người Thực Hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700 whitespace-nowrap">
                  {pageRows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-4 font-mono text-gray-500">{formatDateTime(r.createdAt)}</td>
                      <td className="p-4">
                        <div className="font-bold text-tbs-dark">{r.machine.name}</div>
                        <div className="font-mono text-[10px] text-gray-400">{r.machine.code}</div>
                      </td>
                      <td className="p-4">{r.factoryName || <span className="text-gray-300">—</span>}</td>
                      <td className="p-4 max-w-[200px] whitespace-normal">{r.fromLocationLabel || <span className="text-gray-300">—</span>}</td>
                      <td className="p-4 max-w-[200px] whitespace-normal font-semibold text-tbs-dark">{r.toLocationLabel}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-700">
                          🔀 {r.adjustmentReason || 'Không rõ lý do'}
                        </span>
                      </td>
                      <td className="p-4">{r.user.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TopScrollTable>
          </div>
        )}

        {filteredRows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-xs font-semibold text-gray-500">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRows.length)} / {filteredRows.length} máy
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:border-accent disabled:opacity-40 disabled:hover:border-gray-200 cursor-pointer disabled:cursor-not-allowed"
              >
                <IconChevronLeft size={14} /> Trước
              </button>
              <span className="text-xs font-bold text-tbs-dark">
                Trang {currentPage}/{pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:border-accent disabled:opacity-40 disabled:hover:border-gray-200 cursor-pointer disabled:cursor-not-allowed"
              >
                Sau <IconChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </MaintenanceShell>
  );
}
