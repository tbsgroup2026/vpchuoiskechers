const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function runBackup() {
  console.log('Fetching room_bookings...');
  const bookingsOutput = execSync('npx wrangler d1 execute vpchuoiskechers-db --remote --command "SELECT * FROM room_bookings"', { cwd: 'd:\\Work\\TBS II' }).toString();

  console.log('Fetching sys_notifications...');
  const notifsOutput = execSync('npx wrangler d1 execute vpchuoiskechers-db --remote --command "SELECT * FROM sys_notifications WHERE link LIKE \'%rooms%\' OR title LIKE \'%phòng họp%\' OR message LIKE \'%phòng họp%\'"', { cwd: 'd:\\Work\\TBS II' }).toString();

  const backupDir = path.join('d:', 'Work', 'TBS II', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, 'backup_room_bookings_20260930_083700.json');
  const backupData = {
    timestamp: new Date().toISOString(),
    description: 'Backup of room_bookings and related sys_notifications before cleanup',
    bookingsRaw: bookingsOutput,
    notifsRaw: notifsOutput
  };

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log('✅ BACKUP COMPLETE! File saved to:', backupPath);
}

runBackup();
