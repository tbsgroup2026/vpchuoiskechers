'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IconFlask } from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import Sparkline from '@/components/charts/Sparkline';

// Trang TEST — không đụng dữ liệu thật, chỉ dựng vài kiểu biểu đồ mẫu (dữ liệu giả lập, hình dạng
// giống thật) để so sánh xem cách nào dễ đọc hơn kiểu "6 đường chồng chéo" hiện tại của "Xu Hướng
// Theo Ngày" ở Tổng Quan (scope=ALL). Xoá trang này (+ dòng nav "Test Biểu Đồ" trong mmtbNav.ts)
// khi đã chốt được cách thay thế.
const UNITS = [
  { key: 'KG1', label: 'KG1', color: '#2563eb' },
  { key: 'KG2', label: 'KG2', color: '#7c3aed' },
  { key: 'KG3', label: 'KG3', color: '#d97706' },
  { key: 'HTD', label: 'HTĐ', color: '#0d9488' },
  { key: 'SKMD', label: 'SK MD', color: '#e11d48' },
  { key: 'VP2', label: 'VP2', color: '#9333ea' },
];

const DAYS = 30;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Mỗi đơn vị 1 đường xu hướng riêng (base khác nhau + trend tăng dần khác tốc độ + nhiễu ngẫu
// nhiên) — cố tình làm cho các đường dễ đè lên nhau ở giữa biểu đồ, giống hệt vấn đề dữ liệu thật.
function generateMockDaily() {
  return UNITS.map((u, idx) => {
    const rand = seededRandom(idx * 97 + 13);
    const base = 8 + idx * 2.2;
    const trendRate = 0.25 + idx * 0.12;
    const points = Array.from({ length: DAYS }, (_, d) => {
      const noise = (rand() - 0.5) * 3.5;
      const value = Math.max(2, Math.round((base + d * trendRate + noise) * 10) / 10);
      return { day: d + 1, value };
    });
    return { ...u, points };
  });
}

// Khung ghi chú "biểu đồ này đo số liệu gì" — đặt ngay dưới mỗi tiêu đề, cùng 1 khuôn cho dễ so
// sánh giữa các mẫu: đo gì / trục ngang / trục dọc (hoặc màu) / cách tính / phù hợp khi nào.
function ChartNote({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 mb-4 bg-slate-50 border border-slate-100 rounded-lg px-3.5 py-3">
      {items.map((it) => (
        <div key={it.label} className="flex gap-1.5 text-[11px] leading-relaxed">
          <dt className="font-bold text-slate-500 shrink-0">{it.label}:</dt>
          <dd className="text-slate-600">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ChartCard({
  index,
  title,
  note,
  children,
}: {
  index: number;
  title: string;
  note: { label: string; value: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">{index}. {title}</h2>
      <ChartNote items={note} />
      {children}
    </div>
  );
}

export default function ChartLabPage() {
  const dailyByUnit = useMemo(() => generateMockDaily(), []);

  // Dữ liệu dạng "1 hàng / 1 ngày, mỗi đơn vị 1 cột" — dùng cho biểu đồ đường gộp chung (mục 3).
  const combinedDaily = useMemo(() => {
    return Array.from({ length: DAYS }, (_, d) => {
      const row: Record<string, number | string> = { day: `Ngày ${d + 1}` };
      for (const u of dailyByUnit) row[u.key] = u.points[d].value;
      return row;
    });
  }, [dailyByUnit]);

  // Gộp 30 ngày thành 5 tuần (trung bình mỗi tuần) — dùng cho biểu đồ cột nhóm (mục 4).
  const weeklyByUnit = useMemo(() => {
    const weeks = Math.ceil(DAYS / 7);
    return Array.from({ length: weeks }, (_, w) => {
      const row: Record<string, number | string> = { week: `Tuần ${w + 1}` };
      for (const u of dailyByUnit) {
        const slice = u.points.slice(w * 7, w * 7 + 7);
        const avg = slice.reduce((s, p) => s + p.value, 0) / slice.length;
        row[u.key] = Math.round(avg * 10) / 10;
      }
      return row;
    });
  }, [dailyByUnit]);

  // Xếp hạng mỗi ngày (1 = xử lý nhanh nhất, 6 = chậm nhất) — dùng cho biểu đồ "bump chart" (mục 5).
  const rankDaily = useMemo(() => {
    return Array.from({ length: DAYS }, (_, d) => {
      const dayVals = dailyByUnit.map((u) => ({ key: u.key, value: u.points[d].value }));
      const sorted = [...dayVals].sort((a, b) => a.value - b.value);
      const row: Record<string, number | string> = { day: `Ngày ${d + 1}` };
      sorted.forEach((entry, idx) => { row[entry.key] = idx + 1; });
      return row;
    });
  }, [dailyByUnit]);

  // Đầu kỳ (TB 7 ngày đầu) so với cuối kỳ (TB 7 ngày cuối) — dùng cho slope chart (mục 6) và bảng
  // tóm tắt (mục 7).
  const startEndByUnit = useMemo(() => {
    return dailyByUnit.map((u) => {
      const first7 = u.points.slice(0, 7);
      const last7 = u.points.slice(-7);
      const start = Math.round((first7.reduce((s, p) => s + p.value, 0) / first7.length) * 10) / 10;
      const end = Math.round((last7.reduce((s, p) => s + p.value, 0) / last7.length) * 10) / 10;
      const avg = Math.round((u.points.reduce((s, p) => s + p.value, 0) / u.points.length) * 10) / 10;
      const pct = start ? Math.round(((end - start) / start) * 1000) / 10 : 0;
      return { ...u, start, end, avg, pct };
    });
  }, [dailyByUnit]);

  const slopeChartData = useMemo(
    () => [
      { period: 'Đầu kỳ (TB 7 ngày đầu)', ...Object.fromEntries(startEndByUnit.map((u) => [u.key, u.start])) },
      { period: 'Cuối kỳ (TB 7 ngày cuối)', ...Object.fromEntries(startEndByUnit.map((u) => [u.key, u.end])) },
    ],
    [startEndByUnit]
  );

  const globalMax = useMemo(() => Math.max(...dailyByUnit.flatMap((u) => u.points.map((p) => p.value))), [dailyByUnit]);
  const globalMin = useMemo(() => Math.min(...dailyByUnit.flatMap((u) => u.points.map((p) => p.value))), [dailyByUnit]);

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  function toggleKey(key: string) {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <MaintenanceShell title="Test Biểu Đồ" subtitle="So sánh vài cách thay thế cho biểu đồ Xu Hướng Theo Ngày (dữ liệu giả lập)">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <IconFlask size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Trang thử nghiệm — dữ liệu 6 đơn vị bên dưới là <b>giả lập</b> (30 ngày, đơn vị phút xử lý sự cố
            trung bình mỗi ngày), cố tình tạo dáng chồng chéo giống dữ liệu thật để dễ so sánh. Mỗi biểu đồ có
            ghi chú riêng bên dưới tiêu đề nói rõ đang đo số liệu gì, trục nào là gì, tính như thế nào. Xem xong
            cách nào dễ nhìn hơn thì báo lại, tôi sẽ áp dụng đúng cách đó vào biểu đồ thật rồi xoá trang này.
          </p>
        </div>

        {/* 1. Small multiples */}
        <ChartCard
          index={1}
          title="Lưới 6 Biểu Đồ Riêng (Small Multiples)"
          note={[
            { label: 'Đo gì', value: 'Thời gian xử lý sự cố trung bình mỗi ngày (phút) — cùng số liệu với biểu đồ gốc, chỉ đổi cách vẽ.' },
            { label: 'Trục ngang', value: 'Ngày trong kỳ (30 ngày), ẩn số cho gọn.' },
            { label: 'Trục dọc', value: 'Phút xử lý trung bình — MỖI Ô tự co giãn theo riêng đơn vị đó (không dùng chung 1 thang).' },
            { label: 'Cách tính', value: 'Trung bình cộng thời gian xử lý (MTTR) của các sự cố phát sinh trong ngày đó.' },
            { label: 'Phù hợp khi', value: 'Cần xem RIÊNG hình dạng xu hướng từng đơn vị, không cần so trực tiếp con số tuyệt đối giữa các đơn vị.' },
          ]}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {dailyByUnit.map((u) => (
              <div key={u.key} className="border border-slate-100 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: u.color }} />
                  <span className="text-[11px] font-bold text-slate-700">{u.label}</span>
                </div>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={u.points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <XAxis dataKey="day" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid #e7ede9', fontSize: 10 }}
                      labelFormatter={(d) => `Ngày ${d}`}
                    />
                    <Line type="monotone" dataKey="value" stroke={u.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* 2. Heatmap */}
        <ChartCard
          index={2}
          title="Nhiệt Đồ (Heatmap) Ngày × Đơn Vị"
          note={[
            { label: 'Đo gì', value: 'Cùng số liệu thời gian xử lý trung bình/ngày như mục 1, đổi từ đường sang màu.' },
            { label: 'Trục ngang', value: 'Ngày (1 → 30), mỗi cột là 1 ngày.' },
            { label: 'Trục dọc', value: 'Tên đơn vị (6 hàng).' },
            { label: 'Màu ô', value: 'Đậm = giá trị CAO hơn so với mức thấp/cao nhất toàn bảng; nhạt = giá trị thấp.' },
            { label: 'Phù hợp khi', value: 'Cần quét nhanh cả bảng để tìm ngày/đơn vị bất thường — điểm nóng nổi rõ bằng mắt, không cần đọc từng số.' },
          ]}
        >
          <div className="overflow-x-auto">
            <table className="border-collapse w-full min-w-[720px]">
              <tbody>
                {dailyByUnit.map((u) => (
                  <tr key={u.key}>
                    <td className="text-[10px] font-bold text-slate-600 pr-2 py-0.5 text-right whitespace-nowrap sticky left-0 bg-white">{u.label}</td>
                    {u.points.map((p) => {
                      const ratio = globalMax > globalMin ? (p.value - globalMin) / (globalMax - globalMin) : 0;
                      const bg = `rgba(220, 38, 38, ${0.12 + ratio * 0.78})`;
                      return (
                        <td key={p.day} className="p-0">
                          <div
                            title={`${u.label} · Ngày ${p.day}: ${p.value} phút`}
                            className="w-full aspect-square min-w-[18px]"
                            style={{ background: bg }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td />
                  {dailyByUnit[0].points.map((p) => (
                    <td key={p.day} className="text-center text-[8px] text-slate-400 pt-0.5">
                      {p.day % 5 === 0 ? p.day : ''}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </ChartCard>

        {/* 3. Interactive: legend toggle + hover highlight */}
        <ChartCard
          index={3}
          title="Vẫn 1 Biểu Đồ — Thêm Tương Tác"
          note={[
            { label: 'Đo gì', value: 'Y hệt biểu đồ "Xu Hướng Theo Ngày" hiện tại — không đổi số liệu, chỉ thêm cách tương tác.' },
            { label: 'Trục ngang', value: 'Ngày trong kỳ (30 ngày).' },
            { label: 'Trục dọc', value: 'Phút xử lý trung bình, DÙNG CHUNG 1 thang cho cả 6 đơn vị.' },
            { label: 'Cách tính', value: 'Trung bình cộng thời gian xử lý (MTTR) của các sự cố phát sinh trong ngày đó.' },
            { label: 'Phù hợp khi', value: 'Muốn giữ đúng kiểu biểu đồ đường quen thuộc, chỉ cần thêm cách ẩn bớt đường khi rối mắt.' },
          ]}
        >
          <p className="text-[11px] text-slate-400 mb-2">Bấm tên đơn vị ở chú thích để ẩn/hiện đường đó; rê chuột vào 1 tên thì làm nổi bật đường đó, mờ các đường còn lại.</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={combinedDaily} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7ede9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7c73' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7c73' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7ede9', fontSize: 11 }} />
              <Legend
                onClick={(e: any) => toggleKey(e.dataKey)}
                onMouseEnter={(e: any) => setHoveredKey(e.dataKey)}
                onMouseLeave={() => setHoveredKey(null)}
                wrapperStyle={{ fontSize: 11, cursor: 'pointer' }}
                formatter={(value, entry: any) => (
                  <span style={{ opacity: hiddenKeys.has(entry.dataKey) ? 0.35 : 1, textDecoration: hiddenKeys.has(entry.dataKey) ? 'line-through' : 'none' }}>
                    {value}
                  </span>
                )}
              />
              {UNITS.map((u) => (
                <Line
                  key={u.key}
                  type="monotone"
                  dataKey={u.key}
                  name={u.label}
                  stroke={u.color}
                  strokeWidth={hoveredKey === u.key ? 3 : 2}
                  strokeOpacity={hiddenKeys.has(u.key) ? 0 : hoveredKey && hoveredKey !== u.key ? 0.15 : 1}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Grouped bar per week */}
        <ChartCard
          index={4}
          title="Cột Nhóm Theo Tuần (Gộp Bớt Số Điểm)"
          note={[
            { label: 'Đo gì', value: 'Thời gian xử lý trung bình, GỘP theo tuần thay vì theo từng ngày.' },
            { label: 'Trục ngang', value: 'Tuần (~5 cụm cho 30 ngày), mỗi cụm gồm 6 cột màu = 6 đơn vị.' },
            { label: 'Trục dọc', value: 'Phút xử lý trung bình.' },
            { label: 'Cách tính', value: 'Trung bình cộng 7 giá trị/ngày trong tuần đó, tính riêng theo từng đơn vị.' },
            { label: 'Phù hợp khi', value: 'Chấp nhận mất chi tiết theo ngày, đổi lấy việc dễ so sánh tổng thể — số cụm ít hơn hẳn 30 điểm/đường.' },
          ]}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyByUnit} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7ede9" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6b7c73' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7c73' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7ede9', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {UNITS.map((u) => (
                <Bar key={u.key} dataKey={u.key} name={u.label} fill={u.color} radius={[4, 4, 0, 0]} maxBarSize={20} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. Bump chart (xếp hạng) */}
        <ChartCard
          index={5}
          title="Biểu Đồ Xếp Hạng Theo Ngày (Bump Chart)"
          note={[
            { label: 'Đo gì', value: 'KHÔNG phải giá trị phút tuyệt đối — mà là THỨ HẠNG mỗi ngày (1 = xử lý nhanh nhất, 6 = chậm nhất).' },
            { label: 'Trục ngang', value: 'Ngày trong kỳ (30 ngày).' },
            { label: 'Trục dọc', value: 'Hạng 1 → 6 (đảo ngược: hạng 1 nằm trên cùng).' },
            { label: 'Cách tính', value: 'Mỗi ngày, sắp 6 đơn vị theo phút xử lý tăng dần rồi gán hạng 1–6 (thấp nhất = hạng 1).' },
            { label: 'Phù hợp khi', value: 'Chỉ quan tâm ai đang DẪN ĐẦU/TỤT HẠNG qua thời gian, không cần biết chênh lệch tuyệt đối bao nhiêu phút.' },
          ]}
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={rankDaily} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7ede9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7c73' }} interval={4} />
              <YAxis type="number" domain={[1, 6]} ticks={[1, 2, 3, 4, 5, 6]} reversed tick={{ fontSize: 10, fill: '#6b7c73' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7ede9', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {UNITS.map((u) => (
                <Line key={u.key} type="monotone" dataKey={u.key} name={u.label} stroke={u.color} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6. Slope chart */}
        <ChartCard
          index={6}
          title="Slope Chart — Đầu Kỳ So Với Cuối Kỳ"
          note={[
            { label: 'Đo gì', value: 'Thời gian xử lý trung bình, CHỈ so sánh 2 mốc: đầu kỳ và cuối kỳ (bỏ qua chi tiết giữa kỳ).' },
            { label: 'Trục ngang', value: '2 mốc duy nhất: "Đầu kỳ" (TB 7 ngày đầu) và "Cuối kỳ" (TB 7 ngày cuối).' },
            { label: 'Trục dọc', value: 'Phút xử lý trung bình.' },
            { label: 'Cách tính', value: 'Trung bình cộng 7 ngày đầu kỳ so với trung bình cộng 7 ngày cuối kỳ, theo từng đơn vị.' },
            { label: 'Phù hợp khi', value: 'Chỉ cần biết đơn vị nào cải thiện/xấu đi rõ rệt sau cả kỳ — đường dốc lên = xấu đi, dốc xuống = cải thiện.' },
          ]}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={slopeChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7ede9" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6b7c73' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7c73' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7ede9', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {UNITS.map((u) => (
                <Line key={u.key} type="linear" dataKey={u.key} name={u.label} stroke={u.color} strokeWidth={2.5} dot={{ r: 5 }} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 7. Sparkline table */}
        <ChartCard
          index={7}
          title="Bảng Tóm Tắt + Sparkline Mini"
          note={[
            { label: 'Đo gì', value: 'Bảng số liệu tóm tắt cả kỳ cho từng đơn vị, kèm 1 đường xu hướng thu nhỏ.' },
            { label: 'Cột "Đầu kỳ/Cuối kỳ"', value: 'Trung bình 7 ngày đầu / 7 ngày cuối (giống mục 6).' },
            { label: 'Cột "TB Cả Kỳ"', value: 'Trung bình cộng toàn bộ 30 ngày.' },
            { label: 'Cột "% Thay Đổi"', value: '(Cuối kỳ − Đầu kỳ) / Đầu kỳ × 100 — dương = xấu đi (xử lý lâu hơn), âm = cải thiện.' },
            { label: 'Phù hợp khi', value: 'Cần đọc số chính xác dạng bảng (sắp xếp/so sánh dễ), vẫn muốn thấy hình dạng xu hướng qua sparkline.' },
          ]}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-2 pr-3">Đơn vị</th>
                  <th className="py-2 px-3 text-right">Đầu kỳ</th>
                  <th className="py-2 px-3 text-right">Cuối kỳ</th>
                  <th className="py-2 px-3 text-right">TB Cả Kỳ</th>
                  <th className="py-2 px-3 text-right">% Thay Đổi</th>
                  <th className="py-2 pl-3 w-32">Xu Hướng</th>
                </tr>
              </thead>
              <tbody>
                {startEndByUnit.map((u) => (
                  <tr key={u.key} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: u.color }} /> {u.label}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">{u.start} phút</td>
                    <td className="py-2 px-3 text-right text-slate-600">{u.end} phút</td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-700">{u.avg} phút</td>
                    <td className={`py-2 px-3 text-right font-bold ${u.pct > 0 ? 'text-rose-600' : u.pct < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {u.pct > 0 ? '+' : ''}{u.pct}%
                    </td>
                    <td className="py-2 pl-3">
                      <Sparkline data={u.points} color={u.color} height={28} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </MaintenanceShell>
  );
}
