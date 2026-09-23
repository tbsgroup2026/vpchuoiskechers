'use client';

// Màn hình CHIẾU TV GỘP cho CẢ 1 XƯỞNG (VD Gò: 5 Chuyền độc lập, không có Tổ con nên trước đây mỗi
// Chuyền phải chiếu 1 TV/1 link riêng — rất khó quan sát tổng thể cả Xưởng cùng lúc) — KHÔNG cần
// đăng nhập, giống hệt /pph-view (TV cấp Line). Lấy link qua icon "📺" ở góc ô "% Sản lượng" mỗi
// Xưởng tại /work/?module=production (xem copyTvLinkWorkshop() ở ProductionPerformanceModule.tsx —
// hiện CHỈ áp dụng cho Xưởng tên "Gò", các Xưởng khác không đổi gì).
//
// KHÁC hẳn /pph-view: trang đó chiếu ĐÚNG 1 Line/Chuyền theo cấu hình ở Cài Đặt
// (pph_dashboard_lines); trang NÀY bỏ qua cấu hình Line hoàn toàn, tự gộp TẤT CẢ điểm quét thuộc
// Xưởng (areaId) — mỗi Chuyền hiện thành 1 thẻ trong lưới, y hệt cách LineBoard đang hiện nhiều Tổ
// trong 1 Line (MAY). Trang tổng quan Nhà máy (FactoryBoard/AreaPanel) KHÔNG đổi gì — vẫn hiện đủ
// từng Line riêng như cũ để tiện theo dõi, link này chỉ là 1 LỐI VÀO PHỤ để chiếu TV gộp.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { IconVolume, IconVolumeOff } from '@tabler/icons-react';
import {
  LineBoard,
  todayVNStr,
  POLL_MS,
  FS_DESIGN_W,
  DEFAULT_TARGET_PPH,
  pphWorkshopTitle,
  PPH_ALERT_AUDIO_BASE,
  type PphFactory,
  type FactoryConfig,
} from '@/modules/production/ProductionPerformanceModule';

export default function PphViewWorkshopClient() {
  const searchParams = useSearchParams();
  const areaId = searchParams.get('areaId') || '';

  const [factories, setFactories] = useState<PphFactory[]>([]);
  const [configs, setConfigs] = useState<FactoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [scale, setScale] = useState(1);
  // Icon loa cạnh ô ngày giờ (header) — mở khoá phát nhắc giọng đọc, xem LineBoard/handleEnableAudio.
  // Tự về false mỗi khi trang này tải lại — giới hạn cứng của trình duyệt, giống hệt /pph-view.
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  function handleEnableAudio() {
    setAudioUnlocked(true);
    const a = new Audio(`${PPH_ALERT_AUDIO_BASE}dau-vao.mp3`);
    a.play().catch(() => {});
  }
  const [designW, setDesignW] = useState(FS_DESIGN_W);
  const contentRef = useRef<HTMLDivElement>(null);
  const adjustedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.title = 'Kết quả sản xuất — TBS';
  }, []);

  // Co giãn vừa đúng 1 màn hình (cả chiều ngang lẫn chiều cao) — Y HỆT PphViewClient.tsx, xem ghi
  // chú đầy đủ ở đó, không lặp lại ở đây.
  useEffect(() => {
    const fit = () => {
      const el = contentRef.current;
      if (!el) return;
      const naturalH = el.scrollHeight;
      if (naturalH <= 0) return;
      if (!adjustedRef.current) {
        adjustedRef.current = true;
        const sw0 = window.innerWidth / designW;
        const sh0 = window.innerHeight / naturalH;
        if (Number.isFinite(sh0) && sh0 > 0 && sh0 < sw0) {
          setDesignW(Math.round(Math.min(4800, Math.max(1000, designW * (sw0 / sh0)))));
          return;
        }
      }
      const sw = window.innerWidth / designW;
      const sh = window.innerHeight / naturalH;
      const s = Math.min(sw, sh);
      setScale(Number.isFinite(s) && s > 0 ? Math.min(s, 3) : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener('resize', fit);
    const iv = window.setInterval(fit, 3000);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
      window.clearInterval(iv);
    };
  }, [designW]);

  useEffect(() => {
    let cancelled = false;
    async function load(fresh: boolean) {
      try {
        const d = todayVNStr();
        const [dashRes, cfgRes] = await Promise.allSettled([
          fetch(`/api/pph/dashboard?date=${d}${fresh ? '&fresh=1' : ''}`).then((r) => r.json()),
          fetch('/api/pph/factory-config').then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (dashRes.status === 'fulfilled' && dashRes.value?.success && dashRes.value.data) {
          setFactories(dashRes.value.data.factories || []);
          if (cfgRes.status === 'fulfilled' && cfgRes.value?.success) setConfigs(cfgRes.value.configs || []);
          setError(null);
        } else {
          setError((dashRes.status === 'fulfilled' && dashRes.value?.error) || 'Không tải được dữ liệu');
        }
      } catch {
        if (!cancelled) setError('Không kết nối được tới hệ thống');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load(true);
    const t = setInterval(() => load(false), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [areaId]);

  // Tự phát hiện có bản deploy MỚI hơn bản đang chạy trên chính màn TV này, rồi tự tải lại trang —
  // Y HỆT PphViewClient.tsx, xem ghi chú đầy đủ ở đó.
  useEffect(() => {
    let cancelled = false;
    let myVersion: string | null = null;
    function checkVersion() {
      fetch('/api/pph/tv-version', { cache: 'no-store' })
        .then((r) => r.json())
        .then((res) => {
          if (cancelled || !res?.success || !res.version) return;
          if (myVersion === null) {
            myVersion = res.version;
            return;
          }
          if (res.version !== myVersion) {
            window.location.reload();
          }
        })
        .catch(() => {});
    }
    checkVersion();
    const iv = setInterval(checkVersion, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  // Gộp TẤT CẢ điểm quét thuộc ĐÚNG areaId này — KHÔNG qua cấu hình Line (khác hẳn /pph-view), nên
  // luôn hiện đủ mọi Chuyền/Tổ hiện có trong Xưởng, kể cả thêm mới sau này không cần cấu hình lại gì.
  const resolved = useMemo(() => {
    if (!areaId) return null;
    const factory = factories.find((f) => f.leaves.some((l) => l.areaId === areaId)) ?? null;
    if (!factory) return null;
    const leaves = factory.leaves.filter((l) => l.areaId === areaId);
    if (leaves.length === 0) return null;
    return { factory, leaves, areaName: leaves[0].areaName ?? '' };
  }, [factories, areaId]);

  const factoryCfg = resolved?.factory ? configs.find((c) => c.factoryId === resolved.factory.id) : undefined;
  const targetPph = factoryCfg?.targetPphPct ?? DEFAULT_TARGET_PPH;
  const clock = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

  if (loading && factories.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-sm font-bold text-gray-400">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (!areaId || !resolved || resolved.leaves.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
        <span className="text-sm font-bold text-rose-500">
          {!areaId
            ? 'Thiếu mã Xưởng trên link — lấy link ở trang Sản xuất (icon 📺 tại ô % Sản lượng của Xưởng).'
            : error || 'Không tìm thấy Xưởng này — kiểm tra lại link hoặc lấy link mới ở trang Sản xuất.'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-start justify-center overflow-y-auto bg-white text-tbs-dark">
      <div ref={contentRef} className="shrink-0" style={{ width: designW, transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/tbs-logo.png" alt="TBS" className="h-10 w-auto shrink-0 object-contain" />
          <h2 className="pointer-events-none absolute left-1/2 top-1/2 max-w-[55%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-4xl font-black uppercase tracking-wide text-tbs-dark">
            {pphWorkshopTitle(resolved.areaName, resolved.factory.name)}
          </h2>
          <div className="flex items-center gap-2">
            {/* Icon loa — nằm bên trái ô ngày giờ, y hệt /pph-view (xem ghi chú đầy đủ ở đó). */}
            <button
              type="button"
              onClick={handleEnableAudio}
              title={audioUnlocked ? 'Đã bật nhắc giọng đọc' : 'Bấm để bật nhắc giọng đọc'}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                audioUnlocked ? 'bg-emerald-500 text-white' : 'animate-pulse bg-rose-500 text-white'
              }`}
            >
              {audioUnlocked ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
            </button>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="bg-[#006838] px-3 py-1 text-center">
                <span className="font-mono text-sm font-black tracking-wide text-white">{dateStr}</span>
              </div>
              <div className="bg-[#0a1a2f] px-3 py-1 text-center">
                <span className="font-mono text-lg font-black tabular-nums text-white">{clock}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2 p-3">
          <LineBoard
            sel={{ areaName: resolved.areaName, name: resolved.areaName, leafIds: resolved.leaves.map((l) => l.id) }}
            leaves={resolved.leaves}
            targetPph={targetPph}
            light
            tv
            alertOverdue
            audioUnlocked={audioUnlocked}
          />
        </div>
      </div>
    </div>
  );
}
