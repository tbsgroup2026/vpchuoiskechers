import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lưu ý: đã gỡ `output: 'export'`. Trang này giờ cần server/API routes
  // động (D1, xác thực, duyệt đơn...) nên không thể xuất tĩnh nữa — khi
  // deploy lên Cloudflare Workers sẽ cần OpenNext (SSR) thay vì
  // `wrangler deploy` với thư mục "out" tĩnh như trước.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
