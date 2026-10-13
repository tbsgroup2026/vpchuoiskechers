'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export type UnitDonutItem = { label: string; value: number; color: string };

// Donut chia phần theo TỪNG ĐƠN VỊ (khác DonutChart trong kpi/page.tsx — cái đó chia %/100-% cho 1
// chỉ số duy nhất của 1 đơn vị) — dùng để so 6 nhà máy đóng góp bao nhiêu vào tổng, giữa hiện số
// trung bình chung ở tâm.
export default function UnitDonutChart({
  data,
  centerValue,
  centerLabel,
  size = 150,
}: {
  data: UnitDonutItem[];
  centerValue: string;
  centerLabel: string;
  size?: number;
}) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center text-xs text-gray-400" style={{ height: size }}>Chưa có dữ liệu</div>;
  }
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={size * 0.32} outerRadius={size * 0.48} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-3 text-center">
        <span className="text-lg font-extrabold text-slate-900">{centerValue}</span>
        <span className="text-[9px] text-slate-400 font-bold uppercase leading-tight">{centerLabel}</span>
      </div>
    </div>
  );
}
