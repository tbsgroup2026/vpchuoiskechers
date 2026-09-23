import React, { Suspense } from 'react';
import PphViewWorkshopClient from './PphViewWorkshopClient';

// Giống hệt pph-view/page.tsx (cấp Line) nhưng gộp CẢ 1 Xưởng (nhiều Line/Chuyền rời rạc thành 1
// màn TV) — ?areaId=... đọc ở CLIENT (site build static export, không biết trước danh sách Xưởng
// lúc build).
export default function PphViewWorkshopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="text-sm font-bold text-gray-400">Đang tải dữ liệu...</span>
        </div>
      }
    >
      <PphViewWorkshopClient />
    </Suspense>
  );
}
