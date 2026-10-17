"use client";

// Client Component dùng chung cho cả /book-room và /book-room/[code]
// Hỗ trợ đặt phòng họp công khai KHÔNG CẦN ĐĂNG NHẬP:
// - Mỗi phòng có link riêng: /book-room/ph-01, /book-room/ph-02, /book-room/ph-03...
// - Mỗi phòng có mã QR riêng dán tại cửa phòng.
// - Nhập MSNV -> tự động điền Họ và tên, Bộ phận (vẫn cho chỉnh sửa thoải mái).
// - Chọn khung giờ, tiêu đề, gửi thông báo qua Zalo bot cho Lễ Tân.

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type RoomInfo = {
  id?: string;
  code?: string;
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  isAvailable: boolean;
};

type AvailableRoomItem = {
  id: string;
  name: string;
  code: string;
  capacity: number;
  location: string;
  equipment: string[];
  isAvailable: boolean;
};

type BusySlot = { timeSlot: string; status: string };

const PRESET_SLOTS = [
  { value: "08:00 - 09:30", hint: "Sáng" },
  { value: "09:30 - 11:30", hint: "Sáng" },
  { value: "13:30 - 15:00", hint: "Chiều" },
  { value: "15:00 - 17:00", hint: "Chiều" },
  { value: "08:00 - 17:00", hint: "Cả ngày" },
];

function slotRange(slot: string): { start: number; end: number } | null {
  const m = slot.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const start = Number(m[1]) * 60 + Number(m[2]);
  const end = Number(m[3]) * 60 + Number(m[4]);
  return start < end ? { start, end } : null;
}

function vnNow(): { date: string; minutes: number } {
  const d = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return { date: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

// Lịch đã đặt qua QR trên CHÍNH máy này (kèm mã hủy) — để người đặt tự hủy, không phải gọi Lễ Tân
type MyQrBooking = { bookingId: string; cancelToken: string; roomName: string; bookingDate: string; timeSlot: string; cancelled?: boolean };
const MY_QR_KEY = "tbs_my_qr_bookings";
function loadMyQrBookings(): MyQrBooking[] {
  try {
    const list = JSON.parse(window.localStorage.getItem(MY_QR_KEY) || "[]");
    if (!Array.isArray(list)) return [];
    const today = vnNow().date;
    // Chỉ giữ lịch từ hôm nay trở đi, tối đa 20 lịch
    return list.filter((b) => b && b.bookingId && b.cancelToken && String(b.bookingDate) >= today).slice(-20);
  } catch {
    return [];
  }
}
function saveMyQrBookings(list: MyQrBooking[]) {
  try {
    window.localStorage.setItem(MY_QR_KEY, JSON.stringify(list));
  } catch {}
}

function formatDateVn(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[15px] focus:bg-white focus:border-[#006838] focus:ring-2 focus:ring-[#006838]/15 outline-none transition";
const labelCls = "block text-sm font-bold text-slate-700 mb-1.5";

export default function BookRoomClient({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState<string | null>(initialCode || null);
  const [isRoomLocked, setIsRoomLocked] = useState(Boolean(initialCode));
  const [availableRooms, setAvailableRooms] = useState<AvailableRoomItem[]>([]);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const [form, setForm] = useState({
    empCode: "",
    name: "",
    department: "",
    title: "",
    date: vnNow().date,
    attendeesCount: 5,
    notes: "",
  });
  const [slotChoice, setSlotChoice] = useState<string>("");
  const [customStart, setCustomStart] = useState("08:00");
  const [customEnd, setCustomEnd] = useState("09:00");

  const [lookupState, setLookupState] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const lookupSeq = useRef(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ bookingId: string; roomName: string; bookingDate: string; timeSlot: string } | null>(null);
  const [myBookings, setMyBookings] = useState<MyQrBooking[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelMsg, setCancelMsg] = useState<{ text: string; error: boolean } | null>(null);
  useEffect(() => {
    setMyBookings(loadMyQrBookings());
  }, []);
  const cancelMyBooking = async (b: MyQrBooking) => {
    if (!window.confirm(`Hủy lịch ${b.roomName} ngày ${formatDateVn(b.bookingDate)}, ${b.timeSlot}?`)) return;
    setCancellingId(b.bookingId);
    setCancelMsg(null);
    try {
      const res = await fetch("/api/public/rooms/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: b.bookingId, cancelToken: b.cancelToken }),
      });
      const data = await res.json().catch(() => null);
      // Đã hủy (kể cả hủy từ trước) thì đánh dấu đã hủy trên máy
      if (data?.success || data?.error === "CANNOT_CANCEL") {
        const next = loadMyQrBookings().map((x) => (x.bookingId === b.bookingId ? { ...x, cancelled: Boolean(data?.success) || x.cancelled } : x));
        saveMyQrBookings(next);
        setMyBookings(next);
      }
      setCancelMsg({ text: data?.message || (data?.success ? "Đã hủy lịch" : "Không hủy được lịch"), error: !data?.success });
      if (data?.success) setReloadKey((k) => k + 1);
    } catch {
      setCancelMsg({ text: "Lỗi mạng, vui lòng thử lại.", error: true });
    } finally {
      setCancellingId(null);
    }
  };

  // 1. Phân tích mã phòng từ pathname hoặc search query
  useEffect(() => {
    if (typeof window === "undefined") return;

    let detectedCode = (initialCode || "").trim().toUpperCase();

    // Nếu chưa có từ props, thử đọc từ pathname (VD: /book-room/ph-01)
    if (!detectedCode) {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      const bookRoomIdx = pathParts.indexOf("book-room");
      if (bookRoomIdx !== -1 && pathParts.length > bookRoomIdx + 1) {
        const seg = pathParts[bookRoomIdx + 1];
        if (seg && seg !== "index.html") {
          detectedCode = decodeURIComponent(seg).replace(/\.html$/, "").trim().toUpperCase();
        }
      }
    }

    // Nếu vẫn chưa có, đọc từ query params (?code=, ?roomId=, ?id=)
    if (!detectedCode) {
      const params = new URLSearchParams(window.location.search);
      detectedCode = (params.get("code") || params.get("roomId") || params.get("id") || "").trim().toUpperCase();
    }

    if (detectedCode) {
      setCode(detectedCode);
      setIsRoomLocked(true);
    } else {
      // Tải danh sách các phòng đang hoạt động để người dùng bấm chọn hoặc lấy link riêng
      (async () => {
        try {
          const res = await fetch("/api/public/rooms/list", { cache: "no-store" });
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.rooms)) {
            setAvailableRooms(json.data.rooms);
          }
        } catch (e) {
          console.warn("Không tải được danh sách phòng:", e);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [initialCode]);

  // 2. Tải thông tin chi tiết của phòng và lịch đã có
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/public/rooms/info?code=${encodeURIComponent(code)}&date=${form.date}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.data?.room) {
          setRoom(data.data.room);
          setBusySlots(data.data.busySlots || []);
          setLoadError("");
        } else {
          setLoadError(data.error || "Không tải được thông tin phòng họp.");
        }
      } catch {
        if (!cancelled) setLoadError("Lỗi kết nối mạng, vui lòng kiểm tra kết nối và tải lại trang.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, form.date, reloadKey]);

  // 3. Tra cứu MSNV -> tự điền Họ và tên & Bộ phận (vẫn cho sửa tay tự do)
  useEffect(() => {
    const msnv = form.empCode.trim().toUpperCase();
    if (msnv.length < 3) {
      setLookupState("idle");
      setLookupMessage("");
      return;
    }
    const seq = ++lookupSeq.current;
    setLookupState("loading");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/public/employee?msnv=${encodeURIComponent(msnv)}`, { cache: "no-store" });
        const data = await res.json();
        if (seq !== lookupSeq.current) return;
        if (data.success && data.found && data.data) {
          setForm((f) => ({
            ...f,
            name: data.data.name || f.name,
            department: data.data.department || f.department,
          }));
          setLookupState("found");
          setLookupMessage(`✓ Đã tự điền thông tin: ${data.data.name} (${data.data.department || "TBS Group"}). Bạn có thể chỉnh sửa nếu cần.`);
        } else {
          setLookupState("notfound");
          setLookupMessage("Chưa tìm thấy mã nhân viên trong hệ thống. Vui lòng tự nhập Họ tên và Bộ phận.");
        }
      } catch {
        if (seq === lookupSeq.current) {
          setLookupState("notfound");
          setLookupMessage("Không thể tra cứu tự động, vui lòng tự nhập Họ tên và Bộ phận.");
        }
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [form.empCode]);

  const timeSlot = slotChoice === "CUSTOM" ? `${customStart} - ${customEnd}` : slotChoice;
  const now = vnNow();

  const slotConflict = (slot: string): string | null => {
    const r = slotRange(slot);
    if (!r) return null;
    const hit = busySlots.find((b) => {
      const br = slotRange(b.timeSlot);
      return br && br.start < r.end && r.start < br.end;
    });
    return hit ? hit.timeSlot : null;
  };

  const slotPassed = (slot: string): boolean => {
    const r = slotRange(slot);
    return !!r && form.date === now.date && r.start < now.minutes - 5;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!timeSlot || !slotRange(timeSlot)) {
      setErrorMsg("Vui lòng chọn khung giờ hợp lệ (giờ kết thúc phải sau giờ bắt đầu).");
      return;
    }
    if (slotPassed(timeSlot)) {
      setErrorMsg("Khung giờ đã qua, vui lòng chọn giờ khác.");
      return;
    }
    const clash = slotConflict(timeSlot);
    if (clash) {
      setErrorMsg(`Khung giờ bị trùng với lịch đã có (${clash}). Vui lòng chọn giờ khác.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/rooms/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code, timeSlot }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ bookingId: data.bookingId, ...data.data });
        if (data.cancelToken) {
          const next = [
            ...loadMyQrBookings().filter((x) => x.bookingId !== data.bookingId),
            { bookingId: data.bookingId, cancelToken: data.cancelToken, roomName: data.data?.roomName || room?.name || "", bookingDate: data.data?.bookingDate || "", timeSlot: data.data?.timeSlot || timeSlot },
          ];
          saveMyQrBookings(next);
          setMyBookings(next);
        }
      } else {
        setErrorMsg(data.error || "Có lỗi xảy ra khi gửi đơn.");
        if (data.code === "DOUBLE_BOOKING_CONFLICT") setReloadKey((k) => k + 1);
      }
    } catch {
      setErrorMsg("Lỗi mạng, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const bookAnother = () => {
    setResult(null);
    setSlotChoice("");
    setForm((f) => ({ ...f, title: "", notes: "" }));
    setReloadKey((k) => k + 1);
  };

  // ── Màn hình đang tải ──
  if (isLoading) {
    return (
      <Shell>
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#006838] border-t-transparent rounded-full animate-spin" />
          <span>Đang tải thông tin phòng họp...</span>
        </div>
      </Shell>
    );
  }

  // ── Màn hình danh sách phòng (kèm link riêng cho từng phòng) ──
  if (!code && !room) {
    return (
      <Shell>
        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2M20 14v2M14 18v2h2M18 18h2v2" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Chọn Phòng Họp Để Đăng Ký</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Mỗi phòng họp có một <b>mã QR riêng</b> dán tại cửa phòng. Quét mã QR hoặc bấm chọn phòng bên dưới để đặt phòng ngay:
            </p>
          </div>

          <div className="space-y-3">
            {availableRooms.map((r) => {
              const rCode = (r.code || r.id).toLowerCase();
              return (
                <a
                  key={r.id}
                  href={`/book-room/${rCode}`}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 group ${
                    r.isAvailable
                      ? "bg-slate-50 hover:bg-emerald-50/70 hover:border-[#006838] border-slate-200 shadow-2xs cursor-pointer"
                      : "bg-slate-100 border-slate-200 opacity-60 pointer-events-none"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#006838] text-white font-bold">{r.code || r.id}</span>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-[#006838] transition-colors">{r.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      {r.location || "Văn phòng chuỗi Skechers"} · Sức chứa: <b>{r.capacity}</b> người
                    </p>
                  </div>

                  <span className="px-4 py-2 rounded-xl bg-[#006838] group-hover:bg-[#00522c] text-white text-xs font-bold transition flex items-center gap-1 flex-shrink-0 shadow-2xs">
                    {r.isAvailable ? "Đặt phòng này →" : "Bảo trì"}
                  </span>
                </a>
              );
            })}
          </div>

          <div className="pt-2 text-center text-xs text-slate-500">
            Không cần đăng nhập tài khoản. Cần hỗ trợ xin liên hệ quầy <b>Lễ Tân</b>.
          </div>
        </div>
      </Shell>
    );
  }

  // ── Màn hình lỗi phòng không hợp lệ ──
  if (loadError || !room) {
    return (
      <Shell>
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-black text-slate-900">Mã phòng không tồn tại hoặc đã đổi</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {loadError || "Mã phòng trong đường link không hợp lệ. Vui lòng bấm bên dưới để xem danh sách phòng:"}
          </p>
          <a
            href="/book-room"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#006838] text-white text-xs font-bold hover:bg-[#00522c] transition"
          >
            ← Xem danh sách link các phòng họp
          </a>
        </div>
      </Shell>
    );
  }

  // ── Màn hình đặt phòng thành công ──
  if (result) {
    return (
      <Shell room={room}>
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-[#006838] rounded-full flex items-center justify-center mx-auto text-3xl font-black">✓</div>
          <h2 className="text-2xl font-black text-slate-900">Đã gửi yêu cầu đặt phòng!</h2>
          <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm space-y-2">
            <Row label="Phòng họp" value={result.roomName} />
            <Row label="Ngày họp" value={formatDateVn(result.bookingDate)} />
            <Row label="Khung giờ" value={result.timeSlot} />
            <Row label="Người đặt" value={`${form.name} (${form.empCode})`} />
            {form.department && <Row label="Bộ phận" value={form.department} />}
            <Row label="Mã đơn" value={result.bookingId} mono />
          </div>
          <p className="bg-emerald-50 text-emerald-900 p-4 rounded-xl text-sm font-medium leading-relaxed border border-emerald-100 text-left">
            🔔 <b>Lễ Tân đã nhận thông báo qua Zalo Bot</b> và sẽ xác nhận lịch họp của bạn trên hệ thống. Lịch đang ở trạng thái <b>chờ duyệt (PENDING)</b>.
          </p>
          <MyQrBookingList list={myBookings} cancellingId={cancellingId} onCancel={cancelMyBooking} msg={cancelMsg} />
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={bookAnother}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Đặt thêm khung giờ khác cho phòng này
            </button>
            <a
              href="/book-room"
              className="block w-full text-center text-xs text-[#006838] font-bold py-2 hover:underline"
            >
              Xem danh sách phòng họp khác →
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Form đặt phòng chính cho phòng đã xác định ──
  const roomPath = (room.code || code || "").toLowerCase();
  const directLinkUrl = typeof window !== "undefined" ? `${window.location.origin}/book-room/${roomPath}` : `/book-room/${roomPath}`;

  return (
    <Shell room={room}>
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-5 sm:p-6 space-y-7">
        <MyQrBookingList list={myBookings} cancellingId={cancellingId} onCancel={cancelMyBooking} msg={cancelMsg} />
        {/* Banner xác nhận phòng đã được chọn sẵn từ Link / QR */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <span className="w-5 h-5 rounded-full bg-[#006838] text-white flex items-center justify-center text-[10px] flex-shrink-0">✓</span>
            <span>
              Đang đặt: <b>{room.name}</b>
            </span>
          </div>
          <a href="/book-room" className="text-[11px] font-bold text-[#006838] hover:underline flex-shrink-0">
            Đổi phòng khác
          </a>
        </div>

        {!room.isAvailable && (
          <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-sm font-semibold border border-rose-100">
            Phòng đang tạm khóa / bảo trì. Vui lòng liên hệ Lễ Tân.
          </div>
        )}

        {/* 1. Người đặt */}
        <section className="space-y-4">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <StepDot n={1} /> Thông tin người đặt
          </h3>

          <div>
            <label htmlFor="msnv" className={labelCls}>
              Mã số nhân viên (MSNV) <span className="text-rose-500">*</span>
            </label>
            <input
              id="msnv"
              required
              autoComplete="off"
              autoCapitalize="characters"
              value={form.empCode}
              onChange={(e) => setForm({ ...form, empCode: e.target.value.toUpperCase().replace(/\s/g, "") })}
              className={inputCls}
              placeholder="VD: 102603069"
            />
            <p className="text-xs mt-1.5 min-h-[1.2rem]" aria-live="polite">
              {lookupState === "loading" && <span className="text-slate-500">Đang tra cứu thông tin nhân viên...</span>}
              {lookupState === "found" && <span className="text-[#006838] font-bold">{lookupMessage}</span>}
              {lookupState === "notfound" && <span className="text-amber-700 font-medium">{lookupMessage}</span>}
            </p>
          </div>

          <div>
            <label htmlFor="name" className={labelCls}>
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              id="name"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder="Nhập họ và tên (hoặc tự điền theo MSNV)"
            />
          </div>

          <div>
            <label htmlFor="dept" className={labelCls}>Bộ phận / Đơn vị</label>
            <input
              id="dept"
              maxLength={120}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className={inputCls}
              placeholder="Nhập bộ phận hoặc đơn vị công tác"
            />
          </div>
        </section>

        {/* 2. Cuộc họp */}
        <section className="space-y-4">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <StepDot n={2} /> Thông tin cuộc họp
          </h3>

          <div>
            <label htmlFor="title" className={labelCls}>
              Nội dung / Tiêu đề cuộc họp <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
              placeholder="VD: Họp giao ban tuần, Họp với khách hàng..."
            />
          </div>

          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <div>
              <label htmlFor="date" className={labelCls}>
                Ngày họp <span className="text-rose-500">*</span>
              </label>
              <input
                id="date"
                required
                type="date"
                min={now.date}
                value={form.date}
                onChange={(e) => {
                  setForm({ ...form, date: e.target.value < now.date ? now.date : e.target.value || now.date });
                  setSlotChoice("");
                }}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="count" className={labelCls}>Số người</label>
              <input
                id="count"
                type="number"
                min={1}
                max={500}
                value={form.attendeesCount}
                onChange={(e) => setForm({ ...form, attendeesCount: Number(e.target.value) || 1 })}
                className={inputCls}
              />
            </div>
          </div>
          {room.capacity > 0 && form.attendeesCount > room.capacity && (
            <p className="text-xs text-amber-700 -mt-2">Lưu ý: số người vượt sức chứa tiêu chuẩn của phòng ({room.capacity} chỗ).</p>
          )}

          <div>
            <span className={labelCls}>
              Khung giờ <span className="text-rose-500">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_SLOTS.map((s) => {
                const passed = slotPassed(s.value);
                const taken = !!slotConflict(s.value);
                const disabled = passed || taken;
                const selected = slotChoice === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSlotChoice(s.value)}
                    aria-pressed={selected}
                    className={`px-3 py-2.5 rounded-xl text-left border transition cursor-pointer ${
                      disabled
                        ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                        : selected
                          ? "bg-[#006838] border-[#006838] text-white shadow-md font-black"
                          : "bg-white border-slate-200 text-slate-800 hover:border-[#006838]"
                    }`}
                  >
                    <span className={`block text-sm font-bold tabular-nums ${disabled ? "line-through" : ""}`}>{s.value}</span>
                    <span className={`block text-[11px] ${selected ? "text-emerald-100" : "text-slate-500"}`}>
                      {passed ? "Đã qua" : taken ? "Đã có lịch" : s.hint}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSlotChoice("CUSTOM")}
                aria-pressed={slotChoice === "CUSTOM"}
                className={`px-3 py-2.5 rounded-xl text-left border transition cursor-pointer ${
                  slotChoice === "CUSTOM"
                    ? "bg-[#006838] border-[#006838] text-white shadow-md font-black"
                    : "bg-white border-slate-200 text-slate-800 hover:border-[#006838]"
                }`}
              >
                <span className="block text-sm font-bold">Tùy chỉnh</span>
                <span className={`block text-[11px] ${slotChoice === "CUSTOM" ? "text-emerald-100" : "text-slate-500"}`}>Tự chọn giờ</span>
              </button>
            </div>

            {slotChoice === "CUSTOM" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label htmlFor="from" className="block text-xs font-bold text-slate-600 mb-1">Từ</label>
                  <input id="from" type="time" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="to" className="block text-xs font-bold text-slate-600 mb-1">Đến</label>
                  <input id="to" type="time" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={inputCls} />
                </div>
              </div>
            )}

            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs font-bold text-slate-700 mb-1.5">Lịch đã có ngày {formatDateVn(form.date)}:</p>
              {busySlots.length === 0 ? (
                <p className="text-xs text-slate-500">Chưa có lịch nào, phòng trống cả ngày.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {busySlots.map((b, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 tabular-nums">
                      {b.timeSlot}
                      {b.status === "PENDING" && <span className="ml-1 font-normal text-slate-500">· chờ duyệt</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Ghi chú */}
        <section className="space-y-2">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <StepDot n={3} /> Ghi chú thêm
          </h3>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            maxLength={1000}
            className={inputCls}
            placeholder="VD: Cần máy chiếu, chuẩn bị nước uống, có khách ngoài..."
            aria-label="Ghi chú thêm"
          />
        </section>

        {errorMsg && (
          <div role="alert" className="bg-rose-50 text-rose-700 p-3 rounded-xl text-sm font-semibold border border-rose-100">
            {errorMsg}
          </div>
        )}

        <div className="space-y-2">
          <button
            type="submit"
            disabled={isSubmitting || !room.isAvailable}
            className="w-full bg-[#006838] hover:bg-[#00522c] text-white font-black py-4 rounded-2xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu đặt phòng"}
          </button>
          <p className="text-center text-xs text-slate-500">
            Yêu cầu sẽ được gửi tới Lễ Tân qua <b>Zalo Bot</b> để xác nhận.
          </p>
        </div>
      </form>
    </Shell>
  );
}

function Shell({ room, children }: { room?: RoomInfo | null; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 pb-10">
      <header className="bg-[#006838] text-white px-4 pt-6 pb-14 rounded-b-[2rem] shadow-md">
        <div className="max-w-xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-200">
            Văn Phòng Chuỗi SKECHERS · Đặt phòng họp
          </p>
          {room ? (
            <>
              <h1 className="text-2xl font-black mt-1 leading-tight">{room.name}</h1>
              <p className="text-sm text-emerald-100 mt-1">
                {[room.location, room.capacity ? `${room.capacity} chỗ` : ""].filter(Boolean).join(" · ")}
              </p>
              {room.equipment && room.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {room.equipment.slice(0, 6).map((eq, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-white/15 text-[11px] font-semibold">
                      {eq}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <h1 className="text-2xl font-black mt-1">Đặt Phòng Họp Công Khai</h1>
          )}
        </div>
      </header>
      <div className="max-w-xl mx-auto px-4 -mt-9">{children}</div>
    </main>
  );
}

function MyQrBookingList({
  list,
  cancellingId,
  onCancel,
  msg,
}: {
  list: MyQrBooking[];
  cancellingId: string | null;
  onCancel: (b: MyQrBooking) => void;
  msg: { text: string; error: boolean } | null;
}) {
  if (list.length === 0 && !msg) return null;
  return (
    <div className="text-left bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="text-sm font-black text-slate-900">Lịch bạn đã đặt trên máy này</div>
      {msg && (
        <p className={`text-xs font-semibold p-2.5 rounded-xl border ${msg.error ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>{msg.text}</p>
      )}
      {list
        .slice()
        .sort((a, b) => (a.bookingDate + a.timeSlot).localeCompare(b.bookingDate + b.timeSlot))
        .map((b) => (
          <div key={b.bookingId} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 first:border-0 first:pt-0">
            <div className="min-w-0 text-sm">
              <div className={`font-bold ${b.cancelled ? "text-slate-500 line-through" : "text-slate-900"}`}>{b.roomName}</div>
              <div className="text-xs text-slate-600">
                {formatDateVn(b.bookingDate)} · {b.timeSlot}
              </div>
            </div>
            {b.cancelled ? (
              <span className="text-xs font-bold text-slate-500 shrink-0">Đã hủy</span>
            ) : (
              <button
                type="button"
                onClick={() => onCancel(b)}
                disabled={cancellingId === b.bookingId}
                className="shrink-0 min-h-[40px] px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black disabled:opacity-50"
              >
                {cancellingId === b.bookingId ? "Đang hủy..." : "Hủy lịch"}
              </button>
            )}
          </div>
        ))}
    </div>
  );
}

function StepDot({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 rounded-full bg-[#006838] text-white text-xs font-black flex items-center justify-center flex-shrink-0">
      {n}
    </span>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold text-slate-900 text-right break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
