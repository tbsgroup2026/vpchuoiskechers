'use client';

import { IconX, IconTool, IconClipboardList, IconClock, IconAlertTriangle, IconTag, IconStopwatch, IconGauge, IconClockHour4 } from '@tabler/icons-react';
import StatCardRow from '@/components/StatCardRow';

export type MachineKpi = { mtta: number; mttr: number; mttd: number; count: number; downtime: number };

function fmtMin(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 });
}
function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export type MachineIncidentItem = {
  id: string;
  createdAt: string;
  completedAt: string | null;
  description: string | null;
  categoryName: string | null;
  reporterName: string | null;
  assignedToName: string | null;
};

export type MachineRepairLog = {
  id: string;
  startTime: string | null;
  technicianName: string | null;
  repairDetail: string | null;
  durationMinutes: number | null;
};

function fmtDateTime(s: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Modal chi tiết khi click 1 cột trong Pareto "Top Máy Gặp Sự Cố Nhiều Nhất" — 4 phần: lỗi hay gặp
// (theo danh mục), xếp hạng người sửa nhiều nhất, lịch sử từng lần sửa chữa, và danh sách từng sự
// cố (mô tả, người báo, người được giao). Chữ số cỡ lớn hơn bản đầu theo phản hồi người dùng.
export default function MachineIncidentModal({
  machineCode,
  machineName,
  incidents,
  logs,
  techRanking,
  issueRanking,
  khacGroups,
  kpi,
  onClose,
}: {
  machineCode: string;
  machineName: string;
  incidents: MachineIncidentItem[];
  logs: MachineRepairLog[];
  techRanking: { name: string; count: number }[];
  issueRanking: { name: string; count: number }[];
  // "Khác" của riêng máy này, đã tách hết thành từng nội dung cụ thể (gộp gần đúng) — không còn nằm
  // chung 1 dòng "Khác" trong issueRanking ở trên nữa.
  khacGroups: { label: string; count: number; variants: string[] }[];
  // MTTA/MTTR/MTTD/Tổng Sự Cố/Tổng Downtime CHỈ RIÊNG máy này — cùng công thức/hàng thẻ đang dùng
  // ở đầu trang Tổng Quan (StatCardRow + computeScopeKpi), để biết máy này chờ/sửa/dừng bao lâu.
  kpi: MachineKpi;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{machineName || machineCode}</h3>
            <p className="text-sm text-slate-500 mt-1">Mã máy: {machineCode} · {incidents.length} sự cố</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
            <IconX size={22} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-6">
          <StatCardRow
            items={[
              { key: 'mtta', label: 'MTTA', sub: 'Chờ tiếp nhận', value: `${fmtMin(kpi.mtta)} phút`, icon: IconStopwatch, bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
              { key: 'mttr', label: 'MTTR', sub: 'Thời gian xử lý', value: `${fmtMin(kpi.mttr)} phút`, icon: IconTool, bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', text: 'text-indigo-600' },
              { key: 'mttd', label: 'MTTD', sub: 'Thời gian dừng máy', value: `${fmtMin(kpi.mttd)} phút`, icon: IconGauge, bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600' },
              { key: 'count', label: 'Tổng Sự Cố', sub: 'Số vụ việc', value: fmtInt(kpi.count), icon: IconAlertTriangle, bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600' },
              { key: 'downtime', label: 'Tổng Downtime', sub: 'Tổng dừng máy', value: `${fmtMin(kpi.downtime)} phút`, icon: IconClockHour4, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
            ]}
            compact
          />

          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              <IconAlertTriangle size={17} className="text-orange-600" /> Lỗi Hay Gặp
            </h4>
            {issueRanking.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
            ) : (
              <div className="space-y-2">
                {issueRanking.map((c, idx) => (
                  <div key={c.name} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-700 font-bold flex items-center justify-center shrink-0 text-sm">{idx + 1}</span>
                    <span className="flex-1 font-semibold text-slate-700">{c.name}</span>
                    <span className="text-slate-500 font-medium">{c.count} lần</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {khacGroups.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
                <IconTag size={17} className="text-orange-500" /> Chi Tiết Lỗi &quot;Khác&quot;
              </h4>
              <p className="text-xs text-slate-400 mb-3">Gộp theo nội dung mô tả gần giống nhau (tự động, có thể chưa hoàn toàn chính xác).</p>
              <div className="space-y-2">
                {khacGroups.map((g) => (
                  <div key={g.label} className="border border-slate-100 rounded-lg px-4 py-2.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-slate-700">{g.label}</span>
                      <span className="text-slate-500 font-medium shrink-0">{g.count} lần</span>
                    </div>
                    {g.variants.length > 1 && <p className="text-xs text-slate-400 mt-1">Biến thể: {g.variants.join(', ')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              <IconTool size={17} className="text-indigo-600" /> Xếp Hạng Người Sửa
            </h4>
            {techRanking.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có dữ liệu sửa chữa.</p>
            ) : (
              <div className="space-y-2">
                {techRanking.map((t, idx) => (
                  <div key={t.name} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-sm">{idx + 1}</span>
                    <span className="flex-1 font-semibold text-slate-700">{t.name}</span>
                    <span className="text-slate-500 font-medium">{t.count} lần sửa</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              <IconClock size={17} className="text-amber-600" /> Lịch Sử Sửa Chữa
            </h4>
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có lần sửa chữa nào.</p>
            ) : (
              <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {logs.map((l) => (
                  <div key={l.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-700">{l.technicianName || '—'}</span>
                      <span className="text-slate-400 shrink-0">
                        {fmtDateTime(l.startTime)}{l.durationMinutes != null ? ` · ${l.durationMinutes} phút` : ''}
                      </span>
                    </div>
                    {l.repairDetail && <p className="text-slate-500 mt-1">{l.repairDetail}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              <IconClipboardList size={17} className="text-rose-600" /> Danh Sách Sự Cố
            </h4>
            {incidents.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có sự cố nào.</p>
            ) : (
              <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {incidents.map((i) => (
                  <div key={i.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">{fmtDateTime(i.createdAt)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${i.completedAt ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {i.completedAt ? 'Đã xong' : 'Chưa xong'}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium mt-1">{i.description || '—'}</p>
                    <p className="text-slate-400 mt-1">
                      Báo: <span className="font-semibold text-slate-600">{i.reporterName || '—'}</span>
                      {i.assignedToName && (
                        <>
                          {' '}· Giao: <span className="font-semibold text-slate-600">{i.assignedToName}</span>
                        </>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
