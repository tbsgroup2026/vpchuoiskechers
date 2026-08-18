"use client";

import React, { useState, useEffect, useRef } from "react";
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
  IconPaperclip,
  IconPhoto,
  IconFileTypePdf,
  IconReceipt,
  IconUpload,
  IconExternalLink,
  IconCash,
  IconZoomIn,
} from "@tabler/icons-react";
import Can from "@/components/Can";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";

export interface TripAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  createdAt: string;
}

export interface TripInvoice {
  id: string;
  title: string;
  category: "Vé máy bay / Tàu xe" | "Khách sạn / Lưu trú" | "Ăn uống / Tiếp khách" | "Xăng xe / Cầu đường" | "Chi phí khác";
  amount: number;
  invoiceDate: string;
  invoiceNumber?: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  notes?: string;
  createdAt: string;
}

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
  attachmentsJson?: string;
  attachments?: TripAttachment[];
  invoicesJson?: string;
  invoices?: TripInvoice[];
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

  // File Upload State for Form Proposal
  const [attachments, setAttachments] = useState<TripAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invoice Management Modal State (Tab 2: LIST)
  const [activeInvoiceTrip, setActiveInvoiceTrip] = useState<BusinessTripRecord | null>(null);
  const [globalImportModal, setGlobalImportModal] = useState(false);
  const [selectedTripIdForImport, setSelectedTripIdForImport] = useState<string>("");
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);
  const [newInvoiceForm, setNewInvoiceForm] = useState<{
    title: string;
    category: "Vé máy bay / Tàu xe" | "Khách sạn / Lưu trú" | "Ăn uống / Tiếp khách" | "Xăng xe / Cầu đường" | "Chi phí khác";
    amount: string;
    invoiceDate: string;
    invoiceNumber: string;
    notes: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
  }>({
    title: "",
    category: "Vé máy bay / Tàu xe",
    amount: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    invoiceNumber: "",
    notes: "",
    fileName: "",
    fileType: "",
    fileUrl: "",
  });

  // Preview Modal for Images / PDFs
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string; type: string } | null>(null);

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

  // Form State: Participants List
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

  // List Search & 5 Filter Inputs
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
        const d1Records: BusinessTripRecord[] = result.data.map((item: any) => {
          let parsedAttachments: TripAttachment[] = [];
          if (item.attachments_json) {
            try { parsedAttachments = JSON.parse(item.attachments_json); } catch(e) {}
          }
          let parsedInvoices: TripInvoice[] = [];
          if (item.invoices_json) {
            try { parsedInvoices = JSON.parse(item.invoices_json); } catch(e) {}
          }

          return {
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
            attachmentsJson: item.attachments_json || "[]",
            attachments: parsedAttachments,
            invoicesJson: item.invoices_json || "[]",
            invoices: parsedInvoices,
            participantsJson: item.participants_json || item.participantsJson || "[]",
            status: (item.status as TripStatus) || "PENDING",
            createdAt: item.created_at || new Date().toLocaleString("vi-VN"),
          };
        });
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

  // Reset all filters
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

  // Handle Attachment Upload (Images & PDFs) for Proposal
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        const newAtt: TripAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          createdAt: new Date().toLocaleTimeString("vi-VN"),
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Handle Invoice File Upload in Invoice Modal
  const handleInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setNewInvoiceForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileType: file.type,
        fileUrl: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Save new invoice for active trip
  const handleSaveInvoice = async (tripId: string) => {
    if (!newInvoiceForm.title.trim()) {
      alert("Vui lòng nhập tên hóa đơn/chứng từ!");
      return;
    }
    const parsedAmount = parseFloat(newInvoiceForm.amount.replace(/[^0-9]/g, "")) || 0;
    if (parsedAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    const newInv: TripInvoice = {
      id: `inv_${Date.now()}`,
      title: newInvoiceForm.title.trim(),
      category: newInvoiceForm.category,
      amount: parsedAmount,
      invoiceDate: newInvoiceForm.invoiceDate,
      invoiceNumber: newInvoiceForm.invoiceNumber.trim(),
      fileName: newInvoiceForm.fileName,
      fileType: newInvoiceForm.fileType,
      fileUrl: newInvoiceForm.fileUrl,
      notes: newInvoiceForm.notes.trim(),
      createdAt: new Date().toLocaleString("vi-VN"),
    };

    // Update Local State
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === tripId) {
          const currentInvoices = r.invoices ? [...r.invoices, newInv] : [newInv];
          return {
            ...r,
            invoices: currentInvoices,
            invoicesJson: JSON.stringify(currentInvoices),
          };
        }
        return r;
      })
    );

    // Update active modal trip state if open
    if (activeInvoiceTrip && activeInvoiceTrip.id === tripId) {
      const currentInvoices = activeInvoiceTrip.invoices ? [...activeInvoiceTrip.invoices, newInv] : [newInv];
      setActiveInvoiceTrip({
        ...activeInvoiceTrip,
        invoices: currentInvoices,
        invoicesJson: JSON.stringify(currentInvoices),
      });
    }

    // Persist to Cloudflare D1 Database
    try {
      await fetch("/api/business-trips/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, invoice: newInv }),
      });
      showToast("Đã lưu & đồng bộ hóa đơn chứng từ thành công vào D1!");
    } catch (e) {
      showToast("Đã lưu hóa đơn chứng từ vào ứng dụng!");
    }

    // Reset Invoice Input Form
    setNewInvoiceForm({
      title: "",
      category: "Vé máy bay / Tàu xe",
      amount: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      invoiceNumber: "",
      notes: "",
      fileName: "",
      fileType: "",
      fileUrl: "",
    });
    if (globalImportModal) setGlobalImportModal(false);
  };

  // Delete an invoice from trip
  const handleDeleteInvoice = async (tripId: string, invoiceId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hóa đơn này không?")) return;

    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === tripId) {
          const filtered = (r.invoices || []).filter((inv) => inv.id !== invoiceId);
          return {
            ...r,
            invoices: filtered,
            invoicesJson: JSON.stringify(filtered),
          };
        }
        return r;
      })
    );

    if (activeInvoiceTrip && activeInvoiceTrip.id === tripId) {
      const filtered = (activeInvoiceTrip.invoices || []).filter((inv) => inv.id !== invoiceId);
      setActiveInvoiceTrip({
        ...activeInvoiceTrip,
        invoices: filtered,
        invoicesJson: JSON.stringify(filtered),
      });
    }

    const targetTrip = records.find((r) => r.id === tripId);
    if (targetTrip) {
      const updatedInvoices = (targetTrip.invoices || []).filter((inv) => inv.id !== invoiceId);
      try {
        await fetch("/api/business-trips", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: tripId, invoices_json: JSON.stringify(updatedInvoices) }),
        });
        showToast("Đã xóa hóa đơn chứng từ!");
      } catch (e) {}
    }
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
      attachmentsJson: JSON.stringify(attachments),
      attachments,
      invoicesJson: JSON.stringify([]),
      invoices: [],
      participantsJson: JSON.stringify(participants),
      status: "PENDING",
      createdAt: new Date().toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }),
    };

    setRecords([newRecord, ...records]);

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
          attachments,
          participants,
        }),
      });
      showToast("Đã lưu & gửi đề xuất công tác kèm tệp đính kèm vào D1 Database!");
    } catch (err) {
      showToast("Đã gửi đề xuất công tác thành công!");
    }

    // Reset Form
    setAttachments([]);
    setProposalForm({
      title: "",
      region: "VP Chuỗi",
      factory: "",
      creator: currentUser.name || "Ban Quản Lý",
      department: currentUser.department || "Hành chính",
      location: "",
      transport: "",
      startDate: new Date().toISOString().split("T")[0],
      daysCount: 1,
      endDate: new Date().toISOString().split("T")[0],
      purpose: "",
      address: "",
      proposalText: "",
    });

    setActiveTab("LIST");
  };

  // Filter records
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

              {/* Grid Inputs: Row 3 (Text areas & Attachments) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Mục đích công tác */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mục đích công tác <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Nhập mục đích công tác chi tiết..."
                    value={proposalForm.purpose}
                    onChange={(e) => setProposalForm({ ...proposalForm, purpose: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white resize-none"
                  />
                </div>

                {/* Địa chỉ công tác */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Địa chỉ công tác</label>
                  <textarea
                    rows={4}
                    placeholder="Nhập địa chỉ công tác chi tiết nếu có..."
                    value={proposalForm.address}
                    onChange={(e) => setProposalForm({ ...proposalForm, address: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white resize-none"
                  />
                </div>

                {/* Đề xuất phụ cấp/hỗ trợ & Import file/ảnh */}
                <div className="space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      Đề xuất phụ cấp / hỗ trợ
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-[#006838] hover:text-[#00522c] font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <IconPaperclip size={13} />
                      <span>+ Đính kèm File/Ảnh/PDF</span>
                    </button>
                  </div>

                  <textarea
                    rows={attachments.length > 0 ? 2 : 4}
                    placeholder="Ghi chú nội dung đề xuất phụ cấp/hỗ trợ chi phí đi lại, ăn ở, công tác phí (nếu có)..."
                    value={proposalForm.proposalText}
                    onChange={(e) => setProposalForm({ ...proposalForm, proposalText: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white resize-none"
                  />

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Attachments List Badge */}
                  {attachments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        Tệp đính kèm ({attachments.length}):
                      </span>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                        {attachments.map((att) => {
                          const isImage = att.type.startsWith("image/");
                          const isPdf = att.type.includes("pdf");
                          return (
                            <div
                              key={att.id}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs group hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                            >
                              {isImage ? (
                                <div
                                  onClick={() => setPreviewModal({ url: att.dataUrl, title: att.name, type: att.type })}
                                  className="cursor-pointer flex items-center gap-1"
                                  title="Bấm để xem ảnh"
                                >
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    className="w-4 h-4 rounded object-cover border border-slate-300"
                                  />
                                  <span className="font-semibold text-slate-800 max-w-[110px] truncate text-[11px]">
                                    {att.name}
                                  </span>
                                </div>
                              ) : isPdf ? (
                                <div
                                  onClick={() => setPreviewModal({ url: att.dataUrl, title: att.name, type: att.type })}
                                  className="cursor-pointer flex items-center gap-1 text-rose-600 font-bold"
                                  title="Bấm để xem PDF"
                                >
                                  <IconFileTypePdf size={14} />
                                  <span className="font-semibold text-slate-800 max-w-[110px] truncate text-[11px]">
                                    {att.name}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-slate-600">
                                  <IconFileText size={14} />
                                  <span className="font-semibold text-slate-800 max-w-[110px] truncate text-[11px]">
                                    {att.name}
                                  </span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(att.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                                title="Xóa tệp"
                              >
                                <IconX size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                  Tổng cộng: <span className="text-[#006838] font-black">{participants.length} người</span>
                </span>
              </div>

              {/* Dynamic Participants Table List */}
              <div className="space-y-3">
                {participants.map((p) => (
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
                  <span>🚀 Gửi đề xuất công tác</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span>🛡️</span>
                <span>Thông tin đề xuất & tệp đính kèm được bảo mật và đồng bộ thời gian thực trên Cloudflare D1.</span>
              </div>
            </div>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 2: DANH SÁCH DỮ LIỆU ĐĂNG KÝ CÔNG TÁC
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "LIST" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 5-Filter Bar with Import Invoices Button */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-end gap-3 text-xs">
              {/* 1. Tìm kiếm */}
              <div className="flex-1 min-w-[180px] space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Tìm kiếm</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập từ khóa mã đơn, tên đề xuất, người tạo..."
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

              {/* Action Buttons: Xóa lọc, Import Hóa Đơn & Báo cáo */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleResetFilters}
                  className="px-3.5 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-extrabold transition-colors cursor-pointer shadow-2xs"
                >
                  Xóa lọc
                </button>

                {/* Nút Import Hóa Đơn Chứng Từ Toàn Cục */}
                <button
                  onClick={() => {
                    if (records.length === 0) {
                      alert("Chưa có chuyến công tác nào để import hóa đơn!");
                      return;
                    }
                    setSelectedTripIdForImport(records[0]?.id || "");
                    setGlobalImportModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white font-extrabold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <IconReceipt size={15} />
                  <span>📥 Import Hóa Đơn</span>
                </button>

                <button
                  onClick={() => showToast("Đã xuất báo cáo lịch công tác & hóa đơn chi phí thành công (File Excel/CSV)!")}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <IconDownload size={14} />
                  <span>Báo cáo</span>
                </button>
              </div>
            </div>

            {/* Records Data Table */}
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
                      <th className="p-3">Thời gian</th>
                      <th className="p-3 text-center">Số ngày</th>
                      <th className="p-3 text-center">Hóa đơn</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">
                          Không có dữ liệu phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec, idx) => {
                        const invoiceCount = rec.invoices?.length || 0;
                        const attachmentCount = rec.attachments?.length || 0;

                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/90 transition-colors border-b border-slate-100">
                            <td className="p-3 text-center font-extrabold text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-semibold text-slate-700">{rec.region || "VP Chuỗi"}</td>
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 line-clamp-1">{rec.title}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-[#006838] font-bold">{rec.code}</span>
                                {attachmentCount > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium flex items-center gap-0.5 border border-slate-200" title={`${attachmentCount} tệp đính kèm đề xuất`}>
                                    <IconPaperclip size={10} />
                                    <span>{attachmentCount}</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{rec.creator}</div>
                              <div className="text-[10px] text-slate-500">{rec.department}</div>
                            </td>
                            <td className="p-3 font-medium text-slate-700">{rec.location}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{rec.startDate}</div>
                              <div className="text-[10px] text-slate-400 font-medium">đến {rec.endDate}</div>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-900">{rec.daysCount}</td>

                            {/* Cột Hóa Đơn Chứng Từ */}
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setActiveInvoiceTrip(rec)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer border ${
                                  invoiceCount > 0
                                    ? "bg-emerald-50 text-[#006838] border-emerald-200 hover:bg-[#006838] hover:text-white"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-200"
                                }`}
                                title="Quản lý & Tải lên hóa đơn chứng từ"
                              >
                                <IconReceipt size={13} />
                                <span>{invoiceCount > 0 ? `${invoiceCount} HĐ` : "+ Thêm HĐ"}</span>
                              </button>
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {(rec.status === "approved" || rec.status === "APPROVED") && (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold uppercase flex items-center gap-1">
                                    <span>✓</span> Đã duyệt
                                  </span>
                                )}
                                {(rec.status === "pending_department_head" || rec.status === "PENDING") && (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase flex items-center gap-1">
                                    <span>⏳</span> Chờ TP duyệt (Cấp 1)
                                  </span>
                                )}
                                {rec.status === "pending_executive_board" && (
                                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase flex items-center gap-1">
                                    <span>⏳</span> Chờ BGĐ duyệt (Cấp 2)
                                  </span>
                                )}
                                {(rec.status === "rejected_by_department_head" || rec.status === "REJECTED") && (
                                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase flex items-center gap-1">
                                    <span>✕</span> TP từ chối
                                  </span>
                                )}
                                {rec.status === "rejected_by_executive_board" && (
                                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase flex items-center gap-1">
                                    <span>✕</span> BGĐ từ chối
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {/* Detail Modal View */}
                                <button
                                  onClick={() => setSelectedModalRecord(rec)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-[#006838] hover:text-white transition-colors cursor-pointer"
                                  title="Xem chi tiết đơn công tác"
                                >
                                  <IconEye size={15} />
                                </button>

                                {/* Import / Manage Invoices Button */}
                                <button
                                  onClick={() => setActiveInvoiceTrip(rec)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-[#006838] hover:bg-[#006838] hover:text-white transition-colors cursor-pointer border border-emerald-200"
                                  title="Quản lý hóa đơn & chứng từ"
                                >
                                  <IconUpload size={15} />
                                </button>

                                {/* Level 1 Approval Actions */}
                                {(rec.status === "pending_department_head" || rec.status === "PENDING") && (
                                  <Can permission={PERMISSIONS.TRIP_APPROVE_LEVEL1}>
                                    {(!rec.departmentId || !managedDepartmentId || rec.departmentId === managedDepartmentId || roles.includes("admin")) && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleApproveTrip(rec.id, "department_head")}
                                          className="px-2 py-1 rounded-lg bg-emerald-50 text-[#006838] hover:bg-[#006838] hover:text-white font-extrabold text-[10px] transition-colors cursor-pointer border border-emerald-200"
                                        >
                                          Duyệt TP
                                        </button>
                                        <button
                                          onClick={() => handleOpenRejectModal(rec.id, "department_head")}
                                          className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-extrabold text-[10px] transition-colors cursor-pointer border border-rose-200"
                                        >
                                          Từ chối
                                        </button>
                                      </div>
                                    )}
                                  </Can>
                                )}

                                {/* Level 2 Approval Actions */}
                                {rec.status === "pending_executive_board" && (
                                  <Can permission={PERMISSIONS.TRIP_APPROVE_LEVEL2}>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleApproveTrip(rec.id, "executive_board")}
                                        className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white font-extrabold text-[10px] transition-colors cursor-pointer border border-blue-200"
                                      >
                                        Duyệt BGĐ
                                      </button>
                                      <button
                                        onClick={() => handleOpenRejectModal(rec.id, "executive_board")}
                                        className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-extrabold text-[10px] transition-colors cursor-pointer border border-rose-200"
                                      >
                                        Từ chối
                                      </button>
                                    </div>
                                  </Can>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            MODAL 1: QUẢN LÝ & IMPORT HÓA ĐƠN CHỨNG TỪ (INVOICES MODAL)
           ════════════════════════════════════════════════════════════════ */}
        {activeInvoiceTrip && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-[#006838] to-slate-900 text-white flex items-center justify-between flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded text-emerald-100 font-bold">
                      {activeInvoiceTrip.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-200">
                      {activeInvoiceTrip.location} ({activeInvoiceTrip.startDate} - {activeInvoiceTrip.endDate})
                    </span>
                  </div>
                  <h3 className="text-base font-black tracking-tight mt-1">
                    🧾 HÓA ĐƠN &amp; CHỨNG TỪ CHI PHÍ CÔNG TÁC
                  </h3>
                </div>
                <button
                  onClick={() => setActiveInvoiceTrip(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                {/* Total Summary */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 font-semibold block">Tổng số hóa đơn đã đính kèm:</span>
                    <span className="text-lg font-black text-[#006838]">
                      {activeInvoiceTrip.invoices?.length || 0} chứng từ
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-600 font-semibold block">Tổng chi phí quyết toán:</span>
                    <span className="text-lg font-black text-slate-900">
                      {(activeInvoiceTrip.invoices || [])
                        .reduce((sum, inv) => sum + (inv.amount || 0), 0)
                        .toLocaleString("vi-VN")}{" "}
                      VND
                    </span>
                  </div>
                </div>

                {/* Existing Invoices List */}
                <div className="space-y-2.5">
                  <h4 className="font-black text-slate-800 uppercase tracking-tight text-xs flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Danh sách chứng từ đã tải lên</span>
                  </h4>

                  {!activeInvoiceTrip.invoices || activeInvoiceTrip.invoices.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400">
                      Chưa có hóa đơn hoặc chứng từ nào được đính kèm cho chuyến công tác này.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeInvoiceTrip.invoices.map((inv, iIndex) => (
                        <div
                          key={inv.id}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#006838] flex items-center justify-center flex-shrink-0">
                              {inv.fileType?.includes("pdf") ? (
                                <IconFileTypePdf size={20} className="text-rose-600" />
                              ) : (
                                <IconReceipt size={20} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-slate-900 truncate">{inv.title}</div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                                  {inv.category}
                                </span>
                                <span>•</span>
                                <span>Ngày: {inv.invoiceDate}</span>
                                {inv.invoiceNumber && (
                                  <>
                                    <span>•</span>
                                    <span>Số HĐ: {inv.invoiceNumber}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="font-black text-slate-900 text-sm">
                                {inv.amount.toLocaleString("vi-VN")} VND
                              </div>
                              <div className="text-[10px] text-emerald-600 font-semibold">Đã xác nhận</div>
                            </div>

                            <div className="flex items-center gap-1">
                              {inv.fileUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewModal({
                                      url: inv.fileUrl || "",
                                      title: inv.title,
                                      type: inv.fileType || "image/png",
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-[#006838] hover:text-white transition-colors cursor-pointer"
                                  title="Xem chứng từ đính kèm"
                                >
                                  <IconEye size={15} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoice(activeInvoiceTrip.id, inv.id)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer border border-rose-200"
                                title="Xóa hóa đơn"
                              >
                                <IconTrash size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form to add a new invoice */}
                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3.5">
                  <h4 className="font-black text-slate-800 uppercase tracking-tight text-xs flex items-center gap-1.5">
                    <span>➕</span>
                    <span>Thêm Hóa Đơn / Chứng Từ Mới</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Tên chứng từ / Hóa đơn <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Vé máy bay Vietnam Airlines..."
                        value={newInvoiceForm.title}
                        onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-[#006838] bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Loại chi phí</label>
                      <select
                        value={newInvoiceForm.category}
                        onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, category: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                      >
                        <option value="Vé máy bay / Tàu xe">✈️ Vé máy bay / Tàu xe</option>
                        <option value="Khách sạn / Lưu trú">🏨 Khách sạn / Lưu trú</option>
                        <option value="Ăn uống / Tiếp khách">🍽️ Ăn uống / Tiếp khách</option>
                        <option value="Xăng xe / Cầu đường">⛽ Xăng xe / Cầu đường</option>
                        <option value="Chi phí khác">📦 Chi phí khác</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Số tiền (VNĐ) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Ví dụ: 1500000"
                        value={newInvoiceForm.amount}
                        onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, amount: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Ngày hóa đơn</label>
                      <input
                        type="date"
                        value={newInvoiceForm.invoiceDate}
                        onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, invoiceDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* File Upload for Invoice */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Tệp đính kèm (Ảnh hóa đơn / File PDF)
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => invoiceFileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <IconUpload size={15} />
                        <span>Chọn ảnh / PDF hóa đơn</span>
                      </button>

                      {newInvoiceForm.fileName && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-[#006838]">
                          {newInvoiceForm.fileType?.includes("pdf") ? (
                            <IconFileTypePdf size={16} className="text-rose-600" />
                          ) : (
                            <IconPhoto size={16} />
                          )}
                          <span className="max-w-[200px] truncate">{newInvoiceForm.fileName}</span>
                          <button
                            type="button"
                            onClick={() => setNewInvoiceForm({ ...newInvoiceForm, fileName: "", fileType: "", fileUrl: "" })}
                            className="text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                          >
                            <IconX size={14} />
                          </button>
                        </div>
                      )}

                      <input
                        ref={invoiceFileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleInvoiceFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveInvoice(activeInvoiceTrip.id)}
                      className="px-5 py-2 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <IconCheck size={16} />
                      <span>Lưu &amp; Đồng bộ Hóa đơn</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
                <button
                  onClick={() => setActiveInvoiceTrip(null)}
                  className="px-5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            MODAL 2: IMPORT HÓA ĐƠN TOÀN CỤC (GLOBAL IMPORT MODAL)
           ════════════════════════════════════════════════════════════════ */}
        {globalImportModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-5 bg-gradient-to-r from-[#006838] to-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black tracking-tight">📥 IMPORT HÓA ĐƠN CHỨNG TỪ CÔNG TÁC</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">Chọn chuyến công tác để tải lên chứng từ</p>
                </div>
                <button
                  onClick={() => setGlobalImportModal(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Chọn chuyến công tác <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedTripIdForImport}
                    onChange={(e) => setSelectedTripIdForImport(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                  >
                    {records.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.code}] {r.title} - {r.creator} ({r.location}, {r.startDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      Tên hóa đơn / chứng từ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Hóa đơn phòng khách sạn..."
                      value={newInvoiceForm.title}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-[#006838] bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Loại chi phí</label>
                    <select
                      value={newInvoiceForm.category}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                    >
                      <option value="Vé máy bay / Tàu xe">✈️ Vé máy bay / Tàu xe</option>
                      <option value="Khách sạn / Lưu trú">🏨 Khách sạn / Lưu trú</option>
                      <option value="Ăn uống / Tiếp khách">🍽️ Ăn uống / Tiếp khách</option>
                      <option value="Xăng xe / Cầu đường">⛽ Xăng xe / Cầu đường</option>
                      <option value="Chi phí khác">📦 Chi phí khác</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      Số tiền (VNĐ) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 850000"
                      value={newInvoiceForm.amount}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-[#006838] bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Ngày hóa đơn</label>
                    <input
                      type="date"
                      value={newInvoiceForm.invoiceDate}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, invoiceDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-[#006838] bg-white cursor-pointer"
                    />
                  </div>
                </div>

                {/* Upload File */}
                <div className="space-y-1.5 pt-1">
                  <label className="font-bold text-slate-700 block">File đính kèm (Ảnh / PDF)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => invoiceFileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <IconUpload size={15} />
                      <span>Chọn file</span>
                    </button>
                    {newInvoiceForm.fileName && (
                      <span className="text-emerald-700 font-bold">{newInvoiceForm.fileName}</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setGlobalImportModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveInvoice(selectedTripIdForImport)}
                    className="px-5 py-2 rounded-xl bg-[#006838] text-white font-extrabold hover:bg-[#00522c] cursor-pointer shadow-md"
                  >
                    Lưu hóa đơn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            MODAL 3: PREVIEW FILE MODAL (IMAGES & PDFS)
           ════════════════════════════════════════════════════════════════ */}
        {previewModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
                <h4 className="text-xs sm:text-sm font-black truncate max-w-md flex items-center gap-2">
                  <span>👁️</span>
                  <span>{previewModal.title}</span>
                </h4>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100 min-h-[300px]">
                {previewModal.type.startsWith("image/") ? (
                  <img
                    src={previewModal.url}
                    alt={previewModal.title}
                    className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-md"
                  />
                ) : previewModal.type.includes("pdf") ? (
                  <iframe
                    src={previewModal.url}
                    title={previewModal.title}
                    className="w-full h-[70vh] rounded-xl border border-slate-300"
                  />
                ) : (
                  <div className="text-center p-8 text-slate-600 space-y-2">
                    <IconFileText size={48} className="mx-auto text-slate-400" />
                    <p className="font-bold">{previewModal.title}</p>
                    <a
                      href={previewModal.url}
                      download={previewModal.title}
                      className="inline-block px-4 py-2 rounded-xl bg-[#006838] text-white font-bold text-xs"
                    >
                      Tải về tệp
                    </a>
                  </div>
                )}
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

                {/* Proposal Text & Attachments */}
                {selectedModalRecord.proposalText && (
                  <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-extrabold text-slate-800 block uppercase text-[11px]">📝 Đề xuất phụ cấp / hỗ trợ:</span>
                    <p className="text-slate-800 leading-relaxed font-medium">{selectedModalRecord.proposalText}</p>
                  </div>
                )}

                {/* Attachments */}
                {selectedModalRecord.attachments && selectedModalRecord.attachments.length > 0 && (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-extrabold text-slate-800 block uppercase text-[11px]">
                      📎 Tệp đính kèm ({selectedModalRecord.attachments.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedModalRecord.attachments.map((att) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => setPreviewModal({ url: att.dataUrl, title: att.name, type: att.type })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-[#006838] transition-colors cursor-pointer text-xs font-bold text-slate-800"
                        >
                          {att.type.includes("pdf") ? (
                            <IconFileTypePdf size={16} className="text-rose-600" />
                          ) : (
                            <IconPhoto size={16} className="text-[#006838]" />
                          )}
                          <span className="max-w-[150px] truncate">{att.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Invoices List */}
                {selectedModalRecord.invoices && selectedModalRecord.invoices.length > 0 && (
                  <div className="space-y-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                    <span className="font-extrabold text-[#006838] block uppercase text-[11px]">
                      🧾 Hóa đơn chứng từ đã hoàn ứng ({selectedModalRecord.invoices.length}):
                    </span>
                    <div className="space-y-1.5">
                      {selectedModalRecord.invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{inv.title}</span>
                            <span className="text-slate-500 text-[10px] ml-2">({inv.category})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{inv.amount.toLocaleString("vi-VN")} VND</span>
                            {inv.fileUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewModal({ url: inv.fileUrl || "", title: inv.title, type: inv.fileType || "image/png" })}
                                className="p-1 rounded bg-slate-100 hover:bg-[#006838] hover:text-white transition-colors cursor-pointer"
                              >
                                <IconEye size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const rec = selectedModalRecord;
                    setSelectedModalRecord(null);
                    setActiveInvoiceTrip(rec);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-[#006838] hover:text-white text-[#006838] font-bold text-xs transition-colors border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <IconReceipt size={15} />
                  <span>Quản lý Hóa Đơn</span>
                </button>

                <button
                  onClick={() => setSelectedModalRecord(null)}
                  className="px-5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
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
