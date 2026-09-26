'use client';

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type UnitBarItem = { label: string; value: number; color: string };

// Biểu đồ cột đơn giản — MỖI đơn vị 1 màu cột riêng (khớp màu đang dùng ở card/xếp hạng/bảng),
// KHÔNG có đường tích luỹ % (khác ParetoChart dùng cho các trang khác) — biểu đồ này chỉ để xem
// nhanh số sự cố từng đơn vị, không phải phân tích Pareto 80/20.
export default function UnitBarChart({ data, valueLabel = 'Số sự cố', height = 260 }: { data: UnitBarItem[]; valueLabel?: string; height?: number }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center text-xs text-gray-400" style={{ height }}>Chưa có dữ liệu</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      {/* margin.top chừa chỗ cho số hiện trên đỉnh cột (LabelList) — cột cao nhất chạm sát mép trên
          sẽ bị che số nếu không chừa đủ khoảng trống này. */}
      <BarChart data={data} margin={{ top: 26, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7ede9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7c73' }} />
        <YAxis tick={{ fontSize: 10, fill: '#6b7c73' }} label={{ value: valueLabel, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6b7c73' }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7ede9', fontSize: 11, boxShadow: '0 8px 24px rgba(12,31,25,0.12)' }} />
        <Bar dataKey="value" name={valueLabel} radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
          <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
