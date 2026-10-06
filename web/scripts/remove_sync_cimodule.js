const fs = require('fs');

const file = 'src/modules/ci/CIModule.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the initial mount sync
content = content.replace(
  /\/\/ Auto-sync proposals from individual factory links on mount\r?\n\s*fetch\("\/api\/ci-kaizen\/sync", \{ method: "POST" \}\)\r?\n\s*\.then\(\(res\) => res\.json\(\)\)\r?\n\s*\.then\(\(json\) => \{\r?\n\s*if \(json\.success\) \{\r?\n\s*fetchProposals\(true\);\r?\n\s*refetchStatusCounts\(\);\r?\n\s*\}\r?\n\s*\}\)\r?\n\s*\.catch\(\(\) => \{\}\);/,
  '// Removed redundant /api/ci-kaizen/sync on mount (now handled by hybrid fetch)'
);

// 2. Remove the 3rd-poll sync
content = content.replace(
  /if \(pollCount % 3 === 0\) \{\r?\n\s*fetch\("\/api\/ci-kaizen\/sync", \{ method: "POST" \}\)\r?\n\s*\.then\(\(res\) => res\.json\(\)\)\r?\n\s*\.then\(\(json\) => \{\r?\n\s*if \(json\.success && \(json\.created_count > 0 \|\| json\.updated_count > 0\)\) \{\r?\n\s*fetchProposals\(true\);\r?\n\s*refetchStatusCounts\(\);\r?\n\s*\}\r?\n\s*\}\)\r?\n\s*\.catch\(\(\) => \{\}\);\r?\n\s*\}/,
  'if (pollCount % 3 === 0) {\n          refetchStatusCounts();\n        }'
);

// 3. Update handleSyncFromKienGiang
content = content.replace(
  /const handleSyncFromKienGiang = async \(\) => \{\r?\n\s*try \{\r?\n\s*setIsSyncingKG\(true\);\r?\n\s*showToast\("⏳ Đang đồng bộ dữ liệu sáng kiến từ Kiên Giang Shoes\.\.\."\);\r?\n\s*const res = await fetch\("\/api\/ci-kaizen\/sync", \{ method: "POST" \}\);\r?\n\s*const json = await res\.json\(\);\r?\n\s*if \(json\.success\) \{\r?\n\s*showToast\(\`🎉 \$\{json\.message \|\| "Đồng bộ sáng kiến Kiên Giang thành công!"\}\`\);\r?\n\s*fetchProposals\(true\);\r?\n\s*refetchStatusCounts\(\);\r?\n\s*\} else \{\r?\n\s*showToast\(\`❌ \$\{json\.error \|\| json\.message \|\| "Lỗi đồng bộ Kiên Giang"\}\`\);\r?\n\s*\}\r?\n\s*\} catch \(e: any\) \{\r?\n\s*showToast\("❌ Lỗi kết nối máy chủ đồng bộ!"\);\r?\n\s*\} finally \{\r?\n\s*setIsSyncingKG\(false\);\r?\n\s*\}\r?\n\s*\};/,
  `const handleSyncFromKienGiang = async () => {
    try {
      setIsSyncingKG(true);
      showToast("⏳ Đang tải dữ liệu mới nhất từ Kiên Giang...");
      await fetchProposals(true);
      await refetchStatusCounts();
      showToast("🎉 Tải dữ liệu thành công!");
    } catch (e: any) {
      showToast("❌ Lỗi kết nối!");
    } finally {
      setIsSyncingKG(false);
    }
  };`
);

fs.writeFileSync(file, content);
console.log("Removed /api/ci-kaizen/sync from CIModule.tsx");
