"use client";

import React, { useState, useEffect } from "react";
import {
  IconBell,
  IconBrandTelegram,
  IconBrandWechat,
  IconDeviceMobile,
  IconCheck,
  IconX,
  IconLoader2,
  IconAlertCircle,
  IconShieldCheck,
  IconSettings,
} from "@tabler/icons-react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  syncPushSubscriptionToServer,
  NotificationPermissionState,
} from "@/lib/browserNotifications";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({
  isOpen,
  onClose,
}: NotificationSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermissionState>("default");

  const [form, setForm] = useState({
    inAppEnabled: true,
    webPushEnabled: true,
    telegramEnabled: false,
    telegramChatId: "",
    zaloEnabled: false,
    notifyAssigned: true,
    notifyDueChange: true,
    notifyDueWarning: true,
    notifyReview: true,
    notifyOverdue: true,
  });

  useEffect(() => {
    if (isOpen) {
      setPushPermission(getNotificationPermission());
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/notifications/settings", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setForm({
            inAppEnabled: Boolean(json.data.inAppEnabled ?? true),
            webPushEnabled: Boolean(json.data.webPushEnabled ?? true),
            telegramEnabled: Boolean(json.data.telegramEnabled ?? false),
            telegramChatId: json.data.telegramChatId || "",
            zaloEnabled: Boolean(json.data.zaloEnabled ?? false),
            notifyAssigned: Boolean(json.data.notifyAssigned ?? true),
            notifyDueChange: Boolean(json.data.notifyDueChange ?? true),
            notifyDueWarning: Boolean(json.data.notifyDueWarning ?? true),
            notifyReview: Boolean(json.data.notifyReview ?? true),
            notifyOverdue: Boolean(json.data.notifyOverdue ?? true),
          });
        }
      }
    } catch (e) {
      console.warn("Could not fetch notification settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg({ text: "✓ Đã lưu cài đặt thông báo thành công!", isError: false });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMsg({ text: json.error || "Không thể lưu cài đặt", isError: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: "Lỗi kết nối máy chủ", isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestWebPush = async () => {
    const perm = await requestNotificationPermission();
    setPushPermission(perm);
    if (perm === "granted") {
      await syncPushSubscriptionToServer().catch(() => {});
      setForm((prev) => ({ ...prev, webPushEnabled: true }));
      setStatusMsg({ text: "✓ Đã cấp quyền thông báo đẩy Web Push thành công!", isError: false });
    } else {
      setStatusMsg({ text: "Trình duyệt đã từ chối quyền thông báo đẩy.", isError: true });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-[#006838] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <IconBell size={20} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Cài đặt thông báo & Đồng bộ</h3>
              <p className="text-xs text-emerald-100 font-medium">Tùy biến kênh nhận và các sự kiện công việc</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                statusMsg.isError
                  ? "bg-rose-50 border border-rose-200 text-rose-700"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-800"
              }`}
            >
              {statusMsg.isError ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <IconLoader2 size={24} className="animate-spin text-[#006838]" />
              <span className="text-xs font-bold">Đang tải cấu hình thông báo...</span>
            </div>
          ) : (
            <>
              {/* Section 1: Channels */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  1. Kênh nhận thông báo
                </h4>

                {/* In-app */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <IconBell size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">Thông báo trên Web (In-App)</div>
                      <div className="text-[11px] text-slate-500">Hiển thị ở biểu tượng chuông trên thanh menu</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.inAppEnabled}
                    onChange={(e) => setForm({ ...form, inAppEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#006838] cursor-pointer"
                  />
                </label>

                {/* Web Push */}
                <div className="p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                        <IconDeviceMobile size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">Thông báo đẩy (Web Push)</div>
                        <div className="text-[11px] text-slate-500">Nhận thông báo ngay cả khi không mở tab TBS</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.webPushEnabled}
                      onChange={(e) => setForm({ ...form, webPushEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#006838] cursor-pointer"
                    />
                  </div>

                  {pushPermission !== "granted" && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-amber-600 font-bold">
                        Quyền trình duyệt: {pushPermission === "denied" ? "Bị chặn" : "Chưa cấp"}
                      </span>
                      <button
                        type="button"
                        onClick={handleRequestWebPush}
                        className="px-2.5 py-1 rounded bg-[#006838] text-white text-[11px] font-bold hover:bg-emerald-800 transition cursor-pointer"
                      >
                        Bật quyền Push
                      </button>
                    </div>
                  )}
                </div>

                {/* Telegram Bot */}
                <div className="p-3 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                        <IconBrandTelegram size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">Telegram Bot</div>
                        <div className="text-[11px] text-slate-500">Nhận tin nhắn báo việc qua bot Telegram</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.telegramEnabled}
                      onChange={(e) => setForm({ ...form, telegramEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#006838] cursor-pointer"
                    />
                  </div>

                  {form.telegramEnabled && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Chat ID Telegram cá nhân:
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 123456789 (Nhắn /start cho @TBSWorkBot)"
                        value={form.telegramChatId}
                        onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006838]/30"
                      />
                    </div>
                  )}
                </div>

                {/* Zalo ZNS */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      Zalo
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">Zalo ZNS / Bot Thông Báo</div>
                      <div className="text-[11px] text-slate-500">Tùy chọn: Nhận qua Zalo OA đã liên kết</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.zaloEnabled}
                    onChange={(e) => setForm({ ...form, zaloEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#006838] cursor-pointer"
                  />
                </label>
              </div>

              {/* Section 2: Event Subscriptions */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  2. Sự kiện công việc kích hoạt thông báo
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                    <span className="text-xs text-slate-700 font-bold">Khi được giao công việc mới</span>
                    <input
                      type="checkbox"
                      checked={form.notifyAssigned}
                      onChange={(e) => setForm({ ...form, notifyAssigned: e.target.checked })}
                      className="w-4 h-4 accent-[#006838] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                    <span className="text-xs text-slate-700 font-bold">Khi bị đổi hạn chót (Due date)</span>
                    <input
                      type="checkbox"
                      checked={form.notifyDueChange}
                      onChange={(e) => setForm({ ...form, notifyDueChange: e.target.checked })}
                      className="w-4 h-4 accent-[#006838] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                    <span className="text-xs text-slate-700 font-bold">Nhắc nhở sắp đến hạn (còn 24h)</span>
                    <input
                      type="checkbox"
                      checked={form.notifyDueWarning}
                      onChange={(e) => setForm({ ...form, notifyDueWarning: e.target.checked })}
                      className="w-4 h-4 accent-[#006838] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                    <span className="text-xs text-slate-700 font-bold">Yêu cầu nghiệm thu & Duyệt đạt / Bắt làm lại</span>
                    <input
                      type="checkbox"
                      checked={form.notifyReview}
                      onChange={(e) => setForm({ ...form, notifyReview: e.target.checked })}
                      className="w-4 h-4 accent-[#006838] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                    <span className="text-xs text-slate-700 font-bold">Cảnh báo công việc quá hạn</span>
                    <input
                      type="checkbox"
                      checked={form.notifyOverdue}
                      onChange={(e) => setForm({ ...form, notifyOverdue: e.target.checked })}
                      className="w-4 h-4 accent-[#006838] cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition min-h-[40px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-5 py-2 rounded-xl bg-[#006838] hover:bg-emerald-800 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 min-h-[40px] cursor-pointer disabled:opacity-50"
            >
              {saving && <IconLoader2 size={16} className="animate-spin" />}
              <span>Lưu cài đặt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
