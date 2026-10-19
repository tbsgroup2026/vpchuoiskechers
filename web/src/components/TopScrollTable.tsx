'use client';

import { useEffect, useRef, useState } from 'react';

// Bảng nhiều cột (VD Nhu Cầu Sửa Chữa) cuộn ngang được, nhưng thanh cuộn mặc định của trình duyệt
// nằm ở MÉP DƯỚI CÙNG bảng — với bảng dài (nhiều dòng) phải cuộn hết xuống đáy mới thấy được thanh
// đó, không tiện. Component này thêm 1 thanh cuộn NGANG mỏng đặt NGAY TRÊN bảng, đồng bộ 2 chiều
// với thanh cuộn thật của bảng bên dưới — kéo thanh trên cũng cuộn được bảng, không cần cuộn xuống
// đáy trước.
export default function TopScrollTable({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  // Chặn vòng lặp vô hạn (cuộn thanh trên -> set scrollLeft bảng -> bắn event scroll của bảng ->
  // set lại scrollLeft thanh trên -> ...) — chỉ đồng bộ chiều NGƯỢC LẠI với thao tác vừa xảy ra.
  const syncingRef = useRef<'top' | 'bottom' | null>(null);

  useEffect(() => {
    function measure() {
      if (bottomRef.current) setContentWidth(bottomRef.current.scrollWidth);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (bottomRef.current) ro.observe(bottomRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [children]);

  function onTopScroll() {
    if (syncingRef.current === 'bottom') return;
    syncingRef.current = 'top';
    if (topRef.current && bottomRef.current) bottomRef.current.scrollLeft = topRef.current.scrollLeft;
    syncingRef.current = null;
  }
  function onBottomScroll() {
    if (syncingRef.current === 'top') return;
    syncingRef.current = 'bottom';
    if (topRef.current && bottomRef.current) topRef.current.scrollLeft = bottomRef.current.scrollLeft;
    syncingRef.current = null;
  }

  return (
    <div className={className}>
      <div ref={topRef} onScroll={onTopScroll} className="overflow-x-auto overflow-y-hidden border-b border-gray-100 bg-gray-50/60" style={{ height: 14 }}>
        <div style={{ width: contentWidth, height: 1 }} />
      </div>
      <div ref={bottomRef} onScroll={onBottomScroll} className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
