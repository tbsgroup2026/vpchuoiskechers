"use client";

import React, { useState } from "react";
import { IconShieldLock, IconKey, IconCheck, IconAlertTriangle, IconX } from "@tabler/icons-react";

interface AccessGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sessionToken: string, verifiedUntil: string) => void;
}

export default function AccessGateModal({ isOpen, onClose, onSuccess }: AccessGateModalProps) {
  const [pinCode, setPinCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode || pinCode.length < 4) {
      setErrorMsg("Vui lòng nhập đầy đủ mã PIN xác thực 1-5-2");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/1-5-2/verify-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinCode }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(data.sessionToken, data.verifiedUntil);
        onClose();
      } else {
        setErrorMsg(data.error || "Xác thực mã PIN không thành công!");
      }
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ xác thực an ninh!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-500/30 relative space-y-6 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <IconX size={20} />
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <IconShieldLock size={36} />
          </div>
          <div className="space-y-1">
            <span className="px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-300">
              CẤP BẢO MẬT BAN QUẢN TRỊ 1-5-2
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Xác Thực Lớp 2 (Access Gate)
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Yêu cầu nhập Mã PIN xác thực quyền điều hành Ban Quản Trị để mở phân hệ 1-5-2.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2 animate-shake">
            <IconAlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              Nhập Mã PIN Xác Thực Ban Quản Trị
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="******"
                className="w-full pl-10 pr-4 py-3 text-center text-xl font-mono tracking-[0.5em] rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 font-black outline-none focus:border-amber-500 focus:bg-white transition-all"
                autoFocus
              />
              <IconKey size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold text-center pt-1">
              (Thử nghiệm PIN demo: <code className="text-amber-700 font-bold">152152</code>)
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
            >
              {loading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <IconCheck size={18} />
                  <span>Xác Nhận PIN</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
