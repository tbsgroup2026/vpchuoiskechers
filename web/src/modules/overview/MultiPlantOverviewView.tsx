"use client";

import React, { useState, useEffect } from "react";
import NavLink from "@/components/NavLink";
import {
  IconChartBar,
  IconSparkles,
  IconShieldCheck,
  IconBuildingFactory,
  IconFilter,
  IconRefresh,
  IconArrowLeft,
  IconTrendingUp,
  IconBuilding,
} from "@tabler/icons-react";

export default function MultiPlantOverviewView() {
  const [selectedPlantGroup, setSelectedPlantGroup] = useState("ALL");
  const [selectedPlantCode, setSelectedPlantCode] = useState("ALL");
  const [selectedQuarter, setSelectedQuarter] = useState("ALL");
  const [kaizenStats, setKaizenStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch(`/api/overview/kaizen?plant_group=${selectedPlantGroup}&plant_code=${selectedPlantCode}&quarter=${selectedQuarter}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setKaizenStats(json.stats);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedPlantGroup, selectedPlantCode, selectedQuarter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <NavLink href="/work" className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            <IconArrowLeft size={20} />
          </NavLink>
          <div>
            <h1 className="text-xl font-black text-slate-900">Dashboard Tổng Quan Đa Nhà Máy</h1>
            <p className="text-xs text-slate-500 mt-0.5">Báo cáo tổng hợp số liệu 3 phân hệ (Kaizen, Gemba, Máy móc thiết bị) theo Tổ hợp & Nhà máy</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
            <IconBuilding size={16} className="text-slate-400 ml-1" />
            <select
              value={selectedPlantGroup}
              onChange={(e) => {
                setSelectedPlantGroup(e.target.value);
                setSelectedPlantCode("ALL");
              }}
              className="bg-transparent font-bold text-slate-800 outline-hidden"
            >
              <option value="ALL">🌐 Tất Cả Tổ Hợp Nhà Máy</option>
              <option value="VPCHUOI">🏬 Văn Phòng Chuỗi</option>
              <option value="TO_HOP_KIEN_GIANG">🏭 Tổ Hợp Kiên Giang (KG1, KG2, KG3, Đế)</option>
              <option value="MIEN_DONG">🏗️ Nhà Máy Miền Đông</option>
            </select>
          </div>

          {selectedPlantGroup === "TO_HOP_KIEN_GIANG" && (
            <select
              value={selectedPlantCode}
              onChange={(e) => setSelectedPlantCode(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="ALL">Tất Cả Đơn Vị Con</option>
              <option value="KG1">Kiên Giang 1</option>
              <option value="KG2">Kiên Giang 2</option>
              <option value="KG3">Kiên Giang 3</option>
              <option value="KG_HOANTHIEN_DE">Hoàn Thiện Đế</option>
            </select>
          )}

          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="ALL">🗓️ Tất Cả Các Quý</option>
            <option value="Q1">🌱 Quý 1 / 2026</option>
            <option value="Q2">☀️ Quý 2 / 2026</option>
            <option value="Q3">🍂 Quý 3 / 2026</option>
            <option value="Q4">❄️ Quý 4 / 2026</option>
          </select>

          <button
            onClick={fetchStats}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Làm mới dữ liệu"
          >
            <IconRefresh size={18} />
          </button>
        </div>
      </div>

      {/* 3 Main Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Kaizen Library */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <IconSparkles size={22} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Thư Viện Cải Tiến Kaizen</h3>
                <span className="text-[11px] text-slate-400 font-semibold">Chỉ số đăng ký & tiết kiệm</span>
              </div>
            </div>
            <NavLink href="/work/kaizen" className="text-xs font-bold text-blue-600 hover:underline">
              Xem chi tiết →
            </NavLink>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Tổng Số Đề Xuất:</span>
              <span className="text-lg font-black text-slate-900 font-mono">{loading ? "..." : kaizenStats?.total_proposals || 0}</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Đã Phê Duyệt / Đánh Giá:</span>
              <span className="text-lg font-black text-emerald-700 font-mono">{loading ? "..." : kaizenStats?.approved_proposals || 0}</span>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">Tổng TG Tiết Kiệm:</span>
              <span className="text-sm font-black text-blue-700 font-mono">
                ⏱️ {loading ? "..." : (kaizenStats?.total_saved_seconds || 0).toLocaleString()} giây
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: GEMBA Audit */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <IconShieldCheck size={22} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Quản Lý GEMBA Audit</h3>
                <span className="text-[11px] text-slate-400 font-semibold">Tuân thủ 5S & An toàn</span>
              </div>
            </div>
            <NavLink href="/work/gemba" className="text-xs font-bold text-purple-600 hover:underline">
              Xem chi tiết →
            </NavLink>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Điểm Đánh Giá GEMBA TB:</span>
              <span className="text-lg font-black text-purple-700 font-mono">94.8 / 100</span>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-900">Lỗi Đã Khắc Phục:</span>
              <span className="text-lg font-black text-purple-800 font-mono">128 / 132</span>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Lỗi Đang Theo Dõi:</span>
              <span className="text-sm font-black text-amber-700 font-mono">4 điểm nóng</span>
            </div>
          </div>
        </div>

        {/* Card 3: Machinery & Equipment */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <IconBuildingFactory size={22} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Quản Lý Máy Móc Thiết Bị</h3>
                <span className="text-[11px] text-slate-400 font-semibold">Tài sản & Bảo trì PM</span>
              </div>
            </div>
            <NavLink href="/maintenance" className="text-xs font-bold text-amber-600 hover:underline">
              Xem chi tiết →
            </NavLink>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Tổng Số Thiết Bị:</span>
              <span className="text-lg font-black text-slate-900 font-mono">1,420 máy</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Hoạt Động Bình Thường:</span>
              <span className="text-lg font-black text-emerald-700 font-mono">98.2% (OEE)</span>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-900">Yêu Cầu Sửa Chữa Đột Xuất:</span>
              <span className="text-sm font-black text-rose-700 font-mono">2 phiếu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
