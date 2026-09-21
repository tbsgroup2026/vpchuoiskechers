import React, { useState } from 'react';
import {
  IconLock,
  IconKey,
  IconShieldCheck,
  IconCircleCheck,
  IconAlertTriangle,
  IconArrowRight,
  IconRefresh,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';

interface Module152ModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export default function Module152Modal({ isOpen, onSuccess, onClose }: Module152ModalProps) {
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'VERIFY' | 'CHANGE_PIN'>('VERIFY');
  
  // Change PIN fields
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  if (!isOpen) return null;

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setErrorMsg('Vui lòng nhập mã PIN 2FA hợp lệ.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/admin/module-152/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || data.error || 'Xác thực mã PIN thất bại.');
        if (data.failed_attempts) setFailedAttempts(data.failed_attempts);
        return;
      }

      if (data.require_pin_change) {
        setSuccessMsg(data.message);
        setOldPin(pin);
        setMode('CHANGE_PIN');
      } else {
        setSuccessMsg('Xác thực PIN 2FA thành công! Đang chuyển hướng...');
        setTimeout(() => {
          onSuccess();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length < 6) {
      setErrorMsg('Mã PIN mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('Mã PIN mới và xác nhận mã PIN không khớp.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/admin/module-152/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPin, newPin }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Đổi mã PIN thất bại.');
        return;
      }

      setSuccessMsg('Đổi mã PIN thành công! Đang mở khóa Module 1-5-2...');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Gradient Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"></div>

        <div className="p-6 md:p-8">
          {/* Header Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center shadow-inner">
              {mode === 'VERIFY' ? (
                <IconShieldCheck className="w-8 h-8 text-amber-400 animate-pulse" />
              ) : (
                <IconKey className="w-8 h-8 text-emerald-400" />
              )}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold tracking-tight text-white">
              {mode === 'VERIFY' ? 'Xác thực 2FA Module 1-5-2' : 'Đổi mã PIN 2FA bắt buộc'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'VERIFY'
                ? 'Nhập mã PIN 2FA cấp cho Ban Giám Đốc / Phó Giám Đốc để mở khóa dữ liệu bảo mật.'
                : 'Tài khoản đang sử dụng PIN mặc định. Vui lòng đổi PIN mới trước khi tiếp tục.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-300 animate-in slide-in-from-top-1">
              <IconAlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-300 animate-in slide-in-from-top-1">
              <IconCircleCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}

          {/* Forms */}
          {mode === 'VERIFY' ? (
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mã PIN 2FA (6 chữ số)
                </label>
                <div className="relative">
                  <input
                    type={showPins ? 'text' : 'password'}
                    maxLength={10}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-xl tracking-widest font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPins(!showPins)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPins ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
                {failedAttempts > 0 && failedAttempts < 5 && (
                  <p className="text-[11px] text-amber-400/90 mt-1 text-center">
                    ⚠️ Đã nhập sai {failedAttempts}/5 lần. Nhập sai 5 lần sẽ khóa 15 phút.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    Hủy bỏ
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition active:scale-95 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <IconRefresh className="w-4 h-4 animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <IconLock className="w-4 h-4" />
                      Xác thực & Mở khóa
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mã PIN hiện tại
                </label>
                <input
                  type="text"
                  disabled
                  value={oldPin}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mã PIN mới (ít nhất 6 ký tự)
                </label>
                <input
                  type={showPins ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Nhập mã PIN mới"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Xác nhận mã PIN mới
                </label>
                <input
                  type={showPins ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Xác nhận mã PIN mới"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <IconRefresh className="w-4 h-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <IconArrowRight className="w-4 h-4" />
                      Cập nhật PIN & Truy cập Module
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer note */}
          <p className="mt-6 text-[10px] text-center text-slate-500">
            Hệ thống Bảo mật 1-5-2 • Mọi hành vi nhập PIN đều được ghi vết Audit Log và gửi cảnh báo tự động.
          </p>
        </div>
      </div>
    </div>
  );
}
