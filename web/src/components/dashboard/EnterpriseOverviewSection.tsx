"use client";

import React, { useState, useEffect } from "react";
import {
  IconPackage,
  IconBulb,
  IconAlertTriangle,
  IconLayoutGrid,
  IconSettings,
} from "@tabler/icons-react";
import KpiCard from "./KpiCard";
import DonutChartCard from "./DonutChartCard";

interface EnterpriseStatsData {
  module: string;
  kpis: {
    pph: { title: string; value: number; subtitle: string; changePercent?: number | null };
    kaizen: { title: string; value: number; subtitle: string; changePercent?: number | null };
    mmtb: { title: string; value: number; subtitle: string; changePercent?: number | null };
    layout: { title: string; value: number; subtitle: string; changePercent?: number | null };
  };
  donut: {
    title: string;
    centerLabel: string;
    centerTotal: number;
    centerSubtitle: string;
    breakdown: Array<{ key: string; label: string; value: number; percent: number; color?: string }>;
  };
}

interface EnterpriseOverviewSectionProps {
  region?: string;
  month?: string;
}

export default function EnterpriseOverviewSection({ region, month }: EnterpriseOverviewSectionProps) {
  const [data, setData] = useState<EnterpriseStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        const params = new URLSearchParams();
        if (region) params.set("region", region);
        if (month) params.set("month", month);
        const queryStr = params.toString() ? `?${params.toString()}` : "";

        const res = await fetch(`/api/stats/overview${queryStr}`, {
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json = await res.json();
        if (json.success) {
          const payload = json.data || json;
          if (isMounted) {
            setData(payload);
            setError(null);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load stats");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStats();
    // 15s live polling as specified in requirement
    const interval = setInterval(fetchStats, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [region, month]);

  const kpis = data?.kpis;
  const donut = data?.donut;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
      {/* 4 KPI Cards stacked vertically on the left (col-span-12 lg:col-span-4) */}
      <div className="lg:col-span-4 flex flex-col justify-between gap-3.5">
        {/* KPI 1: Sản Lượng PPH Nhà Máy */}
        <KpiCard
          icon={IconPackage}
          title={kpis?.pph?.title || "Sản Lượng PPH Nhà Máy"}
          value={kpis?.pph?.value ?? 111952}
          subtitle={kpis?.pph?.subtitle || "Sản lượng tháng này"}
          changePercent={kpis?.pph?.changePercent ?? undefined}
          loading={loading}
        />

        {/* KPI 2: Tổng Cải Tiến */}
        <KpiCard
          icon={IconBulb}
          title={kpis?.kaizen?.title || "Tổng Cải Tiến"}
          value={kpis?.kaizen?.value ?? 27}
          subtitle={kpis?.kaizen?.subtitle || "Đề xuất Kaizen/CI tháng này"}
          changePercent={kpis?.kaizen?.changePercent ?? -18.2}
          loading={loading}
        />

        {/* KPI 3: Sự Cố MMTB */}
        <KpiCard
          icon={IconAlertTriangle}
          title={kpis?.mmtb?.title || "Sự Cố MMTB"}
          value={kpis?.mmtb?.value ?? 1115}
          subtitle={kpis?.mmtb?.subtitle || "Sự cố mới tháng này"}
          changePercent={kpis?.mmtb?.changePercent ?? undefined}
          invertTrend={true}
          loading={loading}
        />

        {/* KPI 4: Kiểm Soát Layout CBC */}
        <KpiCard
          icon={IconLayoutGrid}
          title={kpis?.layout?.title || "Kiểm Soát Layout CBC"}
          value={kpis?.layout?.value ?? 23}
          subtitle={kpis?.layout?.subtitle || "Chuyển không đạt chuẩn..."}
          changePercent={kpis?.layout?.changePercent ?? 228.6}
          invertTrend={true}
          loading={loading}
        />
      </div>

      {/* Large Donut Chart Card on the right (col-span-12 lg:col-span-8) */}
      <div className="lg:col-span-8 h-full">
        <DonutChartCard
          title={donut?.title || "TỔNG CẢI TIẾN"}
          icon={IconSettings}
          centerLabel={donut?.centerLabel || (donut as any)?.centerBrand || "TBS GROUP"}
          centerTotal={donut?.centerTotal ?? 81}
          centerSubtitle={donut?.centerSubtitle || "Tổng Cải Tiến"}
          data={donut?.breakdown || []}
          breakdown={donut?.breakdown || []}
          loading={loading}
          error={error}
          maxLegendRows={12}
        />
      </div>
    </div>
  );
}
