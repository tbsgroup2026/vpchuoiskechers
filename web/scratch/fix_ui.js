const fs = require('fs');
let cimodule = fs.readFileSync('src/modules/ci/CIModule.tsx', 'utf8');

// 1. Remove useStatusCounts import and hook call
cimodule = cimodule.replace(/import \{ useStatusCounts \} from "@\/context\/StatusCountsContext";\n/, '');
cimodule = cimodule.replace(/const \{ counts: statusCounts, loading: isCountsLoading, refetchStatusCounts \} = useStatusCounts\(\);\n/, '');

// 2. Inject dynamic statusCounts computation
cimodule = cimodule.replace(
  /const fetchProposals = async/,
  `// Computed counts from proposals dynamically
  const statusCounts = useMemo(() => {
    let thi_dua = 0, cho_phe_duyet = 0, cho_danh_gia = 0, da_danh_gia = 0, luu_tru = 0;
    proposals.forEach(p => {
      const isArch = p.is_archived === 1 || String(p.registration_type) === 'LUU_TRU' || String(p.sub_status) === 'LUU_TRU' || String(p.trang_thai) === 'DA_GOP';
      if (isArch) {
        luu_tru++;
      } else {
        const st = String(p.trang_thai || p.sub_status || p.review_status || '').toUpperCase();
        if (st === 'CHO_DUYET' || st === 'CHO_PHE_DUYET') { cho_phe_duyet++; thi_dua++; }
        else if (st === 'CHO_DANH_GIA') { cho_danh_gia++; thi_dua++; }
        else if (st === 'DA_DANH_GIA' || st === 'DA_XEP_HANG') { da_danh_gia++; thi_dua++; }
        else if (st !== 'TU_CHOI' && st !== 'REJECTED') { thi_dua++; }
      }
    });
    return { thi_dua, cho_phe_duyet, cho_danh_gia, da_danh_gia, luu_tru };
  }, [proposals]);

  const isCountsLoading = false;
  const refetchStatusCounts = () => {};

  const fetchProposals = async`
);

// 3. Update REGION_SUB_ITEMS
cimodule = cimodule.replace(
  /const REGION_SUB_ITEMS = \[[^\]]*\];/,
  `const REGION_SUB_ITEMS = [
  "Kiên Giang 1",
  "Kiên Giang 2",
  "Kiên Giang 3",
  "Hoàn thiện đế",
  "Phòng kế hoạch",
  "Phòng CI",
  "Phòng CN",
  "Phòng chất lượng",
  "Phòng nhân sự",
  "Chưa phân loại"
];`
);

// 4. Update result["THKG"] sum in regionCounts
cimodule = cimodule.replace(
  /result\["THKG"\] = \([^\)]*\) \+\s*\([^\)]*\) \+\s*\([^\)]*\) \+\s*\([^\)]*\) \+\s*\([^\)]*\);/,
  `result["THKG"] = REGION_SUB_ITEMS.reduce((sum, item) => sum + (result[item] || 0), 0);`
);

// 5. Update UNIT_SLUG_MAP (Remove Phòng Ban THKG)
cimodule = cimodule.replace(
  /"phong-ban-thkg": \{ label: "Phòng Ban THKG", regionKey: "Phòng Ban THKG", slug: "phong-ban-thkg" \},/,
  ``
);

// 6. Fix THKG sidebar map (flattened list)
cimodule = cimodule.replace(
  /\{\[\s*\{ label: "Phòng Ban THKG", slug: "phong-ban-thkg" \},[\s\S]*?\]\.map\(\(subItem\)/,
  `{REGION_SUB_ITEMS.map((label) => { const subItem = { label };`
);

// 7. Update dropdown options in select
cimodule = cimodule.replace(
  /<option value="THKG">📍 Tất cả THKG \(\{regionCounts\["THKG"\] \|\| 0\}\)<\/option>\s*<option value="Phòng Ban THKG">  └ Phòng Ban THKG \(\{regionCounts\["Phòng Ban THKG"\] \|\| 0\}\)<\/option>\s*<option value="Kiên Giang 1">  └ Kiên Giang 1 \(\{regionCounts\["Kiên Giang 1"\] \|\| 0\}\)<\/option>\s*<option value="Kiên Giang 2">  └ Kiên Giang 2 \(\{regionCounts\["Kiên Giang 2"\] \|\| 0\}\)<\/option>\s*<option value="Kiên Giang 3">  └ Kiên Giang 3 \(\{regionCounts\["Kiên Giang 3"\] \|\| 0\}\)<\/option>\s*<option value="Hoàn Thiện Đế">  └ Hoàn Thiện Đế \(\{regionCounts\["Hoàn Thiện Đế"\] \|\| 0\}\)<\/option>/,
  `<option value="THKG">📍 Tất cả THKG ({regionCounts["THKG"] || 0})</option>
                    {REGION_SUB_ITEMS.map(label => (
                      <option key={label} value={label}>  └ {label} ({regionCounts[label] || 0})</option>
                    ))}`
);

// 8. Rename "Trạng thái lọc" -> "Loại đăng ký"
cimodule = cimodule.replace(
  /\{!isSidebarCollapsed && <span>Trạng thái lọc<\/span>\}/,
  `{!isSidebarCollapsed && <span>Loại đăng ký</span>}`
);
cimodule = cimodule.replace(
  /<div className="px-2 py-1 text-slate-400 text-\[11px\] font-extrabold tracking-wider uppercase">\s*TRẠNG THÁI LỌC\s*<\/div>/,
  `<div className="px-2 py-1 text-slate-400 text-[11px] font-extrabold tracking-wider uppercase">\n                        LOẠI ĐĂNG KÝ\n                      </div>`
);
cimodule = cimodule.replace(
  /title="Chọn trạng thái lọc"/,
  `title="Chọn loại đăng ký"`
);
cimodule = cimodule.replace(
  /<option value="ALL">🏷️ Tất cả trạng thái<\/option>/,
  `<option value="ALL">🏷️ Tất cả loại đăng ký</option>`
);

fs.writeFileSync('src/modules/ci/CIModule.tsx', cimodule);
console.log('Fixed CIModule.tsx');
