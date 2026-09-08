'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { IconDeviceLaptop, IconCircleCheck, IconCircleDashed, IconAlertTriangle, IconTrash, IconPlus, IconPencil, IconFileSpreadsheet, IconSearch, IconX } from '@tabler/icons-react';
import MaintenanceShell from '@/components/MaintenanceShell';
import FilterSelect from '@/components/FilterSelect';
import RefreshButton from '@/components/RefreshButton';

type CategoryOption = { id: string; name: string; parentId: string | null };

type Machine = {
  id: string;
  code: string;
  name: string;
  serial: string | null;
  factoryId: string | null;
  factoryName: string | null;
  areaId: string | null;
  areaName: string | null;
  zone: string;
  teamId: string | null;
  teamName: string | null;
  lineId: string | null;
  lineName: string | null;
  machineTypeId: string | null;
  machineTypeName: string | null;
  statusId: string;
  statusName: string;
  statusColorHex: string | null;
  originalCost: number | null;
  depreciationPercent: number | null;
  remainingValue: number | null;
  qrData: string;
};

type FilterOptions = {
  factories: CategoryOption[];
  areas: CategoryOption[];
  productionLines: CategoryOption[];
  teams: CategoryOption[];
  machineTypes: CategoryOption[];
  statuses: CategoryOption[];
};

const EMPTY_FILTERS: FilterOptions = {
  factories: [],
  areas: [],
  productionLines: [],
  teams: [],
  machineTypes: [],
  statuses: [],
};

// Nhãn/màu trạng thái — khớp ĐÚNG tên + màu 4 trạng thái chuẩn đang dùng bên tbsMayMoc (nguồn dữ
// liệu thật duy nhất, xem src/lib/tbsMayMoc.ts). Không tự đặt ra trạng thái riêng — hiện đúng dữ
// liệu thật.
function normalizeStatus(statusName: string): string {
  return statusName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .trim()
    .toLowerCase();
}

function renderStatusBadge(statusName: string) {
  const key = normalizeStatus(statusName);
  if (key === 'su dung' || key === 'operating') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        <span>{statusName}</span>
      </span>
    );
  }
  if (key === 'chua su dung') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        <span>{statusName}</span>
      </span>
    );
  }
  if (key === 'khong su dung' || key === 'down' || key === 'hu hong') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        <span>{statusName}</span>
      </span>
    );
  }
  if (key === 'de nghi thanh ly') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
        <span>{statusName}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      <span>{statusName}</span>
    </span>
  );
}

function formatMoney(n: number | null): string {
  return n != null ? n.toLocaleString('vi-VN') : '-';
}

// Form Thêm/Sửa máy — chỉ hỏi đúng các trường thkiengiangshoes cần (xem MachineWriteInput ở
// lib/tbsMayMoc.ts). Khi Sửa, các trường không hỏi (model/hãng SX...) giữ nguyên bên tbsMayMoc.
type MachineFormData = {
  code: string;
  name: string;
  location: string;
  serialNumber: string;
  factoryId: string;
  areaId: string;
  lineId: string;
  teamId: string;
  machineTypeId: string;
  statusId: string;
};

const EMPTY_FORM: MachineFormData = {
  code: '',
  name: '',
  location: '',
  serialNumber: '',
  factoryId: '',
  areaId: '',
  lineId: '',
  teamId: '',
  machineTypeId: '',
  statusId: '',
};

// Nhập Excel hàng loạt — người dùng điền TÊN (Nhà máy/Khu vực/Chuyền/Tổ/Phân loại máy/Trạng thái)
// vào file, ở đây tự tra cứu ra ID tương ứng theo danh mục đã tải (filterOptions), khớp không
// phân biệt hoa/thường/khoảng trắng thừa. Dòng nào thiếu Mã tài sản/Tên máy/Vị trí hoặc không tra
// được Khu vực/Trạng thái → báo lỗi riêng cho dòng đó, không chặn các dòng còn lại.
const IMPORT_TEMPLATE_HEADERS = [
  'Mã tài sản', 'Tên máy', 'Vị trí', 'Số Serial', 'Nhà máy', 'Khu vực', 'Chuyền', 'Tổ', 'Phân loại máy', 'Trạng thái',
] as const;

type ImportRow = { rowNumber: number; label: string; payload: {
  code: string; name: string; location: string; serialNumber: string | null;
  areaId: string; teamId: string | null; productionLineId: string | null; machineTypeId: string | null; statusId: string;
} };
type ImportRowError = { rowNumber: number; label: string; message: string };

function normLoose(s: unknown): string {
  return String(s ?? '').normalize('NFC').trim().toLowerCase();
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [drawerMachine, setDrawerMachine] = useState<Machine | null>(null);

  // Sinh ẢNH mã QR thật (không chỉ hiện chữ) — mã hoá ĐÚNG payload App Mobile Native đang dùng
  // để quét (JSON {type:"machine", code}, xem web-admin/src/app/api/machines/[id]/qrcode/route.ts
  // bên tbsMayMoc) — máy quét cùng 1 app sẽ nhận diện y hệt QR dán trên máy thật.
  useEffect(() => {
    if (!selectedQR) {
      setQrImageUrl(null);
      return;
    }
    const payload = JSON.stringify({ type: 'machine', code: selectedQR });
    QRCode.toDataURL(payload, { width: 400, margin: 2 })
      .then(setQrImageUrl)
      .catch(() => setQrImageUrl(null));
  }, [selectedQR]);

  const [search, setSearch] = useState('');
  const [filterMachineName, setFilterMachineName] = useState('');
  const [filterFactoryId, setFilterFactoryId] = useState('');
  const [filterAreaId, setFilterAreaId] = useState('');
  const [filterLineId, setFilterLineId] = useState('');
  const [filterTeamId, setFilterTeamId] = useState('');
  const [filterStatusId, setFilterStatusId] = useState('');
  const [filterMachineTypeId, setFilterMachineTypeId] = useState('');

  // Thêm/Sửa máy — cùng 1 modal dùng chung, editingId=null nghĩa là đang Thêm mới.
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MachineFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Nhập Excel hàng loạt
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importRowErrors, setImportRowErrors] = useState<ImportRowError[]>([]);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: string[] } | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  // `force` (nút "Làm mới dữ liệu") gửi kèm ?fresh=1 — bỏ qua cache 5 phút phía Worker, luôn lấy
  // đúng dữ liệu mới nhất từ tbsMayMoc ngay lập tức.
  const load = async (force = false) => {
    try {
      force ? setRefreshing(true) : setLoading(true);
      setError(null);
      const fresh = force ? '&fresh=1' : '';
      // Máy móc (nặng, ~2500 máy) gọi riêng khỏi 6 danh mục lọc — và 6 danh mục lọc để TRÌNH
      // DUYỆT tự gọi song song (không proxy gộp qua Worker) vì gộp 6 lệnh chạy song song trong
      // CÙNG 1 lượt xử lý của Cloudflare Worker từng vượt giới hạn tài nguyên khi chạy thật (dù
      // từng loại gọi riêng lẻ vẫn ổn) — trình duyệt không bị giới hạn này.
      // Promise.allSettled (KHÔNG phải Promise.all) — trước đây 1 trong 7 lệnh lỗi (network hỏng
      // hẳn trước khi tới .json(), hoặc từng có lúc backend trả lỗi dạng chữ thường thay vì JSON)
      // làm CẢ 7 cùng bị coi là lỗi, xoá sạch dữ liệu máy móc lẫn toàn bộ danh mục lọc dù đa số đã
      // tải thành công. Giờ mỗi lệnh độc lập — 1 cái lỗi không kéo sập các cái còn lại.
      const settled = await Promise.allSettled([
        fetch(`/api/maintenance/machines${force ? '?fresh=1' : ''}`).then((r) => r.json()),
        fetch(`/api/maintenance/categories?type=FACTORY${fresh}`).then((r) => r.json()),
        fetch(`/api/maintenance/categories?type=AREA${fresh}`).then((r) => r.json()),
        fetch(`/api/maintenance/categories?type=PRODUCTION_LINE${fresh}`).then((r) => r.json()),
        fetch(`/api/maintenance/categories?type=TEAM${fresh}`).then((r) => r.json()),
        fetch(`/api/maintenance/categories?type=MACHINE_TYPE${fresh}`).then((r) => r.json()),
        fetch(`/api/maintenance/categories?type=MACHINE_STATUS${fresh}`).then((r) => r.json()),
      ]);
      const asResult = (s: PromiseSettledResult<any>) =>
        s.status === 'fulfilled' ? s.value : { success: false, error: String(s.reason) };
      const [machinesRes, factoriesRes, areasRes, linesRes, teamsRes, typesRes, statusesRes] = settled.map(asResult);
      if (machinesRes.success && Array.isArray(machinesRes.data)) {
        setMachines(machinesRes.data);
      } else {
        setMachines([]);
        console.warn('Failed to load machines from tbsMayMoc:', machinesRes.error);
        setError(machinesRes.error || 'Không lấy được dữ liệu');
      }
      setFilterOptions({
        factories: factoriesRes.success && Array.isArray(factoriesRes.data) ? factoriesRes.data : [],
        areas: areasRes.success && Array.isArray(areasRes.data) ? areasRes.data : [],
        productionLines: linesRes.success && Array.isArray(linesRes.data) ? linesRes.data : [],
        teams: teamsRes.success && Array.isArray(teamsRes.data) ? teamsRes.data : [],
        machineTypes: typesRes.success && Array.isArray(typesRes.data) ? typesRes.data : [],
        statuses: statusesRes.success && Array.isArray(statusesRes.data) ? statusesRes.data : [],
      });
    } catch (err) {
      console.warn('Failed to fetch machines from tbsMayMoc:', err);
      setMachines([]);
    } finally {
      force ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Danh sách TÊN máy khác nhau (không trùng) — dùng cho ô lọc "Tất cả tên máy", giống hệt bộ lọc
  // bên trang Máy móc tbsMayMoc, suy ra thẳng từ danh sách máy đã tải, không cần gọi API riêng.
  const machineNameOptions = useMemo(() => {
    return Array.from(new Set(machines.map((m) => m.name))).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [machines]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return machines.filter((m) => {
      const matchesSearch =
        !q ||
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.teamName ?? '').toLowerCase().includes(q) ||
        (m.lineName ?? '').toLowerCase().includes(q);
      const matchesMachineName = !filterMachineName || m.name === filterMachineName;
      const matchesFactory = !filterFactoryId || m.factoryId === filterFactoryId;
      const matchesArea = !filterAreaId || m.areaId === filterAreaId;
      const matchesLine = !filterLineId || m.lineId === filterLineId;
      const matchesTeam = !filterTeamId || m.teamId === filterTeamId;
      const matchesStatus = !filterStatusId || m.statusId === filterStatusId;
      const matchesMachineType = !filterMachineTypeId || m.machineTypeId === filterMachineTypeId;
      return (
        matchesSearch &&
        matchesMachineName &&
        matchesFactory &&
        matchesArea &&
        matchesLine &&
        matchesTeam &&
        matchesStatus &&
        matchesMachineType
      );
    });
  }, [
    machines,
    search,
    filterMachineName,
    filterFactoryId,
    filterAreaId,
    filterLineId,
    filterTeamId,
    filterStatusId,
    filterMachineTypeId,
  ]);

  // 5 ô tổng quan (giống hàng đầu trang Tổng quan bên tbsMayMoc) — tính theo ĐÚNG danh sách đang
  // lọc/tìm kiếm ở trên (không phải luôn toàn bộ), để khớp đúng số liệu đang hiển thị trong bảng.
  const statusStats = useMemo(() => {
    let suDung = 0;
    let chuaSuDung = 0;
    let khongSuDung = 0;
    let deNghiThanhLy = 0;
    for (const m of filtered) {
      const key = normalizeStatus(m.statusName);
      if (key === 'su dung') suDung++;
      else if (key === 'chua su dung') chuaSuDung++;
      else if (key === 'khong su dung') khongSuDung++;
      else if (key === 'de nghi thanh ly') deNghiThanhLy++;
    }
    return { total: filtered.length, suDung, chuaSuDung, khongSuDung, deNghiThanhLy };
  }, [filtered]);

  function handleExport() {
    const rows = filtered.map((m) => ({
      'Mã tài sản': m.code,
      'Tên máy': m.name,
      'Nhà máy': m.factoryName ?? '',
      'Khu vực / Xưởng': m.areaName ?? '',
      Tổ: m.teamName ?? '',
      Chuyền: m.lineName ?? '',
      'Phân loại máy': m.machineTypeName ?? '',
      'Trạng thái': m.statusName,
      'Nguyên giá': m.originalCost ?? '',
      'Đánh giá %': m.depreciationPercent ?? '',
      'Trị giá còn lại': m.remainingValue ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_MMTB');
    XLSX.writeFile(wb, `Danh_Sach_MMTB_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const hasActiveFilter =
    !!search ||
    !!filterMachineName ||
    !!filterFactoryId ||
    !!filterAreaId ||
    !!filterLineId ||
    !!filterTeamId ||
    !!filterStatusId ||
    !!filterMachineTypeId;

  function clearFilters() {
    setSearch('');
    setFilterMachineName('');
    setFilterFactoryId('');
    setFilterAreaId('');
    setFilterLineId('');
    setFilterTeamId('');
    setFilterStatusId('');
    setFilterMachineTypeId('');
  }

  function openCreateForm() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(m: Machine) {
    setEditingId(m.id);
    setFormData({
      code: m.code,
      name: m.name,
      location: m.zone,
      serialNumber: m.serial ?? '',
      factoryId: m.factoryId ?? '',
      areaId: m.areaId ?? '',
      lineId: m.lineId ?? '',
      teamId: m.teamId ?? '',
      machineTypeId: m.machineTypeId ?? '',
      statusId: m.statusId,
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || !formData.location.trim() || !formData.areaId || !formData.statusId) {
      setFormError('Thiếu Mã tài sản / Tên máy / Vị trí / Khu vực / Trạng thái');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        location: formData.location.trim(),
        serialNumber: formData.serialNumber.trim() || null,
        areaId: formData.areaId,
        teamId: formData.teamId || null,
        productionLineId: formData.lineId || null,
        machineTypeId: formData.machineTypeId || null,
        statusId: formData.statusId,
      };
      const url = editingId ? `/api/maintenance/machines/${editingId}` : '/api/maintenance/machines';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) {
        setFormError(result.error || 'Không lưu được máy');
        return;
      }
      closeForm();
      await load();
    } catch {
      setFormError('Không kết nối được tới hệ thống MMTB');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(m: Machine) {
    if (!confirm(`Xoá máy "${m.name}" (${m.code})? Hành động này không thể hoàn tác.`)) return;
    setDeletingId(m.id);
    try {
      const res = await fetch(`/api/maintenance/machines/${m.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) {
        alert(result.error || 'Không xoá được máy');
        return;
      }
      await load();
    } catch {
      alert('Không kết nối được tới hệ thống MMTB');
    } finally {
      setDeletingId(null);
    }
  }

  function handleDownloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      [...IMPORT_TEMPLATE_HEADERS],
      ['VD-001', 'Máy ép đế', 'Xưởng 1 - Chuyền 2', 'SN123456', 'KG1', 'Xưởng 1', 'Chuyền 2', 'Tổ 3', 'Máy ép', 'Sử dụng'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_May');
    XLSX.writeFile(wb, 'Mau_Nhap_May_MMTB.xlsx');
  }

  function findByName(list: CategoryOption[], name: string, parentId?: string | null): CategoryOption | undefined {
    const n = normLoose(name);
    if (!n) return undefined;
    const candidates = list.filter((c) => normLoose(c.name) === n);
    if (candidates.length <= 1) return candidates[0];
    return candidates.find((c) => !parentId || c.parentId === parentId) ?? candidates[0];
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng 1 file lần sau
    if (!file) return;
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        const okRows: ImportRow[] = [];
        const errRows: ImportRowError[] = [];

        rows.forEach((r, idx) => {
          const rowNumber = idx + 2; // hàng 1 là header
          const code = String(r['Mã tài sản'] ?? '').trim();
          const name = String(r['Tên máy'] ?? '').trim();
          const location = String(r['Vị trí'] ?? '').trim();
          const serial = String(r['Số Serial'] ?? '').trim();
          const label = `Dòng ${rowNumber}${code ? ` (${code})` : ''}`;

          if (!code || !name || !location) {
            errRows.push({ rowNumber, label, message: 'Thiếu Mã tài sản / Tên máy / Vị trí' });
            return;
          }

          const factory = findByName(filterOptions.factories, String(r['Nhà máy'] ?? ''));
          const area = findByName(filterOptions.areas, String(r['Khu vực'] ?? ''), factory?.id);
          if (!area) {
            errRows.push({ rowNumber, label, message: `Không tìm thấy Khu vực "${r['Khu vực']}"` });
            return;
          }
          const line = findByName(filterOptions.productionLines, String(r['Chuyền'] ?? ''), area.id);
          const team = findByName(filterOptions.teams, String(r['Tổ'] ?? ''), line?.id);
          const machineType = findByName(filterOptions.machineTypes, String(r['Phân loại máy'] ?? ''), factory?.id);
          const status = findByName(filterOptions.statuses, String(r['Trạng thái'] ?? ''));
          if (!status) {
            errRows.push({ rowNumber, label, message: `Không tìm thấy Trạng thái "${r['Trạng thái']}"` });
            return;
          }

          okRows.push({
            rowNumber,
            label,
            payload: {
              code,
              name,
              location,
              serialNumber: serial || null,
              areaId: area.id,
              teamId: team?.id ?? null,
              productionLineId: line?.id ?? null,
              machineTypeId: machineType?.id ?? null,
              statusId: status.id,
            },
          });
        });

        setImportRows(okRows);
        setImportRowErrors(errRows);
        setImportOpen(true);
      } catch {
        alert('Không đọc được file Excel — kiểm tra lại định dạng file (.xlsx)');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImportSubmit() {
    if (importRows.length === 0) return;
    setImportSubmitting(true);
    let success = 0;
    const failed: string[] = [];
    for (const row of importRows) {
      try {
        const res = await fetch('/api/maintenance/machines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row.payload),
        });
        const result = await res.json();
        if (result.success) success++;
        else failed.push(`${row.label}: ${result.error || 'Lỗi không rõ'}`);
      } catch {
        failed.push(`${row.label}: Không kết nối được`);
      }
    }
    setImportSubmitting(false);
    setImportResult({ success, failed });
    setImportRows([]);
    setImportRowErrors([]);
    if (success > 0) await load();
  }

  return (
    <MaintenanceShell title="Danh Sách MMTB" subtitle={`${filtered.length} máy — SKECHERS / TBS Group II`}>
      <div className="space-y-4">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Danh Sách Máy Móc Thiết Bị</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{filtered.length} thiết bị khả dụng trong hệ thống</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <RefreshButton onClick={() => load(true)} loading={refreshing} />
            <button
              onClick={openCreateForm}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#006838] text-white text-xs font-bold hover:bg-[#004d28] transition shadow-2xs cursor-pointer"
            >
              <IconPlus size={15} /> Thêm Máy
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportFileChange}
            />
            <button
              onClick={() => importInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-2xs cursor-pointer"
            >
              <IconFileSpreadsheet size={15} /> Nhập Excel
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="px-2.5 py-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Tải mẫu
            </button>
            <button
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconFileSpreadsheet size={15} /> Xuất Excel
            </button>
          </div>
        </div>

        {/* Status Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Tổng số MMTB', value: statusStats.total, icon: IconDeviceLaptop, border: 'border-blue-200', text: 'text-blue-700', bg: 'bg-blue-50/60' },
            { label: 'Đang sử dụng', value: statusStats.suDung, icon: IconCircleCheck, border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50/60' },
            { label: 'Chưa sử dụng', value: statusStats.chuaSuDung, icon: IconCircleDashed, border: 'border-slate-200', text: 'text-slate-600', bg: 'bg-slate-50' },
            { label: 'Không sử dụng', value: statusStats.khongSuDung, icon: IconAlertTriangle, border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50/60' },
            { label: 'Đề nghị thanh lý', value: statusStats.deNghiThanhLy, icon: IconTrash, border: 'border-rose-200', text: 'text-rose-700', bg: 'bg-rose-50/60' },
          ].map((c) => (
            <div key={c.label} className={`bg-white rounded-xl border ${c.border} p-3.5 shadow-2xs`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</span>
                <div className={`p-1.5 rounded-md ${c.bg}`}>
                  <c.icon size={16} className={c.text} />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">{c.value}</div>
            </div>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã tài sản, tên máy, chuyền..."
              className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#006838]"
            />
          </div>
          <FilterSelect
            value={filterMachineName}
            onChange={setFilterMachineName}
            options={machineNameOptions.map((name) => ({ id: name, name }))}
            placeholder="Tất cả tên máy"
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          />
          <FilterSelect
            value={filterFactoryId}
            onChange={(v) => {
              setFilterFactoryId(v);
              setFilterAreaId('');
              setFilterLineId('');
              setFilterTeamId('');
            }}
            options={filterOptions.factories}
            placeholder="Tất cả nhà máy"
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          />
          <FilterSelect
            value={filterAreaId}
            onChange={(v) => {
              setFilterAreaId(v);
              setFilterLineId('');
              setFilterTeamId('');
            }}
            options={filterOptions.areas.filter((a) => !filterFactoryId || a.parentId === filterFactoryId)}
            placeholder={filterFactoryId ? 'Tất cả khu vực' : 'Chọn nhà máy trước'}
            disabled={!filterFactoryId}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          />
          <FilterSelect
            value={filterLineId}
            onChange={(v) => {
              setFilterLineId(v);
              setFilterTeamId('');
            }}
            options={filterOptions.productionLines.filter((l) => !filterAreaId || l.parentId === filterAreaId)}
            placeholder={filterAreaId ? 'Tất cả chuyền' : 'Chọn khu vực trước'}
            disabled={!filterAreaId}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          />
          <FilterSelect
            value={filterTeamId}
            onChange={setFilterTeamId}
            options={filterOptions.teams.filter((t) => !filterLineId || t.parentId === filterLineId)}
            placeholder={filterLineId ? 'Tất cả tổ' : 'Chọn chuyền trước'}
            disabled={!filterLineId}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          />
          <FilterSelect
            value={filterMachineTypeId}
            onChange={setFilterMachineTypeId}
            options={filterOptions.machineTypes.filter((mt) => !filterFactoryId || mt.parentId === filterFactoryId)}
            placeholder="Phân loại máy"
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          />
          <FilterSelect
            value={filterStatusId}
            onChange={setFilterStatusId}
            options={filterOptions.statuses}
            placeholder="Trạng thái"
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          />
          {hasActiveFilter && (
            <button onClick={clearFilters} className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline px-1 cursor-pointer">
              Xoá bộ lọc
            </button>
          )}
        </div>

        {/* Equipment Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 whitespace-nowrap">
                <th className="p-3">Mã Tài Sản</th>
                <th className="p-3">Tên Máy</th>
                <th className="p-3">Nhà Máy</th>
                <th className="p-3">Khu Vực / Xưởng</th>
                <th className="p-3">Chuyền / Tổ</th>
                <th className="p-3">Phân Loại Máy</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3 text-right">Nguyên Giá</th>
                <th className="p-3 text-right">Khấu Hao</th>
                <th className="p-3 text-right">Trị Giá Còn Lại</th>
                <th className="p-3 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 whitespace-nowrap">
              {loading && (
                <tr>
                  <td className="p-4 text-slate-400 text-center" colSpan={11}>Đang tải danh sách thiết bị...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && !error && (
                <tr>
                  <td className="p-4 text-slate-400 text-center" colSpan={11}>
                    {machines.length === 0 ? 'Chưa có máy nào trong hệ thống' : 'Không tìm thấy máy phù hợp bộ lọc'}
                  </td>
                </tr>
              )}
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/90 transition-colors">
                  <td className="p-3 font-mono font-bold text-[#006838]">
                    <button onClick={() => setDrawerMachine(m)} className="hover:underline text-left cursor-pointer">
                      {m.code}
                    </button>
                  </td>
                  <td className="p-3 font-semibold text-slate-900">
                    <button onClick={() => setDrawerMachine(m)} className="hover:text-[#006838] text-left cursor-pointer">
                      {m.name}
                    </button>
                  </td>
                  <td className="p-3 text-slate-600">{m.factoryName ?? '-'}</td>
                  <td className="p-3 text-slate-600">{m.areaName ?? '-'}</td>
                  <td className="p-3 text-slate-600">
                    {m.lineName ? `${m.lineName}${m.teamName ? ` (${m.teamName})` : ''}` : m.teamName ?? '-'}
                  </td>
                  <td className="p-3 text-slate-600">{m.machineTypeName ?? '-'}</td>
                  <td className="p-3">{renderStatusBadge(m.statusName)}</td>
                  <td className="p-3 text-right font-mono">{formatMoney(m.originalCost)}</td>
                  <td className="p-3 text-right font-mono">{m.depreciationPercent != null ? `${m.depreciationPercent}%` : '-'}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">{formatMoney(m.remainingValue)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setDrawerMachine(m)}
                        title="Xem hồ sơ"
                        className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                      >
                        <IconDeviceLaptop size={14} />
                      </button>
                      <button
                        onClick={() => setSelectedQR(m.qrData)}
                        className="px-2 py-1 bg-emerald-50 text-[#006838] border border-emerald-200 font-bold rounded-lg hover:bg-emerald-100 cursor-pointer text-[11px]"
                      >
                        QR
                      </button>
                      <button
                        onClick={() => openEditForm(m)}
                        title="Sửa"
                        className="p-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        <IconPencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        disabled={deletingId === m.id}
                        title="Xoá"
                        className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 disabled:opacity-40 cursor-pointer"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Slide-over Drawer cho Hồ Sơ Máy */}
        {drawerMachine && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50" onClick={() => setDrawerMachine(null)}>
            <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200" onClick={(e) => e.stopPropagation()}>
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#006838] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Hồ Sơ MMTB
                    </span>
                    {renderStatusBadge(drawerMachine.statusName)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{drawerMachine.name}</h3>
                  <p className="font-mono text-xs font-bold text-[#006838] mt-0.5">Mã tài sản: {drawerMachine.code}</p>
                </div>
                <button onClick={() => setDrawerMachine(null)} className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <IconX size={18} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Vị trí & Phân loại */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thông Tin Vận Hành</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nhà máy</span>
                      <span className="font-semibold text-slate-900">{drawerMachine.factoryName ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Khu vực / Xưởng</span>
                      <span className="font-semibold text-slate-900">{drawerMachine.areaName ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Chuyền sản xuất</span>
                      <span className="font-semibold text-slate-900">{drawerMachine.lineName ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tổ vận hành</span>
                      <span className="font-semibold text-slate-900">{drawerMachine.teamName ?? '—'}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200/50">
                      <span className="text-slate-400 block text-[11px]">Phân loại máy</span>
                      <span className="font-semibold text-slate-900">{drawerMachine.machineTypeName ?? 'Chưa phân loại'}</span>
                    </div>
                  </div>
                </div>

                {/* Tài chính & Giá trị */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Giá Trị & Khấu Hao</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-sans">Nguyên giá</span>
                      <span className="font-bold text-slate-900">{formatMoney(drawerMachine.originalCost)} VNĐ</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-sans">Tỷ lệ khấu hao</span>
                      <span className="font-bold text-slate-900">{drawerMachine.depreciationPercent != null ? `${drawerMachine.depreciationPercent}%` : '—'}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200/50">
                      <span className="text-slate-400 block text-[11px] font-sans">Trị giá còn lại</span>
                      <span className="font-bold text-[#006838] text-sm">{formatMoney(drawerMachine.remainingValue)} VNĐ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedQR(drawerMachine.qrData);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-[#006838] border border-emerald-200 text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                >
                  Mã QR
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const m = drawerMachine;
                      setDrawerMachine(null);
                      openEditForm(m);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                  >
                    <IconPencil size={14} /> Chỉnh sửa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* QR MODAL */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-tbs-dark">Mã QR Dán Trên Máy</h3>
            <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-accent rounded-2xl flex flex-col items-center justify-center p-3 shadow-inner overflow-hidden">
              {qrImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh QR sinh động (data URL), không phải asset tĩnh, không dùng next/image được
                <img src={qrImageUrl} alt={`Mã QR máy ${selectedQR}`} className="w-full h-full object-contain" />
              ) : (
                <div className="text-xs text-gray-400">Đang tạo mã QR...</div>
              )}
            </div>
            <div className="font-mono text-xs font-bold text-accent">{selectedQR}</div>
            <div className="flex gap-2">
              {qrImageUrl && (
                <a
                  href={qrImageUrl}
                  download={`QR_${selectedQR}.png`}
                  className="flex-1 py-2.5 bg-accent text-white rounded-xl font-bold text-xs hover:bg-accent-light"
                >
                  ⬇ Tải Về
                </a>
              )}
              <button
                onClick={() => setSelectedQR(null)}
                className="flex-1 py-2.5 bg-tbs-dark text-white rounded-xl font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NHẬP EXCEL — xem trước dòng hợp lệ/lỗi trước khi ghi thật vào tbsMayMoc */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-tbs-dark">Nhập Excel — Xem Trước</h3>
            <p className="text-xs text-gray-500">
              <span className="font-bold text-emerald-600">{importRows.length} dòng hợp lệ</span>
              {importRowErrors.length > 0 && (
                <> · <span className="font-bold text-rose-600">{importRowErrors.length} dòng lỗi</span></>
              )}
            </p>

            {importRowErrors.length > 0 && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 space-y-1 max-h-40 overflow-y-auto">
                {importRowErrors.map((e) => (
                  <div key={e.rowNumber} className="text-xs text-rose-700">
                    <span className="font-bold">{e.label}:</span> {e.message}
                  </div>
                ))}
              </div>
            )}

            {importRows.length > 0 && (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 font-semibold text-gray-500">
                      <th className="p-2.5">Dòng</th>
                      <th className="p-2.5">Mã tài sản</th>
                      <th className="p-2.5">Tên máy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importRows.map((r) => (
                      <tr key={r.rowNumber}>
                        <td className="p-2.5 text-gray-400">{r.rowNumber}</td>
                        <td className="p-2.5 font-mono font-bold text-accent">{r.payload.code}</td>
                        <td className="p-2.5">{r.payload.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setImportOpen(false); setImportRows([]); setImportRowErrors([]); }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={async () => { await handleImportSubmit(); setImportOpen(false); }}
                disabled={importRows.length === 0 || importSubmitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {importSubmitting ? 'Đang nhập...' : `Nhập ${importRows.length} máy`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KẾT QUẢ NHẬP EXCEL */}
      {importResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-tbs-dark">Kết Quả Nhập Excel</h3>
            <p className="text-sm">
              <span className="font-bold text-emerald-600">{importResult.success} máy đã thêm thành công</span>
              {importResult.failed.length > 0 && (
                <span className="font-bold text-rose-600"> · {importResult.failed.length} thất bại</span>
              )}
            </p>
            {importResult.failed.length > 0 && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 space-y-1 max-h-52 overflow-y-auto">
                {importResult.failed.map((f, i) => (
                  <div key={i} className="text-xs text-rose-700">{f}</div>
                ))}
              </div>
            )}
            <button
              onClick={() => setImportResult(null)}
              className="w-full py-2.5 bg-tbs-dark text-white rounded-xl font-bold text-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* FORM THÊM/SỬA MÁY */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-bold text-lg text-tbs-dark">{editingId ? 'Sửa Máy' : 'Thêm Máy Mới'}</h3>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-gray-600 space-y-1">
                <span>Mã tài sản *</span>
                <input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal"
                  required
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 space-y-1">
                <span>Tên máy *</span>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal"
                  required
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 space-y-1 sm:col-span-2">
                <span>Vị trí *</span>
                <input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal"
                  required
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 space-y-1">
                <span>Số Serial</span>
                <input
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal"
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 space-y-1">
                <span>Trạng thái *</span>
                <select
                  value={formData.statusId}
                  onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal"
                  required
                >
                  <option value="">-- Chọn trạng thái --</option>
                  {filterOptions.statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-600 space-y-1">
                <span>Nhà máy</span>
                <FilterSelect
                  value={formData.factoryId}
                  onChange={(v) => setFormData({ ...formData, factoryId: v, areaId: '', lineId: '', teamId: '' })}
                  options={filterOptions.factories}
                  placeholder="-- Chọn nhà máy --"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal disabled:opacity-50"
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 space-y-1">
                <span>Khu vực *</span>
                <FilterSelect
                  value={formData.areaId}
                  onChange={(v) => setFormData({ ...formData, areaId: v, lineId: '', teamId: '' })}
                  options={filterOptions.areas.filter((a) => !formData.factoryId || a.parentId === formData.factoryId)}
                  placeholder={formData.factoryId ? '-- Chọn khu vực --' : 'Chọn nhà máy trước'}
                  disabled={!formData.factoryId}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal disabled:opacity-50"
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 space-y-1">
                <span>Chuyền</span>
                <FilterSelect
                  value={formData.lineId}
                  onChange={(v) => setFormData({ ...formData, lineId: v, teamId: '' })}
                  options={filterOptions.productionLines.filter((l) => !formData.areaId || l.parentId === formData.areaId)}
                  placeholder={formData.areaId ? '-- Chọn chuyền --' : 'Chọn khu vực trước'}
                  disabled={!formData.areaId}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal disabled:opacity-50"
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 space-y-1">
                <span>Tổ</span>
                <FilterSelect
                  value={formData.teamId}
                  onChange={(v) => setFormData({ ...formData, teamId: v })}
                  options={filterOptions.teams.filter((t) => !formData.lineId || t.parentId === formData.lineId)}
                  placeholder={formData.lineId ? '-- Chọn tổ --' : 'Chọn chuyền trước'}
                  disabled={!formData.lineId}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal disabled:opacity-50"
                />
              </label>
              <label className="text-xs font-semibold text-gray-600 space-y-1">
                <span>Phân loại máy</span>
                <FilterSelect
                  value={formData.machineTypeId}
                  onChange={(v) => setFormData({ ...formData, machineTypeId: v })}
                  options={filterOptions.machineTypes.filter((mt) => !formData.factoryId || mt.parentId === formData.factoryId)}
                  placeholder="-- Chọn phân loại --"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal disabled:opacity-50"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-light disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : editingId ? 'Lưu Thay Đổi' : 'Thêm Máy'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
    </MaintenanceShell>
  );
}

