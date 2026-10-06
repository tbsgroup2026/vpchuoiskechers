const fs = require('fs');
let code = fs.readFileSync('src/modules/ci/CIModule.tsx', 'utf8');

const targetStr = `  const fetchProposals = async (silent = false) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      if (!silent && proposals.length === 0) setLoading(true);
      const res = await fetch(\`/api/ci-kaizen?t=\${Date.now()}\`, {
        cache: "no-store",
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache, no-store, max-age=0" }
      });`;

const repStr = `  // Start Realtime Polling
  useEffect(() => {
    let lastVersion: string | null = null;
    let timer = setInterval(async () => {
      try {
        const res = await fetch(\`/api/kaizen/version?region=THKG\`);
        const data = await res.json();
        if (data && data.version) {
          if (lastVersion && lastVersion !== data.version) {
            console.log('Version changed, refreshing...');
            fetchProposals(true);
          }
          lastVersion = data.version;
        }
      } catch (e) {
        // ignore errors
      }
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const fetchProposals = async (silent = false) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      if (!silent && proposals.length === 0) setLoading(true);
      const res = await fetch(\`/api/ci-kaizen?t=\${Date.now()}\`, {
        cache: "no-store",
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache, no-store, max-age=0" }
      });`;

let codeNormalized = code.replace(/\r\n/g, '\n');
let tNormalized = targetStr.replace(/\r\n/g, '\n');

if (codeNormalized.includes(tNormalized)) {
  codeNormalized = codeNormalized.replace(tNormalized, repStr.replace(/\r\n/g, '\n'));
  fs.writeFileSync('src/modules/ci/CIModule.tsx', codeNormalized);
  console.log('Successfully patched CIModule.tsx');
} else {
  console.log('Could not find target in CIModule.tsx');
}
