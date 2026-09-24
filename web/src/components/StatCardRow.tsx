'use client';

// Hàng ô thống kê đầu trang dùng chung cho mọi trang trong /maintenance — kiểu "viên thuốc" (nền
// màu nhạt, icon tròn, chữ/số to) khớp đúng phong cách trang thật ổn định bên thkiengiangshoes,
// phóng to hơn cho dễ nhìn. Truyền onClick cho 1 ô -> ô đó thành nút bấm được (lọc bảng bên dưới),
// không truyền thì hiện như ô thông tin thuần (không bấm được) — dùng cho các chỉ số KPI thuần
// (VD MTTA/MTTR/MTTD ở trang Tổng Quan, không có khái niệm "lọc theo chỉ số này").
export type StatCardItem = {
  key: string;
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
  iconBg: string;
  text: string;
  ring?: string;
  active?: boolean;
  onClick?: () => void;
};

export default function StatCardRow({ items }: { items: StatCardItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((c) => {
        const clickable = !!c.onClick;
        const Comp = clickable ? 'button' : 'div';
        return (
          <Comp
            key={c.key}
            type={clickable ? 'button' : undefined}
            onClick={c.onClick}
            className={`flex items-center gap-3.5 rounded-2xl ${c.bg} p-4 sm:p-5 text-left shadow-sm transition ${
              clickable ? `cursor-pointer hover:ring-2 ${c.ring || 'ring-slate-300'}` : ''
            } ${c.active ? `ring-2 ${c.ring || 'ring-slate-300'}` : ''}`}
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${c.iconBg}`}>
              <c.icon size={26} className={c.text} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-3xl font-extrabold text-tbs-dark tracking-tight">{c.value}</div>
              <div className="truncate text-sm font-bold text-gray-600 mt-0.5">{c.label}</div>
              {c.sub && <div className="truncate text-[11px] font-semibold text-gray-400 mt-0.5">{c.sub}</div>}
            </div>
          </Comp>
        );
      })}
    </div>
  );
}
