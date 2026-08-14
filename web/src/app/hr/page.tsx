"use client";

import React, { useState, useEffect } from "react";
import {
  IconUser,
  IconBriefcase,
  IconFileText,
  IconPlus,
  IconTrash,
  IconDownload,
  IconArrowLeft,
  IconLock,
  IconPhone,
  IconMail,
  IconUpload,
  IconFileSpreadsheet,
  IconCheck,
  IconX,
  IconLoader2,
  IconAlertTriangle,
} from "@tabler/icons-react";

export default function HRPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  // Post Job form states
  const [jobTitle, setJobTitle] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobReqs, setJobReqs] = useState("");
  const [formMsg, setFormMsg] = useState("");

  // Excel upload states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelUploading, setExcelUploading] = useState(false);
  const [excelResult, setExcelResult] = useState<any>(null);
  const [excelError, setExcelError] = useState("");

  // Authenticate user & load initial stats
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!storedToken || !storedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    const hasAccess = ["ADMIN", "GIAM_DOC", "TRUONG_PHONG"].includes(parsedUser.role) || parsedUser.departmentCode === "HRD";

    if (!hasAccess) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setUser(parsedUser);
    setToken(storedToken);
    setAuthorized(true);
    setLoading(false);
  }, []);

  const fetchHRData = async () => {
    if (!token) return;
    try {
      // 1. Fetch applications
      const appsRes = await fetch("http://localhost:8000/api/recruitment/hr/applications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(Array.isArray(appsData) ? appsData : []);
      }

      // 2. Fetch jobs
      const jobsRes = await fetch("http://localhost:8000/api/recruitment/jobs");
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(Array.isArray(jobsData) ? jobsData : []);
      }
    } catch (e) {
      console.warn("Could not sync HR administration data.");
    }
  };

  useEffect(() => {
    if (authorized && token) {
      fetchHRData();
    }
  }, [authorized, token]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    if (!jobTitle.trim() || !jobSalary.trim() || !jobLocation.trim() || !jobDesc.trim()) {
      setFormMsg("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/recruitment/hr/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: jobTitle,
          salary: jobSalary,
          location: jobLocation,
          description: jobDesc,
          requirements: jobReqs
        })
      });

      if (res.ok) {
        setFormMsg("Đăng tuyển dụng mới thành công!");
        setJobTitle("");
        setJobSalary("");
        setJobLocation("");
        setJobDesc("");
        setJobReqs("");
        fetchHRData();
      } else {
        setFormMsg("Đăng tuyển dụng thất bại.");
      }
    } catch (err) {
      setFormMsg("Lỗi kết nối mạng.");
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile || !token) return;
    setExcelUploading(true);
    setExcelError("");
    setExcelResult(null);

    try {
      const formData = new FormData();
      formData.append("file", excelFile);

      const res = await fetch("http://localhost:8000/api/recruitment/hr/jobs/upload-excel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setExcelResult(data);
        setExcelFile(null);
        fetchHRData(); // Refresh job list
      } else {
        setExcelError(data.error || "Upload thất bại");
      }
    } catch {
      setExcelError("Lỗi kết nối mạng");
    } finally {
      setExcelUploading(false);
    }
  };

  const downloadTemplate = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/api/recruitment/hr/jobs/template", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "TBS_TuyenDung_Mau.xlsx";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      setExcelError("Không thể tải file mẫu");
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này? Các hồ sơ liên kết vẫn sẽ được giữ lại.")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/recruitment/hr/jobs/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Đã xóa tin tuyển dụng!");
        fetchHRData();
      } else {
        alert("Không thể xóa tin tuyển dụng.");
      }
    } catch (err) {
      alert("Lỗi kết nối.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tbs-dark flex items-center justify-center text-white">
        <span className="text-sm font-mono tracking-wider animate-pulse">Đang tải cấu hình xác thực...</span>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-tbs-dark flex flex-col items-center justify-center text-white p-4 space-y-6">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20">
          <IconLock size={32} />
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h2 className="text-xl font-serif font-bold">Từ Chối Truy Cập</h2>
          <p className="text-gray-400 text-xs leading-relaxed">
            Bạn không có quyền quản trị nhân sự (HR). Vui lòng đăng nhập bằng tài khoản có vai trò Nhân sự hoặc Ban giám đốc.
          </p>
        </div>
        <a 
          href="/work" 
          className="inline-flex items-center gap-2 text-gr3 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider font-serif"
        >
          <IconArrowLeft size={16} /> Quay Lại Bàn Làm Việc
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tbs-dark text-white py-10 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header / Brand info */}
        <header className="bg-[#121614]/80 backdrop-blur-md border border-[#2fd39a1a] rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1 border border-[#2fd39a4d]">
              <img src="/images/crawled/logo.png" alt="TBS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-white leading-none">
                Bàn Làm Việc Nhân Sự (HR)
              </h1>
              <div className="flex gap-2 items-center mt-1.5">
                <span className="text-accent-soft text-[10px] tracking-widest font-mono uppercase font-bold bg-[#1fae7d11] px-2 py-0.5 rounded border border-[#2fd39a22]">
                  {user?.role}
                </span>
                <span className="text-gray-400 text-[10px] font-mono">
                  Quản lý ứng tuyển & Nhu cầu tuyển dụng
                </span>
              </div>
            </div>
          </div>

          <a 
            href="/work"
            className="flex items-center gap-2 bg-[#0b0d0c] border border-[#2fd39a22] hover:border-accent-soft text-gray-300 hover:text-white font-bold px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 shrink-0"
          >
            <IconArrowLeft size={16} /> Quay Lại Dashboard
          </a>
        </header>

        {/* Dashboard Grid split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Candidate applications list (7 cols) */}
          <div className="lg:col-span-7 bg-[#121614]/80 backdrop-blur-md border border-[#2fd39a1a] rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <IconUser className="text-accent-soft" size={20} /> Danh Sách Hồ Sơ Ứng Tuyển
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Theo dõi hồ sơ ứng viên và tải CV trực tiếp được đính kèm.
              </p>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {!Array.isArray(applications) || applications.length === 0 ? (
                <div className="py-16 text-center text-gray-500 font-mono text-xs">
                  Chưa nhận được hồ sơ ứng tuyển nào.
                </div>
              ) : (
                applications.map((app) => (
                  <div 
                    key={app.id}
                    className="bg-[#0b0d0c]/60 p-5 rounded-2xl border border-[#2fd39a11] hover:border-[#2fd39a33] transition-colors space-y-3.5"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <strong className="text-white block text-sm">{app.fullName}</strong>
                        <span className="text-[10px] text-gr3 font-semibold uppercase tracking-wider block mt-1">
                          Vị trí: {app.job?.title || "Không rõ"}
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono">
                        {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5"><IconPhone size={13} className="text-gray-500" /> {app.phone}</span>
                      {app.email && (
                        <span className="flex items-center gap-1.5"><IconMail size={13} className="text-gray-500" /> {app.email}</span>
                      )}
                    </div>

                    {app.coverLetter && (
                      <div className="bg-[#121614] p-3 rounded-xl border border-gray-800 text-xs text-gray-400 leading-relaxed italic">
                        "{app.coverLetter}"
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-800 flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-mono">CV đính kèm:</span>
                      <a 
                        href={`http://localhost:8000${app.cvUrl}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#1fae7d22] hover:bg-accent-light text-accent-soft hover:text-dk font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                      >
                        <IconDownload size={12} /> Tải CV File
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Jobs vacancies posting and management (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Vacancy Form */}
            <div className="bg-[#121614]/80 backdrop-blur-md border border-[#2fd39a1a] rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <IconPlus className="text-accent-soft" size={20} /> Đăng Tin Tuyển Dụng Mới
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Đưa nhu cầu nhân sự mới lên bảng tin công cộng.
                </p>
              </div>

              {formMsg && (
                <div className="bg-[#1fae7d11] text-accent-soft border border-[#2fd39a22] p-4 rounded-xl text-xs">
                  {formMsg}
                </div>
              )}

              <form onSubmit={handlePostJob} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Chức Danh / Vị Trí</span>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ví dụ: Nhân Viên Lập Trình Số"
                    className="bg-[#0b0d0c] text-white px-3 py-2.5 rounded-xl border border-[#2fd39a1a] text-xs focus:outline-none focus:border-accent-soft"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Mức Lương</span>
                    <input
                      type="text"
                      required
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                      placeholder="Ví dụ: 14 - 15tr"
                      className="bg-[#0b0d0c] text-white px-3 py-2.5 rounded-xl border border-[#2fd39a1a] text-xs focus:outline-none focus:border-accent-soft"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Địa Điểm</span>
                    <input
                      type="text"
                      required
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      placeholder="Ví dụ: TBS Zone 2"
                      className="bg-[#0b0d0c] text-white px-3 py-2.5 rounded-xl border border-[#2fd39a1a] text-xs focus:outline-none focus:border-accent-soft"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Mô Tả Công Việc</span>
                  <textarea
                    rows={3}
                    required
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Tóm tắt công việc tuyển dụng..."
                    className="bg-[#0b0d0c] text-white px-3 py-2.5 rounded-xl border border-[#2fd39a1a] text-xs focus:outline-none focus:border-accent-soft"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Yêu Cầu Năng Lực (Tùy chọn)</span>
                  <textarea
                    rows={2}
                    value={jobReqs}
                    onChange={(e) => setJobReqs(e.target.value)}
                    placeholder="HTML & CSS, C#, JavaScript..."
                    className="bg-[#0b0d0c] text-white px-3 py-2.5 rounded-xl border border-[#2fd39a1a] text-xs focus:outline-none focus:border-accent-soft"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gr2 to-gr3 hover:from-gr hover:to-gr2 text-dk font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all active:scale-95"
                >
                  Đăng Tin Lên Cổng Tuyển Dụng
                </button>
              </form>
            </div>

            {/* Excel Bulk Upload Panel */}
            <div className="bg-[#121614]/80 backdrop-blur-md border border-[#2fd39a1a] rounded-3xl p-6 sm:p-8 space-y-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <IconFileSpreadsheet className="text-accent-soft" size={20} /> Upload Excel Tuyển Dụng Hàng Loạt
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Tải file Excel (.xlsx) chứa danh sách vị trí cần đăng. Mỗi dòng là 1 tin tuyển dụng.
                </p>
              </div>

              {/* Download template */}
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1fae7d11] border border-[#2fd39a22] text-accent-soft text-xs font-semibold hover:bg-[#1fae7d22] transition-all"
              >
                <IconDownload size={14} /> Tải File Excel Mẫu
              </button>

              {/* File input */}
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 5 * 1024 * 1024) {
                        setExcelError("File vượt quá 5MB");
                        return;
                      }
                      setExcelFile(f);
                      setExcelError("");
                      setExcelResult(null);
                    }
                  }}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                    excelFile
                      ? "border-accent-soft bg-[#1fae7d11]"
                      : "border-gray-700 hover:border-[#2fd39a44] bg-[#0b0d0c]/40"
                  }`}
                >
                  {excelFile ? (
                    <>
                      <IconFileSpreadsheet size={32} className="text-accent-soft" />
                      <span className="text-accent-soft text-sm font-semibold">{excelFile.name}</span>
                      <span className="text-gray-500 text-[10px]">{(excelFile.size / 1024).toFixed(1)} KB</span>
                    </>
                  ) : (
                    <>
                      <IconUpload size={32} className="text-gray-500" />
                      <span className="text-gray-400 text-sm">Kéo thả hoặc click chọn file Excel</span>
                      <span className="text-gray-600 text-[10px]">.xlsx, .xls — tối đa 5MB</span>
                    </>
                  )}
                </label>
              </div>

              {/* Error */}
              {excelError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <IconAlertTriangle size={14} /> {excelError}
                </div>
              )}

              {/* Result */}
              {excelResult && (
                <div className={`p-4 rounded-xl text-xs space-y-2 ${excelResult.errors?.length > 0 ? "bg-amber-500/10 border border-amber-500/20 text-amber-300" : "bg-[#1fae7d11] border border-[#2fd39a22] text-accent-soft"}`}>
                  <div className="flex items-center gap-2 font-bold">
                    <IconCheck size={14} /> {excelResult.message}
                  </div>
                  <div className="flex gap-4 text-gray-400">
                    <span>{excelResult.created} thành công</span>
                    {excelResult.skipped > 0 && <span>{excelResult.skipped} bỏ qua</span>}
                  </div>
                  {excelResult.errors?.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {excelResult.errors.map((e: any, i: number) => (
                        <div key={i} className="text-red-400 flex items-start gap-1.5">
                          <IconX size={12} className="mt-0.5 shrink-0" /> {e.reason || e.row}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Upload button */}
              <button
                onClick={handleExcelUpload}
                disabled={!excelFile || excelUploading}
                className="w-full bg-gradient-to-r from-gr2 to-gr3 hover:from-gr hover:to-gr2 text-dk font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {excelUploading ? (
                  <><IconLoader2 size={14} className="animate-spin" /> Đang xử lý...</>
                ) : (
                  <><IconUpload size={14} /> Upload & Tạo Tin Tuyển Dụng</>
                )}
              </button>

              {/* Column mapping hint */}
              <details className="text-[10px] text-gray-500">
                <summary className="cursor-pointer hover:text-gray-300">Các cột được hỗ trợ trong file Excel</summary>
                <div className="mt-2 p-3 rounded-xl bg-[#0b0d0c] border border-gray-800 space-y-1">
                  <p><strong className="text-gray-300">Bắt buộc:</strong> Tiêu đề, Mức lương, Địa điểm, Mô tả, Yêu cầu</p>
                  <p><strong className="text-gray-300">Tùy chọn:</strong> Quyền lợi, Số lượng, Ngành nghề, Trình độ, Tỉnh/TP, Email liên hệ, SĐT liên hệ, Hạn nộp</p>
                  <p className="text-gray-600 mt-1">Tải file mẫu để xem cấu trúc đúng chuẩn.</p>
                </div>
              </details>
            </div>

            {/* Manage Jobs Vacancies Panel */}
            <div className="bg-[#121614]/80 backdrop-blur-md border border-[#2fd39a1a] rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <IconBriefcase className="text-accent-soft" size={20} /> Quản Lý Tin Tuyển Dụng
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Xóa các vị trí đã hết hạn hoặc tuyển đủ nhân sự.
                </p>
              </div>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
                {!Array.isArray(jobs) || jobs.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 font-mono text-xs">
                    Chưa có tin tuyển dụng nào được tạo.
                  </div>
                ) : (
                  jobs.map((j) => (
                    <div 
                      key={j.id}
                      className="bg-[#0b0d0c]/40 p-4 rounded-xl border border-gray-800 flex justify-between items-center gap-4 hover:border-[#2fd39a22] transition-all"
                    >
                      <div className="min-w-0">
                        <strong className="text-white text-xs block truncate">{j.title}</strong>
                        <span className="text-[9px] text-gold-light font-mono">{j.salary} · {j.location}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteJob(j.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg border border-red-500/30 transition-colors shrink-0"
                        title="Xóa tin tuyển dụng"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
