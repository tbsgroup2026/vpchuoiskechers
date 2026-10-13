'use client';

import { useState } from 'react';
import { IconX, IconStack2, IconTag, IconStopwatch, IconTool, IconGauge, IconAlertTriangle, IconClockHour4, IconArrowBackUp } from '@tabler/icons-react';
import StatCardRow from '@/components/StatCardRow';

export type CategoryMachineRow = { machineCode: string; machineName: string; count: number };
export type CategoryKpi = { mtta: number; mttr: number; mttd: number; count: number; downtime: number };
// kpi RIÊNG của từng nhóm — bấm vào 1 nhóm là lọc hàng thẻ số liệu theo ĐÚNG nhóm đó thay vì cả
// khối "Khác".
export type CategoryTextGroup = { label: string; count: number; variants: string[]; kpi: CategoryKpi };

function fmtMin(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 });
}
function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

// Modal chi tiết khi click 1 cột trong Pareto "Phân Loại Danh Mục Hư hỏng". 2 chế độ:
// - "machines": danh mục lỗi bình thường -> xếp hạng MÁY đã báo lỗi này nhiều -> ít.
// - "khac": riêng cột "Khác" -> gộp các mô tả tự do gần giống nhau (fuzzy) thành từng nhóm, kèm %.
// Chữ số cỡ lớn hơn bản đầu theo phản hồi người dùng.
export default function CategoryDetailModal({
  category,
  total,
  mode,
  machines,
  groups,
  kpi,
  machinesHeading = 'Máy Đã Báo Lỗi Này',
  unitSuffix = 'lần',
  onClose,
}: {
  category: string;
  total: number;
  mode: 'machines' | 'khac';
  machines?: CategoryMachineRow[];
  groups?: CategoryTextGroup[];
  // MTTA/MTTR/MTTD/Tổng Sự Cố/Tổng Downtime CHỈ RIÊNG danh mục lỗi này — cùng hàng thẻ đang dùng ở
  // đầu trang Tổng Quan (StatCardRow + computeScopeKpi).
  kpi: CategoryKpi;
  // Modal này TÁI DÙNG cho cả 3 Pareto khác nhau (danh mục lỗi/Tổ-Chuyền/Phân Xưởng) — mỗi nơi xếp
  // hạng máy theo 1 chỉ số khác nhau (số lần sự cố VS tổng downtime), nên tiêu đề + đơn vị hiện thị
  // cần đổi theo cho khớp nghĩa, không hardcode "lần" cho mọi trường hợp.
  machinesHeading?: string;
  unitSuffix?: string;
  onClose: () => void;
}) {
  // Bấm vào 1 nhóm trong danh sách "Khác" -> lọc hàng thẻ số liệu ở trên theo ĐÚNG nhóm đó (bấm lại
  // lần nữa hoặc bấm "Xem lại tất cả" để quay về số liệu chung của cả cột đang xem).
  const [selectedGroupLabel, setSelectedGroupLabel] = useState<string | null>(null);
  const selectedGroup = groups?.find((g) => g.label === selectedGroupLabel) ?? null;
  const displayKpi = selectedGroup ? selectedGroup.kpi : kpi;
  const displayTotal = selectedGroup ? selectedGroup.count : total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {category}
              {selectedGroup && <span className="text-slate-400 font-semibold"> — {selectedGroup.label}</span>}
            </h3>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              {displayTotal} sự cố
              {selectedGroup && (
                <button
                  onClick={() => setSelectedGroupLabel(null)}
                  className="inline-flex items-center gap-1 text-indigo-600 font-semibold cursor-pointer hover:underline"
                >
                  <IconArrowBackUp size={13} /> Xem lại tất cả &quot;{category}&quot;
                </button>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
            <IconX size={22} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-6">
          <StatCardRow
            items={[
              { key: 'mtta', label: 'MTTA', sub: 'Chờ tiếp nhận', value: `${fmtMin(displayKpi.mtta)} phút`, icon: IconStopwatch, bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
              { key: 'mttr', label: 'MTTR', sub: 'Thời gian xử lý', value: `${fmtMin(displayKpi.mttr)} phút`, icon: IconTool, bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', text: 'text-indigo-600' },
              { key: 'mttd', label: 'MTTD', sub: 'Thời gian dừng máy', value: `${fmtMin(displayKpi.mttd)} phút`, icon: IconGauge, bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600' },
              { key: 'count', label: 'Tổng Sự Cố', sub: 'Số vụ việc', value: fmtInt(displayKpi.count), icon: IconAlertTriangle, bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600' },
              { key: 'downtime', label: 'Tổng Downtime', sub: 'Tổng dừng máy', value: `${fmtMin(displayKpi.downtime)} phút`, icon: IconClockHour4, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
            ]}
            compact
          />
          {mode === 'machines' ? (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                <IconStack2 size={17} className="text-rose-600" /> {machinesHeading}
              </h4>
              {(machines || []).length === 0 ? (
                <p className="text-base text-slate-400">Chưa có dữ liệu.</p>
              ) : (
                <div className="space-y-2.5">
                  {(machines || []).map((m, idx) => (
                    <div key={m.machineCode} className="flex items-center gap-3 text-base">
                      <span className="w-7 h-7 rounded-full bg-rose-50 text-rose-700 font-bold flex items-center justify-center shrink-0 text-base">{idx + 1}</span>
                      <span className="flex-1 truncate">
                        <span className="font-semibold text-slate-700">{m.machineName}</span>
                        <span className="text-slate-400"> ({m.machineCode})</span>
                      </span>
                      <span className="text-slate-500 font-bold shrink-0">{m.count} {unitSuffix}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                <IconTag size={17} className="text-rose-600" /> Các Lỗi &quot;Khác&quot; Được Gộp Nhóm Gần Đúng
              </h4>
              <p className="text-sm text-slate-400 mb-4">
                Gộp theo nội dung mô tả gần giống nhau (tự động, có thể chưa hoàn toàn chính xác).
              </p>
              {(groups || []).length === 0 ? (
                <p className="text-base text-slate-400">Chưa có dữ liệu.</p>
              ) : (
                <div className="space-y-3">
                  {(groups || []).map((g) => {
                    const active = selectedGroupLabel === g.label;
                    return (
                      <button
                        key={g.label}
                        type="button"
                        onClick={() => setSelectedGroupLabel(active ? null : g.label)}
                        className={`w-full text-left border rounded-lg px-4 py-3.5 cursor-pointer transition ${
                          active ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-base">
                          <span className="font-bold text-slate-700">{g.label}</span>
                          <span className="text-slate-600 shrink-0 font-bold">
                            {g.count} lần ({total ? Math.round((g.count / total) * 1000) / 10 : 0}%)
                          </span>
                        </div>
                        {g.variants.length > 1 && (
                          <p className="text-sm text-slate-400 mt-1.5">Biến thể: {g.variants.join(', ')}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
