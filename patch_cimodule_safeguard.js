const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/modules/ci/CIModule.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const hookStr = `// --- KAIZEN PERMALINK SYNC ---`;
const newLogic = `useEffect(() => {
    if (typeof window === "undefined") return;
    const user = getCurrentUser();
    if (!user) {
      const path = window.location.pathname;
      const isPermalink = path.match(/^\\/work\\/kaizen\\/[a-zA-Z0-9_-]+$/) && path !== "/work/kaizen/register";
      if (!isPermalink) {
         window.location.href = "/login?redirect=/work/kaizen";
      }
    }
  }, []);

  // --- KAIZEN PERMALINK SYNC ---`;

code = code.replace(hookStr, newLogic);
fs.writeFileSync(filePath, code);
console.log('CIModule safeguard patched successfully.');
