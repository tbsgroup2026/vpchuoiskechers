import React, { Suspense } from "react";
import KaizenPublicPortal from "@/modules/ci/KaizenPublicPortal";

export const metadata = {
  title: "Sáng Kiến Kaizen – Tra Cứu & Đăng Ký | TBS Skechers",
  description: "Tra cứu tình trạng và đăng ký sáng kiến cải tiến Kaizen dành cho công nhân (Không cần đăng nhập)",
};

export default function KaizenPublicRegisterPage() {
  return (
    <Suspense fallback={null}>
      <KaizenPublicPortal />
    </Suspense>
  );
}
