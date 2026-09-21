'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuditLogAdminView } from '@/modules/admin/AuditLogAdminView';
import { BackupManagerView } from '@/modules/admin/BackupManagerView';
import { IconShieldCheck, IconDatabase, IconArrowLeft } from '@tabler/icons-react';

export default function AdminAuditAndBackupPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'backup'>('audit');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link href="/work" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                <IconArrowLeft className="w-3.5 h-3.5" /> Work Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-200">Quản Trị Hệ Thống & Bảo Mật</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <IconShieldCheck className="w-8 h-8 text-blue-500" />
              Trung Tâm Quản Trị Audit Log & Google Drive Backup
            </h1>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <IconShieldCheck className="w-4 h-4" />
              Nhật Ký Thao Tác (Audit Logs)
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'backup'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <IconDatabase className="w-4 h-4" />
              Sao Lưu Dữ Liệu (Drive Backup)
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'audit' ? (
          <AuditLogAdminView />
        ) : (
          <BackupManagerView />
        )}
      </div>
    </div>
  );
}
