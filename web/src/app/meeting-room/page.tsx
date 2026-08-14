"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Lightbox from "@/components/Lightbox";
import { useDirectory } from "@/lib/useDirectory";
import {
  IconLoader2,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconArrowRight,
  IconArrowLeft,
  IconAlertTriangle,
} from "@tabler/icons-react";

const MEETING_FORMATS = ["Trực tiếp", "Trực tuyến", "Kết hợp (Hybrid)"];
const HEADER_IMAGE = "/images/KGLV/CĐTT 2 LỐI VÀO.png";

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}
const SLOTS = buildSlots();

const STATUS_LABEL: Record<string, { label: string; className: string; icon: typeof IconClock }> = {
  PENDING: { label: "Chờ duyệt", className: "bg-amber-50 text-amber-700 border-amber-200", icon: IconClock },
  APPROVED: { label: "Đã duyệt", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: IconCircleCheck },
  REJECTED: { label: "Từ chối", className: "bg-red-50 text-red-700 border-red-200", icon: IconCircleX },
};

export default function MeetingRoomPage() {
  const [tab, setTab] = useState<"book" | "view">("book");
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => data.user && setUser(data.user))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 font-sans text-slate-900">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-[900px] mx-auto w-full space-y-6">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative w-full h-36 sm:h-44 rounded-3xl overflow-hidden cursor-zoom-in shadow-sm"
        >
          <img
            src={encodeURI(HEADER_IMAGE)}
            alt="Quản lý phòng họp"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08221a]/80 via-[#08221a]/50 to-[#08221a]/85" />
          <div className="relative h-full flex flex-col items-center justify-center gap-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Quản lý phòng họp</h1>
            <span className="text-[11px] text-white/60 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Click để xem ảnh lớn
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1 border-b border-slate-200 max-w-xs mx-auto">
          <button
            onClick={() => setTab("book")}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
              tab === "book" ? "border-[#006838] text-[#006838]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Đặt phòng
          </button>
          <button
            onClick={() => setTab("view")}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
              tab === "view" ? "border-[#006838] text-[#006838]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Xem dữ liệu
          </button>
        </div>

        {tab === "book" ? <BookingWizard userName={user?.name || ""} /> : <BookingListView />}
      </main>
      <Footer />

      <Lightbox src={lightboxOpen ? HEADER_IMAGE : null} alt="Quản lý phòng họp" onClose={() => setLightboxOpen(false)} />

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          font-size: 0.75rem;
          font-weight: 600;
          color: #1e293b;
          background: #f8fafc;
        }
        .input:focus {
          outline: none;
          border-color: #006838;
          background: white;
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function BookingWizard({ userName }: { userName: string }) {
  const rooms = useDirectory("meeting_rooms");
  const boPhanList = useDirectory("bo_phan");
  const [step, setStep] = useState<1 | 2>(1);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [form, setForm] = useState({
    hoTen: userName,
    boPhan: "",
    roomId: "",
    ngayHop: today,
    gioBatDau: "",
    gioKetThuc: "",
    hinhThucHop: "",
    emailMoiHop: "",
    noiDung: "",
    linkTaiLieu: "",
  });

  useEffect(() => {
    if (userName) setForm((f) => (f.hoTen ? f : { ...f, hoTen: userName }));
  }, [userName]);

  const [bookedSlots, setBookedSlots] = useState<{ gio_bat_dau: string; gio_ket_thuc: string }[]>([]);
  const [pendingStart, setPendingStart] = useState<string | null>(null);

  const selectedRoom = rooms.options.find((r) => String(r.id) === form.roomId);

  useEffect(() => {
    if (!form.roomId || !form.ngayHop) {
      setBookedSlots([]);
      return;
    }
    fetch(`/api/meeting-bookings/availability?roomId=${form.roomId}&date=${form.ngayHop}`)
      .then((res) => res.json())
      .then((data) => setBookedSlots(data.bookedSlots || []));
  }, [form.roomId, form.ngayHop]);

  function isSlotBooked(slot: string): boolean {
    return bookedSlots.some((b) => slot >= b.gio_bat_dau && slot < b.gio_ket_thuc);
  }

  function handleSlotClick(slot: string) {
    if (isSlotBooked(slot)) return;

    if (!pendingStart) {
      setPendingStart(slot);
      setForm((f) => ({ ...f, gioBatDau: "", gioKetThuc: "" }));
      return;
    }

    const [start, end] = slot >= pendingStart ? [pendingStart, slot] : [slot, pendingStart];
    const endExclusive = SLOTS[SLOTS.indexOf(end) + 1] || "18:00";

    // Chặn nếu khoảng chọn dính khung giờ đã đặt
    const rangeSlots = SLOTS.filter((s) => s >= start && s < endExclusive);
    if (rangeSlots.some(isSlotBooked)) {
      setPendingStart(null);
      return;
    }

    setForm((f) => ({ ...f, gioBatDau: start, gioKetThuc: endExclusive }));
    setPendingStart(null);
  }

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: number; createdAt: string } | null>(null);
  const [confirmTime, setConfirmTime] = useState("");

  function goToStep2() {
    setError("");
    if (!form.hoTen || !form.boPhan || !form.roomId || !form.ngayHop || !form.gioBatDau || !form.gioKetThuc) {
      setError("Vui lòng điền đầy đủ thông tin và chọn khung giờ họp");
      return;
    }
    setConfirmTime(new Date().toLocaleString("vi-VN"));
    setStep(2);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/meeting-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          roomId: Number(form.roomId),
          linkTaiLieu: form.linkTaiLieu.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đặt phòng thất bại");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <IconCircleCheck size={28} />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">Đặt phòng họp thành công!</h2>
        <p className="text-sm text-slate-500">Đơn của bạn đang chờ Admin duyệt. Xem trạng thái ở tab &quot;Xem dữ liệu&quot;.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? "bg-blue-600 text-white" : step > s ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {s}
            </div>
            {s === 1 && <div className="w-16 h-0.5 bg-slate-200" />}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-16 text-xs font-semibold text-slate-500 -mt-3">
        <span className={step === 1 ? "text-blue-600" : ""}>Thông tin đặt phòng</span>
        <span className={step === 2 ? "text-blue-600" : ""}>Xác nhận đặt lịch</span>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <IconAlertTriangle size={15} /> {error}
        </div>
      )}

      {step === 1 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Họ tên người đặt" required>
              <input required value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} className="input" />
            </Field>
            <Field label="Bộ phận" required>
              <select required value={form.boPhan} onChange={(e) => setForm({ ...form, boPhan: e.target.value })} className="input">
                <option value="">-- Chọn bộ phận --</option>
                {boPhanList.options.map((o) => (
                  <option key={o.id} value={o.name as string}>{o.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Phòng họp" required>
              <select required value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} className="input">
                <option value="">-- Chọn phòng họp... --</option>
                {rooms.options.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Ngày họp" required>
              <input required type="date" value={form.ngayHop} onChange={(e) => setForm({ ...form, ngayHop: e.target.value })} className="input" />
            </Field>
          </div>

          {selectedRoom?.requires_reception ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              ⚠️ Lưu ý: Với {selectedRoom.name}, vui lòng liên hệ trước với Lễ Tân.
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <IconClock size={14} /> Chọn khung giờ họp
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] leading-relaxed">
              💡 <strong>Hướng dẫn:</strong> Click vào khung giờ bắt đầu, rồi click khung giờ kết thúc để chọn cả khoảng.
              Khung giờ màu đỏ là đã được đặt.
            </div>

            {!form.roomId || !form.ngayHop ? (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                Vui lòng chọn phòng và ngày trước
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-1.5">
                {SLOTS.map((slot) => {
                  const booked = isSlotBooked(slot);
                  const inRange = form.gioBatDau && form.gioKetThuc && slot >= form.gioBatDau && slot < form.gioKetThuc;
                  const isPending = pendingStart === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      disabled={booked}
                      onClick={() => handleSlotClick(slot)}
                      className={`px-1 py-2 rounded-lg text-[10px] font-bold transition-colors ${
                        booked
                          ? "bg-red-100 text-red-400 cursor-not-allowed line-through"
                          : inRange || isPending
                          ? "bg-[#006838] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-emerald-100"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Giờ bắt đầu">
              <input readOnly value={form.gioBatDau} placeholder="Tự động điền" className="input bg-slate-100" />
            </Field>
            <Field label="Giờ kết thúc">
              <input readOnly value={form.gioKetThuc} placeholder="Tự động điền" className="input bg-slate-100" />
            </Field>
            <Field label="Hình thức họp">
              <select value={form.hinhThucHop} onChange={(e) => setForm({ ...form, hinhThucHop: e.target.value })} className="input">
                <option value="">Chọn hình thức họp</option>
                {MEETING_FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Email mời họp">
              <input
                value={form.emailMoiHop}
                onChange={(e) => setForm({ ...form, emailMoiHop: e.target.value })}
                placeholder="vd: nguyen@company.com, tran@company.com"
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nội dung cuộc họp">
              <textarea rows={3} value={form.noiDung} onChange={(e) => setForm({ ...form, noiDung: e.target.value })} placeholder="Nhập nội dung chi tiết cuộc họp..." className="input resize-none" />
            </Field>
            <Field label="Link tài liệu/nội dung (mỗi link 1 dòng)">
              <textarea
                rows={3}
                value={form.linkTaiLieu}
                onChange={(e) => setForm({ ...form, linkTaiLieu: e.target.value })}
                placeholder={"https://drive.google.com/...\nhttps://docs.google.com/..."}
                className="input resize-none"
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={goToStep2}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              Tiếp theo <IconArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900">Xác nhận thông tin đặt phòng</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <SummaryRow label="Họ tên người đặt" value={form.hoTen} />
            <SummaryRow label="Bộ phận" value={form.boPhan} />
            <SummaryRow label="Phòng họp" value={selectedRoom?.name as string} />
            <SummaryRow label="Ngày họp" value={form.ngayHop} />
            <SummaryRow label="Khung giờ" value={`${form.gioBatDau} - ${form.gioKetThuc}`} />
            <SummaryRow label="Hình thức họp" value={form.hinhThucHop || "—"} />
            <SummaryRow label="Email mời họp" value={form.emailMoiHop || "—"} />
            <SummaryRow label="Thời gian tạo đơn" value={confirmTime} />
            <SummaryRow label="Nội dung cuộc họp" value={form.noiDung || "—"} full />
          </dl>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              <IconArrowLeft size={16} /> Quay lại
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#006838] text-white text-sm font-bold hover:bg-[#08522d] disabled:opacity-50 transition-colors"
            >
              {submitting && <IconLoader2 size={16} className="animate-spin" />} Xác nhận đặt lịch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, full }: { label: string; value?: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-slate-400 font-semibold">{label}</dt>
      <dd className="text-slate-900 font-bold mt-0.5">{value || "—"}</dd>
    </div>
  );
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

function BookingListView() {
  const [items, setItems] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meeting-bookings")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <IconLoader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-sm">Chưa có lịch đặt phòng nào.</div>;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#eef7f2] text-slate-600 uppercase font-semibold">
            <th className="p-3.5 text-left">Người đặt</th>
            <th className="p-3.5 text-left">Bộ phận</th>
            <th className="p-3.5 text-left">Ngày họp</th>
            <th className="p-3.5 text-left">Khung giờ</th>
            <th className="p-3.5 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((b) => {
            const status = STATUS_LABEL[b.status] || STATUS_LABEL.PENDING;
            const StatusIcon = status.icon;
            return (
              <tr key={b.id} className="hover:bg-slate-50/70">
                <td className="p-3.5 font-bold text-slate-900">{b.ho_ten}</td>
                <td className="p-3.5 text-slate-600">{b.bo_phan}</td>
                <td className="p-3.5 text-slate-600">{b.ngay_hop}</td>
                <td className="p-3.5 text-slate-600">{b.gio_bat_dau} - {b.gio_ket_thuc}</td>
                <td className="p-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${status.className}`}>
                    <StatusIcon size={12} /> {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
