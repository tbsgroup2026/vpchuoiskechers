'use client';

import { usePathname } from 'next/navigation';
import MobileBottomNav from './MobileBottomNav';

// Trang quét QR "Hiệu Suất Nhà Máy" (/pph-scan) là màn hình ĐỘC LẬP, mở trực tiếp từ mã QR dán tại
// Chuyền/Tổ trên điện thoại công nhân (xem PphScanClient.tsx) — không phải 1 trang trong app điều
// hướng bình thường, không có lối "quay về trang chủ" nào. Vì vậy ẩn hẳn thanh điều hướng dưới (vốn
// hiện ở MỌI trang khác trên điện thoại, xem MobileBottomNav) để tránh gây hiểu lầm bấm được sang
// trang khác, đồng thời bỏ luôn khoảng đệm pb-16 dành chỗ cho thanh đó (không thì để lại khoảng
// trắng thừa dưới cùng màn hình).
function isStandaloneRoute(pathname: string | null): boolean {
  return !!pathname && pathname.startsWith('/pph-scan');
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = isStandaloneRoute(pathname);
  return (
    <>
      <div className={standalone ? undefined : 'pb-16 sm:pb-0'}>{children}</div>
      {!standalone && <MobileBottomNav />}
    </>
  );
}
