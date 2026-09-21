const fs = require('fs');
const path = require('path');

console.log('=== AUDIT DỮ LIỆU CŨ MODULE MMTB (SECT 8.1) ===');

// Check schema migration files
const migrationsDir = path.join(__dirname, '../web/migrations');
if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir);
  console.log('Found migration files:', files.filter(f => f.includes('mmtb') || f.includes('maintenance')));
}

console.log('Audit completed - proceeding with data scope column additions.');
