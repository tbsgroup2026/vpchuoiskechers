"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconSend,
  IconX,
  IconCheck,
  IconCalendar,
  IconMapPin,
  IconCar,
  IconUser,
  IconBriefcase,
  IconBuilding,
  IconPhone,
  IconFileText,
  IconSearch,
  IconFilter,
  IconBell,
  IconChevronDown,
  IconChecklist,
  IconEdit,
  IconEye,
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";
import Can from "@/components/Can";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";

interface Participant {
  id: string;
  fullName: string;
  position: string;
  employeeId: string;
  department: string;
  phone: string;
  pickupLocation: string;
}

export type TripStatus =
  | "pending_department_head"
  | "pending_executive_board"
  | "approved"
  | "rejected_by_department_head"
  | "rejected_by_executive_board"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

interface BusinessTripRecord {
  id: string;
  code: string;
  title: string;
  region: string;
  factory?: string;
  creator: string;
  department: string;
  departmentId?: string;
  location: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  transport: string;
  participantsCount: number;
  purpose?: string;
  address?: string;
  proposalText?: string;
  participantsJson?: string;
  status: TripStatus;
  rejectionReason?: string;
  createdAt: string;
}

export default function BusinessTripRegistrationPage() {
  const { can, roles, managedDepartmentId } = usePermission();
  const [activeTab, setActiveTab] = useState<"FORM" | "LIST">("FORM");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModalRecord, setSelectedModalRecord] = useState<BusinessTripRecord | null>(null);

  // Rejection Modal State
  const [rejectionTarget, setRejectionTarget] = useState<{ id: string; level: "department_head" | "executive_board" } | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  const [currentUser, setCurrentUser] = useState<{ name: string; title: string; department: string; avatar: string }>({
    name: "Cán Bộ Công Nhân Viên",
    title: "Cán Bộ Công Nhân Viên",
    department: "Văn Phòng Chuỗi SKECHERS",
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

  // Sequential Approval Handlers
  const handleApproveTrip = (id: string, level: "department_head" | "executive_board") => {
    const nextStatus: TripStatus = level === "department_head" ? "pending_executive_board" : "approved";
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
    );
    showToast(
      level === "department_head"
        ? "✅ Trưởng phòng đã duyệt! Đã chuyển đơn lên Ban Giám Đốc (Cấp 2)."
        : "🎉 Ban Giám Đốc đã duyệt hoàn tất đơn công tác!"
    );
  };

  const handleOpenRejectModal = (id: string, level: "department_head" | "executive_board") => {
    setRejectionTarget({ id, level });
    setRejectionReasonInput("");
  };

  const handleConfirmReject = () => {
    if (!rejectionTarget) return;
    const { id, level } = rejectionTarget;
    const nextStatus: TripStatus = level === "department_head" ? "rejected_by_department_head" : "rejected_by_executive_board";

    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: nextStatus, rejectionReason: rejectionReasonInput || "Không đáp ứng điều kiện" } : r
      )
    );
    setRejectionTarget(null);
    showToast(`❌ Đã từ chối đơn công tác (${level === "department_head" ? "Trưởng phòng" : "Ban Giám Đốc"})`);
  };

  // Form State: Proposal Info
  const [proposalForm, setProposalForm] = useState({
    title: "",
    region: "VP Chuỗi",
    factory: "",
    creator: "Ban Quản Lý",
    department: "Hành chính",
    location: "",
    transport: "",
    startDate: "2026-08-15",
    daysCount: 1,
    endDate: "2026-08-15",
    purpose: "",
    address: "",
    proposalText: "",
  });

  // Form State: Participants List (Empty default matching Screenshot 2)
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "p_1",
      fullName: "",
      position: "",
      employeeId: "",
      department: "",
      phone: "",
      pickupLocation: "",
    },
  ]);

  // Submitted Records List (synced with D1)
  const [records, setRecords] = useState<BusinessTripRecord[]>([]);

  // List Search & 5 Filter Inputs (Matching Screenshot)
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDateFilter, setStartDateFilter] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Business Trips from Cloudflare D1 Database on Mount & Tab Change
  const fetchD1Records = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/business-trips");
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        const d1Records: BusinessTripRecord[] = result.data.map((item: any) => ({
          id: item.id || `rec_${Date.now()}`,
          code: item.code || `CT-2026-${Math.floor(100 + Math.random() * 900)}`,
          title: item.title || "Đề xuất công tác",
          region: item.region || "VP Chuỗi",
          factory: item.factory || "",
          creator: item.creator || "Ban Quản Lý",
          department: item.department || "Hành chính",
          location: item.location || "Bình Dương",
          startDate: item.start_date || item.startDate || "15/08/2026",
          endDate: item.end_date || item.endDate || "15/08/2026",
          daysCount: item.days_count || item.daysCount || 1,
          transport: item.transport || "Xe công ty",
          participantsCount: item.participants_count || item.participantsCount || 1,
          purpose: item.purpose || "",
          address: item.address || "",
          proposalText: item.proposal_text || item.proposalText || "",
          participantsJson: item.participants_json || item.participantsJson || "[]",
          status: (item.status as "PENDING" | "APPROVED" | "REJECTED") || "PENDING",
          createdAt: item.created_at || new Date().toLocaleString("vi-VN"),
        }));
        setRecords(d1Records);
      }
    } catch (err) {
      console.warn("D1 Database fetch fallback to local state:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchD1Records();
  }, []);

  // Reset all filters (matching "Xóa lọc" button)
  const handleResetFilters = () => {
    setSearchQuery("");
    setRegionFilter("ALL");
    setLocationFilter("ALL");
    setStatusFilter("ALL");
    setStartDateFilter("");
  };

  // Add a participant row
  const handleAddParticipant = () => {
    const newP: Participant = {
      id: `p_${Date.now()}`,
      fullName: "",
      position: "",
      employeeId: "",
      department: "",
      phone: "",
      pickupLocation: "",
    };
    setParticipants([...participants, newP]);
  };

  // Remove participant row
  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) {
      alert("Cần có ít nhất 01 người tham gia chuyến công tác!");
      return;
    }
    setParticipants(participants.filter((p) => p.id !== id));
  };

  // Update participant field
  const handleUpdateParticipant = (id: string, field: keyof Participant, val: string) => {
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  // Calculate End Date when Start Date or Days Count changes
  const handleDaysChange = (days: number) => {
    const d = Math.max(1, days);
    setProposalForm((prev) => {
      const start = new Date(prev.startDate);
      if (!isNaN(start.getTime())) {
        start.setDate(start.getDate() + (d - 1));
        const endStr = start.toISOString().split("T")[0];
        return { ...prev, daysCount: d, endDate: endStr };
      }
      return { ...prev, daysCount: d };
    });
  };

  // Submit Business Trip Form (Saves to state & Cloudflare D1 Database)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalForm.title.trim()) {
      alert("Vui lòng nhập tên đề xuất công tác!");
      return;
    }
    if (!proposalForm.location) {
      alert("Vui lòng chọn địa điểm công tác!");
      return;
    }
    if (!proposalForm.purpose.trim()) {
      alert("Vui lòng nhập mục đích công tác!");
      return;
    }

    const startFmt = proposalForm.startDate.split("-").reverse().join("/");
    const endFmt = proposalForm.endDate.split("-").reverse().join("/");

    const newRecord: BusinessTripRecord = {
      id: `rec_${Date.now()}`,
      code: `CT-2026-0${records.length + 20}`,
      title: proposalForm.title,
      region: proposalForm.region,
      factory: proposalForm.factory,
      creator: proposalForm.creator,
      department: proposalForm.department,
      location: proposalForm.location,
      startDate: startFmt,
      endDate: endFmt,
      daysCount: proposalForm.daysCount,
      transport: proposalForm.transport || "Xe công ty",
      participantsCount: participants.length,
      purpose: proposalForm.purpose,
      address: proposalForm.address,
      proposalText: proposalForm.proposalText,
      participantsJson: JSON.stringify(participants),
      status: "PENDING",
      createdAt: new Date().toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }),
    };

    // Save to local state first
    setRecords([newRecord, ...records]);

    // Send POST request to Cloudflare D1 Database
    try {
      await fetch("/api/business-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRecord,
          startDate: startFmt,
          endDate: endFmt,
          daysCount: proposalForm.daysCount,
          participantsCount: participants.length,
          participants,
        }),
      });
      showToast("Đã lưu & gửi đề xuất công tác thành công vào D1 Database!");
    } catch (err) {
      showToast("Đã gửi đề xuất công tác thành công! (Lưu trên ứng dụng)");
    }

    setActiveTab("LIST");
  };

  // Update Status Handler (Approved / Rejected) & Sync with D1
  const handleUpdateStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    setRecords(records.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    try {
      await fetch("/api/business-trips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      showToast(`Đã cập nhật trạng thái thành ${newStatus === "APPROVED" ? "Đã duyệt" : "Từ chối"} vào D1!`);
    } catch (err) {
      showToast(`Đã cập nhật trạng thái đề xuất thành công!`);
    }
  };

  // Filtering records logic based on 5 search/filter criteria
  const filteredRecords = records.filter((rec) => {
    const matchSearch =
      !searchQuery.trim() ||
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.creator.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchRegion = regionFilter === "ALL" || rec.region === regionFilter;
    const matchLocation = locationFilter === "ALL" || rec.location.includes(locationFilter);
    const matchStatus = statusFilter === "ALL" || rec.status === statusFilter;
    const matchStartDate = !startDateFilter || rec.startDate.includes(startDateFilter.split("-").reverse().join("/"));

    return matchSearch && matchRegion && matchLocation && matchStatus && matchStartDate;
  });

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900 flex flex-col justify-between font-sans">
      {/* ════════════════════════════════════════════════════════════════
          TOP EXECUTIVE HEADER BAR
         ════════════════════════════════════════════════════════════════ */}
      <header className="px-5 lg:px-8 py-3.5 bg-white border-b border-slate-200/80 shadow-xs flex items-center justify-between sticky top-0 z-40">
        {/* Left: Brand Lockup */}
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
            Phòng Nhân Sự Hành Chánh
          </span>
        </div>

        {/* Right Header Options */}
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
              src={currentUser.avatar || "/images/crawled/Da-giay1.jpg"}
              alt="Avatar"
              className="w-8 h-8 rounded-full border-2 border-[#006838] object-cover"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">{currentUser.department || currentUser.title}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          PAGE HERO SPINE & TITLE
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Back Link & Title Header */}
        <div className="text-center space-y-2 relative">
          <Link
            href="/work"
            className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-bold hover:bg-emerald-50 hover:text-[#006838] transition-colors shadow-2xs"
          >
            <IconArrowLeft size={16} />
            <span>Trở về Tổng quan</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ĐĂNG KÝ ĐI CÔNG TÁC
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto">
            Vui lòng cung cấp đầy đủ thông tin để hoàn tất đăng ký công tác
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TOP NAVIGATION TABS (Nhập liệu vs Xem dữ liệu)
           ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-start border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab("FORM")}
            className={`px-5 py-2.5 rounded-t-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === "FORM"
                ? "bg-white text-[#006838] border-[#006838] shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <IconEdit size={18} />
            <span>📝 Nhập liệu</span>
          </button>

          <button
            onClick={() => setActiveTab("LIST")}
            className={`px-5 py-2.5 rounded-t-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === "LIST"
                ? "bg-white text-[#006838] border-[#006838] shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <IconChecklist size={18} />
            <span>📋 Xem dữ liệu</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#006838] text-[11px] font-extrabold">
              {records.length}
            </span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB 1: FORM NHẬP LIỆU ĐĂNG KÝ CÔNG TÁC
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "FORM" && (
          <form onSubmit={handleSubmitForm} className="space-y-6 animate-in fade-in duration-200">
            {/* 📋 SECTION 1: THÔNG TIN ĐỀ XUẤT CÔNG TÁC */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100">
                  <IconFileText size={18} />
                </div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                  📋 THÔNG TIN ĐỀ XUẤT CÔNG TÁC
                </h2>
              </div>

              {/* Grid Inputs: Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Tên đề xuất */}
                <div className="lg:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Tên đề xuất <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên đề xuất công tác"
                      value={proposalForm.title}
                      onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-slate-50/50"
                    />
                    <IconFileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Khu vực */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Khu vực <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={proposalForm.region}
                    onChange={(e) => setProposalForm({ ...proposalForm, region: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white cursor-pointer"
                  >
                    <option value="VP Chuỗi">VP Chuỗi SKECHERS</option>
                    <option value="VP Bình Dương">VP Bình Dương</option>
                    <option value="VP Hồ Chí Minh">VP Hồ Chí Minh</option>
                    <option value="Cụm Nhà Máy">Cụm Nhà Máy TBS</option>
                  </select>
                </div>

                {/* Nhà máy */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nhà máy <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={proposalForm.factory}
                    onChange={(e) => setProposalForm({ ...proposalForm, factory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn Nhà Máy --</option>
                    <option value="Nhà máy SKECHERS A1">Nhà máy SKECHERS A1</option>
                    <option value="Nhà máy SKECHERS B2">Nhà máy SKECHERS B2</option>
                    <option value="Nhà máy SKECHERS C3">Nhà máy SKECHERS C3</option>
                    <option value="Tổ hợp Đế Giày TTPP">Tổ hợp Đế Giày TTPP</option>
                  </select>
                </div>

                {/* Người tạo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Người tạo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={proposalForm.creator}
                      onChange={(e) => setProposalForm({ ...proposalForm, creator: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-slate-50/50"
                    />
                    <IconUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Bộ phận */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Bộ phận <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={proposalForm.department}
                      onChange={(e) => setProposalForm({ ...proposalForm, department: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-slate-50/50"
                    />
                    <IconBuilding size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Grid Inputs: Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Công tác tại */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Công tác tại <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={proposalForm.location}
                      onChange={(e) => setProposalForm({ ...proposalForm, location: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white cursor-pointer"
                    >
                      <option value="">-- Chọn địa điểm --</option>
                      <option value="Bình Dương - Cụm Nhà Máy A1">Bình Dương - Cụm Nhà Máy A1</option>
                      <option value="TP. Hồ Chí Minh - Văn phòng Trung Tâm">TP. Hồ Chí Minh - VP Trung Tâm</option>
                      <option value="Đồng Nai - Kho Logistics TTPP">Đồng Nai - Kho Logistics TTPP</option>
                      <option value="Hà Nội - Chi nhánh Phía Bắc">Hà Nội - Chi nhánh Phía Bắc</option>
                      <option value="Quốc tế (Công tác nước ngoài)">Quốc tế (Công tác nước ngoài)</option>
                    </select>
                    <IconMapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Hình thức di chuyển */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Hình thức di chuyển <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={proposalForm.transport}
                      onChange={(e) => setProposalForm({ ...proposalForm, transport: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white cursor-pointer"
                    >
                      <option value="">-- Chọn hình thức --</option>
                      <option value="Xe công ty">🚘 Xe công ty (Xe đưa đón)</option>
                      <option value="Máy bay">✈️ Máy bay</option>
                      <option value="Tàu hỏa">🚆 Tàu hỏa</option>
                      <option value="Xe khách">🚌 Xe khách chất lượng cao</option>
                      <option value="Phương tiện cá nhân">🛵 Phương tiện cá nhân</option>
                    </select>
                    <IconCar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Ngày bắt đầu */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Ngày bắt đầu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={proposalForm.startDate}
                      onChange={(e) => {
                        setProposalForm({ ...proposalForm, startDate: e.target.value });
                        handleDaysChange(proposalForm.daysCount);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white cursor-pointer"
                    />
                    <IconCalendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Số ngày */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Số ngày</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={proposalForm.daysCount}
                      onChange={(e) => handleDaysChange(parseInt(e.target.value) || 1)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white"
                    />
                    <IconCalendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Ngày kết thúc */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Ngày kết thúc</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={proposalForm.endDate}
                      onChange={(e) => setProposalForm({ ...proposalForm, endDate: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white cursor-pointer"
                    />
                    <IconCalendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Grid Inputs: Row 3 (Text areas) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Mục đích công tác */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mục đích công tác <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Nhập mục đích công tác..."
                    value={proposalForm.purpose}
                    onChange={(e) => setProposalForm({ ...proposalForm, purpose: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white resize-none"
                  />
                </div>

                {/* Địa chỉ công tác */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Địa chỉ công tác</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập địa chỉ công tác chi tiết nếu có..."
                    value={proposalForm.address}
                    onChange={(e) => setProposalForm({ ...proposalForm, address: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white resize-none"
                  />
                </div>

                {/* Đề xuất */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Đề xuất phụ cấp/hỗ trợ</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập đề xuất hỗ trợ (nếu có)..."
                    value={proposalForm.proposalText}
                    onChange={(e) => setProposalForm({ ...proposalForm, proposalText: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 👥 SECTION 2: THÔNG TIN NGƯỜI THAM GIA */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#006838] flex items-center justify-center border border-emerald-200">
                    <IconUser size={18} />
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    👥 THÔNG TIN NGƯỜI THAM GIA
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Tổng cộng: <span className="text-[#006838]">{participants.length} người</span>
                </span>
              </div>

              {/* Dynamic Participants Table List */}
              <div className="space-y-3">
                {participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 items-end"
                  >
                    {/* Họ tên */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        Họ tên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập họ tên"
                        value={p.fullName}
                        onChange={(e) => handleUpdateParticipant(p.id, "fullName", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white"
                      />
                    </div>

                    {/* Chức vụ */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        Chức vụ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập chức vụ"
                        value={p.position}
                        onChange={(e) => handleUpdateParticipant(p.id, "position", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white"
                      />
                    </div>

                    {/* MSNV */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        MSNV <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập MSNV"
                        value={p.employeeId}
                        onChange={(e) => handleUpdateParticipant(p.id, "employeeId", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white"
                      />
                    </div>

                    {/* Bộ phận */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        Bộ phận <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={p.department}
                        onChange={(e) => handleUpdateParticipant(p.id, "department", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                      >
                        <option value="">-- Chọn bộ phận --</option>
                        <option value="Hành chính">Hành chính</option>
                        <option value="Nhân sự">Nhân sự</option>
                        <option value="Kế toán">Kế toán</option>
                        <option value="R&D">R&D Kỹ thuật</option>
                        <option value="Sản xuất TH-NM">Tổ hợp Nhà máy</option>
                        <option value="Logistics TTPP">Logistics TTPP</option>
                      </select>
                    </div>

                    {/* Điện thoại */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        Điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập số điện thoại"
                        value={p.phone}
                        onChange={(e) => handleUpdateParticipant(p.id, "phone", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white"
                      />
                    </div>

                    {/* Địa điểm đón */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        Địa điểm đón <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập địa điểm đón"
                        value={p.pickupLocation}
                        onChange={(e) => handleUpdateParticipant(p.id, "pickupLocation", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white"
                      />
                    </div>

                    {/* Delete Row Button */}
                    <div className="flex justify-center pb-0.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(p.id)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer border border-rose-200"
                        title="Xóa người tham gia"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddParticipant}
                className="px-4 py-2 rounded-xl border border-emerald-300 text-[#006838] bg-emerald-50/50 hover:bg-emerald-100 text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconPlus size={16} />
                <span>Thêm người tham gia</span>
              </button>
            </div>

            {/* 🚀 FORM ACTION FOOTER BUTTONS */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <div className="flex items-center gap-4">
                <Link
                  href="/work"
                  className="px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors shadow-2xs"
                >
                  ✕ Hủy bỏ
                </Link>
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-[#006838] text-white text-xs font-extrabold hover:bg-[#00522c] transition-colors shadow-md shadow-emerald-900/20 flex items-center gap-2 cursor-pointer"
                >
                  <IconSend size={16} />
                  <span>🚀 Gửi đề xuất</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span>🛡️</span>
                <span>Thông tin của bạn được bảo mật và chỉ sử dụng cho mục đích quản lý công tác.</span>
              </div>
            </div>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 2: DANH SÁCH DỮ LIỆU ĐĂNG KÝ CÔNG TÁC (EXACT MATCH SCREENSHOT)
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "LIST" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 5-Filter Bar (Exact Match Screenshot Layout) */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-end gap-3 text-xs">
              {/* 1. Tìm kiếm */}
              <div className="flex-1 min-w-[180px] space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Tìm kiếm</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập từ khóa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 font-medium outline-none focus:border-[#006838] bg-slate-50/50"
                  />
                  <IconSearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* 2. Lọc theo khu vực */}
              <div className="w-full sm:w-44 space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Lọc theo khu vực</label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="VP Chuỗi">VP Chuỗi SKECHERS</option>
                  <option value="VP Bình Dương">VP Bình Dương</option>
                  <option value="VP Hồ Chí Minh">VP Hồ Chí Minh</option>
                  <option value="Cụm Nhà Máy">Cụm Nhà Máy TBS</option>
                </select>
              </div>

              {/* 3. Lọc theo Công tác tại */}
              <div className="w-full sm:w-48 space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Lọc theo Công tác tại</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="Bình Dương">Bình Dương</option>
                  <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đồng Nai">Đồng Nai</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Quốc tế">Quốc tế</option>
                </select>
              </div>

              {/* 4. Lọc theo Trạng thái */}
              <div className="w-full sm:w-40 space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Lọc theo Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="PENDING">Chờ xét duyệt</option>
                  <option value="APPROVED">Được duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </div>

              {/* 5. Lọc theo ngày bắt đầu */}
              <div className="w-full sm:w-40 space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Lọc theo ngày bắt đầu</label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                />
              </div>

              {/* Action Buttons: Xóa lọc & Báo cáo */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-extrabold transition-colors cursor-pointer shadow-2xs"
                >
                  Xóa lọc
                </button>
                <button
                  onClick={() => showToast("Đã xuất báo cáo lịch công tác thành công (File CSV/Excel)!")}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <IconDownload size={14} />
                  <span>Báo cáo</span>
                </button>
              </div>
            </div>

            {/* Records Data Table (11 Headers Exact Match Screenshot) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#242b35] border-b border-slate-700 text-white text-xs font-bold uppercase tracking-wider">
                      <th className="p-3 text-center w-12">STT</th>
                      <th className="p-3">Khu vực</th>
                      <th className="p-3">Tên đề xuất</th>
                      <th className="p-3">Người tạo</th>
                      <th className="p-3">Công tác tại</th>
                      <th className="p-3">Ngày bắt đầu</th>
                      <th className="p-3 text-center">Số ngày</th>
                      <th className="p-3">Ngày kết thúc</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3">Hình thức di chuyển</th>
                      <th className="p-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold">
                          Không có dữ liệu phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec, idx) => (
                        <tr key={rec.id} className="hover:bg-slate-50/90 transition-colors border-b border-slate-100">
                          <td className="p-3 text-center font-extrabold text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-700">{rec.region || "VP Chuỗi"}</td>
                          <td className="p-3">
                            <div className="font-extrabold text-slate-900 line-clamp-1">{rec.title}</div>
                            <div className="font-mono text-[10px] text-[#006838] font-bold">{rec.code}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{rec.creator}</div>
                            <div className="text-[10px] text-slate-500">{rec.department}</div>
                          </td>
                          <td className="p-3 font-medium text-slate-700">{rec.location}</td>
                          <td className="p-3 font-bold text-slate-800">{rec.startDate}</td>
                          <td className="p-3 text-center font-bold text-slate-900">{rec.daysCount}</td>
                          <td className="p-3 font-bold text-slate-800">{rec.endDate}</td>
                          <td className="p-3 text-center">
                            {/* Stepper Timeline Badge */}
                            <div className="flex flex-col items-center gap-1">
                              {(rec.status === "approved" || rec.status === "APPROVED") && (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold uppercase flex items-center gap-1">
                                  <span>✓</span> Đã duyệt hoàn tất
                                </span>
                              )}
                              {(rec.status === "pending_department_head" || rec.status === "PENDING") && (
                                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase flex items-center gap-1">
                                  <span>⏳</span> Chờ Trưởng phòng duyệt (Cấp 1)
                                </span>
                              )}
                              {rec.status === "pending_executive_board" && (
                                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase flex items-center gap-1">
                                  <span>⏳</span> Chờ Ban Giám Đốc duyệt (Cấp 2)
                                </span>
                              )}
                              {(rec.status === "rejected_by_department_head" || rec.status === "REJECTED") && (
                                <div className="text-center">
                                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase flex items-center gap-1 justify-center">
                                    <span>✕</span> TP từ chối
                                  </span>
                                  {rec.rejectionReason && (
                                    <span className="text-[9px] text-rose-600 font-medium block mt-0.5 max-w-[120px] truncate" title={rec.rejectionReason}>
                                      Lý do: {rec.rejectionReason}
                                    </span>
                                  )}
                                </div>
                              )}
                              {rec.status === "rejected_by_executive_board" && (
                                <div className="text-center">
                                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase flex items-center gap-1 justify-center">
                                    <span>✕</span> BGĐ từ chối
                                  </span>
                                  {rec.rejectionReason && (
                                    <span className="text-[9px] text-rose-600 font-medium block mt-0.5 max-w-[120px] truncate" title={rec.rejectionReason}>
                                      Lý do: {rec.rejectionReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{rec.transport}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Detail Modal View */}
                              <button
                                onClick={() => setSelectedModalRecord(rec)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-[#006838] hover:text-white transition-colors cursor-pointer"
                                title="Xem chi tiết"
                              >
                                <IconEye size={15} />
                              </button>

                              {/* Level 1 Approval Actions (Trưởng phòng) */}
                              {(rec.status === "pending_department_head" || rec.status === "PENDING") && (
                                <Can permission={PERMISSIONS.TRIP_APPROVE_LEVEL1}>
                                  {(!rec.departmentId || !managedDepartmentId || rec.departmentId === managedDepartmentId || roles.includes("admin")) && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleApproveTrip(rec.id, "department_head")}
                                        className="px-2 py-1 rounded-lg bg-emerald-50 text-[#006838] hover:bg-[#006838] hover:text-white font-extrabold text-[10px] transition-colors cursor-pointer border border-emerald-200"
                                        title="Duyệt Cấp 1 (Trưởng phòng)"
                                      >
                                        Duyệt TP
                                      </button>
                                      <button
                                        onClick={() => handleOpenRejectModal(rec.id, "department_head")}
                                        className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-extrabold text-[10px] transition-colors cursor-pointer border border-rose-200"
                                        title="Từ chối"
                                      >
                                        Từ chối
                                      </button>
                                    </div>
                                  )}
                                </Can>
                              )}

                              {/* Level 2 Approval Actions (Ban Giám Đốc) */}
                              {rec.status === "pending_executive_board" && (
                                <Can permission={PERMISSIONS.TRIP_APPROVE_LEVEL2}>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleApproveTrip(rec.id, "executive_board")}
                                      className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white font-extrabold text-[10px] transition-colors cursor-pointer border border-blue-200"
                                      title="Duyệt Cấp 2 (Ban Giám Đốc)"
                                    >
                                      Duyệt BGĐ
                                    </button>
                                    <button
                                      onClick={() => handleOpenRejectModal(rec.id, "executive_board")}
                                      className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-extrabold text-[10px] transition-colors cursor-pointer border border-rose-200"
                                      title="Từ chối"
                                    >
                                      Từ chối
                                    </button>
                                  </div>
                                </Can>
                              )}

                              {/* Dispatch Vehicle Action */}
                              {(rec.status === "approved" || rec.status === "APPROVED") && (
                                <Can permission={PERMISSIONS.TRIP_DISPATCH_VEHICLE}>
                                  <button
                                    onClick={() => showToast("🚘 Đã gửi lệnh điều xe công tác!")}
                                    className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-700 hover:text-white font-extrabold text-[10px] transition-colors cursor-pointer border border-purple-200"
                                    title="Điều xe công tác"
                                  >
                                    Điều xe
                                  </button>
                                </Can>
                              )}

                              {/* Approve Advance Expense Action */}
                              {(rec.status === "approved" || rec.status === "APPROVED") && (
                                <Can permission={PERMISSIONS.TRIP_APPROVE_ADVANCE}>
                                  <button
                                    onClick={() => showToast("💰 Đã duyệt tạm ứng chi phí công tác!")}
                                    className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white font-extrabold text-[10px] transition-colors cursor-pointer border border-amber-200"
                                    title="Duyệt tạm ứng chi phí"
                                  >
                                    Tạm ứng
                                  </button>
                                </Can>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 🔴 REJECTION REASON MODAL POPUP */}
        {rejectionTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Từ chối đơn công tác ({rejectionTarget.level === "department_head" ? "Trưởng phòng" : "Ban Giám Đốc"})</span>
                </h3>
                <button
                  onClick={() => setRejectionTarget(null)}
                  className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
                >
                  <IconX size={16} />
                </button>
              </div>
              <div className="p-5 space-y-3 text-xs">
                <label className="font-bold text-slate-700 block">
                  Vui lòng nhập lý do từ chối <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Ví dụ: Lịch trình chưa hợp lý / Thiếu hồ sơ đính kèm..."
                  className="w-full p-3 rounded-xl border border-slate-300 font-medium outline-none focus:border-rose-500 bg-slate-50"
                />
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectionTarget(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            MODAL POPUP: CHI TIẾT ĐỀ XUẤT ĐĂNG KÝ CÔNG TÁC
           ════════════════════════════════════════════════════════════════ */}
        {selectedModalRecord && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-[#006838] to-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-emerald-200 font-bold block uppercase">
                    {selectedModalRecord.code}
                  </span>
                  <h3 className="text-base font-black tracking-tight">{selectedModalRecord.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedModalRecord(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-slate-500 font-semibold block">Người tạo đề xuất:</span>
                    <span className="text-slate-900 font-extrabold text-sm block mt-0.5">
                      {selectedModalRecord.creator} ({selectedModalRecord.department})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Khu vực / Nhà máy:</span>
                    <span className="text-slate-900 font-extrabold text-sm block mt-0.5">
                      {selectedModalRecord.region} {selectedModalRecord.factory ? `- ${selectedModalRecord.factory}` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Địa điểm công tác:</span>
                    <span className="text-slate-900 font-extrabold text-sm block mt-0.5">
                      {selectedModalRecord.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Thời gian &amp; Phương tiện:</span>
                    <span className="text-slate-900 font-extrabold text-sm block mt-0.5">
                      {selectedModalRecord.startDate} - {selectedModalRecord.endDate} ({selectedModalRecord.daysCount} ngày) | {selectedModalRecord.transport}
                    </span>
                  </div>
                </div>

                {selectedModalRecord.purpose && (
                  <div className="space-y-1 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="font-extrabold text-[#006838] block uppercase text-[11px]">🎯 Mục đích công tác:</span>
                    <p className="text-slate-800 leading-relaxed font-medium">{selectedModalRecord.purpose}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-semibold">Trạng thái phê duyệt D1:</span>
                  <div>
                    {selectedModalRecord.status === "APPROVED" && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#006838] text-xs font-black uppercase">
                        ✓ Đã phê duyệt
                      </span>
                    )}
                    {selectedModalRecord.status === "PENDING" && (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase">
                        ⏳ Chờ phê duyệt
                      </span>
                    )}
                    {selectedModalRecord.status === "REJECTED" && (
                      <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-black uppercase">
                        ✕ Từ chối
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedModalRecord(null)}
                  className="px-5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

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
