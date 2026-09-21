'use client';

import React, { useState, useEffect } from 'react';
import {
  IconShield,
  IconShieldCheck,
  IconLock,
  IconLockOpen,
  IconAlertTriangle,
  IconFileText,
  IconCircleCheck,
  IconHistory,
  IconUserCheck,
  IconRefresh,
  IconKey,
  IconArrowLeft,
} from '@tabler/icons-react';
import Link from 'next/link';
import Module152Modal from '@/modules/admin/Module152Modal';

export default function Module152Page() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LOGS' | 'ALERT_SETTINGS'>('OVERVIEW');

  const fetchAccessLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/admin/audit-search?module=MODULE_152', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Error loading logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchAccessLogs();
    }
  }, [isUnlocked]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      {/* 2FA PIN Modal */}
      <Module152Modal
        isOpen={!isUnlocked}
        onSuccess={() => {
          setIsUnlocked(true);
          setShowModal(false);
        }}
        onClose={() => {
          // If closed without pin, redirect back to work dashboard
          window.location.href = '/work';
        }}
      />

      {isUnlocked && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-950/50">
                <IconShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">Hệ Thống Quản Trị Bảo Mật 1-5-2</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                    <IconLockOpen className="w-3 h-3" /> Đã xác thực 2FA
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Cơ chế bảo vệ 3 lớp: Giám sát PIN 2FA • Cảnh báo Ban Giám Đốc • Nhật ký truy cập mã hóa & Sao lưu tự động.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsUnlocked(false);
                  setShowModal(true);
                }}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition"
              >
                <IconLock className="w-4 h-4 text-amber-400" />
                Khóa lại Module
              </button>
              <Link
                href="/work"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2 transition"
              >
                <IconArrowLeft className="w-4 h-4" /> Quay lại Dashboard
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'OVERVIEW'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <IconShield className="w-4 h-4" /> Tổng quan trạng thái 1-5-2
            </button>
            <button
              onClick={() => setActiveTab('LOGS')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'LOGS'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <IconHistory className="w-4 h-4" /> Nhật ký truy cập & Cảnh báo
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: PIN 2FA Security */}
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <IconKey className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Chính sách 2FA PIN</h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <IconCircleCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cấp PIN mặc định lần đầu cho PGĐ (bắt buộc đổi PIN).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCircleCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Khóa tài khoản 15 phút nếu nhập sai quá 5 lần.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCircleCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tự động gửi mail Resend REST API cho BGĐ khi bị khóa.</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: Automatic Audit & Drive Backup */}
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <IconFileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Audit & Google Drive Backup</h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <IconCircleCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Đồng bộ Incremental Backup mỗi 2 phút lên Drive.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCircleCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Xuất file độc lập <code>module_152_access_log.json</code>.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCircleCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ghi chi tiết IP, UserAgent, thời gian xác thực.</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: Board of Directors Notification */}
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <IconUserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Thông báo khẩn Ban Giám Đốc</h3>
                <p className="text-xs text-slate-400">
                  Danh sách email nhận cảnh báo khẩn cấp được liên kết tự động từ danh sách Tổng Giám Đốc & Phó Tổng Giám Đốc trong hệ thống.
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-amber-300/90 flex items-center gap-2">
                  <IconAlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Kênh gửi: Resend REST API (Direct Cloudflare Worker fetch).</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'LOGS' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconHistory className="w-5 h-5 text-amber-400" /> Nhật ký truy cập Module 1-5-2
                </h3>
                <button
                  onClick={fetchAccessLogs}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <IconRefresh className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Làm mới
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-slate-800">
                  Chưa ghi nhận nhật ký vi phạm hoặc thử PIN thất bại.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/50">
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Người dùng</th>
                        <th className="p-3">Hành động</th>
                        <th className="p-3">IP / Device</th>
                        <th className="p-3">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-3 font-mono text-slate-400">
                            {new Date(log.created_at || log.timestamp).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-3 font-semibold text-slate-200">{log.user_id}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-400 text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                          <td className="p-3 text-slate-300">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
