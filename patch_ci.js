const fs = require('fs');
let code = fs.readFileSync('web/src/modules/ci/CIModule.tsx', 'utf8');

code = code.replace(/setIsDetailModalOpen\(true\);/g, (match, offset, str) => {
  if (str.slice(offset, offset + 150).includes('pushState')) return match;
  
  return `setIsDetailModalOpen(true);\n              if (typeof window !== "undefined" && window.history.pushState) {\n                const c = typeof found !== "undefined" ? found?.code : (typeof prop !== "undefined" ? prop?.code : (typeof p !== "undefined" ? p?.code : ""));\n                if (c) window.history.pushState(null, "", "/work/kaizen/" + c);\n              }`;
});

code = code.replace(/setDetailModalInitialTab\("info"\);\s*fetchMyScores\(\);/g, 
  `setDetailModalInitialTab("info");
            fetchMyScores();
            if (typeof window !== "undefined" && window.history.pushState) {
              window.history.pushState(null, "", "/work/kaizen");
            }`);

fs.writeFileSync('web/src/modules/ci/CIModule.tsx', code);
console.log("CIModule patched.");
