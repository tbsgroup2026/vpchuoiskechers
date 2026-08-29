"use client";

import React, { useState } from "react";
import {
  IconSend,
  IconCheck,
  IconSparkles,
  IconPhoto,
  IconTrash,
  IconUpload,
  IconQrcode,
  IconBuildingFactory,
  IconUserCheck,
  IconMapPin,
  IconTag,
  IconClock,
  IconArrowLeft,
  IconRefresh,
  IconVideo,
} from "@tabler/icons-react";

const CATEGORIES = [
  { id: "PRODUCTIVITY", label: "3.Tăng Năng suất", color: "bg-blue-600 text-white" },
  { id: "COST_SAVING", label: "2.Tiết kiệm Chi phí", color: "bg-emerald-600 text-white" },
  { id: "MATERIAL_SAVING", label: "1.Tiết kiệm Vật tư", color: "bg-blue-500 text-white" },
  { id: "SAFETY", label: "4.An toàn lao động", color: "bg-[#006838] text-white" },
  { id: "5S", label: "5.5S", color: "bg-sky-500 text-white" },
  { id: "AUTOMATION", label: "6.Tự động hoá", color: "bg-indigo-600 text-white" },
  { id: "EQUIPMENT", label: "7.MMTB CCDC", color: "bg-purple-600 text-white" },
  { id: "OTHER", label: "8.Khác", color: "bg-slate-600 text-white" },
];

const REGIONS = [
  "Kiên Giang 1",
  "Kiên Giang 2",
  "Kiên Giang 3",
  "Hoàn Thiện Đế",
  "Nhà Máy Miền Đông",
  "VP Chuỗi (R&D)",
];

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = "dwl2xtbqa";
const CLOUDINARY_PRESETS = {
  image: "vpchuoisk",
  video: "vpchuoisk",
};

export default function KaizenPublicSubmitForm() {
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    proposerName: "",
    proposerEmpCode: "",
    proposerPosition: "",
    proposerMonth: new Date().getMonth() + 1,
    proposerYear: new Date().getFullYear(),
    factory: "VP2 SKECHERS",
    department: "",
    region: "Kiên Giang 1",
    hrSuggestor: "",
    customer: "",
    registrationType: "LUU_TRU",
    category: "PRODUCTIVITY",
    categoryLabel: "3.Tăng Năng suất",
    title: "",
    beforeDescription: "",
    afterSolution: "",
    productGroup: "",
    productCode: "",
    quantity: 0,
    savedSeconds: 30,
    pricingDirection: "",
    timeBeforeSeconds: 0,
    timeAfterSeconds: 0,
    efficiencyValueVND: 0,
    beforeImageUrl: "",
    afterImageUrl: "",
    beforeVideoUrl: "",
    afterVideoUrl: "",
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Upload file to Cloudinary
  const uploadToCloudinary = async (fileOrDataUrl: File | string, fileType: "image" | "video"): Promise<string> => {
    try {
      const formData = new FormData();
      const preset = CLOUDINARY_PRESETS[fileType];

      if (typeof fileOrDataUrl === "string") {
        // Convert base64 to Blob
        const response = await fetch(fileOrDataUrl);
        const blob = await response.blob();
        formData.append("file", blob);
      } else {
        formData.append("file", fileOrDataUrl);
      }

      formData.append("upload_preset", preset);
      formData.append("folder", "vpchuoiskechers");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${fileType}/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || `Failed to upload ${fileType}`);
      }

      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error(`Cloudinary ${fileType} upload error:`, err);
      throw err;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: "beforeImageUrl" | "afterImageUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("❌ Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("❌ Dung lượng ảnh tối đa là 10MB");
      return;
    }

    try {
      setUploading(true);
      showToast("☁️ Đang tải ảnh lên Cloudinary...");
      const cloudinaryUrl = await uploadToCloudinary(file, "image");
      setForm((prev) => ({
        ...prev,
        [fieldName]: cloudinaryUrl,
      }));
      showToast("✅ Ảnh đã tải lên Cloudinary thành công!");
    } catch (err: any) {
      showToast(`❌ Lỗi tải ảnh: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: "beforeVideoUrl" | "afterVideoUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      showToast("❌ Vui lòng chọn file video (MP4, WEBM, MOV)");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast("❌ Dung lượng video tối đa là 50MB");
      return;
    }

    try {
      setUploading(true);
      showToast("🎬 Đang tải video lên Cloudinary...");
      const cloudinaryUrl = await uploadToCloudinary(file, "video");
      setForm((prev) => ({
        ...prev,
        [fieldName]: cloudinaryUrl,
      }));
      showToast("✅ Video đã tải lên Cloudinary thành công!");
    } catch (err: any) {
      showToast(`❌ Lỗi tải video: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.proposerName.trim() ||
      !form.proposerEmpCode.trim() ||
      !form.proposerPosition.trim() ||
      !form.factory.trim() ||
      !form.department.trim() ||
      !form.region.trim() ||
      !form.category.trim() ||
      !form.title.trim() ||
      !form.beforeDescription.trim() ||
      !form.afterSolution.trim() ||
      !form.pricingDirection.trim() ||
      (form.pricingDirection === "THOI_GIAN" && (!form.timeBeforeSeconds || !form.timeAfterSeconds)) ||
      (form.pricingDirection === "TRI_GIA" && !form.efficiencyValueVND)
    ) {
      showToast("⚠️ Vui lòng điền đầy đủ tất cả các trường thông tin bắt buộc có dấu (*) màu đỏ!");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/ci-kaizen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          // ✅ Save to "Lưu Trữ" (Archive) tag on /work/kaizen
          registrationType: "LUU_TRU",
          isPublicScan: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmittedCode(json.code || "CI-2026-OK");
      } else {
        showToast(`❌ ${json.message || "Không thể gửi đề xuất"}`);
      }
    } catch (err) {
      showToast("❌ Lỗi mạng hoặc kết nối máy chủ!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedCode(null);
    setForm({
      proposerName: "",
      proposerEmpCode: "",
      proposerPosition: "",
      proposerMonth: new Date().getMonth() + 1,
      proposerYear: new Date().getFullYear(),
      factory: "VP2 SKECHERS",
      department: "",
      region: "Kiên Giang 1",
      hrSuggestor: "",
      customer: "",
      registrationType: "CHO_DANH_GIA",
      category: "PRODUCTIVITY",
      categoryLabel: "3.Tăng Năng suất",
      title: "",
      beforeDescription: "",
      afterSolution: "",
      productGroup: "",
      productCode: "",
      quantity: 0,
      savedSeconds: 30,
      pricingDirection: "",
      timeBeforeSeconds: 0,
      timeAfterSeconds: 0,
      efficiencyValueVND: 0,
      beforeImageUrl: "",
      afterImageUrl: "",
      beforeVideoUrl: "",
      afterVideoUrl: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#0b1739] text-slate-100 font-sans selection:bg-[#006838] selection:text-white flex flex-col items-center justify-start p-3 sm:p-5">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-4 z-50 px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs shadow-2xl animate-in slide-in-from-top-3 flex items-center gap-2 border border-amber-300">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-xl bg-white text-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#006838] via-[#0b1739] to-[#0b1739] p-5 text-white flex flex-col gap-2 relative">
          <div className="flex items-center justify-between">
            <div className="bg-white rounded-xl px-2.5 py-1 flex items-center justify-center shadow-md">
              <img src="/images/tbs-logo.png" alt="TBS Group" className="h-6 w-auto object-contain" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black tracking-wider uppercase border border-amber-400/30 flex items-center gap-1">
              <IconQrcode size={13} />
              <span>Quét Mã QR Công Nhân</span>
            </span>
          </div>

          <div className="pt-2">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              Đăng Ký Đề Xuất Cải Tiến Kaizen
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Cổng tiếp nhận sáng kiến cải tiến nhanh dành cho công nhân nhà máy (Không cần đăng nhập)
            </p>
          </div>
        </div>

        {/* Form Body or Success View */}
        {submittedCode ? (
          <div className="p-6 text-center space-y-5 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006838] flex items-center justify-center mx-auto shadow-lg border-2 border-emerald-300">
              <IconCheck size={36} className="stroke-[3]" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#006838] text-xs font-black font-mono">
                MÃ ĐỀ XUẤT: {submittedCode}
              </span>
              <h2 className="text-xl font-black text-slate-900 pt-2">Gửi Đề Xuất Thành Công!</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Đề xuất Kaizen của bạn đã được ghi nhận trực tiếp vào hệ thống cơ sở dữ liệu và đang chuyển đến luồng phê duyệt &amp; chấm điểm thi đua. Cảm ơn đóng góp của bạn!
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-5 py-3 rounded-2xl bg-[#006838] text-white font-black text-xs hover:bg-[#004d29] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconRefresh size={16} />
                <span>GỬI THÊM ĐỀ XUẤT KHÁC</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 text-xs text-slate-700">
            {/* SECTION 1: CÔNG NHÂN & VỊ TRÍ LÀM VIỆC */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-[#006838]">
                <IconUserCheck size={18} />
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  1. THÔNG TIN CÔNG NHÂN
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-black text-slate-900">
                    Họ và Tên Công Nhân <span className="text-rose-600 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.proposerName}
                    onChange={(e) => setForm({ ...form, proposerName: e.target.value })}
                    placeholder="VD: Trần Văn Nam"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-900">
                    Mã Số Thẻ / Mã Nhân Viên <span className="text-rose-600 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.proposerEmpCode}
                    onChange={(e) => setForm({ ...form, proposerEmpCode: e.target.value })}
                    placeholder="VD: CN-88201 hoặc 202608101"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-black text-slate-900">
                    Vị Trí Công Việc (VTCV) <span className="text-rose-600 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.proposerPosition}
                    onChange={(e) => setForm({ ...form, proposerPosition: e.target.value })}
                    placeholder="VD: May Man, Cắt May, Kiểm Chất Lượng"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-900">Khách Hàng:</label>
                  <input
                    type="text"
                    value={form.customer}
                    onChange={(e) => setForm({ ...form, customer: e.target.value })}
                    placeholder="VD: Skechers, Nike, Adidas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-black text-slate-900">Tháng:</label>
                  <select
                    value={form.proposerMonth}
                    onChange={(e) => setForm({ ...form, proposerMonth: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        Tháng {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-900">Năm:</label>
                  <select
                    value={form.proposerYear}
                    onChange={(e) => setForm({ ...form, proposerYear: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-900">Nhân Sự Đề Xuất:</label>
                  <input
                    type="text"
                    value={form.hrSuggestor}
                    onChange={(e) => setForm({ ...form, hrSuggestor: e.target.value })}
                    placeholder="Họ tên nhân sự"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-black text-slate-900">
                    Nhà Máy / Chi Nhánh <span className="text-rose-600 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.factory}
                    onChange={(e) => setForm({ ...form, factory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-900">
                    Tổ / Xưởng Làm Việc <span className="text-rose-600 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="VD: Tổ May 3 - Xưởng Quai"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-900">
                    Khu Vực <span className="text-rose-600 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    required
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: NỘI DUNG SÁNG KIẾN */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-blue-600">
                <IconSparkles size={18} />
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  2. NỘI DUNG SÁNG KIẾN CẢI TIẾN
                </h3>
              </div>

              <div className="space-y-1">
                <label className="font-black text-slate-900">
                  Danh Mục Cải Tiến <span className="text-rose-600 font-bold ml-0.5">*</span>
                </label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => {
                    const found = CATEGORIES.find((c) => c.id === e.target.value);
                    setForm({
                      ...form,
                      category: e.target.value,
                      categoryLabel: found ? found.label : e.target.value,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-black text-slate-900">
                  Tên Tiêu Đề Cải Tiến <span className="text-rose-600 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Tự chế gá kẹp dưỡng may giúp giảm thao tác thừa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-black text-slate-900">Nhóm SP/DV:</label>
                  <input
                    type="text"
                    value={form.productGroup}
                    onChange={(e) => setForm({ ...form, productGroup: e.target.value })}
                    placeholder="VD: Quai, Mũi, Gót"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-900">Mã Hàng:</label>
                  <input
                    type="text"
                    value={form.productCode}
                    onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                    placeholder="VD: SK-001, SK-002"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-900">Số Lượng Đơn Hàng:</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value || "0", 10) })}
                    placeholder="VD: 1000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-black text-slate-900">
                  Mô Tả Hiện Trạng (Khó khăn trước cải tiến) <span className="text-rose-600 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.beforeDescription}
                  onChange={(e) => setForm({ ...form, beforeDescription: e.target.value })}
                  placeholder="Ghi rõ tình trạng cũ, khó khăn hoặc điểm lãng phí..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-[#006838] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-slate-900">
                  Giải Pháp &amp; Ý Tưởng Cải Tiến Mới <span className="text-rose-600 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.afterSolution}
                  onChange={(e) => setForm({ ...form, afterSolution: e.target.value })}
                  placeholder="Ghi rõ cách thức cải tiến mới và lợi ích mang lại..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-[#006838] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-slate-900">Thời Gian Tiết Kiệm Dự Kiến (Giây/Đôi):</label>
                <input
                  type="number"
                  value={form.savedSeconds}
                  onChange={(e) => setForm({ ...form, savedSeconds: parseInt(e.target.value || "0", 10) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-slate-900">
                  Hướng Dành Giá <span className="text-rose-600 font-bold ml-0.5">*</span>
                </label>
                <select
                  required
                  value={form.pricingDirection}
                  onChange={(e) => setForm({ ...form, pricingDirection: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838]"
                >
                  <option value="">Chọn hướng...</option>
                  <option value="THOI_GIAN">Thời gian</option>
                  <option value="TRI_GIA">Trị giá</option>
                </select>
              </div>

              {form.pricingDirection === "THOI_GIAN" && (
                <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/50 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex-shrink-0 mt-0.5">
                      ⏱
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-xs font-black text-blue-900">Hướng Thời gian: Nhập thời gian sản xuất trước và sau (đơn vị: giây)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-black text-slate-900 text-xs">Thời gian SX trước (giây) <span className="text-rose-600 font-bold ml-0.5">*</span></label>
                      <input
                        type="number"
                        required
                        value={form.timeBeforeSeconds}
                        onChange={(e) => setForm({ ...form, timeBeforeSeconds: parseInt(e.target.value || "0", 10) })}
                        placeholder="VD: 7200"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                      <p className="text-[10px] text-slate-500">Thời gian trung bình trước cải tiến</p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-slate-900 text-xs">Thời gian SX sau (giây) <span className="text-rose-600 font-bold ml-0.5">*</span></label>
                      <input
                        type="number"
                        required
                        value={form.timeAfterSeconds}
                        onChange={(e) => setForm({ ...form, timeAfterSeconds: parseInt(e.target.value || "0", 10) })}
                        placeholder="VD: 4800"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                      <p className="text-[10px] text-slate-500">Thời gian trung bình sau cải tiến</p>
                    </div>
                  </div>
                </div>
              )}

              {form.pricingDirection === "TRI_GIA" && (
                <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex-shrink-0 mt-0.5">
                      💵
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-xs font-black text-emerald-900">Hướng Trị giá: Nhập giá trị tiết kiếm được (đơn vị: VND)</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-900 text-xs">Hiệu Quả Cải Tiến (VND) <span className="text-rose-600 font-bold ml-0.5">*</span></label>
                    <input
                      type="number"
                      required
                      value={form.efficiencyValueVND}
                      onChange={(e) => setForm({ ...form, efficiencyValueVND: parseInt(e.target.value || "0", 10) })}
                      placeholder="VD: 5000000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                    <p className="text-[10px] text-slate-500">Giá trị tiết kiếm được (chi phí vật tư, nhân công, thời gian quy đổi...)</p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: ẢNH CHỤP MINH HỌA */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-indigo-600">
                <IconPhoto size={18} />
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  3. CHỤP / TẢI ẢNH MINH HỌA (TÙY CHỌN)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Before Image */}
                <div className="space-y-2 p-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-900 text-xs">Ảnh Trước Cải Tiến:</label>
                    {form.beforeImageUrl && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, beforeImageUrl: "" })}
                        className="text-[11px] text-rose-600 font-bold flex items-center gap-1"
                      >
                        <IconTrash size={13} />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>

                  {form.beforeImageUrl ? (
                    <img src={form.beforeImageUrl} alt="Before" className="w-full h-32 object-cover rounded-xl border" />
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3 h-32 bg-white rounded-xl border border-slate-200 cursor-pointer text-center hover:bg-emerald-50/50">
                      <IconUpload size={22} className="text-[#006838] mb-1" />
                      <span className="text-[11px] font-bold text-slate-900">Bấm chụp hoặc chọn ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "beforeImageUrl")}
                      />
                    </label>
                  )}
                </div>

                {/* After Image */}
                <div className="space-y-2 p-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-900 text-xs">Ảnh Sau Cải Tiến:</label>
                    {form.afterImageUrl && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, afterImageUrl: "" })}
                        className="text-[11px] text-rose-600 font-bold flex items-center gap-1"
                      >
                        <IconTrash size={13} />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>

                  {form.afterImageUrl ? (
                    <img src={form.afterImageUrl} alt="After" className="w-full h-32 object-cover rounded-xl border" />
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3 h-32 bg-white rounded-xl border border-slate-200 cursor-pointer text-center hover:bg-emerald-50/50">
                      <IconUpload size={22} className="text-[#006838] mb-1" />
                      <span className="text-[11px] font-bold text-slate-900">Bấm chụp hoặc chọn ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "afterImageUrl")}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 4: TẢI VIDEO TRƯỚC / SAU CẢI TIẾN */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-600">
                <IconVideo size={18} />
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  4. TẢI VIDEO TRƯỚC / SAU CẢI TIẾN (TÙY CHỌN)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Before Video */}
                <div className="space-y-2 p-3 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-900 text-xs">Video Trước Cải Tiến:</label>
                    {form.beforeVideoUrl && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, beforeVideoUrl: "" })}
                        className="text-[11px] text-rose-600 font-bold flex items-center gap-1"
                      >
                        <IconTrash size={13} />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>

                  {form.beforeVideoUrl ? (
                    <video controls src={form.beforeVideoUrl} className="w-full h-36 object-cover rounded-xl border border-purple-300 bg-black" />
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3 h-36 bg-white rounded-xl border border-slate-200 cursor-pointer text-center hover:bg-purple-50">
                      <IconVideo size={24} className="text-purple-600 mb-1" />
                      <span className="text-[11px] font-bold text-slate-900">Chụp hoặc chọn video</span>
                      <span className="text-[9px] text-slate-400 font-medium">MP4, WEBM, MOV (Tối đa 50MB)</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleVideoUpload(e, "beforeVideoUrl")}
                      />
                    </label>
                  )}
                </div>

                {/* After Video */}
                <div className="space-y-2 p-3 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-900 text-xs">Video Sau Cải Tiến:</label>
                    {form.afterVideoUrl && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, afterVideoUrl: "" })}
                        className="text-[11px] text-rose-600 font-bold flex items-center gap-1"
                      >
                        <IconTrash size={13} />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>

                  {form.afterVideoUrl ? (
                    <video controls src={form.afterVideoUrl} className="w-full h-36 object-cover rounded-xl border border-purple-300 bg-black" />
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3 h-36 bg-white rounded-xl border border-slate-200 cursor-pointer text-center hover:bg-purple-50">
                      <IconVideo size={24} className="text-purple-600 mb-1" />
                      <span className="text-[11px] font-bold text-slate-900">Chụp hoặc chọn video</span>
                      <span className="text-[9px] text-slate-400 font-medium">MP4, WEBM, MOV (Tối đa 50MB)</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleVideoUpload(e, "afterVideoUrl")}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-3 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full py-3.5 rounded-2xl bg-[#006838] hover:bg-[#004d29] text-white text-sm font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <IconSend size={18} />
                <span>{submitting ? "ĐANG GỬI ĐỀ XUẤT..." : "GỬI ĐỀ XUẤT CẢI TIẾN"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[11px] text-slate-400 font-medium mt-4">
        © 2026 TBS Group — Hệ Thống Số Hóa Sáng Kiến Kaizen &amp; Chuyển Đổi Số
      </div>
    </div>
  );
}
