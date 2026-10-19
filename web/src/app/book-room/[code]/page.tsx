import React, { Suspense } from "react";
import BookRoomClient from "../BookRoomClient";

export function generateStaticParams() {
  return [
    { code: "ph-01" },
    { code: "ph-02" },
    { code: "ph-03" },
    { code: "ph-1" },
    { code: "ph-2" },
    { code: "ph-3" },
    { code: "xgncubcm" },
    { code: "XGNCUBCM" },
    { code: "room_1792201677354" },
    { code: "room_1790992305279" },
    { code: "room_6" },
    { code: "room_4" },
    { code: "room_1" },
    { code: "room_2" },
    { code: "room_3" },
  ];
}

export default function BookRoomDirectSubPage({ params }: { params: { code: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-500">Đang tải phòng họp...</div>}>
      <BookRoomClient initialCode={params?.code} />
    </Suspense>
  );
}
