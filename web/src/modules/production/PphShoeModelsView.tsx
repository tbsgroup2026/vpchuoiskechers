'use client';

import { useEffect, useState } from 'react';
import { IconArrowLeft, IconShoe, IconTrash, IconUpload, IconSearch } from '@tabler/icons-react';
import { uploadCloudinaryFile } from '@/lib/cloudinary';

type ShoeModel = { code: string; imageUrl: string; updatedAt: string };

// Ảnh gắn theo MÃ GIÀY (Model) — KHÁC ảnh thủ công gắn theo điểm quét (Tổ/Chuyền/Xưởng) đã có ở
// trang Cây Nhà máy. Tổ nào hôm đó khai "Model sản xuất" (lúc Cập nhật đầu ca) khớp đúng 1 mã ở
// đây thì dashboard cấp Line tự hiện ảnh này, ƯU TIÊN hơn ảnh thủ công cũ (xem GET /api/pph/dashboard
// bên _worker.js) — không khớp thì vẫn dùng ảnh thủ công như trước, không có nốt thì hiện chữ mã hàng.
export default function PphShoeModelsView({ onBack }: { onBack: () => void }) {
  const [models, setModels] = useState<ShoeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newCode, setNewCode] = useState('');
  // Mã ĐANG tải ảnh (kể cả ô "thêm mới", key riêng "__new__") — disable đúng ô đó, không khoá cả trang.
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pph/shoe-models').then((r) => r.json());
      if (res.success) setModels(res.models || []);
      else setError(res.error || 'Không tải được danh sách');
    } catch {
      setError('Không kết nối được tới hệ thống');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  async function saveImage(key: string, code: string, file: File) {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setActionError('Vui lòng nhập mã giày trước khi chọn ảnh');
      return;
    }
    setUploadingKey(key);
    setActionError(null);
    try {
      const { secure_url } = await uploadCloudinaryFile(file, { category: 'pph_shoe_model' });
      const res = await fetch('/api/pph/shoe-models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, imageUrl: secure_url }),
      });
      const result = await res.json();
      if (!result.success) {
        setActionError(result.error || 'Không lưu được');
        return;
      }
      setNewCode('');
      await load();
    } catch {
      setActionError('Không tải được ảnh lên — vui lòng thử lại.');
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleDelete(code: string) {
    if (!confirm(`Xoá ảnh mã giày "${code}"?`)) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/pph/shoe-models/${encodeURIComponent(code)}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) {
        setActionError(result.error || 'Không xoá được');
        return;
      }
      setModels((prev) => prev.filter((m) => m.code !== code));
    } catch {
      setActionError('Không kết nối được tới hệ thống');
    }
  }

  const filtered = models.filter((m) => !search.trim() || m.code.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="space-y-5 my-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center flex-shrink-0"
          title="Quay lại Cài Đặt"
        >
          <IconArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <IconShoe size={20} className="text-[#006838]" /> Ảnh Theo Mã Giày (Model)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tổ nào hôm đó khai <span className="font-bold text-slate-600">Model sản xuất</span> khớp đúng 1 mã trong danh
            sách này (lúc &quot;Cập nhật đầu ca&quot;) — dashboard cấp Line tự hiện ảnh giày tương ứng, ƯU TIÊN hơn ảnh thủ
            công gắn theo Tổ/Chuyền/Xưởng ở trang Cây Nhà máy.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">⚠️ {error}</div>
      )}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">⚠️ {actionError}</div>
      )}

      {/* Thêm mã mới — nhập mã trước, chọn ảnh sau (2 bước gộp 1 hàng cho gọn) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <input
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="Mã giày mới (VD: 4442)"
          className="flex-1 min-w-[160px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006838]"
        />
        <label
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0 ${
            newCode.trim() && uploadingKey === null
              ? 'bg-[#006838] text-white hover:opacity-90 cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <IconUpload size={16} /> {uploadingKey === '__new__' ? 'Đang tải...' : 'Chọn ảnh & Thêm'}
          <input
            type="file"
            accept="image/*"
            disabled={!newCode.trim() || uploadingKey !== null}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) saveImage('__new__', newCode, f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <div className="relative">
        <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã giày đã có ảnh..."
          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#006838]"
        />
      </div>

      {loading ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center text-base text-slate-400">
          Đang tải...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((m) => (
            <div key={m.code} className="group relative rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="aspect-square bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imageUrl} alt={m.code} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="truncate text-xs font-black text-slate-800">{m.code}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(m.code)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Xoá"
                >
                  <IconTrash size={13} />
                </button>
              </div>
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                {uploadingKey === m.code ? 'Đang tải...' : 'Đổi ảnh'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingKey !== null}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) saveImage(m.code, m.code, f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full p-10 text-center text-sm text-slate-400">
              {models.length === 0 ? 'Chưa có mã giày nào có ảnh' : 'Không tìm thấy mã phù hợp'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
