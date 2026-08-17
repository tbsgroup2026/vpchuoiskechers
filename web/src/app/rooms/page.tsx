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
  IconChevronLeft,
  IconChevronRight,
  IconVideo,
  IconDeviceTv,
  IconCoffee,
  IconMicrophone,
  IconChecklist,
  IconEdit,
  IconSparkles,
  IconFileText,
  IconNotes,
} from "@tabler/icons-react";

interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  status: "AVAILABLE" | "BUSY" | "MAINTENANCE";
  isLocked: boolean;
  colorClass: string;
  badgeBg: string;
}

interface RoomBooking {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  bookerName: string;
  department: string;
  bookingDate: string; // DD/MM/YYYY
  timeSlot: string;
  attendeesCount: number;
  notes?: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
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
  const [activeTab, setActiveTab] = useState<"APPROVALS" | "BOOKING" | "ROOMS" | "VISITORS" | "CALENDAR">("APPROVALS");
  const [userRole, setUserRole] = useState<"LE_TAN" | "CBCNV">("LE_TAN");
  const [reassignModalBooking, setReassignModalBooking] = useState<RoomBooking | null>(null);
  const [newAssignedRoomId, setNewAssignedRoomId] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedVisitorBadge, setSelectedVisitorBadge] = useState<VisitorRecord | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<RoomBooking | null>(null);
  const [quickNoteModalOpen, setQuickNoteModalOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("15/08/2026");

  // User Profile
  const [currentUser, setCurrentUser] = useState<{ name: string; title: string; department: string; avatar: string }>({
    name: "Phạm Nguyễn Anh Huy (Lễ Tân)",
    title: "Chuyên Viên Lễ Tân & Tiếp Đón",
    department: "Bộ Phận Lễ Tân & Hành Chánh",
    avatar: "/images/tbs-logo.png",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tbs_current_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.name) {
            setCurrentUser(parsed);
          }
        } catch (e) {}
      }
    }
  }, []);

  // Default Rooms List matching TBS Group SKX Facilities
  const [rooms, setRooms] = useState<MeetingRoom[]>([
    {
      id: "room_1",
      name: "Phòng Họp OTI / OTG",
      capacity: 16,
      location: "Tầng 3 - VP Chuỗi SKECHERS",
      equipment: ["Máy chiếu 4K", "Micro không dây", "Bảng kính", "Trà nước"],
      status: "AVAILABLE",
      isLocked: false,
      colorClass: "bg-emerald-600 border-emerald-700 text-white",
      badgeBg: "bg-emerald-100 text-[#006838]",
    },
    {
      id: "room_2",
      name: "Phòng Họp WORK",
      capacity: 30,
      location: "Tầng 2 - VP Chuỗi SKECHERS",
      equipment: ["Màn hình LED 120 inch", "4 Micro", "Camera Zoom 360", "Trà nước"],
      status: "AVAILABLE",
      isLocked: false,
      colorClass: "bg-blue-600 border-blue-700 text-white",
      badgeBg: "bg-blue-100 text-blue-800",
    },
    {
      id: "room_3",
      name: "Phòng Họp MEN USA",
      capacity: 12,
      location: "Tầng 2 - Khối Thị Trường Mỹ",
      equipment: ["Smart TV 65 inch", "Hệ thống họp từ xa", "Bảng di động"],
      status: "AVAILABLE",
      isLocked: false,
      colorClass: "bg-purple-600 border-purple-700 text-white",
      badgeBg: "bg-purple-100 text-purple-800",
    },
    {
      id: "room_4",
      name: "Phòng Họp SOURCING",
      capacity: 15,
      location: "Tầng 1 - Trung Tâm Sourcing & Vật Tư",
      equipment: ["Máy chiếu 3D", "Bảng tương tác", "Tủ mẫu vật tư SKECHERS"],
      status: "AVAILABLE",
      isLocked: false,
      colorClass: "bg-amber-600 border-amber-700 text-white",
      badgeBg: "bg-amber-100 text-amber-900",
    },
    {
      id: "room_5",
      name: "Phòng Họp Chính",
      capacity: 25,
      location: "Tầng 3 - Hội Trường Trung Tâm",
      equipment: ["Hệ thống Âm thanh Hội thảo", "Màn hình LED", "Trà nước"],
      status: "AVAILABLE",
      isLocked: false,
      colorClass: "bg-indigo-600 border-indigo-700 text-white",
      badgeBg: "bg-indigo-100 text-indigo-800",
    },
    {
      id: "room_6",
      name: "Phòng Họp Phụ",
      capacity: 8,
      location: "Tầng 1 - Khu Hành Chánh & Nhân Sự",
      equipment: ["Smart TV 55 inch", "Bảng trắng", "Bàn phỏng vấn"],
      status: "AVAILABLE",
      isLocked: false,
      colorClass: "bg-rose-600 border-rose-700 text-white",
      badgeBg: "bg-rose-100 text-rose-800",
    },
  ]);

  // Initial Bookings List with Pending Approvals for Lễ Tân
  const [bookings, setBookings] = useState<RoomBooking[]>([
    {
      id: "b_101",
      roomId: "room_1",
      roomName: "Phòng Họp OTI / OTG",
      title: "Họp Giao Ban Khối Sản Xuất & Kế Hoạch Tuần 34",
      bookerName: "Nguyễn Văn Hùng",
      department: "Khối Sản Xuất",
      bookingDate: "15/08/2026",
      timeSlot: "08:00 - 09:30",
      attendeesCount: 14,
      notes: "Cần chuẩn bị máy chiếu 4K và 2 micro không dây.",
      status: "CONFIRMED",
      createdAt: "15/08/2026 07:30",
    },
    {
      id: "b_102",
      roomId: "room_2",
      roomName: "Phòng Họp WORK",
      title: "Họp Đánh Giá Tiến Độ Kaizen & Cải Tiến CN-CI",
      bookerName: "Lê Thị Mai",
      department: "CN-CI",
      bookingDate: "15/08/2026",
      timeSlot: "09:30 - 11:30",
      attendeesCount: 20,
      notes: "Yêu cầu Lễ Tân hỗ trợ trà nước & xếp màn hình LED 120 inch.",
      status: "PENDING",
      createdAt: "15/08/2026 08:15",
    },
    {
      id: "b_103",
      roomId: "room_3",
      roomName: "Phòng Họp MEN USA",
      title: "Phỏng Vấn Nhân Sự Cao Cấp SKECHERS Line B",
      bookerName: "Trần Hoàng Nam",
      department: "Nhân sự",
      bookingDate: "15/08/2026",
      timeSlot: "13:30 - 15:00",
      attendeesCount: 6,
      notes: "Cần Lễ Tân chuẩn bị phòng yên tĩnh đón đối tác nước ngoài.",
      status: "PENDING",
      createdAt: "15/08/2026 08:45",
    },
    {
      id: "b_104",
      roomId: "room_4",
      roomName: "Phòng Họp SOURCING",
      title: "Duyệt Mẫu Vật Tư Giày SKECHERS Q3/2026",
      bookerName: "Phạm Minh Anh",
      department: "R&D Kỹ thuật",
      bookingDate: "15/08/2026",
      timeSlot: "15:00 - 17:00",
      attendeesCount: 12,
      notes: "Trưng bày tủ mẫu và bảng tương tác.",
      status: "CONFIRMED",
      createdAt: "15/08/2026 09:00",
    },
  ]);

  // Initial Visitors List for Lễ Tân Reception Desk Check-in
  const [visitors, setVisitors] = useState<VisitorRecord[]>([
    {
      id: "v_201",
      badgeCode: "VIS-2026-881",
      visitorName: "Mr. David Miller",
      company: "SKECHERS USA Corp",
      idCard: "B92847109",
      hostName: "Ban Giám Đốc",
      department: "Văn Phòng Chuỗi SKECHERS",
      roomLocation: "Phòng Họp MEN USA",
      visitDate: "15/08/2026",
      expectedTime: "09:30",
      status: "CHECKED_IN",
      notes: "Đoàn chuyên gia kiểm tra tiêu chuẩn nhà máy.",
      createdAt: "15/08/2026 09:15",
    },
    {
      id: "v_202",
      badgeCode: "VIS-2026-882",
      visitorName: "Nguyễn Kim Ngân",
      company: "Công ty Vật Tư Da Giày Á Châu",
      idCard: "079201004821",
      hostName: "Trần Anh Tuấn",
      department: "Sourcing & Vật Tư",
      roomLocation: "Phòng Họp SOURCING",
      visitDate: "15/08/2026",
      expectedTime: "14:00",
      status: "EXPECTED",
      notes: "Giao mẫu nguyên phụ liệu mới.",
      createdAt: "15/08/2026 10:00",
    },
  ]);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    roomId: "room_1",
    title: "",
    bookerName: "Ban Quản Lý",
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
    hostName: "Ban Quản Lý",
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

  // Lễ Tân Actions
  const handleApproveBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "CONFIRMED" } : b))
    );
    showToast("👩‍💼 Lễ Tân đã phê duyệt & xếp phòng họp thành công!");
  };

  const handleRejectBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
    );
    showToast("❌ Lễ Tân đã từ chối yêu cầu đặt phòng.");
  };

  const handleConfirmReassignRoom = () => {
    if (!reassignModalBooking || !newAssignedRoomId) return;
    const targetRoom = rooms.find((r) => r.id === newAssignedRoomId);
    if (!targetRoom) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === reassignModalBooking.id
          ? { ...b, roomId: targetRoom.id, roomName: targetRoom.name, status: "CONFIRMED" }
          : b
      )
    );
    showToast(`👩‍💼 Lễ Tân đã điều chuyển cuộc họp sang "${targetRoom.name}"!`);
    setReassignModalBooking(null);
  };

  const handleVisitorCheckIn = (visitorId: string) => {
    setVisitors((prev) =>
      prev.map((v) => (v.id === visitorId ? { ...v, status: "CHECKED_IN" } : v))
    );
    showToast("🪪 Lễ Tân đã xác nhận khách đến (Check-in) & phát thẻ ra vào!");
  };

  const handleVisitorCheckOut = (visitorId: string) => {
    setVisitors((prev) =>
      prev.map((v) => (v.id === visitorId ? { ...v, status: "CHECKED_OUT" } : v))
    );
    showToast("📤 Lễ Tân đã thu hồi thẻ & hoàn tất thủ tục Check-out!");
  };

  // Sync Data with Cloudflare D1 Database
  const fetchD1RoomsData = async () => {
    try {
      const res = await fetch("/api/rooms");
      const result = await res.json();
      if (result.success && result.data) {
        if (Array.isArray(result.data.rooms) && result.data.rooms.length > 0) {
          setRooms((prev) =>
            result.data.rooms.map((r: any) => {
              const matched = prev.find((p) => p.id === r.id);
              return {
                id: r.id,
                name: r.name,
                capacity: r.capacity || 10,
                location: r.location,
                equipment: typeof r.equipment === "string" ? r.equipment.split(", ") : r.equipment || [],
                status: r.status || "AVAILABLE",
                isLocked: Boolean(r.is_locked),
                colorClass: matched?.colorClass || "bg-blue-600 border-blue-700 text-white",
                badgeBg: matched?.badgeBg || "bg-blue-100 text-blue-800",
              };
            })
          );
        }
        if (Array.isArray(result.data.bookings)) {
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
        if (Array.isArray(result.data.visitors)) {
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

  // Submit Room Booking / Quick Note
  const handleBookRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.title.trim()) {
      alert("Vui lòng nhập tiêu đề cuộc họp/ghi chú!");
      return;
    }

    const selectedRoom = rooms.find((r) => r.id === bookingForm.roomId) || rooms[0];
    const dateFmt = bookingForm.bookingDate.split("-").reverse().join("/");

    const newBooking: RoomBooking = {
      id: `b_${Date.now()}`,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      title: bookingForm.title,
      bookerName: bookingForm.bookerName || currentUser.name,
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
      showToast("Đã lưu ghi chú / lịch họp thành công vào D1 Database!");
    } catch (err) {
      showToast("Đã lưu lịch đặt phòng họp!");
    }

    setQuickNoteModalOpen(false);
    setActiveTab("CALENDAR");
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

  // Helper: Helper color getter for room cards
  const getRoomColorStyle = (roomName: string) => {
    if (roomName.includes("OTI") || roomName.includes("OTG")) return "bg-emerald-700 hover:bg-emerald-800 text-white";
    if (roomName.includes("WORK")) return "bg-blue-700 hover:bg-blue-800 text-white";
    if (roomName.includes("MEN USA")) return "bg-purple-700 hover:bg-purple-800 text-white";
    if (roomName.includes("SOURCING")) return "bg-amber-700 hover:bg-amber-800 text-white";
    if (roomName.includes("Chính")) return "bg-indigo-700 hover:bg-indigo-800 text-white";
    if (roomName.includes("Phụ") || roomName.includes("Phỏng Vấn")) return "bg-rose-700 hover:bg-rose-800 text-white";
    return "bg-slate-700 hover:bg-slate-800 text-white";
  };

  // Generate August 2026 Calendar Grid Days (35 cells: Sunday 26/07 to Saturday 29/08)
  const augustCalendarDays = Array.from({ length: 35 }, (_, idx) => {
    const dayNum = idx - 5; // 26/07 is idx 0
    let dateStr = "";
    let isCurrentMonth = true;
    let displayDay = 1;

    if (dayNum <= 0) {
      isCurrentMonth = false;
      displayDay = 26 + (dayNum + 5);
      dateStr = `${displayDay < 10 ? "0" + displayDay : displayDay}/07/2026`;
    } else if (dayNum <= 31) {
      isCurrentMonth = true;
      displayDay = dayNum;
      dateStr = `${displayDay < 10 ? "0" + displayDay : displayDay}/08/2026`;
    } else {
      isCurrentMonth = false;
      displayDay = dayNum - 31;
      dateStr = `0${displayDay}/09/2026`;
    }

    const dayBookings = bookings.filter((b) => b.bookingDate === dateStr);
    const isToday = dateStr === "15/08/2026";

    return {
      idx,
      displayDay,
      dateStr,
      isCurrentMonth,
      isToday,
      dayBookings,
    };
  });

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
          {/* Executive Role Switcher: Lễ Tân vs CBCNV */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006838]/10 border border-[#006838]/30">
            <span className="text-[11px] font-extrabold text-[#006838] hidden lg:inline">Vai trò:</span>
            <button
              onClick={() => {
                const nextRole = userRole === "LE_TAN" ? "CBCNV" : "LE_TAN";
                setUserRole(nextRole);
                showToast(`Đã chuyển vai trò: ${nextRole === "LE_TAN" ? "👩‍💼 Lễ Tân (Xác nhận phòng & Xếp lịch)" : "👤 Cán Bộ Công Nhân Viên"}`);
              }}
              className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                userRole === "LE_TAN"
                  ? "bg-[#006838] text-white hover:bg-[#00522c]"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {userRole === "LE_TAN" ? (
                <>
                  <span>👩‍💼 Vai Trò: Lễ Tân</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">Duyệt &amp; Xếp lịch</span>
                </>
              ) : (
                <>
                  <span>👤 Vai Trò: CBCNV</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">Đăng ký phòng</span>
                </>
              )}
            </button>
          </div>

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
              src={currentUser.avatar || "/images/crawled/Da-giay1.jpg"}
              alt="Avatar"
              className="w-8 h-8 rounded-full border-2 border-[#006838] object-cover"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">
                {userRole === "LE_TAN" ? "Phạm Nguyễn Anh Huy (Lễ Tân)" : currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {userRole === "LE_TAN" ? "Bộ Phận Lễ Tân & Hành Chánh" : currentUser.department}
              </div>
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
            Hệ thống lịch tổng hợp cuộc họp, đăng ký tài nguyên phòng họp và đón khách đối tác
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
              <div className="text-xl font-black text-slate-900">
                {bookings.filter((b) => b.bookingDate === "15/08/2026").length} Cuộc họp
              </div>
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
            TOP NAVIGATION TABS (5 TABS INCLUDING LỄ TÂN DESK)
           ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-start border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("APPROVALS")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "APPROVALS"
                ? "bg-[#006838] text-white border-[#006838] shadow-md"
                : "bg-white text-slate-700 hover:text-[#006838] border-slate-200"
            }`}
          >
            <IconChecklist size={17} />
            <span>🛎️ Bàn Lễ Tân (Xác nhận &amp; Xếp lịch)</span>
            {bookings.filter((b) => b.status === "PENDING").length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[11px] font-black animate-pulse">
                {bookings.filter((b) => b.status === "PENDING").length} chờ duyệt
              </span>
            )}
          </button>

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
            onClick={() => setActiveTab("CALENDAR")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "CALENDAR"
                ? "bg-white text-[#006838] border-[#006838] shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <IconCalendar size={17} />
            <span>📅 Lịch tổng hợp cuộc họp</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#006838] text-[11px] font-extrabold">
              {bookings.length}
            </span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB 0: 🛎️ BÀN LỄ TÂN (XÁC NHẬN PHÒNG, ĐỔI PHÒNG, XẾP LỊCH, ĐÓN KHÁCH)
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "APPROVALS" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Lễ Tân Executive Dashboard Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#006838] via-[#043322] to-slate-900 text-white shadow-lg space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
                    👩‍💼
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">
                      BỘ PHẬN LỄ TÂN &amp; QUẢN LÝ TÀI NGUYÊN
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      Bàn Lễ Tân — Duyệt Phòng, Xếp Lịch &amp; Đón Tiếp Khách
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-extrabold border border-emerald-400/30">
                    🟢 Đang Hoạt Động (Ca Sáng)
                  </span>
                </div>
              </div>

              {/* Quick Status Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                  <span className="text-[11px] font-bold text-amber-300 block">Yêu cầu chờ Lễ tân duyệt</span>
                  <div className="text-2xl font-black text-white">
                    {bookings.filter((b) => b.status === "PENDING").length} Yêu cầu
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                  <span className="text-[11px] font-bold text-emerald-300 block">Cuộc họp đã xác nhận</span>
                  <div className="text-2xl font-black text-white">
                    {bookings.filter((b) => b.status === "CONFIRMED").length} Cuộc họp
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                  <span className="text-[11px] font-bold text-purple-300 block">Khách đang tại Lễ tân</span>
                  <div className="text-2xl font-black text-white">
                    {visitors.filter((v) => v.status === "CHECKED_IN").length} Lượt khách
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                  <span className="text-[11px] font-bold text-blue-300 block">Phòng họp trống khả dụng</span>
                  <div className="text-2xl font-black text-white">
                    {rooms.filter((r) => !r.isLocked && r.status === "AVAILABLE").length} / {rooms.length} Phòng
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 1: YÊU CẦU ĐẶT PHÒNG HỌP CHỜ LỄ TÂN PHÊ DUYỆT & XẾP PHÒNG */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    🟡 Yêu Cầu Đăng Ký Phòng Họp Chờ Lễ Tân Xác Nhận
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {bookings.filter((b) => b.status === "PENDING").length} yêu cầu đang chờ
                </span>
              </div>

              {bookings.filter((b) => b.status === "PENDING").length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-500">
                    🎉 Không có yêu cầu nào đang chờ duyệt. Tất cả phòng họp đã được Lễ Tân sắp xếp ổn định!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings
                    .filter((b) => b.status === "PENDING")
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-300 transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase border border-amber-300">
                              Chờ Lễ Tân duyệt
                            </span>
                            <span className="text-xs font-extrabold text-[#006838]">
                              {booking.roomName}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              • {booking.bookingDate} ({booking.timeSlot})
                            </span>
                          </div>

                          <h4 className="text-base font-black text-slate-900">{booking.title}</h4>

                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                            <span>👤 Người đăng ký: <strong className="text-slate-900">{booking.bookerName}</strong> ({booking.department})</span>
                            <span>👥 Tham dự: <strong className="text-slate-900">{booking.attendeesCount} người</strong></span>
                          </div>

                          {booking.notes && (
                            <p className="text-xs italic text-slate-500 bg-white/70 p-2 rounded-xl border border-slate-200/60 mt-1">
                              💬 Ghi chú: {booking.notes}
                            </p>
                          )}
                        </div>

                        {/* Lễ Tân Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <button
                            onClick={() => handleApproveBooking(booking.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <IconCheck size={16} />
                            <span>Duyệt &amp; Xếp Phòng</span>
                          </button>

                          <button
                            onClick={() => {
                              setReassignModalBooking(booking);
                              setNewAssignedRoomId(booking.roomId);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <IconEdit size={15} />
                            <span>Đổi Phòng Họp</span>
                          </button>

                          <button
                            onClick={() => handleRejectBooking(booking.id)}
                            className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <IconX size={15} />
                            <span>Từ Chối</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* SECTION 2: QUẢN LÝ & ĐIỀU CHỈNH PHÒNG HỌP ĐÃ XÁC NHẬN */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 uppercase">
                  🟢 Lịch Họp Đã Phê Duyệt &amp; Sắp Xếp Bởi Lễ Tân
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {bookings.filter((b) => b.status === "CONFIRMED").length} cuộc họp đã duyệt
                </span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase">
                      <th className="p-3">Thời Gian</th>
                      <th className="p-3">Phòng Họp</th>
                      <th className="p-3">Cuộc Họp</th>
                      <th className="p-3">Chủ Trì / Bộ Phận</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3 text-center">Thao Tác Lễ Tân</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings
                      .filter((b) => b.status === "CONFIRMED")
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 font-medium">
                          <td className="p-3 font-bold text-blue-900">
                            {b.bookingDate}
                            <div className="text-[10px] text-slate-500 font-normal">{b.timeSlot}</div>
                          </td>
                          <td className="p-3 font-extrabold text-[#006838]">{b.roomName}</td>
                          <td className="p-3 font-bold text-slate-900">{b.title}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{b.bookerName}</div>
                            <div className="text-[10px] text-slate-500">{b.department}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold uppercase">
                              ✓ Đã duyệt
                            </span>
                          </td>
                          <td className="p-3 text-center space-x-1.5">
                            <button
                              onClick={() => {
                                setReassignModalBooking(b);
                                setNewAssignedRoomId(b.roomId);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white transition-colors text-xs font-bold border border-blue-200 cursor-pointer"
                            >
                              Đổi phòng
                            </button>
                            <button
                              onClick={() => {
                                setBookings((prev) =>
                                  prev.map((item) =>
                                    item.id === b.id ? { ...item, status: "COMPLETED" } : item
                                  )
                                );
                                showToast(`🏁 Lễ Tân đã đánh dấu hoàn thành cuộc họp "${b.title}"!`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white transition-colors text-xs font-bold border border-slate-200 cursor-pointer"
                            >
                              Trả phòng
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: BÀN LỄ TÂN ĐÓN KHÁCH (CHECK-IN & CHECK-OUT KHÁCH ĐỐI TÁC) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 uppercase">
                  🪪 Bàn Lễ Tân Đón Khách Đối Tác &amp; Cấp Thẻ Ra Vào
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {visitors.length} lượt khách trong ngày
                </span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase">
                      <th className="p-3">Mã Thẻ</th>
                      <th className="p-3">Tên Khách / Công Ty</th>
                      <th className="p-3">Đón Tiếp Tại</th>
                      <th className="p-3">Thời Gian 到</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3 text-center">Thao Tác Lễ Tân</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visitors.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-[#006838]">{v.badgeCode}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{v.visitorName}</div>
                          <div className="text-[10px] text-slate-500">{v.company}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{v.roomLocation}</div>
                          <div className="text-[10px] text-slate-500">Đón bởi: {v.hostName}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {v.visitDate} ({v.expectedTime})
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              v.status === "CHECKED_IN"
                                ? "bg-emerald-100 text-[#006838]"
                                : v.status === "CHECKED_OUT"
                                ? "bg-slate-200 text-slate-700"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {v.status === "CHECKED_IN"
                              ? "🟢 Đã Check-in"
                              : v.status === "CHECKED_OUT"
                              ? "⚪ Đã Check-out"
                              : "🟡 Chờ khách đến"}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-1.5">
                          {v.status === "EXPECTED" && (
                            <button
                              onClick={() => handleVisitorCheckIn(v.id)}
                              className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                            >
                              📥 Check-in (Khách đến)
                            </button>
                          )}
                          {v.status === "CHECKED_IN" && (
                            <button
                              onClick={() => handleVisitorCheckOut(v.id)}
                              className="px-3 py-1 rounded-xl bg-slate-700 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              📤 Check-out (Khách về)
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedVisitorBadge(v)}
                            className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-700 hover:text-white transition-colors border border-purple-200 cursor-pointer"
                          >
                            🪪 In Thẻ
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
            TAB 1: 📅 LỊCH TỔNG HỢP CUỘC HỌP (COMPACT MONTHLY CALENDAR GRID)
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "CALENDAR" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Top Month Header & Controls Bar */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button className="px-2.5 py-1 rounded-lg bg-blue-800 text-white font-bold text-xs hover:bg-blue-900 transition-colors flex items-center gap-0.5 shadow-2xs">
                  <IconChevronLeft size={14} />
                  <IconChevronRight size={14} />
                </button>
                <button
                  onClick={() => showToast("Đã chuyển về ngày hôm nay 15/08/2026")}
                  className="px-2.5 py-1 rounded-lg bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <IconCalendar size={13} />
                  <span>Hôm nay</span>
                </button>
              </div>

              {/* Month Title */}
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight text-center">
                tháng 8 năm 2026
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBookingForm({
                      roomId: "room_1",
                      title: "",
                      bookerName: currentUser.name,
                      department: "Hành chính",
                      bookingDate: "2026-08-15",
                      timeSlot: "09:00 - 10:30",
                      attendeesCount: 5,
                      notes: "",
                      needsTeaCoffee: true,
                      needsProjector: true,
                    });
                    setQuickNoteModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#006838] text-white font-extrabold text-xs hover:bg-[#00522c] transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <IconPlus size={14} />
                  <span>Note cuộc họp mới</span>
                </button>
              </div>
            </div>

            {/* Room Legends Bar */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 flex flex-wrap items-center gap-2.5 text-[11px] font-bold text-slate-700">
              <span className="text-slate-500 uppercase text-[10px] font-extrabold">Chú thích phòng:</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> OTI / OTG</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> WORK</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> MEN USA</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> SOURCING</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Phòng Chính</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Phòng Họp Phụ</span>
            </div>

            {/* Compact Month Calendar Table Grid (7 Columns) */}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
              {/* Day Name Headers */}
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-300 text-center text-[11px] font-black text-blue-900 uppercase">
                <div className="py-1.5 border-r border-slate-200">CN</div>
                <div className="py-1.5 border-r border-slate-200">THỨ 2</div>
                <div className="py-1.5 border-r border-slate-200">THỨ 3</div>
                <div className="py-1.5 border-r border-slate-200">THỨ 4</div>
                <div className="py-1.5 border-r border-slate-200">THỨ 5</div>
                <div className="py-1.5 border-r border-slate-200">THỨ 6</div>
                <div className="py-1.5">THỨ 7</div>
              </div>

              {/* 35 Calendar Day Cells (5 Rows x 7 Columns) */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-100">
                {augustCalendarDays.map((dayObj) => (
                  <div
                    key={dayObj.idx}
                    onClick={() => {
                      setSelectedCalendarDate(dayObj.dateStr);
                      setBookingForm({
                        ...bookingForm,
                        bookingDate: dayObj.dateStr.split("/").reverse().join("-"),
                      });
                    }}
                    className={`min-h-[65px] sm:min-h-[78px] md:min-h-[85px] p-1 transition-all flex flex-col justify-between cursor-pointer ${
                      dayObj.isCurrentMonth ? "bg-white" : "bg-slate-50/60 text-slate-300"
                    } ${dayObj.isToday ? "bg-blue-50/40 ring-2 ring-blue-600 ring-inset" : "hover:bg-slate-50"}`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-[10px] font-black inline-flex items-center justify-center rounded-full w-5 h-5 ${
                          dayObj.isToday
                            ? "bg-blue-700 text-white shadow-2xs"
                            : dayObj.isCurrentMonth
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                      >
                        {dayObj.displayDay}
                      </span>
                      {dayObj.isToday && (
                        <span className="text-[8px] font-extrabold uppercase text-blue-700 bg-blue-100 px-1 py-0.2 rounded-full">
                          Hôm nay
                        </span>
                      )}
                    </div>

                    {/* Day Event Cards Stack */}
                    <div className="space-y-0.5 overflow-y-auto max-h-[60px] flex-1">
                      {dayObj.dayBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventModal(b);
                          }}
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold leading-tight shadow-2xs transition-all hover:scale-[1.02] cursor-pointer truncate ${getRoomColorStyle(
                            b.roomName
                          )}`}
                          title={`${b.timeSlot} | ${b.roomName} - ${b.title}`}
                        >
                          <span className="opacity-90 font-mono text-[8px] mr-1">{b.timeSlot.split(" - ")[0]}</span>
                          <span className="truncate">{b.roomName.replace("Phòng Họp ", "")}: {b.title}</span>
                        </div>
                      ))}
                    </div>

                    {/* Day Quick Add Hint */}
                    <div className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCalendarDate(dayObj.dateStr);
                          setBookingForm({
                            roomId: "room_1",
                            title: "",
                            bookerName: currentUser.name,
                            department: "Hành chính",
                            bookingDate: dayObj.dateStr.split("/").reverse().join("-"),
                            timeSlot: "09:00 - 10:30",
                            attendeesCount: 5,
                            notes: "",
                            needsTeaCoffee: true,
                            needsProjector: true,
                          });
                          setQuickNoteModalOpen(true);
                        }}
                        className="text-[8px] font-bold text-slate-400 hover:text-[#006838] transition-colors"
                      >
                        + Note
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                    Tiêu đề cuộc họp / Ghi chú <span className="text-rose-500">*</span>
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
                    <option value="Khối Sản Xuất">Khối Sản Xuất</option>
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
                    <option value="08:00 - 17:00">Cả ngày (08:00 - 17:00)</option>
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
                      <option key={r.id} value={r.name}>{r.name}</option>
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


      </main>

      {/* ════════════════════════════════════════════════════════════════
          MODAL POPUP: QUICK NOTE / BOOKING MODAL FOR CALENDAR CELL
         ════════════════════════════════════════════════════════════════ */}
      {quickNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-[#006838] to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconNotes size={20} />
                <h3 className="text-base font-black uppercase tracking-tight">Thêm ghi chú cuộc họp ngày {selectedCalendarDate}</h3>
              </div>
              <button onClick={() => setQuickNoteModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleBookRoomSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Tiêu đề cuộc họp / Nội dung ghi chú *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Họp triển khai Kaizen A1..."
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-[#006838] bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Phòng họp</label>
                  <select
                    value={bookingForm.roomId}
                    onChange={(e) => setBookingForm({ ...bookingForm, roomId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Khung giờ họp</label>
                  <select
                    value={bookingForm.timeSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                  >
                    <option value="08:00 - 09:30">08:00 - 09:30 (Sáng)</option>
                    <option value="09:30 - 11:30">09:30 - 11:30 (Sáng)</option>
                    <option value="13:30 - 15:00">13:30 - 15:00 (Chiều)</option>
                    <option value="15:00 - 17:00">15:00 - 17:00 (Chiều)</option>
                    <option value="08:00 - 17:00">Cả ngày (08:00 - 17:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Người chủ trì</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.bookerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-[#006838]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Bộ phận</label>
                  <input
                    type="text"
                    value={bookingForm.department}
                    onChange={(e) => setBookingForm({ ...bookingForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-[#006838]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Ghi chú bổ sung</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết nội dung cuộc họp..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium outline-none focus:border-[#006838]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#006838] text-white font-extrabold hover:bg-[#00522c] cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <IconCheck size={16} />
                  <span>Lưu cuộc họp vào D1</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL POPUP: EVENT DETAIL MODAL (KHI CLICK VÀO CUỘC HỌP TRÊN LỊCH)
         ════════════════════════════════════════════════════════════════ */}
      {selectedEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCalendar size={20} />
                <h3 className="text-base font-black tracking-tight">Chi Tiết Cuộc Họp</h3>
              </div>
              <button onClick={() => setSelectedEventModal(null)} className="text-white/80 hover:text-white cursor-pointer">
                <IconX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Tiêu đề cuộc họp</span>
                <h4 className="text-base font-black text-slate-900">{selectedEventModal.title}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700 font-medium">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">Phòng họp:</span>
                  <span className="font-extrabold text-[#006838]">{selectedEventModal.roomName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">Thời gian:</span>
                  <span className="font-extrabold text-blue-900">{selectedEventModal.bookingDate} ({selectedEventModal.timeSlot})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">Người chủ trì:</span>
                  <span className="font-bold text-slate-900">{selectedEventModal.bookerName} ({selectedEventModal.department})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">Số người tham dự:</span>
                  <span className="font-bold text-slate-900">{selectedEventModal.attendeesCount} người</span>
                </div>
              </div>

              {selectedEventModal.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Ghi chú nội dung:</span>
                  <p className="text-slate-800 font-medium mt-0.5">{selectedEventModal.notes}</p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold">
                  ✓ Đã đồng bộ D1 Database
                </span>
                <button
                  onClick={() => setSelectedEventModal(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* ════════════════════════════════════════════════════════════════
          MODAL POPUP: LỄ TÂN ĐỔI PHÒNG HỌP (ROOM RE-ASSIGNMENT MODAL)
         ════════════════════════════════════════════════════════════════ */}
      {reassignModalBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-blue-800 to-[#006838] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconEdit size={20} />
                <h3 className="text-base font-black uppercase tracking-tight">👩‍💼 Lễ Tân Sắp Xếp / Đổi Phòng Họp</h3>
              </div>
              <button onClick={() => setReassignModalBooking(null)} className="text-white/80 hover:text-white cursor-pointer">
                <IconX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">Cuộc họp cần điều chuyển</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">{reassignModalBooking.title}</h4>
                <p className="text-slate-600 font-semibold mt-1">
                  Đăng ký bởi: {reassignModalBooking.bookerName} ({reassignModalBooking.department}) • {reassignModalBooking.attendeesCount} người
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-800 block text-xs">
                  Chọn phòng họp mới thích hợp:
                </label>
                <select
                  value={newAssignedRoomId}
                  onChange={(e) => setNewAssignedRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:border-[#006838] bg-white cursor-pointer"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id} disabled={r.isLocked}>
                      {r.name} (Sức chứa {r.capacity} người - {r.location}) {r.isLocked ? "[Khóa bảo trì]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignModalBooking(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReassignRoom}
                  className="px-6 py-2 rounded-xl bg-[#006838] text-white font-extrabold hover:bg-[#00522c] cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <IconCheck size={16} />
                  <span>Xác nhận Đổi &amp; Xếp Lịch</span>
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
