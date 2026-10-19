"use client";

// Khung ứng dụng DEMO "Kế hoạch chuẩn bị & Trung tâm phân phối".
// embedded: hiển thị trong /work?dept=logistics · standalone: /work?dept=logistics&demo=1 (link chia sẻ, không cần đăng nhập).

import React from "react";
import Link from "next/link";
import { IconCalendarTime, IconLock, IconPlayerPlay, IconRefresh, IconUserCircle } from "@tabler/icons-react";
import { ACCESS, DEMO_BASE_DATE, ROLES, SCREENS } from "./config";
import { addDays, fmtDMY, isoWeek, weekdayName } from "./dates";
import { projectWeek } from "./engine";
import { DigitalScreen, KpiScreen, RaciScreen } from "./screens/AdminScreens";
import { PlanningScreen, PurchasingScreen } from "./screens/PlanningPurchasing";
import ProgressScreen from "./screens/ProgressScreen";
import { ProductionScreen, QualityScreen, WarehouseScreen } from "./screens/WarehouseQuality";
import { DemoProvider, useDemo } from "./store";
import { TOUR_STEPS, TourPanel } from "./tour";
import type { ScreenKey } from "./types";
import { LockedPanel, cx } from "./ui";

const OWNER: Record<ScreenKey, string> = {
  progress: "mọi bộ phận",
  kh: "Kế hoạch & CCƯ",
  mh: "Mua hàng",
  kho: "Kho / TTPP",
  kdcnqc: "Kinh doanh, Công nghệ, QC",
  sx: "Sản xuất",
  sh: "Số hóa & Dữ liệu",
  kpi: "mọi bộ phận",
  raci: "mọi bộ phận",
};

function ScreenBody({ screen }: { screen: ScreenKey }) {
  switch (screen) {
    case "progress":
      return <ProgressScreen />;
    case "kh":
      return <PlanningScreen />;
    case "mh":
      return <PurchasingScreen />;
    case "kho":
      return <WarehouseScreen />;
    case "kdcnqc":
      return <QualityScreen />;
    case "sx":
      return <ProductionScreen />;
    case "sh":
      return <DigitalScreen />;
    case "kpi":
      return <KpiScreen />;
    case "raci":
      return <RaciScreen />;
  }
}

function Shell({ standalone }: { standalone: boolean }) {
  const { state, access, setRole, setScreen, setDate, reset, toasts, tourStep, setTourStep } = useDemo();
  const screenMeta = SCREENS.find((s) => s.key === state.screen)!;
  const locked = access(state.screen) === "lock";
  const week = projectWeek(state.today);

  return (
    <div className={cx("pb-28 text-slate-900 md:pb-0", standalone && "min-h-screen bg-[#f8faf9]")}>
      {standalone ? (
        <div className="bg-[#006838] px-4 py-2 text-center text-[11px] font-bold text-white">
          BẢN DEMO – toàn bộ dữ liệu là giả lập, chỉ lưu trên trình duyệt này. Không phải số liệu vận hành thật.
        </div>
      ) : null}

      <div className={cx("mx-auto w-full space-y-4", standalone ? "max-w-[1440px] px-4 py-5 sm:px-6" : "")}>
        <header className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#006838]">
                  Demo trình Ban điều hành
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Phiên bản điều chỉnh 14/10/2026 · 18 tuần</span>
              </div>
              <h1 className="mt-1 text-lg font-black tracking-tight text-slate-900 sm:text-xl">Kế hoạch chuẩn bị & Trung tâm phân phối</h1>
              <p className="text-xs text-slate-500">Số hóa quản lý vật tư và cung ứng: nhập tại nguồn, điều hành qua tiến độ chung và cảnh báo tự động.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (tourStep !== null) return setTourStep(null);
                  // Kịch bản cần dữ liệu gốc ngày 15/10; nếu đã thao tác hoặc tua thời gian thì khôi phục trước
                  const dirty = state.today !== DEMO_BASE_DATE || state.log.length > 1;
                  if (dirty) {
                    if (!window.confirm("Kịch bản demo chạy trên dữ liệu gốc ngày 15/10/2026. Khôi phục dữ liệu rồi bắt đầu?")) return;
                    reset();
                  }
                  setTourStep(0);
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#006838] px-3.5 text-xs font-bold text-white hover:bg-[#00522c]"
              >
                <IconPlayerPlay size={16} /> {tourStep === null ? `Chạy kịch bản demo (${TOUR_STEPS.length} bước)` : "Dừng kịch bản"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Khôi phục toàn bộ dữ liệu demo về ngày 15/10/2026?")) reset();
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <IconRefresh size={16} /> Reset demo
              </button>
              {standalone ? (
                <Link href="/login" className="inline-flex min-h-[40px] items-center rounded-xl px-3 text-xs font-bold text-slate-600 hover:bg-slate-100">
                  Đăng nhập hệ thống
                </Link>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <IconCalendarTime size={18} className="text-[#006838]" aria-hidden />
              <div className="text-xs">
                <span className="font-semibold text-slate-500">Hôm nay (giả lập): </span>
                <span className="font-black text-slate-900">
                  {weekdayName(state.today)} {fmtDMY(state.today)}
                </span>
                <span className="font-semibold text-slate-500">
                  {" "}
                  · Tuần {isoWeek(state.today)} · T{Math.max(1, week)} dự án
                </span>
              </div>
              <div className="flex gap-1" role="group" aria-label="Tua thời gian">
                {[1, 3, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDate(addDays(state.today, n))}
                    className="min-h-[34px] rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    +{n} ngày
                  </button>
                ))}
              </div>
              {state.today !== DEMO_BASE_DATE ? <span className="text-[11px] text-slate-500">(Reset để về 15/10)</span> : null}
            </div>

            <label className="flex items-center gap-2 text-xs">
              <IconUserCircle size={18} className="text-[#006838]" aria-hidden />
              <span className="font-semibold text-slate-500">Xem với vai:</span>
              <select
                value={state.role}
                onChange={(e) => setRole(e.target.value as typeof state.role)}
                className="min-h-[38px] rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-900"
              >
                {ROLES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                    {r.note ? " (cần xác nhận)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <nav className="-mx-1 overflow-x-auto px-1" aria-label="Màn hình">
          <div className="flex min-w-max gap-1.5" role="tablist">
            {SCREENS.map((s) => {
              const a = ACCESS[s.key][state.role];
              const active = state.screen === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScreen(s.key)}
                  className={cx(
                    "inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition-colors",
                    active ? "border-[#006838] bg-[#006838] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    a === "lock" && !active && "text-slate-400",
                  )}
                >
                  {a === "lock" ? <IconLock size={13} aria-label="Đã khóa" /> : null}
                  {s.short}
                  {a === "edit" && s.key !== "progress" ? (
                    <span className={cx("rounded px-1 text-[9px] font-black", active ? "bg-white/20" : "bg-emerald-50 text-[#006838]")}>SỬA</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        <main>{locked ? <LockedPanel screenName={screenMeta.name} ownerName={OWNER[state.screen]} /> : <ScreenBody screen={state.screen} />}</main>
      </div>

      <div className="pointer-events-none fixed right-3 top-3 z-[90] flex w-[min(380px,calc(100vw-24px))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "pointer-events-auto rounded-2xl border px-4 py-3 text-xs font-bold shadow-2xl",
              t.ok ? "border-emerald-700 bg-emerald-900 text-white" : "border-rose-300 bg-rose-50 text-rose-900",
            )}
          >
            {t.text}
          </div>
        ))}
      </div>

      <TourPanel />
    </div>
  );
}

export default function LogisticsDemoApp({ standalone = false }: { standalone?: boolean }) {
  return (
    <DemoProvider>
      <Shell standalone={standalone} />
    </DemoProvider>
  );
}
