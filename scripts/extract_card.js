const fs = require('fs');
const content = fs.readFileSync('web/src/app/rooms/page.tsx', 'utf8');
const startIndex = content.indexOf('<div className="relative h-40');
const endIndex = content.indexOf('<div className="flex items-center gap-2">', startIndex);
console.log(content.slice(startIndex, endIndex));
