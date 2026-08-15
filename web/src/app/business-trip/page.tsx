"use client";

import React, { useState } from "react";
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
  IconPlane,
} from "@tabler/icons-react";

interface Participant {
  id: string;
  fullName: string;
  position: string;
  employeeId: string;
  department: string;
  phone: string;
  pickupLocation: string;
}

interface BusinessTripRecord {
  id: string;
  code: string;
  title: string;
  creator: string;
  department: string;
  location: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  transport: string;
  participantsCount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function BusinessTripRegistrationPage() {
  const [activeTab, setActiveTab] = useState<"FORM" | "LIST">("FORM");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State: Proposal Info
  const [proposalForm, setProposalForm] = useState({
    title: "",
    region: "VP Chuỗi",
    factory: "",
    creator: "Anh Huy",
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

  // Form State: Participants List
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "p_1",
      fullName: "Anh Huy",
      position: "Quản lý chuỗi",
      employeeId: "NV-2026-088",
      department: "Hành chính",
      phone: "0988 123 456",
      pickupLocation: "VP Chuỗi SKECHERS",
    },
  ]);

  // Submitted Records List
  const [records, setRecords] = useState<BusinessTripRecord[]>([
    {
      id: "rec_1",
      code: "CT-2026-018",
      title: "Đánh giá Gemba Walk & Kiểm định dây chuyền A1",
      creator: "Anh Huy",
      department: "Hành chính",
      location: "Bình Dương - Nhà máy A1",
      startDate: "15/08/2026",
      endDate: "16/08/2026",
      daysCount: 2,
      transport: "Xe công ty",
      participantsCount: 3,
      status: "APPROVED",
      createdAt: "14/08/2026 09:30",
    },
    {
      id: "rec_2",
      code: "CT-2026-019",
      title: "Khảo sát mở rộng Trung tâm Phân phối TTPP Đồng Nai",
      creator: "Trần Thị Mai",
      department: "Logistics",
      location: "Đồng Nai",
      startDate: "18/08/2026",
      endDate: "18/08/2026",
      daysCount: 1,
      transport: "Xe công ty",
      participantsCount: 2,
      status: "PENDING",
      createdAt: "15/08/2026 08:15",
    },
  ]);

  // List Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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

  // Submit Business Trip Form
  const handleSubmitForm = (e: React.FormEvent) => {
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

    const newRecord: BusinessTripRecord = {
      id: `rec_${Date.now()}`,
      code: `CT-2026-0${records.length + 20}`,
      title: proposalForm.title,
      creator: proposalForm.creator,
      department: proposalForm.department,
      location: proposalForm.location,
      startDate: proposalForm.startDate.split("-").reverse().join("/"),
      endDate: proposalForm.endDate.split("-").reverse().join("/"),
      daysCount: proposalForm.daysCount,
      transport: proposalForm.transport || "Xe công ty",
      participantsCount: participants.length,
      status: "PENDING",
      createdAt: new Date().toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }),
    };

    setRecords([newRecord, ...records]);
    showToast("Đã gửi đề xuất công tác thành công! Vui lòng chờ phê duyệt.");
    setActiveTab("LIST");
  };

  const filteredRecords = records.filter((rec) => {
    const matchSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" || rec.status === statusFilter;
    return matchSearch && matchStatus;
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
              src="/images/crawled/Da-giay1.jpg"
              alt="Avatar"
              className="w-8 h-8 rounded-full border-2 border-[#006838] object-cover"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">Anh Huy</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Văn phòng Chuỗi</div>
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

          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#006838] text-white flex items-center justify-center font-bold text-sm">
              TBS
            </div>
          </div>

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

              {/* Add Participant Button */}
              <button
                type="button"
                onClick={handleAddParticipant}
                className="px-4 py-2 rounded-xl border border-emerald-300 text-[#006838] bg-emerald-50/50 hover:bg-emerald-100 text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconPlus size={16} />
                <span>+ Thêm người tham gia</span>
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
            TAB 2: DANH SÁCH DỮ LIỆU ĐĂNG KÝ CÔNG TÁC (TABLE VIEW)
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "LIST" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search & Filter Bar */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Tìm kiếm mã, tiêu đề, người tạo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-[#006838] bg-slate-50"
                />
                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <IconFilter size={16} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ phê duyệt</option>
                  <option value="APPROVED">Đã phê duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </div>
            </div>

            {/* Records Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-extrabold uppercase tracking-wider">
                      <th className="p-3.5">Mã Đề Xuất</th>
                      <th className="p-3.5">Tên Đề Xuất Công Tác</th>
                      <th className="p-3.5">Người Đề Xuất</th>
                      <th className="p-3.5">Địa Điểm</th>
                      <th className="p-3.5">Thời Gian</th>
                      <th className="p-3.5">Phương Tiện</th>
                      <th className="p-3.5">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#006838]">{rec.code}</td>
                        <td className="p-3.5 font-bold text-slate-900 max-w-xs">{rec.title}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{rec.creator}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{rec.department}</div>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700">{rec.location}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{rec.startDate} - {rec.endDate}</div>
                          <div className="text-[10px] text-slate-500 font-mono">({rec.daysCount} ngày)</div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{rec.transport}</td>
                        <td className="p-3.5">
                          {rec.status === "APPROVED" && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold uppercase tracking-wider">
                              ✓ Đã phê duyệt
                            </span>
                          )}
                          {rec.status === "PENDING" && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                              ⏳ Chờ phê duyệt
                            </span>
                          )}
                          {rec.status === "REJECTED" && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase tracking-wider">
                              ✕ Từ chối
                            </span>
                          )}
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
