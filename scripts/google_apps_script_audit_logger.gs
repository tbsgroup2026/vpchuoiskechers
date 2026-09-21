/**
 * ════════════════════════════════════════════════════════════════════════════
 * GOOGLE APPS SCRIPT - AUDIT LOG & DATA BACKUP ENGINE FOR TBS GROUP
 * ════════════════════════════════════════════════════════════════════════════
 * Webhook URL Deployment Target: doPost(e)
 * Processes audit logs & system backups from Cloudflare Worker / Next.js system.
 * Saves sanitized logs into a SINGLE daily Google Sheet per day with multiple tabs (sheets).
 * 
 * FEATURES:
 * 1. Output Format: Native Google Sheets (SpreadsheetApp).
 * 2. Multi-tab Consolidation: Combines all log tables into 1 workbook with separate tabs.
 * 3. Daily File Deduplication: Appends/updates the daily Google Sheet (tbs_audit_logs_YYYY-MM-DD)
 *    to prevent file spam on Google Drive.
 * 4. Professional Formatting: Vietnamese Headers, TBS Emerald Green header theme (#006838),
 *    frozen top row, auto column sizing, text wrapping.
 * 5. Strict Security: Zero password/secret/token logging.
 */

// 1. COLUMN HEADER MAP - TIÊU ĐỀ CỘT TIẾNG VIỆT
const COLUMN_HEADER_MAP = {
  // Common Audit Fields
  id: "Mã Ghi Nhận",
  user_id: "ID Người Dùng",
  emp_code: "Mã Nhân Viên",
  emp_name: "Họ và Tên",
  user_role: "Vai Trò",
  role_code: "Mã Vai Trò",
  module: "Phân Hệ (Module)",
  action: "Hành Động / Thao Tác",
  action_type: "Loại Thao Tác",
  target_table: "Bảng Mục Tiêu",
  target_id: "ID Mục Tiêu",
  record_id: "ID Bản Ghi",
  changes_json: "Chi Tiết Thay Đổi (JSON)",
  data_before: "Dữ Liệu Trước Thay Đổi",
  data_after: "Dữ Liệu Sau Thay Đổi",
  ip_address: "Địa Chỉ IP",
  user_agent: "Thiết Bị / Trình Duyệt",
  device_info: "Thiết Bị / Trình Duyệt",
  status: "Trạng Thái",
  result: "Kết Quả",
  created_at: "Thời Gian Ghi Nhận",
  timestamp: "Thời Gian",

  // Login / Logout Logs
  login_status: "Kết Quả Đăng Nhập",
  login_time: "Thời Gian Đăng Nhập",

  // Password / Account Change Logs
  changed_by: "Người Thực Hiện Đổi MK",
  change_type: "Loại Đổi MK",
  reason: "Lý Do Thay Đổi",

  // Feature / Document Logs
  document_name: "Tên Tài Liệu",
  file_path_or_id: "Đường Dẫn / ID File",
  download_time: "Thời Gian Tải",
  file_size: "Dung Lượng File",
  feature_name: "Chức Năng Truy Cập",
  access_result: "Kết Quả Truy Cập",
  access_time: "Thời Gian Truy Cập",
  accessed_at: "Thời Gian Truy Cập"
};

// 2. TECHNICAL TABLE NAME TO TAB TITLE MAPPING
const TABLE_TAB_MAP = {
  audit_logs: "Audit Logs (Nhật Ký)",
  sys_audit_logs: "Audit Logs (Nhật Ký)",
  auth_login_history: "Lịch Sử Đăng Nhập",
  login_logout_logs: "Lịch Sử Đăng Nhập",
  account_change_history: "Thay Đổi Tài Khoản",
  password_change_logs: "Thay Đổi Mật Khẩu",
  credential_change_history: "Lịch Sử Quyền Hạn",
  module_152_access_log: "Nhật Ký Module 152",
  sys_my_tasks: "Danh Sách Công Việc",
  ci_kaizen_proposals: "Sáng Kiến Kaizen",
  gemba_walks: "Nhật Ký Gemba",
  room_bookings: "Đặt Phòng Họp",
  users: "Danh Sách Người Dùng",
  sys_users: "Danh Sách Người Dùng"
};

// Sensitive Key Safeguard List
const SENSITIVE_KEYS = [
  "password", "pass", "token", "secret", "access_token",
  "refresh_token", "authorization", "private_key", "cvv", "pin"
];

/**
 * Main HTTP POST Webhook Handler
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respondJson({ success: false, error: "Empty POST body received" });
    }

    const rawPayload = JSON.parse(e.postData.contents);
    const sanitizedPayload = sanitizePayloadDeep(rawPayload);

    // Resolve Root & Sub Folder Names
    const rootFolderName = rawPayload.root_folder || "Backup-TBS-System";
    const subFolderName = rawPayload.sub_folder || rawPayload.folderName || rawPayload.folder_name || "01_Nhat_Ky_Thao_Tac_Audit_Logs";
    const timestampStr = rawPayload.timestamp || new Date().toISOString();
    const dateStr = timestampStr.substring(0, 10);

    // Target Google Drive Folder Resolution
    const targetFolder = resolveTargetFolder(rootFolderName, subFolderName);

    // Extract Tables Object (Handles multiple payload structures)
    let tablesObj = {};
    if (sanitizedPayload.content && sanitizedPayload.content.tables) {
      tablesObj = sanitizedPayload.content.tables;
    } else if (sanitizedPayload.tables) {
      tablesObj = sanitizedPayload.tables;
    } else if (sanitizedPayload.data) {
      if (Array.isArray(sanitizedPayload.data)) {
        tablesObj = { sys_audit_logs: sanitizedPayload.data };
      } else if (typeof sanitizedPayload.data === "object") {
        tablesObj = { sys_audit_logs: [sanitizedPayload.data] };
      }
    }

    // Get or Create Single Daily Google Sheet Workbook (tbs_audit_logs_YYYY-MM-DD)
    const ss = getOrCreateDailySpreadsheet(targetFolder, dateStr);

    const processedTabs = [];

    // Loop through each table object in payload
    for (const tableName in tablesObj) {
      const dataRows = tablesObj[tableName];
      if (Array.isArray(dataRows) && dataRows.length > 0) {
        // Sanitize every row strictly
        const safeRows = dataRows.map(row => sanitizeLogRow(row));
        const tabTitle = TABLE_TAB_MAP[tableName] || formatKeyToHeader(tableName);

        // Write/Append rows into corresponding Google Sheet tab
        writeTableToSheetTab(ss, tabTitle, safeRows);

        processedTabs.push({
          table: tableName,
          tabTitle: tabTitle,
          rowCount: safeRows.length
        });
      }
    }

    return respondJson({
      success: true,
      message: "Ghi nhận Google Sheet thành công",
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      spreadsheetName: ss.getName(),
      date: dateStr,
      processed_tabs: processedTabs
    });

  } catch (err) {
    return respondJson({
      success: false,
      error: err.toString(),
      stack: err.stack
    });
  }
}

/**
 * Resolves or Creates Daily Google Sheet (tbs_audit_logs_YYYY-MM-DD) inside target Google Drive Folder
 */
function getOrCreateDailySpreadsheet(targetFolder, dateStr) {
  const fileName = `tbs_audit_logs_${dateStr}`;
  const files = targetFolder.getFilesByName(fileName);

  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType() === MimeType.GOOGLE_SHEETS) {
      return SpreadsheetApp.openById(file.getId());
    }
  }

  // Create new Google Sheet Workbook
  const newSs = SpreadsheetApp.create(fileName);
  const ssFile = DriveApp.getFileById(newSs.getId());

  // Move to target subfolder
  targetFolder.addFile(ssFile);
  try {
    DriveApp.getRootFolder().removeFile(ssFile);
  } catch (e) {
    // Non-owner root folder cleanup warning ignored
  }

  return newSs;
}

/**
 * Writes or Appends data rows into a specific Google Sheet tab with formatting
 */
function writeTableToSheetTab(ss, tabTitle, dataRows) {
  if (!Array.isArray(dataRows) || dataRows.length === 0) return;

  let sheet = ss.getSheetByName(tabTitle);
  let isNewSheet = false;

  if (!sheet) {
    const defaultSheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("Trang tính1");
    if (defaultSheet && ss.getSheets().length === 1 && defaultSheet.getLastRow() === 0) {
      sheet = defaultSheet;
      sheet.setName(tabTitle);
    } else {
      sheet = ss.insertSheet(tabTitle);
    }
    isNewSheet = true;
  }

  // 1. Determine Column Keys in Priority Order
  const priorityKeys = [
    "id", "created_at", "timestamp", "emp_code", "emp_name", "role_code",
    "module", "action", "target_type", "target_id", "record_id", "status",
    "ip_address", "user_agent", "changes_json", "data_before", "data_after"
  ];

  const keysSet = new Set();
  priorityKeys.forEach(pk => {
    if (dataRows.some(row => row && row.hasOwnProperty(pk))) {
      keysSet.add(pk);
    }
  });

  dataRows.forEach(row => {
    if (row && typeof row === "object") {
      Object.keys(row).forEach(k => {
        if (!isSensitiveKey(k)) {
          keysSet.add(k);
        }
      });
    }
  });

  const keys = Array.from(keysSet);
  if (keys.length === 0) return;

  const headerRow = keys.map(k => COLUMN_HEADER_MAP[k] || formatKeyToHeader(k));

  // 2. Set Up Header if New Sheet or Empty
  if (isNewSheet || sheet.getLastRow() === 0) {
    sheet.clear();

    const headerRange = sheet.getRange(1, 1, 1, keys.length);
    headerRange.setValues([headerRow]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#006838"); // TBS Emerald Green
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");

    sheet.setRowHeight(1, 32);
    sheet.setFrozenRows(1);
  }

  // 3. Deduplication Check against existing IDs
  const existingIds = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const idColIndex = keys.indexOf("id") >= 0 ? keys.indexOf("id") + 1 : 1;
    const existingIdValues = sheet.getRange(2, idColIndex, lastRow - 1, 1).getValues();
    existingIdValues.forEach(r => {
      if (r[0]) existingIds.add(String(r[0]));
    });
  }

  const rowsToAppend = dataRows.filter(row => {
    if (row.id && existingIds.has(String(row.id))) {
      return false; // Skip existing record to prevent duplicates
    }
    return true;
  });

  if (rowsToAppend.length === 0) return;

  // 4. Build 2D Matrix
  const matrix = rowsToAppend.map(row => {
    return keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    });
  });

  // 5. Append Matrix & Apply Formatting
  const startRow = sheet.getLastRow() + 1;
  const dataRange = sheet.getRange(startRow, 1, matrix.length, keys.length);
  dataRange.setValues(matrix);
  dataRange.setFontSize(9);
  dataRange.setVerticalAlignment("top");
  dataRange.setWrap(true);

  // 6. Auto-fit column widths
  for (let c = 1; c <= keys.length; c++) {
    try {
      sheet.autoResizeColumn(c);
      if (sheet.getColumnWidth(c) < 110) sheet.setColumnWidth(c, 120);
      if (sheet.getColumnWidth(c) > 420) sheet.setColumnWidth(c, 420);
    } catch (e) {}
  }
}

/**
 * Ensures zero password string is present in log row
 */
function sanitizeLogRow(row) {
  if (!row || typeof row !== "object") return row;
  const clean = {};
  for (const k in row) {
    if (isSensitiveKey(k)) {
      clean[k] = "[REDACTED]";
    } else if (typeof row[k] === "object" && row[k] !== null) {
      clean[k] = sanitizePayloadDeep(row[k]);
    } else {
      clean[k] = row[k];
    }
  }
  return clean;
}

/**
 * Checks if a key is sensitive
 */
function isSensitiveKey(key) {
  const l = String(key).toLowerCase();
  return SENSITIVE_KEYS.some(s => l.includes(s));
}

/**
 * Deep sanitization helper
 */
function sanitizePayloadDeep(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayloadDeep);

  const res = {};
  for (const k in obj) {
    if (isSensitiveKey(k)) {
      res[k] = "[REDACTED]";
    } else if (typeof obj[k] === "object" && obj[k] !== null) {
      res[k] = sanitizePayloadDeep(obj[k]);
    } else {
      res[k] = obj[k];
    }
  }
  return res;
}

/**
 * Resolves or creates folder hierarchy /Backup-TBS-System/01_Nhat_Ky_Thao_Tac_Audit_Logs/
 */
function resolveTargetFolder(rootName, subName) {
  let rootFolder;
  const rootSearch = DriveApp.getFoldersByName(rootName);
  if (rootSearch.hasNext()) {
    rootFolder = rootSearch.next();
  } else {
    rootFolder = DriveApp.createFolder(rootName);
  }

  if (!subName) return rootFolder;

  let subFolder;
  const subSearch = rootFolder.getFoldersByName(subName);
  if (subSearch.hasNext()) {
    subFolder = subSearch.next();
  } else {
    subFolder = rootFolder.createFolder(subName);
  }

  return subFolder;
}

/**
 * Fallback format key string to title case
 */
function formatKeyToHeader(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * JSON HTTP response helper
 */
function respondJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}
