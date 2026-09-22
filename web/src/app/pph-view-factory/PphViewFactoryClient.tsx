'use client';

// Link CÔNG KHAI xem cấp Nhà máy (cấp 2) — theo đúng yêu cầu "y hệt cấp Nhà máy hiện tại, chỉ là
// không cần đăng nhập, KHÔNG đổi màu/kích cỡ gì hết": tái dựng ĐÚNG NGUYÊN TRẠNG phần cấp Nhà máy
// của ProductionPerformanceModule.tsx (nền tối, cỡ chữ bình thường, bấm vào 1 Line vẫn xem được chi
// tiết Line đó — kể cả việc đổi sang nền trắng/LineBoard light+tv lúc đó, đúng y hệt hành vi trong
// app hiện tại) — KHÁC HẲN PphViewClient.tsx (TV cấp Line): trang đó CỐ Ý "TV hoá" (nền trắng, chữ
// khổng lồ, tự co giãn vừa 1 màn hình, không nút bấm) vì gắn cố định lên TV treo tường; trang NÀY
// vẫn là 1 dashboard xem bình thường (cuộn được, có nút làm mới, bấm chọn Line), chỉ khác app thật
// ở chỗ không yêu cầu đăng nhập. KHÔNG có date-picker/toàn màn hình/cài đặt (giữ phạm vi công khai
// gọn, những nút đó không cần thiết cho 1 link "chiếu xem").
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { IconChevronLeft, IconRefresh } from '@tabler/icons-react';
import {
  FactoryBoard,
  LineBoard,
  todayVNStr,
  POLL_MS,
  DEFAULT_TARGET_PPH,
  pphLineTitle,
  type PphFactory,
  type DashLine,
  type PphLeaf,
  type FactoryConfig,
  type LineSel,
} from '@/modules/production/ProductionPerformanceModule';

export default function PphViewFactoryClient() {
  const searchParams = useSearchParams();
  const factoryId = searchParams.get('factoryId') || '';

  const [factories, setFactories] = useState<PphFactory[]>([]);
  const [lines, setLines] = useState<DashLine[]>([]);
  const [configs, setConfigs] = useState<FactoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lineSel, setLineSel] = useState<LineSel | null>(null);

  useEffect(() => {
    document.title = 'Kết quả sản xuất — TBS';
  }, []);

  const load = useCallback(async (opts?: { fresh?: boolean }) => {
    try {
      const d = todayVNStr();
      const [dashRes, lineRes, cfgRes] = await Promise.allSettled([
        fetch(`/api/pph/dashboard?date=${d}${opts?.fresh ? '&fresh=1' : ''}`).then((r) => r.json()),
        fetch('/api/pph/dashboard-lines').then((r) => r.json()),
        fetch('/api/pph/factory-config').then((r) => r.json()),
      ]);
      if (dashRes.status === 'fulfilled' && dashRes.value?.success && dashRes.value.data) {
        setFactories(dashRes.value.data.factories || []);
        if (lineRes.status === 'fulfilled' && lineRes.value?.success) setLines(lineRes.value.lines || []);
        if (cfgRes.status === 'fulfilled' && cfgRes.value?.success) setConfigs(cfgRes.value.configs || []);
        setError(null);
      } else {
        setError((dashRes.status === 'fulfilled' && dashRes.value?.error) || 'Không tải được dữ liệu');
      }
    } catch {
      setError('Không kết nối được tới hệ thống');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() là fetch bất đồng bộ, setState chạy sau await
    load({ fresh: true });
    const t = setInterval(() => {
      if (!cancelled) load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [load, factoryId]);

  // Tự phát hiện có bản deploy MỚI hơn bản đang chạy trên chính màn TV này, rồi tự tải lại trang —
  // giống hệt cơ chế ở PphViewClient.tsx (TV cấp Line), xem ghi chú đầy đủ ở đó. Màn TV cấp Nhà máy
  // cũng mở liên tục cả tháng nên cần y hệt, không chỉ riêng cấp Line.
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

  const factory = useMemo(() => factories.find((f) => f.id === factoryId) ?? null, [factories, factoryId]);
  const factoryCfg = factory ? configs.find((c) => c.factoryId === factory.id) : undefined;
  const factoryTargetPph = factoryCfg?.targetPphPct ?? DEFAULT_TARGET_PPH;

  const lineLeaves = useMemo(() => {
    if (!lineSel || !factory) return [];
    const byId = new Map(factory.leaves.map((l) => [l.id, l]));
    return lineSel.leafIds.map((id) => byId.get(id)).filter((x): x is PphLeaf => !!x);
  }, [lineSel, factory]);
  const isLineView = !!(factory && lineSel && lineLeaves.length > 0);

  if (loading && factories.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-sm font-bold text-gray-400">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (!factoryId || !factory) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
        <span className="text-sm font-bold text-rose-500">
          {!factoryId
            ? 'Thiếu mã Nhà máy trên link — lấy link ở trang Sản xuất (nút 📺 Lấy link TV ở đầu trang cấp Nhà máy).'
            : error || 'Không tìm thấy Nhà máy này — kiểm tra lại link hoặc lấy link mới ở trang Sản xuất.'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full ${
        isLineView ? 'bg-white text-tbs-dark' : 'bg-[#0a1a2f] bg-[radial-gradient(ellipse_at_top,#0f2b4a_0%,#0a1a2f_60%)] text-slate-200'
      }`}
    >
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 ${isLineView ? 'border-gray-100' : 'border-cyan-500/15'}`}>
        <div className="flex min-w-0 items-center gap-3">
          {isLineView ? (
            <button
              type="button"
              onClick={() => setLineSel(null)}
              className="flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 px-2.5 text-xs font-bold text-tbs-dark hover:bg-gray-200"
            >
              <IconChevronLeft size={15} /> {factory.name}
            </button>
          ) : null}
          <h2 className={`truncate text-lg font-black uppercase tracking-wide sm:text-2xl ${isLineView ? 'text-tbs-dark' : 'text-white'}`}>
            {isLineView ? pphLineTitle(lineSel!.areaName, lineSel!.name) : factoryCfg?.title || `Kết quả sản xuất — ${factory.name}`}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => load({ fresh: true })}
          title="Làm mới"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
            isLineView ? 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100' : 'border-cyan-500/25 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/15'
          }`}
        >
          <IconRefresh size={16} />
        </button>
      </div>

      <div className="space-y-3 p-3 sm:p-5">
        {isLineView ? (
          <LineBoard sel={lineSel!} leaves={lineLeaves} targetPph={factoryTargetPph} light tv />
        ) : (
          <FactoryBoard factory={factory} lines={lines} configs={configs} onPickLine={setLineSel} />
        )}
      </div>
    </div>
  );
}
