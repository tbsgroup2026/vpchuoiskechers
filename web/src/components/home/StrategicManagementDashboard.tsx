"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconX,
  IconExternalLink,
  IconFileSpreadsheet,
  IconFolder,
  IconChevronRight,
  IconCheck,
  IconChartBar,
  IconShieldCheck,
  IconBuildingFactory,
  IconDatabase,
  IconTarget,
} from "@tabler/icons-react";

export interface ReportItem {
  id: string;
  title: string;
  desc: string;
  category: string;
  url: string;
}

const SAMPLE_REPORTS: Record<string, ReportItem[]> = {
  DINH_HUONG: [
    {
      id: "DH-01",
      title: "Báo cáo Định hướng Ngân sách năm 2026 - VP Chuỗi SKECHERS",
      desc: "Kế hoạch phân bổ ngân sách các trụ cột và chỉ tiêu doanh thu chuỗi.",
      category: "Định hướng & Ngân sách",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
    {
      id: "DH-02",
      title: "Hạn mức Chi phí Vận hành & Đầu tư R&D Chuỗi SKECHERS",
      desc: "Quản trị ngân sách chi tiết phòng ban và hạn mức giải ngân.",
      category: "Định hướng & Ngân sách",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  DIEU_HANH: [
    {
      id: "DH-03",
      title: "Bảng Điều Hành Giao Ban Sản Xuất Tuần 35",
      desc: "Chỉ số OEE, tiến độ đơn hàng và cảnh báo nghẽn chuyền sản xuất.",
      category: "Điều hành",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
    {
      id: "DH-04",
      title: "Báo cáo Quản trị Hiệu suất Tổ hợp Nhà máy TBS",
      desc: "Tổng hợp chỉ số KPIs và năng suất lao động toàn chuỗi SKECHERS.",
      category: "Điều hành",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  HACH_TOAN: [
    {
      id: "HT-01",
      title: "Báo cáo Thanh khoản & Công nợ Khách hàng SKECHERS",
      desc: "Đối soát thanh toán, hạn mức tín dụng và dòng tiền.",
      category: "Hạch toán",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  CHIEN_LUOC: [
    {
      id: "CL-01",
      title: "Chiến lược Phát triển Chuỗi Cung ứng SKECHERS 2026-2030",
      desc: "Lộ trình mở rộng quy mô nhà máy và tích hợp tự động hóa.",
      category: "Chiến lược",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  TC_CN_HTS: [
    {
      id: "TC-01",
      title: "Báo cáo Tài chính - Công nghệ - Hệ thống Số 2026",
      desc: "Tích hợp hệ thống ERP D1 Realtime và hạ tầng số hóa.",
      category: "TC-CN-HTS",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  KH_CC: [
    {
      id: "KH-01",
      title: "Kế hoạch Cung ứng Nguyên phụ liệu Giày SKECHERS",
      desc: "Tiến độ nhập vật tư da, đế, phụ liệu và cân bằng chuyền.",
      category: "KH & CC",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  TH_NM: [
    {
      id: "TH-01",
      title: "Tiến độ Vận hành Tổ hợp Nhà máy TBS SKECHERS",
      desc: "Công suất sản xuất thực tế tại các tổ hợp nhà máy.",
      category: "TH & NM",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  VHDN: [
    {
      id: "VH-01",
      title: "Chương trình Văn hóa Enterprise TBS Group 2026",
      desc: "Chuẩn mực văn hóa tự vận hành, kỷ luật và cải tiến liên tục.",
      category: "VHDN",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  TO_CHUC_HA_TANG: [
    {
      id: "HT-02",
      title: "Sơ đồ Tổ chức & Hạ tầng Số hóa Chuỗi SKECHERS",
      desc: "Cấu trúc nhân sự, phân quyền và hạ tầng vận hành.",
      category: "Tổ chức - Hạ tầng",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  DU_LIEU_SO: [
    {
      id: "DL-01",
      title: "Kho Dữ Liệu Số & Hệ Thống Báo Cáo Realtime D1",
      desc: "Cơ sở dữ liệu tập trung 1-5-2 cho toàn bộ chuỗi SKECHERS.",
      category: "Dữ liệu số",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
};

export function StrategicManagementContent() {
  const [activeModalKey, setActiveModalKey] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const handleOpenModal = (key: string, title: string) => {
    setActiveModalKey(key);
    setModalTitle(title);
  };

  const currentReports = activeModalKey ? SAMPLE_REPORTS[activeModalKey] || [
    {
      id: `REP-${activeModalKey}`,
      title: `Báo cáo Phân hệ ${modalTitle}`,
      desc: `Chỉ số quản trị và danh mục tài liệu phân hệ ${modalTitle} thuộc Hệ thống 1-5-2.`,
      category: modalTitle,
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    }
  ] : [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 w-full min-w-0 h-auto">
      {/* 2-COLUMN LAYOUT MATCHING 1-5-2 DESIGN */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4 sm:gap-5 w-full min-w-0">
        
        {/* LEFT COLUMN: BÁO CÁO NHANH + MISC */}
        <div className="w-full lg:w-[240px] flex-shrink-0 flex flex-col gap-3.5 sm:gap-4">
          {/* TOP LEFT: TBS LOGO STACK */}
          <div className="flex flex-col items-start gap-1 justify-center px-1 h-[46px] flex-shrink-0">
            <img src="/images/tbs-logo.png" alt="TBS Group" className="h-9 sm:h-10 w-auto object-contain" />
            <span className="text-[8.5px] sm:text-[9px] font-black text-[#004029] tracking-tighter uppercase leading-none font-sans">
              CHUNG SỨC KIẾN TẠO TƯƠNG LAI
            </span>
          </div>

          {/* BÁO CÁO NHANH CONTAINER CARD */}
          <div className="bg-[#f4f7f5] rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 flex-1 flex flex-col justify-between gap-3">
            {/* QUICK REPORTS GROUP */}
            <div className="space-y-2.5">
              <h3 className="text-[11.5px] sm:text-[12px] font-black text-slate-800 uppercase tracking-wider text-center py-0.5 border-b border-slate-200/80">
                BÁO CÁO NHANH
              </h3>
              <div className="space-y-2">
                {[
                  { key: "DINH_HUONG", label: "ĐỊNH HƯỚNG & QUẢN TRỊ NGÂN SÁCH", count: "3 / 3" },
                  { key: "DIEU_HANH", label: "ĐIỀU HÀNH", count: "3 / 5" },
                  { key: "HACH_TOAN", label: "HẠCH TOÁN & THANH KHOẢN", count: "2 / 6" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleOpenModal(item.key, item.label)}
                    className="w-full relative min-h-[48px] px-3.5 py-2.5 pr-14 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-[11.5px] sm:text-[12px] font-extrabold uppercase tracking-tight transition-all shadow-2xs flex items-center text-left cursor-pointer"
                  >
                    <span className="line-clamp-2 leading-tight">{item.label}</span>
                    <span className="absolute top-1/2 -translate-y-1/2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[9.5px] font-extrabold">
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* MISC GROUP */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <div className="text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  MISC
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { key: "KE_HOACH_CONG_VIEC", label: "KẾ HOẠCH CÔNG VIỆC", count: "2 / 3" },
                  { key: "THU_VIEN", label: "THƯ VIỆN MẪU", count: "2 / 5" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleOpenModal(item.key, item.label)}
                    className="w-full relative min-h-[48px] px-3.5 py-2.5 pr-14 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-[11.5px] sm:text-[12px] font-extrabold uppercase tracking-tight transition-all shadow-2xs flex items-center text-left cursor-pointer"
                  >
                    <span className="line-clamp-2 leading-tight">{item.label}</span>
                    <span className="absolute top-1/2 -translate-y-1/2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[9.5px] font-extrabold">
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN TITLE + 1-5-2 DASHBOARD GRID */}
        <div className="flex-1 min-w-0 space-y-3.5 sm:space-y-4">
          {/* TOP CENTER: MAIN TITLE */}
          <div className="h-[46px] flex items-center justify-center border-b border-slate-100">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-wide font-serif text-center">
              HỆ THỐNG QUẢN TRỊ CHIẾN LƯỢC 1-5-2
            </h2>
          </div>

          {/* SECTION 1: MỤC ĐÍCH XUYÊN SUỐT BANNER */}
          <section className="px-4 sm:px-5 py-3.5 rounded-2xl bg-[#98c58f] text-[#142414] shadow-2xs flex items-center justify-between gap-4 min-h-[58px]">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-[#1f2a1f] font-black text-base sm:text-lg flex items-center justify-center shadow-xs">
                1
              </div>
              <div className="text-sm sm:text-base lg:text-lg font-black uppercase tracking-wide text-[#1f2a1f] whitespace-nowrap">
                MỤC ĐÍCH XUYÊN SUỐT
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#1a2e1a] leading-relaxed font-medium flex-1 text-right sm:text-left">
              Xây dựng TBS Group là một <strong>đối tác không thể thay thế</strong> trong chuỗi giá trị gia tăng toàn cầu, có khả năng <strong>tự vận hành, tự kiểm soát</strong> và phát triển bền vững.
            </p>
          </section>

          {/* SECTION 5: TRỤ CỘT VẬN HÀNH BANNER */}
          <section className="py-2.5 px-4 rounded-2xl bg-[#98c58f] text-[#142414] shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#1f2a1f] font-black text-sm sm:text-base flex items-center justify-center shadow-xs flex-shrink-0">
              5
            </div>
            <div className="text-sm sm:text-base lg:text-lg font-black uppercase tracking-wide text-[#1f2a1f]">
              TRỤ CỘT VẬN HÀNH
            </div>
          </section>

          {/* 5 PILLARS MODULE CARDS GRID */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { key: "CHIEN_LUOC", label: "CHIẾN LƯỢC", count: "2 / 3" },
              { key: "TC_CN_HTS", label: "TC-CN-HTS", count: "1 / 2" },
              { key: "KH_CC", label: "KH & CC", count: "1 / 2" },
              { key: "TH_NM", label: "TH & NM", count: "1 / 2" },
              { key: "VHDN", label: "VHDN", count: "1 / 2" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => handleOpenModal(item.key, item.label)}
                className="group relative h-[88px] sm:h-[92px] px-3.5 py-3 rounded-2xl bg-[#fff8df] hover:bg-[#fff2c6] border border-amber-200/80 shadow-2xs transition-all duration-200 text-center flex items-center justify-center cursor-pointer"
              >
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[9.5px] font-extrabold">
                  {item.count}
                </span>
                <span className="text-[14px] sm:text-[15px] font-bold text-slate-900 uppercase tracking-tight group-hover:scale-105 transition-transform">
                  {item.label}
                </span>
              </button>
            ))}
          </section>

          {/* SECTION 2: NỀN TẢNG QUẢN TRỊ BANNER */}
          <section className="py-2.5 px-4 rounded-2xl bg-[#98c58f] text-[#142414] shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#1f2a1f] font-black text-sm sm:text-base flex items-center justify-center shadow-xs flex-shrink-0">
              2
            </div>
            <div className="text-sm sm:text-base lg:text-lg font-black uppercase tracking-wide text-[#1f2a1f]">
              NỀN TẢNG QUẢN TRỊ
            </div>
          </section>

          {/* 2 PLATFORMS MODULE CARDS GRID */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {[
              { key: "TO_CHUC_HA_TANG", label: "TỔ CHỨC - HẠ TẦNG", count: "15 / 61" },
              { key: "DU_LIEU_SO", label: "DỮ LIỆU SỐ", count: "2 / 5" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => handleOpenModal(item.key, item.label)}
                className="group relative h-[88px] sm:h-[92px] px-4 py-3 rounded-2xl bg-[#e6f1de] hover:bg-[#daebd0] border border-emerald-200/80 shadow-2xs transition-all duration-200 text-center flex items-center justify-center cursor-pointer"
              >
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[9.5px] font-extrabold">
                  {item.count}
                </span>
                <span className="text-[15px] sm:text-[16px] font-bold text-[#1d2e1d] uppercase tracking-wide group-hover:scale-105 transition-transform">
                  {item.label}
                </span>
              </button>
            ))}
          </section>
        </div>
      </div>

      {/* REPORT GROUP MODAL */}
      {activeModalKey && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#004029] to-[#006838] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <IconFileSpreadsheet size={20} className="text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">{modalTitle}</h3>
                  <span className="text-xs text-emerald-200/90 font-medium">Hệ Thống Quản Trị Chiến Lược 1-5-2</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModalKey(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Modal Reports List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {currentReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/90 hover:border-emerald-300 transition-all cursor-pointer group flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {report.category}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-[#004029] transition-colors">
                      {report.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{report.desc}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:bg-[#004029] group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                    <IconChevronRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REPORT VIEWER MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-[#004029] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconFileSpreadsheet size={22} className="text-emerald-300" />
                <h3 className="text-sm sm:text-base font-bold truncate max-w-xl">{selectedReport.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedReport.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition"
                >
                  <span>Mở tab mới</span>
                  <IconExternalLink size={14} />
                </a>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <IconX size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={selectedReport.url}
                className="w-full h-full border-0"
                title={selectedReport.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StrategicManagementDashboard() {
  return (
    <div className="min-h-screen bg-[#edf1f5] font-sans text-slate-800 flex flex-col antialiased">
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5">
        <StrategicManagementContent />
      </div>
    </div>
  );
}
