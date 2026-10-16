"use client";

// Module "Kế hoạch chuẩn bị và trung tâm phân phối": điều hướng giữa Tổng quan và các màn chi tiết,
// trạng thái màn hình đồng bộ lên URL (?dept=logistics&scm=...), site đang chọn lưu theo người dùng.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconArrowLeft,
  IconBuildingWarehouse,
  IconChartBar,
  IconClipboardList,
  IconCloudUpload,
  IconDatabaseCog,
  IconFileCheck,
  IconFlask,
  IconLayoutKanban,
  IconLock,
  IconReportAnalytics,
  IconRoute,
  IconShieldCheck,
  IconShoppingCart,
  IconTimeline,
  IconTruckDelivery,
  IconX,
  type TablerIcon,
} from "@tabler/icons-react";
import { HubFeatureCard, HubQuickCard, HubSectionHeader, SitePills } from "@/components/hub/Hub";
import { PROJECT_START, PROJECT_WEEKS, SITES } from "./config";
import { diffDays } from "./engine";
import type { ScreenKey } from "./permissions";
import { SCREENS } from "./permissions";
import { ScmApiError, scmApi, type ScmMe } from "./client";
import ScmProgress from "./ScmProgress";

export type Notify = (kind: "ok" | "err", text: string) => void;

const SLUG: Record<ScreenKey, string> = {
  progress: "tien-do",
  planning: "ke-hoach",
  purchasing: "mua-hang",
  warehouse: "kho",
  kdcnqc: "kd-cn-qc",
  digital: "so-hoa",
  kpi: "kpi",
  permissions: "phan-quyen",
};
const SCREEN_BY_SLUG = Object.fromEntries(Object.entries(SLUG).map(([k, v]) => [v, k])) as Record<string, ScreenKey>;
/** Màn hình triển khai ở bước nào của kế hoạch */
const PHASE_OF: Record<ScreenKey, number> = { progress: 1, planning: 2, purchasing: 2, warehouse: 3, kdcnqc: 3, digital: 4, kpi: 4, permissions: 4 };

function readUrl(): { screen: ScreenKey | null; anchor: string } {
  if (typeof window === "undefined") return { screen: null, anchor: "" };
  const p = new URLSearchParams(window.location.search);
  return { screen: SCREEN_BY_SLUG[p.get("scm") || ""] ?? null, anchor: window.location.hash.slice(1) };
}

function isoWeek(d: string): number {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y.getTime()) / 86400000 + 1) / 7);
}

export default function ScmModule() {
  const [me, setMe] = useState<ScmMe | null>(null);
  const [error, setError] = useState<{ status: number; text: string } | null>(null);
  const [site, setSite] = useState("ALL");
  const [screen, setScreen] = useState<ScreenKey | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const notify: Notify = useCallback((kind, text) => {
    setToast({ kind, text });
    if (kind === "ok") window.setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 3500);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await scmApi<ScmMe>("me");
      setMe(r);
      setSite(r.site || "ALL");
    } catch (e) {
      setError({ status: e instanceof ScmApiError ? e.status : 0, text: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    setScreen(readUrl().screen);
    load();
    const onPop = () => setScreen(readUrl().screen);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [load]);

  const go = useCallback((next: ScreenKey | null, anchor = "") => {
    const url = new URL(window.location.href);
    url.searchParams.set("dept", "logistics");
    if (next) url.searchParams.set("scm", SLUG[next]);
    else url.searchParams.delete("scm");
    url.hash = anchor;
    window.history.pushState({}, "", url.toString());
    setScreen(next);
    window.setTimeout(() => {
      const el = anchor ? document.getElementById(anchor) : null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0 });
    }, 50);
  }, []);

  const changeSite = useCallback((key: string) => {
    setSite(key);
    scmApi("me/site", { method: "PUT", body: { site: key } }).catch(() => notify("err", "Không lưu được site đang chọn"));
  }, [notify]);

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <IconLock size={28} className="mx-auto text-slate-400" />
        <p className="text-sm font-bold text-slate-800">{error.status === 401 ? "Phiên đăng nhập đã hết hạn" : error.status === 403 ? "Bạn chưa có quyền xem module này" : "Không tải được module"}</p>
        <p className="text-xs text-slate-500">{error.text}</p>
        {error.status === 401 ? (
          <a href="/login" className="inline-flex rounded-xl bg-[#006838] px-4 py-2 text-xs font-bold text-white hover:bg-[#00522c]">Đăng nhập lại</a>
        ) : (
          <button type="button" onClick={load} className="rounded-xl bg-[#006838] px-4 py-2 text-xs font-bold text-white hover:bg-[#00522c]">Thử lại</button>
        )}
      </div>
    );
  }

  if (!me) return <OverviewSkeleton />;

  const access = me.access[screen ?? "progress"];
  return (
    <div className="font-sans text-slate-900">
      {screen === null ? (
        <ScmOverview me={me} site={site} onSite={changeSite} onOpen={go} />
      ) : access === "lock" ? (
        <Pending title={SCREENS.find((s) => s.key === screen)?.name ?? ""} onBack={() => go(null)} locked />
      ) : screen === "progress" ? (
        <ScmProgress me={me} site={site} onBack={() => go(null)} notify={notify} />
      ) : (
        <Pending title={SCREENS.find((s) => s.key === screen)?.name ?? ""} phase={PHASE_OF[screen]} warehouse={screen === "warehouse"} onBack={() => go(null)} />
      )}
      {toast ? (
        <div role="status" aria-live="polite" className={`fixed bottom-20 sm:bottom-4 left-1/2 z-[80] -translate-x-1/2 max-w-[92vw] rounded-xl px-4 py-3 text-sm font-semibold shadow-lg flex items-start gap-3 ${toast.kind === "ok" ? "bg-[#006838] text-white" : "bg-red-600 text-white"}`}>
          <span>{toast.text}</span>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>
            <IconX size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ─── Tổng quan module ────────────────────────────────────────────────────────

const GROUPS: { title: string; desc: string; icon: TablerIcon; cards: { screen: ScreenKey; icon: TablerIcon; desc: string; items: string[] }[] }[] = [
  {
    title: "ĐIỀU HÀNH CHUNG",
    desc: "Tiến độ toàn bộ đơn hàng và kết quả từng phòng ban",
    icon: IconRoute,
    cards: [
      { screen: "progress", icon: IconTimeline, desc: "Trạng thái 10 bước của mọi đơn, điểm nghẽn và lộ trình triển khai.", items: ["Bảng đơn hàng tìm, lọc, phân trang", "Điểm nghẽn theo bộ phận", "Nhắc cấp 1 & Leo thang", "Gantt 4 pha & mốc M1-M4"] },
      { screen: "kpi", icon: IconChartBar, desc: "Điểm KPI tuần của từng phòng, chạy thử trước khi tính thưởng phạt.", items: ["Chọn kỳ & xem công thức", "Chi tiết chỉ số theo phòng ban", "Phát hành báo cáo KPI tuần", "Kế hoạch cải thiện 4 tuần"] },
    ],
  },
  {
    title: "KẾ HOẠCH & CUNG ỨNG",
    desc: "Phân bổ cuốn chiếu, Kế hoạch 312 và đặt hàng nhà cung cấp",
    icon: IconLayoutKanban,
    cards: [
      { screen: "planning", icon: IconClipboardList, desc: "Kế hoạch phân bổ 4 tuần, ban hành 312 và bàn giao No Silent.", items: ["Phân bổ cuốn chiếu & thêm tuần mới", "Gửi duyệt, phê duyệt, ban hành KH312", "Gửi No Silent", "Chuyển kế hoạch Tầng 2"] },
      { screen: "purchasing", icon: IconShoppingCart, desc: "Kiểm tra điều kiện đặt hàng, phát hành PO và xử lý sự cố NCC.", items: ["Tải form lên & tính hạn chót", "Kích hoạt đặt hàng & phát hành PO", "Gửi kế hoạch nhập 4 tuần cho Kho", "Xử lý sự cố NCC trong 2 tuần"] },
    ],
  },
  {
    title: "KHO & CHẤT LƯỢNG",
    desc: "Tiếp nhận, kiểm tra, cân đối và cấp vật tư đồng bộ",
    icon: IconBuildingWarehouse,
    cards: [
      { screen: "warehouse", icon: IconTruckDelivery, desc: "Tiếp nhận và kiểm tra lô hàng, báo cáo cân đối, cấp vật tư xuống sản xuất.", items: ["Tiếp nhận & kiểm tra 3/7 ngày", "Quét Barcode nhập ô kệ", "Chốt 09:00 & phát hành trước 11:00", "Cấp vật tư đồng bộ trước 2 tuần"] },
      { screen: "kdcnqc", icon: IconFlask, desc: "Bàn giao thông tin đơn hàng, lab test, ký màu và tiêu chuẩn kiểm hàng.", items: ["Bàn giao BOM, Wink, Giày mẫu, Rập, định mức", "Lab test 72 giờ & ký màu 2 ngày", "Ghi kết quả / Test lại", "Gửi tiêu chuẩn kiểm hàng cho Kho"] },
    ],
  },
  {
    title: "SỐ HÓA & QUẢN TRỊ",
    desc: "Lộ trình số hóa, kết nối dữ liệu và phân quyền màn hình",
    icon: IconDatabaseCog,
    cards: [
      { screen: "digital", icon: IconDatabaseCog, desc: "Hạng mục từng pha, mốc nghiệm thu và kết nối SAP, Barcode.", items: ["Cập nhật hạng mục Pha 1 & xác nhận M1", "Đồng bộ & kiểm tra kết nối", "Lộ trình bỏ Excel", "Tiến độ Dashboard Pha 3"] },
      { screen: "permissions", icon: IconShieldCheck, desc: "Ai được xem, ai được sửa từng màn hình; thay đổi có hiệu lực khi Ban điều hành duyệt.", items: ["Ma trận Xem / Sửa / Khóa", "Gửi Ban điều hành duyệt", "Khôi phục mặc định"] },
    ],
  },
];

const QUICK: { title: string; desc: string; screen: ScreenKey; anchor: string; icon: TablerIcon }[] = [
  { title: "Tải form Mua hàng", desc: "Tải form đặt hàng lên hệ thống (xlsx, xls, csv, pdf, docx).", screen: "purchasing", anchor: "tai-form", icon: IconCloudUpload },
  { title: "Ban hành Kế hoạch 312", desc: "Ban hành kế hoạch tuần vào thứ Hai sau khi trưởng bộ phận duyệt.", screen: "planning", anchor: "ke-hoach-312", icon: IconFileCheck },
  { title: "Chốt dữ liệu 09:00", desc: "Chốt, kiểm tra và phát hành báo cáo cân đối trước 11:00.", screen: "warehouse", anchor: "can-doi", icon: IconTimeline },
  { title: "Báo cáo KPI tuần", desc: "Phát hành báo cáo KPI phòng ban vào thứ Sáu.", screen: "kpi", anchor: "phat-hanh", icon: IconReportAnalytics },
];

function ScmOverview({ me, site, onSite, onOpen }: { me: ScmMe; site: string; onSite: (k: string) => void; onOpen: (s: ScreenKey, anchor?: string) => void }) {
  const week = isoWeek(me.today);
  const t = Math.floor(diffDays(me.today, PROJECT_START) / 7) + 1;
  const badgeOf = (screen: ScreenKey) => {
    const meta = SCREENS.find((s) => s.key === screen)!;
    if (screen === "progress" || screen === "kpi") return meta.editor;
    if (screen === "permissions") return me.canApprovePermissions || me.access.permissions === "edit" ? meta.editor : "Chỉ xem";
    return me.access[screen] === "edit" ? meta.editor : "Chỉ xem";
  };
  const visibleGroups = useMemo(
    () => GROUPS.map((g) => ({ ...g, cards: g.cards.filter((c) => me.access[c.screen] !== "lock") })).filter((g) => g.cards.length > 0),
    [me.access],
  );
  const quick = QUICK.filter((q) => me.access[q.screen] !== "lock");

  return (
    <div className="space-y-6 pb-8">
      <div className="relative w-full rounded-3xl overflow-hidden shadow-lg border border-emerald-800/20 bg-slate-900 text-white p-6 sm:p-8">
        <img src="/images/tbs-factory-plant.png" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#006838]/90 via-[#004d29]/80 to-slate-950/85 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-200 bg-white/10 px-3.5 py-1 rounded-lg border border-white/15">
              Kế hoạch chuẩn bị và trung tâm phân phối
            </span>
            <span className="px-3.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-50 text-xs font-black">
              Tuần {week}/{me.today.slice(0, 4)}{t >= 1 && t <= PROJECT_WEEKS ? `, T${t} của lộ trình` : ""}
            </span>
          </div>
          <div className="space-y-1.5 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">Số hóa vật tư & cung ứng</h1>
            <p className="text-xs sm:text-sm text-emerald-50/90 font-medium leading-relaxed">
              Dữ liệu nhập một lần tại nguồn. Mọi bộ phận xem chung tiến độ, chỉ sửa màn hình của mình.
            </p>
          </div>
          <SitePills sites={SITES} value={site} onChange={onSite} />
        </div>
      </div>

      {visibleGroups.map((g) => (
        <section key={g.title} className="space-y-3.5" aria-label={g.title}>
          <HubSectionHeader icon={g.icon} title={g.title} desc={g.desc} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {g.cards.map((c, i) => (
              <HubFeatureCard
                key={c.screen}
                tone={i % 2 === 0 ? "green" : "orange"}
                icon={c.icon}
                title={SCREENS.find((s) => s.key === c.screen)!.name}
                badge={badgeOf(c.screen)}
                desc={c.desc}
                items={c.items}
                onOpen={() => onOpen(c.screen)}
              />
            ))}
          </div>
        </section>
      ))}

      {quick.length ? (
        <section className="space-y-3.5" aria-label="Thao tác nhanh">
          <HubSectionHeader icon={IconTimeline} title="THAO TÁC NHANH" desc="Việc định kỳ trong tuần, mở thẳng tới khối chức năng" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quick.map((q) => (
              <HubQuickCard key={q.title} icon={q.icon} title={q.title} desc={q.desc} onOpen={() => onOpen(q.screen, q.anchor)} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Đang tải">
      <div className="h-48 rounded-3xl bg-slate-200" />
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3.5">
          <div className="h-8 w-64 rounded-lg bg-slate-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-56 rounded-2xl bg-slate-100" />
            <div className="h-56 rounded-2xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Pending({ title, phase, warehouse, locked, onBack }: { title: string; phase?: number; warehouse?: boolean; locked?: boolean; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#006838]">
        <IconArrowLeft size={16} /> Tổng quan
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        {locked ? <IconLock size={28} className="mx-auto text-slate-400" /> : <IconTimeline size={28} className="mx-auto text-[#006838]" />}
        <h2 className="text-base font-black">{title}</h2>
        <p className="text-sm text-slate-600">
          {locked ? "Bạn chưa có quyền xem màn hình này. Quyền do Ban điều hành duyệt theo phòng ban." : `Màn hình này được triển khai ở Bước ${phase} của kế hoạch.`}
        </p>
        {warehouse ? (
          <a href="/warehouse" className="inline-flex items-center gap-1.5 rounded-xl bg-[#006838] px-4 py-2 text-xs font-bold text-white hover:bg-[#00522c]">
            <IconBuildingWarehouse size={16} /> Mở Kho · Kiểm hàng & vị trí (đang dùng)
          </a>
        ) : null}
      </div>
    </div>
  );
}
