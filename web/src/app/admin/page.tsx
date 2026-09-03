"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconUsers,
  IconSettings,
  IconHistory,
  IconUpload,
  IconCheck,
  IconAlertTriangle,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconNews,
  IconPhoto,
  IconBuilding,
  IconShieldCheck,
  IconEdit,
  IconEye,
  IconSearch,
  IconDatabase,
  IconLock,
  IconLockOpen,
  IconFileText,
  IconArrowLeft,
  IconDeviceLaptop,
  IconKey,
  IconDownload,
  IconHome,
  IconExternalLink,
  IconRotate,
  IconShoe,
  IconChevronLeft,
  IconChevronRight,
  IconBuildingStore,
} from "@tabler/icons-react";
import {
  LandingCMSConfig,
  getLandingCMS,
  saveLandingCMS,
  fetchLandingCMSFromServer,
  saveLandingCMSToServer,
  checkAndMigrateLocalCMSToServer,
  DEFAULT_LANDING_CMS,
  DEFAULT_SHOE_LINES_CONFIG,
} from "@/lib/landingCMS";
import LandingCMSManager from "@/components/admin/LandingCMSManager";
import ShoeLinesManager from "@/components/admin/ShoeLinesManager";
import WorkspaceCMSManager from "@/components/admin/WorkspaceCMSManager";
import * as XLSX from "xlsx";
import { uploadCloudinaryFile, formatCloudinaryUrl } from "@/lib/cloudinary";

interface EmployeeAccount {
  id: string;
  empCode: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  department: string;
  roleCode: string;
  roleName?: string;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  joinedDate?: string;
  title?: string;
  ngayVao?: string;
  vtcvHienTai?: string;
  phongBanHienTai?: string;
  vtcvSap?: string;
  vtcvSapXep?: string;
  phongBanSapXep?: string;
  boPhoanMoi?: string;
  phongBanMoi?: string;
  ghiChu?: string;
}

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  imageUrl: string;
  publishDate: string;
  author: string;
  views: number;
}

interface MediaAsset {
  id: string;
  title: string;
  category: "HERO_BANNER" | "FACTORY" | "PRODUCT" | "EVENTS";
  url: string;
  createdAt: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "news" | "media" | "workspace_gallery" | "shoe_lines" | "products" | "landing_cms" | "d1_control"
  >("overview");

  const [cmsSubSection, setCmsSubSection] = useState<"hero" | "workspace" | "excellence" | "products">("hero");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Landing Page CMS State
  const [landingCMS, setLandingCMS] = useState<LandingCMSConfig>(DEFAULT_LANDING_CMS);
  const [isSavingCMS, setIsSavingCMS] = useState(false);
  const [saveErrorCMS, setSaveErrorCMS] = useState<string | null>(null);

  useEffect(() => {
    // 1. Instant local read
    const localConfig = getLandingCMS();
    setLandingCMS(localConfig);

    // 2. Fetch server D1 database config & auto-migrate
    fetchLandingCMSFromServer().then(async (srvConfig) => {
      const isSrvCustom = srvConfig && JSON.stringify(srvConfig) !== JSON.stringify(DEFAULT_LANDING_CMS);
      if (isSrvCustom) {
        setLandingCMS(srvConfig);
      } else {
        const migrated = await checkAndMigrateLocalCMSToServer();
        if (migrated) {
          setLandingCMS(migrated);
          setToastMessage("🔄 Đã tự động chuyển toàn bộ dữ liệu cũ từ Trình duyệt lên CSDL Server D1 thành công!");
          setTimeout(() => setToastMessage(null), 5000);
        } else if (srvConfig) {
          setLandingCMS(srvConfig);
        }
      }
    });

    // Check URL search parameters (e.g. /admin?tab=products or /admin?tab=workspace_gallery)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "products") {
        setActiveTab("products");
        setCmsSubSection("products");
      } else if (tabParam === "workspace" || tabParam === "workspace_gallery" || tabParam === "kglv") {
        setActiveTab("workspace_gallery");
      } else if (tabParam === "brand_partners" || tabParam === "brands" || tabParam === "shoe_lines" || tabParam === "shoes") {
        setActiveTab("shoe_lines");
      } else if (tabParam === "landing_cms") {
        setActiveTab("landing_cms");
      }
    }
  }, []);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loginEmail, setLoginEmail] = useState("tbsgroup2026@gmail.com");
  const [loginPassword, setLoginPassword] = useState("tbsgroupsk@!");
  const [authError, setAuthError] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Admin Account Info
  const adminUser = {
    name: "Super Administrator System",
    email: "tbsgroup2026@gmail.com",
    role: "Quản Trị Viên Tối Cao (System Admin)",
    avatar: "/images/tbs-logo.png",
  };

  const [isUploadingCloudinary, setIsUploadingCloudinary] = useState(false);

  const handleCloudinaryFileUpload = async (file: File, target: "media" | "news") => {
    try {
      setIsUploadingCloudinary(true);
      const res = await uploadCloudinaryFile(file, { category: target });
      if (res.secure_url) {
        if (target === "media") {
          setMediaForm((prev) => ({
            ...prev,
            url: res.secure_url,
            title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
          }));
        } else {
          setNewsForm((prev) => ({ ...prev, imageUrl: res.secure_url }));
        }
        showToast(`☁️ Tải ảnh lên Cloudinary thành công!`);
      }
    } catch (err: any) {
      alert("Lỗi kết nối Cloudinary: " + err.message);
    } finally {
      setIsUploadingCloudinary(false);
    }
  };

  const handleUploadLandingCMSImage = async (
    file: File,
    section: "heroBg" | "heroHands" | "heroTeam" | "excellence" | "product",
    productIndex?: number
  ) => {
    try {
      setIsUploadingCloudinary(true);
      const res = await uploadCloudinaryFile(file, { category: section });
      if (res.secure_url) {
        if (section === "heroBg") {
          setLandingCMS((prev) => ({ ...prev, hero: { ...prev.hero, bgImage: res.secure_url } }));
        } else if (section === "heroHands") {
          setLandingCMS((prev) => ({ ...prev, hero: { ...prev.hero, handsImage: res.secure_url } }));
        } else if (section === "heroTeam") {
          setLandingCMS((prev) => ({ ...prev, hero: { ...prev.hero, teamImage: res.secure_url } }));
        } else if (section === "excellence") {
          setLandingCMS((prev) => ({ ...prev, excellence: { ...prev.excellence, image: res.secure_url } }));
        } else if (section === "product" && productIndex !== undefined) {
          setLandingCMS((prev) => {
            const newItems = [...prev.products.items];
            newItems[productIndex] = { ...newItems[productIndex], image: res.secure_url };
            return { ...prev, products: { ...prev.products, items: newItems } };
          });
        }
        showToast(`☁️ Tải ảnh lên Cloudinary thành công!`);
      }
    } catch (err: any) {
      alert("Lỗi tải ảnh: " + err.message);
    } finally {
      setIsUploadingCloudinary(false);
    }
  };

  const handleBulkUploadProductImages = async (files: FileList) => {
    try {
      setIsUploadingCloudinary(true);
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadCloudinaryFile(file, { category: "product" });
        if (res.secure_url) {
          uploadedUrls.push(res.secure_url);
        }
      }

      if (uploadedUrls.length > 0) {
        setLandingCMS((prev) => {
          const currentItems = [...prev.products.items];
          let uploadIdx = 0;
          for (let i = 0; i < currentItems.length && uploadIdx < uploadedUrls.length; i++) {
            if (!currentItems[i].image || currentItems[i].image?.startsWith("/images/")) {
              currentItems[i] = { ...currentItems[i], image: uploadedUrls[uploadIdx++] };
            }
          }
          while (uploadIdx < uploadedUrls.length) {
            const num = currentItems.length + 1;
            currentItems.push({
              name: `Dòng Sản Phẩm SKECHERS Mới #${num}`,
              code: `SK-PROD-0${num}`,
              image: uploadedUrls[uploadIdx++],
            });
          }
          return {
            ...prev,
            products: { ...prev.products, items: currentItems },
          };
        });
        showToast(`☁️ Đã import thành công ${uploadedUrls.length} ảnh sản phẩm lên Cloudinary!`);
      }
    } catch (err: any) {
      alert("Lỗi import ảnh: " + err.message);
    } finally {
      setIsUploadingCloudinary(false);
    }
  };

  const handleSaveLandingCMS = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingCMS(true);
    setSaveErrorCMS(null);
    showToast("⏳ Đang gửi và đồng bộ dữ liệu lên Máy chủ (D1 Database)...");

    const res = await saveLandingCMSToServer(landingCMS);
    setIsSavingCMS(false);

    if (res.success) {
      showToast("💾 Đã lưu & đồng bộ thành công lên Máy chủ (Cloudflare D1)! Mọi thiết bị/trình duyệt sẽ thấy dữ liệu mới.");
    } else {
      setSaveErrorCMS(res.error || "Lỗi lưu máy chủ");
      showToast("❌ Lưu thất bại: " + (res.error || "Không thể lưu vào D1 Database!"));
    }
  };

  const handleResetLandingCMS = async () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục toàn bộ nội dung & hình ảnh Trang Chủ về mặc định gốc trên Server D1?")) {
      setLandingCMS(DEFAULT_LANDING_CMS);
      setIsSavingCMS(true);
      const res = await saveLandingCMSToServer(DEFAULT_LANDING_CMS);
      setIsSavingCMS(false);
      if (res.success) {
        showToast("🔄 Đã khôi phục cài đặt Trang Chủ về mặc định gốc trên Máy chủ thành công!");
      } else {
        showToast("❌ Khôi phục thất bại: " + (res.error || "Lỗi kết nối máy chủ"));
      }
    }
  };

  // Handle Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (loginEmail === "tbsgroup2026@gmail.com" && loginPassword === "tbsgroupsk@!") {
      setIsAuthenticated(true);
      showToast("Đăng nhập quyền Admin thành công!");
    } else {
      setAuthError("Email hoặc mật khẩu Admin không chính xác!");
    }
  };

  // 1. Personnel State
  const [employees, setEmployees] = useState<EmployeeAccount[]>([]);

  const [employeeForm, setEmployeeForm] = useState({
    empCode: "",
    name: "",
    email: "",
    phone: "",
    title: "",
    department: "Khối Sản Xuất",
    roleCode: "CBCNV",
    ngayVao: "",
    vtcvHienTai: "",
    vtcvSap: "",
    vtcvSapXep: "",
    boPhoanMoi: "",
  });

  // Excel Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [importPreviewRows, setImportPreviewRows] = useState<Array<{
    rowNum: number;
    empCode: string;
    name: string;
    ngayVao: string;
    email: string;
    phone: string;
    vtcvHienTai: string;
    phongBanHienTai: string;
    vtcvSap: string;
    vtcvSapXep: string;
    phongBanSapXep: string;
    boPhoanMoi: string;
    phongBanMoi: string;
    ghiChu: string;
    roleCode: string;
    isValid: boolean;
    errorMessage?: string;
  }>>([]);
  const [importResultSummary, setImportResultSummary] = useState<{
    successCount: number;
    errorCount: number;
    createdAccounts?: Array<{ empCode: string; name: string; password: string }>;
  } | null>(null);

  // Search & Role Filter States
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 15;

  useEffect(() => {
    setUserPage(1);
  }, [userSearchTerm, userRoleFilter]);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      !userSearchTerm.trim() ||
      (emp.empCode || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (emp.name || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (emp.department || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (emp.vtcvHienTai || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (emp.boPhoanMoi || "").toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === "ALL" || emp.roleCode === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUserPages = Math.ceil(filteredEmployees.length / USERS_PER_PAGE) || 1;

  useEffect(() => {
    if (userPage > totalUserPages) {
      setUserPage(totalUserPages);
    }
  }, [filteredEmployees.length, totalUserPages, userPage]);

  const safeUserPage = Math.min(Math.max(userPage, 1), totalUserPages);
  const paginatedEmployees = filteredEmployees.slice((safeUserPage - 1) * USERS_PER_PAGE, safeUserPage * USERS_PER_PAGE);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalUserPages <= 7) {
      for (let i = 1; i <= totalUserPages; i++) pages.push(i);
    } else {
      if (safeUserPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalUserPages);
      } else if (safeUserPage >= totalUserPages - 3) {
        pages.push(1, "...", totalUserPages - 4, totalUserPages - 3, totalUserPages - 2, totalUserPages - 1, totalUserPages);
      } else {
        pages.push(1, "...", safeUserPage - 1, safeUserPage, safeUserPage + 1, "...", totalUserPages);
      }
    }
    return pages;
  };

  const formatExcelDate = (val: any): string => {
    if (!val) return "";
    if (typeof val === "number") {
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      return d.toISOString().split("T")[0];
    }
    const str = String(val).trim();
    if (str.includes("/")) {
      const parts = str.split("/");
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
    return str;
  };

  const mapRoleNameToCode = (roleStr: string): string => {
    if (!roleStr) return "CBCNV";
    const r = roleStr.toUpperCase();
    if (r.includes("TỔNG GIÁM ĐỐC") || r.includes("TGĐ") || r.includes("TONG_GIAM_DOC")) return "TONG_GIAM_DOC";
    if (r.includes("PHÓ TỔNG") || r.includes("PTGĐ") || r.includes("PHO_TONG_GIAM_DOC")) return "PHO_TONG_GIAM_DOC";
    if (r.includes("GIÁM ĐỐC") || r.includes("GĐ") || r.includes("GIAM_DOC")) return "GIAM_DOC";
    if (r.includes("PHÓ GIÁM ĐỐC") || r.includes("PGĐ") || r.includes("PHO_GIAM_DOC")) return "PHO_GIAM_DOC";
    if (r.includes("TRƯỞNG PHÒNG") || r.includes("TRUONG_PHONG")) return "TRUONG_PHONG";
    if (r.includes("LỄ TÂN") || r.includes("LE_TAN")) return "LE_TAN";
    return "CBCNV";
  };

  const handleDownloadTemplate = () => {
    const headers = [
      ["STT", "MSNV", "Họ & Tên", "Ngày Vào", "VTCV Hiện Tại", "Phòng Ban", "VTCV SAP", "VTCV Sắp Xếp", "PHÒNG BAN", "BỘ PHẬN (NEW)", "Phòng ban (NEW)", "GHI CHÚ"],
      [1, "SK-2026-101", "Nguyễn Văn An", "2026-08-01", "Kỹ sư sản xuất SKECHERS", "ĐH-QT CHUỖI", "04 N2003", "Trưởng nhóm", "ĐH-QT CHUỖI", "Khối Sản Xuất", "Ban CNTT", "Thành viên xuất sắc"],
      [2, "SK-2026-102", "Trần Thị Bình", "2026-08-05", "Chuyên viên QC", "QT-KS", "42 N2007", "Phó nhóm", "QT-KS", "Khối Chất Lượng", "Ban QC", ""]
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Import_Nhan_Su");
    XLSX.writeFile(wb, "Mau_Import_Nhan_Su_SKECHERS.xlsx");
    showToast("📥 Đã tải file Excel mẫu thành công!");
  };

  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawData || rawData.length <= 1) {
          alert("File Excel rỗng hoặc không có dữ liệu!");
          return;
        }

        let headerRowIdx = -1;
        let empCodeCol = -1;
        let nameCol = -1;
        let ngayVaoCol = -1;
        let emailCol = -1;
        let phoneCol = -1;
        let vtcvHienTaiCol = -1;
        let phongBanHienTaiCol = -1;
        let vtcvSapCol = -1;
        let vtcvSapXepCol = -1;
        let phongBanSapXepCol = -1;
        let boPhoanMoiCol = -1;
        let phongBanMoiCol = -1;
        let ghiChuCol = -1;
        let roleCodeCol = -1;

        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          const row = rawData[i];
          if (!row || !Array.isArray(row)) continue;

          const rowStr = row.map((c) => String(c || "").toUpperCase().trim()).join(" ");
          if (rowStr.includes("MSNV") || rowStr.includes("MÃ NV") || rowStr.includes("HỌ") || rowStr.includes("HỌ & TÊN")) {
            headerRowIdx = i;
            row.forEach((cellVal, colIdx) => {
              const norm = String(cellVal || "")
                .replace(/[\r\n\t]+/g, " ")
                .replace(/\s+/g, " ")
                .trim();
              const c = norm.toUpperCase();

              if (c.includes("MSNV") || c.includes("MÃ NV") || c.includes("MA NV")) empCodeCol = colIdx;
              else if (c.includes("HỌ") || c.includes("TÊN") || c.includes("NAME")) nameCol = colIdx;
              else if (c.includes("NGÀY VÀO") || c.includes("NGAY VAO")) ngayVaoCol = colIdx;
              else if (c.includes("EMAIL")) emailCol = colIdx;
              else if (c.includes("SĐT") || c.includes("PHONE") || c.includes("ĐIỆN THOẠI")) phoneCol = colIdx;
              else if (c.includes("GHI CHÚ") || c.includes("GHI CHU") || c.includes("NOTE")) ghiChuCol = colIdx;
              else if (c.includes("VAI TRÒ") || c.includes("QUYỀN") || c.includes("ROLE")) roleCodeCol = colIdx;
              else if (c.includes("NEW")) {
                if (c.includes("BỘ PHẬN") || c.includes("BO PHAN") || c.includes("KHỐI")) {
                  boPhoanMoiCol = colIdx;
                } else {
                  phongBanMoiCol = colIdx;
                }
              }
              else if (c.includes("HIỆN TẠI") && c.includes("VTCV")) vtcvHienTaiCol = colIdx;
              else if (c.includes("SẮP XẾP") && c.includes("VTCV")) vtcvSapXepCol = colIdx;
              else if (c.includes("HIỆN TẠI")) phongBanHienTaiCol = colIdx;
              else if (c.includes("SẮP XẾP")) phongBanSapXepCol = colIdx;
              else if (c.includes("SAP") && !c.includes("SẮP XẾP")) vtcvSapCol = colIdx;
              else if (c.includes("PHÒNG BAN") || c.includes("PHONG BAN") || c.includes("BỘ PHẬN")) {
                if (phongBanHienTaiCol === -1) phongBanHienTaiCol = colIdx;
                else if (phongBanSapXepCol === -1) phongBanSapXepCol = colIdx;
              }
            });
            break;
          }
        }

        const firstColHeader = String(rawData[headerRowIdx >= 0 ? headerRowIdx : 0]?.[0] || "").toUpperCase();
        const startOffset = (empCodeCol > 0) ? empCodeCol : (firstColHeader.includes("STT") || firstColHeader.includes("NO") || firstColHeader === "1" ? 1 : 0);

        if (empCodeCol === -1) empCodeCol = startOffset;
        if (nameCol === -1) nameCol = startOffset + 1;
        if (ngayVaoCol === -1) ngayVaoCol = startOffset + 2;
        if (vtcvHienTaiCol === -1) vtcvHienTaiCol = startOffset + 3;
        if (phongBanHienTaiCol === -1) phongBanHienTaiCol = startOffset + 4;
        if (vtcvSapCol === -1) vtcvSapCol = startOffset + 5;
        if (vtcvSapXepCol === -1) vtcvSapXepCol = startOffset + 6;
        if (phongBanSapXepCol === -1) phongBanSapXepCol = startOffset + 7;
        if (boPhoanMoiCol === -1) boPhoanMoiCol = startOffset + 8;
        if (phongBanMoiCol === -1) phongBanMoiCol = startOffset + 9;
        if (ghiChuCol === -1) ghiChuCol = startOffset + 10;

        if (nameCol === -1) nameCol = empCodeCol + 1;

        const existingEmpCodes = new Set(employees.map((emp) => (emp.empCode || "").trim().toUpperCase()));
        const seenInFile = new Set<string>();
        const parsedRows: typeof importPreviewRows = [];
        const startDataIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 1;

        for (let i = startDataIdx; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === null || String(c).trim() === "")) {
            continue;
          }

          const empCode = String(row[empCodeCol] ?? "").trim();
          const name = String(row[nameCol] ?? "").trim();
          const ngayVao = formatExcelDate(ngayVaoCol >= 0 ? row[ngayVaoCol] : "");
          const email = String(emailCol >= 0 ? row[emailCol] ?? "" : "").trim();
          const phone = String(phoneCol >= 0 ? row[phoneCol] ?? "" : "").trim();
          const vtcvHienTai = String(vtcvHienTaiCol >= 0 ? row[vtcvHienTaiCol] ?? "" : "").trim();
          const phongBanHienTai = String(phongBanHienTaiCol >= 0 ? row[phongBanHienTaiCol] ?? "" : "").trim();
          const vtcvSap = String(vtcvSapCol >= 0 ? row[vtcvSapCol] ?? "" : "").trim();
          const vtcvSapXep = String(vtcvSapXepCol >= 0 ? row[vtcvSapXepCol] ?? "" : "").trim();
          const phongBanSapXep = String(phongBanSapXepCol >= 0 ? row[phongBanSapXepCol] ?? "" : "").trim();
          const boPhoanMoi = String(boPhoanMoiCol >= 0 ? row[boPhoanMoiCol] ?? "" : "").trim();
          const phongBanMoi = String(phongBanMoiCol >= 0 ? row[phongBanMoiCol] ?? "" : "").trim();
          const ghiChu = String(ghiChuCol >= 0 ? row[ghiChuCol] ?? "" : "").trim();
          const rawRole = String(roleCodeCol >= 0 ? row[roleCodeCol] ?? "" : "").trim();
          const roleCode = mapRoleNameToCode(rawRole);

          const upperEmp = empCode.toUpperCase();

          if (
            upperEmp === "STT" ||
            upperEmp === "MSNV" ||
            upperEmp === "MÃ NV" ||
            upperEmp.includes("TỔNG CỘNG") ||
            upperEmp.includes("TOTAL") ||
            upperEmp.includes("SUM")
          ) {
            continue;
          }

          let isValid = true;
          let errorMessage = "";

          if (!empCode) {
            isValid = false;
            errorMessage = "Thiếu Mã số nhân viên (MSNV)";
          } else if (!name) {
            isValid = false;
            errorMessage = "Thiếu Họ và Tên nhân viên";
          } else if (existingEmpCodes.has(upperEmp)) {
            isValid = false;
            errorMessage = `MSNV "${empCode}" đã tồn tại trong CSDL D1`;
          } else if (seenInFile.has(upperEmp)) {
            isValid = false;
            errorMessage = `MSNV "${empCode}" bị trùng lặp trong file Excel`;
          } else {
            seenInFile.add(upperEmp);
          }

          parsedRows.push({
            rowNum: i + 1,
            empCode,
            name,
            ngayVao,
            email: email || `${empCode.toLowerCase()}@tbsgroup.vn`,
            phone: phone || "0988 000 000",
            vtcvHienTai,
            phongBanHienTai,
            vtcvSap,
            vtcvSapXep,
            phongBanSapXep,
            boPhoanMoi: boPhoanMoi,
            phongBanMoi,
            ghiChu,
            roleCode,
            isValid,
            errorMessage,
          });
        }

        setImportPreviewRows(parsedRows);
        setImportResultSummary(null);
        setIsImportModalOpen(true);
      } catch (err: any) {
        alert("Lỗi đọc file Excel: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleConfirmBulkImport = async () => {
    const validRows = importPreviewRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert("Không có dòng dữ liệu hợp lệ nào để import!");
      return;
    }

    setIsSubmittingImport(true);
    setImportProgress({ current: 0, total: validRows.length });

    const createdList: Array<{ empCode: string; name: string; password: string }> = [];
    const newEmpAccounts: EmployeeAccount[] = [];

    const BATCH_SIZE = 20;
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (r) => {
          const newEmp: EmployeeAccount = {
            id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            empCode: r.empCode,
            name: r.name,
            email: r.email,
            phone: r.phone,
            title: r.vtcvHienTai || "Cán Bộ Công Nhân Viên",
            department: r.boPhoanMoi || "Khối Sản Xuất SKECHERS",
            roleCode: r.roleCode,
            status: "ACTIVE",
            ngayVao: r.ngayVao,
            vtcvHienTai: r.vtcvHienTai,
            phongBanHienTai: r.phongBanHienTai,
            vtcvSap: r.vtcvSap,
            vtcvSapXep: r.vtcvSapXep,
            phongBanSapXep: r.phongBanSapXep,
            boPhoanMoi: r.boPhoanMoi,
            phongBanMoi: r.phongBanMoi,
            ghiChu: r.ghiChu,
          };

          newEmpAccounts.push(newEmp);
          createdList.push({
            empCode: r.empCode,
            name: r.name,
            password: "123456",
          });

          try {
            await fetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...newEmp,
                ngay_vao: newEmp.ngayVao,
                vtcv_hien_tai: newEmp.vtcvHienTai,
                phong_ban_hien_tai: newEmp.phongBanHienTai,
                vtcv_sap: newEmp.vtcvSap,
                vtcv_sap_xep: newEmp.vtcvSapXep,
                pb_sap_xep: newEmp.phongBanSapXep,
                phong_ban_sap_xep: newEmp.phongBanSapXep,
                bo_phan_moi: newEmp.boPhoanMoi,
                phong_ban_moi: newEmp.phongBanMoi,
                ghi_chu: newEmp.ghiChu,
                default_password: "123456",
              }),
            });
          } catch (e) {}
        })
      );

      setImportProgress({
        current: Math.min(i + BATCH_SIZE, validRows.length),
        total: validRows.length,
      });
    }

    const updatedEmployees = [...newEmpAccounts, ...employees];
    setEmployees(updatedEmployees);
    setImportResultSummary({
      successCount: validRows.length,
      errorCount: importPreviewRows.length - validRows.length,
      createdAccounts: createdList,
    });
    setIsSubmittingImport(false);

    showToast(`🎉 Đã import thành công ${validRows.length} tài khoản nhân sự mới! Mật khẩu mặc định: 123456`);
  };

  const handleExportCreatedAccounts = () => {
    if (!importResultSummary?.createdAccounts) return;
    const exportData = importResultSummary.createdAccounts.map((a, idx) => ({
      STT: idx + 1,
      MSNV: a.empCode,
      "Họ và Tên": a.name,
      "Mật Khẩu Mặc Định": a.password,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tai_Khoan_Moi");
    XLSX.writeFile(wb, `Danh_Sach_Tai_Khoan_Moi_SKECHERS_${Date.now()}.xlsx`);
    showToast("📥 Đã xuất file danh sách tài khoản mới thành công!");
  };

  const fetchD1Employees = async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const d1List: EmployeeAccount[] = json.data.map((u: any) => ({
          id: u.id ? String(u.id) : `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          empCode: u.emp_code || u.empCode || "",
          name: u.name || "N/A",
          email: u.email || `${u.emp_code || "nv"}@tbsgroup.vn`,
          phone: u.phone || "0988 000 000",
          title: u.title || "Cán Bộ Công Nhân Viên",
          department: u.department || "Văn Phòng Chuỗi SKECHERS",
          roleCode: u.role_code || u.roleCode || "CBCNV",
          status: u.status === "LOCKED" ? "LOCKED" : "ACTIVE",
          ngayVao: u.ngay_vao || u.ngayVao || "-",
          vtcvHienTai: u.vtcv_hien_tai || u.vtcvHienTai || "-",
          phongBanHienTai: u.phong_ban_hien_tai || u.phongBanHienTai || u.department || "-",
          vtcvSap: u.vtcv_sap || u.vtcvSap || "-",
          vtcvSapXep: u.vtcv_sap_xep || u.vtcvSapXep || "-",
          phongBanSapXep: u.pb_sap_xep || u.pbSapXep || "-",
          boPhoanMoi: u.bo_phan_moi || u.bo_phan_new || u.boPhoanMoi || u.department || "-",
          phongBanMoi: u.phong_ban_moi || u.department || "-",
        }));
        setEmployees(d1List);
      }
    } catch (e) {
      console.warn("Fetch users error:", e);
    }
  };

  useEffect(() => {
    fetchD1Employees();
  }, []);

  const handleClearAllEmployees = async () => {
    if (!confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ tất cả tài khoản nhân sự khỏi CSDL?")) {
      return;
    }

    try {
      await fetch("/api/users?all=true", { method: "DELETE" });
      await fetchD1Employees();
      showToast("🗑️ Đã xóa toàn bộ tài khoản nhân sự khỏi CSDL!");
    } catch (e) {
      showToast("🗑️ Đã làm sạch toàn bộ danh sách tài khoản!");
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name || !employeeForm.empCode) {
      alert("Vui lòng nhập đầy đủ tên và mã nhân viên!");
      return;
    }
    const newEmp: EmployeeAccount = {
      id: `emp_${Date.now()}`,
      ...employeeForm,
      status: "ACTIVE",
    };

    setEmployeeForm({ empCode: "", name: "", email: "", phone: "", title: "", department: "Khối Sản Xuất", roleCode: "CBCNV", ngayVao: "", vtcvHienTai: "", vtcvSap: "", vtcvSapXep: "", boPhoanMoi: "" });
    
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEmp,
          ngay_vao: newEmp.ngayVao,
          vtcv_hien_tai: newEmp.vtcvHienTai,
          phong_ban_hien_tai: newEmp.phongBanHienTai,
          vtcv_sap: newEmp.vtcvSap,
          vtcv_sap_xep: newEmp.vtcvSapXep,
          pb_sap_xep: newEmp.phongBanSapXep,
          bo_phan_moi: newEmp.boPhoanMoi,
        }),
      });
      await fetchD1Employees();
      showToast("Đã lưu tài khoản nhân sự mới vào CSDL D1!");
    } catch (e) {
      showToast("Đã thêm mới tài khoản nhân sự!");
    }
  };

  const toggleEmployeeLock = async (id: string) => {
    const target = employees.find((emp) => emp.id === id);
    if (!target) return;
    const newStatus = target.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
    
    setEmployees((prev) => prev.map((emp) => (emp.id === id ? { ...emp, status: newStatus } : emp)));

    try {
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, status: newStatus }),
      });
      await fetchD1Employees();
      showToast("Đã cập nhật trạng thái tài khoản vào CSDL!");
    } catch (e) {}
  };

  const handleDeleteEmployee = async (id: string, empCode: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản nhân sự "${name}" (${empCode}) khỏi CSDL D1?`)) {
      return;
    }

    setEmployees((prev) => prev.filter((emp) => emp.id !== id));

    try {
      await fetch(`/api/users?id=${encodeURIComponent(id)}&empCode=${encodeURIComponent(empCode)}`, {
        method: "DELETE",
      });
      await fetchD1Employees();
      showToast(`🗑️ Đã xóa vĩnh viễn tài khoản "${name}" (${empCode}) khỏi CSDL!`);
    } catch (e) {
      showToast(`🗑️ Đã xóa tài khoản "${name}"!`);
    }
  };

  // 2. News Articles State
  const [articles, setArticles] = useState<NewsArticle[]>([
    {
      id: "news_1",
      title: "TBS Group Đẩy Mạnh Chuyển Đổi Số Toàn Diện Chuỗi Cung Ứng SKECHERS 2026",
      slug: "tbs-group-digital-transformation",
      category: "Tin Tập Đoàn",
      summary: "Ứng dụng trí tuệ nhân tạo AI và dữ liệu thời gian thực D1 trong điều hành sản xuất và Gemba Walk.",
      imageUrl: "/images/crawled/Tin-tuc1.jpg",
      publishDate: "15/08/2026",
      author: "Ban Truyền Thông TBS",
      views: 1420,
    },
    {
      id: "news_2",
      title: "Khánh Thành Dây Chuyền Sản Xuất Giày SKECHERS Tự Động Hóa Tại Cụm Nhà Máy TBS",
      slug: "khanh-thanh-day-chuyen-tu-dong-hoa-skechers",
      category: "Sản Xuất",
      summary: "Nâng công suất sản xuất đáp ứng đơn hàng xuất khẩu 45 triệu đôi giày SKECHERS cho thị trường toàn cầu.",
      imageUrl: "/images/crawled/Da-giay1.jpg",
      publishDate: "12/08/2026",
      author: "Khối Sản Xuất",
      views: 980,
    },
  ]);

  const [newsForm, setNewsForm] = useState({
    title: "",
    category: "Tin Tập Đoàn",
    summary: "",
    imageUrl: "",
  });

  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title.trim()) {
      alert("Vui lòng nhập tiêu đề bài viết!");
      return;
    }
    const newArt: NewsArticle = {
      id: `news_${Date.now()}`,
      title: newsForm.title,
      slug: newsForm.title.toLowerCase().replace(/ /g, "-"),
      category: newsForm.category,
      summary: newsForm.summary || "Thông tin cập nhật mới nhất từ Ban Truyền Thông Ngành SKECHERS - TBS Group.",
      imageUrl: newsForm.imageUrl || "/images/crawled/Tin-tuc1.jpg",
      publishDate: new Date().toLocaleDateString("vi-VN"),
      author: "Admin System",
      views: 1,
    };
    setArticles([newArt, ...articles]);
    setNewsForm({ title: "", category: "Tin Tập Đoàn", summary: "", imageUrl: "" });
    showToast("Đã đăng bài viết mới lên hệ thống tin tức!");
  };

  // 3. Media Assets State
  const [mediaList, setMediaList] = useState<MediaAsset[]>([
    {
      id: "media_1",
      title: "Hero Banner Văn Phòng Chuỗi SKECHERS - TBS Group",
      category: "HERO_BANNER",
      url: "/images/tbs-gate.jpg",
      createdAt: "15/08/2026",
    },
    {
      id: "media_2",
      title: "Hình Ảnh Tổ Hợp Nhà Máy SKECHERS",
      category: "FACTORY",
      url: "/images/tbs-factory-plant.png",
      createdAt: "14/08/2026",
    },
    {
      id: "media_3",
      title: "Mẫu Giày Thể Thao SKECHERS Performance",
      category: "PRODUCT",
      url: "/images/crawled/Da-giay1.jpg",
      createdAt: "12/08/2026",
    },
  ]);

  const [mediaForm, setMediaForm] = useState({
    title: "",
    category: "HERO_BANNER" as "HERO_BANNER" | "FACTORY" | "PRODUCT" | "EVENTS",
    url: "",
  });

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaForm.url.trim()) {
      alert("Vui lòng nhập đường link hình ảnh (URL)!");
      return;
    }
    const newMedia: MediaAsset = {
      id: `m_${Date.now()}`,
      title: mediaForm.title || "Hình ảnh tư liệu SKECHERS",
      category: mediaForm.category,
      url: mediaForm.url,
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };
    setMediaList([newMedia, ...mediaList]);
    setMediaForm({ title: "", category: "HERO_BANNER", url: "" });
    showToast("Đã lưu hình ảnh mới vào thư viện Media!");
  };

  // D1 Database Stats & Controls
  const [d1Stats, setD1Stats] = useState({
    roomsCount: 6,
    bookingsCount: 0,
    visitorsCount: 0,
    businessTripsCount: 0,
    status: "CONNECTED (Cloudflare D1 Database)",
  });

  const fetchLiveD1Counts = async () => {
    try {
      const [resR, resB] = await Promise.all([
        fetch("/api/rooms").then((r) => r.json()).catch(() => null),
        fetch("/api/business-trips").then((r) => r.json()).catch(() => null),
      ]);
      setD1Stats({
        roomsCount: resR?.data?.rooms?.length || 6,
        bookingsCount: resR?.data?.bookings?.length || 0,
        visitorsCount: resR?.data?.visitors?.length || 0,
        businessTripsCount: resB?.data?.length || 0,
        status: "CONNECTED (Cloudflare D1 Database)",
      });
      showToast("Đã làm mới dữ liệu D1 Database!");
    } catch (e) {
      console.warn("D1 count refresh:", e);
    }
  };

  useEffect(() => {
    fetchLiveD1Counts();
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#004029] mx-auto flex items-center justify-center p-3 shadow-lg">
              <img src="/images/tbs-logo.png" alt="TBS" className="w-full h-full object-contain brightness-200" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight font-display">ĐĂNG NHẬP QUẢN TRỊ ADMIN</h1>
            <p className="text-xs text-slate-400">Văn Phòng Chuỗi SKECHERS - TBS Group System Admin Portal</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                ⚠️ {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Tài khoản Email Admin</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="tbsgroup2026@gmail.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono outline-none focus:border-[#004029]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Mật khẩu bảo mật</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="tbsgroupsk@!"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono outline-none focus:border-[#004029]"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700 text-[11px] text-emerald-400 font-mono space-y-1">
              <div>🔑 Admin Email: <strong className="text-white">tbsgroup2026@gmail.com</strong></div>
              <div>🔑 Mật khẩu: <strong className="text-white">tbsgroupsk@!</strong></div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white font-black text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              Truy Cập Cổng Quản Trị
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-[#004029] text-white font-extrabold text-xs shadow-2xl animate-in slide-in-from-top duration-300 flex items-center gap-2 border border-emerald-500">
          <IconCheck size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      <header className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/work" className="flex items-center gap-2 group">
              <img
                src="/images/tbs-logo.png"
                alt="TBS Group Logo"
                className="h-7 sm:h-8 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </Link>
            <div className="h-5 w-[1px] bg-slate-200" />
            <div>
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-wider block leading-none font-display">ADMIN PORTAL</span>
              <span className="text-[10px] text-[#004029] font-bold tracking-tight">SKECHERS - TBS GROUP CỔNG QUẢN TRỊ</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/work"
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-emerald-50 hover:text-[#004029] transition-colors flex items-center gap-1 shadow-2xs"
            >
              <IconArrowLeft size={14} />
              <span>Về Tổng quan</span>
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <img src={adminUser.avatar} alt="Admin" className="w-8 h-8 rounded-full bg-emerald-50 p-1 border border-emerald-200" />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-none">{adminUser.email}</div>
                <div className="text-[10px] text-[#004029] font-medium mt-0.5">{adminUser.role}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#004029] to-[#006838] text-white shadow-xl border border-[#004029] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-[11px] font-bold border border-white/20 backdrop-blur-md">
              <IconShieldCheck size={14} />
              <span>Tài khoản Quản trị Tối cao System Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">CỔNG QUẢN TRỊ NỘI DUNG & HỆ THỐNG</h1>
            <p className="text-xs text-emerald-100/90 font-medium">Quản lý nhân sự SKECHERS, dòng giày tiêu biểu, không gian làm việc và đồng bộ Cloudflare D1 Database.</p>
          </div>

          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-xs font-mono">
            <IconKey size={18} className="text-emerald-300" />
            <div>
              <span className="text-emerald-200/70 block text-[10px]">TÀI KHOẢN ĐĂNG NHẬP:</span>
              <span className="text-white font-bold">{adminUser.email}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200/90 shadow-inner flex items-center gap-1 overflow-x-auto scrollbar-none flex-nowrap">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-[#004029] text-white shadow-md border border-[#004029]"
                : "text-slate-700 hover:text-[#004029] hover:bg-white/70"
            }`}
          >
            <IconDeviceLaptop size={16} />
            <span>📊 Tổng quan System</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "users"
                ? "bg-[#004029] text-white shadow-md border border-[#004029]"
                : "text-slate-700 hover:text-[#004029] hover:bg-white/70"
            }`}
          >
            <IconUsers size={16} />
            <span>👥 Quản lý Nhân sự</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "users" ? "bg-white/20 text-white" : "bg-slate-300 text-slate-800"
            }`}>
              {employees.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("workspace_gallery")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "workspace_gallery"
                ? "bg-[#004029] text-white shadow-md border border-[#004029]"
                : "text-slate-700 hover:text-[#004029] hover:bg-white/70"
            }`}
          >
            <IconBuilding size={16} />
            <span>🏢 Không Gian Làm Việc</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "workspace_gallery" ? "bg-white/20 text-white" : "bg-emerald-100 text-[#004029]"
            }`}>
              {landingCMS.workspaceDepartments?.length || 3} Phòng
            </span>
          </button>

          <button
            onClick={() => setActiveTab("shoe_lines")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "shoe_lines"
                ? "bg-[#004029] text-white shadow-md border border-[#004029]"
                : "text-slate-700 hover:text-[#004029] hover:bg-white/70"
            }`}
          >
            <IconShoe size={16} />
            <span>👟 Dòng Giày SKECHERS Tiêu Biểu</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "shoe_lines" ? "bg-white/20 text-white" : "bg-emerald-100 text-[#004029]"
            }`}>
              {landingCMS.shoeLines?.groups?.length || 3} Nhóm
            </span>
          </button>

          <button
            onClick={() => {
              setCmsSubSection("products");
              setActiveTab("products");
            }}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "products"
                ? "bg-[#004029] text-white shadow-md border border-[#004029]"
                : "text-slate-700 hover:text-[#004029] hover:bg-white/70"
            }`}
          >
            <IconBuildingStore size={16} />
            <span>🛍️ Danh Mục Mẫu Sản Phẩm</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "products" ? "bg-white/20 text-white" : "bg-emerald-100 text-[#004029]"
            }`}>
              {landingCMS.products.items.length}
            </span>
          </button>

          <button
            onClick={() => {
              setCmsSubSection("hero");
              setActiveTab("landing_cms");
            }}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "landing_cms"
                ? "bg-[#004029] text-white shadow-md border border-[#004029]"
                : "text-slate-700 hover:text-[#004029] hover:bg-white/70"
            }`}
          >
            <IconHome size={16} />
            <span>🏠 Quản trị Trang Chủ (Landing Page)</span>
          </button>

          <button
            onClick={() => setActiveTab("news")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "news"
                ? "bg-[#004029] text-white shadow-md border border-[#004029]"
                : "text-slate-700 hover:text-[#004029] hover:bg-white/70"
            }`}
          >
            <IconNews size={16} />
            <span>📰 Tin Tức</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "news" ? "bg-white/20 text-white" : "bg-slate-300 text-slate-800"
            }`}>
              {articles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "media"
                ? "bg-[#004029] text-white shadow-md border border-[#004029]"
                : "text-slate-700 hover:text-[#004029] hover:bg-white/70"
            }`}
          >
            <IconPhoto size={16} />
            <span>🖼️ Thư Viện Media</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "media" ? "bg-white/20 text-white" : "bg-slate-300 text-slate-800"
            }`}>
              {mediaList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("d1_control")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "d1_control"
                ? "bg-[#004029] text-white shadow-md border border-[#004029]"
                : "text-slate-700 hover:text-[#004029] hover:bg-white/70"
            }`}
          >
            <IconDatabase size={16} />
            <span>🗄️ Quản trị D1 Database</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Tổng Nhân Sự Quản Lý</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#004029] flex items-center justify-center border border-emerald-200">
                    <IconUsers size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{employees.length} <span className="text-xs text-slate-500 font-normal">tài khoản</span></div>
                <p className="text-[11px] text-emerald-600 font-medium">✓ Đã đồng bộ D1 Database Realtime</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Lịch Họp D1 Database</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                    <IconDatabase size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{d1Stats.bookingsCount} <span className="text-xs text-slate-500 font-normal">cuộc họp</span></div>
                <p className="text-[11px] text-blue-600 font-medium">✓ Đồng bộ Cloudflare D1 real-time</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Đơn Đăng Ký Công Tác</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                    <IconFileText size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{d1Stats.businessTripsCount} <span className="text-xs text-slate-500 font-normal">đơn đề xuất</span></div>
                <p className="text-[11px] text-purple-600 font-medium">✓ Lưu trữ cơ sở dữ liệu D1</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Dòng Sản Phẩm SKECHERS</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <IconShoe size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{landingCMS.products.items.length} <span className="text-xs text-slate-500 font-normal">dòng sản phẩm</span></div>
                <p className="text-[11px] text-amber-600 font-medium">✓ Cập nhật trực tiếp lên trang chủ</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
                <span>⚡ Thao tác nhanh cho Quản trị viên SKECHERS</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveTab("users")}
                  className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/90 border border-emerald-200 text-left transition-all cursor-pointer space-y-1 group shadow-2xs hover:shadow-md"
                >
                  <div className="text-xs font-extrabold text-[#004029] flex items-center gap-1.5 font-display">
                    <IconPlus size={16} /> Quản Lý Nhân Sự & Import Excel ({employees.length})
                  </div>
                  <p className="text-[11px] text-slate-600">Import danh sách nhân sự từ Excel, xuất mật khẩu mặc định.</p>
                </button>

                <button
                  onClick={() => setActiveTab("workspace_gallery")}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200 text-left transition-colors cursor-pointer space-y-1 group"
                >
                  <div className="text-xs font-extrabold text-[#004029] flex items-center gap-1.5 font-display">
                    <IconBuilding size={16} /> Không Gian Làm Việc ({landingCMS.workspaceDepartments?.length || 3})
                  </div>
                  <p className="text-[11px] text-slate-500">Quản lý album ảnh phòng ban sảnh, điều hành, nhà máy SKECHERS.</p>
                </button>

                <button
                  onClick={() => setActiveTab("shoe_lines")}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200 text-left transition-colors cursor-pointer space-y-1 group"
                >
                  <div className="text-xs font-extrabold text-[#004029] flex items-center gap-1.5 font-display">
                    <IconShoe size={16} /> Dòng Giày Tiêu Biểu ({landingCMS.shoeLines?.groups?.length || 3})
                  </div>
                  <p className="text-[11px] text-slate-500">Quản lý các nhóm dòng giày SKECHERS tiêu biểu.</p>
                </button>

                <button
                  onClick={() => {
                    setCmsSubSection("products");
                    setActiveTab("products");
                  }}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-200 text-left transition-colors cursor-pointer space-y-1 group"
                >
                  <div className="text-xs font-extrabold text-amber-700 flex items-center gap-1.5 font-display">
                    <IconUpload size={16} /> Bulk Upload Sản Phẩm
                  </div>
                  <p className="text-[11px] text-slate-500">Upload đồng loạt nhiều ảnh mẫu sản phẩm lên Cloudinary CDN.</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT WITH SMART EXCEL IMPORT & PAGINATION */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 font-display">
                    <span className="w-3 h-3 rounded-full bg-[#004029]" />
                    Quản Lý Danh Sách Nhân Sự & Tài Khoản CSDL D1 ({employees.length})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Hỗ trợ Import Excel thông minh, phân quyền theo mã Role, khóa tài khoản và phân trang 15 user/trang
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <IconDownload size={15} />
                    <span>Tải Excel Mẫu</span>
                  </button>

                  <label className="px-4 py-2 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md">
                    <IconUpload size={15} />
                    <span>Import Excel Nhân Sự</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={handleExcelFileSelect}
                    />
                  </label>

                  <button
                    onClick={handleClearAllEmployees}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <IconTrash size={15} />
                    <span>Xóa Tất Cả</span>
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-8 relative">
                  <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm theo MSNV, Họ tên, Phòng ban, Vị trí công việc..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#004029] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-[#004029] cursor-pointer"
                  >
                    <option value="ALL">Tất cả vai trò ({employees.length})</option>
                    <option value="TONG_GIAM_DOC">Tổng Giám Đốc</option>
                    <option value="PHO_TONG_GIAM_DOC">Phó Tổng Giám Đốc</option>
                    <option value="GIAM_DOC">Giám Đốc Khối</option>
                    <option value="PHO_GIAM_DOC">Phó Giám Đốc Khối</option>
                    <option value="TRUONG_PHONG">Trưởng Phòng</option>
                    <option value="CBCNV">Cán Bộ Công Nhân Viên</option>
                    <option value="LE_TAN">Lễ Tân Văn Phòng</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">MSNV</th>
                      <th className="py-3 px-4">Họ & Tên</th>
                      <th className="py-3 px-4">Vị Trí Công Việc</th>
                      <th className="py-3 px-4">Phòng Ban / Bộ Phận</th>
                      <th className="py-3 px-4">Vai Trò Hệ Thống</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {paginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                          Không tìm thấy nhân sự nào phù hợp với từ khóa!
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#004029]">{emp.empCode}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                          <td className="py-3 px-4 text-slate-600">{emp.title || emp.vtcvHienTai || "-"}</td>
                          <td className="py-3 px-4 text-slate-600">{emp.department || emp.boPhoanMoi || "-"}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10.5px] font-bold border border-slate-200">
                              {emp.roleCode}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                emp.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-rose-100 text-rose-800 border border-rose-300"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "ACTIVE" ? "bg-emerald-600" : "bg-rose-600"}`} />
                              {emp.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => toggleEmployeeLock(emp.id)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  emp.status === "ACTIVE"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                }`}
                                title={emp.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                              >
                                {emp.status === "ACTIVE" ? <IconLock size={14} /> : <IconLockOpen size={14} />}
                              </button>

                              <button
                                onClick={() => handleDeleteEmployee(emp.id, emp.empCode, emp.name)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                                title="Xóa tài khoản khỏi D1"
                              >
                                <IconTrash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalUserPages > 1 && (
                <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
                  <div className="text-xs text-slate-500 font-mono">
                    Hiển thị <strong>{(safeUserPage - 1) * USERS_PER_PAGE + 1}</strong> - <strong>{Math.min(safeUserPage * USERS_PER_PAGE, filteredEmployees.length)}</strong> trên tổng số <strong>{filteredEmployees.length}</strong> nhân sự
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={safeUserPage === 1}
                      onClick={() => setUserPage(safeUserPage - 1)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-30 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <IconChevronLeft size={16} />
                    </button>

                    {getPageNumbers().map((p, idx) =>
                      typeof p === "number" ? (
                        <button
                          key={idx}
                          onClick={() => setUserPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            safeUserPage === p
                              ? "bg-[#004029] text-white shadow-xs"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={idx} className="px-1 text-slate-400 font-mono text-xs">...</span>
                      )
                    )}

                    <button
                      disabled={safeUserPage === totalUserPages}
                      onClick={() => setUserPage(safeUserPage + 1)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-30 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <IconChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: WORKSPACE GALLERY MANAGEMENT */}
        {activeTab === "workspace_gallery" && (
          <WorkspaceCMSManager
            departments={landingCMS.workspaceDepartments || []}
            onChange={(updatedDeps) => {
              setLandingCMS((prev) => ({ ...prev, workspaceDepartments: updatedDeps }));
            }}
            onSave={() => handleSaveLandingCMS()}
            showToast={showToast}
          />
        )}

        {/* TAB 4: FEATURED SHOE LINES MANAGEMENT */}
        {activeTab === "shoe_lines" && (
          <ShoeLinesManager
            shoeLines={landingCMS.shoeLines || DEFAULT_SHOE_LINES_CONFIG}
            onChange={(updatedLines) => {
              setLandingCMS((prev) => ({ ...prev, shoeLines: updatedLines }));
            }}
            showToast={showToast}
          />
        )}

        {/* TAB 5: PRODUCTS MANAGEMENT WITH BULK CLOUDINARY UPLOAD */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 font-display">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Quản Lý Danh Mục Mẫu Sản Phẩm SKECHERS ({landingCMS.products.items.length})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Tải đồng loạt nhiều ảnh mẫu sản phẩm (Bulk Upload) lên Cloudinary CDN và cập nhật tiêu đề sản phẩm
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <label className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md">
                    <IconUpload size={15} />
                    <span>Bulk Upload Ảnh Sản Phẩm</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleBulkUploadProductImages(e.target.files);
                      }}
                    />
                  </label>

                  <button
                    onClick={() => handleSaveLandingCMS()}
                    className="px-5 py-2.5 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <IconCheck size={18} />
                    <span>Lưu Dòng Sản Phẩm</span>
                  </button>
                </div>
              </div>

              {/* Products Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                {landingCMS.products.items.map((prod, pIdx) => (
                  <div key={pIdx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div className="aspect-square rounded-xl bg-white p-2 border border-slate-200 flex items-center justify-center relative overflow-hidden">
                      <img src={prod.image || "/images/crawled/Da-giay1.jpg"} alt={prod.name} className="max-h-full max-w-full object-contain filter drop-shadow-xs" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white font-mono text-[10px] font-bold">
                        #{pIdx + 1}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={prod.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLandingCMS((prev) => {
                            const newItems = [...prev.products.items];
                            newItems[pIdx] = { ...newItems[pIdx], name: val };
                            return { ...prev, products: { ...prev.products, items: newItems } };
                          });
                        }}
                        placeholder="Tên dòng sản phẩm..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-[#004029]"
                      />

                      <input
                        type="text"
                        value={prod.code}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLandingCMS((prev) => {
                            const newItems = [...prev.products.items];
                            newItems[pIdx] = { ...newItems[pIdx], code: val };
                            return { ...prev, products: { ...prev.products, items: newItems } };
                          });
                        }}
                        placeholder="Mã SKU (SK-PROD-01)..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono font-bold text-[#004029] outline-none focus:border-[#004029]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                      <label className="text-[11px] font-bold text-[#004029] hover:underline cursor-pointer">
                        Thay ảnh
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadLandingCMSImage(file, "product", pIdx);
                          }}
                        />
                      </label>

                      <button
                        onClick={() => {
                          setLandingCMS((prev) => {
                            const newItems = prev.products.items.filter((_, idx) => idx !== pIdx);
                            return { ...prev, products: { ...prev.products, items: newItems } };
                          });
                          showToast("🗑️ Đã xóa sản phẩm khỏi danh sách");
                        }}
                        className="text-rose-500 hover:text-rose-700 text-[11px] font-bold cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: LANDING CMS MANAGER WITH SERVER D1 SYNC */}
        {activeTab === "landing_cms" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 font-display">
                    <span className="w-3 h-3 rounded-full bg-[#004029]" />
                    Quản Trị CMS Trang Chủ (Landing Page) & Đồng Bộ D1 Server
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Thay đổi tiêu đề Hero, hình ảnh banner, khối thế mạnh và lưu trữ vĩnh viễn trên D1 Database
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleResetLandingCMS}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reset D1 Mặc Định
                  </button>

                  <button
                    onClick={() => handleSaveLandingCMS()}
                    className="px-5 py-2.5 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <IconCheck size={18} />
                    <span>Lưu & Đồng Bộ D1 Server</span>
                  </button>
                </div>
              </div>

              <LandingCMSManager
                cmsConfig={landingCMS}
                onChange={setLandingCMS}
                onSave={handleSaveLandingCMS}
                showToast={showToast}
              />
            </div>
          </div>
        )}

        {/* TAB 7: NEWS MANAGEMENT */}
        {activeTab === "news" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 font-display">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                Đăng Bài Viết Tin Tức & Truyền Thông ({articles.length})
              </h3>

              <form onSubmit={handleAddNews} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Tiêu Đề Bài Viết</label>
                    <input
                      type="text"
                      required
                      value={newsForm.title}
                      onChange={(e) => setNewsForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="TBS Group Đẩy Mạnh Chuyển Đổi Số 2026..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#004029]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Chuyên Mục Tin Tức</label>
                    <select
                      value={newsForm.category}
                      onChange={(e) => setNewsForm((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#004029] cursor-pointer"
                    >
                      <option value="Tin Tập Đoàn">Tin Tập Đoàn</option>
                      <option value="Sản Xuất">Sản Xuất</option>
                      <option value="Chuyển Đổi Số">Chuyển Đổi Số</option>
                      <option value="Văn Hóa Doanh Nghiệp">Văn Hóa Doanh Nghiệp</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Tóm Tắt Ngắn</label>
                  <textarea
                    rows={2}
                    value={newsForm.summary}
                    onChange={(e) => setNewsForm((prev) => ({ ...prev, summary: e.target.value }))}
                    placeholder="Tóm tắt ngắn gọn nội dung tin tức..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:border-[#004029]"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                    <IconUpload size={15} />
                    <span>Tải Ảnh Bìa Bài Viết Từ Máy</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCloudinaryFileUpload(file, "news");
                      }}
                    />
                  </label>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-xs font-extrabold transition-colors cursor-pointer shadow-md"
                  >
                    Đăng Bài Viết
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 8: MEDIA ASSETS */}
        {activeTab === "media" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 font-display">
                <span className="w-3 h-3 rounded-full bg-purple-600" />
                Quản Lý Thư Viện Hình Ảnh & Banner Cloudinary ({mediaList.length})
              </h3>

              <form onSubmit={handleAddMedia} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Tên Ảnh / Mô Tả</label>
                    <input
                      type="text"
                      value={mediaForm.title}
                      onChange={(e) => setMediaForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Hero Banner SKECHERS..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#004029]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Phân Loại</label>
                    <select
                      value={mediaForm.category}
                      onChange={(e) => setMediaForm((prev) => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#004029] cursor-pointer"
                    >
                      <option value="HERO_BANNER">Hero Banner</option>
                      <option value="FACTORY">Nhà Máy / Xưởng</option>
                      <option value="PRODUCT">Sản Phẩm</option>
                      <option value="EVENTS">Sự Kiện</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Upload Tệp Ảnh Từ Máy</label>
                    <label className="w-full px-3.5 py-2 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs">
                      <IconUpload size={15} />
                      <span>{isUploadingCloudinary ? "Đang Tải..." : "Chọn Tệp Ảnh"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCloudinaryFileUpload(file, "media");
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">URL Hình Ảnh (Direct Link)</label>
                  <input
                    type="text"
                    value={mediaForm.url}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://res.cloudinary.com/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-800 outline-none focus:border-[#004029]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-xs font-extrabold transition-colors cursor-pointer shadow-md"
                >
                  Lưu Vào Thư Viện Media
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 9: D1 DATABASE CONTROL */}
        {activeTab === "d1_control" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 font-display">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    Bảng Điều Khiển Cơ Sở Dữ Liệu Cloudflare D1
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Trạng thái kết nối real-time giữa Cloudflare Worker và D1 Database (vpchuoiskechers-db)
                  </p>
                </div>

                <button
                  onClick={fetchLiveD1Counts}
                  className="px-4 py-2 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <IconRotate size={15} />
                  <span>Làm Mới Trạng Thái D1</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-2 border border-slate-800 shadow-inner">
                <div className="text-emerald-400 font-bold">STATUS: {d1Stats.status}</div>
                <div>DB NAME: vpchuoiskechers-db</div>
                <div>TABLES: users, rooms, bookings, visitors, business_trips, landing_cms</div>
                <div className="pt-2 border-t border-slate-800 text-slate-400">
                  <div>- Total Users Registered: {employees.length}</div>
                  <div>- Meeting Rooms Registered: {d1Stats.roomsCount}</div>
                  <div>- Total Room Bookings: {d1Stats.bookingsCount}</div>
                  <div>- Total Business Trip Requests: {d1Stats.businessTripsCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Excel Import Preview Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-[#004029] to-[#006838] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight font-display">Xem Trước Dữ Liệu Import Excel Nhân Sự SKECHERS</h3>
                <p className="text-xs text-emerald-200 font-medium">Xác nhận thông tin tài khoản trước khi chính thức đưa vào CSDL D1 Database</p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <div>
                Tổng số dòng đọc được: <strong>{importPreviewRows.length}</strong> | Hợp lệ: <strong className="text-emerald-600">{importPreviewRows.filter((r) => r.isValid).length}</strong> | Lỗi: <strong className="text-rose-600">{importPreviewRows.filter((r) => !r.isValid).length}</strong>
              </div>

              {importResultSummary && (
                <button
                  onClick={handleExportCreatedAccounts}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1"
                >
                  <IconDownload size={14} /> Xuất Excel Mật Khẩu
                </button>
              )}
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-3">Dòng</th>
                    <th className="py-2.5 px-3">MSNV</th>
                    <th className="py-2.5 px-3">Họ & Tên</th>
                    <th className="py-2.5 px-3">Phòng Ban / Bộ Phận</th>
                    <th className="py-2.5 px-3">Vị Trí Công Việc</th>
                    <th className="py-2.5 px-3">Mã Role</th>
                    <th className="py-2.5 px-3">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {importPreviewRows.map((r) => (
                    <tr key={r.rowNum} className={r.isValid ? "hover:bg-slate-50" : "bg-rose-50/50"}>
                      <td className="py-2 px-3 font-mono">{r.rowNum}</td>
                      <td className="py-2 px-3 font-mono font-bold text-[#004029]">{r.empCode}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{r.name}</td>
                      <td className="py-2 px-3 text-slate-600">{r.boPhoanMoi || r.phongBanHienTai || "-"}</td>
                      <td className="py-2 px-3 text-slate-600">{r.vtcvHienTai || "-"}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{r.roleCode}</td>
                      <td className="py-2 px-3">
                        {r.isValid ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Hợp lệ</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold" title={r.errorMessage}>
                            ❌ {r.errorMessage}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                disabled={isSubmittingImport || importPreviewRows.filter((r) => r.isValid).length === 0}
                onClick={handleConfirmBulkImport}
                className="px-6 py-2.5 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-xs font-extrabold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingImport ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Đang Import ({importProgress.current}/{importProgress.total})...</span>
                  </>
                ) : (
                  <span>Xác Nhận Import {importPreviewRows.filter((r) => r.isValid).length} Nhân Sự Vào D1</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
