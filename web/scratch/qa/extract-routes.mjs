import fs from 'node:fs';

const content = fs.readFileSync('web/worker/index.js', 'utf8');
const regex = /['"`](\/api\/[^'"`?#\s]+)['"`]/g;
const routes = new Set();
let match;
while ((match = regex.exec(content)) !== null) {
  // normalize route
  let r = match[1];
  // remove trailing params like /:id
  routes.add(r);
}

const sortedRoutes = Array.from(routes).sort();
console.log(`Found ${sortedRoutes.length} API routes in web/worker/index.js:`);
console.log(JSON.stringify(sortedRoutes, null, 2));
fs.writeFileSync('web/scratch/qa/extracted-routes.json', JSON.stringify(sortedRoutes, null, 2));
