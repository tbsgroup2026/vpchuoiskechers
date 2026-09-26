'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { IconDownload } from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';

// Link đăng ký Gemba thật (Google Apps Script) — mã QR trỏ thẳng vào đây, quét bằng camera điện
// thoại bình thường là mở được ngay, không cần app riêng (khác QR máy móc ở machines/page.tsx vốn
// mã hoá JSON riêng cho app quét).
const GEMBA_REGISTER_URL =
  'https://script.google.com/macros/s/AKfycbwZ0h0Im1bKF5X_Tm7v7-YfcnDATKazw5Sp6oSkLj1Agk1Onzi9UshAchDsccPdt6R6/exec';

export default function QrGembaPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(GEMBA_REGISTER_URL, { width: 480, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, []);

  function handleDownloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'qr-gemba.png';
    a.click();
  }

  return (
    <MaintenanceShell title="QR Gemba" subtitle="Mã QR đăng ký tham gia Gemba — SKECHERS / TBS Group II">
      <div className="flex justify-center">
        <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 sm:p-10">
          <img
            src="/images/tbs-logo.png"
            alt="TBS Group"
            className="absolute top-6 left-6 h-9 w-auto object-contain"
          />
          <div className="flex flex-col items-center text-center pt-8">
            <p className="text-xs sm:text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2">
              Khu Vực Tổ Hợp KG
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quét mã để đăng ký gemba
            </h1>
            <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR đăng ký Gemba" className="w-72 h-72 sm:w-80 sm:h-80" />
              ) : (
                <div className="w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center text-xs text-slate-400">
                  Đang tạo mã QR...
                </div>
              )}
            </div>
            <button
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="mt-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#006838] text-white text-sm font-bold hover:bg-[#00552d] disabled:opacity-50 cursor-pointer"
            >
              <IconDownload size={16} /> Tải mã QR về
            </button>
          </div>
        </div>
      </div>
    </MaintenanceShell>
  );
}
