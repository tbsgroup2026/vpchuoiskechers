'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';

// Đường xu hướng nhỏ gọn trong 1 ô KPI (không trục, không lưới, không tooltip), có tô gradient mờ
// dần bên dưới đường (khớp đúng ảnh mẫu) — khác TrendChart/ParetoChart (biểu đồ đầy đủ) vốn không
// có bản mini để nhúng gọn trong card. Mỗi đơn vị dùng ĐÚNG màu riêng của mình cho cả đường lẫn
// vùng tô, chỉ khác độ đậm/nhạt (gradient) để không cần thêm màu mới.
export default function Sparkline({
  data,
  color,
  height = 36,
}: {
  data: { value: number }[];
  color: string;
  height?: number;
}) {
  if (data.length < 2) return <div style={{ height }} />;
  const gradientId = `spark-fill-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
