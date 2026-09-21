"use client";

import React, { useState, useEffect } from "react";
import StrategicManagementDashboard from "@/components/home/StrategicManagementDashboard";
import AccessGateModal from "@/components/auth/AccessGateModal";
import Forbidden403 from "@/components/common/Forbidden403";

export default function Strategic152Page() {
  const [userPayload, setUserPayload] = useState<{
    managementLevel?: number;
    roles?: string[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [isGateVerified, setIsGateVerified] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUserPayload(data.user);
          // Check if user is Executive Vice President / CEO
          const isExec = data.user.managementLevel && data.user.managementLevel <= 2;
          if (isExec) {
            // Check if temporary gate session exists in localStorage
            const savedUntil = localStorage.getItem("gate_152_verified_until");
            if (savedUntil && new Date(savedUntil) > new Date()) {
              setIsGateVerified(true);
            } else {
              setShowGateModal(true);
            }
          }
        }
      } catch {
        console.error("Auth me check failed");
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-slate-500 font-bold text-xs">
        Đang kiểm tra quyền truy cập Phân hệ Quản trị 1-5-2...
      </div>
    );
  }

  // 1. Permission Gate Check (Only managementLevel <= 2 allowed)
  const isExecutive = userPayload?.managementLevel && userPayload.managementLevel <= 2;
  if (!isExecutive) {
    return (
      <Forbidden403
        title="403 — Phân Hệ Quản Trị 1-5-2 Dành Riêng Cho Ban Quản Trị"
        description="Phân hệ 1-5-2 được bảo mật nghiêm ngặt và chỉ dành riêng cho Phó Tổng Giám Đốc trở lên. Tài khoản của bạn không thuộc danh sách phân quyền."
        requiredPermission="MANAGEMENT_152_ACCESS (DEPUTY_GENERAL_DIRECTOR)"
      />
    );
  }

  return (
    <div className="relative">
      <AccessGateModal
        isOpen={showGateModal}
        onClose={() => setShowGateModal(false)}
        onSuccess={(token, verifiedUntil) => {
          setIsGateVerified(true);
          localStorage.setItem("gate_152_verified_until", verifiedUntil);
        }}
      />

      {isGateVerified ? (
        <StrategicManagementDashboard />
      ) : (
        <div className="p-12 text-center space-y-4 max-w-lg mx-auto my-12 bg-white rounded-3xl border border-amber-300 shadow-xl">
          <h3 className="text-xl font-black text-slate-900">Yêu Cầu Xác Thực Mã PIN Access Gate 1-5-2</h3>
          <p className="text-xs text-slate-500 font-medium">
            Vui lòng mở Access Gate và nhập Mã PIN xác thực để truy cập Dashboard Quản trị 1-5-2.
          </p>
          <button
            type="button"
            onClick={() => setShowGateModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition-all cursor-pointer border border-amber-300"
          >
            Mở Access Gate Xác Thực
          </button>
        </div>
      )}
    </div>
  );
}
