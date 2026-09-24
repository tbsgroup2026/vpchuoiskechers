'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type ComparisonSeries = { key: string; label: string; color: string };

// Biểu đồ đường so sánh NHIỀU đơn vị cùng lúc (1 trục Y, mỗi đơn vị 1 đường) — khác TrendChart
// (1 đơn vị, 2 trục) nên viết riêng. `data` mỗi phần tử là 1 điểm trên trục X (VD 1 ngày), có field
// tương ứng đúng `series[].key`. Đổi chỉ số đang xem (VD Thời gian xử lý / Tổng số sự cố) do trang
// gọi component tự chọn `data`/`valueLabel` phù hợp, component chỉ lo vẽ.
export default function MultiLineComparisonChart({
  data,
  series,
  valueLabel,
  height = 300,
}: {
  data: Record<string, number | string>[];
  series: ComparisonSeries[];
  valueLabel: string;
  height?: number;
}) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center text-xs text-gray-400" style={{ height }}>Chưa có dữ liệu trong khoảng thời gian này</div>;
  }
  // Trục X mỗi điểm là 1 ngày ("MM-DD") — CHỈ hiện vạch chia + nhãn ở ngày 1 và các ngày chia hết
  // cho 5 (1, 5, 10, 15, 20, 25, 30...), bỏ hẳn vạch chia của các ngày còn lại (không chỉ ẩn chữ)
  // — dùng `ticks` (danh sách giá trị cụ thể) thay vì `interval` + tickFormatter rỗng, vì
  // interval={0} vẫn tự vẽ vạch chia cho MỌI điểm dù nhãn để trống.
  const isSparseDay = (value: string) => {
    const day = parseInt(value.split('-')[1] || '0', 10);
    return day === 1 || day % 5 === 0;
  };
  const sparseTicks = data.map((d) => String(d.label)).filter(isSparseDay);
  // Chấm tròn trên đường — CHỈ hiện ở đúng các ngày trên trục X (1/5/10/15/20/25/30), các ngày còn
  // lại không vẽ chấm (vẫn có đường nối liền bình thường).
  const renderDot = (color: string) => (props: any) => {
    const label = props?.payload?.label as string | undefined;
    if (!label || !isSparseDay(label)) return <g key={`dot-${color}-${props.index}`} />;
    return <circle key={`dot-${color}-${props.index}`} cx={props.cx} cy={props.cy} r={3} fill={color} stroke="#fff" strokeWidth={1} />;
  };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7ede9" vertical={false} />
        <XAxis dataKey="label" ticks={sparseTicks} tick={{ fontSize: 11, fill: '#6b7c73' }} />
        <YAxis tick={{ fontSize: 10, fill: '#6b7c73' }} label={{ value: valueLabel, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6b7c73' }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7ede9', fontSize: 11, boxShadow: '0 8px 24px rgba(12,31,25,0.12)' }} />
        <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 12 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={renderDot(s.color)} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
