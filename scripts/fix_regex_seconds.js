const fs = require('fs');
const path = require('path');

// 1. Update web/src/lib/bookingMapper.ts
const mapperFile = path.join(__dirname, '../web/src/lib/bookingMapper.ts');
if (fs.existsSync(mapperFile)) {
  let code = fs.readFileSync(mapperFile, 'utf8');
  code = code.replace(/_AT_\\d\{1,2\}:\\d\{2\}/g, '_AT_\\d{1,2}:\\d{2}(?::\\d{2})?');
  fs.writeFileSync(mapperFile, code);
  console.log("Patched bookingMapper.ts regex");
}

// 2. Update web/worker/index.js
const workerFile = path.join(__dirname, '../web/worker/index.js');
if (fs.existsSync(workerFile)) {
  let code = fs.readFileSync(workerFile, 'utf8');
  code = code.replace(/_AT_\\d\{1,2\}:\\d\{2\}/g, '_AT_\\d{1,2}:\\d{2}(?::\\d{2})?');
  fs.writeFileSync(workerFile, code);
  console.log("Patched worker/index.js regex");
}

// 3. Update scripts/migrate_rooms_notes.js
const migrateFile = path.join(__dirname, 'migrate_rooms_notes.js');
if (fs.existsSync(migrateFile)) {
  let code = fs.readFileSync(migrateFile, 'utf8');
  code = code.replace(/_AT_\\d\{1,2\}:\\d\{2\}/g, '_AT_\\d{1,2}:\\d{2}(?::\\d{2})?');
  code = code.replace(/_AT_\(\[0-9:\]\+\)/g, '_AT_([0-9:]+)');
  fs.writeFileSync(migrateFile, code);
  console.log("Patched migrate script regex");
}
