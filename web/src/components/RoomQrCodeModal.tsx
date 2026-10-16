"use client";

// Modal "Mã QR đăng ký" của từng phòng họp — chỉ Lễ Tân / Admin thấy (tab Danh sách phòng họp ở /rooms).
// Mã lấy từ /api/rooms/public-code (worker tự tạo nếu phòng chưa có). QR trỏ tới /book-room?code=...
// để mọi người quét và đặt phòng không cần đăng nhập.

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { IconCopy, IconDownload, IconPrinter, IconRefresh, IconX } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiClient";

type Props = {
  room: { id: string; name: string };
  onClose: () => void;
  onToast?: (msg: string) => void;
};

export default function RoomQrCodeModal({ room, onClose, onToast }: Props) {
  const [code, setCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  const bookingUrl = code && typeof window !== "undefined" ? `${window.location.origin}/book-room/${code.toLowerCase()}` : "";

  const loadCode = async (regenerate: boolean) => {
    setBusy(true);
    setError("");
    try {
      const res = regenerate
        ? await apiFetch("/api/rooms/public-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: room.id }),
          })
        : await apiFetch(`/api/rooms/public-code?roomId=${encodeURIComponent(room.id)}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data?.code) {
        setCode(data.data.code);
        if (regenerate) onToast?.("✅ Đã tạo mã mới. Nhớ in lại mã QR dán tại phòng.");
      } else {
        setError(data.message || data.error || "Không lấy được mã phòng.");
      }
    } catch {
      setError("Lỗi mạng, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadCode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  useEffect(() => {
    if (!bookingUrl) return;
    QRCode.toDataURL(bookingUrl, { width: 480, margin: 1, color: { dark: "#006838", light: "#FFFFFF" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [bookingUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      onToast?.("📋 Đã sao chép link đăng ký phòng.");
    } catch {
      window.prompt("Sao chép link đăng ký:", bookingUrl);
    }
  };

  const regenerate = () => {
    if (window.confirm(`Tạo mã mới cho "${room.name}"?\nMã QR cũ đang dán tại phòng sẽ KHÔNG dùng được nữa.`)) {
      loadCode(true);
    }
  };

  const fileSafeName = room.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-qr-title"
        className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#006838]">Mã QR đăng ký phòng</span>
            <h2 id="room-qr-title" className="text-base font-black text-slate-900 leading-tight">{room.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Đóng">
            <IconX size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="aspect-square w-full max-w-[240px] mx-auto rounded-2xl border-2 border-[#006838]/20 bg-white flex items-center justify-center overflow-hidden">
            {busy ? (
              <span className="text-xs text-slate-500">Đang lấy mã...</span>
            ) : error ? (
              <span className="text-xs text-rose-600 px-4 text-center">{error}</span>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt={`Mã QR đặt phòng ${room.name}`} className="w-full h-full" />
            ) : null}
          </div>

          {code && !busy && (
            <div className="text-center space-y-1">
              <div className="font-mono text-xl font-black tracking-[0.25em] text-slate-900">{code}</div>
              <div className="text-[11px] text-slate-500 break-all">{bookingUrl}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <a
              href={code ? `/rooms/qr?code=${code}&name=${encodeURIComponent(room.name)}` : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!code}
              className={`col-span-2 px-3 py-2.5 rounded-xl bg-[#006838] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#00522c] ${!code ? "pointer-events-none opacity-50" : ""}`}
            >
              <IconPrinter size={15} /> In mã QR (A4)
            </a>
            <button
              type="button"
              disabled={!code}
              onClick={copyLink}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              <IconCopy size={15} /> Sao chép link
            </button>
            <a
              href={qrDataUrl || undefined}
              download={`QR_dat_phong_${fileSafeName || "phong_hop"}.png`}
              aria-disabled={!qrDataUrl}
              className={`px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 ${!qrDataUrl ? "pointer-events-none opacity-50" : ""}`}
            >
              <IconDownload size={15} /> Tải ảnh QR
            </a>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={regenerate}
            className="w-full text-[11px] font-bold text-slate-500 hover:text-rose-600 flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <IconRefresh size={13} /> Đổi mã mới (vô hiệu QR cũ)
          </button>
        </div>
      </div>
    </div>
  );
}
