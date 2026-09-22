import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PphScanClient from './PphScanClient';

// Manifest RIÊNG (khác /manifest.json chung của cả site, start_url="/work") — để khi "Thêm vào Màn
// hình chính"/"Cài đặt ứng dụng" ngay tại trang này, icon tạo ra mở THẲNG /pph-scan (rồi tự nhớ Tổ
// qua localStorage, xem PphScanClient.tsx), KHÔNG bị Android đưa về /work theo manifest chung.
// title/appleWebApp.title riêng để icon trên Màn hình chính (đặc biệt iOS, ưu tiên các field này
// hơn manifest) ghi rõ "Nhập PPH" thay vì tên đầy đủ site dài dòng ở layout gốc.
export const metadata: Metadata = {
  title: 'Nhập PPH',
  manifest: '/manifest-pph-scan.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nhập PPH',
  },
};

export default function PphScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f4f7f5]">
          <div className="w-8 h-8 rounded-full border-4 border-[#006838] border-t-transparent animate-spin" />
        </div>
      }
    >
      <PphScanClient />
    </Suspense>
  );
}
