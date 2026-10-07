const fs = require('fs');
let content = fs.readFileSync('web/src/app/rooms/page.tsx', 'utf8');

content = content.replace(
  'const res = await fetch("/api/rooms");',
  'const res = await fetch(`/api/rooms?_t=${Date.now()}`);'
);
content = content.replace(
  'const res = await fetch(\'/api/rooms\');',
  'const res = await fetch(`/api/rooms?_t=${Date.now()}`);'
);

fs.writeFileSync('web/src/app/rooms/page.tsx', content, 'utf8');
