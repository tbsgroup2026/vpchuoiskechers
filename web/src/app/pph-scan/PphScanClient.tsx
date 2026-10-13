'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  IconBuildingFactory2,
  IconCircleCheck,
  IconClock,
  IconAlertTriangle,
  IconUsers,
  IconShoe,
  IconTarget,
  IconChartBar,
  IconChevronRight,
  IconLock,
  IconX,
  IconUserCheck,
  IconPencil,
  IconPercentage,
  IconBug,
  IconRefresh,
  IconArrowsLeftRight,
} from '@tabler/icons-react';

type PphSlotEntry = {
  slot: string;
  filled: boolean;
  workerCount?: number | null;
  model?: string | null;
  plannedQty?: number | null;
  targetRft?: number | null;
  actualQty?: number | null;
  errorCount?: number | null;
  shortfallReason?: string | null;
  shortfallSolution?: string | null;
};

type ScanInfo = {
  success: boolean;
  error?: string;
  team?: { id: string; name: string; lineName: string; areaName: string; factoryName: string };
  date?: string;
  slots?: string[];
  filledSlots?: string[];
  entries?: PphSlotEntry[];
  perHourTarget?: number | null;
  setup?: { workerCount: number; model: string; plannedQty: number; targetRft: number; productionHours: number | null } | null;
  nextAction?: 'setup' | 'quantity' | 'wait' | 'done';
  targetSlot?: string | null;
  nextSlot?: string;
};

type ShortfallCauseGroup = { id: string; name: string; subs: { id: string; name: string }[] };
type ShoeModelSuggestion = { code: string; imageUrl: string };
// Hình dạng cây Nhà máy›Xưởng›Chuyền›Tổ — khớp đúng pphBuildTree() bên _worker.js (GET /api/pph/scan-tree).
type PphTreeTeam = { id: string; name: string };
type PphTreeLine = { id: string; name: string; teams: PphTreeTeam[] };
type PphTreeArea = { id: string; name: string; lines: PphTreeLine[]; teams: PphTreeTeam[] };
type PphTreeFactory = { id: string; name: string; areas: PphTreeArea[] };

const REMEMBERED_NAME_KEY = 'pph_scan_reporter_name';
// Nhớ mã Tổ lần quét GẦN NHẤT trên CHÍNH điện thoại/máy tính bảng này — phục vụ yêu cầu "thêm vào
// màn hình chính, mở app lên là vào thẳng form nhập" (Tổ thường gắn cố định 1 thiết bị tại chỗ,
// không cần quét lại QR mỗi lần nếu thiết bị đã quét đúng Tổ đó ít nhất 1 lần trước đó).
const REMEMBERED_TEAM_KEY = 'pph_scan_last_team';
// Sentinel "Khác (nhập tự do)" — luôn tự có ở cuối mọi combobox, khớp PPH_CAUSE_OTHER_ID phía _worker.js.
const CAUSE_OTHER_ID = '__other__';

// Trang quét QR CÔNG KHAI, mở qua camera Zalo — không cần đăng nhập. teamId truyền qua query
// param (?team=...), KHÔNG dùng route segment động vì site build tĩnh (output:'export') không
// biết trước danh sách Tổ lúc build — xem next.config.ts.
export default function PphScanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team') || '';
  // Mã QR CHUNG (không gắn cố định 1 Tổ, tải ở trang Cài Đặt riêng — PphGeneralQrView.tsx) trỏ tới
  // /pph-scan?pick=1 — LUÔN cho chọn lại vị trí từ đầu, không tự điền/nhớ lần chọn trước (khác hẳn
  // hành vi REMEMBERED_TEAM_KEY bên dưới, vốn dành cho thiết bị đứng yên tại 1 Tổ cố định).
  const pickMode = searchParams.get('pick') === '1';

  // Trang build tĩnh (output:'export') — lúc build KHÔNG có URL thật nên teamId luôn rỗng trong
  // bản HTML tĩnh ban đầu; chỉ sau khi hydrate xong ở trình duyệt, useSearchParams() mới đọc được
  // đúng ?team=... từ URL thật. Nếu kiểm tra "!teamId" TRƯỚC khi biết chắc đã hydrate xong, màn
  // hình sẽ chớp qua "Thiếu mã Tổ" (sai) rồi mới chuyển sang "Đang tải..." rồi mới ra form đúng —
  // đúng hiện tượng "xoay load chập chờn" người dùng báo cáo (thấy rõ hơn khi JS đã có sẵn trong
  // cache trình duyệt nên hydrate rất nhanh, các bước chớp nối tiếp nhau rõ rệt). `mounted` chỉ
  // true SAU khi đã chắc chắn chạy xong ở client — trước đó luôn hiện "Đang tải..." trung tính.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // "Thêm vào màn hình chính, mở app lên là vào thẳng form nhập" — có mã Tổ trên URL thì nhớ lại
  // (localStorage) cho CHÍNH thiết bị này; KHÔNG có mã (mở icon màn hình chính không kèm ?team=,
  // hoặc lỡ bấm "Cài đặt app" khiến PWA quay về URL gốc /pph-scan trơn) thì tự lấy lại mã đã nhớ,
  // điều hướng thẳng tới đúng Tổ — không bắt quét lại QR mỗi lần trên thiết bị đã gắn cố định 1 Tổ.
  const [redirectingToRemembered, setRedirectingToRemembered] = useState(false);
  useEffect(() => {
    if (!mounted) return;
    if (teamId) {
      try {
        window.localStorage.setItem(REMEMBERED_TEAM_KEY, teamId);
      } catch {}
      return;
    }
    if (pickMode) return; // Mã QR chung — luôn hiện chọn vị trí từ đầu, không tự điều hướng theo mã đã nhớ.
    try {
      const remembered = window.localStorage.getItem(REMEMBERED_TEAM_KEY);
      if (remembered) {
        setRedirectingToRemembered(true);
        router.replace(`/pph-scan?team=${encodeURIComponent(remembered)}`);
      }
    } catch {}
  }, [mounted, teamId, pickMode, router]);

  const [info, setInfo] = useState<ScanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittedBy, setSubmittedBy] = useState('');
  const [rememberedName, setRememberedName] = useState('');
  const [editingName, setEditingName] = useState(false);
  // Thời gian sản xuất (giờ, VD 8/11/13) — >8 = ca tăng ca, server tự sinh thêm khung số lượng
  // sau 16:30 (17:30, 18:30...) tương ứng, xem buildPphSlots() bên _worker.js.
  const [productionHours, setProductionHours] = useState('');
  const [workerCount, setWorkerCount] = useState('');
  const [model, setModel] = useState('');
  const [shoeModels, setShoeModels] = useState<ShoeModelSuggestion[]>([]);
  const [plannedQty, setPlannedQty] = useState('');
  const [targetRft, setTargetRft] = useState('');
  const [actualQty, setActualQty] = useState('');
  const [errorCount, setErrorCount] = useState('');
  // Nguyên nhân hụt chỉ tiêu — combobox 2 cấp (nhóm 5M1E › chi tiết), "Khác" thì nhập tự do ở ô riêng.
  const [causeGroups, setCauseGroups] = useState<ShortfallCauseGroup[]>([]);
  const [causeGroupId, setCauseGroupId] = useState('');
  const [causeSubId, setCauseSubId] = useState('');
  const [causeDetail, setCauseDetail] = useState('');
  const [shortfallSolution, setShortfallSolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ slot: string } | null>(null);
  const [showSlotPanel, setShowSlotPanel] = useState(false);
  // 1 người đôi khi nhập hộ/nhập thêm cho Tổ khác (không phải Tổ đã quét/nhớ sẵn trên điện thoại
  // này) — bấm vào tên Tổ ở đầu trang (mọi màn hình) để mở lại y hệt màn chọn vị trí lúc quét mã
  // QR chung, không cần quét lại mã mới đổi được Tổ.
  const [showTeamSwitcher, setShowTeamSwitcher] = useState(false);
  const [countdownLabel, setCountdownLabel] = useState<string | null>(null);
  const [countdownPhase, setCountdownPhase] = useState<'before-open' | 'open' | null>(null);
  const [slotWindows, setSlotWindows] = useState<Record<string, { startTime: string; endTime: string }> | null>(null);
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  // Trang này CÔNG KHAI, quét bởi rất nhiều điện thoại khác nhau, không cần chức năng offline/PWA
  // gì (luôn cần mạng thật để nộp số liệu) — nên KHÔNG có lý do gì để Service Worker can thiệp vào
  // đây cả, và SW từng là nguồn gốc hàng loạt sự cố "kẹt/chập chờn" khó dò khác nhau suốt phiên làm
  // việc hôm nay (bản cache cũ trên điện thoại đã ghé từ trước khi có các bản sửa mới nhất). Chủ
  // động HUỶ ĐĂNG KÝ mọi Service Worker của domain — đảm bảo từ lần vào trang NÀY trở đi không còn
  // tầng SW nào chen vào giữa nữa, chỉ còn HTTP thuần (đã ép no-store cho HTML).
  //
  // QUAN TRỌNG: đã tự kiểm chứng bằng Chrome thật (headless, giả lập điện thoại) — nếu chạy việc
  // huỷ đăng ký này NGAY LÚC MOUNT (cùng lúc với form đang tải dữ liệu lần đầu), nó CẠNH TRANH tài
  // nguyên với chính quá trình tải/hiển thị form, gây đúng cảm giác giật/chập chờn lúc tải (dù cuối
  // cùng vẫn ra đúng kết quả) — đặc biệt rõ trên máy yếu vì huỷ 1 SW đang thực sự điều khiển trang
  // là việc tốn tài nguyên (Chrome phải chờ dừng hẳn việc SW đang chặn fetch). Nên CHỦ ĐỘNG ĐỢI đến
  // khi form đã hiển thị xong (loading=false) rồi mới âm thầm dọn dẹp SW ở nền, không cạnh tranh gì
  // với trải nghiệm của người dùng đang xem/nhập liệu nữa.
  useEffect(() => {
    if (loading) return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const t = setTimeout(() => {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
      if ('caches' in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [loading]);

  // Nhớ tên người báo cáo TRÊN CHÍNH ĐIỆN THOẠI này — chỉ lần đầu tiên (bất kỳ Tổ nào) mới phải
  // gõ tên, các lần quét sau tự điền sẵn, vẫn cho bấm "Đổi tên" nếu điện thoại đổi người dùng.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBERED_NAME_KEY) || '';
      if (saved) {
        setRememberedName(saved);
        setSubmittedBy(saved);
      }
    } catch {}
  }, []);

  // silent=true — dùng sau khi sửa Đầu ca ở SlotHistoryPanel (xem onSetupSaved bên dưới): CHỈ tải
  // lại info, KHÔNG bật cờ `loading` — bật cờ đó sẽ làm cả trang rơi vào màn "Đang tải dữ liệu..."
  // (xem check `if (!mounted || loading...)` phía dưới), đóng sập luôn modal đang mở giữa chừng.
  const load = async (opts?: { silent?: boolean }) => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    try {
      if (!opts?.silent) setLoading(true);
      const res = await fetch(`/api/pph/scan-info?teamId=${encodeURIComponent(teamId)}`).then((r) => r.json());
      setInfo(res);
    } catch (err) {
      console.warn('Failed to fetch scan-info:', err);
      if (!opts?.silent) setInfo({ success: false, error: 'Không kết nối được tới hệ thống' });
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Lưới an toàn khi KHÔNG có mã Tổ trên URL, HOẶC có mã nhưng server báo không hợp lệ (mã cũ/đã
  // xoá) — thực tế đã gặp báo lỗi "Thiếu mã Tổ" dù đã quét QR (nghi trình duyệt trong app Zalo giữ
  // 1 bản Service Worker/cache CŨ từ trước — xem effect huỷ SW phía trên — chỉ tự khỏi SAU KHI đã
  // tải được đúng bản JS mới nhất, không giúp được ngay LẦN ĐẦU đang bị kẹt). Cũng chính là màn hình
  // cho mã QR CHUNG (?pick=1, xem PphGeneralQrView.tsx) tự chọn Nhà máy›Xưởng›Chuyền/Tổ (xem
  // CascadingTeamPicker) rồi ghi nhớ lại y hệt vừa quét mã riêng — không cần đợi sửa cache/SW hay
  // cấp lại QR mới. Chỉ tải cây khi THỰC SỰ cần (1 trong các trường hợp trên) — trường hợp bình
  // thường (đã có mã, tra đúng) không tốn thêm lượt gọi API này.
  const [teamTree, setTeamTree] = useState<PphTreeFactory[]>([]);
  const needsTeamFallback = !teamId || pickMode || (info !== null && (!info.success || !info.team));
  useEffect(() => {
    if (!mounted || teamTree.length > 0) return;
    if (!needsTeamFallback && !showTeamSwitcher) return;
    fetch('/api/pph/scan-tree')
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) setTeamTree(res.data);
      })
      .catch(() => {});
  }, [mounted, needsTeamFallback, showTeamSwitcher, teamTree.length]);

  function switchToTeam(id: string) {
    setShowTeamSwitcher(false);
    router.replace(`/pph-scan?team=${encodeURIComponent(id)}`);
  }

  // Giờ mở/đóng từng khung ("Ràng buộc thời gian", cấu hình chung ở trang Cài Đặt) — tải 1 LẦN,
  // dùng để tính đồng hồ đếm ngược bên dưới. Giờ MỞ giờ đây LÀ MỐC THẬT chặn nộp sớm (server tự
  // kiểm tra lại, xem pphResolveStatus() trong _worker.js) — đồng hồ đếm ngược hiển thị đúng khớp
  // với luật đang áp dụng thật, không còn là hàng demo. Giờ ĐÓNG vẫn chỉ để tắt đồng hồ hiển thị,
  // không khoá nộp trễ (luật "bắt kịp" khung sớm nhất còn thiếu vẫn giữ nguyên).
  useEffect(() => {
    fetch('/api/pph/slot-windows')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.windows)) {
          const map: Record<string, { startTime: string; endTime: string }> = {};
          for (const w of res.windows) map[w.slot] = { startTime: w.startTime, endTime: w.endTime };
          setSlotWindows(map);
        }
      })
      .catch(() => {});
  }, []);

  // Danh mục nhóm nguyên nhân hụt chỉ tiêu (5M1E) — admin chỉnh ở trang Cài Đặt, tải 1 lần để dựng
  // 2 combobox bên dưới. Tải sớm ngay khi mở trang (không đợi đến lúc phát hiện hụt) cho mượt.
  useEffect(() => {
    fetch('/api/pph/shortfall-causes')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.groups)) setCauseGroups(res.groups);
      })
      .catch(() => {});
  }, []);

  // Danh sách mã giày đã có ảnh (Cài Đặt > Ảnh theo Mã Giày) — gợi ý kèm ảnh khi gõ ô "Model sản
  // xuất" bên dưới, giúp gõ đúng mã (khớp đúng mã thì dashboard cấp Line tự lên ảnh tương ứng).
  // Không bắt buộc chọn từ danh sách — mã lạ/chưa có ảnh vẫn nộp bình thường như trước.
  useEffect(() => {
    fetch('/api/pph/shoe-models')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.models)) setShoeModels(res.models);
      })
      .catch(() => {});
  }, []);


  // Sau khi ghi nhận thành công, tự chuyển sang khung giờ TIẾP THEO mà KHÔNG cần quét lại mã QR —
  // tải lại thông tin sau ~1.8s (đủ để đọc dòng "Đã ghi nhận!"), rồi hiện thẳng form của khung kế
  // tiếp (hoặc trạng thái phù hợp: chờ/đã xong). An toàn không lặp vô hạn vì đây là timer 1 lần,
  // tách biệt hẳn với đồng hồ đếm ngược khung giờ (đã fix riêng ở effect bên dưới).
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      setSuccess(null);
      load();
    }, 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  // Nếu tải lâu bất thường (mạng yếu, hoặc trình duyệt đang giữ 1 bản trang cũ không tải nổi file
  // mới) — sau 8s hiện thêm nút "Tải lại trang" thay vì để màn hình quay vòng vô tận không rõ lý do.
  useEffect(() => {
    if (!loading) {
      setLoadingTooLong(false);
      return;
    }
    const t = setTimeout(() => setLoadingTooLong(true), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  // Đồng hồ đếm ngược HIỂN THỊ — theo đúng "cửa sổ" (giờ mở → giờ đóng) của khung đang chờ, lấy từ
  // slotWindows (xem "Ràng buộc thời gian" ở trang Cài Đặt). 2 giai đoạn: CHƯA tới giờ mở thì đếm
  // "mở sau"; ĐANG trong khung mở thì đếm "đóng sau". Qua giờ đóng thì ẩn hẳn (không còn gì để
  // đếm). CHỈ hiển thị — KHÔNG gắn hành động tự tải lại vào đây (tách riêng ở effect bên dưới, vẫn
  // theo đúng luật cũ) để không lặp vô hạn như bug đã gặp trước đây.
  useEffect(() => {
    const relevantSlot = info?.nextAction === 'setup' ? '08:00' : info?.nextAction === 'quantity' ? info.targetSlot : null;
    const win = relevantSlot && slotWindows ? slotWindows[relevantSlot] : null;
    if (!win) {
      setCountdownLabel(null);
      setCountdownPhase(null);
      return;
    }
    const startMs = slotLabelToDeadlineVNMs(win.startTime);
    const endMs = slotLabelToDeadlineVNMs(win.endTime);
    const tick = () => {
      const now = vnNowMs();
      if (now < startMs) {
        setCountdownPhase('before-open');
        setCountdownLabel(formatDurationMs(startMs - now));
      } else if (now < endMs) {
        setCountdownPhase('open');
        setCountdownLabel(formatDurationMs(endMs - now));
      } else {
        setCountdownPhase(null);
        setCountdownLabel(null); // Đã qua giờ đóng — không còn gì để đếm nữa
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [info?.targetSlot, info?.nextAction, slotWindows]);

  // Tự tải lại NGẦM (không hiện số đếm nào) khi khung đang nhập THỰC SỰ hết hạn (= giờ MỞ đã cấu
  // hình của khung kế tiếp, khớp đúng luật pphResolveStatus() phía backend) — để tự chuyển sang
  // khung mới mà không bắt người dùng phải tự bấm làm mới.
  //
  // BUG ĐÃ TÌM RA VÀ SỬA TRƯỚC ĐÓ (nguyên nhân "quét lần 2 xoay/giật liên tục"): pphResolveStatus()
  // phía backend cố tình trả về khung SỚM NHẤT còn thiếu — kể cả khung đó đã trễ rất lâu (VD cập
  // nhật đầu ca lúc 14h thì targetSlot vẫn là "08:30" để "bắt kịp"). Với 1 khung đã trễ như vậy,
  // mốc hết hạn (= giờ mở của khung kế tiếp) CŨNG đã trôi qua từ lâu — nếu không kiểm tra trước, tick
  // đầu tiên lập tức thấy "đã hết giờ" và tự gọi load(); load() trả về info MỚI (object JSON parse
  // lại — LUÔN khác reference dù giá trị giống hệt), khiến effect này (phụ thuộc info?.slots) bị
  // coi là "đổi" và CHẠY LẠI ngay — rồi lại lập tức thấy hết giờ, lại load()... lặp vô hạn. Fix: CHỈ
  // hẹn giờ tải lại khi mốc hết hạn còn ở TƯƠNG LAI ngay từ đầu; nếu đã trễ sẵn thì không hẹn gì cả.
  useEffect(() => {
    if (!info?.slots || !info.targetSlot || info.nextAction !== 'quantity') return;
    const idx = info.slots.indexOf(info.targetSlot);
    const nextBoundarySlot = idx >= 0 ? info.slots[idx + 1] : undefined;
    if (!nextBoundarySlot) return; // Khung cuối ngày — không còn mốc để tự chuyển tiếp
    const win = slotWindows?.[nextBoundarySlot];
    if (!win) return; // Chưa tải xong giờ cấu hình — bỏ qua, effect tự chạy lại khi slotWindows có
    const windowOpenMs = slotLabelToDeadlineVNMs(win.startTime);
    const diffMs = windowOpenMs - vnNowMs();
    if (diffMs <= 0) return; // Đã trễ sẵn (khung "bắt kịp") — không hẹn lại, tránh lặp vô hạn
    const t = setTimeout(() => load(), diffMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.slots, info?.targetSlot, info?.nextAction, slotWindows]);

  // Hụt Mục tiêu/giờ — so số đang gõ (chưa cần bấm gửi) với Mục tiêu/giờ suy ra từ kế hoạch đầu ca.
  // perHourTarget server đã LÀM TRÒN NGUYÊN sẵn (xem /scan-info ở _worker.js) — khớp đúng ngưỡng
  // bắt giải trình thật ở lúc nộp (POST /scan), không còn lệch do số lẻ (VD mục tiêu 23,1 nhập
  // đúng 23 vẫn coi là đạt, không bắt nhập nguyên nhân nữa).
  const parsedActualQty = actualQty === '' ? null : Number(actualQty);
  const shortfallAmount =
    info?.perHourTarget != null && parsedActualQty != null && Number.isFinite(parsedActualQty) ? info.perHourTarget - parsedActualQty : null;
  const isShortfallNow = info?.perHourTarget != null && info.perHourTarget > 0 && shortfallAmount != null && shortfallAmount > 0;

  const selectedCauseGroup = causeGroups.find((g) => g.id === causeGroupId) || null;
  const causeGroupIsOther = causeGroupId === CAUSE_OTHER_ID;
  const causeSubIsOther = causeSubId === CAUSE_OTHER_ID;
  // Ô "mô tả cụ thể" hiện khi: nhóm chính = Khác, HOẶC đã chọn nhóm chính (không phải Khác) và nhóm phụ = Khác.
  const needCauseDetail = causeGroupIsOther || (!!causeGroupId && !causeGroupIsOther && causeSubIsOther);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalName = submittedBy.trim();
    if (!finalName) {
      setFormError('Vui lòng nhập tên người báo cáo');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const isSetup = info?.nextAction === 'setup';
      const body: Record<string, unknown> = { teamId, submittedBy: finalName };
      if (isSetup) {
        const ph = Number(productionHours);
        const wc = Number(workerCount);
        const pq = Number(plannedQty);
        const rft = Number(targetRft);
        if (!Number.isFinite(ph) || ph <= 0 || ph > 24) { setFormError('Vui lòng nhập đúng Thời gian sản xuất (giờ)'); setSubmitting(false); return; }
        if (!Number.isFinite(wc) || wc <= 0) { setFormError('Vui lòng nhập đúng Số lượng công nhân'); setSubmitting(false); return; }
        if (!model.trim()) { setFormError('Vui lòng nhập Model sản xuất'); setSubmitting(false); return; }
        if (!Number.isFinite(pq) || pq <= 0) { setFormError('Vui lòng nhập đúng Sản lượng kế hoạch cả ca'); setSubmitting(false); return; }
        if (!Number.isFinite(rft) || rft < 0 || rft > 100) { setFormError('Vui lòng nhập đúng Mục tiêu tỉ lệ đạt chất lượng RFT (0-100%)'); setSubmitting(false); return; }
        body.productionHours = ph;
        body.workerCount = wc;
        body.model = model.trim();
        body.plannedQty = pq;
        body.targetRft = rft;
      } else {
        const aq = Number(actualQty);
        if (!Number.isFinite(aq) || aq < 0) { setFormError('Vui lòng nhập đúng Số lượng'); setSubmitting(false); return; }
        const ec = Number(errorCount);
        if (!Number.isFinite(ec) || ec < 0) { setFormError('Vui lòng nhập đúng Số lỗi'); setSubmitting(false); return; }
        if (ec > aq) { setFormError('Số lỗi không thể lớn hơn Số lượng'); setSubmitting(false); return; }
        body.actualQty = aq;
        body.errorCount = ec;
        // Hụt Mục tiêu/giờ — bắt buộc chọn Nhóm nguyên nhân (+ chi tiết, + mô tả nếu "Khác") và
        // Giải pháp trước khi gửi (server cũng tự kiểm tra lại, đây là chặn sớm phía form).
        if (isShortfallNow) {
          if (!causeGroupId) { setFormError('Số lượng đang thấp hơn Mục tiêu/giờ — vui lòng chọn Nhóm nguyên nhân'); setSubmitting(false); return; }
          if (!causeGroupIsOther && !causeSubId) { setFormError('Vui lòng chọn chi tiết nguyên nhân'); setSubmitting(false); return; }
          if (needCauseDetail && !causeDetail.trim()) { setFormError('Vui lòng mô tả nguyên nhân cụ thể'); setSubmitting(false); return; }
          if (!shortfallSolution.trim()) { setFormError('Số lượng đang thấp hơn Mục tiêu/giờ — vui lòng nhập Giải pháp'); setSubmitting(false); return; }
          body.shortfallCauseGroupId = causeGroupId;
          if (!causeGroupIsOther) body.shortfallCauseSubId = causeSubId;
          if (needCauseDetail) body.shortfallDetail = causeDetail.trim();
          body.shortfallSolution = shortfallSolution.trim();
        }
      }
      const res = await fetch('/api/pph/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.success) {
        setFormError(result.error || 'Không lưu được, vui lòng thử lại');
        return;
      }
      try {
        window.localStorage.setItem(REMEMBERED_NAME_KEY, finalName);
      } catch {}
      setRememberedName(finalName);
      // Dọn sạch ô nhập số lượng + giải trình hụt chỉ tiêu — vì giờ tự chuyển sang khung tiếp theo
      // ngay trên cùng form (không quét lại QR), không dọn thì khung sau sẽ thấy lại số cũ.
      setActualQty('');
      setErrorCount('');
      setCauseGroupId('');
      setCauseSubId('');
      setCauseDetail('');
      setShortfallSolution('');
      setSuccess({ slot: result.slot });
    } catch {
      setFormError('Không kết nối được tới hệ thống, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted || loading || redirectingToRemembered) {
    return (
      <ScanShell>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#006838] border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Đang tải...</p>
          {loadingTooLong && (
            <div className="text-center pt-2 space-y-2">
              <p className="text-[11px] text-slate-400">Tải hơi lâu — mạng yếu hoặc trình duyệt đang giữ bản trang cũ.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-[#006838] text-white text-xs font-bold hover:opacity-90"
              >
                Tải lại trang
              </button>
            </div>
          )}
        </div>
      </ScanShell>
    );
  }

  if (!teamId) {
    // pickMode (mã QR CHUNG, ?pick=1) — đây là màn hình BÌNH THƯỜNG đầu tiên sau khi quét, không
    // phải lỗi gì cả, nên không tô đỏ/không nói "không hợp lệ" như trường hợp thiếu mã do quét
    // nhầm/QR hỏng bên dưới.
    return (
      <ScanShell>
        {pickMode ? (
          <StateCard icon={IconBuildingFactory2} tone="emerald" title="Chọn vị trí báo cáo" desc="Chọn Nhà máy › Xưởng › Chuyền hoặc Tổ bạn đang đứng." />
        ) : (
          <StateCard icon={IconAlertTriangle} tone="rose" title="Thiếu mã Tổ" desc="Đường dẫn QR không hợp lệ — vui lòng quét lại mã đã dán tại Tổ." />
        )}
        <CascadingTeamPicker tree={teamTree} onPick={(id) => router.replace(`/pph-scan?team=${encodeURIComponent(id)}`)} />
      </ScanShell>
    );
  }

  if (!info?.success || !info.team) {
    return (
      <ScanShell>
        <StateCard icon={IconAlertTriangle} tone="rose" title="Không tìm thấy Tổ" desc={info?.error || 'Mã QR có thể đã cũ — liên hệ quản lý để lấy mã mới.'} />
        <CascadingTeamPicker tree={teamTree} onPick={(id) => router.replace(`/pph-scan?team=${encodeURIComponent(id)}`)} />
      </ScanShell>
    );
  }

  // Sau khi ghi nhận, tự chuyển sang khung kế tiếp sau ~1.8s (xem effect ở trên) — không cần quét
  // lại mã QR mới nhập được khung tiếp theo.
  if (success) {
    return (
      <ScanShell team={info.team} onClickTeamInfo={() => setShowTeamSwitcher(true)}>
        <StateCard
          icon={IconCircleCheck}
          tone="emerald"
          title="Đã ghi nhận!"
          desc={`Cập nhật khung giờ ${success.slot} thành công. Cảm ơn bạn!`}
        />
        <p className="text-center text-[11px] text-slate-400 font-semibold -mt-2">Đang chuyển sang khung tiếp theo...</p>
        {showTeamSwitcher && <TeamSwitcherModal tree={teamTree} onPick={switchToTeam} onClose={() => setShowTeamSwitcher(false)} />}
      </ScanShell>
    );
  }

  if (info.nextAction === 'wait') {
    return (
      <ScanShell team={info.team} onClickTeamInfo={() => setShowTeamSwitcher(true)} onClickSlotBadge={() => setShowSlotPanel(true)} slotBadgeLabel={info.nextSlot}>
        <StateCard icon={IconClock} tone="amber" title="Chưa tới giờ nhập" desc={`Khung tiếp theo lúc ${info.nextSlot}. Quay lại quét sau nhé.`} />
        {showSlotPanel && (
          <SlotHistoryPanel info={info} teamId={teamId} shoeModels={shoeModels} causeGroups={causeGroups} onClose={() => setShowSlotPanel(false)} onSetupSaved={() => load({ silent: true })} />
        )}
        {showTeamSwitcher && <TeamSwitcherModal tree={teamTree} onPick={switchToTeam} onClose={() => setShowTeamSwitcher(false)} />}
      </ScanShell>
    );
  }

  if (info.nextAction === 'done') {
    return (
      <ScanShell team={info.team} onClickTeamInfo={() => setShowTeamSwitcher(true)}>
        <StateCard icon={IconCircleCheck} tone="emerald" title="Đã cập nhật đủ hôm nay" desc="Cảm ơn bạn đã báo cáo đầy đủ các khung giờ hôm nay!" />
        {showTeamSwitcher && <TeamSwitcherModal tree={teamTree} onPick={switchToTeam} onClose={() => setShowTeamSwitcher(false)} />}
      </ScanShell>
    );
  }

  const isSetup = info.nextAction === 'setup';

  return (
    <ScanShell
      team={info.team}
      onClickTeamInfo={() => setShowTeamSwitcher(true)}
      onClickSlotBadge={!isSetup ? () => setShowSlotPanel(true) : undefined}
      slotBadgeLabel={!isSetup ? (info.targetSlot ?? undefined) : undefined}
    >
      <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
        <IconClock size={14} />
        <span className="flex-1">{isSetup ? 'Cập nhật đầu ca' : `Khung giờ ${info.targetSlot}`}</span>
        {countdownLabel && (
          <span
            className={`font-mono tabular-nums text-[11px] px-2 py-0.5 rounded-lg border ${
              countdownPhase === 'before-open' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white/70 border-emerald-200'
            }`}
          >
            {countdownPhase === 'before-open' ? 'mở sau ' : 'đóng sau '}
            {countdownLabel}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {isSetup ? (
          <>
            <Field label="Thời gian sản xuất (giờ) *" icon={IconClock}>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                max={24}
                step="0.5"
                value={productionHours}
                onChange={(e) => setProductionHours(e.target.value)}
                placeholder="VD: 8, 11, 13"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#006838]"
                required
              />
            </Field>
            <Field label="Số lượng công nhân hôm nay *" icon={IconUsers}>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={workerCount}
                onChange={(e) => setWorkerCount(e.target.value)}
                placeholder="VD: 42"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#006838]"
                required
              />
            </Field>
            <Field label="Model sản xuất *" icon={IconShoe}>
              <ModelAutocompleteInput value={model} onChange={setModel} shoeModels={shoeModels} placeholder="VD: 4442" required />
            </Field>
            <Field label="Sản lượng kế hoạch cả ca *" icon={IconTarget}>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={plannedQty}
                onChange={(e) => setPlannedQty(e.target.value)}
                placeholder="VD: 411"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#006838]"
                required
              />
            </Field>
            {/* Chỉ tự tính & hiện xem trước — không phải ô nhập, suy ra từ Sản lượng kế hoạch cả ca
                chia cho Thời gian sản xuất (giờ) vừa nhập ở trên, khớp đúng công thức perHourTarget
                bên server (buildPphSlots — không còn cố định chia 8 nữa). */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <IconChartBar size={13} className="text-emerald-600" />
                Mục tiêu sản lượng mỗi giờ (PPH)
              </span>
              <span className="text-sm font-black text-emerald-700">
                {plannedQty &&
                Number.isFinite(Number(plannedQty)) &&
                Number(plannedQty) > 0 &&
                productionHours &&
                Number.isFinite(Number(productionHours)) &&
                Number(productionHours) > 0
                  ? `${Math.round((Number(plannedQty) / Number(productionHours)) * 10) / 10} đôi/giờ`
                  : '—'}
              </span>
            </div>
            <Field label="Mục tiêu tỉ lệ đạt chất lượng RFT (%) *" icon={IconPercentage}>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="0.1"
                value={targetRft}
                onChange={(e) => setTargetRft(e.target.value)}
                placeholder="VD: 98"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#006838]"
                required
              />
            </Field>
          </>
        ) : (
          <>
            <Field
              label={`Số lượng làm được (${info.targetSlot}) *`}
              hint={info.perHourTarget != null ? `Mục tiêu: ${info.perHourTarget} đôi/giờ` : undefined}
              icon={IconChartBar}
            >
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={actualQty}
                onChange={(e) => setActualQty(e.target.value)}
                placeholder="VD: 45"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#006838]"
                required
                autoFocus
              />
            </Field>

            {/* Số lỗi — BẮT BUỘC nộp kèm mỗi khung, dùng tính "% Quality" (RFT) hiện ở thẻ Tổ trên
                dashboard (xem TeamPanel — ProductionPerformanceModule.tsx). Không được vượt quá Số
                lượng vừa nhập ở trên (server cũng tự kiểm tra lại). */}
            <Field label="Số lỗi (sản phẩm hỏng) *" icon={IconBug}>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={actualQty || undefined}
                value={errorCount}
                onChange={(e) => setErrorCount(e.target.value)}
                placeholder="VD: 2"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#006838]"
                required
              />
            </Field>

            {isShortfallNow && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <IconAlertTriangle size={14} className="shrink-0" />
                  Đang âm {shortfallAmount} đôi so với Mục tiêu/giờ
                </p>
                <Field label="Nhóm nguyên nhân *" icon={IconAlertTriangle}>
                  <select
                    value={causeGroupId}
                    onChange={(e) => { setCauseGroupId(e.target.value); setCauseSubId(''); setCauseDetail(''); }}
                    className="w-full px-3.5 py-3 bg-white border border-rose-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-rose-400"
                    required
                  >
                    <option value="">— Chọn nhóm nguyên nhân —</option>
                    {causeGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                    <option value={CAUSE_OTHER_ID}>Khác</option>
                  </select>
                </Field>

                {causeGroupId && !causeGroupIsOther && selectedCauseGroup && (
                  <Field label="Chi tiết nguyên nhân *" icon={IconChevronRight}>
                    <select
                      value={causeSubId}
                      onChange={(e) => { setCauseSubId(e.target.value); setCauseDetail(''); }}
                      className="w-full px-3.5 py-3 bg-white border border-rose-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-rose-400"
                      required
                    >
                      <option value="">— Chọn chi tiết —</option>
                      {selectedCauseGroup.subs.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      <option value={CAUSE_OTHER_ID}>Khác (nhập cụ thể)</option>
                    </select>
                  </Field>
                )}

                {needCauseDetail && (
                  <Field label="Mô tả cụ thể *" icon={IconPencil}>
                    <textarea
                      value={causeDetail}
                      onChange={(e) => setCauseDetail(e.target.value)}
                      placeholder="Ghi rõ nguyên nhân hụt chỉ tiêu..."
                      rows={2}
                      className="w-full px-3.5 py-3 bg-white border border-rose-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-rose-400 resize-none"
                      required
                    />
                  </Field>
                )}
                <Field label="Giải pháp *" icon={IconCircleCheck}>
                  <textarea
                    value={shortfallSolution}
                    onChange={(e) => setShortfallSolution(e.target.value)}
                    placeholder="VD: Đã gọi bảo trì, bổ sung nhân lực..."
                    rows={2}
                    className="w-full px-3.5 py-3 bg-white border border-rose-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-rose-400 resize-none"
                    required
                  />
                </Field>
              </div>
            )}
          </>
        )}

        {rememberedName && !editingName ? (
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl">
            <IconUserCheck size={16} className="text-[#006838] shrink-0" />
            <span className="flex-1 text-sm font-semibold text-slate-700 truncate">
              Báo cáo bởi <span className="font-black text-slate-900">{rememberedName}</span>
            </span>
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="text-[11px] font-bold text-[#006838] hover:underline flex items-center gap-1 shrink-0"
            >
              <IconPencil size={12} /> Đổi tên
            </button>
          </div>
        ) : (
          <Field label="Tên người báo cáo *" icon={IconUsers}>
            <input
              type="text"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="Nhập họ tên của bạn"
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#006838]"
              required
              autoFocus={!!rememberedName}
            />
            {rememberedName && (
              <button
                type="button"
                onClick={() => { setEditingName(false); setSubmittedBy(rememberedName); }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 mt-1"
              >
                Huỷ, dùng lại tên đã lưu
              </button>
            )}
          </Field>
        )}

        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">⚠️ {formError}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-[#006838] text-white text-sm font-black hover:opacity-90 disabled:opacity-50 transition"
        >
          {submitting ? 'Đang lưu...' : 'Xác Nhận Cập Nhật'}
        </button>
      </form>

      {showSlotPanel && (
        <SlotHistoryPanel info={info} teamId={teamId} shoeModels={shoeModels} causeGroups={causeGroups} onClose={() => setShowSlotPanel(false)} onSetupSaved={() => load({ silent: true })} />
      )}
      {showTeamSwitcher && <TeamSwitcherModal tree={teamTree} onPick={switchToTeam} onClose={() => setShowTeamSwitcher(false)} />}
    </ScanShell>
  );
}

// Đồng hồ đếm ngược tính theo ĐÚNG giờ Việt Nam (UTC+7) — KHÔNG phụ thuộc múi giờ đặt trên điện
// thoại (đề phòng máy bị đặt sai giờ/múi giờ), khớp chính xác cách backend tính pphNowVN() trong
// _worker.js: cộng UTC+7 vào mốc UTC thật rồi ĐỌC bằng các hàm getUTC* của kết quả.
function vnNowMs(): number {
  return Date.now() + 7 * 60 * 60 * 1000;
}

// Parse nhãn "HH:MM" thành mốc "giờ VN hôm nay" (cùng hệ quy chiếu với vnNowMs()) — dùng cho cả
// đồng hồ đếm ngược hiển thị lẫn mốc tự tải lại khi khung kế tiếp mở (khớp đúng luật
// pphResolveStatus() phía backend — đọc thẳng giờ MỞ/ĐÓNG đã cấu hình, không còn trừ hao cố định).
function slotLabelToDeadlineVNMs(slotLabel: string): number {
  const [h, m] = slotLabel.split(':').map(Number);
  const vnNow = new Date(vnNowMs());
  return Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), h, m, 0, 0);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDurationMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function ScanShell({
  team,
  children,
  onClickSlotBadge,
  slotBadgeLabel,
  onClickTeamInfo,
}: {
  team?: { name: string; lineName: string; areaName: string; factoryName: string };
  children: React.ReactNode;
  onClickSlotBadge?: () => void;
  slotBadgeLabel?: string;
  onClickTeamInfo?: () => void;
}) {
  return (
    <div
      className="min-h-screen bg-[#f4f7f5] flex items-start justify-center px-4 sm:px-6 pb-4 sm:pb-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
    >
      {/* Nút tải lại trang — CỐ ĐỊNH góc phải màn hình (fixed theo viewport thật, không theo luồng
          nội dung), to/rõ để dễ bấm bằng ngón tay cái trên điện thoại — tự khắc phục nếu trang bị
          kẹt/cũ (nghi do cache/Service Worker cũ, xem ghi chú ở effect huỷ SW phía dưới) mà không
          cần hiểu kỹ thuật gì, luôn hiện sẵn thay vì chỉ hiện sau khi tải lâu như trước. Reload THẬT
          (window.location.reload) chứ không chỉ gọi lại API — nếu đúng do JS cũ bị cache thì gọi
          lại API bằng chính JS cũ đó cũng không sửa được gì, phải tải lại trang mới có cơ hội lấy
          bản JS mới nhất.
          top dùng safe-area-inset-top (+ chút đệm) THAY VÌ top-4 cứng — điện thoại có tai thỏ/thanh
          trạng thái đè lên (như ảnh người dùng gửi) thì nút vẫn tự đẩy xuống dưới vùng đó, không
          bị che/khó bấm. */}
      <button
        type="button"
        onClick={() => window.location.reload()}
        title="Tải lại trang"
        className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#006838] text-white shadow-lg shadow-emerald-900/20 hover:opacity-90 active:scale-95 transition"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <IconRefresh size={26} />
      </button>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-4 justify-center">
          <img src="/images/tbs-logo.png" alt="TBS Group" className="h-7 w-auto object-contain" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Hiệu Suất Nhà Máy</span>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/70 p-5 sm:p-6">
          {team && (
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
              {onClickTeamInfo ? (
                <button
                  type="button"
                  onClick={onClickTeamInfo}
                  title="Bấm để chọn Tổ khác"
                  className="flex items-center gap-3 flex-1 min-w-0 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <IconBuildingFactory2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 text-sm truncate flex items-center gap-1">
                      <span className="truncate">{team.name}</span>
                      <IconArrowsLeftRight size={13} className="text-slate-300 group-hover:text-[#006838] shrink-0" />
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold truncate">
                      {[team.factoryName, team.areaName, team.lineName].filter(Boolean).join(' › ')}
                    </div>
                  </div>
                </button>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <IconBuildingFactory2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 text-sm truncate">{team.name}</div>
                    <div className="text-[11px] text-slate-400 font-semibold truncate">
                      {[team.factoryName, team.areaName, team.lineName].filter(Boolean).join(' › ')}
                    </div>
                  </div>
                </>
              )}
              {onClickSlotBadge && slotBadgeLabel && (
                <button
                  type="button"
                  onClick={onClickSlotBadge}
                  title="Xem tất cả khung giờ trong ngày"
                  className="shrink-0 flex items-center gap-1 pl-2.5 pr-1.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#006838]/60 hover:bg-emerald-50 transition-colors"
                >
                  <IconClock size={13} className="text-[#006838]" />
                  <span className="text-xs font-black text-slate-700">{slotBadgeLabel}</span>
                  <IconChevronRight size={13} className="text-slate-400" />
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

type PickGridItem = { id: string; name: string; drill?: boolean };

function PickerGrid({ items, onSelect }: { items: PickGridItem[]; onSelect: (item: PickGridItem) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onSelect(it)}
          className="flex items-center justify-between gap-1.5 px-3.5 py-3 rounded-xl border border-slate-200 bg-white hover:border-[#006838]/60 hover:bg-emerald-50 text-left transition-colors"
        >
          {/* Xuống dòng tự nhiên (không truncate 1 dòng) — tên Nhà máy/Xưởng ở đây có thể dài (VD
              "VĂN PHÒNG CHUỖI SKECHERS") dễ bị cắt mất chữ nếu ép 1 dòng. min-w-0 để span thật sự
              co lại và xuống dòng được trong flex container, không đẩy nút rộng ra ngoài lưới. */}
          <span className="min-w-0 flex-1 text-sm font-black leading-tight text-slate-800">{it.name}</span>
          {it.drill && <IconChevronRight size={14} className="text-slate-400 shrink-0" />}
        </button>
      ))}
    </div>
  );
}

function PickerBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[11px] font-bold text-[#006838] hover:underline">
      {label}
    </button>
  );
}

type CascadeStep =
  | { level: 'factory' }
  | { level: 'area'; factory: PphTreeFactory }
  | { level: 'pick'; factory: PphTreeFactory; area: PphTreeArea }
  | { level: 'team'; factory: PphTreeFactory; area: PphTreeArea; line: PphTreeLine };

// Chọn tay Nhà máy › Xưởng › Chuyền/Tổ — dùng khi KHÔNG có mã Tổ trên URL: mã QR CHUNG (?pick=1,
// xem PphGeneralQrView.tsx) luôn đi qua đây; cũng là lưới an toàn khi mã riêng bị hỏng/thiếu (thay
// hẳn ô tìm kiếm phẳng trước đây). Bám đúng quy tắc "lá của cây" bên server
// (pphCollectFactoryLeaves() trong _worker.js) — Xưởng trống hẳn tự nó là điểm dừng (VD "Đầu vào"),
// Tổ có thể nằm thẳng dưới Xưởng hoặc dưới 1 Chuyền, Chuyền không có Tổ con cũng tự nó là điểm dừng.
function CascadingTeamPicker({ tree, onPick }: { tree: PphTreeFactory[]; onPick: (id: string) => void }) {
  const [step, setStep] = useState<CascadeStep>({ level: 'factory' });

  if (tree.length === 0) {
    return <p className="mt-4 text-center text-xs text-slate-400 font-semibold">Đang tải danh sách Nhà máy...</p>;
  }

  if (step.level === 'factory') {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-center text-xs font-bold text-slate-500">Chọn Nhà máy:</p>
        <PickerGrid
          items={tree.map((f) => ({ id: f.id, name: f.name }))}
          onSelect={(it) => {
            const factory = tree.find((f) => f.id === it.id);
            if (factory) setStep({ level: 'area', factory });
          }}
        />
      </div>
    );
  }

  if (step.level === 'area') {
    const { factory } = step;
    return (
      <div className="mt-4 space-y-2">
        <PickerBack label="← Nhà máy khác" onClick={() => setStep({ level: 'factory' })} />
        <p className="text-center text-xs font-bold text-slate-500">Chọn Xưởng:</p>
        <PickerGrid
          items={factory.areas.map((a) => ({ id: a.id, name: a.name }))}
          onSelect={(it) => {
            const area = factory.areas.find((a) => a.id === it.id);
            if (!area) return;
            if (area.lines.length === 0 && area.teams.length === 0) {
              onPick(area.id); // Xưởng trống hẳn — tự nó là điểm quét.
              return;
            }
            setStep({ level: 'pick', factory, area });
          }}
        />
      </div>
    );
  }

  if (step.level === 'pick') {
    const { factory, area } = step;
    const items: PickGridItem[] = [
      ...area.teams.map((t) => ({ id: t.id, name: t.name })),
      ...area.lines.map((l) => (l.teams.length === 0 ? { id: l.id, name: l.name } : { id: l.id, name: l.name, drill: true })),
    ];
    return (
      <div className="mt-4 space-y-2">
        <PickerBack label="← Xưởng khác" onClick={() => setStep({ level: 'area', factory })} />
        <p className="text-center text-xs font-bold text-slate-500">Chọn Chuyền hoặc Tổ:</p>
        <PickerGrid
          items={items}
          onSelect={(it) => {
            if (!it.drill) {
              onPick(it.id);
              return;
            }
            const line = area.lines.find((l) => l.id === it.id);
            if (line) setStep({ level: 'team', factory, area, line });
          }}
        />
      </div>
    );
  }

  const { factory, area, line } = step;
  return (
    <div className="mt-4 space-y-2">
      <PickerBack label="← Chuyền khác" onClick={() => setStep({ level: 'pick', factory, area })} />
      <p className="text-center text-xs font-bold text-slate-500">Chọn Tổ:</p>
      <PickerGrid items={line.teams.map((t) => ({ id: t.id, name: t.name }))} onSelect={(it) => onPick(it.id)} />
    </div>
  );
}

// Modal "Chọn Tổ khác" — mở khi bấm vào tên Tổ ở đầu trang (mọi màn hình, xem onClickTeamInfo ở
// ScanShell). Dùng lại y hệt CascadingTeamPicker (luôn bắt đầu lại từ Nhà máy vì component tự mount
// mới mỗi lần modal mở, state step tự reset) — không cần quét lại mã QR để đổi Tổ.
function TeamSwitcherModal({ tree, onPick, onClose }: { tree: PphTreeFactory[]; onPick: (id: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-sm">Chọn Tổ khác</h3>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <IconX size={14} className="text-slate-500" />
          </button>
        </div>
        <div className="p-4 pb-5">
          <CascadingTeamPicker tree={tree} onPick={onPick} />
        </div>
      </div>
    </div>
  );
}

// Ô nhập Model kèm gợi ý ảnh — DÙNG CHUNG cho form nhập chính LẪN form sửa trong SlotHistoryPanel
// (trước đây chỉ viết 1 lần trong form chính, giờ tách ra để form sửa dùng lại y hệt, tránh gõ
// nhầm lần 2 ngay trong lúc sửa lỗi gõ nhầm lần 1).
function ModelAutocompleteInput({
  value,
  onChange,
  shoeModels,
  placeholder,
  required,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  shoeModels: ShoeModelSuggestion[];
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Khớp theo TIỀN TỐ (không phân biệt hoa/thường) — gõ "444" gợi ý cả "4442" lẫn "4442EW".
  // Giới hạn 6 gợi ý cho gọn, đủ dùng vì danh sách chỉ ~100-200 mã.
  const suggestions = useMemo(() => {
    const q = value.trim().toUpperCase();
    if (!q) return [];
    return shoeModels.filter((m) => m.code.toUpperCase().startsWith(q)).slice(0, 6);
  }, [value, shoeModels]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        // Delay tắt để onMouseDown ở gợi ý bên dưới kịp bắt trước khi input mất focus — dùng
        // onMouseDown (không phải onClick) ở gợi ý cũng vì lý do tương tự.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#006838]"
        autoComplete="off"
        required={required}
        autoFocus={autoFocus}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s.code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s.code);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-emerald-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover border border-slate-200" />
              <span className="truncate text-sm font-bold text-slate-800">{s.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 1 dòng chi tiết Đầu ca CÓ THỂ SỬA — dùng chung khuôn hiển thị/sửa cho cả 5 field cho sửa được
// (Thời gian sản xuất, Model, Số lượng công nhân, Sản lượng kế hoạch cả ca, Mục tiêu RFT), chỉ
// khác Ô NHẬP thật sự (renderInput — Model cần gợi ý ảnh riêng qua ModelAutocompleteInput, các
// field còn lại chỉ cần input số thường).
function EditableSetupField({
  label,
  displayValue,
  editing,
  saving,
  error,
  onStartEdit,
  onCancel,
  onSave,
  renderInput,
}: {
  label: string;
  displayValue: string | number;
  editing: boolean;
  saving: boolean;
  error: string | null;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  renderInput: () => React.ReactNode;
}) {
  if (editing) {
    return (
      <div className="space-y-1.5 rounded-lg bg-white p-2 border border-emerald-200">
        <span className="text-slate-400 font-semibold">{label}</span>
        {renderInput()}
        {error && <p className="text-[10px] font-bold text-rose-600">{error}</p>}
        <div className="flex gap-1.5 pt-0.5">
          <button type="button" disabled={saving} onClick={onSave} className="flex-1 rounded-lg bg-[#006838] py-1.5 text-[11px] font-black text-white disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button type="button" disabled={saving} onClick={onCancel} className="flex-1 rounded-lg bg-slate-100 py-1.5 text-[11px] font-black text-slate-600 disabled:opacity-50">
            Huỷ
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <DetailRow label={label} value={displayValue} />
      </div>
      <button type="button" onClick={onStartEdit} title={`Sửa ${label}`} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-emerald-50 hover:text-[#006838]">
        <IconPencil size={13} />
      </button>
    </div>
  );
}

// Bảng xem lại TẤT CẢ khung giờ trong ngày — bấm vào khung ĐÃ NHẬP để xem lại số lượng. Thời gian
// sản xuất/Model/Số lượng công nhân/Sản lượng kế hoạch cả ca/Mục tiêu RFT ở dòng Đầu ca, VÀ Số
// lượng làm được/Số lỗi ở các khung giờ thường đều cho SỬA (nhiều khi gõ lộn lúc quét) — xem
// EditableSetupField (Đầu ca) và khối sửa
// Số lượng ngay trong SlotHistoryPanel (khung giờ thường, có kèm form Nguyên nhân/Giải pháp hụt chỉ
// tiêu nếu số mới sau khi sửa vẫn/mới hụt Mục tiêu/giờ). Sửa xong gọi onSetupSaved() để trang cha
// tải lại info NGẦM (không bật loading — xem ghi chú ở load() phía trên), Dashboard các cấp cũng tự
// cập nhật theo vì PUT /api/pph/scan đã tự xoá cache liên quan.
type SetupFieldKey = 'model' | 'workerCount' | 'plannedQty' | 'productionHours' | 'targetRft';
const SETUP_FIELD_LABELS: Record<SetupFieldKey, string> = {
  model: 'Model sản xuất',
  workerCount: 'Số lượng công nhân',
  plannedQty: 'Sản lượng kế hoạch cả ca',
  productionHours: 'Thời gian sản xuất',
  targetRft: 'Mục tiêu tỉ lệ đạt chất lượng RFT',
};

function SlotHistoryPanel({
  info,
  teamId,
  shoeModels,
  causeGroups,
  onClose,
  onSetupSaved,
}: {
  info: ScanInfo;
  teamId: string;
  shoeModels: ShoeModelSuggestion[];
  causeGroups: ShortfallCauseGroup[];
  onClose: () => void;
  onSetupSaved: () => void;
}) {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  // Chỉ 1 field Đầu ca được sửa TẠI 1 THỜI ĐIỂM (đúng UX cũ) — editingField null = không sửa gì.
  const [editingField, setEditingField] = useState<SetupFieldKey | null>(null);
  const [fieldDraft, setFieldDraft] = useState('');
  const [savingField, setSavingField] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  // ---- Sửa Số lượng làm được + Số lỗi của 1 khung giờ thường (không phải Đầu ca) ----
  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft] = useState('');
  const [errorDraft, setErrorDraft] = useState('');
  const [qtyCauseGroupId, setQtyCauseGroupId] = useState('');
  const [qtyCauseSubId, setQtyCauseSubId] = useState('');
  const [qtyCauseDetail, setQtyCauseDetail] = useState('');
  const [qtySolution, setQtySolution] = useState('');
  const [qtySaving, setQtySaving] = useState(false);
  const [qtyError, setQtyError] = useState<string | null>(null);

  const parsedQtyDraft = qtyDraft.trim() === '' ? null : Number(qtyDraft);
  // info.perHourTarget server đã làm tròn nguyên sẵn — dùng chung công thức với form nộp chính
  // (shortfallAmount/isShortfallNow phía trên) để kết quả "có hụt hay không" luôn khớp nhau.
  const isShortfallQtyDraft =
    info.perHourTarget != null && info.perHourTarget > 0 && parsedQtyDraft != null && Number.isFinite(parsedQtyDraft) && parsedQtyDraft < info.perHourTarget;
  const qtyCauseGroup = causeGroups.find((g) => g.id === qtyCauseGroupId) || null;
  const qtyCauseGroupIsOther = qtyCauseGroupId === CAUSE_OTHER_ID;
  const qtyCauseSubIsOther = qtyCauseSubId === CAUSE_OTHER_ID;
  const qtyNeedCauseDetail = qtyCauseGroupIsOther || qtyCauseSubIsOther;

  const entries = info.entries || [];
  const currentTarget = info.nextAction === 'quantity' || info.nextAction === 'setup' ? info.targetSlot : null;

  function startEditQty(e: PphSlotEntry) {
    setEditingQty(true);
    setQtyDraft(e.actualQty != null ? String(e.actualQty) : '');
    setErrorDraft(e.errorCount != null ? String(e.errorCount) : '');
    setQtyCauseGroupId('');
    setQtyCauseSubId('');
    setQtyCauseDetail('');
    setQtySolution('');
    setQtyError(null);
  }
  function cancelEditQty() {
    setEditingQty(false);
    setQtyError(null);
  }
  async function saveQty(slot: string) {
    const qty = Number(qtyDraft);
    if (!Number.isFinite(qty) || qty < 0) {
      setQtyError('Vui lòng nhập đúng Số lượng');
      return;
    }
    const errCount = Number(errorDraft);
    if (!Number.isFinite(errCount) || errCount < 0) {
      setQtyError('Vui lòng nhập đúng Số lỗi');
      return;
    }
    if (errCount > qty) {
      setQtyError('Số lỗi không thể lớn hơn Số lượng');
      return;
    }
    const body: Record<string, unknown> = { teamId, slot, actualQty: qty, errorCount: errCount };
    if (isShortfallQtyDraft) {
      if (!qtyCauseGroupId) {
        setQtyError('Số lượng mới đang thấp hơn mục tiêu/giờ — vui lòng chọn Nhóm nguyên nhân');
        return;
      }
      if (!qtyCauseGroupIsOther && !qtyCauseSubId) {
        setQtyError('Vui lòng chọn Chi tiết nguyên nhân');
        return;
      }
      if (qtyNeedCauseDetail && !qtyCauseDetail.trim()) {
        setQtyError('Vui lòng mô tả nguyên nhân cụ thể');
        return;
      }
      if (!qtySolution.trim()) {
        setQtyError('Vui lòng nhập Giải pháp');
        return;
      }
      body.shortfallCauseGroupId = qtyCauseGroupId;
      body.shortfallCauseSubId = qtyCauseSubId;
      body.shortfallDetail = qtyCauseDetail.trim();
      body.shortfallSolution = qtySolution.trim();
    }
    setQtySaving(true);
    setQtyError(null);
    try {
      const res = await fetch('/api/pph/scan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json());
      if (res?.success) {
        setEditingQty(false);
        onSetupSaved();
      } else {
        setQtyError(res?.error || 'Không sửa được — thử lại');
      }
    } catch {
      setQtyError('Không kết nối được tới hệ thống');
    } finally {
      setQtySaving(false);
    }
  }

  function startEdit(field: SetupFieldKey, currentValue: string) {
    setEditingField(field);
    setFieldDraft(currentValue);
    setFieldError(null);
  }
  function cancelEdit() {
    setEditingField(null);
    setFieldError(null);
  }
  async function saveField() {
    if (!editingField) return;
    const trimmed = fieldDraft.trim();
    if (!trimmed) {
      setFieldError(`Vui lòng nhập ${SETUP_FIELD_LABELS[editingField]}`);
      return;
    }
    const body: {
      teamId: string;
      model?: string;
      workerCount?: number;
      plannedQty?: number;
      productionHours?: number;
      targetRft?: number;
    } = { teamId };
    if (editingField === 'model') {
      body.model = trimmed;
    } else {
      const num = Number(trimmed);
      // targetRft cho phép 0-100 (0% là giá trị hợp lệ, không bị chặn bởi num <= 0 như các field số
      // lượng khác); productionHours tối đa 24 giờ/ngày — khớp đúng giới hạn backend đang kiểm.
      if (editingField === 'targetRft') {
        if (!Number.isFinite(num) || num < 0 || num > 100) {
          setFieldError('Vui lòng nhập đúng Mục tiêu tỉ lệ đạt chất lượng RFT (0-100%)');
          return;
        }
      } else if (editingField === 'productionHours') {
        if (!Number.isFinite(num) || num <= 0 || num > 24) {
          setFieldError('Vui lòng nhập đúng Thời gian sản xuất (giờ, tối đa 24)');
          return;
        }
      } else if (!Number.isFinite(num) || num <= 0) {
        setFieldError(`Vui lòng nhập đúng ${SETUP_FIELD_LABELS[editingField]}`);
        return;
      }
      body[editingField] = num;
    }
    setSavingField(true);
    setFieldError(null);
    try {
      const res = await fetch('/api/pph/scan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json());
      if (res?.success) {
        setEditingField(null);
        onSetupSaved();
      } else {
        setFieldError(res?.error || 'Không sửa được — thử lại');
      }
    } catch {
      setFieldError('Không kết nối được tới hệ thống');
    } finally {
      setSavingField(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-sm">Các khung giờ hôm nay</h3>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <IconX size={14} className="text-slate-500" />
          </button>
        </div>
        <div className="p-3 space-y-1.5">
          {entries.map((e) => {
            const isCurrent = e.slot === currentTarget;
            const isSetupRow = e.slot === '08:00';
            const isExpanded = expandedSlot === e.slot;
            const label = isSetupRow ? 'Đầu ca' : e.slot;

            let statusNode: React.ReactNode;
            if (e.filled) {
              statusNode = <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ĐÃ NHẬP</span>;
            } else if (isCurrent) {
              statusNode = <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">ĐANG MỞ</span>;
            } else {
              statusNode = <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full flex items-center gap-0.5"><IconLock size={9} /> CHƯA TỚI</span>;
            }

            return (
              <div key={e.slot} className="rounded-xl border border-slate-100 overflow-hidden">
                <button
                  type="button"
                  disabled={!e.filled}
                  onClick={() => {
                    if (!e.filled) return;
                    setExpandedSlot(isExpanded ? null : e.slot);
                    // Đóng/đổi khung giờ đang xem thì thoát luôn chế độ sửa (nếu đang dở) — tránh mở
                    // lại đúng khung Đầu ca hoặc khung giờ khác vẫn còn kẹt form sửa dở từ lượt trước.
                    setEditingField(null);
                    setFieldError(null);
                    setEditingQty(false);
                    setQtyError(null);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left transition-colors ${
                    e.filled ? 'bg-white hover:bg-slate-50 cursor-pointer' : isCurrent ? 'bg-amber-50/50' : 'bg-slate-50/60'
                  }`}
                >
                  <span className={`text-sm font-black ${e.filled ? 'text-slate-900' : isCurrent ? 'text-amber-700' : 'text-slate-400'}`}>
                    {label}
                  </span>
                  <span className="flex items-center gap-2">
                    {statusNode}
                    {e.filled && <IconChevronRight size={14} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
                  </span>
                </button>
                {isExpanded && e.filled && (
                  <div className="px-3.5 pb-3.5 pt-1 bg-slate-50/60 space-y-1 text-xs">
                    {isSetupRow ? (
                      <>
                        <EditableSetupField
                          label="Thời gian sản xuất"
                          displayValue={info.setup?.productionHours != null ? `${info.setup.productionHours} giờ` : '—'}
                          editing={editingField === 'productionHours'}
                          saving={savingField}
                          error={editingField === 'productionHours' ? fieldError : null}
                          onStartEdit={() => startEdit('productionHours', info.setup?.productionHours != null ? String(info.setup.productionHours) : '')}
                          onCancel={cancelEdit}
                          onSave={saveField}
                          renderInput={() => (
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0.5"
                              max="24"
                              step="0.5"
                              value={fieldDraft}
                              onChange={(ev) => setFieldDraft(ev.target.value)}
                              autoFocus
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006838]"
                            />
                          )}
                        />
                        <EditableSetupField
                          label="Số lượng công nhân"
                          displayValue={e.workerCount ?? '—'}
                          editing={editingField === 'workerCount'}
                          saving={savingField}
                          error={editingField === 'workerCount' ? fieldError : null}
                          onStartEdit={() => startEdit('workerCount', e.workerCount != null ? String(e.workerCount) : '')}
                          onCancel={cancelEdit}
                          onSave={saveField}
                          renderInput={() => (
                            <input
                              type="number"
                              inputMode="numeric"
                              min="1"
                              value={fieldDraft}
                              onChange={(ev) => setFieldDraft(ev.target.value)}
                              autoFocus
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006838]"
                            />
                          )}
                        />
                        <EditableSetupField
                          label="Model sản xuất"
                          displayValue={e.model ?? '—'}
                          editing={editingField === 'model'}
                          saving={savingField}
                          error={editingField === 'model' ? fieldError : null}
                          onStartEdit={() => startEdit('model', e.model ?? '')}
                          onCancel={cancelEdit}
                          onSave={saveField}
                          renderInput={() => (
                            <ModelAutocompleteInput value={fieldDraft} onChange={setFieldDraft} shoeModels={shoeModels} placeholder="VD: 4442" autoFocus />
                          )}
                        />
                        <EditableSetupField
                          label="Sản lượng kế hoạch cả ca"
                          displayValue={e.plannedQty ?? '—'}
                          editing={editingField === 'plannedQty'}
                          saving={savingField}
                          error={editingField === 'plannedQty' ? fieldError : null}
                          onStartEdit={() => startEdit('plannedQty', e.plannedQty != null ? String(e.plannedQty) : '')}
                          onCancel={cancelEdit}
                          onSave={saveField}
                          renderInput={() => (
                            <input
                              type="number"
                              inputMode="numeric"
                              min="1"
                              value={fieldDraft}
                              onChange={(ev) => setFieldDraft(ev.target.value)}
                              autoFocus
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006838]"
                            />
                          )}
                        />
                        <DetailRow
                          label="Mục tiêu sản lượng mỗi giờ (PPH)"
                          value={
                            e.plannedQty && info.setup?.productionHours
                              ? `${Math.round((e.plannedQty / info.setup.productionHours) * 10) / 10} đôi/giờ`
                              : '—'
                          }
                        />
                        <EditableSetupField
                          label="Mục tiêu tỉ lệ đạt chất lượng RFT"
                          displayValue={e.targetRft != null ? `${e.targetRft}%` : '—'}
                          editing={editingField === 'targetRft'}
                          saving={savingField}
                          error={editingField === 'targetRft' ? fieldError : null}
                          onStartEdit={() => startEdit('targetRft', e.targetRft != null ? String(e.targetRft) : '')}
                          onCancel={cancelEdit}
                          onSave={saveField}
                          renderInput={() => (
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              max="100"
                              step="0.1"
                              value={fieldDraft}
                              onChange={(ev) => setFieldDraft(ev.target.value)}
                              autoFocus
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006838]"
                            />
                          )}
                        />
                      </>
                    ) : editingQty ? (
                      <div className="space-y-1.5 rounded-lg bg-white p-2 border border-emerald-200">
                        <span className="text-slate-400 font-semibold">Số lượng làm được / Số lỗi</span>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={qtyDraft}
                            onChange={(ev) => setQtyDraft(ev.target.value)}
                            placeholder="Số lượng"
                            autoFocus
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006838]"
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={qtyDraft || undefined}
                            value={errorDraft}
                            onChange={(ev) => setErrorDraft(ev.target.value)}
                            placeholder="Số lỗi"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006838]"
                          />
                        </div>

                        {isShortfallQtyDraft && (
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 space-y-2">
                            <p className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                              <IconAlertTriangle size={12} className="shrink-0" />
                              Số mới vẫn/đang hụt Mục tiêu/giờ ({info.perHourTarget} đôi/giờ) — cần nhập lại lý do
                            </p>
                            <select
                              value={qtyCauseGroupId}
                              onChange={(ev) => { setQtyCauseGroupId(ev.target.value); setQtyCauseSubId(''); setQtyCauseDetail(''); }}
                              className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-rose-400"
                            >
                              <option value="">— Chọn nhóm nguyên nhân —</option>
                              {causeGroups.map((g) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                              <option value={CAUSE_OTHER_ID}>Khác</option>
                            </select>
                            {qtyCauseGroupId && !qtyCauseGroupIsOther && qtyCauseGroup && (
                              <select
                                value={qtyCauseSubId}
                                onChange={(ev) => { setQtyCauseSubId(ev.target.value); setQtyCauseDetail(''); }}
                                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-rose-400"
                              >
                                <option value="">— Chọn chi tiết —</option>
                                {qtyCauseGroup.subs.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                                <option value={CAUSE_OTHER_ID}>Khác (nhập cụ thể)</option>
                              </select>
                            )}
                            {qtyNeedCauseDetail && (
                              <textarea
                                value={qtyCauseDetail}
                                onChange={(ev) => setQtyCauseDetail(ev.target.value)}
                                placeholder="Mô tả nguyên nhân cụ thể..."
                                rows={2}
                                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-rose-400 resize-none"
                              />
                            )}
                            <textarea
                              value={qtySolution}
                              onChange={(ev) => setQtySolution(ev.target.value)}
                              placeholder="Giải pháp..."
                              rows={2}
                              className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-rose-400 resize-none"
                            />
                          </div>
                        )}

                        {qtyError && <p className="text-[10px] font-bold text-rose-600">{qtyError}</p>}
                        <div className="flex gap-1.5 pt-0.5">
                          <button type="button" disabled={qtySaving} onClick={() => saveQty(e.slot)} className="flex-1 rounded-lg bg-[#006838] py-1.5 text-[11px] font-black text-white disabled:opacity-50">
                            {qtySaving ? 'Đang lưu...' : 'Lưu'}
                          </button>
                          <button type="button" disabled={qtySaving} onClick={cancelEditQty} className="flex-1 rounded-lg bg-slate-100 py-1.5 text-[11px] font-black text-slate-600 disabled:opacity-50">
                            Huỷ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0 space-y-1">
                            <DetailRow label="Số lượng làm được" value={e.actualQty ?? '—'} />
                            <DetailRow label="Số lỗi" value={e.errorCount ?? '—'} />
                          </div>
                          <button type="button" onClick={() => startEditQty(e)} title="Sửa Số lượng làm được" className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-emerald-50 hover:text-[#006838]">
                            <IconPencil size={13} />
                          </button>
                        </div>
                        {(e.shortfallReason || e.shortfallSolution) && (
                          <div className="pt-1.5 mt-1.5 border-t border-rose-100 space-y-1">
                            <p className="text-rose-600 font-black text-[11px]">⚠️ Hụt mục tiêu/giờ hôm đó:</p>
                            {e.shortfallReason && <DetailRow label="Nguyên nhân" value={e.shortfallReason} />}
                            {e.shortfallSolution && <DetailRow label="Giải pháp" value={e.shortfallSolution} />}
                          </div>
                        )}
                      </>
                    )}
                    {!editingQty && (
                      <p className="text-[10px] text-slate-400 italic pt-1">
                        {isSetupRow
                          ? 'Thời gian sản xuất, Số lượng công nhân, Model, Sản lượng kế hoạch, Mục tiêu RFT sửa được (bấm ✎) — số liệu khác đã khoá.'
                          : 'Nhập lộn thì bấm ✎ để sửa lại Số lượng làm được.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 font-semibold">{label}</span>
      <span className="text-slate-800 font-black">{value}</span>
    </div>
  );
}

function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  icon: typeof IconUsers;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      {/* Nhãn + Mục tiêu chung 1 hàng — nhãn bên trái (co lại/rút gọn nếu thiếu chỗ), mục tiêu ghim
          bên phải dạng thẻ nhỏ, không bị đẩy xuống dòng 2 như trước. */}
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 min-w-0 text-xs font-bold text-slate-600">
          <Icon size={13} className="text-slate-400 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        {hint && (
          <span className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const TONE_CLS: Record<string, { bg: string; text: string; iconBg: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', iconBg: 'bg-rose-100' },
};

function StateCard({
  icon: Icon,
  tone,
  title,
  desc,
}: {
  icon: typeof IconCircleCheck;
  tone: 'emerald' | 'amber' | 'rose';
  title: string;
  desc: string;
}) {
  const t = TONE_CLS[tone];
  return (
    <div className="text-center py-6 space-y-3">
      <div className={`w-14 h-14 mx-auto rounded-2xl ${t.iconBg} ${t.text} flex items-center justify-center`}>
        <Icon size={26} />
      </div>
      <h3 className="font-black text-slate-900 text-base">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed px-2">{desc}</p>
    </div>
  );
}
