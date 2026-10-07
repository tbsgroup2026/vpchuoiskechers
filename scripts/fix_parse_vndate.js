const fs = require('fs');
const filePath = 'web/src/app/rooms/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'const parts = (dateStr || (typeof window !== "undefined" ? getTodayVnDate() : "01/01/2026")).split("/");',
  'const parts = (dateStr || "01/01/2026").split("/");'
);

fs.writeFileSync(filePath, content, 'utf8');
