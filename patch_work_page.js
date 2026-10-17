const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/app/work/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Remove 202608001 fallback
code = code.replace(/const activeUser = currentUser \|\| \(isMounted \? getCurrentUser\(\) : null\) \|\| getSystemUser\("202608001"\);/, `const activeUser = currentUser || (isMounted ? getCurrentUser() : null);`);

code = code.replace(/const normalizedCode = normalizeEmpCode\(activeUser\?\.empCode \|\| "202608001"\);/, `const normalizedCode = normalizeEmpCode(activeUser?.empCode || "");`);

// 2. Add redirect if no user is found
const useEffectAuthBlock = `  useEffect(() => {
    const syncUser = () => {
      const curr = getCurrentUser();
      if (curr) {`;
const useEffectAuthReplacement = `  useEffect(() => {
    const syncUser = () => {
      const curr = getCurrentUser();
      if (!curr) {
         router.push('/login?redirect=/work');
         return;
      }
      if (curr) {`;

code = code.replace(useEffectAuthBlock, useEffectAuthReplacement);

fs.writeFileSync(filePath, code);
console.log('web/src/app/work/page.tsx patched successfully.');
