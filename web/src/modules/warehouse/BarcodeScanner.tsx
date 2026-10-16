"use client";

// Quét barcode/QR bằng camera sau: dùng BarcodeDetector của trình duyệt (Chrome/Edge Android),
// không có thì nạp ZXing tự host tại /vendor (iPhone/Safari).
// Camera mở ở độ phân giải cao + lấy nét liên tục; ZXing bật TRY_HARDER để đọc được mã vạch mảnh, nhỏ.
import React, { useEffect, useRef, useState } from "react";
import { IconCameraOff } from "@tabler/icons-react";

const ZXING_SRC = "/vendor/zxing-library-0.21.3.min.js";

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
type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = (new (opts?: { formats: string[] }) => Detector) & { getSupportedFormats?: () => Promise<string[]> };

/** Các loại mã hay gặp trong kho: nhãn vật tư (Code128/39, ITF), mã hàng bán lẻ (EAN/UPC), QR, DataMatrix */
const ZXING_FORMATS = ["CODE_128", "CODE_39", "CODE_93", "EAN_13", "EAN_8", "UPC_A", "UPC_E", "ITF", "CODABAR", "QR_CODE", "DATA_MATRIX"];
const NATIVE_FORMATS = ["code_128", "code_39", "code_93", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar", "qr_code", "data_matrix"];

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
};

function loadZXing(): Promise<ZXingGlobal> {
  const w = window as unknown as { ZXing?: ZXingGlobal };
  if (w.ZXing) return Promise.resolve(w.ZXing);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = ZXING_SRC;
    s.async = true;
    s.onload = () => (w.ZXing ? resolve(w.ZXing) : reject(new Error("ZXing không nạp được")));
    s.onerror = () => reject(new Error("Không tải được thư viện quét"));
    document.head.appendChild(s);
  });
}

/** Bật lấy nét liên tục nếu camera hỗ trợ (Android); iPhone tự lấy nét nên bỏ qua lỗi */
function enableContinuousFocus(video: HTMLVideoElement) {
  try {
    const track = (video.srcObject as MediaStream | null)?.getVideoTracks()[0];
    const caps = (track?.getCapabilities?.() || {}) as { focusMode?: string[] };
    if (track && caps.focusMode?.includes("continuous")) {
      track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => null);
    }
  } catch {}
}

export default function BarcodeScanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const cbRef = useRef(onDetected);
  const [error, setError] = useState("");
  const [engine, setEngine] = useState("");
  const [lastCode, setLastCode] = useState("");
  cbRef.current = onDetected;

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let reader: ZXingReader | null = null;

    const emit = (raw: string) => {
      const code = String(raw || "").trim();
      if (!code) return;
      const now = Date.now();
      if (code === lastRef.current.code && now - lastRef.current.at < 1500) return; // bỏ qua mã trùng liên tiếp
      lastRef.current = { code, at: now };
      setLastCode(code);
      try { navigator.vibrate?.(60); } catch {}
      cbRef.current(code);
    };

    (async () => {
      try {
        const video = videoRef.current!;
        const Native = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
        if (Native) {
          stream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS, audio: false });
          if (stopped) return;
          video.srcObject = stream;
          await video.play();
          enableContinuousFocus(video);
          const supported = (await Native.getSupportedFormats?.().catch(() => [])) || [];
          const formats = NATIVE_FORMATS.filter((f) => supported.includes(f));
          const detector = formats.length ? new Native({ formats }) : new Native();
          setEngine("BarcodeDetector");
          timer = setInterval(async () => {
            if (video.readyState < 2) return;
            try {
              const found = await detector.detect(video);
              if (found[0]) emit(found[0].rawValue);
            } catch {}
          }, 200);
        } else {
          const ZXing = await loadZXing();
          if (stopped) return;
          const hints = new Map<unknown, unknown>();
          hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
          hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS.map((f) => ZXing.BarcodeFormat[f]).filter((f) => f !== undefined));
          reader = new ZXing.BrowserMultiFormatReader(hints, 150);
          setEngine("ZXing");
          await reader.decodeFromConstraints({ video: VIDEO_CONSTRAINTS, audio: false }, video, (result) => {
            if (result) emit(result.getText());
          });
          enableContinuousFocus(video);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(/Permission|NotAllowed/i.test(msg) ? "Chưa cấp quyền camera. Hãy cho phép camera trong trình duyệt rồi thử lại." : `Không mở được camera: ${msg}`);
      }
    })();

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
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
          <div className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-emerald-400/90 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
          {engine ? <span className="absolute left-2 top-2 text-[10px] font-semibold text-white/80 bg-black/40 px-2 py-0.5 rounded">{engine}</span> : null}
          <p className="absolute inset-x-2 bottom-2 rounded-lg bg-black/60 px-2 py-1 text-center text-[11px] font-semibold text-white" aria-live="polite">
            {lastCode ? `Đã đọc: ${lastCode}` : "Đưa mã vạch nằm ngang trong khung, cách 10-20 cm"}
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
