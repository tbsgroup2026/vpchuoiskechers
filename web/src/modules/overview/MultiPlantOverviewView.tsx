"use client";

import React, { useState, useEffect } from "react";
import NavLink from "@/components/NavLink";
import { formatFormattedNumber } from "@/lib/formatNumber";
import { KpiCard } from "@/components/dashboard";
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
        {/* Module 1: Kaizen */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-200">
                <IconSparkles size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Thư Viện Cải Tiến Kaizen</h3>
                <span className="text-[11px] text-slate-400 font-semibold">Chỉ số đăng ký & tiết kiệm</span>
              </div>
            </div>
            <NavLink href="/work/kaizen" className="text-xs font-bold text-[#006838] hover:underline">
              Chi tiết →
            </NavLink>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              icon={IconSparkles}
              title="Tổng Đề Xuất"
              value={kaizenStats?.total_proposals || 0}
              subtitle="Tất cả đề xuất"
              loading={loading}
            />
            <KpiCard
              icon={IconSparkles}
              title="Đã Phê Duyệt"
              value={kaizenStats?.approved_proposals || 0}
              subtitle="Nghiệm thu"
              loading={loading}
            />
          </div>
        </div>

        {/* Module 2: Gemba */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-200">
                <IconShieldCheck size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Quản Lý GEMBA Audit</h3>
                <span className="text-[11px] text-slate-400 font-semibold">Tuân thủ 5S & An toàn</span>
              </div>
            </div>
            <NavLink href="/work/gemba" className="text-xs font-bold text-[#006838] hover:underline">
              Chi tiết →
            </NavLink>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              icon={IconShieldCheck}
              title="Đánh Giá TB"
              value={94.8}
              subtitle="Thang điểm 100"
              loading={loading}
            />
            <KpiCard
              icon={IconShieldCheck}
              title="Đã Khắc Phục"
              value={128}
              subtitle="Trên 132 lỗi"
              loading={loading}
            />
          </div>
        </div>

        {/* Module 3: Maintenance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-200">
                <IconBuildingFactory size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Quản Lý MMTB</h3>
                <span className="text-[11px] text-slate-400 font-semibold">Tài sản & Bảo trì PM</span>
              </div>
            </div>
            <NavLink href="/maintenance" className="text-xs font-bold text-[#006838] hover:underline">
              Chi tiết →
            </NavLink>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              icon={IconBuildingFactory}
              title="Tổng Số Máy"
              value={1420}
              subtitle="Thiết bị hoạt động"
              loading={loading}
            />
            <KpiCard
              icon={IconBuildingFactory}
              title="Chỉ Số OEE"
              value={98.2}
              subtitle="Hiệu suất máy"
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
