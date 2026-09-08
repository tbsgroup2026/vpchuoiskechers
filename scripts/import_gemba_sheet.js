/**
 * Gemba.Pro - Google Sheet Historical Data Import Script
 * Usage: node scripts/import_gemba_sheet.js <path-to-json-or-csv-file> [api-url] [token]
 */

const fs = require('fs');
const path = require('path');

const sampleSheetData = [
  {
    code: "GB-2026-0024",
    title: "Máy laze 1 dao không có lửa",
    description: "Máy laze 1 không lên tia lửa điện",
    factory_id: "fac_nmmd",
    workshop_id: "ws_dau_vao",
    line_id: "line_chat1",
    team_id: "team_chat1_cat",
    category_id: "cat_mmtb",
    priority: "CAO",
    status: "COMPLETED",
    created_by_emp_code: "202608001",
    created_by_name: "LẮNG VĂN QUẾ",
    assigned_to_name: "MMTB SK MĐ",
    created_at: "2026-09-04 12:45:00",
    due_at: "2026-09-06 12:45:00",
    closed_at: "2026-09-04 16:30:00"
  },
  {
    code: "GB-2026-0023",
    title: "Hư băng chuyền",
    description: "Băng chuyền truyền động bị giật",
    factory_id: "fac_nmmd",
    workshop_id: "ws_go",
    line_id: "line_htg3",
    team_id: "team_htg3_2",
    category_id: "cat_mmtb",
    priority: "TRUNG_BINH",
    status: "COMPLETED",
    created_by_emp_code: "202608002",
    created_by_name: "TRẦN DUY CHƯƠNG",
    assigned_to_name: "MMTB SK MĐ",
    created_at: "2026-08-31 13:16:00",
    due_at: "2026-09-02 13:16:00",
    closed_at: "2026-08-31 17:00:00"
  },
  {
    code: "GB-2026-0022",
    title: "Máy ép cao tần (ép không lên điện)",
    description: "Máy ép cao tần sập nguồn",
    factory_id: "fac_nmmd",
    workshop_id: "ws_dau_vao",
    line_id: "line_inep1",
    team_id: "team_inep1_inep",
    category_id: "cat_mmtb",
    priority: "TRUNG_BINH",
    status: "PROCESSING",
    created_by_emp_code: "EMP-001",
    created_by_name: "NGUYỄN HOÀI HƯNG",
    assigned_to_name: "MMTB SK MĐ",
    created_at: "2026-08-31 08:05:00",
    due_at: "2026-08-15 08:05:00"
  }
];

async function runImport() {
  const filePath = process.argv[2];
  const apiUrl = process.argv[3] || "https://vpchuoiskechers.tbsgroup2026.workers.dev/api/gemba/import-sheet";
  const token = process.argv[4] || "tbs_token_ADMIN-2026_1788750000000";

  let rowsToImport = sampleSheetData;

  if (filePath && fs.existsSync(filePath)) {
    console.log(`[Import Script] Reading file: ${filePath}`);
    const raw = fs.readFileSync(filePath, 'utf8');
    try {
      rowsToImport = JSON.parse(raw);
    } catch (e) {
      console.error("[Import Script] Error parsing JSON file. Using sample dataset.");
    }
  } else {
    console.log("[Import Script] No file input provided. Running import test with sample Google Sheet data.");
  }

  console.log(`[Import Script] Sending ${rowsToImport.length} rows to ${apiUrl}...`);

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ rows: rowsToImport })
    });

    const json = await res.json();
    console.log("\n════════════════════════════════════════════════════");
    console.log("             IMPORT RESULT REPORT                   ");
    console.log("════════════════════════════════════════════════════");
    console.log(`STATUS: ${res.status} ${res.statusText}`);
    console.log(`SUCCESS: ${json.success}`);
    console.log(`IMPORTED: ${json.imported || 0} rows`);
    console.log(`FAILED: ${json.failed || 0} rows`);

    if (json.errors && json.errors.length > 0) {
      console.log("\nDETAILED ERROR LOGS:");
      json.errors.forEach(err => {
        console.log(`- Line ${err.line}: ${err.reason}`);
      });
    }
    console.log("════════════════════════════════════════════════════\n");
  } catch (err) {
    console.error("[Import Script] Request Error:", err.message);
  }
}

runImport();
