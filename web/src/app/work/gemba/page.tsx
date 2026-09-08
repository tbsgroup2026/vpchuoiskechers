"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUser, logoutUserProfile, UserProfile } from "@/lib/userProfiles";
import GembaSidebar from "@/modules/gemba/GembaSidebar";
import GembaHeader from "@/modules/gemba/GembaHeader";
import GembaDashboardView from "@/modules/gemba/GembaDashboardView";
import GembaManagementView from "@/modules/gemba/GembaManagementView";
import GembaUserManagementView from "@/modules/gemba/GembaUserManagementView";

export default function GembaMainPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedScope, setSelectedScope] = useState<{ workshopId?: string; lineId?: string; teamId?: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [treeData, setTreeData] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch current logged-in user session
    const u = getCurrentUser();
    setCurrentUser(u);

    // 2. Fetch master tree hierarchy
    fetch("/api/gemba/tree")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTreeData(json.tree || []);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logoutUserProfile();
    window.location.href = "/login";
  };

  const getBreadcrumb = () => {
    if (activeTab === "dashboard") return "Dashboard";
    if (activeTab === "gemba_list") return "Quản lý Gemba";
    if (activeTab === "my_tasks") return "Việc của tôi";
    if (activeTab === "user_mgmt") return "Quản lý User";
    if (activeTab === "settings") return "Cài đặt hệ thống";
    if (activeTab === "profile") return "Tài khoản cá nhân";
    return "Phân hệ Gemba.Pro";
  };

  const getPageTitle = () => {
    if (activeTab === "dashboard") return "Dashboard";
    if (activeTab === "gemba_list") return "Quản lý Gemba";
    if (activeTab === "my_tasks") return "Việc của tôi";
    if (activeTab === "user_mgmt") return "Quản lý User";
    if (activeTab === "settings") return "Cài đặt hệ thống";
    return "Gemba.Pro";
  };

  return (
    <div className="flex h-screen w-full bg-[#f4f6f8] overflow-hidden font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      {/* 1. LEFT SIDEBAR */}
      <GembaSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        treeData={treeData}
        selectedScope={selectedScope}
        setSelectedScope={setSelectedScope}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Header */}
        <GembaHeader
          title={getPageTitle()}
          breadcrumb={getBreadcrumb()}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-0">
          {activeTab === "dashboard" && (
            <GembaDashboardView
              onNavigateToManagement={() => {
                setActiveTab("gemba_list");
                setSelectedScope(null);
              }}
            />
          )}

          {activeTab === "gemba_list" && (
            <GembaManagementView
              selectedScope={selectedScope}
              currentUser={currentUser}
            />
          )}

          {activeTab === "user_mgmt" && (
            <GembaUserManagementView currentUser={currentUser} />
          )}

          {activeTab === "my_tasks" && (
            <div className="p-8 text-center space-y-3">
              <h3 className="text-lg font-black text-slate-800">Việc của tôi</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Danh sách các phiếu Gemba được phân công trực tiếp cho tài khoản [{currentUser?.empCode || "ADMIN"}].
              </p>
              <button
                onClick={() => setActiveTab("gemba_list")}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                Mở Quản Lý Gemba
              </button>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-8 text-center space-y-3">
              <h3 className="text-lg font-black text-slate-800">Cài đặt hệ thống Gemba.Pro</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cấu hình thông số cảnh báo thời gian quá hạn Target (mặc định 2 ngày), tần suất đồng bộ D1 và quy trình duyệt tự động.
              </p>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="p-8 max-w-xl mx-auto space-y-4">
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-base font-black text-slate-900">Thông tin tài khoản</h3>
                <div className="text-xs space-y-2 font-medium text-slate-600">
                  <div><strong>Mã NV:</strong> {currentUser?.empCode}</div>
                  <div><strong>Họ tên:</strong> {currentUser?.name}</div>
                  <div><strong>Chức danh:</strong> {currentUser?.title}</div>
                  <div><strong>Phòng ban:</strong> {currentUser?.department}</div>
                  <div><strong>Email:</strong> {currentUser?.email}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
