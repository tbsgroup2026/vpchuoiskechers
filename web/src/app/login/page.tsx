"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconUser,
  IconLock,
  IconEye,
  IconEyeOff,
  IconSparkles,
  IconShieldCheck,
  IconChartBar,
  IconCamera,
  IconBuildingFactory,
  IconArrowRight,
  IconChevronDown,
} from "@tabler/icons-react";
import { LOGIN_ROLE_OPTIONS } from "@/lib/permissions";
import { loginWithD1Database, loginUserProfile, SYSTEM_USERS } from "@/lib/userProfiles";

const EXECUTIVE_OFFICERS: Record<
  string,
  Array<{ empCode: string; name: string; title: string; defaultPass: string }>
> = {
  ceo: [
    { empCode: "TGĐ-001", name: "Nguyễn Văn Hùng", title: "Tổng Giám Đốc Tập Đoàn TBS Group", defaultPass: "123456" },
    { empCode: "TGĐ-002", name: "Phạm Đức Hoàng", title: "Tổng Giám Đốc Vận Hành SKECHERS", defaultPass: "123456" },
  ],
  deputy_ceo: [
    { empCode: "PTGĐ-002", name: "Lê Hoàng Nam", title: "Phó Tổng Giám Đốc Vận Hành & Chuỗi Cung Ứng", defaultPass: "123456" },
    { empCode: "PTGĐ-003", name: "Trịnh Văn Thành", title: "Phó Tổng Giám Đốc Kỹ Thuật & R&D", defaultPass: "123456" },
  ],
  director: [
    { empCode: "GĐ-003", name: "Đặng Minh Tuấn", title: "Giám Đốc Khối Sản Xuất & Nhà Máy", defaultPass: "123456" },
    { empCode: "GĐ-004", name: "Vũ Thị Thanh", title: "Giám Đốc Khối Chuỗi Cung Ứng SKECHERS", defaultPass: "123456" },
  ],
  deputy_director: [
    { empCode: "PGĐ-004", name: "Nguyễn Thị Mai", title: "Phó Giám Đốc Quản Lý Chất Lượng (QC) & Gemba", defaultPass: "123456" },
    { empCode: "PGĐ-005", name: "Bùi Văn Hùng", title: "Phó Giám Đốc Sản Xuất Nhà Máy KG1", defaultPass: "123456" },
  ],
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>("employee");
  const [selectedOfficerCode, setSelectedOfficerCode] = useState<string>("");
  const [empCode, setEmpCode] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const EXECUTIVE_RANKS = ["ceo", "deputy_ceo", "director", "deputy_director"];
  const isExecutiveRank = EXECUTIVE_RANKS.includes(selectedRole);
  const currentExecutiveOfficers = EXECUTIVE_OFFICERS[selectedRole];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const cleanEmpCode = empCode.trim();

      // Quy tắc xác thực khi bấm Đăng Nhập:
      // 1. Vai trò thuộc nhóm PGĐ trở lên (Executive Rank):
      //    Bắt buộc phải có tên cán bộ chọn từ thả xuống (hoặc MSNV tự động điền từ tên đó)
      if (isExecutiveRank) {
        if (!selectedOfficerCode && !cleanEmpCode) {
          throw new Error("Vui lòng chọn tên Cán bộ / Lãnh đạo trong danh sách thả xuống");
        }
      } else {
        // 2. Vai trò thuộc nhóm còn lại (Trưởng Phòng, Admin, CBCNV):
        //    Bắt buộc phải nhập MSNV thủ công, để trống không gửi
        if (!cleanEmpCode) {
          throw new Error("Vui lòng nhập Mã số nhân viên (MSNV)");
        }
      }

      if (!password) {
        throw new Error("Vui lòng nhập mật khẩu xác thực");
      }

      setLoading(true);

      const targetIdentifier = isExecutiveRank
        ? (selectedOfficerCode || cleanEmpCode)
        : cleanEmpCode;

      // Đăng nhập và nạp chính xác Profile + Avatar theo MSNV đồng bộ với Cloudflare D1 Database
      const profile = await loginWithD1Database(targetIdentifier, password, selectedRole);

      const targetUrl = (selectedRole === "admin" || cleanEmpCode === "ADMIN-2026" || profile.empCode === "ADMIN-2026")
        ? "/admin"
        : (profile.redirectUrl || "/work");

      router.push(targetUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Có lỗi xảy ra khi đăng nhập";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = (roleKey: string, code: string, pass: string) => {
    if (EXECUTIVE_RANKS.includes(roleKey)) {
      setSelectedRole(roleKey);
      setSelectedOfficerCode(code);
      setEmpCode(code);
    } else {
      setSelectedRole(roleKey);
      setSelectedOfficerCode("");
      setEmpCode(code);
    }
    setPassword(pass);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#08221a] font-sans antialiased text-white selection:bg-[#2fd39a] selection:text-[#08221a]">
      {/* CỘT TRÁI — FORM ĐĂNG NHẬP */}
      <div className="w-full md:w-[48%] lg:w-[45%] bg-white text-gray-900 flex flex-col justify-between p-6 sm:p-8 lg:p-10 shadow-2xl relative z-10 overflow-y-auto max-h-screen">
        <div>
          {/* Header nhỏ trên cùng */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-3">
              <img src="/images/tbs-logo.png" alt="TBS Group Logo" className="h-8 sm:h-9 w-auto object-contain" />
            </div>
            <Link
              href="/"
              className="text-xs font-bold text-gray-500 hover:text-[#08221a] transition-colors"
            >
              Về trang chủ
            </Link>
          </div>

          {/* Tiêu đề chào mừng */}
          <div className="space-y-1.5 mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#08221a] tracking-tight">
              Đăng Nhập Hệ Thống <br />
              <span className="text-[#0f4133]">Văn Phòng Chuỗi SKECHERS</span>
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Chọn vai trò hoặc tài khoản demo bên dưới để bắt đầu làm việc
            </p>
          </div>

          {/* Form Đăng nhập trực tiếp */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Field 1: Chức vụ / Vai trò Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="roleSelect" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <IconShieldCheck size={15} className="text-[#08221a]" />
                <span>Chức vụ / Vai trò đăng nhập</span>
              </label>
              <div className="relative">
                <select
                  id="roleSelect"
                  value={selectedRole}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedRole(val);
                    if (EXECUTIVE_RANKS.includes(val) && EXECUTIVE_OFFICERS[val] && EXECUTIVE_OFFICERS[val].length > 0) {
                      const firstCode = EXECUTIVE_OFFICERS[val][0].empCode;
                      setSelectedOfficerCode(firstCode);
                      setEmpCode(firstCode);
                      setPassword("123456");
                    } else {
                      setSelectedOfficerCode("");
                      setEmpCode("");
                      setPassword("");
                    }
                    setError("");
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#08221a] focus:ring-2 focus:ring-[#08221a]/10 transition-all appearance-none cursor-pointer pr-10"
                >
                  {LOGIN_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <IconChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Field 1B: Thả xuống chọn tên Cán bộ / Lãnh đạo (CHỈ HIỆN CHO NHÓM PGĐ TRỞ LÊN) */}
            {isExecutiveRank && currentExecutiveOfficers && currentExecutiveOfficers.length > 0 && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label htmlFor="officerSelect" className="text-xs font-bold text-[#08221a] flex items-center gap-1.5">
                  <IconUser size={15} className="text-[#08221a]" />
                  <span>Họ tên Cán bộ / Lãnh đạo ({LOGIN_ROLE_OPTIONS.find(r => r.value === selectedRole)?.label.replace(/^[^\s]+\s*/, '')})</span>
                </label>
                <div className="relative">
                  <select
                    id="officerSelect"
                    value={selectedOfficerCode || currentExecutiveOfficers[0].empCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedOfficerCode(code);
                      setEmpCode(code);
                      const found = currentExecutiveOfficers.find((o) => o.empCode === code);
                      setPassword(found?.defaultPass || "123456");
                      setError("");
                    }}
                    className="w-full px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-300 rounded-xl text-xs font-extrabold text-[#08221a] focus:outline-none focus:border-[#08221a] focus:ring-2 focus:ring-[#08221a]/10 transition-all appearance-none cursor-pointer pr-10 shadow-2xs"
                  >
                    {currentExecutiveOfficers.map((officer) => (
                      <option key={officer.empCode} value={officer.empCode}>
                        👤 {officer.name} — {officer.title} ({officer.empCode})
                      </option>
                    ))}
                  </select>
                  <IconChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#08221a] pointer-events-none" />
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold px-1 flex items-center justify-between">
                  <span>✓ Mã MSNV hệ thống (tự động): <strong className="font-mono">{selectedOfficerCode || currentExecutiveOfficers[0].empCode}</strong></span>
                </div>
              </div>
            )}

            {/* Field 2: Nhập Mã số nhân viên (MSNV) thủ công — ẨN KHI LÀ CẤP PGĐ TRỞ LÊN, CHỈ HIỆN CHO CÁC VAI TRÒ CÒN LẠI */}
            {!isExecutiveRank && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label htmlFor="empCode" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <IconUser size={15} className="text-gray-500" />
                  <span>Mã số nhân viên (MSNV) *</span>
                </label>
                <input
                  id="empCode"
                  type="text"
                  required
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value)}
                  placeholder="VD: 202608001, NS-001, KT-001, QC-001..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#08221a] focus:ring-2 focus:ring-[#08221a]/10 transition-all placeholder:text-gray-400"
                />
              </div>
            )}

            {/* Field 3: Mật khẩu */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <IconLock size={15} className="text-gray-500" />
                <span>Mật khẩu {isPasswordOnly && "xác thực vai trò"}</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#08221a] focus:ring-2 focus:ring-[#08221a]/10 transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            {/* Hàng dưới cùng form */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#08221a] focus:ring-[#08221a]"
                />
                <span>Ghi nhớ 30 ngày</span>
              </label>
              <a href="#forgot" className="font-bold text-[#0f4133] hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#08221a] via-[#0f4133] to-[#08221a] text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-emerald-950/20 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <span>{loading ? "Đang xác thực..." : "ĐĂNG NHẬP HỆ THỐNG"}</span>
            </button>
          </form>

          {/* 🌟 BẢNG CHỌN TÀI KHOẢN DEMO 1-CLICK THEO PHÒNG BAN & VAI TRÒ */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#08221a] uppercase tracking-tight flex items-center gap-1.5">
                <span>🔑 Tài khoản Demo theo Phòng Ban</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Bấm để tự điền 1-Click</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs">
              {[
                { roleKey: "LT-001", label: "👩‍💼 Lễ Tân Văn Phòng", dept: "Hành Chánh", code: "LT-001", pass: "123456", color: "bg-emerald-50 text-emerald-900 border-emerald-200" },
                { roleKey: "202608001", label: "⚡ IT - Team Chuyển Đổi Số", dept: "CNTT & CĐS", code: "202608001", pass: "21032004", color: "bg-blue-50 text-blue-900 border-blue-200" },
                { roleKey: "202608002", label: "⚡ IT - Kỹ Sư CĐS", dept: "CNTT & CĐS", code: "202608002", pass: "123456", color: "bg-teal-50 text-teal-900 border-teal-200" },
                { roleKey: "NS-001", label: "👥 Trưởng Phòng Nhân Sự", dept: "Nhân Sự", code: "NS-001", pass: "123456", color: "bg-purple-50 text-purple-900 border-purple-200" },
                { roleKey: "KT-001", label: "📊 Trưởng Phòng Kế Toán", dept: "Tài Chính", code: "KT-001", pass: "123456", color: "bg-amber-50 text-amber-900 border-amber-200" },
                { roleKey: "QC-001", label: "🔍 Quản Lý QC", dept: "Kiểm Soát QC", code: "QC-001", pass: "123456", color: "bg-rose-50 text-rose-900 border-rose-200" },
                { roleKey: "BT-001", label: "🛠️ Kỹ Thuật Bảo Trì Trưởng", dept: "Nhà Máy", code: "BT-001", pass: "123456", color: "bg-cyan-50 text-cyan-900 border-cyan-200" },
                { roleKey: "ceo", label: "👑 Tổng Giám Đốc", dept: "Ban Giám Đốc", code: "TGĐ-001", pass: "123456", color: "bg-yellow-50 text-yellow-950 border-yellow-300 font-bold" },
                { roleKey: "admin", label: "🔧 System Admin", dept: "Quản Trị", code: "ADMIN-2026", pass: "123456", color: "bg-slate-100 text-slate-900 border-slate-300 font-bold" },
              ].map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickDemoSelect(acc.roleKey, acc.code, acc.pass)}
                  className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer shadow-2xs ${acc.color}`}
                >
                  <div className="font-extrabold text-[11px] leading-tight truncate">{acc.label}</div>
                  <div className="text-[10px] opacity-75 mt-0.5 flex items-center justify-between">
                    <span>{acc.dept}</span>
                    <span className="font-mono text-[9px] font-bold">Pass: {acc.pass}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer nhỏ cuối form */}
        <div className="pt-6 border-t border-gray-100 text-center text-[11px] text-gray-400">
          © 2026 TBS Group · Văn Phòng Chuỗi SKECHERS · v1.0
        </div>
      </div>



      {/* ════════════════════════════════════════════════════════════════
          CỘT PHẢI — PANEL GIỚI THIỆU (Nền tối Emerald-Black, 55% Desktop, Ẩn Mobile)
         ════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#08221a] via-[#0d2419] to-[#061a14] p-10 lg:p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(47,211,154,0.12)_0%,_transparent_60%)] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-300/80">Văn Phòng Chuỗi SKECHERS - TBS Group</span>
        </div>

        {/* Center Main Content */}
        <div className="relative z-10 space-y-6 my-auto max-w-xl">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Quản trị chuỗi cung ứng <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2fd39a] to-[#f2dc9a]">
              chuẩn xác &amp; thời gian thực
            </span>
          </h2>

          <p className="text-gray-300 text-sm leading-relaxed">
            Hệ thống kết nối toàn bộ quy trình Gemba Walk tại hiện trường nhà máy, theo dõi tiến độ Cải tiến CI, đăng ký Kaizen và đo lường BI Dashboard 24/7.
          </p>

          {/* Danh sách 4 tính năng nổi bật */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {[
              {
                icon: IconBuildingFactory,
                title: "Gemba Walk Nhanh Gọn",
                desc: "Lập biên bản sự cố và chụp ảnh trực tiếp tại hiện trường",
              },
              {
                icon: IconShieldCheck,
                title: "Phân Quyền Phòng Ban",
                desc: "Đúng người đúng việc theo bảng Department Permissions",
              },
              {
                icon: IconCamera,
                title: "Đính Kèm Minh Chứng R2",
                desc: "Lưu trữ hình ảnh minh chứng an toàn trên Cloudflare R2",
              },
              {
                icon: IconChartBar,
                title: "BI Dashboard 24/7",
                desc: "Donut chart phân bố cải tiến thời gian thực theo khu vực",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3 backdrop-blur-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <feature.icon size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">
                    {feature.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-gray-400 pt-6 border-t border-white/10 flex items-center justify-between">
          <span>© 2026 TBS Group – Skechers Supply Chain System</span>
        </div>
      </div>
    </div>
  );
}
