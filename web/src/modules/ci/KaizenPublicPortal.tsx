"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
  IconBulb,
  IconChevronRight,
  IconCirclePlus,
  IconCheck,
  IconPhoto,
  IconSearch,
  IconX,
  IconAlertTriangle,
  IconCoin,
  IconUser,
  IconBuilding,
  IconCalendar,
  IconMessageCircle,
} from "@tabler/icons-react";
import KaizenPublicSubmitForm from "./KaizenPublicSubmitForm";
import KaizenNotifyButton from "./KaizenNotifyButton";
import KaizenImageLightboxModal, { LightboxImageItem } from "./KaizenImageLightboxModal";
import {
  KAIZEN_STEPS,
  detectLookupType,
  getKaizenReviewComment,
  getKaizenStatusInfo,
  normalizeVnPhone,
} from "@/lib/kaizenPublicHelper";

const BRAND = "#006838";

interface PublicKaizenItem {
  code: string;
  title: string;
  stage?: string;
  trang_thai: string | null;
  review_status: string | null;
  proposer_name: string;
  department: string;
  factory: string;
  category_label: string;
  registration_type: string;
  award_title: string;
  before_description: string;
  after_solution: string;
  before_images: string[];
  after_images: string[];
  total_savings_vnd: number;
  efficiency_value_vnd: number;
  saved_seconds: number;
  nhan_xet_kiem_chung: string;
  rejection_reason: string;
  created_at: string | null;
  ie_confirmed_at: string | null;
  updated_at: string | null;
}

type View = "home" | "lookup" | "detail" | "register";
type LookupType = "msnv" | "phone";

/** D1 lưu 'YYYY-MM-DD HH:MM:SS' theo UTC */
function formatDate(raw?: string | null): string {
  if (!raw) return "—";
  const iso = /Z|[+-]\d\d:?\d\d$/.test(raw) ? raw : raw.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
}

function formatVnd(n: number): string {
  return `${Math.round(n).toLocaleString("vi-VN")} đ`;
}

export default function KaizenPublicPortal() {
  const router = useRouter();
  const params = useSearchParams();

  const view = (params.get("view") as View) || "home";
  const q = params.get("q") || "";
  const qType = (params.get("type") as LookupType) || "";
  const code = params.get("code") || "";

  const [input, setInput] = useState(q);
  const [type, setType] = useState<LookupType>(qType || (q ? detectLookupType(q) : "msnv"));
  const [items, setItems] = useState<PublicKaizenItem[] | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Điều hướng bằng query string để nút Back / "Quay lại danh sách" giữ nguyên kết quả tra cứu
  const go = useCallback(
    (next: Record<string, string | undefined>) => {
      const sp = new URLSearchParams();
      const region = params.get("region");
      if (region) sp.set("region", region);
      Object.entries(next).forEach(([k, v]) => v && sp.set(k, v));
      const qs = sp.toString();
      router.push(`/work/kaizen/register${qs ? `?${qs}` : ""}`);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    },
    [params, router]
  );

  useEffect(() => {
    if (!q) return;
    setInput(q);
    const key = `${qType}|${q}`;
    if (key === loadedKey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams({ q });
    if (qType) sp.set("type", qType);
    fetch(`/api/public/kaizen/lookup?${sp.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          setItems(json.items || []);
          setLoadedKey(key);
        } else {
          setItems(null);
          setError(json.message || "Không tra cứu được, vui lòng thử lại.");
        }
      })
      .catch(() => !cancelled && setError("Lỗi kết nối máy chủ, vui lòng thử lại."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, qType, loadedKey]);

  const submitLookup = (e?: React.FormEvent) => {
    e?.preventDefault();
    const raw = input.trim();
    if (!raw) {
      setError("Vui lòng nhập MSNV hoặc số điện thoại.");
      return;
    }
    let value = raw;
    if (type === "phone") {
      const p = normalizeVnPhone(raw);
      if (!p) {
        setError("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).");
        return;
      }
      value = p;
    } else {
      value = raw.toUpperCase();
    }
    setError(null);
    setLoadedKey("");
    go({ view: "lookup", q: value, type });
  };

  const onInputChange = (v: string) => {
    setInput(v);
    // Tự nhận diện: chuỗi 10 số bắt đầu bằng 0 (hoặc +84) → SĐT
    setType(detectLookupType(v));
  };

  const detailItem = view === "detail" ? items?.find((it) => it.code === code) : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'Be Vietnam Pro', system-ui, sans-serif" }}>
      <Header onHome={() => go({})} />

      <main className="mx-auto w-full max-w-md px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:max-w-3xl sm:px-6 lg:max-w-6xl">
        {/* Mobile: ô nhập ≥16px (iOS không tự phóng to khi chạm), vùng bấm ≥44px, nhãn dễ đọc */}
        <style>{`
          @media (max-width: 639px) {
            .kz-public-form input:not([type=radio]):not([type=checkbox]):not([type=file]),
            .kz-public-form select,
            .kz-public-form textarea { font-size: 16px !important; }
            .kz-public-form input:not([type=radio]):not([type=checkbox]):not([type=file]),
            .kz-public-form select { min-height: 46px; }
            .kz-public-form textarea { min-height: 96px; }
            .kz-public-form label { font-size: 13px !important; line-height: 1.35; }
            .kz-public-form input[type=radio], .kz-public-form input[type=checkbox] { width: 20px; height: 20px; }
            .kz-public-form form { padding: 16px 0 24px !important; }
            .kz-public-form button[type=submit] { min-height: 52px; font-size: 15px !important; }
          }
        `}</style>
        {view === "home" && <HomeView onLookup={() => go({ view: "lookup" })} onRegister={() => go({ view: "register" })} />}

        {view === "lookup" && (
          <section className="pt-4 lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-8">
            {/* Cột trái (desktop: cố định khi cuộn): ô tra cứu + hướng dẫn */}
            <div className="space-y-4 lg:sticky lg:top-20">
            <BackBar label="Tra cứu sáng kiến" onBack={() => go({})} />

            <form onSubmit={submitLookup} className="space-y-3">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1">
                {(["msnv", "phone"] as LookupType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-lg py-2.5 text-sm font-bold transition-colors ${type === t ? "text-white shadow" : "text-slate-600"}`}
                    style={type === t ? { background: BRAND } : undefined}
                  >
                    {t === "msnv" ? "MSNV" : "SĐT"}
                  </button>
                ))}
              </div>
              <div className="relative">
                <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  inputMode={type === "phone" ? "tel" : "text"}
                  placeholder={type === "phone" ? "VD: 0987654321" : "VD: 138341"}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-10 pr-10 text-base font-semibold outline-none focus:border-[#006838] focus:ring-2 focus:ring-[#006838]/20"
                />
                {input && (
                  <button type="button" onClick={() => setInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Xoá">
                    <IconX size={18} />
                  </button>
                )}
              </div>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white shadow-md active:scale-[0.99]" style={{ background: BRAND }}>
                <IconSearch size={18} /> Tra cứu
              </button>
            </form>

            {error && (
              <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
                <IconAlertTriangle size={18} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}

            {!error && (
              <div className={`${q ? "hidden lg:block" : ""} rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-900/80 space-y-1.5`}>
                <p className="font-bold text-emerald-950">Hướng dẫn</p>
                <p>• Nhập MSNV hoặc số điện thoại đã khai báo khi đăng ký sáng kiến.</p>
                <p>• Hệ thống tự nhận diện loại thông tin (SĐT: 10 số, bắt đầu bằng 0).</p>
                <p>• SĐT được chuẩn hoá tự động (bỏ dấu cách, +84 → 0).</p>
              </div>
            )}
            </div>

            {/* Cột phải: kết quả */}
            <div className="mt-5 lg:mt-0">
            {!q && (
              <div className="hidden min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white text-center text-slate-500 lg:flex">
                <IconSearch size={36} className="text-slate-300" />
                <p className="text-sm">Nhập MSNV hoặc số điện thoại để xem sáng kiến của bạn</p>
              </div>
            )}

            {q && loading && <ResultSkeleton />}

            {q && !loading && items && items.length > 0 && (
              <div className="space-y-3">
                {(qType || detectLookupType(q)) === "phone" ? <KaizenNotifyButton phone={q} /> : <KaizenNotifyButton msnv={q} />}
                <p className="text-sm font-semibold text-slate-600">Tìm thấy {items.length} sáng kiến</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {items.map((it) => (
                  <ResultCard key={it.code} item={it} onClick={() => go({ view: "detail", q, type: qType, code: it.code })} />
                ))}
                </div>
              </div>
            )}

            {q && !loading && items && items.length === 0 && (
              <EmptyState onRegister={() => go({ view: "register" })} />
            )}
            </div>
          </section>
        )}

        {view === "detail" && (
          <section className="pt-4">
            <BackBar label="Quay lại danh sách" onBack={() => go({ view: "lookup", q, type: qType })} />
            {loading && <ResultSkeleton />}
            {!loading && detailItem && <DetailView item={detailItem} />}
            {!loading && !detailItem && items && (
              <p className="mt-6 text-center text-sm text-slate-500">Không tìm thấy sáng kiến này.</p>
            )}
          </section>
        )}

        {view === "register" && (
          <section className="pt-4">
            <BackBar label="Đăng ký sáng kiến" onBack={() => go({})} />
            <p className="mb-2 text-sm text-slate-500">Điền thông tin bên dưới — mục có dấu <span className="font-bold text-rose-600">*</span> là bắt buộc.</p>
            <div className="kz-public-form">
              <KaizenPublicSubmitForm
                embedded
                onViewStatus={(emp) => go({ view: "lookup", q: emp.toUpperCase(), type: "msnv" })}
                successExtra={(emp, token, phone) => <KaizenNotifyButton msnv={emp.toUpperCase()} phone={phone} token={token} />}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Header({ onHome }: { onHome: () => void }) {
  return (
    <header
      className="sticky top-0 z-30 overflow-hidden text-white shadow-lg"
      style={{ background: `linear-gradient(110deg, #00381e 0%, ${BRAND} 55%, #0b7a45 100%)` }}
    >
      {/* Vạch chéo lấy cảm hứng từ biểu tượng TBS */}
      <svg aria-hidden="true" className="pointer-events-none absolute -right-6 top-0 h-full w-56 opacity-25 sm:w-72" viewBox="0 0 220 64" preserveAspectRatio="xMaxYMid slice">
        <g fill="#9bc23c" transform="skewX(-14)">
          <rect x="70" y="-6" width="22" height="80" rx="3" />
          <rect x="104" y="6" width="22" height="80" rx="3" />
          <rect x="138" y="-14" width="22" height="80" rx="3" />
          <rect x="172" y="2" width="22" height="80" rx="3" />
        </g>
      </svg>
      <div className="relative mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-2.5 sm:max-w-3xl sm:px-6 sm:py-3 lg:max-w-6xl">
        <button onClick={onHome} className="group flex min-w-0 items-center gap-3" aria-label="Trang chủ Kaizen">
          <img src="/images/tbs-logo.png" alt="TBS Group" className="h-8 w-auto shrink-0 object-contain brightness-0 invert sm:h-10" />
          <span className="h-7 w-px shrink-0 bg-white/30 sm:h-8" />
          <img src="/images/skechers-logo.png" alt="Skechers" className="h-6 w-auto shrink-0 object-contain brightness-0 invert sm:h-8" />
          <span className="ml-1 flex items-center gap-1.5 rounded-full bg-white/15 py-1 pl-1 pr-3 ring-1 ring-white/25 backdrop-blur-sm transition group-hover:bg-white/25">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black" style={{ color: BRAND }}>KZ</span>
            <span className="text-sm font-extrabold tracking-tight">Kaizen</span>
          </span>
        </button>
        <span className="hidden items-center gap-1.5 rounded-full border border-[#9bc23c]/50 bg-[#9bc23c]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-lime-100 sm:inline-flex">
          <IconBulb size={14} /> Cổng sáng kiến
        </span>
      </div>
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #9bc23c, #c9e265 50%, transparent)" }} />
    </header>
  );
}

function BackBar({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button onClick={onBack} className="mb-1 flex items-center gap-2 py-1 text-base font-bold text-slate-800">
      <IconArrowLeft size={20} /> {label}
    </button>
  );
}

function HomeView({ onLookup, onRegister }: { onLookup: () => void; onRegister: () => void }) {
  return (
    <section className="mx-auto space-y-4 pt-5 sm:pt-8 lg:max-w-4xl">
      <div className="rounded-2xl p-5 text-white shadow-md sm:p-8" style={{ background: `linear-gradient(135deg, ${BRAND}, #0b8a4f)` }}>
        <p className="text-xl font-extrabold leading-snug sm:text-3xl">Cùng nhau cải tiến<br />Kiến tạo giá trị bền vững</p>
        <p className="mt-1.5 text-sm text-emerald-50/90">Không cần đăng nhập — gửi ý tưởng và theo dõi kết quả ngay trên điện thoại.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
      <HomeCard
        icon={<IconSearch size={26} />}
        tint="bg-emerald-100 text-emerald-700"
        title="Tra cứu sáng kiến"
        subtitle="Xem tình trạng sáng kiến bằng MSNV hoặc số điện thoại"
        onClick={onLookup}
      />
      <HomeCard
        icon={<IconCirclePlus size={26} />}
        tint="bg-blue-100 text-blue-700"
        title="Đăng ký sáng kiến"
        subtitle="Gửi ý tưởng cải tiến mới"
        onClick={onRegister}
      />
      </div>
      <p className="flex items-center justify-center gap-2 pt-4 text-sm italic text-slate-400">
        <IconBulb size={18} /> Mỗi ý tưởng nhỏ — tạo nên giá trị lớn
      </p>
    </section>
  );
}

function HomeCard({ icon, tint, title, subtitle, onClick }: { icon: React.ReactNode; tint: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left sm:h-full sm:p-6 shadow-sm transition active:scale-[0.99] hover:border-emerald-300">
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tint}`}>{icon}</span>
      <span className="flex-1">
        <span className="block text-lg font-bold text-slate-900">{title}</span>
        <span className="mt-0.5 block text-sm text-slate-500">{subtitle}</span>
      </span>
      <IconChevronRight size={22} className="text-slate-400" />
    </button>
  );
}

function StatusBadge({ item }: { item: PublicKaizenItem }) {
  const s = getKaizenStatusInfo(item.trang_thai, item.review_status, item.stage);
  return <span className={`inline-block max-w-full truncate whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${s.badge}`}>{s.label}</span>;
}

function ResultCard({ item, onClick }: { item: PublicKaizenItem; onClick: () => void }) {
  const thumb = item.after_images[0] || item.before_images[0];
  const comment = getKaizenReviewComment(item);
  return (
    <button onClick={onClick} className="relative flex w-full gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm active:scale-[0.99]">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-24">
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300"><IconPhoto size={30} /></div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-end"><StatusBadge item={item} /></div>
        <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-900">{item.title || "Sáng kiến cải tiến"}</p>
        <p className="mt-0.5 text-xs text-slate-500">{item.code} • {formatDate(item.created_at)}</p>
        {comment && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-600"><span className="font-semibold">Nhận xét:</span> {comment}</p>
        )}
      </div>
    </button>
  );
}

function ResultSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex animate-pulse gap-3 rounded-2xl border border-slate-200 bg-white p-3">
          <div className="h-20 w-20 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2 py-1">
            <div className="ml-auto h-4 w-20 rounded-full bg-slate-200" />
            <div className="h-4 w-4/5 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onRegister }: { onRegister: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 px-2 pt-8 text-center lg:pt-12">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><IconSearch size={36} /></div>
      <p className="text-lg font-bold text-slate-900">Không tìm thấy sáng kiến nào với MSNV/SĐT này</p>
      <p className="text-sm text-slate-500">Có thể bạn chưa có sáng kiến nào hoặc nhập sai thông tin. Hãy thử lại hoặc đăng ký sáng kiến ngay!</p>
      <button onClick={onRegister} className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white shadow-md" style={{ background: BRAND }}>
        <IconCirclePlus size={20} /> Đăng ký sáng kiến ngay
      </button>
    </div>
  );
}

function DetailView({ item }: { item: PublicKaizenItem }) {
  const s = getKaizenStatusInfo(item.trang_thai, item.review_status, item.stage);
  const comment = getKaizenReviewComment(item);
  const [lightbox, setLightbox] = useState<{ images: LightboxImageItem[]; index: number } | null>(null);

  const allImages: LightboxImageItem[] = [
    ...item.before_images.map((url) => ({ url, tag: "BEFORE", title: "Hiện trạng trước cải tiến" })),
    ...item.after_images.map((url) => ({ url, tag: "AFTER", title: "Giải pháp sau cải tiến" })),
  ];
  const openImage = (url: string) => setLightbox({ images: allImages, index: Math.max(0, allImages.findIndex((i) => i.url === url)) });

  // Ngày từng bước: hệ thống không lưu lịch sử chuyển trạng thái → chỉ hiện ngày chắc chắn
  const stepDates: string[] = KAIZEN_STEPS.map(() => "");
  stepDates[0] = formatDate(item.created_at);
  if (item.ie_confirmed_at && s.step >= 2) stepDates[1] = formatDate(item.ie_confirmed_at);
  const lastDone = s.stepDone ? s.step : s.step - 1;
  if (lastDone >= 1 && !stepDates[lastDone]) stepDates[lastDone] = formatDate(item.updated_at);
  const savings = item.total_savings_vnd || item.efficiency_value_vnd;

  return (
    <div className="grid gap-4 pt-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      <div className="space-y-4 lg:sticky lg:top-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-slate-600">{item.code}</span>
          <StatusBadge item={item} />
        </div>
        <h1 className="text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl">{item.title || "Sáng kiến cải tiến"}</h1>
        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
          <Meta icon={<IconUser size={16} />} label="Người gửi" value={item.proposer_name || "—"} />
          <Meta icon={<IconBuilding size={16} />} label="Bộ phận" value={item.department || "—"} />
          <Meta icon={<IconCalendar size={16} />} label="Ngày gửi" value={formatDate(item.created_at)} />
        </div>
      </div>

      <Card title="Tiến độ xử lý">
        <ol className="flex items-start">
          {KAIZEN_STEPS.map((label, i) => {
            const done = i < s.step || (i === s.step && s.stepDone);
            const current = i === s.step && !s.stepDone;
            const failed = current && s.flag === "fail";
            const warned = current && s.flag === "warn";
            const hidden = s.flag === "fail" && i > s.step;
            return (
              <li key={label} className="relative flex flex-1 flex-col items-center text-center">
                {i > 0 && <span className={`absolute right-1/2 top-3.5 h-0.5 w-full ${i <= s.step ? "bg-emerald-600" : "bg-slate-200"}`} />}
                <span
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-white ${
                    failed ? "border-rose-500 bg-rose-500" : warned ? "border-orange-500 bg-orange-500" : done ? "border-emerald-600 bg-emerald-600" : current ? "border-emerald-600 bg-white" : "border-slate-300 bg-white"
                  } ${hidden ? "opacity-30" : ""}`}
                >
                  {failed ? <IconX size={14} /> : warned ? <IconAlertTriangle size={14} /> : done ? <IconCheck size={14} /> : current ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-600" /> : null}
                </span>
                <span className={`mt-1.5 text-[10px] font-semibold leading-tight sm:text-xs ${hidden ? "text-slate-300" : "text-slate-700"}`}>{label}</span>
                <span className="text-[10px] text-slate-400">{done ? stepDates[i] || "—" : ""}</span>
              </li>
            );
          })}
        </ol>
        {s.note && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{s.note}</p>}
      </Card>

      {(savings > 0 || item.award_title) && (
        <Card title="Kết quả">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white"><IconCoin size={20} /></span>
            <div>
              {savings > 0 && (<><p className="text-xs text-slate-500">Tiền tiết kiệm</p><p className="text-lg font-extrabold text-emerald-800">{formatVnd(savings)}</p></>)}
              {item.award_title && <p className="text-sm font-bold text-amber-700">🏆 {item.award_title}</p>}
            </div>
          </div>
        </Card>
      )}

      </div>
      <div className="space-y-4">
      {item.category_label && (
        <Card title="Nội dung đã gửi">
          <p className="text-xs text-slate-500">Nhóm lợi ích</p>
          <p className="text-sm font-semibold text-slate-800">{item.category_label.replace(/^\d+\.\s*/, "")}</p>
        </Card>
      )}

      <ContentBlock title="Hiện trạng trước cải tiến" text={item.before_description} images={item.before_images} onOpen={openImage} />
      <ContentBlock title="Giải pháp sau cải tiến" text={item.after_solution} images={item.after_images} onOpen={openImage} />

      {comment && (
        <Card title="Nhận xét của người duyệt" icon={<IconMessageCircle size={16} />}>
          <p className="whitespace-pre-line text-sm text-slate-700">{comment}</p>
        </Card>
      )}
      </div>

      {lightbox && (
        <KaizenImageLightboxModal
          isOpen
          onClose={() => setLightbox(null)}
          images={lightbox.images}
          initialIndex={lightbox.index}
          proposalTitle={item.title}
          proposalCode={item.code}
        />
      )}
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-slate-400">{icon} {label}</p>
      <p className="mt-0.5 truncate font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900">{icon}{title}</h2>
      {children}
    </div>
  );
}

function ContentBlock({ title, text, images, onOpen }: { title: string; text: string; images: string[]; onOpen: (url: string) => void }) {
  if (!text && images.length === 0) return null;
  return (
    <Card title={title}>
      {text && <p className="whitespace-pre-line text-sm text-slate-700">{text}</p>}
      {images.length > 0 && (
        <div className={`mt-3 grid gap-2 ${images.length > 1 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-2" : "grid-cols-1 sm:max-w-md"}`}>
          {images.map((url) => (
            <button key={url} onClick={() => onOpen(url)} className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
              <img src={url} alt={title} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
