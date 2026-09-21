'use client';

import React, { useState, useMemo } from 'react';
import {
  IconUsers,
  IconSearch,
  IconDownload,
  IconStar,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';

export interface EmployeeRow {
  id: string;
  code: string;
  name: string;
  title: string;
  status: 'working' | 'on_leave' | 'resigned' | string;
  totalTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  score: number; // 0 to 10
}

interface EmployeeTableProps {
  employees: EmployeeRow[];
  loading?: boolean;
}

export default function EmployeeTable({ employees = [], loading = false }: EmployeeTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [titleFilter, setTitleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const uniqueTitles = useMemo(() => {
    const titles = Array.from(new Set(employees.map((e) => e.title).filter(Boolean)));
    return titles;
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        emp.code.toLowerCase().includes(q) ||
        emp.name.toLowerCase().includes(q) ||
        emp.title.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'working' && emp.status === 'working') ||
        (statusFilter === 'on_leave' && (emp.status === 'on_leave' || emp.status === 'leave')) ||
        (statusFilter === 'resigned' && emp.status === 'resigned');

      const matchTitle = titleFilter === 'ALL' || emp.title === titleFilter;

      return matchSearch && matchStatus && matchTitle;
    });
  }, [employees, searchQuery, statusFilter, titleFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const handleExportExcel = () => {
    if (filteredEmployees.length === 0) return;

    const headers = ['Mã NV', 'Họ và tên', 'Chức danh', 'Trạng thái', 'Tổng task', 'Đang làm', 'Đã xong', 'Hiệu suất (/10)'];
    const rows = filteredEmployees.map((e) => [
      `"${e.code}"`,
      `"${e.name}"`,
      `"${e.title}"`,
      `"${e.status === 'working' ? 'Đang làm việc' : e.status === 'on_leave' ? 'Nghỉ phép' : 'Nghỉ việc'}"`,
      e.totalTasks,
      e.inProgressTasks,
      e.completedTasks,
      e.score,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_sach_nhan_vien_phong_ban_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đang làm việc
          </span>
        );
      case 'on_leave':
      case 'leave':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Nghỉ phép
          </span>
        );
      case 'resigned':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Nghỉ việc
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl bg-white p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between">
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#006838]">
            <IconUsers size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Danh sách nhân viên phòng ban
            </h3>
            <p className="text-xs text-gray-400 font-normal">
              {filteredEmployees.length} nhân viên phù hợp
            </p>
          </div>
        </div>

        {/* Filter controls & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm mã NV, họ tên, chức danh..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#006838] focus:outline-none focus:ring-1 focus:ring-[#006838]"
            />
          </div>

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 bg-white focus:border-[#006838] focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="working">Đang làm việc</option>
            <option value="on_leave">Nghỉ phép</option>
            <option value="resigned">Nghỉ việc</option>
          </select>

          {/* Title filter dropdown */}
          <select
            value={titleFilter}
            onChange={(e) => {
              setTitleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 bg-white focus:border-[#006838] focus:outline-none"
          >
            <option value="ALL">Tất cả chức danh</option>
            {uniqueTitles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Export Excel button */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#006838] bg-emerald-50/50 px-3 py-1.5 text-xs font-semibold text-[#006838] hover:bg-[#006838] hover:text-white transition-colors cursor-pointer"
          >
            <IconDownload size={14} />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-left text-xs text-gray-700">
          <thead className="bg-gray-50 text-[11px] font-semibold uppercase text-gray-500 border-b border-gray-100">
            <tr>
              <th className="py-3 px-4">Mã NV</th>
              <th className="py-3 px-4">Họ và tên</th>
              <th className="py-3 px-4">Chức danh</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-center">Tổng task</th>
              <th className="py-3 px-4 text-center">Đang làm</th>
              <th className="py-3 px-4 text-center">Đã xong</th>
              <th className="py-3 px-4 text-right">Hiệu suất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-8 bg-gray-100 rounded mx-auto" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-8 bg-gray-100 rounded mx-auto" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-8 bg-gray-100 rounded mx-auto" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-16 bg-gray-200 rounded ml-auto" /></td>
                </tr>
              ))
            ) : paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  Không tìm thấy nhân viên nào phù hợp
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => (
                <tr
                  key={emp.id || emp.code}
                  className="hover:bg-emerald-50/20 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-medium text-gray-500">
                    #{emp.code}
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900 uppercase tracking-tight">
                    {emp.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-medium">
                    {emp.title || 'Chưa cập nhật'}
                  </td>
                  <td className="py-3 px-4">
                    {renderStatusBadge(emp.status)}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-gray-800">
                    {emp.totalTasks}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-amber-600">
                    {emp.inProgressTasks}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-emerald-600">
                    {emp.completedTasks}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-[#006838] border border-emerald-200/50">
                      <IconStar size={14} className="fill-amber-400 text-amber-400" />
                      {emp.score} / 10
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && filteredEmployees.length > pageSize && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span>
            Hiển thị {Math.min((currentPage - 1) * pageSize + 1, filteredEmployees.length)} -{' '}
            {Math.min(currentPage * pageSize, filteredEmployees.length)} trong {filteredEmployees.length} nhân viên
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <IconChevronLeft size={16} />
            </button>
            <span className="px-2 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
