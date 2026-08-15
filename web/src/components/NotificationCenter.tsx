"use client";

import { useState, useEffect, useRef } from "react";
import {
  IconBell,
  IconCheck,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconBulb,
  IconX,
} from "@tabler/icons-react";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "GEMBA" | "KAIZEN";
  is_read: number;
  created_at: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: "Gemba Walk Mới",
      message: "Phát hiện sự cố an toàn lao động tại Chuyền 03 - Zone B SKECHERS.",
      type: "GEMBA",
      is_read: 0,
      created_at: "5 phút trước",
    },
    {
      id: 2,
      title: "Kaizen AI So Sánh",
      message: "Ý tưởng Kaizen 'Tối ưu keo dán đế' đạt 95% độ độc đáo.",
      type: "KAIZEN",
      is_read: 0,
      created_at: "18 phút trước",
    },
    {
      id: 3,
      title: "Phê Duyệt Cải Tiến CI",
      message: "Ban Giám Đốc đã duyệt ngân sách CI cho Chuyền May 08.",
      type: "SUCCESS",
      is_read: 1,
      created_at: "1 giờ trước",
    },
    {
      id: 4,
      title: "Cảnh Báo Quá Hạn SLA",
      message: "Thiết bị Ép Đế #M-04 quá hạn bảo trì 24 giờ.",
      type: "WARNING",
      is_read: 1,
      created_at: "3 giờ trước",
    },
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "GEMBA":
      case "WARNING":
        return <IconAlertTriangle size={18} className="text-amber-500" />;
      case "KAIZEN":
        return <IconBulb size={18} className="text-[#006838]" />;
      case "SUCCESS":
        return <IconCircleCheck size={18} className="text-emerald-500" />;
      default:
        return <IconInfoCircle size={18} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#006838] flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
        title="Thông báo hệ thống"
      >
        <IconBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#006838] to-[#004d29] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBell size={18} />
              <h4 className="text-sm font-extrabold tracking-tight">Thông Báo Hệ Thống</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-emerald-100 hover:text-white transition-colors cursor-pointer flex items-center gap-1 mr-2"
                >
                  <IconCheck size={14} />
                  <span>Đọc tất cả</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <IconX size={14} />
              </button>
            </div>
          </div>

          {/* List Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-left">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                Không có thông báo mới nào.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, is_read: 1 } : n))
                    )
                  }
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                    item.is_read === 0 ? "bg-emerald-50/40" : "bg-white"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.created_at}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                  {item.is_read === 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#006838] flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 text-center bg-slate-50 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">
              Văn Phòng Chuỗi SKECHERS - Notification System 24/7
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
