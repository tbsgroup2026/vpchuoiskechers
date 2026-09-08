"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconLayoutDashboard,
  IconClipboardList,
  IconChecklist,
  IconUsers,
  IconSettings,
  IconUserCheck,
  IconLogout,
  IconChevronDown,
  IconChevronRight,
  IconChevronLeft,
  IconBuildingFactory2,
  IconSubtask,
  IconUsersGroup,
  IconAlertTriangle,
  IconCheck,
  IconArrowLeft,
  IconGridDots,
  IconLayoutGrid,
  IconFlask,
  IconDoor,
  IconPlane
} from "@tabler/icons-react";
import { UserProfile } from "@/lib/userProfiles";
import UserAvatar from "@/components/UserAvatar";
import { GembaTreeNode } from "./types";

interface GembaSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  treeData: GembaTreeNode[];
  selectedScope: { workshopId?: string; lineId?: string; teamId?: string } | null;
  setSelectedScope: (scope: { workshopId?: string; lineId?: string; teamId?: string } | null) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggleSidebar?: () => void;
  onCloseMobile?: () => void;
}

export default function GembaSidebar({
  activeTab,
  setActiveTab,
  currentUser,
  treeData,
  selectedScope,
  setSelectedScope,
  onLogout,
  isOpen,
  onToggleSidebar,
  onCloseMobile,
}: GembaSidebarProps) {
  // Tree expanded state map
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    ws_go: true,
    ws_may: true,
    ws_dau_vao: true,
    line_htg1: true,
    line_htg3: true,
    line_htm1: true,
    line_chat1: true,
    line_inep1: true,
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleSelectScope = (
    type: "workshop" | "line" | "team",
    id: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setActiveTab("gemba_list");

    if (type === "workshop") {
      if (selectedScope?.workshopId === id && !selectedScope.lineId) {
        setSelectedScope(null);
      } else {
        setSelectedScope({ workshopId: id });
      }
    } else if (type === "line") {
      if (selectedScope?.lineId === id && !selectedScope.teamId) {
        setSelectedScope({ workshopId: selectedScope.workshopId, lineId: id });
      } else {
        setSelectedScope({ workshopId: selectedScope?.workshopId, lineId: id });
      }
    } else if (type === "team") {
      if (selectedScope?.teamId === id) {
        setSelectedScope({ workshopId: selectedScope.workshopId, lineId: selectedScope.lineId });
      } else {
        setSelectedScope({
          workshopId: selectedScope?.workshopId,
          lineId: selectedScope?.lineId,
          teamId: id,
        });
      }
    }

    if (onCloseMobile) onCloseMobile();
  };

  // Helper avatar display
  const userInitials = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A";
  const userRoleDisplay = currentUser?.roleCode === "SUPER_ADMIN" || currentUser?.roleCode === "ADMIN"
    ? "Admin • VP Chuỗi"
    : `${currentUser?.title || "Chuyên Viên"} • ${currentUser?.department || "VP Chuỗi"}`;

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onCloseMobile}
      />

      {/* Main Sidebar Element (STRICT 2-COLUMN LAYOUT: IN-FLOW FLEX ITEM ON DESKTOP & TABLET, ZERO OVERLAPPING) */}
      <aside
        className={`relative shrink-0 h-full text-slate-800 flex flex-col transition-all duration-300 ease-in-out bg-white border-r border-slate-200/80 font-sans z-20 ${
          isOpen
            ? "w-72 translate-x-0"
            : "w-16 overflow-hidden translate-x-0"
        } max-sm:fixed max-sm:inset-y-0 max-sm:left-0 max-sm:z-50 ${
          !isOpen ? "max-sm:-translate-x-full max-sm:w-72" : ""
        }`}
      >
      {/* 1. TOP LOGO HEADER WITH DUAL BRAND LOGOS & DEDICATED < / > TOGGLE BUTTON */}
      <div className={`p-3 border-b border-slate-200/80 flex items-center ${isOpen ? "justify-between" : "justify-center"} overflow-hidden`}>
        {isOpen && (
          <Link href="/work" title="Về Hub 10 Ứng Dụng (https://vpchuoiskechers.tbsgroup2026.workers.dev/work)" className="flex items-center gap-2 min-w-0 group cursor-pointer">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src="/images/tbs-logo.png"
                alt="TBS Group Logo"
                className="h-7 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="h-5 w-[1px] bg-slate-200 shrink-0" />
              <img
                src="/images/skechers-logo.png"
                alt="Skechers Logo"
                className="h-6 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
              />
            </div>
          </Link>
        )}

        {/* Dedicated < / > Toggle Button on Sidebar Header */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200/80 shadow-2xs shrink-0"
          title={isOpen ? "Thu nhỏ menu (<)" : "Mở rộng menu (>)"}
        >
          {isOpen ? <IconChevronLeft size={18} /> : <IconChevronRight size={18} />}
        </button>
      </div>

      {/* 2. QUICK NAVIGATE BACK TO WORK HUB (/work) */}
      <div className="px-3 pt-2.5 flex justify-center">
        <Link
          href="/work"
          title="Quay lại Hub 10 App (/work)"
          className={`flex items-center ${isOpen ? "w-full gap-2.5 px-3 py-2" : "w-10 h-10 justify-center p-0"} rounded-xl bg-slate-100/90 hover:bg-[#006838] text-slate-700 hover:text-white text-xs font-bold transition-all border border-slate-200/80 shadow-2xs group`}
        >
          <IconArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform text-[#006838] group-hover:text-white shrink-0" />
          {isOpen && <span>Quay lại Work Hub</span>}
        </Link>
      </div>

      {/* 2. CURRENT USER CARD */}
      <div className={`m-3 p-3 rounded-2xl bg-[#006838] text-white flex items-center shadow-md transition-all ${isOpen ? "gap-3" : "justify-center p-2"}`}>
        <UserAvatar src={currentUser?.avatar} name={currentUser?.name || "Admin"} size="md" />
        {isOpen && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-white truncate">
              {currentUser?.name || "Admin"}
            </span>
            <span className="text-[11px] font-bold text-emerald-100/90 truncate">
              {userRoleDisplay}
            </span>
          </div>
        )}
      </div>

      {/* 3. NAVIGATION MENU */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar text-xs">
        {/* MENU CHÍNH GROUP */}
        <div className="space-y-1">
          {isOpen && (
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              MENU CHÍNH
            </div>
          )}

          {/* Dashboard */}
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setSelectedScope(null);
              if (onCloseMobile) onCloseMobile();
            }}
            title="Dashboard"
            className={`w-full flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-0"} py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "dashboard"
                ? "bg-[#e6f4ea] text-[#006838] font-black border border-emerald-200/80 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <IconLayoutDashboard size={20} className={activeTab === "dashboard" ? "text-[#006838]" : "text-slate-500"} />
            {isOpen && <span>Dashboard</span>}
          </button>

          {/* Quản lý Gemba Header with Badge */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveTab("gemba_list");
                if (onCloseMobile) onCloseMobile();
              }}
              title="Quản lý Gemba"
              className={`w-full flex items-center ${isOpen ? "justify-between px-3" : "justify-center px-0"} py-2.5 rounded-xl font-bold transition-all ${
                activeTab === "gemba_list" && !selectedScope
                  ? "bg-[#e6f4ea] text-[#006838] font-black border border-emerald-200/80 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className={`flex items-center ${isOpen ? "gap-3" : "justify-center"}`}>
                <IconClipboardList size={20} className={activeTab === "gemba_list" && !selectedScope ? "text-[#006838]" : "text-slate-500"} />
                {isOpen && <span>Quản lý Gemba</span>}
              </div>
              {isOpen && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold border border-emerald-200">
                  1
                </span>
              )}
            </button>

            {/* TREE HIERARCHY: Phân xưởng (PX) -> Line -> Tổ */}
            {isOpen && (
              <div className="pl-3 pr-1 pt-1 space-y-1 text-slate-600">
              {/* PX Gò */}
              <div className="space-y-0.5">
                <div
                  onClick={(e) => {
                    toggleNode("ws_go");
                    handleSelectScope("workshop", "ws_go", e);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    selectedScope?.workshopId === "ws_go" && !selectedScope.lineId
                      ? "bg-[#e6f4ea] text-[#006838] font-black"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-400">
                      {expandedNodes["ws_go"] ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                    </span>
                    <IconBuildingFactory2 size={15} className="text-emerald-600 shrink-0" />
                    <span className="truncate">PX Gò</span>
                  </div>
                </div>

                {expandedNodes["ws_go"] && (
                  <div className="pl-4 space-y-0.5 border-l border-emerald-900/50 ml-3">
                    {/* LINE_HTG 1 */}
                    <div>
                      <div
                        onClick={(e) => {
                          toggleNode("line_htg1");
                          handleSelectScope("line", "line_htg1", e);
                        }}
                        className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                          selectedScope?.lineId === "line_htg1" && !selectedScope.teamId
                            ? "bg-emerald-600/30 text-emerald-300"
                            : "hover:bg-emerald-900/20 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-500">
                            {expandedNodes["line_htg1"] ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                          </span>
                          <IconSubtask size={13} className="text-emerald-400/80 shrink-0" />
                          <span className="truncate">LINE_HTG 1</span>
                        </div>
                      </div>

                      {expandedNodes["line_htg1"] && (
                        <div className="pl-4 space-y-0.5 border-l border-emerald-900/40 ml-2">
                          <div
                            onClick={(e) => handleSelectScope("team", "team_htg1_1", e)}
                            className={`flex items-center justify-between px-2 py-1 rounded text-[10.5px] cursor-pointer ${
                              selectedScope?.teamId === "team_htg1_1" ? "bg-emerald-600/40 text-emerald-200" : "hover:bg-emerald-900/20 text-slate-400"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Tổ công đoạn 1</span>
                            </div>
                            <span className="flex items-center gap-1 text-[9.5px]">
                              <span className="text-emerald-400 font-bold">● Hoàn thành</span>
                              <span className="px-1.5 rounded-full bg-emerald-900/80 text-emerald-300">1</span>
                            </span>
                          </div>

                          <div
                            onClick={(e) => handleSelectScope("team", "team_htg1_3", e)}
                            className={`flex items-center justify-between px-2 py-1 rounded text-[10.5px] cursor-pointer ${
                              selectedScope?.teamId === "team_htg1_3" ? "bg-emerald-600/40 text-emerald-200" : "hover:bg-emerald-900/20 text-slate-400"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Tổ công đoạn 3</span>
                            </div>
                            <span className="flex items-center gap-1 text-[9.5px]">
                              <span className="text-emerald-400 font-bold">● Hoàn thành</span>
                              <span className="px-1.5 rounded-full bg-emerald-900/80 text-emerald-300">1</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LINE_HTG 2 */}
                    <div>
                      <div
                        onClick={(e) => {
                          toggleNode("line_htg2");
                          handleSelectScope("line", "line_htg2", e);
                        }}
                        className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                          selectedScope?.lineId === "line_htg2" && !selectedScope.teamId
                            ? "bg-emerald-600/30 text-emerald-300"
                            : "hover:bg-emerald-900/20 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-500">
                            {expandedNodes["line_htg2"] ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                          </span>
                          <IconSubtask size={13} className="text-emerald-400/80 shrink-0" />
                          <span className="truncate">LINE_HTG 2</span>
                        </div>
                      </div>

                      {expandedNodes["line_htg2"] && (
                        <div className="pl-4 space-y-0.5 border-l border-emerald-900/40 ml-2">
                          <div
                            onClick={(e) => handleSelectScope("team", "team_htg2_1", e)}
                            className={`flex items-center justify-between px-2 py-1 rounded text-[10.5px] cursor-pointer ${
                              selectedScope?.teamId === "team_htg2_1" ? "bg-emerald-600/40 text-emerald-200" : "hover:bg-emerald-900/20 text-slate-400"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Tổ công đoạn 1</span>
                            </div>
                            <span className="px-1.5 rounded-full bg-emerald-900/80 text-emerald-300 text-[9.5px]">1</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LINE_HTG 3 */}
                    <div>
                      <div
                        onClick={(e) => {
                          toggleNode("line_htg3");
                          handleSelectScope("line", "line_htg3", e);
                        }}
                        className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                          selectedScope?.lineId === "line_htg3" && !selectedScope.teamId
                            ? "bg-emerald-600/30 text-emerald-300"
                            : "hover:bg-emerald-900/20 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-500">
                            {expandedNodes["line_htg3"] ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                          </span>
                          <IconSubtask size={13} className="text-emerald-400/80 shrink-0" />
                          <span className="truncate">LINE_HTG 3</span>
                        </div>
                      </div>

                      {expandedNodes["line_htg3"] && (
                        <div className="pl-4 space-y-0.5 border-l border-emerald-900/40 ml-2">
                          <div
                            onClick={(e) => handleSelectScope("team", "team_htg3_2", e)}
                            className={`flex items-center justify-between px-2 py-1 rounded text-[10.5px] cursor-pointer ${
                              selectedScope?.teamId === "team_htg3_2" ? "bg-emerald-600/40 text-emerald-200" : "hover:bg-emerald-900/20 text-slate-400"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Tổ công đoạn 2</span>
                            </div>
                            <span className="flex items-center gap-1 text-[9.5px]">
                              <span className="text-emerald-400 font-bold">● Hoàn thành</span>
                              <span className="px-1.5 rounded-full bg-emerald-900/80 text-emerald-300 font-bold">3</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PX May */}
              <div className="space-y-0.5">
                <div
                  onClick={(e) => {
                    toggleNode("ws_may");
                    handleSelectScope("workshop", "ws_may", e);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    selectedScope?.workshopId === "ws_may" && !selectedScope.lineId
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                      : "hover:bg-emerald-900/30 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-400">
                      {expandedNodes["ws_may"] ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                    </span>
                    <IconBuildingFactory2 size={15} className="text-emerald-400 shrink-0" />
                    <span className="truncate">PX May</span>
                  </div>
                </div>

                {expandedNodes["ws_may"] && (
                  <div className="pl-4 space-y-0.5 border-l border-emerald-900/50 ml-3">
                    {/* LINE_HTM 1 */}
                    <div>
                      <div
                        onClick={(e) => {
                          toggleNode("line_htm1");
                          handleSelectScope("line", "line_htm1", e);
                        }}
                        className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                          selectedScope?.lineId === "line_htm1" && !selectedScope.teamId
                            ? "bg-emerald-600/30 text-emerald-300"
                            : "hover:bg-emerald-900/20 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-500">
                            {expandedNodes["line_htm1"] ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                          </span>
                          <IconSubtask size={13} className="text-emerald-400/80 shrink-0" />
                          <span className="truncate">LINE_HTM 1</span>
                        </div>
                      </div>

                      {expandedNodes["line_htm1"] && (
                        <div className="pl-4 space-y-0.5 border-l border-emerald-900/40 ml-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <div
                              key={num}
                              onClick={(e) => handleSelectScope("team", `team_htm1_${num}`, e)}
                              className={`flex items-center justify-between px-2 py-1 rounded text-[10.5px] cursor-pointer ${
                                selectedScope?.teamId === `team_htm1_${num}` ? "bg-emerald-600/40 text-emerald-200" : "hover:bg-emerald-900/20 text-slate-400"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                <span>Tổ may {num}</span>
                              </div>
                              <span className="flex items-center gap-1 text-[9.5px]">
                                <span className="text-emerald-400 font-bold">● Hoàn thành</span>
                                <span className="px-1.5 rounded-full bg-emerald-900/80 text-emerald-300 font-bold">
                                  {num === 5 ? 4 : 1}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* LINE_HTM 2 */}
                    <div>
                      <div
                        onClick={(e) => {
                          toggleNode("line_htm2");
                          handleSelectScope("line", "line_htm2", e);
                        }}
                        className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                          selectedScope?.lineId === "line_htm2" && !selectedScope.teamId
                            ? "bg-emerald-600/30 text-emerald-300"
                            : "hover:bg-emerald-900/20 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-500">
                            {expandedNodes["line_htm2"] ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                          </span>
                          <IconSubtask size={13} className="text-emerald-400/80 shrink-0" />
                          <span className="truncate">LINE_HTM 2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PX Đầu vào (Red Badge Warning) */}
              <div className="space-y-0.5">
                <div
                  onClick={(e) => {
                    toggleNode("ws_dau_vao");
                    handleSelectScope("workshop", "ws_dau_vao", e);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    selectedScope?.workshopId === "ws_dau_vao" && !selectedScope.lineId
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                      : "hover:bg-emerald-900/30 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-400">
                      {expandedNodes["ws_dau_vao"] ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                    </span>
                    <IconBuildingFactory2 size={15} className="text-emerald-400 shrink-0" />
                    <span className="truncate">PX Đầu vào</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    1
                  </span>
                </div>

                {expandedNodes["ws_dau_vao"] && (
                  <div className="pl-4 space-y-0.5 border-l border-emerald-900/50 ml-3">
                    {/* LINE CHẶT 1 */}
                    <div>
                      <div
                        onClick={(e) => {
                          toggleNode("line_chat1");
                          handleSelectScope("line", "line_chat1", e);
                        }}
                        className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                          selectedScope?.lineId === "line_chat1" && !selectedScope.teamId
                            ? "bg-emerald-600/30 text-emerald-300"
                            : "hover:bg-emerald-900/20 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-500">
                            {expandedNodes["line_chat1"] ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                          </span>
                          <IconSubtask size={13} className="text-emerald-400/80 shrink-0" />
                          <span className="truncate">LINE CHẶT 1</span>
                        </div>
                      </div>

                      {expandedNodes["line_chat1"] && (
                        <div className="pl-4 space-y-0.5 border-l border-emerald-900/40 ml-2">
                          <div
                            onClick={(e) => handleSelectScope("team", "team_chat1_cat", e)}
                            className={`flex items-center justify-between px-2 py-1 rounded text-[10.5px] cursor-pointer ${
                              selectedScope?.teamId === "team_chat1_cat" ? "bg-emerald-600/40 text-emerald-200" : "hover:bg-emerald-900/20 text-slate-400"
                            }`}
                          >
                            <span>Cắt</span>
                            <span className="px-1.5 rounded-full bg-emerald-900/80 text-emerald-300 text-[9.5px]">3</span>
                          </div>
                          <div
                            onClick={(e) => handleSelectScope("team", "team_chat1_lang", e)}
                            className={`flex items-center justify-between px-2 py-1 rounded text-[10.5px] cursor-pointer ${
                              selectedScope?.teamId === "team_chat1_lang" ? "bg-emerald-600/40 text-emerald-200" : "hover:bg-emerald-900/20 text-slate-400"
                            }`}
                          >
                            <span>Lạng-cán dán-đồng bộ</span>
                            <span className="px-1.5 rounded-full bg-emerald-900/80 text-emerald-300 text-[9.5px]">2</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LINE IN ÉP 1 */}
                    <div>
                      <div
                        onClick={(e) => {
                          toggleNode("line_inep1");
                          handleSelectScope("line", "line_inep1", e);
                        }}
                        className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                          selectedScope?.lineId === "line_inep1" && !selectedScope.teamId
                            ? "bg-emerald-600/30 text-emerald-300"
                            : "hover:bg-emerald-900/20 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-500">
                            {expandedNodes["line_inep1"] ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                          </span>
                          <IconSubtask size={13} className="text-emerald-400/80 shrink-0" />
                          <span className="truncate">LINE IN ÉP 1</span>
                        </div>
                      </div>

                      {expandedNodes["line_inep1"] && (
                        <div className="pl-4 space-y-0.5 border-l border-emerald-900/40 ml-2">
                          <div
                            onClick={(e) => handleSelectScope("team", "team_inep1_da", e)}
                            className={`flex items-center justify-between px-2 py-1 rounded text-[10.5px] cursor-pointer ${
                              selectedScope?.teamId === "team_inep1_da" ? "bg-emerald-600/40 text-emerald-200" : "hover:bg-emerald-900/20 text-slate-400"
                            }`}
                          >
                            <span>Da lót tẩy</span>
                            <span className="px-1.5 rounded-full bg-emerald-900/80 text-emerald-300 text-[9.5px]">2</span>
                          </div>
                          <div
                            onClick={(e) => handleSelectScope("team", "team_inep1_inep", e)}
                            className={`flex items-center justify-between px-2 py-1 rounded text-[10.5px] cursor-pointer ${
                              selectedScope?.teamId === "team_inep1_inep" ? "bg-emerald-600/40 text-emerald-200" : "hover:bg-emerald-900/20 text-slate-400"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                              <span>In-ép</span>
                            </div>
                            <span className="px-1.5 rounded-full bg-red-600/80 text-white font-bold text-[9.5px]">1</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

          {/* Việc của tôi */}
          <button
            onClick={() => {
              setActiveTab("my_tasks");
              if (onCloseMobile) onCloseMobile();
            }}
            title="Việc của tôi"
            className={`w-full flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-0"} py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "my_tasks"
                ? "bg-[#e6f4ea] text-[#006838] font-black border border-emerald-200/80 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <IconChecklist size={20} className={activeTab === "my_tasks" ? "text-[#006838]" : "text-slate-500"} />
            {isOpen && <span>Việc của tôi</span>}
          </button>

          {/* Quản lý User */}
          <button
            onClick={() => {
              setActiveTab("user_mgmt");
              if (onCloseMobile) onCloseMobile();
            }}
            title="Quản lý User"
            className={`w-full flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-0"} py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "user_mgmt"
                ? "bg-[#e6f4ea] text-[#006838] font-black border border-emerald-200/80 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <IconUsers size={20} className={activeTab === "user_mgmt" ? "text-[#006838]" : "text-slate-500"} />
            {isOpen && <span>Quản lý User</span>}
          </button>

          {/* Cài đặt hệ thống */}
          <button
            onClick={() => {
              setActiveTab("settings");
              if (onCloseMobile) onCloseMobile();
            }}
            title="Cài đặt hệ thống"
            className={`w-full flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-0"} py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "settings"
                ? "bg-[#e6f4ea] text-[#006838] font-black border border-emerald-200/80 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <IconSettings size={20} className={activeTab === "settings" ? "text-[#006838]" : "text-slate-500"} />
            {isOpen && <span>Cài đặt hệ thống</span>}
          </button>
        </div>

        {/* HỆ THỐNG LIÊN QUAN GROUP */}
        <div className="pt-2 border-t border-slate-200/70 space-y-1">
          {isOpen && (
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              HỆ THỐNG LIÊN QUAN
            </div>
          )}
          <Link
            href="/1-5-2"
            className={`w-full flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-0"} py-2 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-[#006838] transition-all text-xs font-semibold`}
            title="Hệ thống quản trị 1-5-2"
          >
            <IconLayoutGrid size={18} className="text-slate-500" />
            {isOpen && <span>Hệ thống 1-5-2</span>}
          </Link>
          <Link
            href="/work/ci"
            className={`w-full flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-0"} py-2 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-[#006838] transition-all text-xs font-semibold`}
            title="Phân hệ CN-CI (Kaizen)"
          >
            <IconFlask size={18} className="text-slate-500" />
            {isOpen && <span>CN-CI (Kaizen)</span>}
          </Link>
          <Link
            href="/rooms"
            className={`w-full flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-0"} py-2 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-[#006838] transition-all text-xs font-semibold`}
            title="Đặt phòng họp"
          >
            <IconDoor size={18} className="text-slate-500" />
            {isOpen && <span>Phòng họp</span>}
          </Link>
          <Link
            href="/business-trip"
            className={`w-full flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-0"} py-2 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-[#006838] transition-all text-xs font-semibold`}
            title="Lịch công tác"
          >
            <IconPlane size={18} className="text-slate-500" />
            {isOpen && <span>Lịch công tác</span>}
          </Link>
        </div>
      </div>

      {/* 4. BOTTOM CÁ NHÂN SECTION */}
      <div className="p-3 border-t border-slate-200/70 space-y-1">
        {isOpen && (
          <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            CÁ NHÂN
          </div>
        )}
        <button
          onClick={() => {
            setActiveTab("profile");
            if (onCloseMobile) onCloseMobile();
          }}
          title="Tài khoản cá nhân"
          className={`w-full flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-0"} py-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all text-xs font-semibold`}
        >
          <IconUserCheck size={18} className="text-slate-500" />
          {isOpen && <span>Tài khoản</span>}
        </button>

        <button
          onClick={onLogout}
          title="Đăng xuất"
          className={`w-full flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-0"} py-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all text-xs font-semibold`}
        >
          <IconLogout size={18} className="text-rose-500" />
          {isOpen && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
