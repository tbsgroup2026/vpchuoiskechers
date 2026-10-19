'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IconTarget } from '@tabler/icons-react';

export type ParetoItem = { label: string; value: number };

// Biểu đồ Pareto dùng chung — cột (giá trị) + đường (tích lũy %), 2 trục Y. Tự tính "tập trung N
// mục đạt 80% tác động" (nguyên lý 80/20) để làm nổi bật phần quan trọng nhất, giống các báo cáo
// Pareto thực tế. Màu theo bảng màu sáng của trang (accent xanh lá + tím làm điểm nhấn tích lũy).
export default function ParetoChart({
  data,
  valueLabel = 'Số lượng',
  barColor = '#0d7a5c',
  height = 320,
  maxItems = 12,
  showShareLine = false,
  avgBenchmark = null,
  avgLabel = 'TB kỳ trước',
  onBarClick,
  totalOverride,
}: {
  data: ParetoItem[];
  valueLabel?: string;
  barColor?: string;
  height?: number;
  maxItems?: number;
  // Đường "Tỷ trọng đóng góp" (% mỗi cột / tổng, KHÔNG cộng dồn) — chỉ 2 biểu đồ Tổ/Chuyền và Phân
  // Xưởng bật, các biểu đồ Pareto khác chỉ có cột.
  showShareLine?: boolean;
  // Đường ngang phẳng = mức trung bình (cùng đơn vị với valueLabel) của kỳ liền trước — null thì ẩn.
  avgBenchmark?: number | null;
  avgLabel?: string;
  // Click vào 1 cột -> trang cha tự quyết định làm gì (vd mở modal chi tiết) — truyền nhãn cột (label)
  // đã click. Không truyền thì cột không có hiệu ứng/con trỏ click.
  onBarClick?: (label: string) => void;
  // Tổng dùng để tính % mỗi cột — mặc định tự cộng dồn CHÍNH các cột đang vẽ. Truyền riêng khi 1 phần
  // dữ liệu bị ẩn khỏi biểu đồ nhưng vẫn cần tính vào mẫu số % (vd ẩn cột "Khác" nhưng vẫn muốn % các
  // cột còn lại phản ánh đúng tỉ trọng thực so với TOÀN BỘ, không bị thổi phồng vì mẫu số hụt đi).
  totalOverride?: number;
}) {
  const [showValues, setShowValues] = useState(false);

  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, maxItems);
    const total = totalOverride ?? sorted.reduce((s, d) => s + d.value, 0);
    // Mục có giá trị > 0 nhưng quá nhỏ so với mục lớn nhất thì gần như không thấy cột đâu — cho
    // "nhú lên" tối thiểu ~2% chiều cao mục lớn nhất (chỉ áp dụng cho displayValue vẽ cột, KHÔNG đổi
    // giá trị thật dùng cho nhãn/tooltip).
    const maxValue = sorted.reduce((m, d) => Math.max(m, d.value), 0);
    const minVisible = maxValue * 0.02;
    return sorted.map((d) => ({
      ...d,
      displayValue: d.value > 0 && d.value < minVisible ? minVisible : d.value,
      // % đóng góp CỦA RIÊNG mục này trong tổng — không cộng dồn (khác đường tích luỹ cũ đã bỏ),
      // nên đường sẽ đi theo hình dạng gần giống cột, dễ đọc hơn.
      sharePct: total ? Math.round((d.value / total) * 1000) / 10 : 0,
    }));
  }, [data, maxItems, totalOverride]);

  // "Tập trung N mục đạt 80% tác động" — vẫn tính cộng dồn nội bộ để ra con số này, nhưng KHÔNG còn
  // vẽ thành đường trên biểu đồ (người dùng phản hồi đường tích luỹ khó đọc, khó hiểu).
  const focusCount = useMemo(() => {
    const total = totalOverride ?? chartData.reduce((s, d) => s + d.value, 0);
    if (!total) return chartData.length;
    let running = 0;
    for (let i = 0; i < chartData.length; i++) {
      running += chartData[i].value;
      if (running / total >= 0.8) return i + 1;
    }
    return chartData.length;
  }, [chartData, totalOverride]);

  if (data.length === 0) {
    return <div className="flex items-center justify-center text-xs text-gray-400" style={{ height }}>Chưa có dữ liệu</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
          <IconTarget size={13} /> Tập trung: {focusCount} mục (80% tác động)
        </span>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 cursor-pointer select-none">
          <input type="checkbox" checked={showValues} onChange={(e) => setShowValues(e.target.checked)} className="accent-emerald-600" />
          Hiển thị giá trị
        </label>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7ede9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#6b7c73' }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={70}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6b7c73' }} label={{ value: valueLabel, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6b7c73' }} />
          {showShareLine && (
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7c73' }} tickFormatter={(v) => `${v}%`} />
          )}
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e7ede9', fontSize: 11, boxShadow: '0 8px 24px rgba(12,31,25,0.12)' }}
            formatter={(value, name, entry: any) => {
              if (name === 'Tỷ trọng đóng góp (%)') return [`${value}%`, name];
              // Cột dùng "displayValue" (đã nhú lên tối thiểu) để vẽ — tooltip vẫn phải hiện đúng
              // giá trị THẬT (entry.payload.value), không phải giá trị đã nhú lên.
              return [entry?.payload?.value ?? value, name];
            }}
          />
          {/* Legend vẽ thủ công qua `content` (thay vì để recharts tự gom từ Bar/Line) để gộp luôn
              "TB kỳ trước" vào chung 1 hàng chú thích — ReferenceLine không tự sinh mục Legend, và
              trước đây nhãn của nó nổi ngay trên biểu đồ (đè lên đường), tách khỏi hàng chú thích. */}
          <Legend
            content={() => {
              const items: { value: string; dashed?: boolean; rect?: boolean; color: string }[] = [
                { value: valueLabel, rect: true, color: barColor },
                ...(showShareLine ? [{ value: 'Tỷ trọng đóng góp (%)', color: '#6366f1' }] : []),
                ...(avgBenchmark != null ? [{ value: avgLabel, dashed: true, color: '#f97316' }] : []),
              ];
              return (
                <ul className="flex flex-wrap justify-center gap-4 mt-2 text-[11px] font-semibold text-gray-500 list-none p-0">
                  {items.map((item) => (
                    <li key={item.value} className="flex items-center gap-1.5">
                      {item.rect ? (
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
                      ) : (
                        <svg width="16" height="10" className="shrink-0">
                          <line x1="0" y1="5" x2="16" y2="5" stroke={item.color} strokeWidth={2} strokeDasharray={item.dashed ? '4 3' : undefined} />
                        </svg>
                      )}
                      {item.value}
                    </li>
                  ))}
                </ul>
              );
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="displayValue"
            name={valueLabel}
            fill={barColor}
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
            cursor={onBarClick ? 'pointer' : undefined}
            onClick={onBarClick ? (d: any) => onBarClick(d.label) : undefined}
          >
            {/* Nhãn kèm luôn % tỷ trọng đóng góp (đã tính sẵn ở chartData.sharePct) — không chỉ số
                lượng thô, để nhìn cột là biết ngay chiếm bao nhiêu % tổng, khớp cách hiện % trong
                modal chi tiết "Khác". Dùng `content` thay vì `formatter` vì formatter chỉ nhận được
                đúng giá trị của dataKey, không có sharePct của cùng hàng. */}
            {showValues && (
              <LabelList
                dataKey="value"
                position="top"
                content={(props: any) => {
                  const { x, y, width, value, index } = props;
                  const pct = chartData[index]?.sharePct ?? 0;
                  return (
                    <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={10} fontWeight={700} fill="#4b5f56">
                      {value} ({pct}%)
                    </text>
                  );
                }}
              />
            )}
          </Bar>
          {/* Đường ngang phẳng = mức trung bình kỳ liền trước (tuần/tháng trước tuỳ bộ lọc đang chọn)
              — cùng trục với cột, dễ thấy cột hiện tại đang cao/thấp hơn trung bình cũ bao nhiêu. Nhãn
              tên đường chuyển xuống Legend chung (payload thủ công ở trên) thay vì nổi trên biểu đồ. */}
          {avgBenchmark != null && (
            <ReferenceLine yAxisId="left" y={avgBenchmark} stroke="#f97316" strokeWidth={2} strokeDasharray="6 4" />
          )}
          {/* Đường % tỷ trọng đóng góp CỦA RIÊNG từng cột trong tổng — thay cho đường tích luỹ cũ đã
              bỏ; chỉ bật ở 2 biểu đồ Tổ/Chuyền và Phân Xưởng. */}
          {showShareLine && (
            <Line yAxisId="right" type="monotone" dataKey="sharePct" name="Tỷ trọng đóng góp (%)" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
