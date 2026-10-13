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
  // Trục X mỗi điểm là 1 ngày ("MM-DD") — số nhãn/vạch chia hiện ra LUÔN tự co giãn theo SỐ ĐIỂM
  // thực tế của kỳ đang xem (không dựa vào ngày trong tháng nữa) — kỳ ngắn (vd lọc theo tuần = 7
  // điểm) hiện đủ từng ngày, kỳ dài (vd lọc theo tháng = ~30 điểm) mới giãn thưa ra, luôn tối đa ~7
  // nhãn cho đỡ chật. Trước đây cố định "chỉ ngày chia hết cho 5" nên lọc theo tuần chỉ trúng đúng 1
  // ngày, gần như trống cả trục X. Dùng `ticks` (danh sách giá trị cụ thể) thay vì `interval`, vì
  // interval={0} vẫn tự vẽ vạch chia cho MỌI điểm dù nhãn để trống.
  // Trục Y tự co giãn theo khoảng giá trị THẬT của dữ liệu (không cố định bắt đầu từ 0) — nếu không,
  // các đường có giá trị gần nhau nhưng ở mức cao (VD Availability toàn 80-98%) sẽ bị dồn hết lên
  // sát đỉnh biểu đồ, nhìn dính chùm vào nhau rất khó phân biệt. Khi giá trị thật gần 0 (VD số sự
  // cố/downtime có thể = 0) vẫn giữ nguyên mốc 0 ở đáy, không phóng to sai lệch.
  const allValues = data.flatMap((d) => series.map((s) => Number(d[s.key])).filter((v) => !Number.isNaN(v)));
  const minVal = allValues.length ? Math.min(...allValues) : 0;
  const maxVal = allValues.length ? Math.max(...allValues) : 100;
  const valueRange = maxVal - minVal || Math.max(1, maxVal * 0.1);
  const yDomain: [number, number] = [minVal <= 0 ? 0 : Math.max(0, Math.floor(minVal - valueRange * 0.15)), Math.ceil(maxVal + valueRange * 0.15)];
  const tickEvery = Math.max(1, Math.ceil(data.length / 7));
  const isSparseIndex = (index: number) => index % tickEvery === 0 || index === data.length - 1;
  const sparseTicks = data.filter((_, i) => isSparseIndex(i)).map((d) => String(d.label));
  // Chấm tròn trên đường — CHỈ hiện đúng ở các điểm có nhãn trên trục X, các điểm còn lại không vẽ
  // chấm (vẫn có đường nối liền bình thường).
  const renderDot = (color: string) => (props: any) => {
    if (!isSparseIndex(props.index)) return <g key={`dot-${color}-${props.index}`} />;
    return <circle key={`dot-${color}-${props.index}`} cx={props.cx} cy={props.cy} r={3} fill={color} stroke="#fff" strokeWidth={1} />;
  };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7ede9" vertical={false} />
        <XAxis dataKey="label" ticks={sparseTicks} tick={{ fontSize: 11, fill: '#6b7c73' }} />
        <YAxis domain={yDomain} tick={{ fontSize: 10, fill: '#6b7c73' }} label={{ value: valueLabel, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6b7c73' }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7ede9', fontSize: 11, boxShadow: '0 8px 24px rgba(12,31,25,0.12)' }} />
        <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 12 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={renderDot(s.color)} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
