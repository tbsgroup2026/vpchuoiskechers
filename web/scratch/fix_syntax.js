const fs = require('fs');
let cimodule = fs.readFileSync('src/modules/ci/CIModule.tsx', 'utf8');

cimodule = cimodule.replace(
  /\{REGION_SUB_ITEMS\.map\(\(label\) => \{ const subItem = \{ label \}; => \{/g,
  `{REGION_SUB_ITEMS.map((label) => { const subItem = { label };`
);

fs.writeFileSync('src/modules/ci/CIModule.tsx', cimodule);
console.log('Fixed syntax error');
