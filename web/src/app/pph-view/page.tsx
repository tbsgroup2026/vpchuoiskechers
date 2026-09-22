import React, { Suspense } from 'react';
import PphViewClient from './PphViewClient';

// Static export (output:'export') KHÔNG hỗ trợ route động [lineId] mà không biết trước danh sách
// giá trị lúc build (Line có thể thêm mới bất kỳ lúc nào sau khi deploy) — dùng query string
// (?lineId=...) đọc ở CLIENT thay vì path segment, đúng khuôn /pph-scan?team=... đã có.
// useSearchParams() bắt buộc nằm trong Suspense boundary (Next.js yêu cầu với static export).
export default function PphViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="text-sm font-bold text-gray-400">Đang tải dữ liệu...</span>
        </div>
      }
    >
      <PphViewClient />
    </Suspense>
  );
}
