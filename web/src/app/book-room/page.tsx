import React, { Suspense } from "react";
import BookRoomClient from "./BookRoomClient";

export default function PublicBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-500">Đang tải...</div>}>
      <BookRoomClient />
    </Suspense>
  );
}
