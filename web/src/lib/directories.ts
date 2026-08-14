// Danh sách các bảng "danh mục" (combobox) dùng chung 1 API/UI CRUD tổng quát.
// Mỗi loại vẫn là 1 bảng SQL riêng biệt (theo yêu cầu) — file này chỉ khai báo
// allowlist an toàn để route [type] không bị SQL injection qua tên bảng.

export interface DirectoryFieldDef {
  key: string;
  label: string;
  type: "text" | "select" | "checkbox";
  /** Với type "select": key của danh mục khác để lấy option (vd. "zones" cho factories.zone_id) */
  refType?: string;
  required?: boolean;
}

export interface DirectoryDef {
  table: string;
  label: string;
  fields: DirectoryFieldDef[];
}

export const DIRECTORIES = {
  zones: {
    table: "zones",
    label: "Khu vực",
    fields: [{ key: "name", label: "Tên khu vực", type: "text", required: true }],
  },
  factories: {
    table: "factories",
    label: "Nhà máy",
    fields: [
      { key: "name", label: "Tên nhà máy", type: "text", required: true },
      { key: "zone_id", label: "Khu vực", type: "select", refType: "zones" },
    ],
  },
  bo_phan: {
    table: "bo_phan",
    label: "Bộ phận",
    fields: [{ key: "name", label: "Tên bộ phận", type: "text", required: true }],
  },
  work_locations: {
    table: "work_locations",
    label: "Công tác tại",
    fields: [{ key: "name", label: "Tên địa điểm", type: "text", required: true }],
  },
  travel_methods: {
    table: "travel_methods",
    label: "Hình thức đi công tác",
    fields: [{ key: "name", label: "Tên hình thức", type: "text", required: true }],
  },
  work_addresses: {
    table: "work_addresses",
    label: "Địa chỉ công tác",
    fields: [{ key: "name", label: "Địa chỉ", type: "text", required: true }],
  },
  meeting_rooms: {
    table: "meeting_rooms",
    label: "Phòng họp",
    fields: [
      { key: "name", label: "Tên phòng họp", type: "text", required: true },
      { key: "requires_reception", label: "Cần liên hệ Lễ Tân trước", type: "checkbox" },
    ],
  },
} satisfies Record<string, DirectoryDef>;

export type DirectoryType = keyof typeof DIRECTORIES;

export const DIRECTORY_TYPES = Object.keys(DIRECTORIES) as DirectoryType[];

export function isDirectoryType(v: string): v is DirectoryType {
  return Object.prototype.hasOwnProperty.call(DIRECTORIES, v);
}
