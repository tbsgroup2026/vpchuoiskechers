// Đọc file Excel/CSV cho phân hệ kho: nhận diện cột theo nhiều cách đặt tên (có dấu/không dấu).
import * as XLSX from "xlsx";

export interface WarehouseRow {
  itemCode?: string;
  itemName?: string;
  unit?: string;
  qty?: number;
  warehouse?: string;
  zone?: string;
  rack?: string;
  tier?: string;
  bin?: string;
  location?: string;
  note?: string;
}

const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toUpperCase();

const ALIASES: Record<keyof WarehouseRow, string[]> = {
  itemCode: ["MA HANG", "MA VAT TU", "MA VT", "BARCODE", "MA VACH", "SKU", "ITEM CODE", "MA SP", "MA SAN PHAM", "MA NPL", "MA"],
  itemName: ["TEN HANG", "TEN VAT TU", "TEN VT", "TEN SP", "TEN SAN PHAM", "TEN NPL", "DESCRIPTION", "MO TA", "TEN"],
  unit: ["DVT", "DON VI TINH", "DON VI", "UNIT", "UOM"],
  qty: ["SO LUONG", "SL", "QTY", "QUANTITY", "TON", "TON KHO", "SL TON", "SO LUONG TON", "SL NHAP", "SO LUONG NHAP"],
  warehouse: ["KHO", "WAREHOUSE", "MA KHO"],
  zone: ["KHU", "KHU VUC", "ZONE", "AREA"],
  rack: ["KE", "RACK", "DAY KE"],
  tier: ["TANG", "TIER", "LEVEL", "TANG KE"],
  bin: ["O", "BIN", "O SO", "SLOT", "NGAN"],
  location: ["VI TRI", "MA VI TRI", "LOCATION"],
  note: ["GHI CHU", "NOTE", "NOTES"],
};

/** Đọc sheet đầu tiên, trả về các dòng đã ánh xạ và danh sách cột nhận diện được. */
export async function parseWarehouseFile(file: File): Promise<{ rows: WarehouseRow[]; matched: string[]; unmatched: string[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", blankrows: false });
  if (!grid.length) return { rows: [], matched: [], unmatched: [] };

  // Dòng tiêu đề: dòng đầu tiên (trong 10 dòng) khớp được ít nhất 2 cột
  let headerIdx = 0;
  let colMap: Partial<Record<keyof WarehouseRow, number>> = {};
  for (let r = 0; r < Math.min(10, grid.length); r++) {
    const map: Partial<Record<keyof WarehouseRow, number>> = {};
    (grid[r] as unknown[]).forEach((h, c) => {
      const n = norm(h);
      (Object.keys(ALIASES) as (keyof WarehouseRow)[]).forEach((field) => {
        if (map[field] === undefined && ALIASES[field].includes(n)) map[field] = c;
      });
    });
    if (Object.keys(map).length >= 2) {
      headerIdx = r;
      colMap = map;
      break;
    }
  }
  const header = (grid[headerIdx] as unknown[]).map((h) => String(h ?? "").trim());
  const used = new Set(Object.values(colMap));
  const rows: WarehouseRow[] = [];
  for (let r = headerIdx + 1; r < grid.length; r++) {
    const line = grid[r] as unknown[];
    const row: WarehouseRow = {};
    (Object.keys(colMap) as (keyof WarehouseRow)[]).forEach((field) => {
      const v = line[colMap[field]!];
      if (v === "" || v == null) return;
      if (field === "qty") row.qty = Number(String(v).replace(/,/g, "")) || 0;
      else (row as Record<string, string>)[field] = String(v).trim();
    });
    if (Object.keys(row).length) rows.push(row);
  }
  return {
    rows,
    matched: Object.keys(colMap) as string[],
    unmatched: header.filter((h, i) => h && !used.has(i)),
  };
}

export type TemplateKind = "stock" | "receiving" | "locations";

/** Tạo file Excel mẫu để người dùng điền rồi import. */
export function downloadTemplate(kind: TemplateKind) {
  const sheets: Record<TemplateKind, (string | number)[][]> = {
    stock: [
      ["Mã hàng", "Tên hàng", "ĐVT", "Số lượng", "Kho", "Khu", "Kệ", "Tầng", "Ô"],
      ["NPL-0001", "Chỉ may 40/2 trắng", "Cuộn", 120, "KHO1", "A", "K01", "T1", "O01"],
      ["NPL-0002", "Keo dán đế", "Thùng", 15, "KHO1", "A", "K01", "T2", "O03"],
    ],
    receiving: [
      ["Mã hàng", "Tên hàng", "ĐVT", "Số lượng", "Kho", "Khu", "Kệ", "Tầng", "Ô"],
      ["NPL-0001", "Chỉ may 40/2 trắng", "Cuộn", 200, "KHO1", "A", "K01", "T1", "O01"],
      ["NPL-0003", "Da PU đen", "Mét", 350, "", "", "", "", ""],
    ],
    locations: [
      ["Kho", "Khu", "Kệ", "Tầng", "Ô", "Ghi chú"],
      ["KHO1", "A", "K01", "T1", "O01", "Kệ chỉ may"],
      ["KHO1", "A", "K01", "T2", "O03", ""],
    ],
  };
  const names: Record<TemplateKind, string> = {
    stock: "mau_ton_kho.xlsx",
    receiving: "mau_phieu_hang_ve.xlsx",
    locations: "mau_vi_tri_kho.xlsx",
  };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheets[kind]), "Data");
  XLSX.writeFile(wb, names[kind]);
}

/** Xuất bảng ra Excel (kết quả kiểm, tồn kho). */
export function exportRows(fileName: string, header: string[], rows: (string | number)[][]) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header, ...rows]), "Data");
  XLSX.writeFile(wb, fileName);
}
