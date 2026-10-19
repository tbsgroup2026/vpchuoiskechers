"use client";

// Component giao diện dùng chung cho DEMO, theo ngôn ngữ thiết kế của Văn phòng Chuỗi
// (màu chính #006838, nền slate, bo góc 2xl, font kế thừa Be Vietnam Pro).

import React from "react";
import {
  IconAlertTriangle,
  IconBan,
  IconCircleCheck,
  IconCircleDashed,
  IconClockHour4,
  IconEye,
  IconLock,
  IconMinus,
} from "@tabler/icons-react";
import { DEPTS } from "./config";
import type { DeptKey, StepStatus } from "./types";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export const STATUS_META: Record<StepStatus, { label: string; cls: string; cell: string; Icon: typeof IconCircleCheck }> = {
  done: { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-800 border-emerald-200", cell: "bg-emerald-600 text-white", Icon: IconCircleCheck },
  doing: { label: "Đang làm", cls: "bg-sky-50 text-sky-800 border-sky-200", cell: "bg-sky-600 text-white", Icon: IconClockHour4 },
  late: { label: "Trễ hạn", cls: "bg-rose-50 text-rose-800 border-rose-200", cell: "bg-rose-600 text-white", Icon: IconAlertTriangle },
  blocked: { label: "Bị chặn", cls: "bg-amber-50 text-amber-900 border-amber-300", cell: "bg-amber-400 text-amber-950", Icon: IconBan },
  pending: { label: "Chưa tới", cls: "bg-slate-50 text-slate-600 border-slate-200", cell: "bg-slate-200 text-slate-600", Icon: IconCircleDashed },
  na: { label: "Không áp dụng", cls: "bg-white text-slate-400 border-dashed border-slate-300", cell: "bg-white text-slate-300 border border-dashed border-slate-300", Icon: IconMinus },
};

export function StatusPill({ status, suffix }: { status: StepStatus; suffix?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", m.cls)}>
      <m.Icon size={12} aria-hidden />
      {m.label}
      {suffix ? <span className="font-semibold opacity-80">· {suffix}</span> : null}
    </span>
  );
}

export function DeptChip({ dept, className }: { dept: DeptKey; className?: string }) {
  const d = DEPTS[dept];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", d.chip, className)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", d.dot)} aria-hidden />
      {d.name}
    </span>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cx("rounded-2xl border border-slate-200/90 bg-white shadow-2xs", className)}>{children}</section>;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon ? <div className="mt-0.5 shrink-0 text-[#006838]">{icon}</div> : null}
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {right ? <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div> : null}
    </div>
  );
}

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";

const BTN: Record<BtnVariant, string> = {
  primary: "bg-[#006838] text-white hover:bg-[#00522c] border-[#006838]",
  secondary: "bg-white text-slate-800 hover:bg-slate-50 border-slate-300",
  danger: "bg-white text-rose-700 hover:bg-rose-50 border-rose-300",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent",
};

export function Btn({
  children,
  onClick,
  variant = "secondary",
  disabled,
  readOnly,
  title,
  className,
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  /** Vai hiện tại chỉ được xem màn hình này */
  readOnly?: boolean;
  title?: string;
  className?: string;
  small?: boolean;
}) {
  const off = disabled || readOnly;
  return (
    <button
      type="button"
      onClick={off ? undefined : onClick}
      disabled={off}
      title={readOnly ? "Vai hiện tại chỉ được xem màn hình này" : title}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-xl border font-bold transition-colors",
        small ? "min-h-[36px] px-2.5 text-xs" : "min-h-[40px] px-3.5 text-xs sm:text-[13px]",
        off ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : cx("cursor-pointer", BTN[variant]),
        className,
      )}
    >
      {readOnly ? <IconEye size={14} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneCls = {
    default: "text-slate-900",
    good: "text-emerald-700",
    warn: "text-amber-700",
    bad: "text-rose-700",
  }[tone];
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cx("mt-1 text-2xl font-black tabular-nums", toneCls)}>{value}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "warn" | "bad" }) {
  const pct = Math.max(0, Math.min(100, value));
  const bar = tone === "brand" ? "bg-[#006838]" : tone === "warn" ? "bg-amber-500" : "bg-rose-600";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-all", bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-xs font-medium text-slate-500">{text}</div>;
}

export function ProposalTag({ text = "Đề xuất" }: { text?: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800">
      {text}
    </span>
  );
}

export function ViewOnlyBanner({ ownerName }: { ownerName: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
      <IconEye size={16} className="shrink-0" aria-hidden />
      Chế độ chỉ xem. Chỉ bộ phận {ownerName} được thao tác trên màn hình này.
    </div>
  );
}

export function LockedPanel({ screenName, ownerName }: { screenName: string; ownerName: string }) {
  return (
    <Card className="mx-auto max-w-xl">
      <div className="space-y-3 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
          <IconLock size={24} aria-hidden />
        </div>
        <h3 className="text-base font-black text-slate-900">Màn hình {screenName} đã khóa với vai hiện tại</h3>
        <p className="text-xs leading-relaxed text-slate-500">
          Theo nguyên tắc &quot;thấy tiến độ chung, không thấy chức năng của nhau&quot; (mục 1.2 và 11), chỉ bộ phận {ownerName} và Ban điều hành
          mở được màn hình này. Mọi bộ phận vẫn xem được trạng thái chung trên màn hình Tiến độ chung.
        </p>
      </div>
    </Card>
  );
}

/** Nhãn đếm ngược: "còn 2 ngày" / "đến hạn hôm nay" / "trễ 3 ngày" */
export function DueText({ daysLeft, unit = "ngày", hours }: { daysLeft: number | null; unit?: string; hours?: boolean }) {
  if (daysLeft === null) return <span className="text-slate-400">—</span>;
  if (daysLeft < 0) {
    const n = hours ? -daysLeft * 24 : -daysLeft;
    return <span className="font-bold text-rose-700">Trễ {n} {hours ? "giờ" : unit}</span>;
  }
  if (daysLeft === 0) return <span className="font-bold text-amber-700">Đến hạn hôm nay</span>;
  const n = hours ? daysLeft * 24 : daysLeft;
  return <span className={cx("font-semibold", daysLeft <= 1 ? "text-amber-700" : "text-slate-700")}>Còn {n} {hours ? "giờ" : unit}</span>;
}

export function Table({ children, minWidth = 640 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cx("whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cx("border-b border-slate-100 px-3 py-2.5 align-middle text-slate-700", className)}>{children}</td>;
}
