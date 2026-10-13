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
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  bg: string;
  iconBg: string;
  text: string;
  ring?: string;
  active?: boolean;
  onClick?: () => void;
};

// `compact` — bản NHỎ dùng trong khung hẹp (VD modal chi tiết máy/danh mục lỗi, không rộng bằng
// đầu trang) — icon/số/chữ đều thu nhỏ lại để không bị tràn/cắt chữ như bản mặc định (thiết kế cho
// hàng ngang full-width ở đầu trang Tổng Quan).
export default function StatCardRow({ items, compact = false }: { items: StatCardItem[]; compact?: boolean }) {
  // Bản mặc định escalate lên tới 5 cột ở màn hình rộng (lg:) — đúng cho hàng full-width đầu trang.
  // Nhưng trong modal (khung CỐ ĐỊNH hẹp, vd max-w-3xl), lg: vẫn dựa theo VIEWPORT chứ không theo
  // bề rộng modal, nên máy tính màn hình rộng vẫn ép 5 cột vào khung hẹp -> tràn/cắt chữ. `compact`
  // vì vậy LUÔN dừng ở 3 cột (5 ô -> 3 trên + 2 dưới), không escalate theo viewport nữa.
  return (
    <div className={`grid ${compact ? 'grid-cols-3 gap-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'}`}>
      {items.map((c) => {
        const clickable = !!c.onClick;
        const Comp = clickable ? 'button' : 'div';
        return (
          <Comp
            key={c.key}
            type={clickable ? 'button' : undefined}
            onClick={c.onClick}
            className={`flex items-center ${compact ? 'gap-2 p-2.5' : 'gap-3.5 p-4 sm:p-5'} rounded-2xl ${c.bg} text-left shadow-sm transition ${
              clickable ? `cursor-pointer hover:ring-2 ${c.ring || 'ring-slate-300'}` : ''
            } ${c.active ? `ring-2 ${c.ring || 'ring-slate-300'}` : ''}`}
          >
            <div className={`flex ${compact ? 'h-9 w-9' : 'h-14 w-14'} shrink-0 items-center justify-center rounded-full ${c.iconBg}`}>
              <c.icon size={compact ? 16 : 26} className={c.text} />
            </div>
            <div className="min-w-0">
              <div className={`truncate ${compact ? 'text-base' : 'text-3xl'} font-extrabold text-tbs-dark tracking-tight`}>{c.value}</div>
              <div className={`truncate ${compact ? 'text-[11px]' : 'text-sm'} font-bold text-gray-600 mt-0.5`}>{c.label}</div>
              {c.sub && <div className={`truncate ${compact ? 'text-[9px]' : 'text-[11px]'} font-semibold text-gray-400 mt-0.5`}>{c.sub}</div>}
            </div>
          </Comp>
        );
      })}
    </div>
  );
}
