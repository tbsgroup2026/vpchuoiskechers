"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconSearch,
  IconRefresh,
  IconEye,
  IconPhoto,
  IconX,
  IconLayoutGrid,
  IconList,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconUpload,
  IconSend,
  IconUserCheck,
  IconArrowRight,
  IconCircleCheck,
  IconCircleX,
  IconArrowBackUp
} from "@tabler/icons-react";
import { GembaRecord, GembaHistory } from "./types";
import { UserProfile } from "@/lib/userProfiles";

interface GembaManagementViewProps {
  selectedScope: { workshopId?: string; lineId?: string; teamId?: string } | null;
  currentUser: UserProfile | null;
}

export default function GembaManagementView({ selectedScope, currentUser }: GembaManagementViewProps) {
  const [records, setRecords] = useState<GembaRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showClosed, setShowClosed] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [pagination, setPagination] = useState({ total: 0, showing: 0, hidden: 0, overdue: 0 });

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<GembaRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  // New Ticket Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    factory_id: "fac_nmmd",
    workshop_id: "ws_dau_vao",
    line_id: "line_chat1",
    team_id: "team_chat1_cat",
    category_id: "cat_mmtb",
    priority: "TRUNG_BINH",
    assigned_group: "MMTB SK MĐ",
    due_at: "",
    image_url: "",
  });

  // Workflow Transition States
  const [workflowNote, setWorkflowNote] = useState<string>("");
  const [attachedPhoto, setAttachedPhoto] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (showClosed) params.set("include_closed", "true");
      if (selectedScope?.workshopId) params.set("workshop_id", selectedScope.workshopId);
      if (selectedScope?.lineId) params.set("line_id", selectedScope.lineId);
      if (selectedScope?.teamId) params.set("team_id", selectedScope.teamId);

      const res = await fetch(`/api/gemba/records?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setRecords(json.data || []);
          setPagination(json.pagination || { total: 0, showing: 0, hidden: 0, overdue: 0 });
        }
      }
    } catch (err) {
      console.warn("Fetch records error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search, statusFilter, showClosed, selectedScope]);

  const fetchRecordDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/gemba/records/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSelectedRecord(json.data);
        }
      }
    } catch (err) {
      console.warn("Fetch detail error:", err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.workshop_id || !formData.line_id || !formData.team_id) {
      alert("Vui lòng điền đầy đủ tiêu đề, phân xưởng, line và tổ công đoạn!");
      return;
    }

    try {
      const res = await fetch("/api/gemba/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          due_at: formData.due_at ? formData.due_at : new Date(Date.now() + 2 * 86400000).toISOString().replace("T", " ").substring(0, 19),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          alert(`Tạo phiếu Gemba thành công! Mã phiếu: ${json.code}`);
          setIsCreateModalOpen(false);
          setFormData({
            title: "",
            description: "",
            factory_id: "fac_nmmd",
            workshop_id: "ws_dau_vao",
            line_id: "line_chat1",
            team_id: "team_chat1_cat",
            category_id: "cat_mmtb",
            priority: "TRUNG_BINH",
            assigned_group: "MMTB SK MĐ",
            due_at: "",
            image_url: "",
          });
          fetchRecords();
        } else {
          alert(json.message || "Lỗi tạo phiếu!");
        }
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    }
  };

  // Workflow State Machine Action Handler
  const handleWorkflowTransition = async (targetStatus: string, actionType: string) => {
    if (!selectedRecord) return;

    if (targetStatus === "WAITING_CONFIRMATION" && !workflowNote.trim()) {
      alert("Vui lòng điền nội dung kết quả khắc phục sự cố!");
      return;
    }

    if (actionType === "REJECT" && !workflowNote.trim()) {
      alert("Vui lòng điền lý do 'Không đạt' để người phụ trách xử lý lại!");
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/gemba/records/${selectedRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          action_type: actionType,
          note: workflowNote,
          photo_url: attachedPhoto || null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          alert(json.message || "Đã chuyển trạng thái quy trình thành công!");
          setWorkflowNote("");
          setAttachedPhoto("");
          await fetchRecordDetail(selectedRecord.id);
          fetchRecords();
        } else {
          alert(json.message || "Lỗi chuyển trạng thái quy trình!");
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || "Thao tác không được phép theo quy trình!");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Chỉ chấp nhận file ảnh!");
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/gemba/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            record_id: selectedRecord ? selectedRecord.id : null,
            image: base64,
            file_type: file.type,
            file_name: file.name,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setAttachedPhoto(json.url);
            alert("Upload ảnh thành công lên Cloudflare R2!");
          }
        }
      } catch (err) {
        alert("Upload thất bại!");
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 bg-slate-100/70 min-h-screen font-sans text-slate-900">
      {/* HERO BANNER SECTION */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-lg border border-emerald-800/20 bg-slate-900 text-white p-6 sm:p-7 group">
        {/* Background Real Image & Dark Emerald Gradient Overlay */}
        <img
          src="/images/KGLV/CĐTT 1 LỐI ĐI XUỐNG KV MẪU.png"
          alt="Gemba Walk Hiện Trường"
          className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#006838]/90 via-[#004d29]/80 to-slate-950/85 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 bg-white/10 backdrop-blur-md px-3 py-0.5 rounded-lg border border-white/15">
              QUẢN LÝ HIỆN TRƯỜNG & KHẮC PHỤC SỰ CỐ
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Gemba Walk SKECHERS – Kiểm Trả &amp; Khắc Phục Hiện Trường
            </h1>
            <p className="text-xs text-emerald-100/90 font-medium">
              Số hóa quy trình kiểm tra Gemba, phản ứng nhanh 2H và theo dõi trạng thái khắc phục trực tiếp trên chuyền.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 text-xs font-black backdrop-blur-md">
              Dữ liệu Realtime
            </span>
          </div>
        </div>
      </div>

      {/* 3.1 TOP BAR ACTIONS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer ring-1 ring-emerald-400/30"
          >
            <IconPlus size={18} />
            <span>Tạo Phiếu Gemba Mới</span>
          </button>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 select-none px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>Hiện tất cả phiếu đã đóng</span>
          </label>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm phiếu, mã, nội dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/50 transition-all w-44 sm:w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="NEW">Mới / Chờ tiếp nhận</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="WAITING_CONFIRMATION">Chờ xác nhận</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="OVERDUE">Quá hạn</option>
          </select>

          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-emerald-700 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Chế độ Danh sách"
            >
              <IconList size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-emerald-700 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Chế độ Lưới"
            >
              <IconLayoutGrid size={16} />
            </button>
          </div>

          <button
            onClick={fetchRecords}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors border border-slate-200/80 shadow-2xs cursor-pointer active:scale-95"
            title="Làm mới dữ liệu"
          >
            <IconRefresh size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 3.2 SUMMARY LINE */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-600 shadow-2xs">
        <div className="flex items-center gap-2">
          <span>Tổng: <strong className="text-slate-900">{pagination.total}</strong></span>
          <span>|</span>
          <span>Hiển thị: <strong className="text-slate-900">{pagination.showing}</strong></span>
          <span>|</span>
          <span className="text-slate-500">👁 Đã ẩn {pagination.hidden} phiếu</span>
        </div>

        {pagination.overdue > 0 && (
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[11px] border border-rose-200 flex items-center gap-1">
            <IconAlertTriangle size={14} />
            <span>Quá hạn: {pagination.overdue}</span>
          </span>
        )}
      </div>

      {/* 3.3 DATA TABLE */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">TRẠNG THÁI WORKFLOW</th>
                  <th className="py-3 px-3">TIÊU ĐỀ</th>
                  <th className="py-3 px-3">NHÀ MÁY</th>
                  <th className="py-3 px-3">LINE</th>
                  <th className="py-3 px-3">TỔ</th>
                  <th className="py-3 px-3">LOẠI</th>
                  <th className="py-3 px-3">ƯU TIÊN</th>
                  <th className="py-3 px-3">NGƯỜI TẠO</th>
                  <th className="py-3 px-3">PHỤ TRÁCH</th>
                  <th className="py-3 px-3">NGÀY TẠO</th>
                  <th className="py-3 px-3 text-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                      Không có phiếu Gemba nào phù hợp điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {r.code}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {r.is_overdue && r.status !== "COMPLETED" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200 mr-1">
                            Quá hạn
                          </span>
                        ) : null}

                        {r.status === "COMPLETED" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                            Hoàn thành
                          </span>
                        ) : r.status === "WAITING_CONFIRMATION" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-black border border-cyan-200">
                            Chờ xác nhận
                          </span>
                        ) : r.status === "PROCESSING" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black border border-blue-200">
                            Đang xử lý
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200">
                            Mới / Chờ tiếp nhận
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 max-w-xs truncate">
                        {r.title}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {r.factory_name || "NM SK MIỀN ĐỒNG"}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {r.line_name || "LINE CHẶT 1"}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {r.team_name || "Cắt"}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {r.category_name || "MMTB"}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {r.priority === "CAO" ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Cao
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                            Trung bình
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-bold whitespace-nowrap">
                        {r.created_by_name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-medium">
                        {r.assigned_to_name || r.assigned_group || "MMTB SK MĐ"}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {r.created_at}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={async () => {
                            await fetchRecordDetail(r.id);
                            setDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer border border-emerald-200 flex items-center gap-1 font-bold"
                        >
                          <IconEye size={16} />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">{r.code}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  {r.status}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-800">{r.title}</h4>
              <button
                onClick={async () => {
                  await fetchRecordDetail(r.id);
                  setDetailModalOpen(true);
                }}
                className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                Mở Workflow Timeline
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3.4 MODAL FORM TẠO GEMBA MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                Tạo Phiếu Gemba Mới
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề vấn đề hiện trường (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Băng chuyền bị giật tiếng kêu lớn"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phân xưởng (PX)</label>
                  <select
                    value={formData.workshop_id}
                    onChange={(e) => setFormData({ ...formData, workshop_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ws_go">PX Gò</option>
                    <option value="ws_may">PX May</option>
                    <option value="ws_dau_vao">PX Đầu vào</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Line / Dây chuyền</label>
                  <select
                    value={formData.line_id}
                    onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="line_chat1">LINE CHẶT 1</option>
                    <option value="line_inep1">LINE IN ÉP 1</option>
                    <option value="line_htg1">LINE_HTG 1</option>
                    <option value="line_htm1">LINE_HTM 1</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ công đoạn</label>
                  <select
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="team_chat1_cat">Cắt</option>
                    <option value="team_chat1_lang">Lạng-cán dán-đồng bộ</option>
                    <option value="team_inep1_inep">In-ép</option>
                    <option value="team_htg1_1">Tổ công đoạn 1</option>
                    <option value="team_htm1_1">Tổ may 1</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Danh mục vấn đề</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cat_mmtb">MMTB</option>
                    <option value="cat_chat_luong">Chất lượng</option>
                    <option value="cat_7s">7S</option>
                    <option value="cat_tuan_thu">Tuân thủ</option>
                    <option value="cat_lang_phi">Lãng phí</option>
                    <option value="cat_khac">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả hiện trạng sự cố</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả chi tiết nguyên nhân, ảnh hưởng..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ảnh hiện trường (Cloudflare R2)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  Tạo phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.5 MODAL CHI TIẾT GEMBA & VISUAL WORKFLOW TIMELINE */}
      {detailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-5 my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-700 tracking-widest">{selectedRecord.code}</span>
                  {selectedRecord.is_overdue && selectedRecord.status !== "COMPLETED" && (
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black">
                      QUÁ HẠN
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-slate-900">{selectedRecord.title}</h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1 text-xs font-sans">
              {/* Scope & Details Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div><strong>Phân xưởng:</strong> {selectedRecord.workshop_name}</div>
                <div><strong>Line / Dây chuyền:</strong> {selectedRecord.line_name}</div>
                <div><strong>Tổ công đoạn:</strong> {selectedRecord.team_name}</div>
                <div><strong>Người tạo:</strong> {selectedRecord.created_by_name}</div>
                <div><strong>Người phụ trách:</strong> {selectedRecord.assigned_to_name || selectedRecord.assigned_group}</div>
                <div><strong>Hạn xử lý:</strong> {selectedRecord.due_at || "Target 2 ngày"}</div>
              </div>

              {selectedRecord.description && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <strong className="block text-slate-700 mb-1">Mô tả sự cố:</strong>
                  <p className="text-slate-600">{selectedRecord.description}</p>
                </div>
              )}

              {/* 📍 VISUAL WORKFLOW TIMELINE */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <IconClock size={16} className="text-emerald-600" />
                  <span>Quy Trình & Tiến Trình Lịch Sử Khắc Phục (Timeline)</span>
                </h4>

                {/* Stepper Progress Bar */}
                <div className="flex items-center justify-between px-2 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] font-extrabold text-slate-600">
                  <div className={`flex items-center gap-1 ${selectedRecord.status === "NEW" ? "text-amber-600" : "text-emerald-700"}`}>
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Tạo phiếu</span>
                  </div>
                  <IconArrowRight size={14} className="text-slate-300" />
                  <div className={`flex items-center gap-1 ${selectedRecord.status === "PROCESSING" ? "text-blue-600" : (selectedRecord.status === "WAITING_CONFIRMATION" || selectedRecord.status === "COMPLETED" ? "text-emerald-700" : "text-slate-400")}`}>
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Đang xử lý</span>
                  </div>
                  <IconArrowRight size={14} className="text-slate-300" />
                  <div className={`flex items-center gap-1 ${selectedRecord.status === "WAITING_CONFIRMATION" ? "text-cyan-600" : (selectedRecord.status === "COMPLETED" ? "text-emerald-700" : "text-slate-400")}`}>
                    <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Chờ xác nhận</span>
                  </div>
                  <IconArrowRight size={14} className="text-slate-300" />
                  <div className={`flex items-center gap-1 ${selectedRecord.status === "COMPLETED" ? "text-emerald-700" : "text-slate-400"}`}>
                    <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px]">4</span>
                    <span>Hoàn thành</span>
                  </div>
                </div>

                {/* Timeline Entries List */}
                <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                  {(selectedRecord.history || []).length === 0 ? (
                    <div className="text-slate-400 text-xs italic">Phiếu vừa tạo, chưa có lịch sử xử lý.</div>
                  ) : (
                    (selectedRecord.history || []).map((h: GembaHistory) => (
                      <div key={h.id} className="relative bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                        <div className="absolute -left-[23px] top-3.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white"></div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-black text-slate-800">
                            {h.action_type === "CREATE" && "📋 Tạo phiếu Gemba mới"}
                            {h.action_type === "ACCEPT" && "⚙️ Phân công / Tiếp nhận xử lý"}
                            {h.action_type === "SUBMIT_CONFIRMATION" && "📤 Đã gửi kết quả khắc phục (Chờ xác nhận)"}
                            {h.action_type === "APPROVE" && "✅ Xác nhận ĐẠT — Hoàn thành đóng phiếu"}
                            {h.action_type === "REJECT" && "❌ Xác nhận KHÔNG ĐẠT — Yêu cầu xử lý lại"}
                          </span>
                          <span className="text-slate-400 font-semibold">{h.created_at}</span>
                        </div>
                        <div className="text-slate-600 font-medium">
                          <strong>Thực hiện bởi:</strong> {h.performed_by_name || h.performed_by}
                        </div>
                        {h.note && (
                          <div className="text-slate-700 bg-white p-2 rounded-xl border border-slate-200/80 font-semibold mt-1">
                            {h.note}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 📍 CONTEXT-DRIVEN WORKFLOW ACTIONS & BUTTONS */}
              <div className="space-y-3 pt-3 border-t border-slate-200 bg-slate-50 p-4 rounded-2xl">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Hành Động Chuyển Trạng Thái (Tùy Theo Trạng Thái Hiện Tại)
                </h4>

                {/* Case 1: Status = NEW -> Show "Phân công / Tiếp nhận" */}
                {selectedRecord.status === "NEW" && (
                  <div className="space-y-2">
                    <p className="text-slate-600 font-semibold">Phiếu mới tạo. Người phụ trách / Đốc công bấm tiếp nhận để bắt đầu xử lý:</p>
                    <button
                      disabled={submittingAction}
                      onClick={() => handleWorkflowTransition("PROCESSING", "ACCEPT")}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <IconUserCheck size={16} />
                      <span>Tiếp nhận xử lý (MỚI → ĐANG XỬ LÝ)</span>
                    </button>
                  </div>
                )}

                {/* Case 2: Status = PROCESSING -> Show "Cập nhật giải pháp & Gửi xác nhận" */}
                {selectedRecord.status === "PROCESSING" && (
                  <div className="space-y-3">
                    <p className="text-slate-600 font-semibold">Nhập nội dung đã khắc phục và gửi cho QLCL / Người tạo xác nhận:</p>
                    <textarea
                      rows={2}
                      placeholder="Nhập giải pháp khắc phục sự cố đã thực hiện (*)..."
                      value={workflowNote}
                      onChange={(e) => setWorkflowNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    ></textarea>

                    <div className="flex items-center gap-3">
                      <label className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-2">
                        <IconUpload size={16} />
                        <span>Đính kèm ảnh sau khắc phục (R2)</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                      {uploadingPhoto && <span className="text-[10px] text-emerald-600 font-bold">Đang tải ảnh...</span>}
                      {attachedPhoto && <span className="text-[10px] text-emerald-700 font-bold">✔ Đã đính kèm ảnh</span>}
                    </div>

                    <button
                      disabled={submittingAction}
                      onClick={() => handleWorkflowTransition("WAITING_CONFIRMATION", "SUBMIT_CONFIRMATION")}
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <IconSend size={16} />
                      <span>Gửi kết quả xác nhận (ĐANG XỬ LÝ → CHỜ XÁC NHẬN)</span>
                    </button>
                  </div>
                )}

                {/* Case 3: Status = WAITING_CONFIRMATION -> Show "Xác nhận ĐẠT" vs "Không ĐẠT" */}
                {selectedRecord.status === "WAITING_CONFIRMATION" && (
                  <div className="space-y-3">
                    <p className="text-slate-600 font-semibold">Kết quả xử lý đang chờ nghiệm thu. Bạn chọn xác nhận ĐẠT hoặc KHÔNG ĐẠT:</p>
                    <textarea
                      rows={2}
                      placeholder="Ghi chú xác nhận / Lý do nếu Không đạt..."
                      value={workflowNote}
                      onChange={(e) => setWorkflowNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    ></textarea>

                    <div className="flex items-center gap-3">
                      <button
                        disabled={submittingAction}
                        onClick={() => handleWorkflowTransition("COMPLETED", "APPROVE")}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                      >
                        <IconCircleCheck size={18} />
                        <span>Xác nhận ĐẠT (CHỜ XÁC NHẬN → HOÀN THÀNH)</span>
                      </button>

                      <button
                        disabled={submittingAction}
                        onClick={() => handleWorkflowTransition("PROCESSING", "REJECT")}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                      >
                        <IconCircleX size={18} />
                        <span>Không ĐẠT (Yêu cầu xử lý lại → PROCESSING)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Case 4: Status = COMPLETED */}
                {selectedRecord.status === "COMPLETED" && (
                  <div className="p-3 rounded-xl bg-emerald-100/80 text-emerald-900 font-bold text-xs flex items-center gap-2">
                    <IconCheck size={18} />
                    <span>Phiếu Gemba đã hoàn thành nghiệm thu đóng phiếu! Toàn bộ lịch sử đã lưu vết an toàn.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
