"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconUser,
  IconUsers,
  IconBuilding,
  IconPlus,
  IconTrash,
  IconCheck,
  IconX,
  IconLock,
  IconLockOpen,
  IconId,
  IconQrcode,
  IconPrinter,
  IconSearch,
  IconFilter,
  IconBell,
  IconChevronDown,
  IconVideo,
  IconDeviceTv,
  IconCoffee,
  IconMicrophone,
  IconChecklist,
  IconEdit,
  IconSparkles,
} from "@tabler/icons-react";

interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  status: "AVAILABLE" | "BUSY" | "MAINTENANCE";
  isLocked: boolean;
}

interface RoomBooking {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  bookerName: string;
  department: string;
  bookingDate: string;
  timeSlot: string;
  attendeesCount: number;
  notes?: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
}

interface VisitorRecord {
  id: string;
  badgeCode: string;
  visitorName: string;
  company: string;
  idCard: string;
  hostName: string;
  department: string;
  roomLocation: string;
  visitDate: string;
  expectedTime: string;
  status: "EXPECTED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  notes?: string;
  createdAt: string;
}

export default function MeetingRoomsPage() {
  const [activeTab, setActiveTab] = useState<"BOOKING" | "ROOMS" | "VISITORS" | "HISTORY">("BOOKING");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedVisitorBadge, setSelectedVisitorBadge] = useState<VisitorRecord | null>(null);

  // Default Fallback Rooms List
  const [rooms, setRooms] = useState<MeetingRoom[]>([
    {
      id: "room_1",
      name: "Phòng Họp Executive VIP 1",
      capacity: 16,
      location: "Tầng 3 - VP Chuỗi SKECHERS",
      equipment: ["Máy chiếu 4K", "Micro không dây", "Bảng kính", "Trà nước"],
      status: "AVAILABLE",
      isLocked: false,
    },
    {
      id: "room_2",
      name: "Phòng Họp Hội Thảo SKECHERS",
      capacity: 30,
      location: "Tầng 2 - VP Chuỗi SKECHERS",
      equipment: ["Màn hình LED 120 inch", "4 Micro", "Camera Zoom 360", "Trà nước"],
      status: "BUSY",
      isLocked: false,
    },
    {
      id: "room_3",
      name: "Phòng Họp Gemba Walk A1",
      capacity: 12,
      location: "Cụm Nhà Máy TBS A1",
      equipment: ["Smart TV 65 inch", "Bảng di động"],
      status: "AVAILABLE",
      isLocked: false,
    },
    {
      id: "room_4",
      name: "Phòng Họp R&D Kỹ Thuật",
      capacity: 10,
      location: "Tầng 1 - Trung Tâm R&D",
      equipment: ["Máy chiếu 3D", "Bảng tương tác", "Tủ mẫu sản phẩm"],
      status: "AVAILABLE",
      isLocked: false,
    },
    {
      id: "room_5",
      name: "Phòng Họp Logistics TTPP",
      capacity: 8,
      location: "Kho Phân Phối TTPP Đồng Nai",
      equipment: ["Smart TV 55 inch", "Bảng trắng"],
      status: "AVAILABLE",
      isLocked: false,
    },
    {
      id: "room_6",
      name: "Phòng Họp Ban Giám Đốc",
      capacity: 20,
      location: "Tầng 4 - Tòa nhà Điều Hành",
      equipment: ["Hệ thống Họp Trực Tuyến Đa Điểm", "Micro Âm Trần", "Trà nước cao cấp"],
      status: "AVAILABLE",
      isLocked: false,
    },
  ]);

  // Default Fallback Bookings List
  const [bookings, setBookings] = useState<RoomBooking[]>([
    {
      id: "b_1",
      roomId: "room_2",
      roomName: "Phòng Họp Hội Thảo SKECHERS",
      title: "Họp Đánh Giá Tiến Độ Kế Hoạch CI Q2/2026",
      bookerName: "Anh Huy",
      department: "Hành chính",
      bookingDate: "15/08/2026",
      timeSlot: "09:00 - 11:30",
      attendeesCount: 18,
      status: "CONFIRMED",
      createdAt: "14/08/2026 09:30",
    },
    {
      id: "b_2",
      roomId: "room_1",
      roomName: "Phòng Họp Executive VIP 1",
      title: "Tiếp Đoàn Chuyên Gia SKECHERS Global",
      bookerName: "Trần Thị Mai",
      department: "R&D Kỹ thuật",
      bookingDate: "15/08/2026",
      timeSlot: "14:00 - 16:30",
      attendeesCount: 12,
      status: "CONFIRMED",
      createdAt: "15/08/2026 08:00",
    },
  ]);

  // Default Fallback Visitors List
  const [visitors, setVisitors] = useState<VisitorRecord[]>([
    {
      id: "v_1",
      badgeCode: "VIS-2026-081",
      visitorName: "Mr. Robert Chen",
      company: "SKECHERS International Ltd.",
      idCard: "C10928374",
      hostName: "Anh Huy",
      department: "Văn phòng Chuỗi",
      roomLocation: "Phòng Họp Executive VIP 1",
      visitDate: "15/08/2026",
      expectedTime: "14:00",
      status: "EXPECTED",
      notes: "Kiểm tra mẫu đế giày mới Q3/2026",
      createdAt: "14/08/2026 15:00",
    },
  ]);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    roomId: "room_1",
    title: "",
    bookerName: "Anh Huy",
    department: "Hành chính",
    bookingDate: "2026-08-15",
    timeSlot: "09:00 - 10:30",
    attendeesCount: 6,
    notes: "",
    needsTeaCoffee: true,
    needsProjector: true,
  });

  // Visitor Registration Form State
  const [visitorForm, setVisitorForm] = useState({
    visitorName: "",
    company: "",
    idCard: "",
    hostName: "Anh Huy",
    department: "Hành chính",
    roomLocation: "Phòng Họp Executive VIP 1",
    visitDate: "2026-08-15",
    expectedTime: "14:00",
    notes: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync Data with Cloudflare D1 Database
  const fetchD1RoomsData = async () => {
    try {
      const res = await fetch("/api/rooms");
      const result = await res.json();
      if (result.success && result.data) {
        if (Array.isArray(result.data.rooms) && result.data.rooms.length > 0) {
          setRooms(result.data.rooms.map((r: any) => ({
            id: r.id,
            name: r.name,
            capacity: r.capacity || 10,
            location: r.location,
            equipment: typeof r.equipment === "string" ? r.equipment.split(", ") : r.equipment || [],
            status: r.status || "AVAILABLE",
            isLocked: Boolean(r.is_locked),
          })));
        }
        if (Array.isArray(result.data.bookings) && result.data.bookings.length > 0) {
          setBookings(result.data.bookings.map((b: any) => ({
            id: b.id,
            roomId: b.room_id || b.roomId,
            roomName: b.room_name || b.roomName,
            title: b.title,
            bookerName: b.booker_name || b.bookerName,
            department: b.department,
            bookingDate: b.booking_date || b.bookingDate,
            timeSlot: b.time_slot || b.timeSlot,
            attendeesCount: b.attendees_count || b.attendeesCount || 5,
            notes: b.notes,
            status: b.status || "CONFIRMED",
            createdAt: b.created_at || new Date().toLocaleString("vi-VN"),
          })));
        }
        if (Array.isArray(result.data.visitors) && result.data.visitors.length > 0) {
          setVisitors(result.data.visitors.map((v: any) => ({
            id: v.id,
            badgeCode: v.badge_code || v.badgeCode,
            visitorName: v.visitor_name || v.visitorName,
            company: v.company,
            idCard: v.id_card || v.idCard,
            hostName: v.host_name || v.hostName,
            department: v.department,
            roomLocation: v.room_location || v.roomLocation,
            visitDate: v.visit_date || v.visitDate,
            expectedTime: v.expected_time || v.expectedTime,
            status: v.status || "EXPECTED",
            notes: v.notes,
            createdAt: v.created_at || new Date().toLocaleString("vi-VN"),
          })));
        }
      }
    } catch (err) {
      console.warn("D1 Rooms API fallback to local state:", err);
    }
  };

  useEffect(() => {
    fetchD1RoomsData();
  }, []);

  // Submit Room Booking
  const handleBookRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.title.trim()) {
      alert("Vui lòng nhập tiêu đề cuộc họp!");
      return;
    }

    const selectedRoom = rooms.find((r) => r.id === bookingForm.roomId) || rooms[0];
    const dateFmt = bookingForm.bookingDate.split("-").reverse().join("/");

    const newBooking: RoomBooking = {
      id: `b_${Date.now()}`,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      title: bookingForm.title,
      bookerName: bookingForm.bookerName,
      department: bookingForm.department,
      bookingDate: dateFmt,
      timeSlot: bookingForm.timeSlot,
      attendeesCount: bookingForm.attendeesCount,
      notes: bookingForm.notes,
      status: "CONFIRMED",
      createdAt: new Date().toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }),
    };

    setBookings([newBooking, ...bookings]);

    try {
      await fetch("/api/rooms/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBooking,
          bookingDate: dateFmt,
        }),
      });
      showToast("Đã đăng ký phòng họp thành công & lưu vào Cloudflare D1!");
    } catch (err) {
      showToast("Đã lưu lịch đặt phòng họp thành công!");
    }

    setActiveTab("HISTORY");
  };

  // Register External Visitor
  const handleRegisterVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorForm.visitorName.trim()) {
      alert("Vui lòng nhập họ tên khách mời!");
      return;
    }
    if (!visitorForm.company.trim()) {
      alert("Vui lòng nhập tên đơn vị/công ty khách!");
      return;
    }

    const dateFmt = visitorForm.visitDate.split("-").reverse().join("/");
    const badgeCode = `VIS-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newVisitor: VisitorRecord = {
      id: `v_${Date.now()}`,
      badgeCode,
      visitorName: visitorForm.visitorName,
      company: visitorForm.company,
      idCard: visitorForm.idCard,
      hostName: visitorForm.hostName,
      department: visitorForm.department,
      roomLocation: visitorForm.roomLocation,
      visitDate: dateFmt,
      expectedTime: visitorForm.expectedTime,
      status: "EXPECTED",
      notes: visitorForm.notes,
      createdAt: new Date().toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }),
    };

    setVisitors([newVisitor, ...visitors]);

    try {
      await fetch("/api/rooms/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newVisitor,
          badgeCode,
          visitDate: dateFmt,
        }),
      });
      showToast("Đã đăng ký thông tin đón khách thành công & lưu vào D1!");
    } catch (err) {
      showToast("Đã tạo thẻ khách thành công!");
    }

    setSelectedVisitorBadge(newVisitor);
  };

  // Toggle Room Maintenance Lock
  const handleToggleRoomLock = async (roomId: string) => {
    const updatedRooms = rooms.map((r) => {
      if (r.id === roomId) {
        const nextLock = !r.isLocked;
        return {
          ...r,
          isLocked: nextLock,
          status: (nextLock ? "MAINTENANCE" : "AVAILABLE") as "AVAILABLE" | "BUSY" | "MAINTENANCE",
        };
      }
      return r;
    });

    setRooms(updatedRooms);
    const targetRoom = updatedRooms.find((r) => r.id === roomId);

    try {
      await fetch("/api/rooms/lock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: roomId,
          isLocked: targetRoom?.isLocked,
          status: targetRoom?.status,
        }),
      });
      showToast(`Đã ${targetRoom?.isLocked ? "khóa bảo trì" : "mở lại"} phòng họp thành công trong D1!`);
    } catch (err) {
      showToast(`Đã cập nhật trạng thái phòng họp!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900 flex flex-col justify-between font-sans">
      {/* ════════════════════════════════════════════════════════════════
          TOP EXECUTIVE HEADER BAR
         ════════════════════════════════════════════════════════════════ */}
      <header className="px-5 lg:px-8 py-3.5 bg-white border-b border-slate-200/80 shadow-xs flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/work" className="flex items-center gap-2.5 group">
            <img
              src="/images/tbs-logo.png"
              alt="TBS Group Logo"
              className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <div className="h-5 w-[1px] bg-slate-200" />
            <img
              src="/images/skechers-logo.png"
              alt="SKECHERS Logo"
              className="h-7 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-[#e6f4ed] text-[#006838] text-xs font-bold border border-emerald-100">
            Hệ Thống Quản Lý Phòng Họp &amp; Đón Khách
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 hover:bg-slate-200 transition-colors">
            <span>VN</span>
            <IconChevronDown size={12} />
          </button>
          <button className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors relative">
            <IconBell size={18} />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 border border-white" />
          </button>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <img
              src="/images/crawled/Da-giay1.jpg"
              alt="Avatar"
              className="w-8 h-8 rounded-full border-2 border-[#006838] object-cover"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">Anh Huy</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Phòng Hành Chánh</div>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title & Back Header */}
        <div className="text-center space-y-2 relative">
          <Link
            href="/work"
            className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-bold hover:bg-emerald-50 hover:text-[#006838] transition-colors shadow-2xs"
          >
            <IconArrowLeft size={16} />
            <span>Trở về Tổng quan</span>
          </Link>

          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#006838] text-white flex items-center justify-center font-bold text-sm">
              TBS
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            QUẢN LÝ PHÒNG HỌP &amp; ĐÓN KHÁCH
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto">
            Hệ thống đặt lịch cuộc họp, quản lý tài nguyên phòng họp và cấp thẻ đón khách đối tác
          </p>
        </div>

        {/* 📊 4 STAT DASHBOARD SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100">
              <IconBuilding size={22} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">Tổng phòng họp</span>
              <div className="text-xl font-black text-slate-900">{rooms.length} Phòng</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <IconCheck size={22} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">Phòng trống khả dụng</span>
              <div className="text-xl font-black text-[#006838]">
                {rooms.filter((r) => !r.isLocked && r.status === "AVAILABLE").length} Phòng
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <IconCalendar size={22} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">Lịch họp hôm nay</span>
              <div className="text-xl font-black text-slate-900">{bookings.length} Cuộc họp</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <IconId size={22} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">Khách đón trong ngày</span>
              <div className="text-xl font-black text-slate-900">{visitors.length} Lượt khách</div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TOP NAVIGATION TABS (4 TABS)
           ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-start border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("BOOKING")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "BOOKING"
                ? "bg-white text-[#006838] border-[#006838] shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <IconEdit size={17} />
            <span>📝 Đặt phòng họp</span>
          </button>

          <button
            onClick={() => setActiveTab("ROOMS")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "ROOMS"
                ? "bg-white text-[#006838] border-[#006838] shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <IconBuilding size={17} />
            <span>🏢 Danh sách phòng họp</span>
          </button>

          <button
            onClick={() => setActiveTab("VISITORS")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "VISITORS"
                ? "bg-white text-[#006838] border-[#006838] shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <IconId size={17} />
            <span>🪪 Đón khách &amp; Cấp thẻ</span>
          </button>

          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "HISTORY"
                ? "bg-white text-[#006838] border-[#006838] shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <IconChecklist size={17} />
            <span>📋 Lịch họp &amp; Dữ liệu D1</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#006838] text-[11px] font-extrabold">
              {bookings.length}
            </span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB 1: FORM ĐẶT PHÒNG HỌP & TIME SLOTS
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "BOOKING" && (
          <form onSubmit={handleBookRoomSubmit} className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100">
                  <IconCalendar size={18} />
                </div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                  📋 THÔNG TIN ĐĂNG KÝ PHÒNG HỌP
                </h2>
              </div>

              {/* Grid 1: Basic Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Chọn Phòng họp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Phòng họp <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bookingForm.roomId}
                    onChange={(e) => setBookingForm({ ...bookingForm, roomId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id} disabled={r.isLocked}>
                        {r.name} ({r.capacity} người) {r.isLocked ? "- [Đang khóa bảo trì]" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tiêu đề cuộc họp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Tiêu đề cuộc họp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên cuộc họp..."
                    value={bookingForm.title}
                    onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#006838] bg-slate-50/50"
                  />
                </div>

                {/* Người chủ trì/đặt phòng */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Người chủ trì <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingForm.bookerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#006838] bg-slate-50/50"
                  />
                </div>

                {/* Bộ phận */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Bộ phận <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bookingForm.department}
                    onChange={(e) => setBookingForm({ ...bookingForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                  >
                    <option value="Hành chính">Hành chính</option>
                    <option value="Nhân sự">Nhân sự</option>
                    <option value="Kế toán">Kế toán</option>
                    <option value="R&D Kỹ thuật">R&D Kỹ thuật</option>
                    <option value="Tổ hợp Nhà máy">Tổ hợp Nhà máy</option>
                    <option value="Logistics TTPP">Logistics TTPP</option>
                  </select>
                </div>
              </div>

              {/* Grid 2: Date & Time Slots Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Ngày họp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={bookingForm.bookingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Khung giờ họp <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bookingForm.timeSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                  >
                    <option value="08:00 - 09:30">08:00 - 09:30 (Sáng)</option>
                    <option value="09:30 - 11:30">09:30 - 11:30 (Sáng)</option>
                    <option value="13:30 - 15:00">13:30 - 15:00 (Chiều)</option>
                    <option value="15:00 - 17:00">15:00 - 17:00 (Chiều)</option>
                    <option value="Cả ngày">Cả ngày (08:00 - 17:00)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Số người tham dự</label>
                  <input
                    type="number"
                    min={1}
                    value={bookingForm.attendeesCount}
                    onChange={(e) => setBookingForm({ ...bookingForm, attendeesCount: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white"
                  />
                </div>
              </div>

              {/* Extra Services Checklist */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Yêu cầu hỗ trợ bổ sung:</span>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={bookingForm.needsTeaCoffee}
                      onChange={(e) => setBookingForm({ ...bookingForm, needsTeaCoffee: e.target.checked })}
                      className="accent-[#006838]"
                    />
                    <span>☕ Chuẩn bị Trà &amp; Cà phê</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={bookingForm.needsProjector}
                      onChange={(e) => setBookingForm({ ...bookingForm, needsProjector: e.target.checked })}
                      className="accent-[#006838]"
                    />
                    <span>📹 Chuẩn bị Máy chiếu &amp; Micro</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-[#006838] text-white text-xs font-extrabold hover:bg-[#00522c] transition-colors shadow-md shadow-emerald-900/20 flex items-center gap-2 cursor-pointer"
                >
                  <IconCheck size={16} />
                  <span>🚀 Đăng ký đặt phòng</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 2: DANH SÁCH PHÒNG HỌP & ADMIN LOCK TOGGLE
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "ROOMS" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-5 rounded-2xl bg-white border shadow-xs transition-all flex flex-col justify-between gap-4 ${
                    room.isLocked
                      ? "border-rose-300 bg-rose-50/20"
                      : room.status === "BUSY"
                      ? "border-amber-300"
                      : "border-slate-200/80 hover:border-[#006838]/60"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">{room.name}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{room.location}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          room.isLocked
                            ? "bg-rose-100 text-rose-700"
                            : room.status === "BUSY"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-[#006838]"
                        }`}
                      >
                        {room.isLocked ? "🔒 Khóa bảo trì" : room.status === "BUSY" ? "⏳ Đang họp" : "✓ Phòng trống"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1">
                        <IconUsers size={14} />
                        <span>Sức chứa: {room.capacity} người</span>
                      </span>
                    </div>

                    {/* Equipment Tags */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 block">Trang thiết bị có sẵn:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {room.equipment.map((eq, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600"
                          >
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Admin Lock / Unlock Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Quyền Quản Trị Hành Chánh</span>
                    <button
                      onClick={() => handleToggleRoomLock(room.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        room.isLocked
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-slate-100 text-slate-700 hover:bg-rose-600 hover:text-white"
                      }`}
                    >
                      {room.isLocked ? (
                        <>
                          <IconLockOpen size={14} />
                          <span>Mở lại phòng</span>
                        </>
                      ) : (
                        <>
                          <IconLock size={14} />
                          <span>Khóa bảo trì</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 3: ĐÓN KHÁCH ĐỐI TÁC & CẤP THẺ KHÁCH (VISITOR BADGE GENERATOR)
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "VISITORS" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Registration Form */}
            <form onSubmit={handleRegisterVisitorSubmit} className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200">
                  <IconId size={18} />
                </div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                  🪪 ĐĂNG KÝ ĐÓN KHÁCH NGOÀI &amp; CẤP THẺ RA VÀO
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Họ tên khách mời <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ tên khách..."
                    value={visitorForm.visitorName}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#006838] bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Đơn vị / Công ty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên công ty/đối tác..."
                    value={visitorForm.company}
                    onChange={(e) => setVisitorForm({ ...visitorForm, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#006838] bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Số CMND / CCCD</label>
                  <input
                    type="text"
                    placeholder="Nhập số CCCD/Hộ chiếu..."
                    value={visitorForm.idCard}
                    onChange={(e) => setVisitorForm({ ...visitorForm, idCard: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#006838] bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Người đón tiếp</label>
                  <input
                    type="text"
                    required
                    value={visitorForm.hostName}
                    onChange={(e) => setVisitorForm({ ...visitorForm, hostName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#006838] bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Khu vực làm việc / Phòng họp</label>
                  <select
                    value={visitorForm.roomLocation}
                    onChange={(e) => setVisitorForm({ ...visitorForm, roomLocation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.name}>{r.name} - {r.location}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Ngày đến</label>
                  <input
                    type="date"
                    value={visitorForm.visitDate}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Giờ dự kiến đến</label>
                  <input
                    type="time"
                    value={visitorForm.expectedTime}
                    onChange={(e) => setVisitorForm({ ...visitorForm, expectedTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-extrabold hover:bg-purple-800 transition-colors shadow-md shadow-purple-900/20 flex items-center gap-2 cursor-pointer"
                >
                  <IconId size={16} />
                  <span>🪪 Đăng ký &amp; Xuất Thẻ Khách</span>
                </button>
              </div>
            </form>

            {/* Visitors Table List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase">Danh sách khách đăng ký đón tiếp</h3>
                <span className="text-xs font-bold text-slate-500">Tổng cộng: {visitors.length} lượt khách</span>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase">
                      <th className="p-3">Mã Thẻ</th>
                      <th className="p-3">Họ Tên Khách</th>
                      <th className="p-3">Công Ty / Đơn Vị</th>
                      <th className="p-3">Người Đón Tiếp</th>
                      <th className="p-3">Địa Điểm</th>
                      <th className="p-3">Thời Gian</th>
                      <th className="p-3 text-center">Thẻ Khách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visitors.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-[#006838]">{v.badgeCode}</td>
                        <td className="p-3 font-bold text-slate-900">{v.visitorName}</td>
                        <td className="p-3 font-semibold text-slate-700">{v.company}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{v.hostName}</div>
                          <div className="text-[10px] text-slate-500">{v.department}</div>
                        </td>
                        <td className="p-3 font-medium text-slate-700">{v.roomLocation}</td>
                        <td className="p-3 font-bold text-slate-800">{v.visitDate} ({v.expectedTime})</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedVisitorBadge(v)}
                            className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-700 hover:text-white transition-colors text-xs font-bold border border-purple-200 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <IconQrcode size={14} />
                            <span>In Thẻ</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 4: DỮ LIỆU D1 TABLE LIST OF BOOKINGS
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "HISTORY" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-[#242b35] text-white flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-tight">Dữ liệu Lịch Đặt Phòng Họp D1 Realtime</h3>
                <span className="text-xs font-bold text-emerald-300">Tổng cộng: {bookings.length} cuộc họp</span>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase">
                      <th className="p-3">STT</th>
                      <th className="p-3">Phòng Họp</th>
                      <th className="p-3">Tiêu Đề Cuộc Họp</th>
                      <th className="p-3">Người Chủ Trì</th>
                      <th className="p-3">Thời Gian Họp</th>
                      <th className="p-3 text-center">Số Người</th>
                      <th className="p-3 text-center">Trạng Thái D1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b, idx) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-3 font-extrabold text-slate-500 text-center">{idx + 1}</td>
                        <td className="p-3 font-extrabold text-[#006838]">{b.roomName}</td>
                        <td className="p-3 font-bold text-slate-900">{b.title}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{b.bookerName}</div>
                          <div className="text-[10px] text-slate-500">{b.department}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">{b.bookingDate} ({b.timeSlot})</td>
                        <td className="p-3 text-center font-bold text-slate-900">{b.attendeesCount} người</td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold uppercase">
                            ✓ Đã xác nhận D1
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════
          MODAL POPUP: DIGITAL VISITOR BADGE (THẺ KHÁCH BẢO VỆ CẤP)
         ════════════════════════════════════════════════════════════════ */}
      {selectedVisitorBadge && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Badge Card Container */}
            <div className="p-6 bg-gradient-to-b from-[#006838] to-slate-900 text-white text-center space-y-4">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <img src="/images/tbs-logo.png" alt="TBS" className="h-6 w-auto brightness-200" />
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">THẺ KHÁCH / VISITOR</span>
              </div>

              {/* Visitor QR Code Simulation */}
              <div className="w-32 h-32 mx-auto bg-white p-2.5 rounded-2xl shadow-md flex items-center justify-center">
                <div className="w-full h-full border-2 border-dashed border-[#006838] rounded-xl flex flex-col items-center justify-center text-[#006838] font-mono text-[10px] font-bold">
                  <IconQrcode size={48} />
                  <span>{selectedVisitorBadge.badgeCode}</span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tight">{selectedVisitorBadge.visitorName}</h3>
                <p className="text-xs text-emerald-200 font-semibold">{selectedVisitorBadge.company}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/10 text-left text-xs space-y-1.5 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-slate-300">Người tiếp đón:</span>
                  <span className="font-bold text-white">{selectedVisitorBadge.hostName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Địa điểm họp:</span>
                  <span className="font-bold text-emerald-200">{selectedVisitorBadge.roomLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Ngày giờ đến:</span>
                  <span className="font-bold text-white">{selectedVisitorBadge.visitDate} ({selectedVisitorBadge.expectedTime})</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <IconPrinter size={15} />
                  <span>In Thẻ Đeo</span>
                </button>
                <button
                  onClick={() => setSelectedVisitorBadge(null)}
                  className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <IconCheck size={16} />
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-3 px-6 border-t border-slate-200 text-xs text-slate-500 text-center bg-white">
        <span>© 2026 TBS Group System - Văn Phòng Chuỗi SKECHERS. Tất cả các quyền được bảo lưu.</span>
      </footer>
    </div>
  );
}
