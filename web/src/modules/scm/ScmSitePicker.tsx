"use client";

// Màn đầu tiên của module: chọn nhà máy (hoặc Tổng quan toàn chuỗi) trước khi vào các màn chi tiết.
// Mỗi thẻ tóm tắt số đơn đang theo dõi, đơn có bước trễ, đơn bị chặn và bộ phận đang nghẽn nhiều nhất.

import React, { useCallback, useEffect, useState } from "react";
import { IconAlertTriangle, IconArrowRight, IconBuildingFactory2, IconCircleCheck, IconHierarchy3, IconLock, IconRefresh } from "@tabler/icons-react";
import { SITES } from "./config";
import { scmApi, type ScmMe, type SiteSummary, type SitesResponse } from "./client";

export const siteName = (key: string) => (key === "ALL" ? "Tổng quan toàn chuỗi" : SITES.find((s) => s.key === key)?.name ?? key);

/** Trạng thái thẻ: phân biệt bằng màu, kiểu viền và biểu tượng (không chỉ dựa vào màu) */
function healthOf(s: SiteSummary): { label: string; cls: string; icon: React.ReactNode } {
  if (s.withBlocked > 0) return { label: `${s.withBlocked} đơn bị chặn`, cls: "border-red-300 border-dashed bg-red-50 text-red-800", icon: <IconLock size={14} /> };
  if (s.withLate > 0) return { label: `${s.withLate} đơn có bước trễ`, cls: "border-amber-300 bg-amber-50 text-amber-900", icon: <IconAlertTriangle size={14} /> };
  if (s.tracking > 0) return { label: "Đúng tiến độ", cls: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: <IconCircleCheck size={14} /> };
  return { label: "Chưa có đơn", cls: "border-slate-200 bg-slate-50 text-slate-500", icon: null };
}

export default function ScmSitePicker({ me, onPick }: { me: ScmMe; onPick: (site: string) => void }) {
  const [data, setData] = useState<SitesResponse | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await scmApi<SitesResponse>("sites"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const last = me.site && me.site !== "ALL" && SITES.some((s) => s.key === me.site) ? me.site : "";

  return (
    <div className="space-y-6 pb-8">
      <div className="relative w-full overflow-hidden rounded-3xl border border-emerald-800/20 bg-slate-900 p-6 text-white shadow-lg sm:p-8">
        <img src="/images/tbs-factory-plant.png" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#006838]/90 via-[#004d29]/80 to-slate-950/85" />
        <div className="relative z-10 space-y-3">
          <span className="inline-block rounded-lg border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-200">
            Kế hoạch chuẩn bị và trung tâm phân phối
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Chọn nhà máy để bắt đầu</h1>
          <p className="max-w-2xl text-xs font-medium leading-relaxed text-emerald-50/90 sm:text-sm">
            Mọi màn bên trong (Tiến độ, Kế hoạch, Mua hàng, Kho) chỉ hiện dữ liệu của nhà máy đã chọn. Có thể đổi nhà máy bất cứ lúc nào.
          </p>
          {last ? (
            <button
              type="button"
              onClick={() => onPick(last)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#006838] transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              Tiếp tục với {siteName(last)} <IconArrowRight size={15} />
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-bold text-red-800">Không tải được số liệu nhà máy</p>
          <p className="text-xs text-red-700">{error}</p>
          <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-xl bg-[#006838] px-4 py-2 text-xs font-bold text-white hover:bg-[#00522c]">
            <IconRefresh size={14} /> Thử lại
          </button>
        </div>
      ) : null}

      {/* Tổng quan toàn chuỗi */}
      <button
        type="button"
        onClick={() => onPick("ALL")}
        className="flex w-full flex-col gap-4 rounded-2xl border-2 border-[#006838]/30 bg-white p-5 text-left shadow-sm transition hover:border-[#006838] hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-emerald-50 p-3 text-[#006838]"><IconHierarchy3 size={24} /></span>
          <div>
            <p className="text-base font-black text-slate-900">Tổng quan toàn chuỗi</p>
            <p className="text-xs text-slate-500">So sánh tất cả nhà máy, tìm nơi đang nghẽn</p>
          </div>
        </div>
        {data ? (
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[340px]">
            <Stat label="Đang theo dõi" value={data.all.tracking} />
            <Stat label="Có bước trễ" value={data.all.withLate} tone={data.all.withLate ? "amber" : undefined} />
            <Stat label="Bị chặn" value={data.all.withBlocked} tone={data.all.withBlocked ? "red" : undefined} />
          </div>
        ) : (
          <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100 sm:w-[340px]" />
        )}
      </button>

      {/* Các nhà máy */}
      <section className="space-y-3" aria-label="Các nhà máy">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
          <IconBuildingFactory2 size={18} className="text-[#006838]" /> Nhà máy
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SITES.map((s) => {
            const sum = data?.sites.find((x) => x.key === s.key) ?? null;
            const health = sum ? healthOf(sum) : null;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onPick(s.key)}
                aria-label={`Chọn ${s.name}`}
                className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#006838] hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                  s.key === last ? "border-[#006838]" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400">{s.key}</p>
                    <p className="text-sm font-black leading-snug text-slate-900">{s.name}</p>
                  </div>
                  {s.key === last ? <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#006838]">Lần trước</span> : null}
                </div>
                {sum && health ? (
                  <>
                    <p className="text-2xl font-black tabular-nums text-slate-900">
                      {sum.tracking} <span className="text-xs font-semibold text-slate-500">đơn đang theo dõi</span>
                    </p>
                    <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${health.cls}`}>
                      {health.icon} {health.label}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {sum.bottleneck ? (
                        <>Nghẽn nhiều nhất: <b className="text-slate-700">{sum.bottleneck.name}</b> ({sum.bottleneck.count})</>
                      ) : sum.complete ? (
                        `${sum.complete} đơn đã hoàn thành`
                      ) : (
                        "Không có điểm nghẽn"
                      )}
                    </p>
                  </>
                ) : (
                  <div className="space-y-2" aria-hidden="true">
                    <div className="h-7 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "amber" | "red" }) {
  const cls = tone === "red" ? "text-red-700" : tone === "amber" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-1.5">
      <p className={`text-xl font-black tabular-nums ${cls}`}>{value}</p>
      <p className="text-[10px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}
