"use client";

// Quét barcode/QR bằng camera sau.
// 1) BarcodeDetector có sẵn của trình duyệt (Chrome/Edge Android).
// 2) Không có (iPhone/Safari): zxing-cpp chạy WebAssembly qua gói barcode-detector, file .wasm tự host tại /vendor.
// 3) Không nạp được WebAssembly: ZXing JavaScript tự host tại /vendor.
// Mỗi lượt chỉ giải mã dải giữa khung (vùng khung xanh) cho ảnh rõ, nhanh; cứ vài lượt thử thêm cả khung hình.
import React, { useEffect, useRef, useState } from "react";
import { IconCameraOff } from "@tabler/icons-react";

const ZXING_JS_SRC = "/vendor/zxing-library-0.21.3.min.js";
const ZXING_WASM_SRC = "/vendor/zxing_reader-3.1.3.wasm";

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = (new (opts?: { formats: string[] }) => Detector) & { getSupportedFormats?: () => Promise<string[]> };
type ZXingResult = { getText(): string };
type ZXingReader = {
  decodeFromConstraints: (constraints: MediaStreamConstraints, video: HTMLVideoElement, cb: (result: ZXingResult | null) => void) => Promise<void>;
  reset: () => void;
};
type ZXingGlobal = {
  BrowserMultiFormatReader: new (hints?: Map<unknown, unknown>, timeBetweenScansMillis?: number) => ZXingReader;
  DecodeHintType: { TRY_HARDER: unknown; POSSIBLE_FORMATS: unknown };
  BarcodeFormat: Record<string, unknown>;
};

/** Các loại mã hay gặp trong kho: nhãn vật tư (Code128/39/93, ITF, Codabar), mã hàng bán lẻ (EAN/UPC), QR, DataMatrix */
const FORMATS = ["code_128", "code_39", "code_93", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar", "qr_code", "data_matrix"];

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
};

/** Dải giữa khung hình ứng với khung xanh: rộng 90%, cao 40% */
const CROP = { x: 0.05, y: 0.3, w: 0.9, h: 0.4 };

/** Detector WebAssembly (zxing-cpp); nạp một lần, file .wasm lấy từ server của mình */
let wasmDetectorPromise: Promise<DetectorCtor> | null = null;
function loadWasmDetector(): Promise<DetectorCtor> {
  if (!wasmDetectorPromise) {
    wasmDetectorPromise = import("barcode-detector/ponyfill").then(async (m) => {
      await m.prepareZXingModule({
        overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? ZXING_WASM_SRC : prefix + path) },
        fireImmediately: true,
      });
      return m.BarcodeDetector as unknown as DetectorCtor;
    });
    wasmDetectorPromise.catch(() => { wasmDetectorPromise = null; });
  }
  return wasmDetectorPromise;
}

function loadZXingJs(): Promise<ZXingGlobal> {
  const w = window as unknown as { ZXing?: ZXingGlobal };
  if (w.ZXing) return Promise.resolve(w.ZXing);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = ZXING_JS_SRC;
    s.async = true;
    s.onload = () => (w.ZXing ? resolve(w.ZXing) : reject(new Error("ZXing không nạp được")));
    s.onerror = () => reject(new Error("Không tải được thư viện quét"));
    document.head.appendChild(s);
  });
}

/** Bật lấy nét liên tục nếu camera hỗ trợ (Android); iPhone tự lấy nét nên bỏ qua lỗi */
function enableContinuousFocus(stream: MediaStream | null) {
  try {
    const track = stream?.getVideoTracks()[0];
    const caps = (track?.getCapabilities?.() || {}) as { focusMode?: string[] };
    if (track && caps.focusMode?.includes("continuous")) {
      track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => null);
    }
  } catch {}
}

/** paused: tạm ngừng giải mã (camera vẫn mở), ví dụ khi đang hiện màn xác nhận sau khi quét */
export default function BarcodeScanner({ onDetected, onClose, paused = false }: { onDetected: (code: string) => void; onClose: () => void; paused?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const cbRef = useRef(onDetected);
  const pausedRef = useRef(paused);
  const [error, setError] = useState("");
  const [engine, setEngine] = useState("");
  const [lastCode, setLastCode] = useState("");
  cbRef.current = onDetected;
  pausedRef.current = paused;

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let reader: ZXingReader | null = null;

    const emit = (raw: string) => {
      const code = String(raw || "").trim();
      if (!code || pausedRef.current) return;
      const now = Date.now();
      if (code === lastRef.current.code && now - lastRef.current.at < 1500) return; // bỏ qua mã trùng liên tiếp
      lastRef.current = { code, at: now };
      setLastCode(code);
      try { navigator.vibrate?.(60); } catch {}
      cbRef.current(code);
    };

    /** Vòng quét: cắt dải giữa khung ra canvas rồi giải mã; cứ 3 lượt thử cả khung hình */
    const runLoop = (video: HTMLVideoElement, detector: Detector) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      let tick = 0;
      const step = async () => {
        if (stopped) return;
        if (!pausedRef.current && video.readyState >= 2 && video.videoWidth && ctx) {
          const vw = video.videoWidth, vh = video.videoHeight;
          const full = tick++ % 3 === 2;
          const sx = full ? 0 : Math.round(vw * CROP.x), sy = full ? 0 : Math.round(vh * CROP.y);
          const sw = full ? vw : Math.round(vw * CROP.w), sh = full ? vh : Math.round(vh * CROP.h);
          canvas.width = sw;
          canvas.height = sh;
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
          try {
            const found = await detector.detect(canvas);
            if (found[0]) emit(found[0].rawValue);
          } catch {}
        }
        timer = setTimeout(step, 120);
      };
      step();
    };

    (async () => {
      const video = videoRef.current!;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS, audio: false });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        video.srcObject = stream;
        await video.play();
        enableContinuousFocus(stream);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(/Permission|NotAllowed/i.test(msg) ? "Chưa cấp quyền camera. Hãy cho phép camera trong trình duyệt rồi thử lại." : `Không mở được camera: ${msg}`);
        return;
      }

      // 1) BarcodeDetector của trình duyệt, nếu hỗ trợ mã vạch 1D
      const Native = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
      if (Native) {
        try {
          const supported = (await Native.getSupportedFormats?.().catch(() => [])) || [];
          const formats = FORMATS.filter((f) => supported.includes(f));
          if (formats.includes("code_128")) {
            setEngine("Trình duyệt");
            runLoop(video, new Native({ formats }));
            return;
          }
        } catch {}
      }

      // 2) zxing-cpp WebAssembly
      try {
        const Wasm = await loadWasmDetector();
        if (stopped) return;
        setEngine("ZXing-C++");
        runLoop(video, new Wasm({ formats: FORMATS }));
        return;
      } catch {}

      // 3) ZXing JavaScript (dự phòng cuối)
      try {
        const ZXing = await loadZXingJs();
        if (stopped) return;
        stream?.getTracks().forEach((t) => t.stop());
        const hints = new Map<unknown, unknown>();
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
        reader = new ZXing.BrowserMultiFormatReader(hints, 150);
        setEngine("ZXing");
        await reader.decodeFromConstraints({ video: VIDEO_CONSTRAINTS, audio: false }, video, (result) => {
          if (result) emit(result.getText());
        });
      } catch (e) {
        setError(`Không nạp được bộ quét: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      try { reader?.reset(); } catch {}
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-black overflow-hidden relative">
      {error ? (
        <div className="p-6 text-center text-sm text-white flex flex-col items-center gap-2">
          <IconCameraOff size={28} />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="w-full max-h-[50vh] object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-x-[5%] top-[30%] h-[40%] border-2 border-emerald-400/90 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
          {engine ? <span className="absolute left-2 top-2 text-[10px] font-semibold text-white/80 bg-black/40 px-2 py-0.5 rounded">{engine}</span> : null}
          <p className="absolute inset-x-2 bottom-2 rounded-lg bg-black/60 px-2 py-1 text-center text-[11px] font-semibold text-white" aria-live="polite">
            {paused ? "Tạm dừng quét, hãy lưu hoặc bỏ qua mã vừa đọc" : lastCode ? `Đã đọc: ${lastCode}` : "Đưa mã vạch nằm ngang trong khung, cách 10-20 cm"}
          </p>
        </>
      )}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg"
      >
        Tắt camera
      </button>
    </div>
  );
}
