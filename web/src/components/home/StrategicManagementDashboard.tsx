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
  IconSearch,
  IconFileText,
  IconUsers,
  IconShoppingBag,
  IconCalendar,
  IconChecklist,
  IconSitemap,
  IconBriefcase,
  IconPresentation,
  IconClipboardCheck,
  IconPhoto,
} from "@tabler/icons-react";

export interface ReportItem {
  id: string;
  title: string;
  subtitle: string;
  tag1: string;
  tag2: string;
  link: string;
  iconComp?: any;
  iconBg?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  subtitle: string;
  tags: [string, string];
  url: string;
  iconComp?: any;
  iconBg?: string;
}

export interface LibraryCategory {
  id: string;
  title: string;
  iconComp?: any;
  items: LibraryItem[];
}

export interface InfrastructureItem {
  title: string;
  subtitle: string;
  tags: [string, string];
  url: string;
  icon: string;
}

export interface InfrastructureFolder {
  id: string;
  title: string;
  icon: string;
  items: InfrastructureItem[];
}

export const INFRASTRUCTURE_DATA: InfrastructureFolder[] = [
  {
    id: "th-kg",
    title: "1.TH KG",
    icon: "folder",
    items: [
      {
        title: "01. HTKT TH_KG",
        subtitle: "11. HTKT TH_KG.pdf",
        tags: ["TC_HT", "Chuỗi Giày"],
        url: "https://drive.google.com/file/d/18hva6VVyHGxMUcnCBu86VEtlD7LfWH2q/view",
        icon: "bar-chart",
      },
      {
        title: "02. TH_KG - DS MMTB",
        subtitle: "11.TH_KG - DS MMTB",
        tags: ["TC_HT", "Chuỗi Giày"],
        url: "https://docs.google.com/spreadsheets/d/1HxqzL2msAADeY8Na4qoXqNoVGTO8EJ2l-nwrTPkzpSk/edit?usp=drivesdk",
        icon: "table",
      },
      {
        title: "03. TH_KG - 3.5",
        subtitle: "11.TH_KG - 3.5",
        tags: ["TC_HT", "Chuỗi Giày"],
        url: "https://docs.google.com/spreadsheets/d/1HL8WtM-W_yao4CsBHiwXcBbC9-sNkDN7gKxRNM_DTKs/edit?gid=292863053#gid=292863053",
        icon: "image",
      },
      {
        title: "04. THỐNG KÊ CƠ CẤU LAO ĐỘNG TH_KG",
        subtitle: "THỐNG KÊ CƠ CẤU LAO ĐỘNG",
        tags: ["CCLĐ", "Chuỗi Giày"],
        url: "https://docs.google.com/spreadsheets/u/3/d/1WrM11X3eoQrpD4wIz_4eOFLTKYo5Sb6BYDm-7iJV0ak/edit?gid=410768104#gid=410768104",
        icon: "users",
      },
    ],
  },
  {
    id: "nm-skmd",
    title: "2.NM_SKMĐ",
    icon: "folder",
    items: [
      {
        title: "01. HTKT NM_SKMĐ",
        subtitle: "12. HTKT NM_SKMĐ.pdf",
        tags: ["TC_HT", "Chuỗi Giày"],
        url: "https://drive.google.com/file/d/1TwecWc1RaTlbDJ0Mv_qfVkIODr3jTXt9/view?usp=drivesdk",
        icon: "bar-chart",
      },
      {
        title: "02. NM_SKMĐ - DS MMTB",
        subtitle: "12.NM_SKMĐ - DS MMTB",
        tags: ["TC_HT", "Chuỗi Giày"],
        url: "https://docs.google.com/spreadsheets/d/1HXd48UzkukarMSUm9zBh1KA-H_bcmx3Pa6QqxKX5sIM/edit?usp=drivesdk",
        icon: "table",
      },
      {
        title: "03. NM_SK MĐ - 3.5",
        subtitle: "12.NM_SK MĐ - 3.5",
        tags: ["TC_HT", "Chuỗi Giày"],
        url: "https://docs.google.com/spreadsheets/d/1oO80eP-M03d3izsuEe0TLha1_he2n1oCZz-3I5y3elE/edit?usp=drivesdk",
        icon: "image",
      },
      {
        title: "04. THỐNG KÊ CƠ CẤU LAO ĐỘNG NM_SK1",
        subtitle: "THỐNG KÊ CƠ CẤU LAO ĐỘNG",
        tags: ["CCLĐ", "Chuỗi Giày"],
        url: "https://docs.google.com/spreadsheets/d/1B7unaW19-9LCc-e9R8IZA_y-CtwKDsd9ydrcnGlk2wY/edit?gid=1233647433#gid=1233647433",
        icon: "users",
      },
    ],
  },
];

export const getIconProps = (iconType: string) => {
  switch (iconType) {
    case "bar-chart":
      return { IconComp: IconChartBar, iconBg: "bg-emerald-500" };
    case "table":
      return { IconComp: IconFileSpreadsheet, iconBg: "bg-purple-500" };
    case "image":
      return { IconComp: IconPhoto, iconBg: "bg-[#d946ef]" };
    case "users":
      return { IconComp: IconUsers, iconBg: "bg-blue-500" };
    default:
      return { IconComp: IconFileText, iconBg: "bg-blue-500" };
  }
};

export const LIBRARY_DATA: LibraryCategory[] = [
  {
    id: "thu-vien-khac",
    title: "Thư viện khác",
    iconComp: IconFolder,
    items: [
      {
        id: "TVK-01",
        title: "01. THƯ VIỆN MẪU",
        subtitle: "THƯ VIỆN MẪU",
        tags: ["Thư viện", "N.SXCN"],
        url: "http://10.10.10.53/",
        iconComp: IconBriefcase,
        iconBg: "bg-amber-500",
      },
    ],
  },
  {
    id: "bien-ban-hop",
    title: "Biên bản họp",
    iconComp: IconFolder,
    items: [
      {
        id: "BBH-01",
        title: "01. BÁO CÁO ĐIỀU HÀNH",
        subtitle: "BÁO CÁO ĐIỀU HÀNH",
        tags: ["Thư viện", "N.SXCN"],
        url: "https://docs.google.com/document/d/18OU_OyXv1CNgBQ_kiB3LiGO0GW8CyMn3n_mesvSqBUc/edit?tab=t.0",
        iconComp: IconBriefcase,
        iconBg: "bg-amber-500",
      },
      {
        id: "BBH-02",
        title: "02. T.HỢP HỘI THẢO",
        subtitle: "T.HỢP HỘI THẢO",
        tags: ["Thư viện", "N.SXCN"],
        url: "https://docs.google.com/document/d/1yPCjt3XPTxler5QdO0GYoLLaHGY8_tvbk_Kj29icQvA/edit?tab=t.0",
        iconComp: IconPresentation,
        iconBg: "bg-amber-500",
      },
      {
        id: "BBH-03",
        title: "03. BIÊN BẢN HỌP WAR ROOM",
        subtitle: "BIÊN BẢN HỌP WAR ROOM",
        tags: ["Thư viện", "N.SXCN"],
        url: "https://docs.google.com/document/d/1JHekwJx-tf9aYExJex-u0AiZZigXbQTtnByslDoDuIo/edit?tab=t.0",
        iconComp: IconClipboardCheck,
        iconBg: "bg-amber-500",
      },
    ],
  },
  {
    id: "tai-lieu-hop",
    title: "Tài liệu họp",
    iconComp: IconFolder,
    items: [
      {
        id: "TLH-01",
        title: "01, Trình bày về Văn hoá cải tiến",
        subtitle: "Trình bày về Văn hoá cải tiến",
        tags: ["Thư viện", "N.SXCN"],
        url: "https://docs.google.com/presentation/d/18UGjFcnez0P8w2IyO55G2IXDbmyZIHDkzHbjhixM868/edit?usp=sharing",
        iconComp: IconFileText,
        iconBg: "bg-blue-500",
      },
    ],
  },
];

const SAMPLE_REPORTS: Record<string, ReportItem[]> = {
  KE_HOACH_CONG_VIEC: [
    {
      id: "KHCV-01",
      title: "01. LỊCH LÀM VIỆC",
      subtitle: "LỊCH LÀM VIỆC",
      tag1: "KHCV",
      tag2: "N.SXCN",
      link: "https://script.google.com/a/macros/student.tdmu.edu.vn/s/AKfycbzn3ZDmUHK4oP0-egUBplB646TYZHuiogSMqkGXY1A9g-3z4dPqDVpXOAmXsm42KR6jmQ/exec",
      iconComp: IconCalendar,
      iconBg: "bg-blue-500",
    },
    {
      id: "KHCV-02",
      title: "02. TỔNG QUAN KHCBSX-XH",
      subtitle: "TỔNG QUAN KHCBSX-XH",
      tag1: "KHCV",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/1WPtT-XptIBfuiEh9IkprIi-iJOuv2TdOjsskmxZVJWs/edit?gid=797960688#gid=797960688",
      iconComp: IconChecklist,
      iconBg: "bg-blue-500",
    },
    {
      id: "KHCV-03",
      title: "03. HƯỚNG DẪN TRÌNH BÀY BÁO CÁO 1.4",
      subtitle: "HƯỚNG DẪN TRÌNH BÀY BÁO CÁO 1.4",
      tag1: "KHCV",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/1iFEp3T3qqp-jDynjlp3QobhCk9O-mKCZcbCwv1X7Ydo/edit?gid=1184682814#gid=1184682814",
      iconComp: IconSitemap,
      iconBg: "bg-blue-500",
    },
  ],
  DINH_HUONG: [
    {
      id: "DH-01",
      title: "01. KH-KQ N.SÁCH N.2026_BQLVH1",
      subtitle: "KH-KQ N.SÁCH N.2026_BQLVH1",
      tag1: "Ngân Sách",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/18Hbql-HZdji3mPuKjQi2yAxcBdHDewivNqGlMzMy5XI/edit?gid=150933183#gid=150933183",
    },
    {
      id: "DH-02",
      title: "02. BM CÁC CHỈ SỐ QT THÁNG",
      subtitle: "BM CÁC CHỈ SỐ QT THÁNG",
      tag1: "Ngân Sách",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/15IhXF4qWvrHfNJTM9hxnfD6AudP7_k9qqm9G8RE788k/edit?gid=150933183#gid=150933183",
    },
    {
      id: "DH-03",
      title: "03. BM CÁC CHỈ SỐ QT LK NĂM",
      subtitle: "BM CÁC CHỈ SỐ QT LK NĂM",
      tag1: "Ngân Sách",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/1kiXB36DDiM7Y1gR7952DKr_aCNyZvZBMSIB-xfzKZUw/edit?gid=150933183#gid=150933183",
    },
  ],
  DIEU_HANH: [
    {
      id: "CH001",
      title: "01. KH-KQ SL-DS DAILY",
      subtitle: "KH-KQ SL-DS DAILY",
      tag1: "Điều hành",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/1ezug4oIP_KQ0gyQQkHYlyFD3BRC5AeZN7hOnh3knKAM/edit?gid=2090980099#gid=2090980099",
      iconComp: IconFileText,
      iconBg: "bg-blue-500",
    },
    {
      id: "CH002",
      title: "02. KQ 4-12. PPH",
      subtitle: "KQ 4-12. PPH",
      tag1: "Điều hành",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/19fifkgic-mVMIPTxno_ykZhjiI7ucdarVWb-trjy5lI/edit?gid=663778037#gid=663778037",
      iconComp: IconChartBar,
      iconBg: "bg-blue-500",
    },
    {
      id: "CH003",
      title: "03. BC QTNNL",
      subtitle: "BC QTNNL",
      tag1: "Điều hành",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/1fh4IND1QUK02m01NUHI-LPttA8ZOtb-AL0FN6ZrWr6w/edit?gid=16751050#gid=16751050",
      iconComp: IconUsers,
      iconBg: "bg-blue-500",
    },
    {
      id: "CH004",
      title: "04. TIẾP NHẬN ĐƠN HÀNG",
      subtitle: "TIẾP NHẬN ĐƠN HÀNG",
      tag1: "Điều hành",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/16DKt47p_eh06X1Wkarfc6EpgmZMai-tmiD4nGm0grVo/edit?gid=1727506745#gid=1727506745",
      iconComp: IconShoppingBag,
      iconBg: "bg-blue-500",
    },
    {
      id: "CH005",
      title: "05. TN_PB ĐƠN HÀNG MÙA. NĂM",
      subtitle: "TN_PB ĐƠN HÀNG MÙA. NĂM",
      tag1: "Điều hành",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/1oD0T0ZEHcUh0llG_dXE9exFbgE3D9mb2-13MYRb8bb8/edit?gid=2054842672#gid=2054842672",
      iconComp: IconShoppingBag,
      iconBg: "bg-blue-500",
    },
  ],
  HACH_TOAN: [
    {
      id: "HT-01",
      title: "Báo cáo Thanh khoản & Công nợ Khách hàng SKECHERS",
      subtitle: "Đối soát thanh toán, hạn mức tín dụng và dòng tiền.",
      tag1: "Hạch toán",
      tag2: "Tài chính",
      link: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  CHIEN_LUOC: [
    {
      id: "CL-01",
      title: "01. KHSXKD.2 NĂM-4 MÙA",
      subtitle: "KHSXKD.2 NĂM-4 MÙA",
      tag1: "Chiến lược",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/1zlP1FvRnlG37Qx-fLhY7VwkKnE-SYBfMJK0wZHZM0hI/edit?gid=1679943471#gid=1679943471",
      iconComp: IconChartBar,
      iconBg: "bg-blue-500",
    },
    {
      id: "CL-02",
      title: "02. PHÂN TÍCH DATA ĐƠN HÀNG",
      subtitle: "PHÂN TÍCH DATA ĐƠN HÀNG",
      tag1: "Chiến lược",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/1_K_IlFWM_UaxJxwDWzikZCqY6ZFjIKXZVRWs36jVlJc/edit?gid=1948481325#gid=1948481325",
      iconComp: IconChartBar,
      iconBg: "bg-blue-500",
    },
    {
      id: "CL-03",
      title: "03. BALANCED SCORE CARD VN",
      subtitle: "Balanced Score card VN",
      tag1: "Chiến lược",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/1YEzHpTKcbF0s9E1VTVLq3Z0EF3SapOeKQ8pgnNhFIJ4/edit?gid=783482619#gid=783482619",
      iconComp: IconChartBar,
      iconBg: "bg-blue-500",
    },
  ],
  TC_CN_HTS: [
    {
      id: "TC-01",
      title: "01. BC CC LĐ",
      subtitle: "BC CC LĐ",
      tag1: "TC-CN-HTS",
      tag2: "N.SXCN",
      link: "https://docs.google.com/spreadsheets/d/1wahuaSeVW_0S1F_AdfPNnsWjzvgA-nrpMurZd5ipf28/edit?gid=2011340893#gid=2011340893",
      iconComp: IconUsers,
      iconBg: "bg-blue-500",
    },
  ],
  KH_CC: [],
  TH_NM: [],
  VHDN: [],
  TO_CHUC_HA_TANG: [
    {
      id: "HT-02",
      title: "Sơ đồ Tổ chức & Hạ tầng Số hóa Chuỗi SKECHERS",
      subtitle: "Cấu trúc nhân sự, phân quyền và hạ tầng vận hành.",
      tag1: "Tổ chức",
      tag2: "Hạ tầng",
      link: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
  DU_LIEU_SO: [
    {
      id: "DL-01",
      title: "Kho Dữ Liệu Số & Hệ Thống Báo Cáo Realtime D1",
      subtitle: "Cơ sở dữ liệu tập trung 1-5-2 cho toàn bộ chuỗi SKECHERS.",
      tag1: "Dữ liệu",
      tag2: "Digital",
      link: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-skechers-152-master/pubhtml",
    },
  ],
};

export function StrategicManagementContent() {
  const [activeModalKey, setActiveModalKey] = useState<string | null>(null);
  const [activeLibraryCategoryId, setActiveLibraryCategoryId] = useState<string | null>(null);
  const [activeInfraFolderId, setActiveInfraFolderId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleOpenModal = (key: string, title: string) => {
    setActiveModalKey(key);
    setModalTitle(title);
    setSearchTerm("");
    setActiveLibraryCategoryId(null);
    setActiveInfraFolderId(null);
  };

  const currentReports = activeModalKey ? SAMPLE_REPORTS[activeModalKey] || [] : [];

  const filteredReports = currentReports.filter(
    (rep) =>
      rep.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.tag1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.tag2.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 w-full min-w-0 h-auto">
      {/* 2-COLUMN LAYOUT MATCHING 1-5-2 DESIGN */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4 sm:gap-5 w-full min-w-0">
        {/* LEFT COLUMN: BÁO CÁO NHANH + MISC */}
        <div className="w-full lg:w-[240px] lg:max-w-[240px] flex-shrink-0 flex flex-col gap-3.5 sm:gap-4 min-w-0">
          {/* TOP LEFT: TBS LOGO STACK */}
          <div className="flex flex-col items-start gap-1 justify-center px-1 h-[42px] flex-shrink-0">
            <img src="/images/tbs-logo.png" alt="TBS Group" className="h-8 sm:h-9 w-auto object-contain" />
            <span className="text-[8px] sm:text-[8.5px] font-black text-[#004029] tracking-tighter uppercase leading-none font-sans">
              CHUNG SỨC KIẾN TẠO TƯƠNG LAI
            </span>
          </div>

          {/* BÁO CÁO NHANH CONTAINER CARD */}
          <div className="bg-[#f4f7f5] rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3 min-w-0">
            {/* QUICK REPORTS GROUP */}
            <div className="space-y-2.5">
              <h3 className="text-[11.5px] sm:text-[12px] font-black text-slate-800 uppercase tracking-wider text-center py-0.5 border-b border-slate-200/80">
                BÁO CÁO NHANH
              </h3>
              <div className="space-y-2.5 pt-1">
                {[
                  { key: "DINH_HUONG", label: "ĐỊNH HƯỚNG & QUẢN TRỊ NGÂN SÁCH", count: "3 / 3", enabled: true },
                  { key: "DIEU_HANH", label: "ĐIỀU HÀNH", count: "5 / 5", enabled: true },
                  { key: "HACH_TOAN", label: "HẠCH TOÁN & THANH KHOẢN", count: "0 / 0", enabled: false },
                ].map((item) => {
                  const isEnabled = item.enabled !== false;
                  if (isEnabled) {
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleOpenModal(item.key, item.label)}
                        className="w-full relative min-h-[48px] sm:min-h-[52px] px-3.5 py-2.5 pr-12 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-[11.5px] sm:text-[12px] font-black uppercase tracking-tight transition-all shadow-2xs flex items-center text-left cursor-pointer group"
                      >
                        <span className="line-clamp-2 leading-tight">{item.label}</span>
                        <span className="absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[9.5px] sm:text-[10px] font-black shadow-md border-2 border-white">
                          {item.count}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={item.key}
                      disabled
                      className="w-full relative min-h-[48px] sm:min-h-[52px] px-3.5 py-2.5 pr-12 rounded-xl bg-slate-200/80 text-slate-400 border border-slate-300/60 text-[11.5px] sm:text-[12px] font-black uppercase tracking-tight transition-all flex items-center text-left cursor-not-allowed opacity-75 pointer-events-none select-none"
                    >
                      <span className="line-clamp-2 leading-tight">{item.label}</span>
                      <span className="absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-full bg-slate-400 text-white font-mono text-[9.5px] sm:text-[10px] font-black shadow-md border-2 border-white">
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MISC GROUP */}
            <div className="space-y-2.5 pt-2.5 border-t border-slate-200/80">
              <div className="text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  MISC
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { key: "KE_HOACH_CONG_VIEC", label: "KẾ HOẠCH CÔNG VIỆC", count: "3 / 3", enabled: true },
                  { key: "THU_VIEN", label: "THƯ VIỆN MẪU", count: "5 / 5", enabled: true },
                ].map((item) => {
                  const isEnabled = item.enabled !== false;
                  if (isEnabled) {
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleOpenModal(item.key, item.label)}
                        className="w-full relative min-h-[48px] sm:min-h-[52px] px-3.5 py-2.5 pr-12 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-[11.5px] sm:text-[12px] font-black uppercase tracking-tight transition-all shadow-2xs flex items-center text-left cursor-pointer group"
                      >
                        <span className="line-clamp-2 leading-tight">{item.label}</span>
                        <span className="absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[9.5px] sm:text-[10px] font-black shadow-md border-2 border-white">
                          {item.count}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={item.key}
                      disabled
                      className="w-full relative min-h-[48px] sm:min-h-[52px] px-3.5 py-2.5 pr-12 rounded-xl bg-slate-200/80 text-slate-400 border border-slate-300/60 text-[11.5px] sm:text-[12px] font-black uppercase tracking-tight transition-all flex items-center text-left cursor-not-allowed opacity-75 pointer-events-none select-none"
                    >
                      <span className="line-clamp-2 leading-tight">{item.label}</span>
                      <span className="absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-full bg-slate-400 text-white font-mono text-[9.5px] sm:text-[10px] font-black shadow-md border-2 border-white">
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN TITLE + 1-5-2 DASHBOARD GRID */}
        <div className="flex-1 min-w-0 space-y-3.5 sm:space-y-4">
          {/* TOP CENTER: MAIN TITLE */}
          <div className="h-[42px] flex items-center justify-center border-b border-slate-100">
            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-wide font-serif text-center w-full break-words leading-tight px-1">
              HỆ THỐNG QUẢN TRỊ CHIẾN LƯỢC 1-5-2
            </h2>
          </div>

          {/* SECTION 1: MỤC ĐÍCH XUYÊN SUỐT BANNER */}
          <section className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-[#98c58f] text-[#142414] shadow-2xs flex items-center justify-between gap-3 min-h-[50px] w-full min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#1f2a1f] font-black text-xs sm:text-base flex items-center justify-center shadow-xs flex-shrink-0">
                1
              </div>
              <div className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-[#1f2a1f]">
                MỤC ĐÍCH XUYÊN SUỐT
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-[#1a2e1a] leading-relaxed font-medium flex-1 min-w-0 text-left">
              Xây dựng TBS Group là một <strong>đối tác không thể thay thế</strong> trong chuỗi giá trị gia tăng toàn cầu, có khả năng <strong>tự vận hành, tự kiểm soát</strong> và phát triển bền vững.
            </p>
          </section>

          {/* SECTION 5: TRỤ CỘT VẬN HÀNH BANNER */}
          <section className="py-2 px-3.5 rounded-2xl bg-[#98c58f] text-[#142414] shadow-2xs flex items-center gap-2.5 w-full min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#1f2a1f] font-black text-xs sm:text-sm flex items-center justify-center shadow-xs flex-shrink-0">
              5
            </div>
            <div className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-[#1f2a1f]">
              TRỤ CỘT VẬN HÀNH
            </div>
          </section>

          {/* 5 PILLARS MODULE CARDS GRID */}
          {(() => {
            const pillarItems = [
              { key: "CHIEN_LUOC", label: "CHIẾN LƯỢC" },
              { key: "TC_CN_HTS", label: "TC-CN-HTS" },
              { key: "KH_CC", label: "KH & CC" },
              { key: "TH_NM", label: "TH & NM" },
              { key: "VHDN", label: "VHDN" },
            ];

            return (
              <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full min-w-0 pt-0.5">
                {pillarItems.map((item) => {
                  const reports = SAMPLE_REPORTS[item.key] || [];
                  const count = reports.length;
                  const isEnabled = count > 0;

                  if (isEnabled) {
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleOpenModal(item.key, item.label)}
                        className="group relative h-[76px] sm:h-[84px] px-3 py-2.5 rounded-2xl bg-[#fff8df] hover:bg-[#fff2c6] border border-amber-200/90 shadow-2xs hover:shadow-md transition-all duration-200 text-center flex items-center justify-center cursor-pointer"
                      >
                        <span className="absolute -top-2.5 -right-2.5 z-10 w-5.5 h-5.5 rounded-full bg-[#f59e0b] text-white font-mono text-[10px] font-black flex items-center justify-center shadow-md border-2 border-white">
                          {count}
                        </span>
                        <span className="text-[13px] sm:text-[14px] font-black text-slate-900 uppercase tracking-tight group-hover:scale-105 transition-transform">
                          {item.label}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={item.key}
                      disabled
                      className="group relative h-[76px] sm:h-[84px] px-3 py-2.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-2xs flex items-center justify-center cursor-not-allowed opacity-75 pointer-events-none select-none text-center"
                    >
                      <span className="absolute -top-2.5 -right-2.5 z-10 w-5.5 h-5.5 rounded-full bg-slate-300 text-slate-600 font-mono text-[10px] font-black flex items-center justify-center shadow-xs border-2 border-white">
                        0
                      </span>
                      <span className="text-[13px] sm:text-[14px] font-bold text-slate-400 uppercase tracking-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </section>
            );
          })()}

          {/* SECTION 2: NỀN TẢNG QUẢN TRỊ BANNER */}
          <section className="py-2 px-3.5 rounded-2xl bg-[#98c58f] text-[#142414] shadow-2xs flex items-center gap-2.5 w-full min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#1f2a1f] font-black text-xs sm:text-sm flex items-center justify-center shadow-xs flex-shrink-0">
              2
            </div>
            <div className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-[#1f2a1f]">
              NỀN TẢNG QUẢN TRỊ
            </div>
          </section>

          {/* 2 PLATFORMS MODULE CARDS GRID */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full min-w-0 pt-1">
            {(() => {
              const infraItemCount = INFRASTRUCTURE_DATA.reduce((acc, f) => acc + f.items.length, 0);
              return [
                { key: "TO_CHUC_HA_TANG", label: "TỔ CHỨC - HẠ TẦNG", count: `${infraItemCount} / 60`, enabled: true },
                { key: "DU_LIEU_SO", label: "DỮ LIỆU SỐ", count: "0 / 0", enabled: false },
              ].map((item) => {
                const isEnabled = item.enabled !== false;
                if (isEnabled) {
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleOpenModal(item.key, item.label)}
                      className="group relative h-[100px] sm:h-[110px] px-5 py-4 rounded-2xl bg-[#e6f1de] hover:bg-[#daebd0] border border-emerald-200/90 shadow-2xs hover:shadow-md transition-all duration-200 text-center flex items-center justify-center cursor-pointer"
                    >
                      <span className="absolute -top-3 -right-3 z-10 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10.5px] sm:text-[11px] font-black shadow-md border-2 border-white">
                        {item.count}
                      </span>
                      <span className="text-[16px] sm:text-[17.5px] font-black text-[#1d2e1d] uppercase tracking-wide group-hover:scale-105 transition-transform">
                        {item.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.key}
                    disabled
                    className="group relative h-[100px] sm:h-[110px] px-5 py-4 rounded-2xl bg-slate-200/80 text-slate-400 border border-slate-300/60 shadow-2xs transition-all duration-200 text-center flex items-center justify-center cursor-not-allowed opacity-75 pointer-events-none select-none"
                  >
                    <span className="absolute -top-3 -right-3 z-10 px-2.5 py-0.5 rounded-full bg-slate-400 text-white font-mono text-[10.5px] sm:text-[11px] font-black shadow-md border-2 border-white">
                      {item.count}
                    </span>
                    <span className="text-[16px] sm:text-[17.5px] font-black text-slate-400 uppercase tracking-wide">
                      {item.label}
                    </span>
                  </button>
                );
              });
            })()}
          </section>
        </div>
      </div>

      {/* TỔ CHỨC - HẠ TẦNG MODAL (FLOW 2 CẤP) */}
      {activeModalKey === "TO_CHUC_HA_TANG" ? (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#004029] to-[#006838] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <IconFolder size={22} className="text-emerald-300" />
                </div>
                <div>
                  {activeInfraFolderId ? (
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveInfraFolderId(null);
                          setSearchTerm("");
                        }}
                        className="cursor-pointer hover:underline text-emerald-200 hover:text-white transition-colors"
                      >
                        Tổ chức - Hạ tầng
                      </button>
                      <span className="text-emerald-400/80 font-normal">&gt;</span>
                      <span>
                        {INFRASTRUCTURE_DATA.find((f) => f.id === activeInfraFolderId)?.title}
                      </span>
                    </h3>
                  ) : (
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">
                      Tổ chức - Hạ tầng
                    </h3>
                  )}
                  <p className="text-xs text-emerald-200/90 font-medium">
                    Hệ Thống Quản Trị Chiến Lược 1-5-2 • Danh Mục Tài Liệu
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveModalKey(null);
                  setActiveInfraFolderId(null);
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* LEVEL 1: INFRASTRUCTURE FOLDERS GRID (KHI CHƯA CHỌN FOLDER) */}
            {!activeInfraFolderId ? (
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {INFRASTRUCTURE_DATA.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setActiveInfraFolderId(folder.id);
                        setSearchTerm("");
                      }}
                      className="group relative bg-[#fff8df] hover:bg-[#fff2c6] border border-amber-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl text-center min-h-[160px]"
                    >
                      {/* Badge số lượng hình tròn màu xanh lá ở góc trên bên phải */}
                      <span className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-emerald-600 text-white font-mono text-xs font-black flex items-center justify-center shadow-xs">
                        {folder.items.length}
                      </span>

                      {/* Icon folder màu cam/vàng đậm */}
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <IconFolder size={32} className="text-amber-600" />
                      </div>

                      {/* Tên folder in đậm căn giữa */}
                      <h4 className="text-base font-black text-slate-900 group-hover:text-amber-900 transition-colors">
                        {folder.title}
                      </h4>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* LEVEL 2: DOCUMENT LIST GRID & SEARCH (KHI ĐÃ CHỌN FOLDER) */
              <>
                {/* Search Input */}
                <div className="px-5 pt-4 pb-2 bg-slate-50 border-b border-slate-200/80">
                  <div className="relative">
                    <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Tìm trong nhóm này..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                </div>

                {/* Items Grid */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
                  {(() => {
                    const currentFolder = INFRASTRUCTURE_DATA.find(
                      (f) => f.id === activeInfraFolderId
                    );
                    const items = currentFolder ? currentFolder.items : [];
                    const filteredItems = items.filter(
                      (item) =>
                        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
                    );

                    if (filteredItems.length === 0) {
                      return (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                          <IconFolder size={40} className="mx-auto text-slate-300" />
                          <p className="text-sm font-medium">Không tìm thấy tài liệu phù hợp</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map((item, idx) => {
                          const iconInfo = getIconProps(item.icon);
                          const IconComp = iconInfo.IconComp;
                          const iconBg = iconInfo.iconBg;
                          const hasUrl = Boolean(item.url && item.url.trim());

                          if (hasUrl) {
                            return (
                              <a
                                key={idx}
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-amber-400 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-3.5 h-full"
                              >
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className={`w-11 h-11 rounded-2xl ${iconBg} text-white flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                      <IconComp size={22} className="text-white" />
                                    </div>
                                    <span className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-amber-50 group-hover:text-amber-600 text-slate-400 flex items-center justify-center transition-colors flex-shrink-0">
                                      <IconChevronRight size={18} />
                                    </span>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors leading-snug line-clamp-2">
                                      {item.title}
                                    </h4>
                                    <p className="text-xs font-semibold text-slate-400 line-clamp-2 mt-1">
                                      {item.subtitle}
                                    </p>
                                  </div>
                                </div>

                                {/* 2 Tags */}
                                <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 mt-auto">
                                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10.5px] font-extrabold border border-slate-200/80">
                                    {item.tags[0]}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-extrabold border border-emerald-200/80">
                                    {item.tags[1]}
                                  </span>
                                </div>
                              </a>
                            );
                          }

                          return (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-400 shadow-2xs opacity-75 cursor-not-allowed pointer-events-none select-none flex flex-col justify-between gap-3.5 h-full"
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="w-11 h-11 rounded-2xl bg-slate-300 text-slate-500 flex items-center justify-center shadow-xs flex-shrink-0">
                                    <IconComp size={22} className="text-slate-500" />
                                  </div>
                                  <span className="w-7 h-7 rounded-lg bg-slate-200/60 text-slate-300 flex items-center justify-center flex-shrink-0">
                                    <IconChevronRight size={18} />
                                  </span>
                                </div>

                                <div>
                                  <h4 className="text-sm font-black text-slate-500 leading-snug line-clamp-2">
                                    {item.title}
                                  </h4>
                                  <p className="text-xs font-semibold text-slate-400 line-clamp-2 mt-1">
                                    {item.subtitle}
                                  </p>
                                </div>
                              </div>

                              {/* 2 Tags */}
                              <div className="flex items-center gap-2 pt-2.5 border-t border-slate-200/60 mt-auto">
                                <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-500 text-[10.5px] font-extrabold border border-slate-300/60">
                                  {item.tags[0]}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-500 text-[10.5px] font-extrabold border border-slate-300/60">
                                  {item.tags[1]}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      ) : activeModalKey === "THU_VIEN" ? (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#004029] to-[#006838] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <IconFolder size={22} className="text-emerald-300" />
                </div>
                <div>
                  {activeLibraryCategoryId ? (
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveLibraryCategoryId(null);
                          setSearchTerm("");
                        }}
                        className="cursor-pointer hover:underline text-emerald-200 hover:text-white transition-colors"
                      >
                        Thư Viện
                      </button>
                      <span className="text-emerald-400/80 font-normal">&gt;</span>
                      <span>
                        {LIBRARY_DATA.find((c) => c.id === activeLibraryCategoryId)?.title}
                      </span>
                    </h3>
                  ) : (
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">
                      Thư Viện
                    </h3>
                  )}
                  <p className="text-xs text-emerald-200/90 font-medium">
                    Hệ Thống Quản Trị Chiến Lược 1-5-2 • Danh Mục Tài Liệu
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveModalKey(null);
                  setActiveLibraryCategoryId(null);
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* LEVEL 1: CATEGORIES GRID (KHI CHƯA CHỌN DANH MỤC) */}
            {!activeLibraryCategoryId ? (
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {LIBRARY_DATA.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveLibraryCategoryId(cat.id);
                        setSearchTerm("");
                      }}
                      className="group relative bg-[#fff8df] hover:bg-[#fff2c6] border border-amber-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl text-center min-h-[160px]"
                    >
                      {/* Badge số lượng hình tròn màu xanh lá ở góc trên bên phải */}
                      <span className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-emerald-600 text-white font-mono text-xs font-black flex items-center justify-center shadow-xs">
                        {cat.items.length}
                      </span>

                      {/* Icon folder màu cam/vàng đậm */}
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <IconFolder size={32} className="text-amber-600" />
                      </div>

                      {/* Tên danh mục in đậm căn giữa */}
                      <h4 className="text-base font-black text-slate-900 group-hover:text-amber-900 transition-colors">
                        {cat.title}
                      </h4>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* LEVEL 2: DOCUMENT LIST GRID & SEARCH (KHI ĐÃ CHỌN DANH MỤC) */
              <>
                {/* Search Input */}
                <div className="px-5 pt-4 pb-2 bg-slate-50 border-b border-slate-200/80">
                  <div className="relative">
                    <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Tìm trong nhóm này..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                </div>

                {/* Items Grid */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
                  {(() => {
                    const currentCategory = LIBRARY_DATA.find(
                      (c) => c.id === activeLibraryCategoryId
                    );
                    const items = currentCategory ? currentCategory.items : [];
                    const filteredItems = items.filter(
                      (item) =>
                        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
                    );

                    if (filteredItems.length === 0) {
                      return (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                          <IconFolder size={40} className="mx-auto text-slate-300" />
                          <p className="text-sm font-medium">Không tìm thấy tài liệu phù hợp</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map((item) => {
                          const IconComp = item.iconComp || IconFileText;
                          const iconBg = item.iconBg || "bg-amber-500";

                          return (
                            <a
                              key={item.id}
                              data-id={item.id}
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-amber-400 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-3.5 h-full"
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className={`w-11 h-11 rounded-2xl ${iconBg} text-white flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                    <IconComp size={22} className="text-white" />
                                  </div>
                                  <span className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-amber-50 group-hover:text-amber-600 text-slate-400 flex items-center justify-center transition-colors flex-shrink-0">
                                    <IconChevronRight size={18} />
                                  </span>
                                </div>

                                <div>
                                  <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors leading-snug line-clamp-2">
                                    {item.title}
                                  </h4>
                                  <p className="text-xs font-semibold text-slate-400 line-clamp-2 mt-1">
                                    {item.subtitle}
                                  </p>
                                </div>
                              </div>

                              {/* 2 Tags */}
                              <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 mt-auto">
                                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10.5px] font-extrabold border border-slate-200/80">
                                  {item.tags[0]}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-extrabold border border-emerald-200/80">
                                  {item.tags[1]}
                                </span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      ) : activeModalKey ? (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#004029] to-[#006838] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <IconFileSpreadsheet size={22} className="text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">{modalTitle}</h3>
                  <p className="text-xs text-emerald-200/90 font-medium">Hệ Thống Quản Trị Chiến Lược 1-5-2 • Danh Mục Tài Liệu</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalKey(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="px-5 pt-4 pb-2 bg-slate-50 border-b border-slate-200/80">
              <div className="relative">
                <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm trong nhóm này..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            {/* Modal Reports Grid List (3 CARDS PER ROW ON DESKTOP) */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {filteredReports.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <IconFolder size={40} className="mx-auto text-slate-300" />
                  <p className="text-sm font-medium">Không tìm thấy tài liệu phù hợp</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReports.map((report) => {
                    const IconComp = report.iconComp || IconFileSpreadsheet;
                    const iconBg = report.iconBg || "bg-[#004029]";

                    return (
                      <a
                        key={report.id}
                        data-id={report.id}
                        href={report.link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-blue-400 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-3.5 h-full"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className={`w-11 h-11 rounded-2xl ${iconBg} text-white flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform`}>
                              <IconComp size={22} className="text-white" />
                            </div>
                            <span className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-400 flex items-center justify-center transition-colors flex-shrink-0">
                              <IconChevronRight size={18} />
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                              {report.title}
                            </h4>
                            <p className="text-xs font-semibold text-slate-400 line-clamp-2 mt-1">
                              {report.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* 2 Tags: tag1 (light gray) & tag2 (light green) */}
                        <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 mt-auto">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10.5px] font-extrabold border border-slate-200/80">
                            {report.tag1}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-extrabold border border-emerald-200/80">
                            {report.tag2}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
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
