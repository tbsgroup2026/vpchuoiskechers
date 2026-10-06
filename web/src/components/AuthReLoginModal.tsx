"use client";

import React, { useState } from "react";
import { IconLock, IconCheck, IconAlertTriangle, IconX } from "@tabler/icons-react";
import { useLanguage } from "@/components/LanguageProvider";

interface AuthReLoginModalProps {
  isOpen: boolean;
  onSuccess: (newToken: string) => void;
  onCancel: () => void;
}

export default function AuthReLoginModal({ isOpen, onSuccess, onCancel }: AuthReLoginModalProps) {
  const { lang, t } = useLanguage();
  const [empCode, setEmpCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empCode.trim() || !password.trim()) {
      setErrorMsg(lang === "en" ? "Please enter Employee Code and Password!" : "Vui lòng nhập Mã nhân viên và Mật khẩu!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empCode: empCode.trim(), password: password.trim() }),
      });

      const json = await res.json();
      if (json.success && json.token) {
        const cleanToken = json.token.startsWith("Bearer ") ? json.token : `Bearer ${json.token}`;
        localStorage.setItem("tbs_token", cleanToken);
        localStorage.setItem("tbs_jwt_token", cleanToken);
        document.cookie = `tbs_token=${encodeURIComponent(cleanToken)}; path=/; max-age=31536000`;
        onSuccess(cleanToken);
      } else {
        setErrorMsg(json.error || json.message || (lang === "en" ? "Incorrect employee code or password!" : "Tài khoản hoặc mật khẩu không chính xác!"));
      }
    } catch (err: any) {
      setErrorMsg(lang === "en" ? "Cannot connect to server. Please try again!" : "Không thể kết nối máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-rose-600 font-black text-base">
            <IconLock size={20} />
            <span>{t("auth.sessionExpiredTitle", undefined, "Phiên đăng nhập hết hạn")}</span>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <IconX size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-600 font-medium">
          {lang === "en"
            ? "Your entered form data is safely protected. Please log in again to proceed without losing data."
            : "Dữ liệu bạn vừa nhập trên form đã được bảo vệ an toàn. Vui lòng đăng nhập lại để tiếp tục gửi dữ liệu mà không bị mất thông tin."}
        </p>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <IconAlertTriangle size={16} className="shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {t("auth.employeeCode", undefined, "Mã NV / Tên đăng nhập")}:
            </label>
            <input
              type="text"
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value)}
              placeholder={lang === "en" ? "Enter employee code..." : "Nhập mã nhân viên..."}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {t("auth.password", undefined, "Mật khẩu")}:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={lang === "en" ? "Enter password..." : "Nhập mật khẩu..."}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              {t("common.cancel", undefined, "Hủy")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading
                ? (lang === "en" ? "Authenticating..." : "Đang xác thực...")
                : (lang === "en" ? "Log In & Resubmit Form" : "Đăng Nhập & Gửi Lại Form")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
