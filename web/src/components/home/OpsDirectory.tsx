"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Lightbox from "@/components/Lightbox";
import {
  IconBuildingSkyscraper,
  IconApps,
  IconPlaneDeparture,
  IconCalendarEvent,
  IconLoader2,
  IconLayoutGrid,
  IconBolt,
  IconArrowUpRight,
} from "@tabler/icons-react";

interface OpsApp {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  href: string | null;
  is_featured: number;
  department_name?: string;
}

interface OpsDepartment {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  apps: OpsApp[];
}

const ICONS: Record<string, typeof IconApps> = {
  plane: IconPlaneDeparture,
  calendar: IconCalendarEvent,
  app: IconApps,
};

function AppIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const Icon = ICONS[icon] || IconApps;
  return <Icon size={size} />;
}

export default function OpsDirectory() {
  const [departments, setDepartments] = useState<OpsDepartment[]>([]);
  const [featuredApps, setFeaturedApps] = useState<OpsApp[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ops-departments")
      .then((res) => res.json())
      .then((data) => {
        const items: OpsDepartment[] = data.items || [];
        setDepartments(items);
        setFeaturedApps(data.featuredApps || []);
        if (items.length > 0) setSelectedId(items[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = departments.find((d) => d.id === selectedId) || null;

  if (loading) {
    return (
      <section className="py-20 flex items-center justify-center text-slate-400">
        <IconLoader2 size={22} className="animate-spin" />
      </section>
    );
  }

  if (departments.length === 0) return null;

  return (
    <section id="ops-directory" className="py-20 lg:py-28 bg-emerald-50/40 border-y border-emerald-100">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest text-[#006838]">
            — Khối Vận Hành Nội Bộ —
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight text-display">
            Phòng ban &amp; <span className="text-[#006838]">công cụ điều hành</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Truy cập nhanh, nhìn rõ cấu trúc phòng ban — nơi quản lý đầu mối toàn bộ ứng dụng vận hành của VPTX.
          </p>
        </div>

        {/* Ứng dụng thường dùng */}
        {featuredApps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <IconBolt size={16} className="text-amber-500" /> Ứng dụng thường dùng
              </h3>
              <span className="text-[11px] text-slate-400">Lối tắt đến các công cụ được sử dụng nhiều nhất</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredApps.map((app) => {
                const inner = (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-[#006838] text-white flex items-center justify-center mb-3 shadow-sm">
                      <AppIcon icon={app.icon} size={19} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{app.name}</h4>
                    {app.department_name && (
                      <span className="inline-block mt-2.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-bold uppercase tracking-wide text-[#006838]">
                        {app.department_name}
                      </span>
                    )}
                  </>
                );
                const cardClass =
                  "group relative p-4 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#006838]/40";
                return app.href ? (
                  <Link key={app.id} href={app.href} className={cardClass}>
                    {inner}
                  </Link>
                ) : (
                  <div key={app.id} className={cardClass}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-[3px] text-slate-400">
            Toàn bộ ứng dụng theo phòng ban
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar danh sách phòng ban — to hơn */}
          <div className="bg-[#08221a] rounded-3xl p-3 space-y-1.5 h-fit">
            <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#4ade9a]/70">
              Danh sách phòng ban
            </div>
            {departments.map((dept) => {
              const isActive = dept.id === selectedId;
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedId(dept.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl text-left transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-[#006838] to-[#0f9b74] text-white shadow-lg"
                      : "text-white/70 hover:bg-white/5 hover:text-white hover:-translate-x-0 hover:translate-y-[-2px]"
                  }`}
                >
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isActive ? "bg-white/15" : "bg-white/10"
                    }`}
                  >
                    <IconBuildingSkyscraper size={19} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold truncate">{dept.name}</span>
                    <span className={`block text-[11px] ${isActive ? "text-white/75" : "text-white/40"}`}>
                      {dept.apps.length} ứng dụng
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Panel chi tiết phòng ban đang chọn */}
          {selected && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => selected.image_url && setLightboxSrc(selected.image_url)}
                className="relative w-full text-left block group/banner overflow-hidden"
              >
                {selected.image_url && (
                  <img
                    src={encodeURI(selected.image_url)}
                    alt={selected.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="relative bg-gradient-to-br from-[#08221a]/95 via-[#0d2419]/90 to-[#0b3226]/85 p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#4ade9a] mb-1">
                        Phòng ban
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{selected.name}</h3>
                      {selected.description && (
                        <p className="text-xs sm:text-sm text-gray-200 mt-2 max-w-xl leading-relaxed">
                          {selected.description}
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/30 text-white text-[11px] font-bold backdrop-blur-sm">
                      <IconLayoutGrid size={13} />
                      {selected.apps.length} ứng dụng
                    </span>
                  </div>
                  {selected.image_url && (
                    <span className="absolute bottom-3 right-4 text-[10px] text-white/50 font-semibold opacity-0 group-hover/banner:opacity-100 transition-opacity">
                      Click để xem ảnh lớn
                    </span>
                  )}
                </div>
              </button>

              <div className="p-5 sm:p-7">
                {selected.apps.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    Phòng ban này chưa có ứng dụng nào. Quản trị viên có thể thêm qua trang Admin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selected.apps.map((app) => {
                      const CardInner = (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center mb-3 border border-emerald-200 group-hover:bg-[#006838] group-hover:text-white transition-colors">
                              <AppIcon icon={app.icon} size={20} />
                            </div>
                            {app.href && (
                              <IconArrowUpRight size={15} className="text-slate-300 group-hover:text-[#006838] transition-colors" />
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#006838] transition-colors">
                            {app.name}
                          </h4>
                          {app.description && (
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{app.description}</p>
                          )}
                        </>
                      );

                      const cardClass =
                        "group p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#006838]/40 hover:shadow-xl hover:-translate-y-1.5 hover:bg-white transition-all duration-200";

                      return app.href ? (
                        <Link key={app.id} href={app.href} className={cardClass}>
                          {CardInner}
                        </Link>
                      ) : (
                        <div key={app.id} className={`${cardClass} opacity-80 cursor-default`}>
                          {CardInner}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Lightbox src={lightboxSrc} alt={selected?.name} onClose={() => setLightboxSrc(null)} />
    </section>
  );
}
