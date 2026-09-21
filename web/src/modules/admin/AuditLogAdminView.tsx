'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  IconShieldCheck, IconSearch, IconFilter, IconRefresh, 
  IconUser, IconChevronLeft, IconChevronRight, IconEye, IconCode
} from '@tabler/icons-react';

interface AuditLog {
  id: number | string;
  user_id?: string;
  emp_code?: string;
  role_code?: string;
  module: string;
  action: string;
  record_id?: string;
  data_before?: any;
  data_after?: any;
  changes_json?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export function AuditLogAdminView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [empCodeFilter, setEmpCodeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      const params = new URLSearchParams();
      if (moduleFilter) params.append('module', moduleFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (empCodeFilter) params.append('empCode', empCodeFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', String(limit));
      params.append('offset', String((page - 1) * limit));

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải danh sách nhật ký hệ thống');
      }

      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, actionFilter, empCodeFilter, searchQuery, page]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const totalPages = Math.ceil(total / limit) || 1;

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('INSERT') || act.includes('ADD')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('REJECT')) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <IconShieldCheck className="w-6 h-6 text-emerald-400" />
              Nhật Ký Thao Tác Hệ Thống (Audit Logs)
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Ghi nhận và giám sát toàn bộ lịch sử thay đổi dữ liệu, cấu hình & phân quyền người dùng.
            </p>
          </div>
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm hành động, ID, mã NV..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="relative">
            <IconFilter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 appearance-none"
            >
              <option value="">Tất cả Phân hệ (Modules)</option>
              <option value="AUTH">Xác Thực & Đăng Nhập (AUTH)</option>
              <option value="ROOMS">Đặt Phòng Họp & Lễ Tân (ROOMS)</option>
              <option value="TASKS">Quản Lý Công Việc (TASKS)</option>
              <option value="BUSINESS_TRIP">Công Tác & Bàn Giao (TRIPS)</option>
              <option value="SECURITY">An Ninh & Cấp Mật Khẩu (SECURITY)</option>
              <option value="PROFILE">Hồ Sơ Cá Nhân (PROFILE)</option>
              <option value="SYSTEM_ADMIN">Quản Trị Hệ Thống (SYSTEM)</option>
              <option value="KAIZEN">Kaizen & Cải Tiến (KAIZEN)</option>
              <option value="GEMBA">Gemba Audit (GEMBA)</option>

            </select>
          </div>

          <div className="relative">
            <IconUser className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Mã Nhân Viên (empCode)..."
              value={empCodeFilter}
              onChange={(e) => { setEmpCodeFilter(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Loại thao tác (Action)..."
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Thời gian</th>
                <th className="py-3.5 px-4 font-semibold">Người thực hiện</th>
                <th className="py-3.5 px-4 font-semibold">Phân hệ</th>
                <th className="py-3.5 px-4 font-semibold">Hành động</th>
                <th className="py-3.5 px-4 font-semibold">Bản ghi ID</th>
                <th className="py-3.5 px-4 font-semibold">Địa chỉ IP</th>
                <th className="py-3.5 px-4 font-semibold text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <IconRefresh className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                    Đang tải danh sách nhật ký...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Không tìm thấy nhật ký thao tác nào phù hợp.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-white">
                      {log.emp_code || log.user_id || 'SYSTEM'}
                      {log.role_code && (
                        <span className="ml-2 text-xs text-slate-500 font-normal">({log.role_code})</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-300">
                      {log.module}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-400">
                      {log.record_id || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-slate-700/60 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                        title="Xem chi tiết thay đổi"
                      >
                        <IconEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 text-sm text-slate-400">
          <div>
            Hiển thị <span className="font-semibold text-white">{logs.length}</span> / <span className="font-semibold text-white">{total}</span> nhật ký
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-40 transition-colors"
            >
              <IconChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-slate-800/80 rounded-lg text-white font-medium">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-40 transition-colors"
            >
              <IconChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <IconCode className="w-5 h-5 text-blue-400" />
                Chi tiết Nhật ký #{selectedLog.id}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-300">
              <div className="grid grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-xs block">Thời gian</span>
                  <span className="font-medium text-white">{new Date(selectedLog.created_at).toLocaleString('vi-VN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Mã Nhân Viên</span>
                  <span className="font-medium text-white">{selectedLog.emp_code || 'SYSTEM'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Phân hệ & Hành động</span>
                  <span className="font-medium text-blue-400">{selectedLog.module} → {selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Địa chỉ IP & User-Agent</span>
                  <span className="font-mono text-xs text-slate-400">{selectedLog.ip_address || '127.0.0.1'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">
                  Dữ Liệu Thay Đổi (Changes JSON - Sanitized)
                </h4>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.changes_json || { before: selectedLog.data_before, after: selectedLog.data_after }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-800/40 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
