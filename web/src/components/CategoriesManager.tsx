'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconPlus, IconPencil, IconTrash, IconBuildingFactory2 } from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import FilterSelect from '@/components/FilterSelect';
import RefreshButton from '@/components/RefreshButton';

type Category = {
  id: string;
  name: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  days?: number | null;
  colorHex?: string | null;
  quantity?: number | null;
};

export type CategoryTabKey = 'FACTORY' | 'AREA' | 'PRODUCTION_LINE' | 'TEAM' | 'MACHINE_TYPE' | 'PART' | 'MAINTENANCE_PERIOD' | 'MACHINE_STATUS';

// 'NONE' = không cha (Nhà máy — chỉ đọc). 'FACTORY'/'AREA'/'PRODUCTION_LINE' = cần chọn đúng
// tầng phạm vi đó trước khi Thêm/xem danh sách. 'SCOPE_KG' = KHÔNG cần chọn phạm vi tầng nào —
// mục CHUNG toàn hệ thống (parentId=null, chỉ xem) trộn với mục RIÊNG của Tổ hợp KG (parentId =
// đúng Tổ hợp KG, Thêm/Sửa/Xoá tự do) — tbsMayMoc đã lọc + tự gán cha đúng ở backend.
type ParentLevel = 'NONE' | 'FACTORY' | 'AREA' | 'PRODUCTION_LINE' | 'SCOPE_KG';

const ALL_TAB_CONFIG: Record<CategoryTabKey, { label: string; parentLevel: ParentLevel; hasDays?: boolean; hasColor?: boolean; hasQuantity?: boolean }> = {
  FACTORY: { label: 'Nhà máy', parentLevel: 'NONE' },
  AREA: { label: 'Khu vực / Xưởng', parentLevel: 'FACTORY' },
  PRODUCTION_LINE: { label: 'Chuyền', parentLevel: 'AREA' },
  TEAM: { label: 'Tổ', parentLevel: 'PRODUCTION_LINE' },
  MACHINE_TYPE: { label: 'Phân loại máy', parentLevel: 'FACTORY' },
  PART: { label: 'Phụ tùng / Linh kiện', parentLevel: 'FACTORY', hasQuantity: true },
  MAINTENANCE_PERIOD: { label: 'Chu kỳ bảo trì', parentLevel: 'SCOPE_KG', hasDays: true },
  MACHINE_STATUS: { label: 'Trạng thái máy', parentLevel: 'SCOPE_KG', hasColor: true },
};

const EMPTY: Record<CategoryTabKey, Category[]> = {
  FACTORY: [], AREA: [], PRODUCTION_LINE: [], TEAM: [], MACHINE_TYPE: [], PART: [], MAINTENANCE_PERIOD: [], MACHINE_STATUS: [],
};

// Component dùng chung cho mọi trang Danh mục (Quản Lý Khu Vực, Phân Loại Máy, Phụ Tùng/Linh
// Kiện, Bảo Trì, Trạng Thái Máy) — mỗi trang route riêng chỉ truyền vào đúng bộ tabKeys cần hiện,
// tránh chép lại logic CRUD 8 lần. Xem các trang trong app/maintenance/categories/*.
export default function CategoriesManager({
  tabKeys,
  pageTitle,
  pageSubtitle,
}: {
  tabKeys: CategoryTabKey[];
  pageTitle: string;
  pageSubtitle: string;
}) {
  const [data, setData] = useState<Record<CategoryTabKey, Category[]>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<CategoryTabKey>(tabKeys[0]);

  const [scopeFactoryId, setScopeFactoryId] = useState('');
  const [scopeAreaId, setScopeAreaId] = useState('');
  const [scopeLineId, setScopeLineId] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDays, setFormDays] = useState('');
  const [formColor, setFormColor] = useState('#64748b');
  const [formQuantity, setFormQuantity] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Danh sách các loại thực sự cần tải — luôn kèm FACTORY (dùng cho combobox phạm vi) + AREA/
  // PRODUCTION_LINE khi tab cần đến chúng để lọc phạm vi (VD trang Phân Loại Máy chỉ cần
  // FACTORY+MACHINE_TYPE, không cần AREA/PRODUCTION_LINE).
  const fetchTypes = useMemo(() => {
    const set = new Set<CategoryTabKey>(['FACTORY', ...tabKeys]);
    if (tabKeys.includes('PRODUCTION_LINE') || tabKeys.includes('TEAM')) set.add('AREA');
    if (tabKeys.includes('TEAM')) set.add('PRODUCTION_LINE');
    return Array.from(set);
  }, [tabKeys]);

  const [refreshing, setRefreshing] = useState(false);

  const load = async (force = false) => {
    try {
      force ? setRefreshing(true) : setLoading(true);
      setError(null);
      // Promise.allSettled — 1 loại danh mục lỗi không còn xoá sạch các loại khác đã tải xong.
      const settled = await Promise.allSettled(
        fetchTypes.map((t) => fetch(`/api/mmtb-kg/categories?type=${t}${force ? '&fresh=1' : ''}`).then((r) => r.json())),
      );
      const next = { ...EMPTY };
      settled.forEach((s, i) => {
        const r = s.status === 'fulfilled' ? s.value : null;
        if (s.status === 'rejected') console.warn(`Failed to load categories type=${fetchTypes[i]}:`, s.reason);
        next[fetchTypes[i]] = r && r.success && Array.isArray(r.data) ? r.data : [];
      });
      setData(next);
    } catch (err) {
      console.warn('Failed to fetch categories from tbsMayMoc:', err);
    } finally {
      force ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabConfig = ALL_TAB_CONFIG[tab];

  const items = useMemo(() => {
    if (tabConfig.parentLevel === 'NONE' || tabConfig.parentLevel === 'SCOPE_KG') return data[tab];
    if (tabConfig.parentLevel === 'FACTORY') return scopeFactoryId ? data[tab].filter((c) => c.parentId === scopeFactoryId) : [];
    if (tabConfig.parentLevel === 'AREA') return scopeAreaId ? data[tab].filter((c) => c.parentId === scopeAreaId) : [];
    if (tabConfig.parentLevel === 'PRODUCTION_LINE') return scopeLineId ? data[tab].filter((c) => c.parentId === scopeLineId) : [];
    return [];
  }, [tab, tabConfig, data, scopeFactoryId, scopeAreaId, scopeLineId]);

  const areasUnderScope = data.AREA.filter((a) => !scopeFactoryId || a.parentId === scopeFactoryId);
  const linesUnderScope = data.PRODUCTION_LINE.filter((l) => !scopeAreaId || l.parentId === scopeAreaId);

  const canCreate =
    tabConfig.parentLevel === 'SCOPE_KG' ||
    (tabConfig.parentLevel === 'FACTORY' && !!scopeFactoryId) ||
    (tabConfig.parentLevel === 'AREA' && !!scopeAreaId) ||
    (tabConfig.parentLevel === 'PRODUCTION_LINE' && !!scopeLineId);

  function parentIdForNew(): string | null {
    if (tabConfig.parentLevel === 'FACTORY') return scopeFactoryId || null;
    if (tabConfig.parentLevel === 'AREA') return scopeAreaId || null;
    if (tabConfig.parentLevel === 'PRODUCTION_LINE') return scopeLineId || null;
    return null;
  }

  function isShared(c: Category) {
    return tabConfig.parentLevel === 'SCOPE_KG' && !c.parentId;
  }

  function openCreateForm() {
    setEditingId(null);
    setFormName('');
    setFormDays('');
    setFormColor('#64748b');
    setFormQuantity('');
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(c: Category) {
    setEditingId(c.id);
    setFormName(c.name);
    setFormDays(c.days != null ? String(c.days) : '');
    setFormColor(c.colorHex || '#64748b');
    setFormQuantity(c.quantity != null ? String(c.quantity) : '');
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên');
      return;
    }
    if (tabConfig.hasDays && (!formDays || Number(formDays) <= 0)) {
      setFormError('Vui lòng nhập số ngày hợp lệ');
      return;
    }
    if (tabConfig.hasQuantity && (formQuantity === '' || Number(formQuantity) < 0)) {
      setFormError('Vui lòng nhập số lượng tồn kho hợp lệ');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const url = editingId ? `/api/mmtb-kg/categories/${editingId}` : '/api/mmtb-kg/categories';
      const extra = {
        ...(tabConfig.hasDays ? { days: Number(formDays) } : {}),
        ...(tabConfig.hasColor ? { colorHex: formColor } : {}),
        ...(tabConfig.hasQuantity ? { quantity: Number(formQuantity) } : {}),
      };
      const body = editingId
        ? { name: formName.trim(), ...extra }
        : { type: tab, name: formName.trim(), parentId: parentIdForNew(), ...extra };
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.success) {
        setFormError(result.error || 'Không lưu được');
        return;
      }
      setShowForm(false);
      await load();
    } catch {
      setFormError('Không kết nối được tới hệ thống MMTB');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Xoá "${c.name}"? Hành động này không thể hoàn tác.`)) return;
    setDeletingId(c.id);
    try {
      const res = await fetch(`/api/mmtb-kg/categories/${c.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) {
        alert(result.error || 'Không xoá được');
        return;
      }
      await load();
    } catch {
      alert('Không kết nối được tới hệ thống MMTB');
    } finally {
      setDeletingId(null);
    }
  }

  const readOnlyTab = tabConfig.parentLevel === 'NONE';

  return (
    <MaintenanceShell title={pageTitle} subtitle={pageSubtitle}>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{pageSubtitle}</p>
          </div>
          <RefreshButton onClick={() => load(true)} loading={refreshing} />
        </div>

        {tabKeys.length > 1 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
            {tabKeys.map((k) => (
              <button
                key={k}
                onClick={() => { setTab(k); setShowForm(false); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  tab === k ? 'bg-[#006838] text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {ALL_TAB_CONFIG[k].label}
              </button>
            ))}
          </div>
        )}

        {tabConfig.parentLevel === 'SCOPE_KG' && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-800 text-xs font-medium">
            ℹ️ Đây là danh mục dùng chung toàn hệ thống — mục có nhãn <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold mx-0.5">Chung</span> chỉ xem được (các phân xưởng khác cũng đang sử dụng).
          </div>
        )}

        {(tabConfig.parentLevel === 'FACTORY' || tabConfig.parentLevel === 'AREA' || tabConfig.parentLevel === 'PRODUCTION_LINE') && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#006838]">
                <IconBuildingFactory2 size={16} />
              </span>
              Phạm vi áp dụng
            </span>
            <FilterSelect
              value={scopeFactoryId}
              onChange={(v) => { setScopeFactoryId(v); setScopeAreaId(''); setScopeLineId(''); }}
              options={data.FACTORY}
              placeholder="-- Chọn nhà máy --"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium min-w-[180px] disabled:opacity-50"
            />
            {(tabConfig.parentLevel === 'AREA' || tabConfig.parentLevel === 'PRODUCTION_LINE') && (
              <FilterSelect
                value={scopeAreaId}
                onChange={(v) => { setScopeAreaId(v); setScopeLineId(''); }}
                options={areasUnderScope}
                placeholder={scopeFactoryId ? '-- Chọn khu vực --' : 'Chọn nhà máy trước'}
                disabled={!scopeFactoryId}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium min-w-[180px] disabled:opacity-50"
              />
            )}
            {tabConfig.parentLevel === 'PRODUCTION_LINE' && (
              <FilterSelect
                value={scopeLineId}
                onChange={setScopeLineId}
                options={linesUnderScope}
                placeholder={scopeAreaId ? '-- Chọn chuyền --' : 'Chọn khu vực trước'}
                disabled={!scopeAreaId}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium min-w-[180px] disabled:opacity-50"
              />
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200/80 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{items.length} danh mục</span>
            {!readOnlyTab && (
              <button
                onClick={openCreateForm}
                disabled={!canCreate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#006838] text-white text-xs font-bold hover:bg-[#004d28] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <IconPlus size={15} /> Thêm {tabConfig.label}
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <div className="p-5 text-xs text-slate-400 text-center">Đang tải danh mục...</div>}
            {!loading && items.length === 0 && (
              <div className="p-5 text-xs text-slate-400 text-center">
                {readOnlyTab || tabConfig.parentLevel === 'SCOPE_KG' ? 'Chưa có mục nào' : canCreate ? 'Chưa có mục nào — bấm Thêm để tạo mới' : 'Vui lòng chọn đủ phạm vi áp dụng ở trên'}
              </div>
            )}
            {items.map((c) => {
              const shared = isShared(c);
              return (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/90 transition-colors">
                  <div className="flex items-center gap-3">
                    {tabConfig.hasColor && (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: c.colorHex || '#94a3b8' }} />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        {c.name}
                        {shared && <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold">Chung</span>}
                      </div>
                      {tabConfig.hasDays && c.days != null && <div className="text-[11px] text-slate-400 mt-0.5">{c.days} ngày</div>}
                      {tabConfig.hasQuantity && c.quantity != null && <div className="text-[11px] text-slate-400 mt-0.5">Tồn kho: {c.quantity}</div>}
                    </div>
                  </div>
                  {!readOnlyTab && !shared && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditForm(c)} title="Sửa" className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 cursor-pointer">
                        <IconPencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                        title="Xoá"
                        className="p-1.5 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 disabled:opacity-40 cursor-pointer"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-tbs-dark">{editingId ? `Sửa ${tabConfig.label}` : `Thêm ${tabConfig.label}`}</h3>
            {formError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">⚠️ {formError}</div>}
            <label className="block text-xs font-semibold text-gray-600 space-y-1">
              <span>Tên *</span>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal" required autoFocus />
            </label>
            {tabConfig.hasDays && (
              <label className="block text-xs font-semibold text-gray-600 space-y-1">
                <span>Số ngày *</span>
                <input type="number" min={1} value={formDays} onChange={(e) => setFormDays(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal" required />
              </label>
            )}
            {tabConfig.hasQuantity && (
              <label className="block text-xs font-semibold text-gray-600 space-y-1">
                <span>Số lượng tồn kho *</span>
                <input type="number" min={0} value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal" required />
              </label>
            )}
            {tabConfig.hasColor && (
              <label className="block text-xs font-semibold text-gray-600 space-y-1">
                <span>Màu hiển thị</span>
                <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)} className="w-full h-9 px-1 py-1 bg-gray-50 border border-gray-200 rounded-xl" />
              </label>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">Huỷ</button>
              <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-light disabled:opacity-50">
                {submitting ? 'Đang lưu...' : editingId ? 'Lưu Thay Đổi' : 'Thêm Mới'}
              </button>
            </div>
          </form>
        </div>
      )}
    </MaintenanceShell>
  );
}
