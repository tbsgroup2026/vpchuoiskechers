'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconClipboardCheck,
  IconMapPin,
  IconListCheck,
  IconNotes,
  IconDeviceLaptop,
  IconUsers,
  IconRepeat,
  IconBuildingFactory2,
  IconX,
  IconChevronRight,
} from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import DateRangeFilter, { inDateRange } from '@/components/DateRangeFilter';
import RefreshButton from '@/components/RefreshButton';
import { mmtbTabCache } from '@/lib/mmtbTabCache';
import { getCurrentMmtbScope } from "@/lib/equipmentScope";

// Dữ liệu MMTB tách theo khu vực (Văn phòng / Miền Đông / Kiên Giang) như các trang bảo trì khác của VP Chuỗi
const withMmtbScope = (u: string) => `${u}${u.includes("?") ? "&" : "?"}scope=${getCurrentMmtbScope()}`;


type InventoryLogRow = {
  id: string;
  createdAt: string;
  fromLocationLabel: string | null;
  toLocationLabel: string;
  toAreaId: string | null;
  toProductionLineId: string | null;
  toTeamId: string | null;
  // Trạng thái máy đã đặt lúc quét Kiểm kê (null nếu lượt đó không đổi trạng thái).
  toStatusId: string | null;
  toStatusLabel: string | null;
  // 3 ghi chú TUỲ CHỌN nhập thêm lúc quét (bấm vào máy trong danh sách đã quét ở app/web-m tbsMayMoc)
  // — missingParts là CHUỖI JSON của mảng {name, quantity} (hoặc chuỗi trần cho dữ liệu cũ/không parse
  // được), null nếu lượt đó không nhập gì. Xem parseMissingParts() bên dưới.
  missingParts: string | null;
  machineKindNote: string | null;
  note: string | null;
  user: { id: string; name: string; employeeCode: string };
  machine: { code: string; name: string };
  factoryName: string | null;
};

type MissingPart = { name: string; quantity: string };

// missingParts lưu CHUỖI JSON mảng {name, quantity} — cố parse, không được (dữ liệu cũ kiểu chuỗi
// trần, hoặc JSON hỏng) thì coi như 1 dòng duy nhất giữ nguyên chuỗi đó làm tên, số lượng rỗng.
function parseMissingParts(raw: string | null): MissingPart[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((p) => ({
          name: typeof p?.name === "string" ? p.name.trim() : "",
          quantity: typeof p?.quantity === "string" || typeof p?.quantity === "number" ? String(p.quantity).trim() : "",
        }))
        .filter((p) => p.name);
    }
  } catch {
    // rơi xuống coi như chuỗi trần bên dưới
  }
  return raw.trim() ? [{ name: raw.trim(), quantity: "" }] : [];
}

type CategoryOption = { id: string; name: string; parentId: string | null; colorHex?: string | null; order?: number };

// Chỉ cần đúng các trường dùng để tính TRẠNG THÁI HIỆN TẠI + vị trí hiện tại của máy (xem
// /maintenance/machines/page.tsx cho bản đầy đủ Machine) — dùng để đếm "Trạng thái máy đã kiểm
// kê" theo ĐÚNG trạng thái máy đang có ngay bây giờ, không phải trạng thái lúc quét.
type Machine = {
  id: string;
  code: string;
  name: string;
  factoryName: string | null;
  zone: string;
  statusId: string;
  statusName: string;
  statusColorHex: string | null;
};

type Batch = { key: string; createdAt: string; toLocationLabel: string; items: InventoryLogRow[] };

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// "dd/mm/yyyy" theo giờ trình duyệt (người dùng ở VN) — dùng để gom danh sách máy trong 1 ô
// Chuyền/Tổ theo từng ngày đã quét.
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Mỗi lần bấm "Hoàn tất" ở màn quét ghi CÙNG LÚC nhiều dòng (1 dòng/máy) nhưng CÙNG 1 mốc
// createdAt (D1 tính CURRENT_TIMESTAMP 1 lần cho cả câu lệnh ghi hàng loạt, xem tbsMayMoc
// api/mobile/machines/reassign/route.ts) — dùng đúng mốc giờ đó làm khoá gộp, để đếm/hiện lại
// ĐÚNG từng lượt "Hoàn tất" đã bấm (không phải liệt kê rời rạc từng máy). Cùng logic đã dùng cho
// "Lịch sử của tôi" bên mobile-app/web-admin.
function groupIntoBatches(rows: InventoryLogRow[]): Batch[] {
  const map = new Map<string, Batch>();
  for (const r of rows) {
    const existing = map.get(r.createdAt);
    if (existing) existing.items.push(r);
    else map.set(r.createdAt, { key: r.createdAt, createdAt: r.createdAt, toLocationLabel: r.toLocationLabel, items: [r] });
  }
  return Array.from(map.values());
}

const AVATAR_COLORS = [
  { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { bg: 'bg-blue-50', text: 'text-blue-600' },
  { bg: 'bg-amber-50', text: 'text-amber-600' },
  { bg: 'bg-violet-50', text: 'text-violet-600' },
  { bg: 'bg-rose-50', text: 'text-rose-600' },
  { bg: 'bg-cyan-50', text: 'text-cyan-600' },
];
function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// kind 'area' = ô đại diện CHÍNH Khu vực đó — cho máy được gán THẲNG vào Khu vực (không xuống tới
// Chuyền/Tổ), VD KHÁC / MÁY DỰ PHÒNG / LINE IN ÉP ở KG3, hay KHÁC / Kho chung mmtb / PHÒNG LAB ở
// VP KV KG (các Khu vực không có Chuyền/Tổ con).
type GridNode = { id: string; name: string; kind: 'line' | 'team' | 'area'; areaId: string };

// Tab "Kiểm Kê" — xem trong 1 khoảng ngày, ai đã dùng tính năng Kiểm kê (quét mã gán lại Khu vực/
// Chuyền/Tổ hàng loạt trên app/web-m của tbsMayMoc) cập nhật những máy nào, chuyển từ vị trí nào
// sang vị trí nào — CHỈ hiện dữ liệu Tổ hợp Kiên Giang (tự động, xem lib/inventory-log.ts +
// requireAdmin() bên web-admin: tài khoản dịch vụ AMDKG có scopeCategoryId trỏ đúng Tổ hợp KG).
// Chỉ là trang BÁO CÁO — bước quét/gán vị trí thật vẫn diễn ra ở app/web-m của tbsMayMoc.
const CACHE_KEY_ROWS = 'mmtb-inventory:rows';
const CACHE_KEY_MACHINES = 'mmtb-inventory:machines';
const CACHE_KEY_FACTORIES = 'mmtb-inventory:factories';
const CACHE_KEY_AREAS = 'mmtb-inventory:areas';
const CACHE_KEY_LINES = 'mmtb-inventory:productionLines';
const CACHE_KEY_TEAMS = 'mmtb-inventory:teams';
const CACHE_KEY_STATUSES = 'mmtb-inventory:machineStatuses';

export default function InventoryPage() {
  // Đọc cache trước (nếu vừa xem trang này rồi chuyển tab rồi quay lại) — hiện NGAY dữ liệu cũ
  // thay vì màn trắng "Đang tải..." mỗi lần quay lại, xem ghi chú đầy đủ ở lib/mmtbTabCache.ts.
  const [rows, setRows] = useState<InventoryLogRow[]>(() => mmtbTabCache.get(CACHE_KEY_ROWS) ?? []);
  const [machines, setMachines] = useState<Machine[]>(() => mmtbTabCache.get(CACHE_KEY_MACHINES) ?? []);
  const [factories, setFactories] = useState<CategoryOption[]>(() => mmtbTabCache.get(CACHE_KEY_FACTORIES) ?? []);
  const [areas, setAreas] = useState<CategoryOption[]>(() => mmtbTabCache.get(CACHE_KEY_AREAS) ?? []);
  const [productionLines, setProductionLines] = useState<CategoryOption[]>(() => mmtbTabCache.get(CACHE_KEY_LINES) ?? []);
  const [teams, setTeams] = useState<CategoryOption[]>(() => mmtbTabCache.get(CACHE_KEY_TEAMS) ?? []);
  const [machineStatuses, setMachineStatuses] = useState<CategoryOption[]>(() => mmtbTabCache.get(CACHE_KEY_STATUSES) ?? []);
  const [loading, setLoading] = useState(() => !mmtbTabCache.has(CACHE_KEY_ROWS));
  const [error, setError] = useState<string | null>(null);
  // Chọn Nhà máy = bấm 1 nút Nhà máy (bỏ dropdown). Khu vực/Chuyền-tổ không còn là bộ lọc trang —
  // muốn lọc sâu thì bấm thẳng vào ô trong lưới "Theo Chuyền/Tổ".
  const [factoryName, setFactoryName] = useState('');
  // Mặc định KHÔNG lọc ngày (rỗng = tất cả ~90 ngày) — chỉ lọc khi người dùng tự chọn ngày.
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // Ô đang mở xem chi tiết trong lưới Chuyền/Tổ.
  const [openGridNodeId, setOpenGridNodeId] = useState<string | null>(null);
  // Trạng thái đang mở xem danh sách máy trong ô "Trạng thái máy đã kiểm kê".
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  // Danh sách nhân viên giờ nằm sau ô "Nhân viên" ở hàng thống kê — bấm mới mở (cửa sổ trượt).
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  // Cửa sổ trượt: máy đã được điền thêm Linh kiện thiếu/Loại máy/Ghi chú lúc quét (ô thứ 5 ở hàng
  // thống kê) — LUÔN xét toàn bộ dữ liệu đã tải (không theo bộ lọc Khoảng ngày/Nhà máy trên trang).
  const [showNotesModal, setShowNotesModal] = useState(false);

  async function load(force = false) {
    try {
      force ? setRefreshing(true) : setLoading(true);
      setError(null);
      const fresh = force ? '?fresh=1' : '';
      const fresh2 = force ? '&fresh=1' : '';
      // Danh mục dùng cache (nhanh + ổn định kể cả khi mạng chập chờn) — Chuyền/Tổ nhân viên kiểm
      // kê vừa tạo trong lúc quét sẽ hiện sau tối đa 5 phút, hoặc NGAY khi bấm "Làm mới dữ liệu".
      // Máy móc (danh sách đầy đủ) tải thêm để biết TRẠNG THÁI HIỆN TẠI của từng máy đã kiểm kê —
      // xem statusBreakdown bên dưới (trước đây chỉ đếm máy có đổi trạng thái lúc quét nên thiếu).
      const settled = await Promise.allSettled([
        fetch(withMmtbScope(`/api/maintenance/inventory-log${fresh}`)).then((r) => r.json()),
        fetch(withMmtbScope(`/api/maintenance/machines${fresh}`)).then((r) => r.json()),
        fetch(withMmtbScope(`/api/maintenance/categories?type=FACTORY${fresh2}`)).then((r) => r.json()),
        fetch(withMmtbScope(`/api/maintenance/categories?type=AREA${fresh2}`)).then((r) => r.json()),
        fetch(withMmtbScope(`/api/maintenance/categories?type=PRODUCTION_LINE${fresh2}`)).then((r) => r.json()),
        fetch(withMmtbScope(`/api/maintenance/categories?type=TEAM${fresh2}`)).then((r) => r.json()),
        fetch(withMmtbScope(`/api/maintenance/categories?type=MACHINE_STATUS${fresh2}`)).then((r) => r.json()),
      ]);
      const asResult = (s: PromiseSettledResult<{ success?: boolean; rows?: unknown; data?: unknown; error?: string }>) =>
        s.status === 'fulfilled' ? s.value : { success: false, error: String((s as PromiseRejectedResult).reason) };
      const [logRes, machinesRes, facRes, areaRes, lineRes, teamRes, statusRes] = settled.map(asResult);
      if (logRes.success) {
        const nextRows = (logRes.rows as InventoryLogRow[]) || [];
        setRows(nextRows);
        mmtbTabCache.set(CACHE_KEY_ROWS, nextRows);
      } else {
        console.warn('Failed to load inventory-log from tbsMayMoc:', logRes.error);
        setError(logRes.error || 'Không lấy được dữ liệu');
      }
      if (machinesRes.success && Array.isArray(machinesRes.data)) {
        setMachines(machinesRes.data as Machine[]);
        mmtbTabCache.set(CACHE_KEY_MACHINES, machinesRes.data);
      } else {
        console.warn('Failed to load machines from tbsMayMoc:', machinesRes.error);
      }
      if (facRes.success) {
        const v = (facRes.data as CategoryOption[]) || [];
        setFactories(v);
        mmtbTabCache.set(CACHE_KEY_FACTORIES, v);
      }
      if (areaRes.success) {
        const v = (areaRes.data as CategoryOption[]) || [];
        setAreas(v);
        mmtbTabCache.set(CACHE_KEY_AREAS, v);
      }
      if (lineRes.success) {
        const v = (lineRes.data as CategoryOption[]) || [];
        setProductionLines(v);
        mmtbTabCache.set(CACHE_KEY_LINES, v);
      }
      if (teamRes.success) {
        const v = (teamRes.data as CategoryOption[]) || [];
        setTeams(v);
        mmtbTabCache.set(CACHE_KEY_TEAMS, v);
      }
      if (statusRes.success) {
        const v = (statusRes.data as CategoryOption[]) || [];
        setMachineStatuses(v);
        mmtbTabCache.set(CACHE_KEY_STATUSES, v);
      }
    } catch (err) {
      console.warn('Failed to fetch inventory-log from tbsMayMoc:', err);
    } finally {
      force ? setRefreshing(false) : setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rows chỉ CÓ SẴN tên Nhà máy (chuỗi, không id — xem factoryName trong lib/inventory-log.ts),
  // nên bộ lọc Nhà máy dùng đúng tên làm khoá lọc/khớp (giống các trang MMTB khác, VD
  // response-time/page.tsx) — nhưng lưới Chuyền/Tổ cần ID THẬT để duyệt cây danh mục, nên tự tra
  // ngược tên -> id qua danh sách factories đã tải.
  const selectedFactoryId = useMemo(
    () => factories.find((f) => f.name === factoryName)?.id || '',
    [factories, factoryName],
  );

  // Nút Nhà máy: mỗi Nhà máy TỪNG có ai kiểm kê -> 1 nút, kèm số máy KHÁC NHAU đã kiểm ở đó tính
  // trên TOÀN BỘ dữ liệu (~90 ngày), KHÔNG theo bộ lọc ngày — giống cách lưới "Theo Chuyền/Tổ"
  // đang đếm. Nhà máy nhiều máy nhất hiện trước.
  const factoryButtons = useMemo(() => {
    const byFactory = new Map<string, Set<string>>();
    for (const r of rows) {
      if (!r.factoryName) continue;
      const set = byFactory.get(r.factoryName) || new Set<string>();
      set.add(r.machine.code);
      byFactory.set(r.factoryName, set);
    }
    return Array.from(byFactory.entries())
      .map(([name, set]) => ({ name, count: set.size }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
  }, [rows]);

  const filteredRows = useMemo(
    () => rows.filter((r) => (!factoryName || r.factoryName === factoryName) && inDateRange(r.createdAt, dateFrom, dateTo)),
    [rows, factoryName, dateFrom, dateTo],
  );

  // Lưới Chuyền/Tổ tính trên TOÀN BỘ lịch sử (mọi ngày trong ~90 ngày dữ liệu), KHÔNG theo bộ lọc
  // ngày ở trên — bấm 1 ô là thấy ngay hết máy đã kiểm ở Tổ đó, không phải chỉnh lại khoảng ngày.
  const gridScopeRows = useMemo(
    () => rows.filter((r) => !factoryName || r.factoryName === factoryName),
    [rows, factoryName],
  );

  // Tính danh sách ô Chuyền/Tổ cho 1 Nhà máy BẤT KỲ (không chỉ Nhà máy đang chọn) — để khi chọn
  // "Tất cả" vẫn dựng được lưới cho TỪNG Nhà máy, gộp lại hiện hết (thay vì để trống, xem
  // factoryGridData bên dưới). Là hàm thường (không phải hook) vì gọi lặp lại cho nhiều Nhà máy.
  function gridNodesForFactory(factoryId: string): GridNode[] {
    const scopeAreas = areas.filter((a) => a.parentId === factoryId);
    const scopeAreaIds = scopeAreas.map((a) => a.id);
    const lines = productionLines.filter((l) => scopeAreaIds.includes(l.parentId || ''));
    const lineIds = lines.map((l) => l.id);
    // Tổ có cha là Chuyền (không phải Khu vực trực tiếp) — cần tra thêm 1 bước qua Chuyền để biết
    // đúng Khu vực nó thuộc về (phục vụ nhóm lưới theo Khu vực bên dưới).
    const lineAreaById = new Map(lines.map((l) => [l.id, l.parentId || '']));
    const teamsHere = teams.filter((t) => scopeAreaIds.includes(t.parentId || '') || lineIds.includes(t.parentId || ''));
    return [
      // 1 ô cho CHÍNH mỗi Khu vực (máy gán thẳng Khu vực, chưa vào Chuyền/Tổ) — luôn có để KHÔNG
      // BỎ SÓT Khu vực nào (kể cả Khu vực không có Chuyền/Tổ con). Lúc render sẽ ẩn ô này nếu Khu
      // vực đó CÓ Chuyền/Tổ con VÀ chưa có máy nào gán thẳng, tránh rối.
      ...scopeAreas.map((a) => ({ id: a.id, name: a.name, kind: 'area' as const, areaId: a.id })),
      ...lines.map((l) => ({ id: l.id, name: l.name, kind: 'line' as const, areaId: l.parentId || '' })),
      ...teamsHere.map((t) => ({
        id: t.id,
        name: t.name,
        kind: 'team' as const,
        areaId: scopeAreaIds.includes(t.parentId || '') ? (t.parentId as string) : lineAreaById.get(t.parentId || '') || '',
      })),
    ];
  }

  // Nhóm lưới theo Khu vực/Xưởng cho dễ nhìn khi 1 Nhà máy có nhiều Khu vực — chỉ hiện tiêu đề
  // Khu vực khi có TỪ 2 khu vực trở lên (đã chọn đúng 1 Khu vực rồi thì hiện 1 khối phẳng như cũ).
  function gridSectionsForNodes(nodes: GridNode[]) {
    const byArea = new Map<string, GridNode[]>();
    for (const n of nodes) {
      const arr = byArea.get(n.areaId);
      if (arr) arr.push(n);
      else byArea.set(n.areaId, [n]);
    }
    const areaNameById = new Map(areas.map((a) => [a.id, a.name]));
    return Array.from(byArea.entries())
      .map(([aid, ns]) => ({ areaId: aid, areaName: areaNameById.get(aid) || 'Chưa rõ khu vực', nodes: ns }))
      .sort((a, b) => a.areaName.localeCompare(b.areaName, 'vi'));
  }

  // Dựng sẵn lưới của MỌI Nhà máy từng có ai kiểm kê (factoryButtons, khai báo dưới) 1 lần — vừa
  // dùng khi đã chọn đúng 1 Nhà máy, vừa dùng khi "Tất cả" (lặp qua từng Nhà máy).
  const factoryGridData = useMemo(() => {
    const map = new Map<string, { sections: ReturnType<typeof gridSectionsForNodes>; nodes: GridNode[] }>();
    for (const fb of factoryButtons) {
      const fid = factories.find((f) => f.name === fb.name)?.id;
      if (!fid) continue;
      const nodes = gridNodesForFactory(fid);
      map.set(fid, { sections: gridSectionsForNodes(nodes), nodes });
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gridNodesForFactory/gridSectionsForNodes là hàm thường, phụ thuộc thật là areas/productionLines/teams/factories/factoryButtons
  }, [factoryButtons, factories, areas, productionLines, teams]);

  // Nhà máy cần hiện lưới Chuyền/Tổ: đã chọn đúng 1 Nhà máy → chỉ Nhà máy đó; "Tất cả" → mọi Nhà
  // máy từng có ai kiểm kê (nhiều máy nhất hiện trước, giống thứ tự nút bấm "Nhà máy" ở trên).
  const factoriesToShow = useMemo(() => {
    if (selectedFactoryId) {
      const fb = factoryButtons.find((f) => f.name === factoryName);
      return fb ? [{ id: selectedFactoryId, name: fb.name, count: fb.count }] : [];
    }
    return factoryButtons
      .map((fb) => ({ id: factories.find((f) => f.name === fb.name)?.id || '', name: fb.name, count: fb.count }))
      .filter((f) => f.id);
  }, [selectedFactoryId, factoryButtons, factoryName, factories]);

  const gridCounts = useMemo(() => {
    const byNode = new Map<string, Set<string>>();
    for (const r of gridScopeRows) {
      // Máy gán tới Tổ → tính cho Tổ; tới Chuyền → cho Chuyền; chỉ tới Khu vực (chưa vào Chuyền/
      // Tổ) → cho ô Khu vực. Nhờ vậy KHÔNG bỏ sót máy nào.
      const nodeId = r.toTeamId || r.toProductionLineId || r.toAreaId;
      if (!nodeId) continue;
      const set = byNode.get(nodeId) || new Set<string>();
      set.add(r.machine.code);
      byNode.set(nodeId, set);
    }
    return byNode;
  }, [gridScopeRows]);
  const gridNodeRows = useMemo(() => {
    if (!openGridNodeId) return [];
    return gridScopeRows.filter((r) =>
      r.toTeamId === openGridNodeId ||
      r.toProductionLineId === openGridNodeId ||
      // Ô Khu vực: chỉ các máy gán THẲNG Khu vực (không có Chuyền/Tổ).
      (r.toAreaId === openGridNodeId && !r.toProductionLineId && !r.toTeamId),
    );
  }, [gridScopeRows, openGridNodeId]);
  // Bấm vào 1 ô Chuyền/Tổ -> liệt kê ĐÚNG các máy đã tính vào ô đó, GOM THEO TỪNG NGÀY đã quét
  // (không cần chỉnh lại bộ lọc ngày ở trên) — 1 máy quét nhiều lần chỉ giữ lượt GẦN NHẤT, ngày
  // mới nhất hiện trước.
  const gridNodeDays = useMemo(() => {
    const byMachine = new Map<string, InventoryLogRow>();
    for (const r of gridNodeRows) {
      const existing = byMachine.get(r.machine.code);
      if (!existing || r.createdAt > existing.createdAt) byMachine.set(r.machine.code, r);
    }
    const byDay = new Map<string, InventoryLogRow[]>();
    for (const r of byMachine.values()) {
      const k = dayKey(r.createdAt);
      const arr = byDay.get(k);
      if (arr) arr.push(r);
      else byDay.set(k, [r]);
    }
    return Array.from(byDay.entries())
      .map(([k, items]) => ({
        key: k,
        label: formatDate(items[0].createdAt),
        items: items.sort((a, b) => a.machine.name.localeCompare(b.machine.name, 'vi')),
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [gridNodeRows]);
  const gridNodeMachineCount = useMemo(
    () => new Set(gridNodeRows.map((r) => r.machine.code)).size,
    [gridNodeRows],
  );

  // Gộp theo nhân viên — mỗi người 1 khối, kèm TỪNG LƯỢT "Hoàn tất" (không liệt kê rời rạc từng
  // máy) — bấm vào 1 lượt mới xổ tiếp ra từng máy trong lượt đó.
  const employeeGroups = useMemo(() => {
    const byUser = new Map<string, { user: InventoryLogRow['user']; rows: InventoryLogRow[] }>();
    for (const row of filteredRows) {
      const existing = byUser.get(row.user.id);
      if (existing) existing.rows.push(row);
      else byUser.set(row.user.id, { user: row.user, rows: [row] });
    }
    return Array.from(byUser.values())
      .map(({ user, rows: userRows }) => ({
        user,
        batches: groupIntoBatches(userRows),
        totalMachines: new Set(userRows.map((r) => r.machine.code)).size,
      }))
      .sort((a, b) => b.totalMachines - a.totalMachines);
  }, [filteredRows]);

  const stats = useMemo(() => {
    const batches = groupIntoBatches(filteredRows);
    return {
      totalUpdates: filteredRows.length,
      totalMachines: new Set(filteredRows.map((r) => r.machine.code)).size,
      totalEmployees: new Set(filteredRows.map((r) => r.user.id)).size,
      totalBatches: batches.length,
      totalFactories: new Set(filteredRows.map((r) => r.factoryName).filter(Boolean)).size,
    };
  }, [filteredRows]);

  // Máy đã điền thêm Linh kiện thiếu/Loại máy/Ghi chú lúc quét — LUÔN xét TOÀN BỘ `rows` (không
  // theo bộ lọc Khoảng ngày/Nhà máy, theo yêu cầu người dùng). 1 máy có thể được quét nhiều lần —
  // giữ ĐÚNG 1 dòng/máy: lượt GẦN NHẤT trong số các lượt CÓ điền ít nhất 1 trong 3 ghi chú (bỏ qua
  // lượt quét sau đó nếu lượt đó không điền gì, để không mất thông tin đã ghi trước đó).
  const notesRows = useMemo(() => {
    const byMachine = new Map<string, InventoryLogRow & { parts: MissingPart[] }>();
    for (const r of rows) {
      const parts = parseMissingParts(r.missingParts);
      const hasNotes = parts.length > 0 || !!r.machineKindNote || !!r.note;
      if (!hasNotes) continue;
      const existing = byMachine.get(r.machine.code);
      if (!existing || r.createdAt > existing.createdAt) byMachine.set(r.machine.code, { ...r, parts });
    }
    return Array.from(byMachine.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [rows]);

  // Cộng dồn phụ tùng cùng tên (không phân biệt hoa/thường + khoảng trắng thừa) trên TOÀN BỘ
  // notesRows — dùng cho bảng "Tổng hợp phụ tùng cần chuẩn bị". Số lượng cộng được số nào hay số
  // đó (parseFloat), phần không đọc được số coi như 0 nhưng vẫn tính vào "số máy cần".
  const aggregatedParts = useMemo(() => {
    const byName = new Map<string, { name: string; totalQty: number; hasNonNumeric: boolean; machineCodes: Set<string> }>();
    for (const r of notesRows) {
      for (const p of r.parts) {
        const key = p.name.toLowerCase().replace(/\s+/g, " ").trim();
        if (!key) continue;
        const qty = parseFloat(p.quantity.replace(",", "."));
        const entry = byName.get(key);
        if (entry) {
          entry.totalQty += Number.isFinite(qty) ? qty : 0;
          if (!Number.isFinite(qty)) entry.hasNonNumeric = true;
          entry.machineCodes.add(r.machine.code);
        } else {
          byName.set(key, {
            name: p.name,
            totalQty: Number.isFinite(qty) ? qty : 0,
            hasNonNumeric: !Number.isFinite(qty),
            machineCodes: new Set([r.machine.code]),
          });
        }
      }
    }
    return Array.from(byName.values())
      .map((e) => ({ name: e.name, totalQty: e.totalQty, hasNonNumeric: e.hasNonNumeric, machineCount: e.machineCodes.size }))
      .sort((a, b) => b.machineCount - a.machineCount || a.name.localeCompare(b.name, "vi"));
  }, [notesRows]);

  // Trạng thái máy đã kiểm kê — tách theo TRẠNG THÁI HIỆN TẠI của từng máy (không phải trạng thái
  // lúc quét — trước đây chỉ đếm máy có ĐỔI trạng thái trong lượt quét nên tổng luôn thiếu rất
  // nhiều so với số máy đã kiểm kê thật, VD chỉ 2072/3718). Giờ khớp đúng cách trang Danh Sách
  // MMTB đang đếm: lấy mã máy đã kiểm kê đang lọc (Nhà máy/ngày ở trên) -> tra trạng thái hiện tại
  // của từng máy đó trong danh sách máy móc mới tải -> đếm theo trạng thái, nên TỔNG luôn khớp
  // đúng số máy đã kiểm kê đang lọc.
  const statusBreakdown = useMemo(() => {
    const codesInScope = new Set(filteredRows.map((r) => r.machine.code));
    const scopeMachines = machines.filter((m) => codesInScope.has(m.code));
    const machinesById = new Map<string, Machine[]>();
    for (const m of scopeMachines) {
      const arr = machinesById.get(m.statusId);
      if (arr) arr.push(m);
      else machinesById.set(m.statusId, [m]);
    }
    const nameById = new Map(machineStatuses.map((s) => [s.id, s.name]));
    const colorById = new Map(machineStatuses.map((s) => [s.id, s.colorHex || null]));
    const orderById = new Map(machineStatuses.map((s) => [s.id, s.order ?? 999]));
    const items = Array.from(machinesById.entries())
      .map(([id, statusMachines]) => ({
        id,
        name: nameById.get(id) || statusMachines[0]?.statusName || 'Không rõ',
        color: colorById.get(id) || statusMachines[0]?.statusColorHex || '#94a3b8',
        order: orderById.get(id) ?? 999,
        count: statusMachines.length,
        machines: statusMachines,
      }))
      .sort((a, b) => a.order - b.order || b.count - a.count);
    return { items, total: scopeMachines.length };
  }, [filteredRows, machines, machineStatuses]);

  // Bấm 1 trạng thái trong ô "Trạng thái máy đã kiểm kê" -> xổ danh sách máy tương ứng, GOM THEO
  // VỊ TRÍ HIỆN TẠI (m.zone) để thấy ngay máy đang ở đâu, nhiều máy nhất hiện trước.
  const openStatusGroups = useMemo(() => {
    if (!openStatusId) return [];
    const item = statusBreakdown.items.find((s) => s.id === openStatusId);
    if (!item) return [];
    const byLoc = new Map<string, Machine[]>();
    for (const m of item.machines) {
      const k = m.zone || '(chưa rõ vị trí)';
      const arr = byLoc.get(k);
      if (arr) arr.push(m);
      else byLoc.set(k, [m]);
    }
    return Array.from(byLoc.entries())
      .map(([loc, locMachines]) => ({
        loc,
        machines: locMachines.sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      }))
      .sort((a, b) => b.machines.length - a.machines.length || a.loc.localeCompare(b.loc, 'vi'));
  }, [openStatusId, statusBreakdown]);

  // Tên Chuyền/Tổ/Khu vực đang mở xem chi tiết trong lưới — tra trực tiếp qua 3 danh mục (không
  // phụ thuộc factoryGridData) vì ô có thể thuộc bất kỳ Nhà máy nào đang hiện (kể cả "Tất cả").
  const openNodeName = useMemo(
    () =>
      teams.find((t) => t.id === openGridNodeId)?.name ||
      productionLines.find((l) => l.id === openGridNodeId)?.name ||
      areas.find((a) => a.id === openGridNodeId)?.name ||
      '',
    [openGridNodeId, teams, productionLines, areas],
  );

  // Có ít nhất 1 Nhà máy đang hiện THẬT SỰ có ô Chuyền/Tổ để vẽ lưới hay không — dùng để quyết
  // định hiện thông báo trống thay vì chỉ dựa vào factoriesToShow (Nhà máy có thể có mặt trong
  // danh sách nhưng chưa có Chuyền/Tổ nào trong danh mục).
  const hasAnyGridData = factoriesToShow.some((f) => (factoryGridData.get(f.id)?.nodes.length || 0) > 0);

  return (
    <MaintenanceShell title="Kiểm Kê" subtitle="Nhật ký gán lại vị trí máy — Tổ hợp Kiên Giang">
      <div className="p-4 sm:p-6 space-y-4">
        {/* BỘ LỌC — ở đầu trang, trên hàng "Kiểm Kê" + nút "Làm mới dữ liệu". Chỉ còn Khoảng ngày
            (mặc định tất cả ~90 ngày) — đã bỏ bộ lọc Tên máy theo yêu cầu người dùng, lọc theo Nhà
            máy/Chuyền/Tổ giờ làm thẳng qua nút "Nhà máy" + lưới "Theo Chuyền/Tổ" bên dưới. */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-gray-400">Khoảng ngày</span>
            <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
            {!dateFrom && !dateTo && <span className="text-xs text-gray-400">Tất cả ngày</span>}
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-extrabold text-tbs-dark">Kiểm Kê</h1>
          <RefreshButton onClick={() => load(true)} loading={refreshing} />
        </div>

        {/* Lỗi kết nối tbsMayMoc chỉ log console (F12), không hiện banner ngoài trang — đúng quy
            ước các trang MMTB khác (theo yêu cầu người dùng). Gốc rễ (tbsMayMoc chậm/timeout) đã
            giảm nhiều nhờ mmtbCall() giờ có timeout 12s + tự thử lại 1 lần cho GET, xem _worker.js. */}

        {/* Hàng 5 ô tổng số — bỏ "Lượt cập nhật" (số lượt luôn cao vượt trội các ô khác, nhìn lệch).
            Ô "Nhân viên" bấm được để mở danh sách theo người, ô "Có ghi chú thêm" bấm mở danh sách
            máy đã điền Linh kiện thiếu/Loại máy/Ghi chú lúc quét (đều cửa sổ trượt). */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {([
            { label: 'Máy đã kiểm', value: stats.totalMachines, icon: IconDeviceLaptop, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
            { label: 'Nhân viên', value: stats.totalEmployees, icon: IconUsers, bg: 'bg-violet-50', iconBg: 'bg-violet-100', text: 'text-violet-600', onClick: () => setShowEmployeeModal(true) },
            { label: 'Lần Hoàn tất', value: stats.totalBatches, icon: IconRepeat, bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600' },
            { label: 'Nhà máy', value: stats.totalFactories, icon: IconBuildingFactory2, bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600' },
            { label: 'Có ghi chú thêm', value: notesRows.length, icon: IconNotes, bg: 'bg-sky-50', iconBg: 'bg-sky-100', text: 'text-sky-600', onClick: () => setShowNotesModal(true) },
          ] as { label: string; value: number; icon: typeof IconListCheck; bg: string; iconBg: string; text: string; onClick?: () => void }[]).map((c) => {
            const Tag = c.onClick ? 'button' : 'div';
            return (
              <Tag
                key={c.label}
                {...(c.onClick ? { type: 'button' as const, onClick: c.onClick } : {})}
                className={`flex w-full items-center gap-3 rounded-2xl ${c.bg} p-4 text-left shadow-sm ${
                  c.onClick ? 'transition hover:ring-2 hover:ring-violet-300' : ''
                }`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${c.iconBg}`}>
                  <c.icon size={20} className={c.text} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-extrabold text-tbs-dark">{c.value}</div>
                  <div className="truncate text-xs font-semibold text-gray-500">{c.label}</div>
                </div>
                {c.onClick && <IconChevronRight size={16} className="shrink-0 text-violet-400" />}
              </Tag>
            );
          })}
        </div>

        {/* Trạng thái máy đã kiểm kê — theo TRẠNG THÁI HIỆN TẠI của từng máy (khớp đúng cách trang
            Danh Sách MMTB đang đếm, theo đúng bộ lọc Nhà máy/ngày ở trên). */}
        {statusBreakdown.items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="mb-2.5 text-sm font-bold text-tbs-dark">
              Trạng thái máy đã kiểm kê <span className="font-normal text-xs text-gray-400">· {statusBreakdown.total} máy</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {statusBreakdown.items.map((s) => {
                const isOpen = openStatusId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setOpenStatusId(isOpen ? null : s.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                      isOpen ? 'border-accent bg-emerald-50' : 'border-gray-100 bg-gray-50 hover:border-accent'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-semibold text-gray-600">{s.name}</span>
                    <span className="text-sm font-extrabold text-tbs-dark">{s.count} máy</span>
                  </button>
                );
              })}
            </div>

            {openStatusGroups.length > 0 && (
              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gray-500">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: statusBreakdown.items.find((s) => s.id === openStatusId)?.color }}
                  />
                  {statusBreakdown.items.find((s) => s.id === openStatusId)?.name} —{' '}
                  {statusBreakdown.items.find((s) => s.id === openStatusId)?.count} máy
                </p>
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {openStatusGroups.map((g) => (
                    <div key={g.loc}>
                      <p className="mb-1 flex items-center justify-between gap-2 border-b border-gray-200 pb-1 text-[11px] font-extrabold uppercase tracking-wide text-gray-500">
                        <span className="flex min-w-0 items-center gap-1">
                          <IconMapPin size={12} className="shrink-0 text-gray-400" />
                          <span className="truncate">{g.loc}</span>
                        </span>
                        <span className="shrink-0 text-accent">{g.machines.length} máy</span>
                      </p>
                      <div className="space-y-1.5">
                        {g.machines.map((m) => (
                          <div key={m.code} className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate font-semibold text-gray-700">
                              {m.name} <span className="font-normal text-gray-400">· {m.code}</span>
                            </span>
                            <span className="shrink-0 text-gray-400">{m.factoryName || '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* NHÀ MÁY — nằm ngay dưới ô "Trạng thái máy đã kiểm kê". 6 nút (Tất cả + 5 nhà máy) chia
            ĐỀU hết chiều ngang trang; màn hẹp tự xuống 2–3 hàng, vẫn đều nhau. */}
        {factoryButtons.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-400">Nhà máy</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => {
                setFactoryName('');
                setOpenGridNodeId(null);
              }}
              className={`flex min-h-[64px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-sm font-bold transition ${
                !factoryName ? 'border-accent bg-emerald-50 text-tbs-dark' : 'border-gray-200 bg-white text-gray-500 hover:border-accent'
              }`}
            >
              Tất cả
            </button>
            {factoryButtons.map((fb) => {
              const active = factoryName === fb.name;
              return (
                <button
                  key={fb.name}
                  type="button"
                  onClick={() => {
                    setFactoryName(active ? '' : fb.name);
                    setOpenGridNodeId(null);
                  }}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2 transition ${
                    active ? 'border-accent bg-emerald-50' : 'border-gray-200 bg-white hover:border-accent'
                  }`}
                >
                  <span className="text-center text-xs font-bold leading-tight text-gray-600">{fb.name}</span>
                  <span className="text-lg font-extrabold text-tbs-dark">{fb.count} máy</span>
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Lưới Chuyền/Tổ — đã chọn đúng 1 Nhà máy thì chỉ hiện Nhà máy đó (như trước); "Tất cả"
            thì hiện GỘP lưới của MỌI Nhà máy từng có ai kiểm kê, mỗi Nhà máy 1 khối riêng có tiêu
            đề, thay vì để trống như trước (theo yêu cầu người dùng). */}
        {factoriesToShow.length > 0 && (
          <div className="space-y-4">
            {factoriesToShow.map((f) => {
              const data = factoryGridData.get(f.id);
              if (!data || data.nodes.length === 0) return null;
              return (
                <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                  <p className="text-sm font-bold text-tbs-dark">
                    Theo Chuyền/Tổ{!selectedFactoryId ? ` — ${f.name}` : ''}{' '}
                    <span className="font-normal text-xs text-gray-400">
                      · {!selectedFactoryId ? `${f.count} máy, ` : ''}toàn bộ, không theo bộ lọc ngày
                    </span>
                  </p>
                  {data.sections.map((section) => {
                    const lineTeamNodes = section.nodes.filter((n) => n.kind !== 'area');
                    const areaNode = section.nodes.find((n) => n.kind === 'area');
                    const areaCount = areaNode ? gridCounts.get(areaNode.id)?.size || 0 : 0;
                    // Ô Khu vực: luôn hiện nếu Khu vực KHÔNG có Chuyền/Tổ con; nếu CÓ con thì chỉ
                    // hiện khi thực sự có máy gán thẳng Khu vực (tránh 1 ô "chung" luôn = 0 gây rối).
                    const showAreaNode = areaNode && (lineTeamNodes.length === 0 || areaCount > 0);
                    const visibleNodes = [...(showAreaNode && areaNode ? [areaNode] : []), ...lineTeamNodes];
                    const sectionTotal = visibleNodes.reduce((sum, n) => sum + (gridCounts.get(n.id)?.size || 0), 0);
                    return (
                      <div key={section.areaId || 'none'}>
                        {/* Chỉ hiện tiêu đề Khu vực khi Nhà máy có từ 2 Khu vực trở lên đang trong
                            phạm vi — chọn đúng 1 Khu vực rồi thì chỉ còn 1 khối, hiện phẳng như cũ. */}
                        {data.sections.length > 1 && (
                          <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-1.5">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">{section.areaName}</p>
                            <span className="text-xs font-bold text-accent">{sectionTotal} máy</span>
                          </div>
                        )}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {visibleNodes.map((n) => {
                            const count = gridCounts.get(n.id)?.size || 0;
                            const isOpen = openGridNodeId === n.id;
                            const label = n.kind === 'area' && lineTeamNodes.length > 0 ? `${n.name} · chung` : n.name;
                            return (
                              <button
                                key={n.id}
                                onClick={() => setOpenGridNodeId(isOpen ? null : n.id)}
                                className={`relative rounded-xl border p-2 text-center transition ${
                                  isOpen ? 'border-accent bg-emerald-50' : count > 0 ? 'border-gray-200 bg-white hover:border-accent' : 'border-gray-100 bg-gray-50'
                                }`}
                              >
                                {count > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                <p className="truncate text-[11px] font-semibold text-gray-500">{label}</p>
                                <p className={`text-sm font-extrabold ${count > 0 ? 'text-tbs-dark' : 'text-gray-300'}`}>{count} máy</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Chi tiết ô Chuyền/Tổ đang mở — tách riêng khỏi (các) khối lưới ở trên vì "Tất cả" hiện
            NHIỀU khối (1 khối/Nhà máy) nhưng chỉ 1 ô được mở tại 1 thời điểm, nên hiện chi tiết
            chung 1 chỗ duy nhất thay vì lặp lại trong từng khối. */}
        {openGridNodeId && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="mb-2 text-xs font-bold text-gray-500">
              {openNodeName} — {gridNodeMachineCount} máy
            </p>
            {gridNodeDays.length === 0 ? (
              <p className="text-xs text-gray-400">Chưa có máy nào.</p>
            ) : (
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {gridNodeDays.map((d) => (
                  <div key={d.key}>
                    <p className="mb-1 flex items-center justify-between border-b border-gray-200 pb-1 text-[11px] font-extrabold uppercase tracking-wide text-gray-500">
                      <span>{d.label}</span>
                      <span className="text-accent">{d.items.length} máy</span>
                    </p>
                    <div className="space-y-1.5">
                      {d.items.map((r) => (
                        <div key={r.machine.code} className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate font-semibold text-gray-700">
                              {r.machine.name} <span className="font-normal text-gray-400">· {r.machine.code}</span>
                            </span>
                            {r.toStatusLabel && (
                              <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                                {r.toStatusLabel}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-gray-400">
                            {r.user.name} · {formatTime(r.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-xs text-gray-400">Đang tải...</div>
        )}

        {!loading && !hasAnyGridData && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm py-12 px-4 flex flex-col items-center gap-2.5 text-center">
            <IconClipboardCheck size={28} className="text-gray-300" />
            <p className="text-xs text-gray-400">
              {selectedFactoryId
                ? 'Nhà máy này chưa có Chuyền/Tổ nào trong danh mục.'
                : factoriesToShow.length === 0
                  ? 'Chưa có dữ liệu kiểm kê nào.'
                  : 'Chưa có Chuyền/Tổ nào trong danh mục.'}
            </p>
            <button
              type="button"
              onClick={() => setShowEmployeeModal(true)}
              className="mt-0.5 flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600 hover:bg-violet-100"
            >
              <IconUsers size={14} /> Xem theo nhân viên
            </button>
          </div>
        )}
      </div>

      {/* Cửa sổ trượt: danh sách theo nhân viên (bấm ô "Nhân viên" ở hàng thống kê) */}
      {showEmployeeModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
          onClick={() => setShowEmployeeModal(false)}
        >
          <div
            className="flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-tbs-dark">Theo nhân viên</p>
                <p className="truncate text-xs text-gray-400">
                  {employeeGroups.length} nhân viên · {stats.totalUpdates} lượt
                  {factoryName ? ` · ${factoryName}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmployeeModal(false)}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                aria-label="Đóng"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
              {employeeGroups.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-400">Chưa có ai kiểm kê trong khoảng này.</div>
              ) : (
                employeeGroups.map(({ user, batches, totalMachines }) => {
                  const color = avatarColor(user.id);
                  return (
                    <details key={user.id} className="rounded-2xl border border-gray-100 bg-white" open={employeeGroups.length <= 3}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 select-none">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color.bg} text-sm font-bold ${color.text}`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-tbs-dark">{user.name}</p>
                            <p className="text-xs text-gray-400">Mã NV: {user.employeeCode}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full ${color.bg} px-2.5 py-1 text-xs font-bold ${color.text}`}>
                          {batches.length} lần · {totalMachines} máy
                        </span>
                      </summary>
                      <div className="border-t border-gray-100 px-4 py-2">
                        {batches.map((b) => (
                          <details key={b.key} className="border-b border-gray-50 py-1.5 last:border-0">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 select-none">
                              <p className="text-sm font-semibold text-gray-700">
                                {b.items.length} máy <span className="font-normal text-gray-400">→</span> {b.toLocationLabel}
                              </p>
                              <span className="shrink-0 text-xs text-gray-400">{formatTime(b.createdAt)}</span>
                            </summary>
                            <div className="pl-1 pt-1">
                              {b.items.map((row) => (
                                <div key={row.id} className="flex items-start gap-2 py-1.5">
                                  <IconMapPin size={13} className="mt-0.5 shrink-0 text-gray-300" />
                                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                                    <span className="truncate">
                                      {row.machine.name} <span className="text-gray-400">· {row.machine.code}</span>
                                    </span>
                                    {row.toStatusLabel && (
                                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                                        {row.toStatusLabel}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                    </details>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cửa sổ trượt: máy đã điền thêm Linh kiện thiếu/Loại máy/Ghi chú lúc quét (bấm ô "Có ghi
          chú thêm" ở hàng thống kê) — LUÔN toàn bộ dữ liệu, không theo bộ lọc Khoảng ngày/Nhà máy. */}
      {showNotesModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
          onClick={() => setShowNotesModal(false)}
        >
          <div
            className="flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-tbs-dark">Máy đã điền thêm thông tin</p>
                <p className="truncate text-xs text-gray-400">
                  {notesRows.length} máy · Linh kiện thiếu / Loại máy / Ghi chú lúc quét — toàn bộ dữ liệu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                aria-label="Đóng"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-3">
              {notesRows.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-400">Chưa có máy nào được điền thêm thông tin lúc quét.</div>
              ) : (
                <>
                  {/* Bảng cộng dồn phụ tùng cùng tên — tiện chuẩn bị/mua hàng loạt. */}
                  {aggregatedParts.length > 0 && (
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
                      <p className="mb-2 text-xs font-bold text-tbs-dark">
                        Tổng hợp phụ tùng cần chuẩn bị <span className="font-normal text-gray-400">· {aggregatedParts.length} loại</span>
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[420px] border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-sky-200 text-left text-[11px] font-extrabold uppercase tracking-wide text-sky-700">
                              <th className="py-1.5 pr-2">Tên phụ tùng</th>
                              <th className="py-1.5 pr-2 text-right">Tổng số lượng</th>
                              <th className="py-1.5 pl-2 text-right">Số máy cần</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aggregatedParts.map((p) => (
                              <tr key={p.name.toLowerCase()} className="border-b border-sky-100 last:border-0">
                                <td className="py-1.5 pr-2 font-semibold text-gray-700">{p.name}</td>
                                <td className="py-1.5 pr-2 text-right font-extrabold text-tbs-dark">
                                  {p.totalQty > 0 ? p.totalQty : '-'}
                                  {p.hasNonNumeric && <span className="ml-1 font-normal text-gray-400">(*)</span>}
                                </td>
                                <td className="py-1.5 pl-2 text-right text-gray-500">{p.machineCount} máy</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {aggregatedParts.some((p) => p.hasNonNumeric) && (
                        <p className="mt-1.5 text-[10px] text-gray-400">(*) có số lượng ghi không phải dạng số, chưa cộng được vào tổng.</p>
                      )}
                    </div>
                  )}

                  {/* Danh sách từng máy. */}
                  <div className="space-y-2">
                    {notesRows.map((r) => (
                      <div key={r.machine.code} className="rounded-2xl border border-gray-100 bg-white p-3">
                        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-tbs-dark">
                            {r.machine.name} <span className="font-normal text-gray-400">· {r.machine.code}</span>
                          </p>
                          <span className="shrink-0 text-[11px] text-gray-400">
                            {r.user.name} · {formatDate(r.createdAt)} {formatTime(r.createdAt)}
                          </span>
                        </div>
                        <p className="mb-2 flex items-center gap-1 text-[11px] text-gray-400">
                          <IconMapPin size={12} className="shrink-0" />
                          <span className="truncate">{r.toLocationLabel}</span>
                        </p>
                        <div className="space-y-1.5 text-xs">
                          {r.parts.length > 0 && (
                            <div className="flex flex-wrap items-start gap-1.5">
                              <span className="shrink-0 font-bold text-gray-500">Linh kiện thiếu:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {r.parts.map((p, i) => (
                                  <span key={i} className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">
                                    {p.name}
                                    {p.quantity ? ` × ${p.quantity}` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {r.machineKindNote && (
                            <p>
                              <span className="font-bold text-gray-500">Loại máy: </span>
                              <span className="text-gray-700">{r.machineKindNote}</span>
                            </p>
                          )}
                          {r.note && (
                            <p>
                              <span className="font-bold text-gray-500">Ghi chú: </span>
                              <span className="text-gray-700">{r.note}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </MaintenanceShell>
  );
}
