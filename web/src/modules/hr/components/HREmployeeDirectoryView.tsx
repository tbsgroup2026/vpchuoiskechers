"use client";

import React, { useState, useEffect, useRef } from "react";
import { HREmployee } from "../types";
import UserAvatar from "@/components/UserAvatar";
import {
  IconSearch,
  IconDownload,
  IconPlus,
  IconUsers,
  IconSitemap,
  IconBuilding,
  IconFileText,
  IconPhone,
  IconMail,
  IconX,
  IconCheck,
  IconArrowsExchange,
  IconCrown,
  IconUpload,
  IconEdit,
  IconTrash,
  IconFileSpreadsheet,
  IconChecklist,
  IconBuildingStore,
  IconUserCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";

/* ── Initial Mock Data for Org Chart, Headcount & Transfers ────────────── */
const INITIAL_ORG_UNITS = [
  { id: "ORG-CEO", code: "BGĐ", name: "Ban Giám Đốc Tập Đoàn", level: 1, parentId: null, leader: "Tổng Giám Đốc (CEO)", headcount: "2,450 nhân sự" },
  { id: "ORG-PROD", code: "K-SX", name: "Khối Sản Xuất & Nhà Máy", level: 2, parentId: "ORG-CEO", leader: "Giám Đốc Tổ Hợp Nhà Máy", headcount: "2,450 nhân sự" },
  { id: "ORG-HR", code: "K-NS", name: "Khối Hành Chính & HR", level: 2, parentId: "ORG-CEO", leader: "Dư Thị Thanh Tình (TP HR)", headcount: "286 nhân sự" },
  { id: "ORG-IT", code: "K-IT", name: "Khối IT & Chuyển Đổi Số", level: 2, parentId: "ORG-CEO", leader: "Phạm Nguyễn Anh Huy (Lead IT)", headcount: "140 nhân sự" },
  { id: "ORG-QC", code: "K-QC", name: "Khối Quản Trị Chất Lượng QC", level: 2, parentId: "ORG-CEO", leader: "Nguyễn Văn Tình (TP QC)", headcount: "420 nhân sự" },
];

const INITIAL_HEADCOUNT = [
  { id: "HC-1", dept: "Khối QC & Quản trị chất lượng", quota: 440, current: 420, status: "Thiếu định biên" },
  { id: "HC-2", dept: "Khối IT & Chuyển đổi số", quota: 150, current: 140, status: "Thiếu định biên" },
  { id: "HC-3", dept: "Nhân Sự - Hành Chánh", quota: 290, current: 286, status: "Đạt 98%" },
  { id: "HC-4", dept: "Kế Toán & Tài Chính", quota: 100, current: 100, status: "Đạt 100%" },
  { id: "HC-5", dept: "Kho & Logistics Skechers HQ", quota: 180, current: 175, status: "Thiếu định biên" },
];

const INITIAL_TRANSFERS = [
  { id: "TRF-1", title: "Bổ nhiệm Phó Trưởng Phòng QC — Bùi Thị Hằng", empName: "Bùi Thị Hằng", from: "Quản Lý QC", to: "Phó TP QC Ca 2", date: "2026-08-01", status: "Đã phê duyệt" },
  { id: "TRF-2", title: "Điều chuyển nhân sự IT — Phạm Nguyễn Anh Huy", empName: "Phạm Nguyễn Anh Huy", from: "IT Support", to: "IT - Team Chuyển Đổi Số", date: "2026-01-10", status: "Đã phê duyệt" },
  { id: "TRF-3", title: "Bổ nhiệm Trưởng Nhóm HC-Lễ Tân — Trần Thị Bích Trâm", empName: "Trần Thị Bích Trâm", from: "Chuyên Viên Hành Chính", to: "Trưởng Nhóm HC-Lễ Tân", date: "2026-03-15", status: "Đã phê duyệt" },
];

export default function HREmployeeDirectoryView() {
  const [subTab, setSubTab] = useState<"directory" | "orgchart" | "headcount" | "transfers">("directory");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState<HREmployee | null>(null);

  /* ── State Lists ───────────────────────────────────────────────────────── */
  const [employees, setEmployees] = useState<HREmployee[]>([]);
  const [orgUnits, setOrgUnits] = useState(INITIAL_ORG_UNITS);
  const [headcounts, setHeadcounts] = useState(INITIAL_HEADCOUNT);
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);

  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  /* ── File Input Refs for Excel Import per tab ──────────────────────────── */
  const empExcelInputRef = useRef<HTMLInputElement>(null);
  const orgExcelInputRef = useRef<HTMLInputElement>(null);
  const hcExcelInputRef = useRef<HTMLInputElement>(null);
  const trfExcelInputRef = useRef<HTMLInputElement>(null);

  /* ── Modal Form States ──────────────────────────────────────────────────── */
  // 1. Employee Add/Edit
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [empForm, setEmpForm] = useState<any>({
    id: "",
    name: "",
    title: "",
    department: "Nhân Sự",
    branch: "TBS Group HQ",
    contractType: "Chính thức",
    status: "Active",
    email: "",
    salaryBase: "12,500,000 VNĐ",
    performanceScore: "9.2/10",
  });
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);

  // 2. Org Unit Add/Edit
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [orgForm, setOrgForm] = useState<any>({ id: "", code: "", name: "", leader: "", headcount: "" });
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);

  // 3. Headcount Add/Edit
  const [isHcModalOpen, setIsHcModalOpen] = useState(false);
  const [hcForm, setHcForm] = useState<any>({ id: "", dept: "", quota: 100, current: 90, status: "Đang mở tuyển" });
  const [editingHcId, setEditingHcId] = useState<string | null>(null);

  // 4. Transfer Add/Edit
  const [isTrfModalOpen, setIsTrfModalOpen] = useState(false);
  const [trfForm, setTrfForm] = useState<any>({ id: "", title: "", empName: "", from: "", to: "", date: new Date().toISOString().slice(0, 10), status: "Đã phê duyệt" });
  const [editingTrfId, setEditingTrfId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr/employees");
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setEmployees(result.data);
      } else {
        // Fallback default employees list if DB empty
        setEmployees([
          { id: "222102020", name: "DƯ THỊ THANH TÌNH", title: "Trưởng Phòng Quản Trị Nguồn Nhân Lực", department: "Nhân Sự", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "thanh.tinh@tbsgroup.vn", avatar: "", salaryBase: "25,000,000 VNĐ", performanceScore: "9.5/10", isHighPerformer: true },
          { id: "211206004", name: "NGUYỄN VĂN TÌNH", title: "Trưởng Nhóm Quản Trị Nguồn Nhân Lực", department: "Nhân Sự", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "van.tinh@tbsgroup.vn", avatar: "", salaryBase: "18,000,000 VNĐ", performanceScore: "9.0/10" },
          { id: "201606014", name: "TRẦN THỊ HỒNG NHUNG", title: "Chuyên Viên Quản Trị & Phát Triển NNL", department: "Nhân Sự", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "hong.nhung@tbsgroup.vn", avatar: "", salaryBase: "14,000,000 VNĐ", performanceScore: "8.8/10" },
          { id: "210612005", name: "NGUYỄN THỊ HẰNG", title: "Chuyên Viên Định Mức & Phân Bổ Ngân Sách TL", department: "Nhân Sự", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "thi.hang@tbsgroup.vn", avatar: "", salaryBase: "15,000,000 VNĐ", performanceScore: "9.1/10" },
          { id: "202404001", name: "NGUYỄN NGỌC TUYẾN", title: "Chuyên Viên Tuyển Dụng & Đào Tạo", department: "Nhân Sự", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "ngoc.tuyen@tbsgroup.vn", avatar: "", salaryBase: "13,500,000 VNĐ", performanceScore: "8.7/10" },
          { id: "201906023", name: "ĐẶNG THỊ THANH LỊCH", title: "Chuyên Viên Nhân Sự Tiền Lương & CS", department: "Nhân Sự", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "thanh.lich@tbsgroup.vn", avatar: "", salaryBase: "14,500,000 VNĐ", performanceScore: "8.9/10" },
          { id: "202206011", name: "TRẦN THỊ BÍCH TRÂM", title: "Trưởng Nhóm Hành Chính & Lễ Tân", department: "Hành Chính", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "bich.tram@tbsgroup.vn", avatar: "", salaryBase: "16,000,000 VNĐ", performanceScore: "9.2/10" },
          { id: "202203002", name: "NGUYỄN TIẾN HẠNH", title: "Chuyên Viên Audit & Doanh Trí KLLĐ", department: "Hành Chính", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "tien.hanh@tbsgroup.vn", avatar: "", salaryBase: "14,000,000 VNĐ", performanceScore: "8.8/10" },
          { id: "202409009", name: "NGUYỄN KIM NGUYÊN", title: "Nhân Viên Hành Chính - Lễ Tân", department: "Hành Chính", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "kim.nguyen@tbsgroup.vn", avatar: "", salaryBase: "11,000,000 VNĐ", performanceScore: "8.5/10" },
          { id: "202010004", name: "NGUYỄN MINH HÙNG", title: "Nhân Viên Hành Chính - Lễ Tân", department: "Hành Chính", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "minh.hung@tbsgroup.vn", avatar: "", salaryBase: "11,500,000 VNĐ", performanceScore: "8.6/10" },
          { id: "202608001", name: "PHẠM NGUYỄN ANH HUY", title: "NV — Lập Trình", department: "Khối IT & CĐS", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "anhy.work.2004@gmail.com", avatar: "", salaryBase: "22,000,000 VNĐ", performanceScore: "9.8/10", isHighPerformer: true },
          { id: "202608002", name: "TRẦN NGỌC HUY", title: "NV — Lập Trình", department: "Khối IT & CĐS", branch: "TBS Group HQ", contractType: "Chính thức", status: "Active", email: "tranhuy110421@gmail.com", avatar: "", salaryBase: "20,000,000 VNĐ", performanceScore: "9.6/10" },
        ] as HREmployee[]);
      }
    } catch (err) {
      console.warn("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filtered = employees.filter((e) => {
    const matchSearch =
      (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.title || "").toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || (e.department || "").toLowerCase().includes(deptFilter.toLowerCase());
    return matchSearch && matchDept;
  });

  /* ── 1. EMPLOYEE HANDLERS (Tab 1) ──────────────────────────────────────── */
  const handleOpenAddEmp = () => {
    setEditingEmpId(null);
    setEmpForm({
      id: `EMP-${Date.now().toString().slice(-6)}`,
      name: "",
      title: "",
      department: "Nhân Sự",
      branch: "TBS Group HQ",
      contractType: "Chính thức",
      status: "Active",
      email: "",
      salaryBase: "12,000,000 VNĐ",
      performanceScore: "8.5/10",
    });
    setIsEmpModalOpen(true);
  };

  const handleOpenEditEmp = (emp: HREmployee) => {
    setEditingEmpId(emp.id);
    setEmpForm({ ...emp });
    setIsEmpModalOpen(true);
  };

  const handleSaveEmp = () => {
    if (!empForm.name.trim()) return alert("Vui lòng nhập Họ & Tên nhân viên!");
    if (!empForm.title.trim()) return alert("Vui lòng nhập Chức danh!");

    if (editingEmpId) {
      setEmployees((prev) => prev.map((e) => (e.id === editingEmpId ? { ...empForm } : e)));
      showToast(`Đã cập nhật thông tin nhân viên "${empForm.name}"!`);
    } else {
      setEmployees((prev) => [empForm, ...prev]);
      showToast(`Đã thêm nhân viên mới "${empForm.name}" thành công!`);
    }
    setIsEmpModalOpen(false);
  };

  const handleImportEmpExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rows || rows.length === 0) return alert("File Excel rỗng!");

        const newEmps: HREmployee[] = rows.map((r, idx) => ({
          id: String(r.MSNV || r["Mã NV"] || r["MÃ NV"] || r.ID || `EMP-${Date.now()}-${idx}`).trim(),
          name: String(r["Họ & Tên"] || r["HỌ VÀ TÊN"] || r.Name || r.Ten || "").trim() || "Nhân Viên Mới",
          title: String(r["Chức vụ"] || r["Chức danh"] || r.Title || "Chuyên Viên").trim(),
          department: String(r["Bộ phận"] || r["Phòng ban"] || r.Department || "Nhân Sự").trim(),
          branch: String(r["Chi nhánh"] || r.Branch || "TBS Group HQ").trim(),
          contractType: (String(r["Loại HD"] || r["Hợp đồng"] || "Chính thức").trim()) as any,
          status: "Active",
          email: String(r.Email || `${String(r.MSNV || idx).toLowerCase()}@tbsgroup.vn`).trim(),
          avatar: "",
          salaryBase: String(r["Lương"] || "12,000,000 VNĐ").trim(),
          performanceScore: "8.5/10",
        }));

        setEmployees((prev) => [...newEmps, ...prev]);
        showToast(`Đã import thành công ${newEmps.length} nhân viên từ file Excel!`);
      } catch (err: any) {
        alert("Lỗi đọc file Excel: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  /* ── 2. ORG CHART HANDLERS (Tab 2) ─────────────────────────────────────── */
  const handleOpenAddOrg = () => {
    setEditingOrgId(null);
    setOrgForm({ id: `ORG-${Date.now().toString().slice(-4)}`, code: "", name: "", leader: "", headcount: "50 nhân sự" });
    setIsOrgModalOpen(true);
  };

  const handleOpenEditOrg = (unit: typeof INITIAL_ORG_UNITS[0]) => {
    setEditingOrgId(unit.id);
    setOrgForm({ ...unit });
    setIsOrgModalOpen(true);
  };

  const handleSaveOrg = () => {
    if (!orgForm.name.trim()) return alert("Vui lòng nhập tên Phòng ban/Đơn vị!");
    if (editingOrgId) {
      setOrgUnits((prev) => prev.map((u) => (u.id === editingOrgId ? { ...orgForm } : u)));
      showToast(`Đã cập nhật phòng ban "${orgForm.name}"!`);
    } else {
      setOrgUnits((prev) => [...prev, { ...orgForm, level: 2, parentId: "ORG-CEO" }]);
      showToast(`Đã thêm đơn vị "${orgForm.name}" vào Sơ đồ cơ cấu!`);
    }
    setIsOrgModalOpen(false);
  };

  const handleImportOrgExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rows || rows.length === 0) return alert("File Excel rỗng!");

        const newUnits = rows.map((r, idx) => ({
          id: `ORG-IMP-${Date.now()}-${idx}`,
          code: String(r["Mã PB"] || r.Code || `PB-${idx}`).trim(),
          name: String(r["Tên Phòng Ban"] || r["Tên Đơn Vị"] || r.Name || "").trim() || "Đơn Vị Mới",
          level: 2,
          parentId: "ORG-CEO",
          leader: String(r["Trưởng Phòng"] || r.Leader || "Chưa gán").trim(),
          headcount: String(r["Định Biên"] || r.Headcount || "30 nhân sự").trim(),
        }));

        setOrgUnits((prev) => [...prev, ...newUnits]);
        showToast(`Đã import thành công ${newUnits.length} phòng ban/đơn vị từ Excel!`);
      } catch (err: any) {
        alert("Lỗi đọc file Excel: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  /* ── 3. HEADCOUNT HANDLERS (Tab 3) ─────────────────────────────────────── */
  const handleOpenAddHc = () => {
    setEditingHcId(null);
    setHcForm({ id: `HC-${Date.now().toString().slice(-4)}`, dept: "", quota: 50, current: 40, status: "Thiếu định biên" });
    setIsHcModalOpen(true);
  };

  const handleOpenEditHc = (hc: typeof INITIAL_HEADCOUNT[0]) => {
    setEditingHcId(hc.id);
    setHcForm({ ...hc });
    setIsHcModalOpen(true);
  };

  const handleSaveHc = () => {
    if (!hcForm.dept.trim()) return alert("Vui lòng nhập tên Phòng ban!");
    if (editingHcId) {
      setHeadcounts((prev) => prev.map((h) => (h.id === editingHcId ? { ...hcForm } : h)));
      showToast(`Đã cập nhật định biên phòng "${hcForm.dept}"!`);
    } else {
      setHeadcounts((prev) => [...prev, { ...hcForm }]);
      showToast(`Đã thêm định biên phòng "${hcForm.dept}"!`);
    }
    setIsHcModalOpen(false);
  };

  const handleImportHcExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rows || rows.length === 0) return alert("File Excel rỗng!");

        const newHc = rows.map((r, idx) => ({
          id: `HC-IMP-${Date.now()}-${idx}`,
          dept: String(r["Phòng Ban"] || r["Tên Phòng"] || r.Dept || "").trim() || "Phòng Ban Mới",
          quota: parseInt(r["Định Biên"] || r.Quota || "50", 10),
          current: parseInt(r["Hiện Có"] || r.Current || "45", 10),
          status: String(r["Trạng Thái"] || r.Status || "Thiếu định biên").trim(),
        }));

        setHeadcounts((prev) => [...prev, ...newHc]);
        showToast(`Đã import thành công ${newHc.length} định biên phòng ban từ Excel!`);
      } catch (err: any) {
        alert("Lỗi đọc file Excel: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  /* ── 4. TRANSFERS HANDLERS (Tab 4) ─────────────────────────────────────── */
  const handleOpenAddTrf = () => {
    setEditingTrfId(null);
    setTrfForm({
      id: `TRF-${Date.now().toString().slice(-4)}`,
      title: "",
      empName: "",
      from: "",
      to: "",
      date: new Date().toISOString().slice(0, 10),
      status: "Đã phê duyệt",
    });
    setIsTrfModalOpen(true);
  };

  const handleOpenEditTrf = (trf: typeof INITIAL_TRANSFERS[0]) => {
    setEditingTrfId(trf.id);
    setTrfForm({ ...trf });
    setIsTrfModalOpen(true);
  };

  const handleSaveTrf = () => {
    if (!trfForm.title.trim()) return alert("Vui lòng nhập tiêu đề quyết định!");
    if (!trfForm.empName.trim()) return alert("Vui lòng nhập tên nhân viên!");

    if (editingTrfId) {
      setTransfers((prev) => prev.map((t) => (t.id === editingTrfId ? { ...trfForm } : t)));
      showToast(`Đã cập nhật quyết định cho "${trfForm.empName}"!`);
    } else {
      setTransfers((prev) => [trfForm, ...prev]);
      showToast(`Đã tạo quyết định điều chuyển/bổ nhiệm cho "${trfForm.empName}"!`);
    }
    setIsTrfModalOpen(false);
  };

  const handleImportTrfExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rows || rows.length === 0) return alert("File Excel rỗng!");

        const newTrfs = rows.map((r, idx) => ({
          id: `TRF-IMP-${Date.now()}-${idx}`,
          title: String(r["Tiêu Đề Quyết Định"] || r["Tên Quyết Định"] || `Quyết định điều chuyển ${idx + 1}`).trim(),
          empName: String(r["Tên Nhân Viên"] || r.Name || "Nhân Viên").trim(),
          from: String(r["Chức Danh Cũ"] || r.From || "Chuyên Viên").trim(),
          to: String(r["Chức Danh Mới"] || r.To || "Trưởng Nhóm").trim(),
          date: String(r["Ngày Hiệu Lực"] || r.Date || new Date().toISOString().slice(0, 10)).trim(),
          status: "Đã phê duyệt",
        }));

        setTransfers((prev) => [...prev, ...newTrfs]);
        showToast(`Đã import thành công ${newTrfs.length} quyết định từ Excel!`);
      } catch (err: any) {
        alert("Lỗi đọc file Excel: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  /* ── Export Handlers ───────────────────────────────────────────────────── */
  const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}_${Date.now()}.xlsx`);
    showToast(`Đã xuất dữ liệu ra file Excel (${fileName}.xlsx)!`);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Hidden File Inputs for Excel Import per Tab */}
      <input ref={empExcelInputRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImportEmpExcel} />
      <input ref={orgExcelInputRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImportOrgExcel} />
      <input ref={hcExcelInputRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImportHcExcel} />
      <input ref={trfExcelInputRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImportTrfExcel} />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[110] px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-top-2">
          <IconCheck className="text-emerald-400" size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Sub Navigation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {[
            { id: "directory", label: "👥 Danh sách nhân viên", icon: IconUsers },
            { id: "orgchart", label: "🏢 Cơ cấu tổ chức (Org Chart)", icon: IconSitemap },
            { id: "headcount", label: "📊 Định biên nhân sự", icon: IconBuilding },
            { id: "transfers", label: "🔄 Điều chuyển & Bổ nhiệm", icon: IconArrowsExchange },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                subTab === t.id
                  ? "bg-[#006838] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Global Quick Action based on Active Tab */}
        <div className="flex items-center gap-2">
          {subTab === "directory" && (
            <>
              <button
                onClick={handleOpenAddEmp}
                className="px-3.5 py-2 rounded-xl bg-[#006838] hover:bg-[#005230] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconPlus size={15} />
                <span>Thêm Nhân Viên</span>
              </button>
              <button
                onClick={() => empExcelInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconUpload size={15} />
                <span>Import Excel</span>
              </button>
            </>
          )}

          {subTab === "orgchart" && (
            <>
              <button
                onClick={handleOpenAddOrg}
                className="px-3.5 py-2 rounded-xl bg-[#006838] hover:bg-[#005230] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconPlus size={15} />
                <span>Thêm Đơn Vị / PB</span>
              </button>
              <button
                onClick={() => orgExcelInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconUpload size={15} />
                <span>Import Cơ Cấu Excel</span>
              </button>
            </>
          )}

          {subTab === "headcount" && (
            <>
              <button
                onClick={handleOpenAddHc}
                className="px-3.5 py-2 rounded-xl bg-[#006838] hover:bg-[#005230] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconPlus size={15} />
                <span>Thêm Định Biên</span>
              </button>
              <button
                onClick={() => hcExcelInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconUpload size={15} />
                <span>Import Định Biên Excel</span>
              </button>
            </>
          )}

          {subTab === "transfers" && (
            <>
              <button
                onClick={handleOpenAddTrf}
                className="px-3.5 py-2 rounded-xl bg-[#006838] hover:bg-[#005230] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconPlus size={15} />
                <span>Thêm Quyết Định</span>
              </button>
              <button
                onClick={() => trfExcelInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconUpload size={15} />
                <span>Import Quyết Định Excel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── TAB 1: DANH SÁCH NHÂN VIÊN ─────────────────────────────────────── */}
      {subTab === "directory" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, mã NV, chức danh..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006838]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">Tất cả phòng ban</option>
                <option value="Nhân Sự">Nhân Sự - Hành Chánh</option>
                <option value="Hành Chính">Hành Chính - Lễ Tân</option>
                <option value="IT">Khối IT &amp; CĐS</option>
                <option value="QC">Khối QC</option>
                <option value="Kế Toán">Kế Toán &amp; Tài Chính</option>
              </select>

              <button
                onClick={() => exportToExcel(employees, "Danh_Sach_Nhan_Su_TBS")}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconDownload size={14} />
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Mã NV / Họ &amp; Tên</th>
                    <th className="px-4 py-3.5">Chức danh</th>
                    <th className="px-4 py-3.5">Phòng ban / Chi nhánh</th>
                    <th className="px-4 py-3.5">Loại hợp đồng</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={emp.avatar} name={emp.name} size="md" />
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{emp.name}</span>
                              {emp.isHighPerformer && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black">HIGH</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{emp.id} • {emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{emp.title}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{emp.department}</div>
                        <div className="text-[10px] text-slate-400">{emp.branch}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{emp.contractType}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          emp.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {emp.status === "Active" ? "Chính thức" : "Thử việc"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditEmp(emp)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="Sửa thông tin nhân viên"
                          >
                            <IconEdit size={14} />
                          </button>
                          <button
                            onClick={() => setSelectedEmp(emp)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-[#006838] text-[#006838] hover:text-white font-bold text-xs transition cursor-pointer"
                          >
                            Xem hồ sơ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ORG CHART (CƠ CẤU TỔ CHỨC) ───────────────────────────── */}
      {subTab === "orgchart" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Sơ Đồ Cơ Cấu Tổ Chức TBS Group &amp; Skechers HQ</h3>
              <p className="text-xs text-slate-500 font-medium">Hệ thống phân cấp Khối - Phòng ban - Bộ phận nghiệp vụ</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddOrg}
                className="px-3.5 py-2 rounded-xl bg-[#006838] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconPlus size={15} />
                <span>Thêm Đơn Vị</span>
              </button>
              <button
                onClick={() => exportToExcel(orgUnits, "Co_Cau_To_Chuc_TBS")}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconDownload size={14} />
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>

          {/* Org Chart Diagram Nodes */}
          <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-6 max-w-5xl mx-auto">
            {/* Level 1: CEO Node */}
            <div className="relative group inline-block p-4 bg-[#006838] text-white rounded-2xl shadow-md space-y-1 text-center min-w-[280px]">
              <span className="text-[10px] uppercase font-bold text-emerald-200">BAN GIÁM ĐỐC TẬP ĐOÀN</span>
              <h4 className="text-sm font-black">Tổng Giám Đốc (CEO) — TBS Group</h4>
              <p className="text-[10px] text-emerald-100">Điều hành toàn bộ chuỗi sản xuất Skechers</p>
            </div>

            <div className="w-0.5 h-6 bg-slate-300 mx-auto" />

            {/* Level 2: Department Units */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
              {orgUnits.filter((u) => u.level === 2).map((unit) => (
                <div key={unit.id} className="group relative p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-[#006838] transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#006838] text-[9px] font-extrabold uppercase">
                      {unit.code}
                    </span>
                    <button
                      onClick={() => handleOpenEditOrg(unit)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                      title="Sửa phòng ban"
                    >
                      <IconEdit size={13} />
                    </button>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 leading-tight">{unit.name}</h5>
                    <p className="text-[11px] text-slate-600 font-semibold mt-1">Lãnh đạo: {unit.leader}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{unit.headcount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: HEADCOUNT MATRIX (ĐỊNH BIÊN NHÂN SỰ) ──────────────────── */}
      {subTab === "headcount" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Định Biên Nhân Sự (Headcount Planning 2026)</h3>
              <p className="text-xs text-slate-500 font-medium">So sánh định biên được duyệt vs Nhân sự hiện tại theo từng phòng ban</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddHc}
                className="px-3.5 py-1.5 rounded-xl bg-[#006838] hover:bg-[#005230] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconPlus size={14} />
                <span>Thêm Định Biên</span>
              </button>
              <button
                onClick={() => exportToExcel(headcounts, "Dinh_Bien_Nhan_Su_TBS")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconDownload size={14} />
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Phòng ban / Bộ phận</th>
                  <th className="px-4 py-3">Định biên duyệt</th>
                  <th className="px-4 py-3">Hiện có</th>
                  <th className="px-4 py-3">Còn thiếu (Tuyển thêm)</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {headcounts.map((row) => {
                  const diff = row.quota - row.current;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{row.dept}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{row.quota}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#006838]">{row.current}</td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600">
                        {diff > 0 ? `+${diff}` : "0"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          diff > 0 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenEditHc(row)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="Sửa định biên"
                        >
                          <IconEdit size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: TRANSFERS & APPOINTMENTS (ĐIỀU CHUYỂN & BỔ NHIỆM) ─────── */}
      {subTab === "transfers" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Quản Lý Điều Chuyển &amp; Bổ Nhiệm</h3>
              <p className="text-xs text-slate-500 font-medium">Theo dõi quyết định thay đổi chức danh, bổ nhiệm và luân chuyển chi nhánh</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddTrf}
                className="px-3.5 py-1.5 rounded-xl bg-[#006838] hover:bg-[#005230] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconPlus size={14} />
                <span>Tạo Quyết Định</span>
              </button>
              <button
                onClick={() => exportToExcel(transfers, "Quyet_Dinh_Dieu_Chuyen_TBS")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <IconDownload size={14} />
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {transfers.map((t) => (
              <div key={t.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-100/60 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900">{t.title}</h4>
                    <span className="px-2 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      {t.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                    <span>Nhân viên: <strong>{t.empName}</strong></span>
                    <span>•</span>
                    <span>Từ: <strong>{t.from}</strong></span>
                    <span>→</span>
                    <span>Thành: <strong className="text-[#006838]">{t.to}</strong></span>
                    <span>•</span>
                    <span className="font-mono">{t.date}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEditTrf(t)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <IconEdit size={13} />
                  <span>Sửa</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL 1: ADD/EDIT EMPLOYEE ───────────────────────────────────── */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {editingEmpId ? "Sửa Thông Tin Nhân Viên" : "Thêm Nhân Viên Mới"}
              </h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mã NV (MSNV)</label>
                <input
                  type="text"
                  value={empForm.id}
                  onChange={(e) => setEmpForm({ ...empForm, id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  placeholder="202608..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ &amp; Tên nhân viên *</label>
                <input
                  type="text"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chức danh *</label>
                  <input
                    type="text"
                    value={empForm.title}
                    onChange={(e) => setEmpForm({ ...empForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    placeholder="Chuyên Viên HR..."
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phòng ban</label>
                  <input
                    type="text"
                    value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    placeholder="Nhân Sự..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại hợp đồng</label>
                  <select
                    value={empForm.contractType}
                    onChange={(e) => setEmpForm({ ...empForm, contractType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="Chính thức">Chính thức</option>
                    <option value="Thử việc">Thử việc</option>
                    <option value="Thời vụ">Thời vụ</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="email@tbsgroup.vn"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button onClick={() => setIsEmpModalOpen(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs">
                Hủy
              </button>
              <button onClick={handleSaveEmp} className="w-1/2 py-2.5 rounded-xl bg-[#006838] text-white font-bold text-xs">
                Lưu Nhân Viên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD/EDIT ORG UNIT ───────────────────────────────────── */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {editingOrgId ? "Sửa Phòng Ban / Đơn Vị" : "Thêm Phòng Ban / Đơn Vị Mới"}
              </h3>
              <button onClick={() => setIsOrgModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mã Phòng Ban</label>
                <input
                  type="text"
                  value={orgForm.code}
                  onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  placeholder="K-IT, K-QC, K-NS..."
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Phòng Ban / Khối *</label>
                <input
                  type="text"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  placeholder="Khối IT & Chuyển Đổi Số..."
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lãnh đạo / Trưởng phòng</label>
                <input
                  type="text"
                  value={orgForm.leader}
                  onChange={(e) => setOrgForm({ ...orgForm, leader: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  placeholder="Phạm Nguyễn Anh Huy..."
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Quy mô nhân sự</label>
                <input
                  type="text"
                  value={orgForm.headcount}
                  onChange={(e) => setOrgForm({ ...orgForm, headcount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  placeholder="140 nhân sự..."
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button onClick={() => setIsOrgModalOpen(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs">
                Hủy
              </button>
              <button onClick={handleSaveOrg} className="w-1/2 py-2.5 rounded-xl bg-[#006838] text-white font-bold text-xs">
                Lưu Đơn Vị
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: ADD/EDIT HEADCOUNT ──────────────────────────────────── */}
      {isHcModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {editingHcId ? "Sửa Định Biên Phòng Ban" : "Thêm Định Biên Phòng Ban"}
              </h3>
              <button onClick={() => setIsHcModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Phòng Ban *</label>
                <input
                  type="text"
                  value={hcForm.dept}
                  onChange={(e) => setHcForm({ ...hcForm, dept: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  placeholder="Khối QC & Quản trị chất lượng..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Định biên duyệt</label>
                  <input
                    type="number"
                    value={hcForm.quota}
                    onChange={(e) => setHcForm({ ...hcForm, quota: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hiện có</label>
                  <input
                    type="number"
                    value={hcForm.current}
                    onChange={(e) => setHcForm({ ...hcForm, current: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Trạng thái</label>
                <input
                  type="text"
                  value={hcForm.status}
                  onChange={(e) => setHcForm({ ...hcForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  placeholder="Thiếu định biên / Đạt 100%..."
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button onClick={() => setIsHcModalOpen(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs">
                Hủy
              </button>
              <button onClick={handleSaveHc} className="w-1/2 py-2.5 rounded-xl bg-[#006838] text-white font-bold text-xs">
                Lưu Định Biên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: ADD/EDIT TRANSFER ────────────────────────────────────── */}
      {isTrfModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {editingTrfId ? "Sửa Quyết Định Điều Chuyển" : "Tạo Quyết Định Điều Chuyển Mới"}
              </h3>
              <button onClick={() => setIsTrfModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề quyết định *</label>
                <input
                  type="text"
                  value={trfForm.title}
                  onChange={(e) => setTrfForm({ ...trfForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  placeholder="Bổ nhiệm Phó Trưởng Phòng..."
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên nhân viên *</label>
                <input
                  type="text"
                  value={trfForm.empName}
                  onChange={(e) => setTrfForm({ ...trfForm, empName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  placeholder="Nguyễn Văn A..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vị trí/Chức danh cũ</label>
                  <input
                    type="text"
                    value={trfForm.from}
                    onChange={(e) => setTrfForm({ ...trfForm, from: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="Chuyên viên..."
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vị trí/Chức danh mới</label>
                  <input
                    type="text"
                    value={trfForm.to}
                    onChange={(e) => setTrfForm({ ...trfForm, to: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#006838]"
                    placeholder="Trưởng Nhóm..."
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày áp dụng</label>
                <input
                  type="date"
                  value={trfForm.date}
                  onChange={(e) => setTrfForm({ ...trfForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button onClick={() => setIsTrfModalOpen(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs">
                Hủy
              </button>
              <button onClick={handleSaveTrf} className="w-1/2 py-2.5 rounded-xl bg-[#006838] text-white font-bold text-xs">
                Lưu Quyết Định
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: EMPLOYEE DETAIL PREVIEW ─────────────────────────────── */}
      {selectedEmp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <UserAvatar src={selectedEmp.avatar} name={selectedEmp.name} size="lg" />
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedEmp.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{selectedEmp.id} • {selectedEmp.title}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-slate-700">
                <IconX size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Phòng ban</span>
                  <span className="font-bold text-slate-800">{selectedEmp.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Loại hợp đồng</span>
                  <span className="font-bold text-slate-800">{selectedEmp.contractType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Lương cơ bản</span>
                  <span className="font-bold text-[#006838] font-mono">{selectedEmp.salaryBase || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Đánh giá KPI</span>
                  <span className="font-bold text-purple-700">{selectedEmp.performanceScore || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button onClick={() => setSelectedEmp(null)} className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
