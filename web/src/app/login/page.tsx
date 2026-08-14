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
  IconBuildingStore,
} from "@tabler/icons-react";

export default function LoginPage() {
  const router = useRouter();
  const [empCode, setEmpCode] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empCode, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sai mã nhân viên hoặc mật khẩu");
      }

      document.cookie = `tbs_token=${data.token}; path=/; max-age=86400`;
      router.push(data.redirectUrl || "/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Có lỗi xảy ra khi đăng nhập";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#08221a] font-sans antialiased text-white selection:bg-[#2fd39a] selection:text-[#08221a]">
      {/* ════════════════════════════════════════════════════════════════
          CỘT TRÁI — FORM ĐĂNG NHẬP (Nền trắng / Sáng, ~45% Desktop, 100% Mobile)
         ════════════════════════════════════════════════════════════════ */}
      <div className="w-full md:w-[45%] lg:w-[42%] bg-white text-gray-900 flex flex-col justify-between p-6 sm:p-10 lg:p-14 shadow-2xl relative z-10">
        <div>
          {/* Header nhỏ trên cùng */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#08221a] to-[#0f4133] text-[#2fd39a] font-extrabold text-sm flex items-center justify-center font-mono">
                SKS
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-wider uppercase text-[#08221a]">
                  SKECHERS - TBS GROUP
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                  HỆ THỐNG VĂN PHÒNG CHUỖI SKECHERS
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs font-bold text-gray-500 hover:text-[#08221a] transition-colors"
            >
              Về trang chủ
            </Link>
          </div>

          {/* Tiêu đề chào mừng */}
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08221a] tracking-tight">
              Chào mừng đến <br />
              <span className="text-[#0f4133]">Văn Phòng Chuỗi SKECHERS</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Hệ thống quản trị vận hành chuỗi cung ứng SKECHERS - TBS Group
            </p>
          </div>

          {/* Form Đăng nhập trực tiếp */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}



              {/* Field 2: Người dùng (Mã nhân viên) */}
              <div className="space-y-1.5">
                <label htmlFor="empCode" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <IconUser size={15} className="text-gray-500" />
                  <span>Mã nhân viên / Người dùng</span>
                </label>
                <input
                  id="empCode"
                  type="text"
                  required
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value)}
                  placeholder="EMP-001 hoặc EMP-002"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#08221a] focus:ring-2 focus:ring-[#08221a]/10 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Field 3: Mật khẩu */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <IconLock size={15} className="text-gray-500" />
                  <span>Mật khẩu</span>
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

              {/* Hàng dưới cùng form: Remember me & Forgot PW */}
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

              {/* Submit Button: Gradient xanh lá đậm -> đen */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#08221a] via-[#0f4133] to-[#08221a] text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-emerald-950/20 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 mt-4"
              >
                <span>{loading ? "Đang xác thực..." : "Đăng Nhập Hệ Thống"}</span>
                <IconArrowRight size={16} />
              </button>
            </form>

          {/* Quick Demo Credentials hint */}
          <div className="mt-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
            <span className="font-bold block">💡 Tài khoản hệ thống:</span>
            <div>👑 Super Admin 1: <code className="font-mono font-bold">202608001</code> / <code className="font-mono">21032004</code> (Phạm Nguyễn Anh Huy)</div>
            <div>👑 Super Admin 2: <code className="font-mono font-bold">202608002</code> / <code className="font-mono">123456</code> (Trần Ngọc Huy)</div>
            <div>🔑 Admin Demo: <code className="font-mono font-bold">EMP-001</code> / <code className="font-mono">Admin@123456</code></div>
            <div>👤 Staff Demo: <code className="font-mono font-bold">EMP-002</code> / <code className="font-mono">User@123456</code></div>
          </div>
        </div>

        {/* Footer nhỏ cuối form */}
        <div className="pt-8 border-t border-gray-100 text-center text-[11px] text-gray-400">
          © 2026 TBS Group · Văn Phòng Chuỗi SKECHERS · v1.0
        </div>
      </div>


      {/* ════════════════════════════════════════════════════════════════
          CỘT PHẢI — PANEL GIỚI THIỆU (Nền tối Emerald-Black, 55% Desktop, Ẩn Mobile)
         ════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#08221a] via-[#0d2419] to-[#061a14] p-10 lg:p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(47,211,154,0.12)_0%,_transparent_60%)] pointer-events-none" />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2fd39a]/15 border border-[#2fd39a]/30 backdrop-blur-md">
            <IconSparkles size={14} className="text-[#2fd39a]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#2fd39a]">
              Hệ Thống Quản Trị Vận Hành 4.0
            </span>
          </div>
          <span className="text-xs font-mono text-[#f2dc9a] font-bold">ZONE II — SKECHERS</span>
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
            Hệ thống kết nối toàn bộ quy trình Gemba Walk tại hiện trường nhà máy, theo dõi tiến độ Cải tiến CI, đăng ký Kaizen tích hợp AI Groq và đo lường BI Dashboard 24/7.
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
          <span>Văn Phòng Chuỗi SKECHERS - TBS Group</span>
          <span className="font-mono text-[#2fd39a]">Security Level 4</span>
        </div>
      </div>
    </div>
  );
}
