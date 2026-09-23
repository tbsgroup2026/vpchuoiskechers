'use client';

// Màn hình CHIẾU TV RIÊNG cho 1 Line cụ thể — KHÔNG cần đăng nhập (xem RequireAuth.tsx: layout
// /work bọc auth theo ĐƯỜNG DẪN, route này cố ý đặt NGOÀI /work nên không bị chặn, giống hệt cách
// /pph-scan đã công khai). Lấy link qua nút "📺" ở mỗi ô Line trong /work/?module=production (xem
// copyTvLink() ở ProductionPerformanceModule.tsx) — mỗi Line 1 mã cố định (DashLine.id đã cấu
// hình ở Cài Đặt, hoặc leaf.id nếu Xưởng đó chưa chia Line thủ công).
//
// CHỦ ĐÍCH đơn giản hơn hẳn ProductionPerformanceModule: không có nút Tổng quan/đổi Line/Cài
// đặt/bật tắt toàn màn hình — mở lên là ĐÚNG NGAY Line đó, tự làm mới, không ai cần chạm vào máy
// chiếu TV nữa. Luôn xem HÔM NAY (không có bộ chọn ngày — không hợp lý cho màn hình cố định).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { IconVolume, IconVolumeOff } from '@tabler/icons-react';
import {
  LineBoard,
  todayVNStr,
  POLL_MS,
  FS_DESIGN_W,
  DEFAULT_TARGET_PPH,
  pphLineTitle,
  PPH_ALERT_AUDIO_BASE,
  type PphFactory,
  type DashLine,
  type PphLeaf,
  type FactoryConfig,
} from '@/modules/production/ProductionPerformanceModule';

type TvMediaSlot = {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  targetLineIds: 'ALL' | string[];
  enabled: boolean;
};
function pphTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function PphViewClient() {
  const searchParams = useSearchParams();
  const lineId = searchParams.get('lineId') || '';

  const [factories, setFactories] = useState<PphFactory[]>([]);
  const [lines, setLines] = useState<DashLine[]>([]);
  const [configs, setConfigs] = useState<FactoryConfig[]>([]);
  const [mediaSlots, setMediaSlots] = useState<TvMediaSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [scale, setScale] = useState(1);
  // Icon loa cạnh ô ngày giờ (header) — mở khoá phát nhắc giọng đọc, xem LineBoard/handleEnableAudio.
  // Tự về false mỗi khi trang này tải lại (kể cả tự tải lại khi có bản deploy mới) — giới hạn cứng
  // của trình duyệt (autoplay cần đúng cử chỉ bấm của LƯỢT TẢI TRANG đó), không phải bug.
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  function handleEnableAudio() {
    setAudioUnlocked(true);
    const a = new Audio(`${PPH_ALERT_AUDIO_BASE}dau-vao.mp3`);
    a.play().catch(() => {});
  }
  // Bề rộng "thiết kế" THỰC TẾ dùng để dựng nội dung — bắt đầu bằng FS_DESIGN_W (giống mọi nơi
  // khác), nhưng tự CHỈNH LẠI 1 lần theo đúng tỉ lệ khung hình của màn đang chiếu (xem effect bên
  // dưới) — KHÔNG giữ cố định như FS_DESIGN_W ở chỗ khác.
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

  // Co giãn theo CẢ chiều ngang LẪN chiều cao (Math.min 2 tỉ lệ) — KHÁC hẳn nút "phóng to toàn màn
  // hình" trong app (ProductionPerformanceModule.tsx) CHỈ co theo chiều ngang, chấp nhận cuộn dọc
  // nếu nội dung cao hơn màn hình. Trang TV này KHÔNG ai cuộn được (chiếu cố định, không tương
  // tác) nên bắt buộc phải vừa đúng 1 màn hình. Đo bằng scrollHeight (không đổi dù đang scale bao
  // nhiêu, transform không ảnh hưởng layout) nên luôn tính đúng dù chạy lại nhiều lần.
  //
  // Chỉ lấy Math.min thôi vẫn dư lề 1 bên nếu tỉ lệ khung hình nội dung (ở đúng FS_DESIGN_W) khác
  // tỉ lệ màn hình đang chiếu (VD Line ít Tổ thì nội dung "lùn" hơn màn hình rộng, co theo chiều
  // cao sẽ dư lề 2 bên — đúng lỗi người dùng báo). Sửa bằng cách tự CHỈNH LẠI designW (rộng ra nếu
  // đang dư lề ngang) sao cho co theo chiều rộng LẪN chiều cao ra CÙNG 1 tỉ lệ — hết dư lề ở cả 2
  // phía. Chỉ chỉnh 1 LẦN (adjustedRef) dựa trên phép đo THẬT đầu tiên, tránh vòng lặp chỉnh liên
  // tục (đổi designW → nội dung dựng lại → đo lại → lại đổi designW... không bao giờ dừng).
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
        // Trần 2400 TRƯỚC ĐÂY quá thấp cho màn hình cực rộng (VD bảng LED/TV khổ ngang dài thật ở
        // xưởng) — designW cần lên tới không đủ, thuật toán đành co theo chiều RỘNG là chính, dư hẳn
        // 1 khoảng trắng lớn phía DƯỚI (đúng ảnh thực tế người dùng chụp). Nâng trần lên 4800 để đủ
        // chỗ tự giãn cho hầu hết màn hình khổ ngang thực tế, sàn 1000 giữ nguyên (màn hẹp/dọc).
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
        const [dashRes, lineRes, cfgRes] = await Promise.allSettled([
          fetch(`/api/pph/dashboard?date=${d}${fresh ? '&fresh=1' : ''}`).then((r) => r.json()),
          fetch('/api/pph/dashboard-lines').then((r) => r.json()),
          fetch('/api/pph/factory-config').then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (dashRes.status === 'fulfilled' && dashRes.value?.success && dashRes.value.data) {
          setFactories(dashRes.value.data.factories || []);
          if (lineRes.status === 'fulfilled' && lineRes.value?.success) setLines(lineRes.value.lines || []);
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
  }, [lineId]);

  // Danh sách khung giờ chiếu ảnh/video (Cài Đặt > Chiếu ảnh/video theo khung giờ) — tải riêng,
  // cùng chu kỳ POLL_MS, để admin vừa sửa/thêm khung giờ là màn TV tự nhận trong tối đa 1 phút,
  // không cần ai đứng tải lại trang chiếu.
  useEffect(() => {
    let cancelled = false;
    function load() {
      fetch('/api/pph/tv-media-slots')
        .then((r) => r.json())
        .then((res) => {
          if (!cancelled && res?.success) setMediaSlots(res.slots || []);
        })
        .catch(() => {});
    }
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // Tự phát hiện có bản deploy MỚI hơn bản đang chạy trên chính màn TV này, rồi tự tải lại trang —
  // màn TV thường mở liên tục cả tháng không ai đụng vào, nên các đổi cỡ chữ/màu sắc/bố cục (code)
  // sẽ KHÔNG BAO GIỜ hiện ra nếu không ai chủ động tải lại trang (khác với SỐ LIỆU, tự cập nhật mỗi
  // POLL_MS qua load() ở trên — đây là 2 cơ chế khác hẳn nhau). GET /api/pph/tv-version trả về
  // version_metadata.id — 1 mã Cloudflare TỰ GẮN riêng cho MỖI LẦN deploy, không cần tự quản lý số
  // phiên bản thủ công. Kiểm tra mỗi 1 phút — gọi API rất nhẹ (chỉ đọc 1 biến có sẵn, không đụng
  // D1), 1 phút vẫn đủ nhẹ cho vài chục màn TV mà lên hình mới nhanh hơn hẳn. Lần đầu chỉ GHI NHỚ mã
  // hiện tại (chưa so sánh được với gì) — từ lần thứ 2 trở đi mới so.
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

  // Khung giờ ĐANG áp dụng ngay lúc này cho ĐÚNG Line đang chiếu (nếu có) — so theo "now" (đã tự
  // tick mỗi 15s ở effect phía trên) nên tự chuyển qua/về đúng lúc mà không cần tải lại trang. Hỗ
  // trợ cả khung giờ QUA ĐÊM (VD 23:00→01:00, start > end) dù ít gặp, cho chắc.
  const activeMediaSlot = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (const s of mediaSlots) {
      if (!s.enabled) continue;
      if (s.targetLineIds !== 'ALL' && !s.targetLineIds.includes(lineId)) continue;
      const startMin = pphTimeToMinutes(s.startTime);
      const endMin = pphTimeToMinutes(s.endTime);
      const inWindow = startMin <= endMin ? nowMin >= startMin && nowMin < endMin : nowMin >= startMin || nowMin < endMin;
      if (inWindow) return s;
    }
    return null;
  }, [mediaSlots, now, lineId]);

  // Line đã cấu hình ở Cài Đặt (DashLine thật) → ưu tiên; chưa cấu hình thì mã chính là leaf.id
  // (xem areaToLines() — mỗi điểm quét tự đứng riêng 1 "Line" khi Xưởng chưa chia Line thủ công).
  const resolved = useMemo(() => {
    if (!lineId) return null;
    const dashLine = lines.find((l) => l.id === lineId);
    if (dashLine) {
      const factory = factories.find((f) => f.leaves.some((l) => l.areaId === dashLine.areaId)) ?? null;
      const byId = new Map((factory?.leaves ?? []).map((l) => [l.id, l]));
      const leaves = dashLine.leafIds.map((id) => byId.get(id)).filter((x): x is PphLeaf => !!x);
      const areaName = leaves[0]?.areaName ?? dashLine.name;
      return { factory, leaves, areaName, lineName: dashLine.name };
    }
    // Fallback: mã là 1 leaf đơn lẻ.
    const found = factories.flatMap((f) => f.leaves.map((l) => ({ f, l }))).find(({ l }) => l.id === lineId);
    if (found) {
      return { factory: found.f, leaves: [found.l], areaName: found.l.areaName ?? found.l.name, lineName: found.l.name };
    }
    return null;
  }, [lines, factories, lineId]);

  const factoryCfg = resolved?.factory ? configs.find((c) => c.factoryId === resolved.factory!.id) : undefined;
  const targetPph = factoryCfg?.targetPphPct ?? DEFAULT_TARGET_PPH;
  const clock = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  // dd-mm-yyyy TỰ GHÉP (không dùng toLocaleDateString('vi-VN') — mặc định ra "d/m/yyyy" thiếu số 0
  // đứng đầu) — đổi dấu "-" khớp đúng ảnh mẫu người dùng gửi (trước là "/").
  const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

  if (loading && factories.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-sm font-bold text-gray-400">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (!lineId || !resolved || resolved.leaves.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
        <span className="text-sm font-bold text-rose-500">
          {!lineId
            ? 'Thiếu mã Line trên link — lấy link TV ở trang Sản xuất (nút 📺 tại mỗi Line).'
            : error || 'Không tìm thấy Line này — kiểm tra lại link hoặc lấy link mới ở trang Sản xuất.'}
        </span>
      </div>
    );
  }

  // Đang trong khung giờ chiếu ảnh/video (Cài Đặt > Chiếu ảnh/video theo khung giờ) — thay HẲN
  // dashboard bằng media này, phủ kín màn hình, KHÔNG qua cơ chế scale/designW (media tự co giãn
  // vừa khung hình bằng object-contain, không cần đo layout như bảng số liệu). Hết khung giờ,
  // activeMediaSlot tự về null ở lượt tick "now" kế tiếp (mỗi 15s) → tự quay lại dashboard, không
  // cần tải lại trang.
  if (activeMediaSlot) {
    return (
      <div key={activeMediaSlot.id} className="flex h-screen w-full items-center justify-center overflow-hidden bg-black">
        {activeMediaSlot.mediaType === 'video' ? (
          <video src={activeMediaSlot.mediaUrl} className="h-full w-full object-contain" autoPlay loop muted playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activeMediaSlot.mediaUrl} alt="" className="h-full w-full object-contain" />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-start justify-center overflow-y-auto bg-white text-tbs-dark">
      <div ref={contentRef} className="shrink-0" style={{ width: designW, transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-2">
          {/* Logo TBS bên trái — tiêu đề giờ nằm GIỮA hàng (absolute, canh theo đúng khung hàng này
              nhờ `relative` ở trên), không còn dạt về rìa trái như trước. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/tbs-logo.png" alt="TBS" className="h-10 w-auto shrink-0 object-contain" />
          <h2 className="pointer-events-none absolute left-1/2 top-1/2 max-w-[55%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-4xl font-black uppercase tracking-wide text-tbs-dark">
            {pphLineTitle(resolved.areaName, resolved.lineName)}
          </h2>
          <div className="flex items-center gap-2">
            {/* Icon loa — nằm bên trái ô ngày giờ. Đỏ nhấp nháy = chưa bật (bấm 1 cái nghe xác nhận
                ngay + bật nhắc giọng đọc trễ nhập); xanh = đã bật. Tự về đỏ mỗi khi trang tải lại
                (xem giải thích đầy đủ ở khai báo audioUnlocked phía trên). */}
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
            {/* Khối 2 tầng (ngày nền xanh — giờ nền tối), đúng ảnh mẫu người dùng gửi — bỏ giây (chỉ
                hh:mm, đã đúng sẵn từ `clock` — mẫu có giây/AM-PM nhưng yêu cầu rõ là bỏ giây). */}
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
            sel={{ areaName: resolved.areaName, name: resolved.lineName, leafIds: resolved.leaves.map((l) => l.id) }}
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
