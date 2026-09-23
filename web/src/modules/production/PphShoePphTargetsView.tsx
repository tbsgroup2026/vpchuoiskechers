'use client';

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { IconArrowLeft, IconGauge, IconSearch, IconFileSpreadsheet, IconAlertTriangle } from '@tabler/icons-react';

type PphTarget = { code: string; dauVaoKg12: number | null; dauVaoKg3: number | null; mayKg12: number | null; mayKg3: number | null; go: number | null };

// PPH CHUẨN theo mã giày (IE cung cấp) — CHỈ dùng để hiện ô "PPH" (mục tiêu) trên thẻ Tổ ở dashboard
// cấp Line/Gò và màn chiếu TV, thay cho số tự tính (Mục tiêu/giờ ÷ Số công nhân). KHÔNG đụng gì tới
// form "Cập nhật đầu ca" hay ô "% PPH"/"PPH TH" — những chỗ đó vẫn tính từ kế hoạch thật công nhân
// nhập như trước, xem displayTargetPph ở ProductionPerformanceModule.tsx.
//
// File IE gốc liệt kê PPH theo TỪNG MÀU (VD "256026_CHBK") nhưng mã công nhân thực tế gõ/chọn ở
// form quét KHÔNG có đuôi màu — nên khi nạp file, GỘP các dòng cùng mã gốc lại bằng TRUNG BÌNH các
// màu (xem groupByBaseCode bên dưới), rồi mới lưu — đúng theo yêu cầu đã chốt.
export default function PphShoePphTargetsView({ onBack }: { onBack: () => void }) {
  const [targets, setTargets] = useState<PphTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [importError, setImportError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ rows: PphTarget[]; mergedCodes: number; totalRawRows: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pph/shoe-pph-targets').then((r) => r.json());
      if (res.success) setTargets(res.targets || []);
      else setError(res.error || 'Không tải được danh sách');
    } catch {
      setError('Không kết nối được tới hệ thống');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() là fetch bất đồng bộ, setState chạy sau await
    load();
  }, []);

  // Bỏ dấu tiếng Việt + viết hoa — dùng để dò tên cột linh hoạt (file Excel thật có thể ghi hoa/
  // thường hoặc thừa khoảng trắng khác chút so với file mẫu đã thấy).
  function normalizeHeader(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/gi, 'd')
      .toUpperCase()
      .trim();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError(null);
    setPreview(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        if (rows.length === 0) {
          setImportError('File không có dòng dữ liệu nào');
          return;
        }
        // Dò tên cột theo TỪ KHOÁ (không cần khớp y hệt) — cột mã luôn là cột ĐẦU TIÊN trong file.
        const headers = Object.keys(rows[0]);
        const codeKey = headers[0];
        const findCol = (mustHave: string[], mustNotHave: string[] = []) =>
          headers.find((h) => {
            const n = normalizeHeader(h);
            return mustHave.every((k) => n.includes(k)) && mustNotHave.every((k) => !n.includes(k));
          });
        const colDauVaoKg12 = findCol(['DAU VAO'], ['KG3']);
        const colDauVaoKg3 = findCol(['DAU VAO', 'KG3']);
        const colMayKg12 = findCol(['MAY'], ['KG3', 'KG 3']);
        const colMayKg3 = findCol(['MAY'], []) && headers.find((h) => normalizeHeader(h).includes('MAY') && (normalizeHeader(h).includes('KG3') || normalizeHeader(h).includes('KG 3')));
        const colGo = findCol(['GO']);
        if (!codeKey || (!colDauVaoKg12 && !colMayKg12 && !colGo)) {
          setImportError('Không nhận diện được cột dữ liệu trong file — kiểm tra lại tiêu đề cột (dòng đầu tiên)');
          return;
        }

        const toNum = (v: unknown): number | null => {
          const n = Number(String(v ?? '').trim());
          return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : null;
        };

        // Gộp theo MÃ GỐC (bỏ đuôi màu, cắt sau dấu "_" cuối cùng) — TRUNG BÌNH các màu cùng mã gốc,
        // khớp đúng cách backend đang khớp mã (pphBaseShoeCode ở _worker.js).
        const groups = new Map<string, { dauVaoKg12: number[]; dauVaoKg3: number[]; mayKg12: number[]; mayKg3: number[]; go: number[] }>();
        let totalRawRows = 0;
        for (const r of rows) {
          const rawCode = String(r[codeKey] ?? '').trim();
          if (!rawCode) continue;
          totalRawRows++;
          const base = rawCode.toUpperCase().replace(/_[^_]+$/, '');
          if (!groups.has(base)) groups.set(base, { dauVaoKg12: [], dauVaoKg3: [], mayKg12: [], mayKg3: [], go: [] });
          const g = groups.get(base)!;
          const v1 = colDauVaoKg12 ? toNum(r[colDauVaoKg12]) : null;
          const v2 = colDauVaoKg3 ? toNum(r[colDauVaoKg3]) : null;
          const v3 = colMayKg12 ? toNum(r[colMayKg12]) : null;
          const v4 = colMayKg3 ? toNum(r[colMayKg3]) : null;
          const v5 = colGo ? toNum(r[colGo]) : null;
          if (v1 != null) g.dauVaoKg12.push(v1);
          if (v2 != null) g.dauVaoKg3.push(v2);
          if (v3 != null) g.mayKg12.push(v3);
          if (v4 != null) g.mayKg3.push(v4);
          if (v5 != null) g.go.push(v5);
        }
        const avg = (arr: number[]) => (arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length);
        const mergedRows: PphTarget[] = [...groups.entries()]
          .map(([code, g]) => ({
            code,
            dauVaoKg12: avg(g.dauVaoKg12),
            dauVaoKg3: avg(g.dauVaoKg3),
            mayKg12: avg(g.mayKg12),
            mayKg3: avg(g.mayKg3),
            go: avg(g.go),
          }))
          .sort((a, b) => a.code.localeCompare(b.code));
        setPreview({ rows: mergedRows, mergedCodes: mergedRows.length, totalRawRows });
      } catch {
        setImportError('Không đọc được file Excel — kiểm tra lại định dạng file (.xlsx)');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleSaveImport() {
    if (!preview) return;
    setSaving(true);
    setImportError(null);
    try {
      const res = await fetch('/api/pph/shoe-pph-targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: preview.rows }),
      });
      const result = await res.json();
      if (!result.success) {
        setImportError(result.error || 'Không lưu được');
        return;
      }
      setPreview(null);
      await load();
    } catch {
      setImportError('Không kết nối được tới hệ thống');
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(
    () => targets.filter((t) => !search.trim() || t.code.toLowerCase().includes(search.trim().toLowerCase())),
    [targets, search],
  );
  const fmt = (n: number | null) => (n == null ? '—' : n.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

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
            <IconGauge size={20} className="text-[#006838]" /> PPH Chuẩn Theo Mã Giày (IE)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tổ nào hôm đó khai <span className="font-bold text-slate-600">Model sản xuất</span> khớp mã ở đây — ô{' '}
            <span className="font-bold text-slate-600">&quot;PPH&quot;</span> trên thẻ Tổ (dashboard cấp Line/Gò + màn chiếu
            TV) tự hiện đúng số chuẩn IE thay vì số tự tính. Không khớp được mã thì vẫn dùng số tự tính như trước —{' '}
            <span className="font-bold text-slate-600">không đụng gì tới form nhập hay ô % PPH/PPH TH</span>.
          </p>
        </div>
      </div>

      {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">⚠️ {error}</div>}
      {importError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">⚠️ {importError}</div>
      )}

      {/* Tải file Excel lên — thay thế TOÀN BỘ bảng hiện có, tránh nhập tay từng dòng (~350+ mã). */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-black text-slate-800">Nạp file Excel PPH chuẩn (IE cung cấp)</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Dòng đầu tiên là tiêu đề cột (Mã giày / PPH Đầu Vào KG1-2 / KG3 / PPH May KG1-2 / KG3 / PPH Gò). Nạp file mới sẽ{' '}
              <span className="font-bold text-rose-500">thay thế toàn bộ</span> bảng hiện có.
            </p>
          </div>
          <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0 bg-[#006838] text-white hover:opacity-90 cursor-pointer">
            <IconFileSpreadsheet size={16} /> Chọn file Excel
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {preview && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 space-y-2.5">
            <p className="text-sm font-bold text-emerald-800">
              Đọc được {preview.totalRawRows} dòng → gộp thành {preview.mergedCodes} mã gốc (trung bình các màu cùng mã).
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <IconAlertTriangle size={14} className="shrink-0" />
              Kiểm tra lại số dòng có hợp lý không trước khi lưu — bấm &quot;Lưu, thay thế bảng cũ&quot; sẽ xoá sạch dữ liệu
              PPH chuẩn đang có và thay bằng dữ liệu này.
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPreview(null)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-bold disabled:opacity-60"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleSaveImport}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#006838] text-white text-sm font-bold hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Lưu, thay thế bảng cũ'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã giày..."
          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#006838]"
        />
      </div>

      {loading ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center text-base text-slate-400">
          Đang tải...
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#eef7f2] text-xs font-semibold text-slate-700 uppercase border-b border-emerald-100 whitespace-nowrap">
                  <th className="p-3">Mã giày</th>
                  <th className="p-3">Đầu Vào KG1-2</th>
                  <th className="p-3">Đầu Vào KG3</th>
                  <th className="p-3">May KG1-2</th>
                  <th className="p-3">May KG3</th>
                  <th className="p-3">Gò</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 whitespace-nowrap">
                {filtered.slice(0, 200).map((t) => (
                  <tr key={t.code}>
                    <td className="p-3 font-black text-slate-800">{t.code}</td>
                    <td className="p-3 font-mono">{fmt(t.dauVaoKg12)}</td>
                    <td className="p-3 font-mono">{fmt(t.dauVaoKg3)}</td>
                    <td className="p-3 font-mono">{fmt(t.mayKg12)}</td>
                    <td className="p-3 font-mono">{fmt(t.mayKg3)}</td>
                    <td className="p-3 font-mono">{fmt(t.go)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-400" colSpan={6}>
                      {targets.length === 0 ? 'Chưa nạp dữ liệu PPH chuẩn nào' : 'Không tìm thấy mã phù hợp'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 200 && (
            <p className="p-3 text-center text-xs text-gray-400 border-t border-gray-100">
              Hiện 200/{filtered.length} dòng đầu — gõ ô tìm kiếm ở trên để lọc bớt.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
