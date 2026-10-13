'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconTool,
  IconTools,
  IconCalendarStats,
  IconUsers,
  IconStopwatch,
  IconClockHour4,
} from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import FilterSelect from '@/components/FilterSelect';
import DateRangeFilter, { inDateRange } from '@/components/DateRangeFilter';
import RefreshButton from '@/components/RefreshButton';
import { mmtbTabCache } from '@/lib/mmtbTabCache';
import { getCurrentMmtbScope } from '@/lib/equipmentScope';

type StatIncident = {
  id: string;
  isMaintenanceDue: boolean;
  createdAt: string;
  acceptedAt: string;
  completedAt: string | null;
  assignedTo: { id: string; name: string; employeeCode: string } | null;
  factoryName: string | null;
};

// Dùng riêng cho tab "Đánh giá" — mỗi dòng là 1 lần Bảo trì bấm "Hoàn thành", có thể kèm đánh giá
// (skillRating 1-5 sao + ratingComment) do NGƯỜI VẬN HÀNH gửi sau khi nhận thông báo hoàn thành —
// không phải lần nào cũng có (chưa ai đánh giá thì cả 2 field đều null).
type StatLog = {
  id: string;
  createdAt: string;
  skillRating: number | null;
  ratingComment: string | null;
  technician: { id: string; name: string; employeeCode: string };
  factoryName: string | null;
};

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  isTeamLead: boolean;
  factory: { id: string; name: string } | null;
  area: { id: string; name: string } | null;
};

type CategoryOption = { id: string; name: string };

function minutesBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

function formatMinutes(m: number | null): string {
  if (m == null) return '—';
  if (m < 60) return `${Math.round(m)} phút`;
  const h = Math.floor(m / 60);
  const rem = Math.round(m % 60);
  return `${h} giờ ${rem} phút`;
}

function avg(arr: number[]): number | null {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Loại sự cố đang lọc ở hàng 1 (bấm 1 trong 3 ô "Tổng/Sửa chữa/DTBD") — ÁP DỤNG NGAY khi bấm,
// khác bộ lọc hàng 2 (Nhà máy/NVBT/khoảng ngày) phải bấm nút "Xem thống kê" mới áp dụng.
type TypeFilter = null | 'REPAIR' | 'SCHEDULED';

// 2 tab của cùng 1 trang, dùng CHUNG bộ lọc Nhà máy/NVBT/khoảng ngày ở hàng dưới — "Thống kê"
// (mặc định) là 6 ô + bảng theo Nhà máy, "Đánh giá" là bảng XẾP HẠNG theo điểm sao người vận
// hành đánh giá cho từng lần Bảo trì hoàn thành việc.
type Tab = 'thongke' | 'danhgia';

export default function MaintenanceStatisticsPage() {
  const scope = getCurrentMmtbScope();
  const ck = (key: string) => `${key}_${scope}`;

  const [tab, setTab] = useState<Tab>('thongke');
  // Đọc cache trước (nếu vừa xem trang này rồi chuyển tab rồi quay lại) — hiện NGAY dữ liệu cũ thay
  // vì màn trắng "Đang tải..." mỗi lần quay lại, xem ghi chú đầy đủ ở lib/mmtbTabCache.ts.
  const [incidents, setIncidents] = useState<StatIncident[]>(() => mmtbTabCache.get<StatIncident[]>(ck('statistics_incidents')) ?? []);
  const [logs, setLogs] = useState<StatLog[]>(() => mmtbTabCache.get<StatLog[]>(ck('statistics_logs')) ?? []);
  const [employees, setEmployees] = useState<Employee[]>(() => mmtbTabCache.get<Employee[]>(ck('statistics_employees')) ?? []);
  const [factories, setFactories] = useState<CategoryOption[]>(() => mmtbTabCache.get<CategoryOption[]>(ck('statistics_factories')) ?? []);
  const [loading, setLoading] = useState(() => !mmtbTabCache.has(ck('statistics_incidents')));
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(null);

  // Đếm giờ "đang xử lý" ở cột Thời Gian Xử Lý phải TỰ CHẠY (không đợi bấm "Xem thống kê"/"Làm
  // mới" mới cập nhật) — tick mỗi 60s để tính lại số phút đã trôi qua, không cần gọi lại API.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const iv = window.setInterval(() => setNowTick(Date.now()), 60000);
    return () => window.clearInterval(iv);
  }, []);

  // Bộ lọc NHÁP ở hàng 2 — CHỈ áp dụng thật khi bấm "Xem thống kê" (theo đúng yêu cầu, khác các
  // trang khác trong khu vực MMTB lọc ngay khi đổi giá trị).
  const [draftFactory, setDraftFactory] = useState('');
  const [draftEmployeeId, setDraftEmployeeId] = useState('');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [appliedFactory, setAppliedFactory] = useState('');
  const [appliedEmployeeId, setAppliedEmployeeId] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  async function load(force = false) {
    try {
      force ? setRefreshing(true) : setLoading(true);
      setError(null);
      const fresh = force ? '&fresh=1' : '';
      const settled = await Promise.allSettled([
        fetch(`/api/maintenance/response-time?scope=${scope}${force ? '&fresh=1' : ''}`).then((r) => r.json()),
        fetch(`/api/maintenance/employees?scope=${scope}${force ? '&fresh=1' : ''}`).then((r) => r.json()),
        fetch(`/api/maintenance/categories?type=FACTORY&scope=${scope}${fresh}`).then((r) => r.json()),
      ]);
      const [resRes, empRes, facRes] = settled.map((s) => (s.status === 'fulfilled' ? s.value : { success: false, error: String(s.reason) }));
      if (resRes.success) {
        setIncidents(resRes.incidents || []);
        setLogs(resRes.logs || []);
        mmtbTabCache.set(ck('statistics_incidents'), resRes.incidents || []);
        mmtbTabCache.set(ck('statistics_logs'), resRes.logs || []);
      } else {
        // KHÔNG xoá incidents đang có — giữ nguyên dữ liệu cũ (cache hoặc lần tải trước) thay vì
        // màn trắng nếu 1 lượt tải lại bị lỗi/timeout tạm thời, xem lib/mmtbTabCache.ts.
        console.warn('Failed to load response-time from tbsMayMoc:', resRes.error);
        setError(resRes.error || 'Không lấy được dữ liệu');
      }
      if (empRes.success) {
        setEmployees(empRes.data || []);
        mmtbTabCache.set(ck('statistics_employees'), empRes.data || []);
      }
      if (facRes.success) {
        setFactories(facRes.data || []);
        mmtbTabCache.set(ck('statistics_factories'), facRes.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch statistics data from tbsMayMoc:', err);
    } finally {
      force ? setRefreshing(false) : setLoading(false);
    }
  }

  useEffect(() => {
    // Cache còn mới (< 2 phút, xem lib/mmtbTabCache.ts) -> bỏ hẳn lượt tải nền, đỡ gọi lại API
    // mỗi lần bấm qua lại các trang MMTB liên tục trong khoảng thời gian ngắn.
    if (!mmtbTabCache.isFresh(ck('statistics_incidents'))) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maintenanceEmployees = useMemo(() => employees.filter((e) => e.role === 'MAINTENANCE'), [employees]);

  const employeeOptions = useMemo(
    () => maintenanceEmployees.map((e) => ({ id: e.id, name: `${e.name} (${e.employeeCode})` })),
    [maintenanceEmployees]
  );

  function handleApply() {
    setAppliedFactory(draftFactory);
    setAppliedEmployeeId(draftEmployeeId);
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
  }

  // Trạng thái ĐANG XỬ LÝ ngay bây giờ (cột Trạng Thái/Thời Gian Xử Lý ở tab Thống kê) — CỐ Ý
  // KHÔNG áp khoảng ngày đã lọc (khoảng ngày chỉ để xem số liệu quá khứ; "đang làm gì ngay lúc
  // này" luôn phải đúng thời điểm hiện tại, không phụ thuộc đang xem lịch sử ngày nào) — vẫn áp
  // Nhà máy/NVBT nếu đã chọn. Coi "đang xử lý" = đã Nhận việc, CHƯA Hoàn thành, KHÔNG tính nhắc
  // bảo trì định kỳ tự động (isMaintenanceDue).
  const liveInProgressByTech = useMemo(() => {
    const map = new Map<string, { acceptedAt: string }>();
    for (const i of incidents) {
      if (i.isMaintenanceDue || i.completedAt || !i.assignedTo) continue;
      if (appliedFactory && i.factoryName !== appliedFactory) continue;
      if (appliedEmployeeId && i.assignedTo.id !== appliedEmployeeId) continue;
      // Bình thường 1 người chỉ cầm đúng 1 việc — phòng hờ có nhiều thì giữ việc nhận SỚM NHẤT.
      const existing = map.get(i.assignedTo.id);
      if (!existing || i.acceptedAt < existing.acceptedAt) map.set(i.assignedTo.id, { acceptedAt: i.acceptedAt });
    }
    return map;
  }, [incidents, appliedFactory, appliedEmployeeId]);

  // Sự cố đã áp Nhà máy + khoảng ngày (từ nút "Xem thống kê") + NVBT (nếu đã chọn 1 người cụ
  // thể) — CHƯA áp typeFilter, dùng chung cho cả 6 ô hàng 1 lẫn bảng bên dưới.
  const scopedIncidents = useMemo(
    () =>
      incidents.filter(
        (i) =>
          (!appliedFactory || i.factoryName === appliedFactory) &&
          (!appliedEmployeeId || i.assignedTo?.id === appliedEmployeeId) &&
          inDateRange(i.createdAt, appliedFrom, appliedTo)
      ),
    [incidents, appliedFactory, appliedEmployeeId, appliedFrom, appliedTo]
  );
  // DTBD (Duy Tu Bảo Dưỡng) = sự cố được hệ thống tự nhắc theo lịch định kỳ (isMaintenanceDue),
  // KHÁC với sự cố người vận hành báo thủ công (Sửa Chữa) — cả 2 đều nằm CHUNG trong incidents của
  // response-time, không cần trộn thêm nguồn dữ liệu lịch bảo trì nào khác.
  const repairIncidents = useMemo(() => scopedIncidents.filter((i) => !i.isMaintenanceDue), [scopedIncidents]);
  const scheduledIncidents = useMemo(() => scopedIncidents.filter((i) => i.isMaintenanceDue), [scopedIncidents]);

  // Ô đang chọn (Tổng/Sửa chữa/DTBD) quyết định tập sự cố dùng để tính 2 ô thời gian TB + bảng.
  const activeIncidents = useMemo(() => {
    if (typeFilter === 'REPAIR') return repairIncidents;
    if (typeFilter === 'SCHEDULED') return scheduledIncidents;
    return scopedIncidents;
  }, [typeFilter, scopedIncidents, repairIncidents, scheduledIncidents]);

  // Nhân viên bảo trì khớp Nhà máy + NVBT đã áp dụng — dùng cho ô "Tổng bảo trì" + gốc bảng bên
  // dưới (hiện CẢ người chưa xử lý ca nào trong khoảng đang lọc, để thấy rõ ai chưa làm gì).
  const scopedEmployees = useMemo(
    () =>
      maintenanceEmployees.filter(
        (e) => (!appliedFactory || e.factory?.name === appliedFactory) && (!appliedEmployeeId || e.id === appliedEmployeeId)
      ),
    [maintenanceEmployees, appliedFactory, appliedEmployeeId]
  );

  // Log Bảo trì (kèm đánh giá nếu có) đã áp Nhà máy + NVBT + khoảng ngày — dùng riêng cho tab
  // "Đánh giá", KHÔNG áp typeFilter (tab này không phân biệt Sửa chữa/DTBD).
  const filteredLogs = useMemo(
    () =>
      logs.filter(
        (l) =>
          (!appliedFactory || l.factoryName === appliedFactory) &&
          (!appliedEmployeeId || l.technician.id === appliedEmployeeId) &&
          inDateRange(l.createdAt, appliedFrom, appliedTo)
      ),
    [logs, appliedFactory, appliedEmployeeId, appliedFrom, appliedTo]
  );

  // Xếp hạng theo điểm đánh giá TRUNG BÌNH — CHỈ liệt kê người đã được đánh giá ÍT NHẤT 1 lần
  // trong khoảng đang lọc (xếp hạng người chưa ai đánh giá không có ý nghĩa). Thời gian chờ
  // sửa/thời gian sửa TB tính từ CÙNG nguồn với tab Thống kê (scopedIncidents, không phụ thuộc
  // typeFilter) để 2 tab luôn khớp số nếu cùng 1 người.
  const ratingRows = useMemo(() => {
    const byTech = new Map<string, { ratings: number[]; comments: { text: string; createdAt: string }[]; repairCount: number }>();
    for (const l of filteredLogs) {
      const row = byTech.get(l.technician.id) ?? { ratings: [], comments: [], repairCount: 0 };
      row.repairCount++;
      if (l.skillRating != null) row.ratings.push(l.skillRating);
      if (l.ratingComment?.trim()) row.comments.push({ text: l.ratingComment.trim(), createdAt: l.createdAt });
      byTech.set(l.technician.id, row);
    }
    const timeByTech = new Map<string, { accepts: number[]; completes: number[] }>();
    for (const i of scopedIncidents) {
      if (!i.assignedTo) continue;
      const row = timeByTech.get(i.assignedTo.id) ?? { accepts: [], completes: [] };
      row.accepts.push(minutesBetween(i.createdAt, i.acceptedAt));
      if (i.completedAt) row.completes.push(minutesBetween(i.acceptedAt, i.completedAt));
      timeByTech.set(i.assignedTo.id, row);
    }
    return scopedEmployees
      .map((e) => {
        const r = byTech.get(e.id);
        const t = timeByTech.get(e.id);
        if (!r || r.ratings.length === 0) return null;
        const starCount = (n: number) => r.ratings.filter((v) => v === n).length;
        return {
          id: e.id,
          name: e.name,
          code: e.employeeCode,
          isTeamLead: e.isTeamLead,
          factoryName: e.factory?.name ?? null,
          avgRating: avg(r.ratings)!,
          totalRepairs: r.repairCount,
          stars: { 5: starCount(5), 4: starCount(4), 3: starCount(3), 2: starCount(2), 1: starCount(1) },
          avgAccept: t ? avg(t.accepts) : null,
          avgComplete: t ? avg(t.completes) : null,
          comments: r.comments.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.avgRating - a.avgRating || b.totalRepairs - a.totalRepairs);
  }, [filteredLogs, scopedIncidents, scopedEmployees]);

  const detailRating = ratingRows.find((r) => r.id === detailEmployeeId) ?? null;

  const stats = useMemo(() => {
    const acceptTimes = activeIncidents.map((i) => minutesBetween(i.createdAt, i.acceptedAt));
    const completeTimes = activeIncidents.filter((i) => i.completedAt).map((i) => minutesBetween(i.acceptedAt, i.completedAt!));
    return {
      total: scopedIncidents.length,
      repair: repairIncidents.length,
      scheduled: scheduledIncidents.length,
      maintenanceStaffCount: scopedEmployees.length,
      avgAccept: avg(acceptTimes),
      avgComplete: avg(completeTimes),
    };
  }, [activeIncidents, scopedIncidents, repairIncidents, scheduledIncidents, scopedEmployees]);

  const statsByEmployee = useMemo(() => {
    const map = new Map<string, { count: number; accepts: number[]; completes: number[] }>();
    for (const i of activeIncidents) {
      if (!i.assignedTo) continue;
      const row = map.get(i.assignedTo.id) ?? { count: 0, accepts: [], completes: [] };
      row.count++;
      row.accepts.push(minutesBetween(i.createdAt, i.acceptedAt));
      if (i.completedAt) row.completes.push(minutesBetween(i.acceptedAt, i.completedAt));
      map.set(i.assignedTo.id, row);
    }
    return map;
  }, [activeIncidents]);

  const tableRows = useMemo(
    () =>
      scopedEmployees
        .map((e) => {
          const s = statsByEmployee.get(e.id);
          const live = liveInProgressByTech.get(e.id);
          return {
            id: e.id,
            name: e.name,
            code: e.employeeCode,
            isTeamLead: e.isTeamLead,
            factoryName: e.factory?.name ?? null,
            areaName: e.area?.name ?? null,
            total: s?.count ?? 0,
            avgAccept: s ? avg(s.accepts) : null,
            avgComplete: s ? avg(s.completes) : null,
            liveBusy: !!live,
            liveElapsedMin: live ? minutesBetween(live.acceptedAt, new Date(nowTick).toISOString()) : null,
          };
        })
        .sort((a, b) => b.total - a.total),
    [scopedEmployees, statsByEmployee, liveInProgressByTech, nowTick]
  );

  const totalColumnLabel = typeFilter === 'REPAIR' ? 'Tổng Sửa Chữa' : typeFilter === 'SCHEDULED' ? 'Tổng DTBD' : 'Tổng Sửa Chữa & DTBD';

  // 3 ô đầu (Tổng/Sửa chữa/DTBD) BẤM ĐƯỢC để lọc — bấm lại ô đang chọn để bỏ lọc, giống hệt cách
  // trang Nhu Cầu Sửa Chữa đang làm với statusKey. 3 ô sau (Tổng bảo trì / 2 ô thời gian TB) CHỈ
  // hiển thị số, không lọc gì khi bấm.
  const countTiles: { key: TypeFilter; label: string; value: number; icon: typeof IconTool; bg: string; iconBg: string; text: string; ring: string }[] = [
    { key: null, label: 'Tổng Sửa Chữa & DTBD', value: stats.total, icon: IconTool, bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-300' },
    { key: 'REPAIR', label: 'Sửa Chữa', value: stats.repair, icon: IconTools, bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-300' },
    { key: 'SCHEDULED', label: 'DTBD (Duy Tu Bảo Dưỡng)', value: stats.scheduled, icon: IconCalendarStats, bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-300' },
  ];
  const infoTiles: { label: string; value: string; icon: typeof IconUsers; bg: string; iconBg: string; text: string }[] = [
    { label: 'Tổng Bảo Trì (nhân viên)', value: String(stats.maintenanceStaffCount), icon: IconUsers, bg: 'bg-violet-50', iconBg: 'bg-violet-100', text: 'text-violet-600' },
    { label: 'TB Thời Gian Chờ Sửa', value: formatMinutes(stats.avgAccept), icon: IconStopwatch, bg: 'bg-teal-50', iconBg: 'bg-teal-100', text: 'text-teal-600' },
    { label: 'TB Thời Gian Sửa', value: formatMinutes(stats.avgComplete), icon: IconClockHour4, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
  ];

  return (
    <MaintenanceShell title="Thống Kê & Đánh Giá" subtitle="Thống kê hoạt động bảo trì theo Nhà máy / Nhân viên">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Thống Kê & Đánh Giá</h1>
          <RefreshButton onClick={() => load(true)} loading={refreshing} />
        </div>

        {/* 2 tab — "Thống kê" (mặc định) / "Đánh giá" (bảng xếp hạng theo điểm sao). */}
        <div className="flex gap-2 border-b border-slate-200">
          {(
            [
              { key: 'thongke' as const, label: 'Thống kê' },
              { key: 'danhgia' as const, label: 'Đánh giá' },
            ]
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition cursor-pointer ${
                tab === t.key ? 'border-[#006838] text-[#006838]' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Hàng 1 — 3 ô đầu bấm được để lọc, 3 ô sau chỉ hiển thị số. CHỈ hiện ở tab Thống kê. */}
        {tab === 'thongke' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {countTiles.map((c) => {
              const isActive = c.key === null ? !typeFilter : typeFilter === c.key;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setTypeFilter((prev) => (c.key === null ? null : prev === c.key ? null : c.key))}
                  className={`flex items-center gap-3 rounded-2xl ${c.bg} p-4 text-left shadow-2xs transition hover:ring-2 ${c.ring} cursor-pointer ${isActive ? `ring-2 ${c.ring}` : ''}`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${c.iconBg}`}>
                    <c.icon size={22} className={c.text} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-2xl font-extrabold text-slate-900">{c.value}</div>
                    <div className="truncate text-xs font-semibold text-slate-500">{c.label}</div>
                  </div>
                </button>
              );
            })}
            {infoTiles.map((c) => (
              <div key={c.label} className={`flex items-center gap-3 rounded-2xl ${c.bg} p-4 shadow-2xs`}>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${c.iconBg}`}>
                  <c.icon size={22} className={c.text} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-2xl font-extrabold text-slate-900">{c.value}</div>
                  <div className="truncate text-xs font-semibold text-slate-500">{c.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hàng 2 — bộ lọc, CHỈ áp dụng thật khi bấm "Xem thống kê" — dùng CHUNG cho cả 2 tab. */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 flex flex-wrap items-center gap-2.5">
          <FilterSelect value={draftFactory} onChange={setDraftFactory} options={factories.map((f) => ({ id: f.name, name: f.name }))} placeholder="Tất cả nhà máy" />
          <FilterSelect value={draftEmployeeId} onChange={setDraftEmployeeId} options={employeeOptions} placeholder="Tất cả nhân viên bảo trì" />
          <DateRangeFilter from={draftFrom} to={draftTo} onFromChange={setDraftFrom} onToChange={setDraftTo} />
          <button
            type="button"
            onClick={handleApply}
            className="ml-auto px-5 py-2.5 rounded-xl bg-[#006838] text-white text-xs font-bold shadow-2xs hover:bg-[#00552d] transition cursor-pointer"
          >
            Xem thống kê
          </button>
        </div>

        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}

        {tab === 'thongke' && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 whitespace-nowrap">
                  <th className="p-3">Nhà Máy</th>
                  <th className="p-3">NVBT</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3">Thời Gian Xử Lý</th>
                  <th className="p-3">Phân Xưởng</th>
                  <th className="p-3">{totalColumnLabel}</th>
                  <th className="p-3">Thời Gian Sửa TB</th>
                  <th className="p-3">Thời Gian Phản Hồi TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 whitespace-nowrap">
                {loading && (
                  <tr>
                    <td className="p-4 text-slate-400" colSpan={8}>Đang tải...</td>
                  </tr>
                )}
                {!loading && tableRows.length === 0 && !error && (
                  <tr>
                    <td className="p-4 text-slate-400" colSpan={8}>Không có nhân viên bảo trì phù hợp bộ lọc</td>
                  </tr>
                )}
                {tableRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">{r.factoryName ?? '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{r.name}</span>
                        {r.isTeamLead && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Trưởng team</span>}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">{r.code}</div>
                    </td>
                    <td className="p-3">
                      {r.liveBusy ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Đang xử lý</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Đang rảnh</span>
                      )}
                    </td>
                    <td className="p-3">{r.liveBusy ? formatMinutes(r.liveElapsedMin) : '—'}</td>
                    <td className="p-3">{r.areaName ?? '—'}</td>
                    <td className="p-3 font-bold text-slate-900">{r.total}</td>
                    <td className="p-3">{formatMinutes(r.avgComplete)}</td>
                    <td className="p-3">{formatMinutes(r.avgAccept)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab "Đánh giá" — xếp hạng theo điểm sao TB, CHỈ người đã được đánh giá ≥1 lần trong
            khoảng đang lọc. Bấm vào 1 dòng xem chi tiết số sao + tổng hợp góp ý. */}
        {tab === 'danhgia' && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 whitespace-nowrap">
                  <th className="p-3">Xếp Hạng</th>
                  <th className="p-3">NVBT</th>
                  <th className="p-3">Điểm TB</th>
                  <th className="p-3">Tổng Sửa Chữa</th>
                  <th className="p-3">5 ⭐</th>
                  <th className="p-3">4 ⭐</th>
                  <th className="p-3">3 ⭐</th>
                  <th className="p-3">2 ⭐</th>
                  <th className="p-3">1 ⭐</th>
                  <th className="p-3">TB Thời Gian Chờ Sửa</th>
                  <th className="p-3">TB Thời Gian Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 whitespace-nowrap">
                {loading && (
                  <tr>
                    <td className="p-4 text-slate-400" colSpan={11}>Đang tải...</td>
                  </tr>
                )}
                {!loading && ratingRows.length === 0 && !error && (
                  <tr>
                    <td className="p-4 text-slate-400" colSpan={11}>Chưa có ai được đánh giá trong khoảng đang lọc</td>
                  </tr>
                )}
                {ratingRows.map((r, idx) => (
                  <tr key={r.id} onClick={() => setDetailEmployeeId(r.id)} className="hover:bg-slate-50/80 transition cursor-pointer">
                    <td className="p-3 font-mono font-bold text-[#006838]">#{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{r.name}</span>
                        {r.isTeamLead && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Trưởng team</span>}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">{r.code} · {r.factoryName ?? '—'}</div>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{r.avgRating.toFixed(1)} ⭐</td>
                    <td className="p-3">{r.totalRepairs}</td>
                    <td className="p-3">{r.stars[5]}</td>
                    <td className="p-3">{r.stars[4]}</td>
                    <td className="p-3">{r.stars[3]}</td>
                    <td className="p-3">{r.stars[2]}</td>
                    <td className="p-3">{r.stars[1]}</td>
                    <td className="p-3">{formatMinutes(r.avgAccept)}</td>
                    <td className="p-3">{formatMinutes(r.avgComplete)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailRating && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setDetailEmployeeId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                  {detailRating.name}
                  {detailRating.isTeamLead && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Trưởng team</span>}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{detailRating.code} · {detailRating.factoryName ?? '—'}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailEmployeeId(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-amber-700">Điểm trung bình</span>
                <span className="text-xl font-black text-amber-700">{detailRating.avgRating.toFixed(1)} ⭐</span>
              </div>
              <div className="space-y-1">
                {([5, 4, 3, 2, 1] as const).map((n) => {
                  const count = detailRating.stars[n];
                  const totalStars = detailRating.stars[5] + detailRating.stars[4] + detailRating.stars[3] + detailRating.stars[2] + detailRating.stars[1];
                  const pct = totalStars > 0 ? Math.round((count / totalStars) * 100) : 0;
                  return (
                    <div key={n} className="flex items-center gap-2 text-xs">
                      <span className="w-8 shrink-0 font-semibold text-slate-600">{n} ⭐</span>
                      <div className="flex-1 h-2 rounded-full bg-amber-100 overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 shrink-0 text-right font-bold text-slate-600">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tổng hợp góp ý ({detailRating.comments.length})</p>
            {detailRating.comments.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có góp ý bằng chữ nào trong khoảng đang lọc.</p>
            ) : (
              <div className="space-y-2">
                {detailRating.comments.map((c, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.text}</p>
                    <p className="mt-1 text-[10px] text-slate-400 font-mono">{formatDateShort(c.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </MaintenanceShell>
  );
}
