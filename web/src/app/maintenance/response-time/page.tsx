'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconClockHour4, IconStopwatch, IconStar, IconTrophy, IconUserCheck, IconUserOff, IconX, IconMapPin } from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import FilterSelect from '@/components/FilterSelect';
import DateRangeFilter, { inDateRange } from '@/components/DateRangeFilter';
import RefreshButton from '@/components/RefreshButton';
import { getCurrentMmtbScope } from "@/lib/equipmentScope";

// Dữ liệu MMTB tách theo khu vực (Văn phòng / Miền Đông / Kiên Giang) như các trang bảo trì khác của VP Chuỗi
const withMmtbScope = (u: string) => `${u}${u.includes("?") ? "&" : "?"}scope=${getCurrentMmtbScope()}`;


type ResponseTimeIncident = {
  id: string;
  isMaintenanceDue: boolean;
  createdAt: string;
  acceptedAt: string;
  completedAt: string | null;
  assignedTo: { id: string; name: string; employeeCode: string } | null;
  machineName: string | null;
  machineCode: string | null;
  factoryName: string | null;
  areaName: string | null;
};

type ResponseTimeLog = {
  id: string;
  createdAt: string;
  skillRating: number | null;
  technician: { id: string; name: string; employeeCode: string };
  factoryName: string | null;
};

type Employee = { id: string; employeeCode: string; name: string; role: string; factory: { id: string; name: string } | null };

function minutesBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

function formatMinutes(m: number): string {
  if (m < 60) return `${Math.round(m)} phút`;
  const h = Math.floor(m / 60);
  const rem = Math.round(m % 60);
  return `${h} giờ ${rem} phút`;
}

type CategoryOption = { id: string; name: string };

export default function ResponseTimePage() {
  const [incidents, setIncidents] = useState<ResponseTimeIncident[]>([]);
  const [logs, setLogs] = useState<ResponseTimeLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [factories, setFactories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factoryName, setFactoryName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  // Đếm giờ "đang xử lý" phải TỰ CHẠY (không đợi bấm Làm mới mới cập nhật) — tick mỗi phút để
  // recompute elapsed time, không cần gọi lại API.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const iv = window.setInterval(() => setNowTick(Date.now()), 60000);
    return () => window.clearInterval(iv);
  }, []);

  async function load(force = false) {
    try {
      force ? setRefreshing(true) : setLoading(true);
      setError(null);
      const fresh = force ? '?fresh=1' : '';
      const settled = await Promise.allSettled([
        fetch(withMmtbScope(`/api/maintenance/response-time${fresh}`)).then((r) => r.json()),
        fetch(withMmtbScope(`/api/maintenance/categories?type=FACTORY${force ? '&fresh=1' : ''}`)).then((r) => r.json()),
        fetch(withMmtbScope(`/api/maintenance/employees${force ? '?fresh=1' : ''}`)).then((r) => r.json()),
      ]);
      const [resRes, facRes, empRes] = settled.map((s) => (s.status === 'fulfilled' ? s.value : { success: false, error: String(s.reason) }));
      if (resRes.success) {
        setIncidents(resRes.incidents || []);
        setLogs(resRes.logs || []);
      } else {
        console.warn('Failed to load response-time from tbsMayMoc:', resRes.error);
        setError(resRes.error || 'Không lấy được dữ liệu');
      }
      if (facRes.success) setFactories(facRes.data || []);
      if (empRes.success) setEmployees(empRes.data || []);
    } catch (err) {
      console.warn('Failed to fetch response-time from tbsMayMoc:', err);
    } finally {
      force ? setRefreshing(false) : setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredIncidents = useMemo(
    () =>
      incidents.filter(
        (i) => (!factoryName || i.factoryName === factoryName) && inDateRange(i.createdAt, dateFrom, dateTo),
      ),
    [incidents, factoryName, dateFrom, dateTo],
  );
  const filteredLogs = useMemo(
    () =>
      logs.filter(
        (l) => (!factoryName || l.factoryName === factoryName) && inDateRange(l.createdAt, dateFrom, dateTo),
      ),
    [logs, factoryName, dateFrom, dateTo],
  );

  const overall = useMemo(() => {
    const acceptTimes = filteredIncidents.map((i) => minutesBetween(i.createdAt, i.acceptedAt));
    const completeTimes = filteredIncidents
      .filter((i) => i.completedAt)
      .map((i) => minutesBetween(i.acceptedAt, i.completedAt!));
    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
    const ratings = filteredLogs.filter((l) => l.skillRating != null).map((l) => l.skillRating!);
    return {
      avgAccept: avg(acceptTimes),
      avgComplete: avg(completeTimes),
      totalHandled: filteredIncidents.length,
      avgRating: avg(ratings),
    };
  }, [filteredIncidents, filteredLogs]);

  const ranking = useMemo(() => {
    type Row = { id: string; name: string; code: string; accepts: number[]; completes: number[]; ratings: number[] };
    const byTech = new Map<string, Row>();
    for (const i of filteredIncidents) {
      if (!i.assignedTo) continue;
      const row = byTech.get(i.assignedTo.id) ?? { id: i.assignedTo.id, name: i.assignedTo.name, code: i.assignedTo.employeeCode, accepts: [], completes: [], ratings: [] };
      row.accepts.push(minutesBetween(i.createdAt, i.acceptedAt));
      if (i.completedAt) row.completes.push(minutesBetween(i.acceptedAt, i.completedAt));
      byTech.set(i.assignedTo.id, row);
    }
    for (const l of filteredLogs) {
      if (l.skillRating == null) continue;
      const row = byTech.get(l.technician.id) ?? { id: l.technician.id, name: l.technician.name, code: l.technician.employeeCode, accepts: [], completes: [], ratings: [] };
      row.ratings.push(l.skillRating);
      byTech.set(l.technician.id, row);
    }
    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null);
    return Array.from(byTech.values())
      .map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        totalHandled: r.accepts.length,
        avgAccept: avg(r.accepts),
        avgComplete: avg(r.completes),
        avgRating: avg(r.ratings),
      }))
      .sort((a, b) => b.totalHandled - a.totalHandled);
  }, [filteredIncidents, filteredLogs]);

  // Nhân viên bảo trì (role=MAINTENANCE, khớp danh sách thật ở trang Nhân Sự) — KỂ CẢ ai đang 0
  // việc cũng phải hiện "đang rảnh", không chỉ những người đã từng xuất hiện trong dữ liệu sự cố.
  const maintenanceEmployees = useMemo(() => employees.filter((e) => e.role === 'MAINTENANCE'), [employees]);

  // Việc ĐANG XỬ LÝ (đã nhận, CHƯA hoàn thành) trong đúng phạm vi lọc hiện tại — bỏ qua nhắc bảo
  // trì định kỳ tự động (isMaintenanceDue), vì đó không phải việc sửa chữa thật đang "cầm".
  const inProgressByEmployee = useMemo(() => {
    const map = new Map<string, ResponseTimeIncident[]>();
    for (const i of filteredIncidents) {
      if (i.isMaintenanceDue || i.completedAt || !i.assignedTo) continue;
      const arr = map.get(i.assignedTo.id) ?? [];
      arr.push(i);
      map.set(i.assignedTo.id, arr);
    }
    return map;
  }, [filteredIncidents]);

  const workload = useMemo(() => {
    return maintenanceEmployees
      .map((e) => {
        const items = (inProgressByEmployee.get(e.id) ?? [])
          .map((i) => ({ ...i, elapsedMin: minutesBetween(i.acceptedAt, new Date(nowTick).toISOString()) }))
          .sort((a, b) => b.elapsedMin - a.elapsedMin);
        return { id: e.id, name: e.name, code: e.employeeCode, factoryName: e.factory?.name ?? null, items, busy: items.length > 0 };
      })
      .sort((a, b) => (b.items[0]?.elapsedMin ?? 0) - (a.items[0]?.elapsedMin ?? 0));
  }, [maintenanceEmployees, inProgressByEmployee, nowTick]);

  const busyCount = workload.filter((w) => w.busy).length;
  const freeList = workload.filter((w) => !w.busy);
  const busyList = workload.filter((w) => w.busy);
  const maxElapsed = Math.max(1, ...busyList.map((w) => w.items[0]?.elapsedMin ?? 0));

  // Gom "Đang Rảnh" theo Nhà máy — trước đây liệt kê phẳng chung 1 chỗ, chọn "Tất cả nhà máy" thì
  // không biết ai đang ở Nhà máy nào. Không gán Nhà máy (hiếm) gom vào 1 nhóm riêng, hiện SAU CÙNG.
  const freeByFactory = useMemo(() => {
    const byFactory = new Map<string, typeof freeList>();
    for (const w of freeList) {
      const key = w.factoryName || '';
      const arr = byFactory.get(key);
      if (arr) arr.push(w);
      else byFactory.set(key, [w]);
    }
    return Array.from(byFactory.entries())
      .map(([name, list]) => ({ name: name || 'Chưa gán Nhà máy', list }))
      .sort((a, b) => {
        if (a.name === 'Chưa gán Nhà máy') return 1;
        if (b.name === 'Chưa gán Nhà máy') return -1;
        return a.name.localeCompare(b.name, 'vi');
      });
  }, [freeList]);

  const detailEmployee = useMemo(() => {
    if (!detailEmployeeId) return null;
    const w = workload.find((x) => x.id === detailEmployeeId);
    const emp = maintenanceEmployees.find((e) => e.id === detailEmployeeId);
    if (!emp) return null;
    const recentDone = filteredIncidents
      .filter((i) => i.assignedTo?.id === detailEmployeeId && i.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 8);
    return { id: emp.id, name: emp.name, code: emp.employeeCode, inProgress: w?.items ?? [], recentDone };
  }, [detailEmployeeId, workload, maintenanceEmployees, filteredIncidents]);

  return (
    <MaintenanceShell title="Thời Gian Phản Hồi" subtitle="Thống kê xử lý sự cố + đánh giá nhân viên bảo trì — Tổ hợp Kiên Giang">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-extrabold text-tbs-dark">Thời Gian Phản Hồi</h1>
          <RefreshButton onClick={() => load(true)} loading={refreshing} />
        </div>

        {/* Lỗi kết nối tbsMayMoc chỉ log console (F12), không hiện banner ngoài trang */}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-2.5">
          <FilterSelect value={factoryName} onChange={setFactoryName} options={factories.map((f) => ({ id: f.name, name: f.name }))} placeholder="Tất cả nhà máy" />
          <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-xs text-gray-400">Đang tải...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Sự cố đã nhận', value: overall.totalHandled, icon: IconClockHour4, bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
                { label: 'TB thời gian nhận việc', value: formatMinutes(overall.avgAccept), icon: IconStopwatch, bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600' },
                { label: 'TB thời gian hoàn thành', value: formatMinutes(overall.avgComplete), icon: IconStopwatch, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
                { label: 'Đánh giá trung bình', value: overall.avgRating ? `${overall.avgRating.toFixed(1)} ★` : '-', icon: IconStar, bg: 'bg-violet-50', iconBg: 'bg-violet-100', text: 'text-violet-600' },
              ].map((c) => (
                <div key={c.label} className={`flex items-center gap-3 rounded-2xl ${c.bg} p-4 shadow-sm`}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${c.iconBg}`}>
                    <c.icon size={22} className={c.text} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-extrabold text-tbs-dark">{c.value}</div>
                    <div className="truncate text-xs font-semibold text-gray-500">{c.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Nhân viên đang nhận việc / đang rảnh — theo đúng bộ lọc Nhà máy + khoảng ngày ở trên */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <h3 className="text-xs font-extrabold text-tbs-dark flex items-center gap-1.5">
                  <IconUserCheck size={15} className="text-amber-500" /> Đang Xử Lý ({busyCount}/{maintenanceEmployees.length})
                </h3>
                {busyList.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Không ai đang xử lý việc dở dang</p>
                ) : (
                  <div className="space-y-2">
                    {busyList.map((w) => {
                      const elapsed = w.items[0]?.elapsedMin ?? 0;
                      return (
                        <button
                          key={w.id}
                          onClick={() => setDetailEmployeeId(w.id)}
                          className="w-full text-left space-y-1 hover:bg-gray-50 rounded-lg p-1.5 -m-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-tbs-dark">{w.name} {w.items.length > 1 && <span className="text-gray-400 font-normal">({w.items.length} việc)</span>}</span>
                            <span className="font-mono text-amber-600 font-bold">{formatMinutes(elapsed)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(elapsed / maxElapsed) * 100}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <h3 className="text-xs font-extrabold text-tbs-dark flex items-center gap-1.5">
                  <IconUserOff size={15} className="text-emerald-500" /> Đang Rảnh ({freeList.length}/{maintenanceEmployees.length})
                </h3>
                {freeList.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Ai cũng đang có việc</p>
                ) : (
                  <div className="space-y-3">
                    {freeByFactory.map((g) => (
                      <div key={g.name}>
                        <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-gray-400">
                          {g.name} <span className="font-normal normal-case text-gray-300">· {g.list.length}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {g.list.map((w) => (
                            <button
                              key={w.id}
                              onClick={() => setDetailEmployeeId(w.id)}
                              className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100"
                            >
                              {w.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-tbs-dark mb-2 flex items-center gap-1.5">
                <IconTrophy size={16} className="text-amber-500" /> Xếp Hạng Nhân Viên Bảo Trì
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#eef7f2] text-xs font-semibold text-tbs-dark uppercase border-b border-emerald-100 whitespace-nowrap">
                      <th className="p-4">Nhân Viên</th>
                      <th className="p-4">Mã NV</th>
                      <th className="p-4">Số Việc Đã Nhận</th>
                      <th className="p-4">TB Thời Gian Nhận</th>
                      <th className="p-4">TB Thời Gian Hoàn Thành</th>
                      <th className="p-4">Đang Xử Lý (Chưa Xong)</th>
                      <th className="p-4">Đánh Giá TB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700 whitespace-nowrap">
                    {ranking.length === 0 && <tr><td className="p-4 text-gray-400" colSpan={7}>Chưa có dữ liệu</td></tr>}
                    {ranking.map((r) => {
                      const w = workload.find((x) => x.id === r.id);
                      return (
                        <tr key={r.id} onClick={() => setDetailEmployeeId(r.id)} className="hover:bg-gray-50/80 transition cursor-pointer">
                          <td className="p-4 font-semibold text-tbs-dark">{r.name}</td>
                          <td className="p-4 font-mono text-gray-400">{r.code}</td>
                          <td className="p-4 font-bold text-accent">{r.totalHandled}</td>
                          <td className="p-4">{r.avgAccept != null ? formatMinutes(r.avgAccept) : '-'}</td>
                          <td className="p-4">{r.avgComplete != null ? formatMinutes(r.avgComplete) : '-'}</td>
                          <td className="p-4">
                            {w && w.busy ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
                                {formatMinutes(w.items[0].elapsedMin)}{w.items.length > 1 ? ` (${w.items.length} việc)` : ''}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="p-4">{r.avgRating != null ? `${r.avgRating.toFixed(1)} ★` : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {detailEmployee && <EmployeeDetailModal employee={detailEmployee} nowTick={nowTick} onClose={() => setDetailEmployeeId(null)} />}
    </MaintenanceShell>
  );
}

function EmployeeDetailModal({
  employee: e,
  nowTick,
  onClose,
}: {
  employee: { id: string; name: string; code: string; inProgress: (ResponseTimeIncident & { elapsedMin: number })[]; recentDone: ResponseTimeIncident[] };
  nowTick: number;
  onClose: () => void;
}) {
  void nowTick; // elapsedMin đã tính sẵn ở component cha theo đúng nowTick mới nhất
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto" onClick={(e2) => e2.stopPropagation()}>
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-tbs-dark">{e.name}</h3>
              <p className="text-xs text-gray-400 font-mono">{e.code}</p>
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
              <IconX size={16} />
            </button>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Đang xử lý ({e.inProgress.length})</p>
            {e.inProgress.length === 0 ? (
              <p className="text-xs text-gray-400">Không có việc nào đang dở dang</p>
            ) : (
              <div className="space-y-2">
                {e.inProgress.map((i) => (
                  <div key={i.id} className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-tbs-dark">{i.machineName ?? 'Máy'}{i.machineCode ? ` · ${i.machineCode}` : ''}</span>
                      <span className="font-mono font-bold text-amber-700">{formatMinutes(i.elapsedMin)}</span>
                    </div>
                    <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                      <IconMapPin size={12} /> {i.factoryName ? `${i.factoryName} > ${i.areaName ?? '—'}` : (i.areaName ?? '—')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Đã hoàn thành gần đây</p>
            {e.recentDone.length === 0 ? (
              <p className="text-xs text-gray-400">Chưa có việc nào hoàn thành trong phạm vi đang lọc</p>
            ) : (
              <div className="space-y-2">
                {e.recentDone.map((i) => (
                  <div key={i.id} className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-tbs-dark">{i.machineName ?? 'Máy'}{i.machineCode ? ` · ${i.machineCode}` : ''}</span>
                      <span className="font-mono text-emerald-700">{formatMinutes(minutesBetween(i.acceptedAt, i.completedAt!))}</span>
                    </div>
                    <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                      <IconMapPin size={12} /> {i.factoryName ? `${i.factoryName} > ${i.areaName ?? '—'}` : (i.areaName ?? '—')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={onClose} className="w-full py-2.5 bg-tbs-dark text-white rounded-xl font-bold text-xs">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
