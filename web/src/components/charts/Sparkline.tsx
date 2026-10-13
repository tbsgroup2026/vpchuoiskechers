'use client';

import { Area, ComposedChart, Line, ResponsiveContainer } from 'recharts';

// Đường xu hướng nhỏ gọn trong 1 ô KPI (không trục, không lưới, không tooltip), có tô gradient mờ
// dần bên dưới đường (khớp đúng ảnh mẫu) — khác TrendChart/ParetoChart (biểu đồ đầy đủ) vốn không
// có bản mini để nhúng gọn trong card. Mỗi đơn vị dùng ĐÚNG màu riêng của mình cho cả đường lẫn
// vùng tô, chỉ khác độ đậm/nhạt (gradient) để không cần thêm màu mới.
export default function Sparkline({
  data,
  color,
  height = 36,
  prevData,
}: {
  data: { value: number }[];
  color: string;
  height?: number;
  // Xu hướng kỳ liền trước — CÙNG SỐ ĐIỂM với `data`, vẽ thành 1 đường xám nét đứt riêng (lên xuống
  // theo đúng dữ liệu thật của kỳ trước, không phải 1 đường ngang phẳng) để so trực tiếp từng điểm.
  // Không truyền thì bỏ qua, không đổi cách vẽ hiện có.
  prevData?: { value: number }[] | null;
}) {
  if (data.length < 2) return <div style={{ height }} />;
  const gradientId = `spark-fill-${color.replace('#', '')}`;
  const hasPrev = !!prevData && prevData.length === data.length;
  const chartData = hasPrev ? data.map((d, i) => ({ value: d.value, prevValue: prevData![i].value })) : data;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {hasPrev && <Line type="monotone" dataKey="prevValue" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
