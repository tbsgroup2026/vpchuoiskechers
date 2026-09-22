import React, { Suspense } from 'react';
import PphViewFactoryClient from './PphViewFactoryClient';

// Giống hệt pph-view/page.tsx (cấp Line) nhưng cho CẢ 1 Nhà máy — ?factoryId=... đọc ở CLIENT
// (site build static export, không biết trước danh sách Nhà máy lúc build).
export default function PphViewFactoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="text-sm font-bold text-gray-400">Đang tải dữ liệu...</span>
        </div>
      }
    >
      <PphViewFactoryClient />
    </Suspense>
  );
}
