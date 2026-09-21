import React, { Suspense } from "react";
import CIModule from "@/modules/ci/CIModule";

export function generateStaticParams() {
  return [
    { unitSlug: "van-phong-chuoi" },
    { unitSlug: "phong-ban-thkg" },
    { unitSlug: "nha-may-mien-dong" },
    { unitSlug: "kien-giang-1" },
    { unitSlug: "kien-giang-2" },
    { unitSlug: "kien-giang-3" },
    { unitSlug: "hoan-thien-de" },
  ];
}

export default function KaizenUnitSubPage({ params }: { params: { unitSlug: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-slate-500">Đang tải đơn vị sản xuất...</div>}>
      <CIModule initialUnitSlug={params?.unitSlug} />
    </Suspense>
  );
}
