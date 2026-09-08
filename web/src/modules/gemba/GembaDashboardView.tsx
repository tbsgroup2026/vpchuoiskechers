"use client";

import React, { useState, useEffect } from "react";
import {
  IconClipboardList,
  IconHourglassHigh,
  IconLoader,
  IconCircleCheck,
  IconAlertTriangle,
  IconCalendarEvent,
  IconRefresh,
  IconArrowRight,
} from "@tabler/icons-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { GembaRecord } from "./types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface GembaDashboardViewProps {
  onNavigateToManagement: () => void;
}

export default function GembaDashboardView({ onNavigateToManagement }: GembaDashboardViewProps) {
  const [timeFilter, setTimeFilter] = useState<string>("ALL");
  const [factoryFilter, setFactoryFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gemba/dashboard?factory_id=${factoryFilter}&time_range=${timeFilter}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setDashboardData(json.data);
        }
      }
    } catch (err) {
      console.warn("Fetch dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [timeFilter, factoryFilter]);

  const kpis = dashboardData?.kpis || {
    total: 24,
    new: 0,
    processing: 0,
    completed: 23,
    overdue: 1,
    this_month: 1,
  };

  const recentTickets = dashboardData?.tables?.recentTickets || [
    { id: "GB-2026-0024", title: "Máy laze 1 dao không có lửa", factory: "PX Đầu vào", line: "LINE CHẶT 1", team: "Cắt", status: "COMPLETED", is_overdue: false, creator: "LẮNG VĂN QUẾ", createdAt: "04/09/2026 12:45" },
    { id: "GB-2026-0023", title: "Hư băng chuyền", factory: "PX Gò", line: "LINE_HTG 3", team: "Tổ công đoạn 2", status: "COMPLETED", is_overdue: false, creator: "TRẦN DUY CHƯƠNG", createdAt: "31/08/2026 13:16" },
    { id: "GB-2026-0022", title: "Máy ép cao tần (ép không lên điện)", factory: "PX Đầu vào", line: "LINE IN ÉP 1", team: "In-ép", status: "PROCESSING", is_overdue: true, creator: "NGUYỄN HOÀI HƯNG", createdAt: "31/08/2026 08:05" },
    { id: "GB-2026-0021", title: "Long chỉ vật tư ống vong co", factory: "PX May", line: "LINE_HTM 1", team: "Tổ may 5", status: "COMPLETED", is_overdue: false, creator: "LÊ VĂN CƯỜNG", createdAt: "29/08/2026 11:05" },
    { id: "GB-2026-0020", title: "Máy không co nhiệt", factory: "PX Gò", line: "LINE_HTG 3", team: "Tổ công đoạn 2", status: "COMPLETED", is_overdue: false, creator: "TRẦN DUY CHƯƠNG", createdAt: "20/08/2026 15:12" },
    { id: "GB-2026-0019", title: "May hư", factory: "PX Gò", line: "LINE_HTG 1", team: "Tổ công đoạn 3", status: "COMPLETED", is_overdue: false, creator: "QLCL Line Gò 1", createdAt: "20/08/2026 09:52" },
    { id: "GB-2026-0018", title: "Không có dao chặt rập 13B651", factory: "PX Đầu vào", line: "LINE IN ÉP 1", team: "Da lót tẩy", status: "COMPLETED", is_overdue: false, creator: "NGUYỄN HOÀI HƯNG", createdAt: "18/08/2026 13:37" },
    { id: "GB-2026-0017", title: "Lỗ định vị Dao không khớp với rập", factory: "PX Đầu vào", line: "LINE CHẶT 1", team: "Cắt", status: "COMPLETED", is_overdue: false, creator: "LẮNG VĂN QUẾ", createdAt: "18/08/2026 10:09" },
    { id: "GB-2026-0016", title: "Ép pho mũi hằn ngấn lên vt", factory: "PX Đầu vào", line: "LINE CHẶT 1", team: "Lạng-cán dán-đồng bộ", status: "COMPLETED", is_overdue: false, creator: "NGUYỄN THỊ LOA", createdAt: "18/08/2026 09:13" },
    { id: "GB-2026-0015", title: "Nghiên cứu may lập trình tt cổ thân", factory: "PX May", line: "LINE_HTM 1", team: "Tổ may 2", status: "COMPLETED", is_overdue: false, creator: "HỒ KHẮC NGHĨA", createdAt: "15/08/2026 08:33" }
  ];

  // 1. Chart Data: Gemba theo Nhà máy
  const chart1Data = {
    labels: ["PX May", "PX Đầu vào", "PX Gò"],
    datasets: [
      {
        label: "Gemba",
        data: [10, 8, 6],
        backgroundColor: "#52c41a",
        borderRadius: 4,
        barThickness: 32,
      },
    ],
  };

  // 2. Chart Data: Tỷ lệ trạng thái (Donut)
  const chart2Data = {
    labels: ["Hoàn thành", "Quá hạn"],
    datasets: [
      {
        data: [kpis.completed, kpis.overdue],
        backgroundColor: ["#52c41a", "#ff4d4f"],
        borderWidth: 0,
      },
    ],
  };

  // 3. Chart Data: Lũy kế vấn đề trong tháng
  const chart3Data = {
    labels: ["PX Đầu vào"],
    datasets: [
      {
        data: [1],
        backgroundColor: ["#1890ff"],
        borderWidth: 0,
      },
    ],
  };

  // 4. Chart Data: Hiện trạng xử lý vấn đề
  const chart4Data = {
    labels: ["TOTAL", "PX Gò", "PX May", "PX Đầu vào"],
    datasets: [
      {
        label: "Chờ xác nhận",
        data: [0, 0, 0, 0],
        backgroundColor: "#13c2c2",
      },
      {
        label: "Đang xử lý",
        data: [1, 0, 0, 1],
        backgroundColor: "#722ed1",
      },
    ],
  };

  // 5. Chart Data: Nhóm các vấn đề Gemba
  const chart5Data = {
    labels: ["TOTAL", "PX Gò", "PX May", "PX Đầu vào"],
    datasets: [
      { label: "7S", data: [0, 0, 0, 0], backgroundColor: "#722ed1" },
      { label: "Tuân thủ", data: [0, 0, 0, 0], backgroundColor: "#13c2c2" },
      { label: "Chất lượng", data: [0, 0, 0, 0], backgroundColor: "#1890ff" },
      { label: "MMTB", data: [1, 0, 0, 1], backgroundColor: "#fa8c16" },
      { label: "Lãng phí", data: [0, 0, 0, 0], backgroundColor: "#eb2f96" },
      { label: "Khác", data: [0, 0, 0, 0], backgroundColor: "#a0d911" },
    ],
  };

  // 6. Chart Data: Thời gian xử lý vấn đề (ngày)
  const chart6Data = {
    labels: ["TOTAL", "PX Gò", "PX May", "PX Đầu vào"],
    datasets: [
      {
        type: "bar" as const,
        label: "TGXL TB (ngày)",
        data: [1.6, 5.2, 0.8, 0.4],
        backgroundColor: "#eb2f96",
        borderRadius: 4,
        barThickness: 24,
      },
    ],
  };

  // 7. Chart Data: Top 5 vấn đề xử lý lâu nhất (ngày)
  const chart7Data = {
    labels: [
      "MMTB : Máy móc hư hỏng chưa xử lý",
      "Khác : Khác",
      "MMTB : Không bảo dưỡng, bảo trì",
      "7S : Sạch sẽ - Săn sóc - Sẵn sàng",
      "Chất lượng : Chất lượng sản phẩm",
    ],
    datasets: [
      {
        label: "Số ngày TB",
        data: [5.6, 2.2, 1.2, 0.8, 0.7],
        backgroundColor: "#eb2f96",
        borderRadius: 4,
        barThickness: 16,
      },
    ],
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-slate-100/70 min-h-screen font-sans text-slate-900">
      {/* 2.1 FILTER BAR TOP */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {/* Time Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar p-0.5">
          {[
            { id: "TODAY", label: "Hôm nay" },
            { id: "WEEK", label: "Tuần này" },
            { id: "MONTH", label: "Tháng này" },
            { id: "QUARTER", label: "Quý" },
            { id: "YEAR", label: "Năm" },
            { id: "ALL", label: "Tất cả" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeFilter === tab.id
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Factory Filter & Refresh Button */}
        <div className="flex items-center gap-2">
          <select
            value={factoryFilter}
            onChange={(e) => setFactoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Tất cả nhà máy</option>
            <option value="fac_nmmd">NM SK MIỀN ĐỒNG</option>
            <option value="fac_kg1">Kiên Giang 1</option>
            <option value="fac_kg2">Kiên Giang 3</option>
            <option value="fac_htd">Hoàn Thiện Đế</option>
          </select>

          <button
            onClick={fetchDashboard}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <IconRefresh size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 2.2 6 KPI CARDS GRID (EXACT MATCH TO REFERENCE SCREENSHOT) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 font-sans">
        {/* Card 1: TỔNG GEMBA */}
        <div
          onClick={onNavigateToManagement}
          className="p-4 rounded-2xl bg-[#006838] text-white flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
              TỔNG GEMBA
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <IconClipboardList size={18} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
              {kpis.total}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold self-start backdrop-blur-xs">
            <span>● Tất cả phiếu</span>
          </div>
        </div>

        {/* Card 2: MỚI */}
        <div
          onClick={onNavigateToManagement}
          className="p-4 rounded-2xl bg-[#fa8c16] text-white flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-100">
              MỚI
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <IconHourglassHigh size={18} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
              {kpis.new}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold self-start backdrop-blur-xs">
            <span>⏳ Chờ tiếp nhận</span>
          </div>
        </div>

        {/* Card 3: ĐANG XỬ LÝ */}
        <div
          onClick={onNavigateToManagement}
          className="p-4 rounded-2xl bg-[#1890ff] text-white flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-100">
              ĐANG XỬ LÝ
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <IconLoader size={18} className="animate-spin" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
              {kpis.processing}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold self-start backdrop-blur-xs">
            <span>🔄 Đang triển khai</span>
          </div>
        </div>

        {/* Card 4: HOÀN THÀNH */}
        <div
          onClick={onNavigateToManagement}
          className="p-4 rounded-2xl bg-[#52c41a] text-white flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
              HOÀN THÀNH
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <IconCircleCheck size={18} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
              {kpis.completed}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold self-start backdrop-blur-xs">
            <span>✔ Đã đóng</span>
          </div>
        </div>

        {/* Card 5: QUÁ HẠN */}
        <div
          onClick={onNavigateToManagement}
          className="p-4 rounded-2xl bg-[#ff4d4f] text-white flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-100">
              QUÁ HẠN
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <IconAlertTriangle size={18} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
              {kpis.overdue}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold self-start backdrop-blur-xs">
            <span>⚠ Cần ưu tiên</span>
          </div>
        </div>

        {/* Card 6: THÁNG NÀY */}
        <div
          onClick={onNavigateToManagement}
          className="p-4 rounded-2xl bg-[#722ed1] text-white flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-100">
              THÁNG NÀY
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <IconCalendarEvent size={18} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
              {kpis.this_month}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold self-start backdrop-blur-xs">
            <span>📅 Phiếu phát sinh</span>
          </div>
        </div>
      </div>

      {/* 2.3 CHART GROUP 1 (3 CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Gemba theo Nhà máy */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Gemba theo Nhà máy
          </h3>
          <div className="h-48">
            <Bar
              data={chart1Data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>

        {/* Chart 2: Tỷ lệ trạng thái */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Tỷ lệ Hoàn Thành / Quá Hạn
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Yield Index
            </span>
          </div>
          <div className="h-48 relative flex items-center justify-center">
            <Doughnut
              data={chart2Data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                cutout: "75%",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {kpis.total > 0 ? Math.round((kpis.completed / kpis.total) * 100) : 0}%
              </span>
              <span className="text-[9.5px] font-bold text-emerald-600 uppercase tracking-wider">
                Nghiệm thu
              </span>
            </div>
          </div>
        </div>

        {/* Chart 3: Lũy kế vấn đề trong tháng */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Lũy kế vấn đề trong tháng
          </h3>
          <div className="h-48 relative flex items-center justify-center">
            <Doughnut
              data={chart3Data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                cutout: "75%",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">1</span>
              <span className="text-[10px] text-slate-400 font-bold">Vấn đề</span>
            </div>
          </div>
        </div>
      </div>

      {/* PILL BUTTON PHÂN TÍCH CHI TIẾT */}
      <div className="flex justify-center my-2">
        <button
          onClick={onNavigateToManagement}
          className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-emerald-800 text-xs font-black tracking-wider uppercase border border-slate-300 shadow-2xs transition-all cursor-pointer flex items-center gap-2"
        >
          <span>📊 PHÂN TÍCH CHI TIẾT</span>
        </button>
      </div>

      {/* 2.4 CHART GROUP 2 (2 CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 4: Hiện trạng xử lý vấn đề */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Hiện trạng xử lý vấn đề
          </h3>
          <div className="h-52">
            <Bar
              data={chart4Data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>

        {/* Chart 5: Nhóm các vấn đề Gemba */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Nhóm các vấn đề Gemba
          </h3>
          <div className="h-52">
            <Bar
              data={chart5Data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
      </div>

      {/* 2.5 TABLE 1: LŨY KẾ GEMBA THÁNG - NĂM */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Lũy kế Gemba Tháng - Năm
        </h3>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">KV / NM</th>
                <th className="py-2.5 px-3 text-center">LK NĂM</th>
                <th className="py-2.5 px-3 text-center">THÁNG 5</th>
                <th className="py-2.5 px-3 text-center">THÁNG 6</th>
                <th className="py-2.5 px-3 text-center">THÁNG 7</th>
                <th className="py-2.5 px-3 text-center">THÁNG 8</th>
                <th className="py-2.5 px-3 text-center">THÁNG 9</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              <tr className="bg-emerald-50/50 font-black text-slate-900">
                <td className="py-2.5 px-3">TOTAL</td>
                <td className="py-2.5 px-3 text-center text-emerald-800">24</td>
                <td className="py-2.5 px-3 text-center text-slate-500">0</td>
                <td className="py-2.5 px-3 text-center text-slate-500">0</td>
                <td className="py-2.5 px-3 text-center text-slate-500">0</td>
                <td className="py-2.5 px-3 text-center text-slate-700">23</td>
                <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">1</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-slate-800">PX Gò</td>
                <td className="py-2.5 px-3 text-center">6</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
                <td className="py-2.5 px-3 text-center">6</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-slate-800">PX May</td>
                <td className="py-2.5 px-3 text-center">10</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
                <td className="py-2.5 px-3 text-center">10</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-slate-800">PX Đầu vào</td>
                <td className="py-2.5 px-3 text-center">8</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
                <td className="py-2.5 px-3 text-center text-slate-400">0</td>
                <td className="py-2.5 px-3 text-center">7</td>
                <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2.6 3 CARDS TOP VẤN ĐỀ THEO PX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Top PX Gò */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Top các vấn đề PX Gò
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span>MMTB</span>
              <span>6</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>

        {/* Card Top PX May */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Top các vấn đề PX May
          </h4>
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Chất lượng</span>
                <span>4</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "80%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Khác</span>
                <span>4</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "80%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>7S</span>
                <span>2</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "40%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Top PX Đầu vào */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Top các vấn đề PX Đầu vào
          </h4>
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Chất lượng</span>
                <span>4</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>MMTB</span>
                <span>3</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "75%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Khác</span>
                <span>1</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "25%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.7 & 2.8 CHARTS 6 & 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 6: Thời gian xử lý vấn đề (ngày) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Thời gian xử lý vấn đề (ngày)
          </h3>
          <div className="h-52">
            <Bar
              data={chart6Data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>

        {/* Chart 7: Top 5 vấn đề xử lý lâu nhất (ngày) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Top 5 vấn đề xử lý lâu nhất (ngày)
          </h3>
          <div className="h-52">
            <Bar
              data={chart7Data}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
                scales: { x: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
      </div>

      {/* 2.9 TABLE 2: GEMBA GẦN ĐÂY */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Gemba gần đây
          </h3>
          <button
            onClick={onNavigateToManagement}
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <span>Xem tất cả</span>
            <IconArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">TIÊU ĐỀ</th>
                <th className="py-2.5 px-3">NHÀ MÁY</th>
                <th className="py-2.5 px-3">LINE</th>
                <th className="py-2.5 px-3">TỔ</th>
                <th className="py-2.5 px-3">TRẠNG THÁI</th>
                <th className="py-2.5 px-3">NGƯỜI TẠO</th>
                <th className="py-2.5 px-3">NGÀY TẠO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {recentTickets.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {t.id}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800 max-w-xs truncate">
                    {t.title}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {t.factory}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {t.line}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {t.team}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {t.is_overdue ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200">
                        Quá hạn
                      </span>
                    ) : t.status === "COMPLETED" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                        Hoàn thành
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200">
                        Đang xử lý
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-bold whitespace-nowrap">
                    {t.creator}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {t.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
