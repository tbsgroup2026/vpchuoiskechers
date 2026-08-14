"use client";

import { useEffect, useState } from "react";
import { IconLoader2, IconCheck, IconX, IconPlaneDeparture, IconCalendarEvent } from "@tabler/icons-react";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Chờ duyệt", className: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Đã duyệt", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Từ chối", className: "bg-red-50 text-red-700 border-red-200" },
};

interface TripRow {
  id: number;
  don_vi_xuat: string;
  nguoi_tao: string;
  created_by_name: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string | null;
  muc_dich: string;
  status: string;
}

interface BookingRow {
  id: number;
  ho_ten: string;
  bo_phan: string;
  ngay_hop: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  status: string;
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState<"trips" | "bookings">("trips");
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [tripsRes, bookingsRes] = await Promise.all([
      fetch("/api/business-trips").then((r) => r.json()),
      fetch("/api/meeting-bookings").then((r) => r.json()),
    ]);
    setTrips(tripsRes.items || []);
    setBookings(bookingsRes.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(kind: "trips" | "bookings", id: number, action: "APPROVE" | "REJECT") {
    const endpoint = kind === "trips" ? `/api/business-trips/${id}` : `/api/meeting-bookings/${id}`;
    let rejectReason: string | undefined;
    if (action === "REJECT") {
      rejectReason = prompt("Lý do từ chối (không bắt buộc):") || undefined;
    }
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectReason }),
    });
    load();
  }

  const pendingTrips = trips.filter((t) => t.status === "PENDING").length;
  const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-tbs-dark">Duyệt đơn</h1>
        <p className="text-xs text-gray-500 mt-1">Duyệt/từ chối đơn đăng ký đi công tác &amp; đặt phòng họp</p>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("trips")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
            tab === "trips" ? "border-accent text-accent" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <IconPlaneDeparture size={15} /> Đi công tác
          {pendingTrips > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px]">{pendingTrips}</span>}
        </button>
        <button
          onClick={() => setTab("bookings")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
            tab === "bookings" ? "border-accent text-accent" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <IconCalendarEvent size={15} /> Phòng họp
          {pendingBookings > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px]">{pendingBookings}</span>}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <IconLoader2 size={22} className="animate-spin" />
        </div>
      ) : tab === "trips" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#eef7f2] font-semibold text-tbs-dark uppercase border-b border-emerald-100">
                <th className="p-4">Đơn vị xuất</th>
                <th className="p-4">Người tạo</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4">Mục đích</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {trips.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Chưa có đơn nào</td></tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80">
                    <td className="p-4 font-bold text-tbs-dark">{t.don_vi_xuat}</td>
                    <td className="p-4">{t.created_by_name}</td>
                    <td className="p-4">{t.ngay_bat_dau}{t.ngay_ket_thuc ? ` → ${t.ngay_ket_thuc}` : ""}</td>
                    <td className="p-4 max-w-xs truncate">{t.muc_dich}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${STATUS_LABEL[t.status]?.className}`}>
                        {STATUS_LABEL[t.status]?.label}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {t.status === "PENDING" && (
                        <>
                          <button onClick={() => handleAction("trips", t.id, "APPROVE")} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 inline-flex"><IconCheck size={14} /></button>
                          <button onClick={() => handleAction("trips", t.id, "REJECT")} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 inline-flex"><IconX size={14} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#eef7f2] font-semibold text-tbs-dark uppercase border-b border-emerald-100">
                <th className="p-4">Người đặt</th>
                <th className="p-4">Bộ phận</th>
                <th className="p-4">Ngày họp</th>
                <th className="p-4">Khung giờ</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {bookings.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Chưa có đơn nào</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80">
                    <td className="p-4 font-bold text-tbs-dark">{b.ho_ten}</td>
                    <td className="p-4">{b.bo_phan}</td>
                    <td className="p-4">{b.ngay_hop}</td>
                    <td className="p-4">{b.gio_bat_dau} - {b.gio_ket_thuc}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${STATUS_LABEL[b.status]?.className}`}>
                        {STATUS_LABEL[b.status]?.label}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {b.status === "PENDING" && (
                        <>
                          <button onClick={() => handleAction("bookings", b.id, "APPROVE")} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 inline-flex"><IconCheck size={14} /></button>
                          <button onClick={() => handleAction("bookings", b.id, "REJECT")} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 inline-flex"><IconX size={14} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
