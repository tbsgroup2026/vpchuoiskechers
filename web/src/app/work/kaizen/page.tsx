"use client";

import React, { Suspense } from "react";
import CIModule from "@/modules/ci/CIModule";

export default function KaizenDedicatedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-slate-500">Đang tải Thư viện Cải tiến...</div>}>
      <CIModule />
    </Suspense>
  );
}

