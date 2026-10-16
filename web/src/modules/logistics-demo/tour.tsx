"use client";

// Tour dẫn dắt: đưa "đơn chính" SO-26-0412 đi qua đủ 10 bước, có một lần QC không đạt và leo thang.
// Mỗi bước tự chuyển vai và màn hình; nút "Thực hiện bước này" chạy đúng thao tác nghiệp vụ như người dùng bấm tay.

import React, { useEffect } from "react";
import { IconChevronLeft, IconChevronRight, IconPlayerPlay, IconX } from "@tabler/icons-react";
import {
  activateOrder,
  agreeIncidentPlan,
  allocateOrder,
  approvePlan,
  confirmIncident,
  confirmProductionReceipt,
  fixDailyData,
  handoverDoc,
  handoverTech,
  issuePlan312,
  lockDailyData,
  publishDailyReport,
  receiveGoods,
  recordLabResult,
  sendInboundPlan,
  sendNoSilent,
  signColor,
  supplyToProduction,
  type ActionResult,
} from "./actions";
import { weekStart } from "./dates";
import { openIncident } from "./engine";
import { HERO_ORDER_CODE, HERO_ORDER_ID } from "./seed";
import { useDemo, type DemoStore } from "./store";
import type { DemoState, RoleKey, ScreenKey } from "./types";

interface TourStep {
  title: string;
  body: string;
  role: RoleKey;
  screen: ScreenKey;
  actionLabel?: string;
  run?: (store: DemoStore) => void;
}

const H = HERO_ORDER_ID;

/** Chạy nhiều thao tác liên tiếp, chỉ báo một thông điệp tổng */
function chain(store: DemoStore, fns: ((s: DemoState) => ActionResult)[], summary: string) {
  for (const fn of fns) store.apply(fn, true);
  store.notify(summary);
}

const noIncident = (s: DemoState): ActionResult => ({ state: s, ok: false, message: "Không tìm thấy sự cố của đơn chính" });

export const TOUR_STEPS: TourStep[] = [
  {
    title: "Màn hình Tiến độ chung",
    body: `Mọi bộ phận cùng xem màn hình này. Đơn ${HERO_ORDER_CODE} (nhãn TOUR) còn 1 ngày đến hạn bàn giao thông tin nên đã có cảnh báo cấp 1. Bước 6 Đặt hàng hiện "Chưa đủ điều kiện: thiếu Wink, No Silent".`,
    role: "BDH",
    screen: "progress",
    actionLabel: "Mở chi tiết đơn",
    run: (s) => s.setFocusOrderId(H),
  },
  {
    title: "Kinh doanh bàn giao Wink",
    body: "Vai Kinh doanh · Công nghệ · QC chỉ mở được màn hình của mình. Bàn giao Wink là đủ 4 thông tin, bước 1 hoàn thành và các bước phía sau được mở khóa.",
    role: "KDCNQC",
    screen: "kdcnqc",
    actionLabel: "Giao Wink",
    run: (s) => s.apply((st) => handoverDoc(st, H, "wink")),
  },
  {
    title: "Công nghệ giao Rập và định mức",
    body: "Bước 2 phải xong trước khi hàng về. Hạn được tính tự động từ ngày về dự kiến.",
    role: "KDCNQC",
    screen: "kdcnqc",
    actionLabel: "Giao Rập & định mức",
    run: (s) => chain(s, [(st) => handoverTech(st, H, "rap"), (st) => handoverTech(st, H, "dinhMuc")], "CN giao đủ Rập & định mức – bước 2 hoàn thành"),
  },
  {
    title: "Kế hoạch phân bổ, phê duyệt và ban hành 312",
    body: "Nhân viên kế hoạch đưa đơn vào phân bổ 4 tuần, trưởng bộ phận phê duyệt, rồi ban hành Kế hoạch 312 cho Mua hàng. Không ban hành được khi chưa phê duyệt.",
    role: "KH",
    screen: "kh",
    actionLabel: "Phân bổ → phê duyệt → ban hành 312",
    run: (s) =>
      chain(
        s,
        [
          (st) => allocateOrder(st, H),
          (st) => (st.planApprovedWeek === weekStart(st.today) ? { state: st, ok: true, message: "" } : approvePlan(st)),
          issuePlan312,
        ],
        "Đã phân bổ, phê duyệt và ban hành Kế hoạch 312",
      ),
  },
  {
    title: "Bàn giao No Silent cho Mua hàng",
    body: "Đơn này có yêu cầu No Silent. Thời hạn bàn giao chưa có trong tài liệu gốc, demo đặt 5 ngày (nhãn Đề xuất, chỉnh được ở màn hình Số hóa).",
    role: "KH",
    screen: "kh",
    actionLabel: "Gửi No Silent",
    run: (s) => s.apply((st) => sendNoSilent(st, H)),
  },
  {
    title: "Mua hàng kích hoạt đặt hàng",
    body: "Công cụ tính hạn chót có sẵn ví dụ của tài liệu (18/12 → 01/10). Đơn đã đủ BOM, Wink, Giày mẫu, No Silent nên được kích hoạt và phát hành PO; ETA tự tính theo lead time NCC.",
    role: "MH",
    screen: "mh",
    actionLabel: "Kích hoạt & phát hành PO",
    run: (s) => s.apply((st) => activateOrder(st, H)),
  },
  {
    title: "Gửi Kho kế hoạch nhập hàng 4 tuần",
    body: "Kế hoạch nhập hàng tổng hợp tự động từ ngày về trên PO, không cần Excel riêng.",
    role: "MH",
    screen: "mh",
    actionLabel: "Gửi kế hoạch nhập hàng",
    run: (s) => s.apply(sendInboundPlan),
  },
  {
    title: "Tua đến 21/10: hàng về, Kho tiếp nhận",
    body: "Hàng nội địa có hạn kiểm 3 ngày. Kho kiểm đạt, quét Barcode nhập ô kệ và chuyển mẫu cho QC.",
    role: "KHO",
    screen: "kho",
    actionLabel: "Tua đến 21/10 và tiếp nhận",
    run: (s) => {
      s.setDate("2026-10-21");
      s.apply((st) => receiveGoods(st, H));
    },
  },
  {
    title: "Tua đến 22/10: QC ký màu, Lab test không đạt",
    body: "Lab test đếm ngược 72 giờ, ký màu 2 ngày. Kết quả không đạt tự lập biên bản và chuyển Mua hàng xử lý tối đa 2 tuần.",
    role: "KDCNQC",
    screen: "kdcnqc",
    actionLabel: "Ký màu và ghi Lab không đạt",
    run: (s) => {
      s.setDate("2026-10-22");
      chain(s, [(st) => signColor(st, H), (st) => recordLabResult(st, H, false)], "QC ký màu; Lab test không đạt – đã lập sự cố cho Mua hàng");
    },
  },
  {
    title: "Điểm nghẽn hiện trên màn hình chung",
    body: "Bước 9 của đơn chuyển sang Bị chặn, thanh Điểm nghẽn ghi rõ đang chờ Mua hàng xử lý hàng không đạt. Màn hình chung không hiện kết quả test chi tiết.",
    role: "BDH",
    screen: "progress",
    actionLabel: "Mở chi tiết đơn",
    run: (s) => s.setFocusOrderId(H),
  },
  {
    title: "Mua hàng thống nhất phương án với NCC",
    body: "NCC xác nhận đổi hàng. Hệ thống ghi ngày hàng thay thế dự kiến về và tiếp tục đếm 2 tuần.",
    role: "MH",
    screen: "mh",
    actionLabel: "Chọn phương án Đổi hàng",
    run: (s) =>
      s.apply((st) => {
        const inc = openIncident(st.incidents, H, "CHAT_LUONG");
        return inc ? agreeIncidentPlan(st, inc.id, "DOI_HANG") : noIncident(st);
      }),
  },
  {
    title: "Tua đến 25/10: QC test lại hàng thay thế",
    body: "Chỉ đóng sự cố khi Kho hoặc QC xác nhận. QC test lại đạt, bước 9 hoàn thành.",
    role: "KDCNQC",
    screen: "kdcnqc",
    actionLabel: "Tua đến 25/10 và xác nhận đạt",
    run: (s) => {
      s.setDate("2026-10-25");
      s.apply((st) => {
        const inc = openIncident(st.incidents, H, "CHAT_LUONG");
        return inc ? confirmIncident(st, inc.id, "KDCNQC") : noIncident(st);
      });
    },
  },
  {
    title: "Kho: báo cáo cân đối 09:00 / 11:00 và cấp đồng bộ",
    body: "Kho chốt dữ liệu 09:00, sửa dòng lỗi trước 10:00, phát hành trước 11:00, rồi lập phiếu xuất đồng bộ cho đơn – trước ngày may 14 ngày.",
    role: "KHO",
    screen: "kho",
    actionLabel: "Chốt, phát hành và cấp vật tư",
    run: (s) =>
      chain(
        s,
        [lockDailyData, fixDailyData, publishDailyReport, (st) => supplyToProduction(st, H)],
        `Báo cáo cân đối phát hành 10:40; đã cấp vật tư đồng bộ cho ${HERO_ORDER_CODE}`,
      ),
  },
  {
    title: "Sản xuất xác nhận nhận đủ",
    body: "Tổ trưởng xác nhận trên hệ thống trong ngày. Phần Sản xuất đang chờ Ban điều hành xác nhận phạm vi.",
    role: "SX",
    screen: "sx",
    actionLabel: "Xác nhận đã nhận",
    run: (s) => s.apply((st) => confirmProductionReceipt(st, H)),
  },
  {
    title: "KPI tự động và tiến độ dự án",
    body: "KPI của NCC, Mua hàng, Kho, Sản xuất và KPI cá nhân tính từ chính các thao tác vừa rồi, chạy thử không tính thưởng phạt. Bấm Reset demo để trình bày lại từ đầu.",
    role: "BDH",
    screen: "kpi",
  },
];

export function TourPanel() {
  const store = useDemo();
  const { tourStep, setTourStep, setRole, setScreen } = store;

  useEffect(() => {
    if (tourStep === null) return;
    const step = TOUR_STEPS[tourStep];
    setRole(step.role);
    setScreen(step.screen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourStep]);

  if (tourStep === null) return null;
  const step = TOUR_STEPS[tourStep];
  const last = tourStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[70] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[400px]" role="dialog" aria-label="Kịch bản demo">
      <div className="rounded-2xl border border-emerald-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#006838]">
            Kịch bản demo · {tourStep + 1}/{TOUR_STEPS.length}
          </span>
          <button type="button" onClick={() => setTourStep(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Thoát kịch bản">
            <IconX size={16} />
          </button>
        </div>
        <div className="space-y-2 px-4 py-3">
          <h4 className="text-sm font-black text-slate-900">{step.title}</h4>
          <p className="text-xs leading-relaxed text-slate-600">{step.body}</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#006838]" style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5">
          <button
            type="button"
            disabled={tourStep === 0}
            onClick={() => setTourStep(tourStep - 1)}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            <IconChevronLeft size={14} /> Quay lại
          </button>
          <div className="flex gap-2">
            {step.run ? (
              <button
                type="button"
                onClick={() => step.run!(store)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#006838] bg-white px-3 text-xs font-bold text-[#006838] hover:bg-emerald-50"
              >
                <IconPlayerPlay size={14} /> {step.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setTourStep(last ? null : tourStep + 1)}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl bg-[#006838] px-3 text-xs font-bold text-white hover:bg-[#00522c]"
            >
              {last ? "Kết thúc" : "Tiếp"} {last ? null : <IconChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
