'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { IconArrowLeft, IconQrcode, IconDownload, IconInfoCircle } from '@tabler/icons-react';

// Mã QR CHUNG cho quét sản lượng — KHÔNG gắn cố định 1 Tổ như các mã đang dùng thật (mỗi Tổ/Chuyền
// 1 mã riêng, tạo/tải ở PphSettingsView.tsx — file đó và luồng /pph-scan?team=... KHÔNG bị đụng tới
// bởi trang này). Mã ở đây trỏ tới /pph-scan?pick=1 — người quét tự chọn Nhà máy › Xưởng ›
// Chuyền/Tổ trước khi vào form (xem CascadingTeamPicker trong PphScanClient.tsx), dùng cho ai đi
// kiểm nhiều chuyền/tổ khác nhau thay vì đứng cố định 1 chỗ như thiết bị đã dán mã riêng.
export default function PphGeneralQrView({ onBack }: { onBack: () => void }) {
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}/pph-scan?pick=1`;
    QRCode.toDataURL(url, { width: 480, margin: 2 })
      .then(async (dataUrl) => {
        setQrImageUrl(dataUrl);
        setBuilding(true);
        try {
          const labelUrl = await buildGeneralQrImage(dataUrl);
          setDownloadUrl(labelUrl);
        } catch (err) {
          console.warn('Không ghép được nhãn vào ảnh QR chung:', err);
          setDownloadUrl(dataUrl);
        } finally {
          setBuilding(false);
        }
      })
      .catch(() => setQrImageUrl(null));
  }, []);

  function handleDownload() {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'QR-Chung-Hieu-Suat-Nha-May.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="space-y-5 my-auto">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center flex-shrink-0"
          title="Về Cài Đặt"
        >
          <IconArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <IconQrcode size={22} className="text-[#006838]" /> Mã QR Chung — Chọn Vị Trí Khi Quét
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Không gắn cố định 1 Tổ — quét mã này rồi tự chọn Nhà máy › Xưởng › Chuyền/Tổ mỗi lần. Dùng cho ai đi kiểm nhiều chuyền/tổ.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold max-w-lg">
        <IconInfoCircle size={16} className="shrink-0 mt-0.5" />
        <span>Mã này tách riêng hoàn toàn khỏi các mã QR đang dán tại từng Tổ/Chuyền (bên Cài Đặt) — không ảnh hưởng gì tới các mã đó.</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm flex flex-col items-center gap-4">
        {qrImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrImageUrl} alt="Mã QR chung" className="w-56 h-56 rounded-xl border border-slate-100" />
        ) : (
          <div className="w-56 h-56 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-xs text-slate-400">Đang tạo mã...</div>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!downloadUrl || building}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#006838] text-white text-sm font-black hover:opacity-90 disabled:opacity-50"
        >
          <IconDownload size={16} /> {building ? 'Đang chuẩn bị ảnh...' : 'Tải ảnh mã QR'}
        </button>
      </div>
    </div>
  );
}

// Ghép logo TBS Group + tiêu đề vào ảnh QR tải về — TÁCH RIÊNG khỏi buildQrLabelImage() (dùng cho
// mã QR RIÊNG từng Tổ, xem src/lib/qrLabelImage.ts) để không sửa/ảnh hưởng gì tới hàm đó. Khác biệt
// theo đúng yêu cầu: logo đặt ở GÓC PHẢI (bản kia luôn ở góc trái) và KHÔNG đè lên vùng mã QR (chỉ
// nằm ở phần nhãn phía trên, giữ nguyên khả năng quét được).
async function buildGeneralQrImage(qrDataUrl: string): Promise<string> {
  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Không tải được ảnh'));
      img.src = src;
    });

  const [qrImg, logoImg] = await Promise.all([loadImage(qrDataUrl), loadImage('/images/tbs-logo.png').catch(() => null)]);
  const qrSize = qrImg.width || 480;

  const paddingX = 48;
  const paddingTop = 32;
  const paddingBottom = 44;
  const titleFontSize = 32;
  const subFontSize = 18;
  const gapAfterTitle = 10;
  const gapAfterSub = 26;
  const boxPadding = 24;
  const qrBoxSize = qrSize + boxPadding * 2;
  const logoHeight = 34;
  const logoWidth = logoImg ? (logoImg.width / logoImg.height) * logoHeight : 0;

  const canvasWidth = qrBoxSize + paddingX * 2;
  const titleBlockHeight = titleFontSize + 10;
  const subBlockHeight = subFontSize + 10;
  const canvasHeight = paddingTop + logoHeight + 20 + titleBlockHeight + gapAfterTitle + subBlockHeight + gapAfterSub + qrBoxSize + paddingBottom;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không khởi tạo được canvas để ghép ảnh QR');

  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    const ctxWithRoundRect = ctx as CanvasRenderingContext2D & { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void };
    if (typeof ctxWithRoundRect.roundRect === 'function') {
      ctxWithRoundRect.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
    }
    ctx.closePath();
  };

  ctx.fillStyle = '#ffffff';
  drawRoundedRect(0, 0, canvasWidth, canvasHeight, 28);
  ctx.fill();

  // Logo — GÓC PHẢI trên cùng (khác bản mã QR riêng từng Tổ, luôn ở góc trái) theo đúng yêu cầu.
  if (logoImg) {
    ctx.drawImage(logoImg, canvasWidth - paddingX - logoWidth, paddingTop, logoWidth, logoHeight);
  }

  let cursorY = paddingTop + logoHeight + 20;
  const centerX = canvasWidth / 2;

  ctx.fillStyle = '#0f172a';
  ctx.font = `900 ${titleFontSize}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Quét Sản Lượng', centerX, cursorY, canvasWidth - paddingX * 2);
  cursorY += titleBlockHeight + gapAfterTitle;

  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 ${subFontSize}px "Segoe UI", Arial, sans-serif`;
  ctx.fillText('Quét rồi chọn Nhà máy › Xưởng › Chuyền/Tổ', centerX, cursorY, canvasWidth - paddingX * 2);
  cursorY += subBlockHeight + gapAfterSub;

  const boxX = (canvasWidth - qrBoxSize) / 2;
  ctx.fillStyle = '#f8fafc';
  drawRoundedRect(boxX, cursorY, qrBoxSize, qrBoxSize, 20);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  drawRoundedRect(boxX, cursorY, qrBoxSize, qrBoxSize, 20);
  ctx.stroke();

  ctx.drawImage(qrImg, boxX + boxPadding, cursorY + boxPadding, qrSize, qrSize);

  return canvas.toDataURL('image/png');
}
