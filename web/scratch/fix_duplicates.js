const fs = require('fs');
let cimodule = fs.readFileSync('src/modules/ci/CIModule.tsx', 'utf8');

cimodule = cimodule.replace(
  /\s*const \{ counts: statusCounts, loading: isCountsLoading, refetchStatusCounts \} = useStatusCounts\(\);/,
  ''
);

fs.writeFileSync('src/modules/ci/CIModule.tsx', cimodule);
console.log('Fixed CIModule duplicates');
