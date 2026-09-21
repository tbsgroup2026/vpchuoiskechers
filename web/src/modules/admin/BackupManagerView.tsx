'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  IconDatabase, IconUpload, IconRefresh, IconCircleCheck, IconAlertTriangle, 
  IconX, IconClock, IconFileCode, IconShield, IconExternalLink
} from '@tabler/icons-react';

interface BackupRecord {
  id: string;
  backup_type: 'MANUAL' | 'SCHEDULED';
  file_name: string;
  file_size_bytes: number;
  gdrive_file_id?: string;
  status: 'SUCCESS' | 'SKIPPED_NO_CREDS' | 'FAILED' | string;
  error_message?: string;
  created_at: string;
}

export function BackupManagerView() {
  const [history, setHistory] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Restore Dry-Run Modal States
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreJsonInput, setRestoreJsonInput] = useState('');
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleExecuteRestore = async (isDryRun: boolean) => {
    setRestoring(true);
    setRestoreError(null);
    try {
      let parsedData: any;
      try {
        parsedData = JSON.parse(restoreJsonInput.trim());
      } catch {
        throw new Error('Nội dung JSON không hợp lệ. Vui lòng kiểm tra định dạng dữ liệu.');
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      const res = await fetch(`/api/admin/restore?dryRun=${isDryRun}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'FULL_DATABASE',
          backupData: parsedData,
          fileName: 'Manual_Paste_Backup.json',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Khôi phục dữ liệu thất bại');
      }

      if (isDryRun) {
        setDryRunResult(data);
      } else {
        setSuccessMsg(data.message || 'Đã khôi phục dữ liệu thành công!');
        setShowRestoreModal(false);
        setDryRunResult(null);
        setRestoreJsonInput('');
        await fetchBackupHistory();
      }
    } catch (err: any) {
      setRestoreError(err.message || 'Thao tác thất bại');
    } finally {
      setRestoring(false);
    }
  };


  const fetchBackupHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      const res = await fetch('/api/admin/backup', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải lịch sử sao lưu');
      }
      setHistory(data.history || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackupHistory();
  }, [fetchBackupHistory]);

  const handleTriggerBackup = async () => {
    setTriggering(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.data?.errorMessage || 'Sao lưu thất bại');
      }

      setSuccessMsg(`Sao lưu thành công! File: ${data.data.fileName} (${formatBytes(data.data.fileSizeBytes)})`);
      await fetchBackupHistory();
    } catch (err: any) {
      setError(err.message || 'Thao tác sao lưu thất bại');
    } finally {
      setTriggering(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IconCircleCheck className="w-3.5 h-3.5" /> Thành công
          </span>
        );
      case 'SKIPPED_NO_CREDS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <IconAlertTriangle className="w-3.5 h-3.5" /> Chưa cấu hình GDrive
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <IconX className="w-3.5 h-3.5" /> Thất bại
          </span>
        );
    }
  };

  const lastBackup = history.find(h => h.status === 'SUCCESS' || h.status === 'SKIPPED_NO_CREDS');

  return (
    <div className="space-y-6">
      {/* Overview Card & Action Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <IconDatabase className="w-6 h-6 text-blue-400" />
              Hệ Thống Sao Lưu Tự Động (Google Drive Backup)
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              Tự động sao lưu dữ liệu hệ thống D1 lên Google Drive theo lịch trình hàng ngày (02:00 AM VN Time / 19:00 UTC) 
              và tự động dọn dẹp các bản sao lưu cũ quá 90 ngày.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <IconClock className="w-3.5 h-3.5 text-blue-400" /> Lịch Cron: 0 19 * * * (02:00 AM VN)
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <IconShield className="w-3.5 h-3.5 text-emerald-400" /> Tự động giữ 90 ngày
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <IconFileCode className="w-3.5 h-3.5 text-purple-400" /> Đường dẫn: /Backup-TBS-System/database/
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleTriggerBackup}
              disabled={triggering}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 whitespace-nowrap"
            >
              <IconUpload className={`w-5 h-5 ${triggering ? 'animate-bounce' : ''}`} />
              {triggering ? 'Đang tạo bản sao lưu...' : 'Sao Lưu Ngay (Manual)'}
            </button>

            <button
              onClick={() => setShowRestoreModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-600/20 whitespace-nowrap cursor-pointer"
            >
              <IconRefresh className="w-5 h-5" />
              Khôi Phục (Restore Dry-Run)
            </button>
          </div>
        </div>
      </div>

      {/* Restore Dry-Run Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <IconDatabase className="w-5 h-5 text-purple-400" />
                Công Cụ Khôi Phục Dữ Liệu (Restore Dry-Run Preview)
              </h3>
              <button
                onClick={() => { setShowRestoreModal(false); setDryRunResult(null); }}
                className="text-slate-400 hover:text-white font-bold px-2 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-300 overflow-y-auto max-h-[75vh]">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>Chế độ Xem Trước (Dry-Run) sẽ so sánh dữ liệu sao lưu từ Drive với D1 mà KHÔNG ghi đè cho đến khi bạn xác nhận.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Dán nội dung JSON file backup từ Google Drive:
                </label>
                <textarea
                  rows={6}
                  placeholder='[ { "id": "book_101", "room_name": "Phòng Họp 1", "status": "CONFIRMED" } ]'
                  value={restoreJsonInput}
                  onChange={(e) => setRestoreJsonInput(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {restoreError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                  {restoreError}
                </div>
              )}

              {dryRunResult && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <span>Kết quả xem trước (Preview Summary):</span>
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {dryRunResult.summary?.totalRecordsInFile || 0} bản ghi trong file
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <span className="text-emerald-400 text-lg font-black block">{dryRunResult.summary?.toCreateCount || 0}</span>
                      <span className="text-[11px] text-emerald-300 font-semibold">Bản ghi sẽ TẠO MỚI</span>
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <span className="text-amber-400 text-lg font-black block">{dryRunResult.summary?.toUpdateCount || 0}</span>
                      <span className="text-[11px] text-amber-300 font-semibold">Bản ghi sẽ CẬP NHẬT</span>
                    </div>
                  </div>

                  {dryRunResult.summary?.sampleDiffs && dryRunResult.summary.sampleDiffs.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-1">Mẫu thay đổi (Sample Diffs):</span>
                      <pre className="p-3 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-300 max-h-40 overflow-x-auto border border-slate-800">
                        {JSON.stringify(dryRunResult.summary.sampleDiffs, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-800/40 flex items-center justify-between">
              <button
                onClick={() => { setShowRestoreModal(false); setDryRunResult(null); }}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExecuteRestore(true)}
                  disabled={restoring}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  {restoring ? 'Đang kiểm tra...' : '🔍 Xem Trước (Dry-Run)'}
                </button>
                {dryRunResult && (
                  <button
                    onClick={() => handleExecuteRestore(false)}
                    disabled={restoring}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {restoring ? 'Đang thực thi...' : '⚡ Xác Nhận Khôi Phục'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 font-bold">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 font-bold">✕</button>
        </div>
      )}

      {/* Status Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <span className="text-slate-400 text-xs font-medium block">Lần sao lưu mới nhất</span>
          <div className="mt-2 text-lg font-bold text-white">
            {lastBackup ? new Date(lastBackup.created_at).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
          </div>
          <span className="text-slate-500 text-xs mt-1 block">
            {lastBackup ? `File: ${lastBackup.file_name}` : 'Thực hiện sao lưu đầu tiên'}
          </span>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <span className="text-slate-400 text-xs font-medium block">Tổng số bản sao lưu lưu trữ</span>
          <div className="mt-2 text-2xl font-bold text-blue-400">
            {history.length} bản
          </div>
          <span className="text-slate-500 text-xs mt-1 block">
            Bao gồm cả thủ công & tự động
          </span>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <span className="text-slate-400 text-xs font-medium block">Dung lượng bản sao lưu gần nhất</span>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {lastBackup ? formatBytes(lastBackup.file_size_bytes) : '0 Bytes'}
          </div>
          <span className="text-slate-500 text-xs mt-1 block">
            Đã khử trùng dữ liệu nhạy cảm (Sanitized)
          </span>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <IconClock className="w-5 h-5 text-blue-400" />
            Lịch Sử Sao Lưu Dữ Liệu System
          </h3>
          <button
            onClick={fetchBackupHistory}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Thời gian</th>
                <th className="py-3.5 px-4 font-semibold">Tên tập tin</th>
                <th className="py-3.5 px-4 font-semibold">Loại</th>
                <th className="py-3.5 px-4 font-semibold">Kích thước</th>
                <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                <th className="py-3.5 px-4 font-semibold">Google Drive ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <IconRefresh className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                    Đang tải lịch sử sao lưu...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Chưa ghi nhận lịch sử sao lưu nào. Nhấn &quot;Sao Lưu Ngay&quot; để thực hiện sao lưu thủ công.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-medium text-white">
                      {item.file_name}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                        item.backup_type === 'MANUAL' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {item.backup_type === 'MANUAL' ? 'Thủ công' : 'Tự động (Cron)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-300">
                      {formatBytes(item.file_size_bytes)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                      {item.error_message && (
                        <p className="text-xs text-rose-400 mt-1 max-w-xs truncate" title={item.error_message}>
                          {item.error_message}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-400">
                      {item.gdrive_file_id ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          {item.gdrive_file_id}
                          <IconExternalLink className="w-3 h-3 ml-1" />
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
