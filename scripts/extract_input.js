const fs = require('fs');
const content = fs.readFileSync('web/src/app/rooms/page.tsx', 'utf8');
const start = content.indexOf('type="file"');
const end = content.indexOf('</label>', start);
console.log(content.slice(start, end));
