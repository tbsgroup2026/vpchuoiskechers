const { execSync } = require('child_process');
const fs = require('fs');

const DB_NAME = 'vpchuoiskechers-db';

function runD1(sql) {
  try {
    const cmd = `npx wrangler d1 execute ${DB_NAME} --command="${sql}" --remote --json`;
    console.log("Running:", cmd);
    const stdout = execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'] });
    return JSON.parse(stdout.toString());
  } catch (err) {
    console.error("D1 Error details:", err.stderr ? err.stderr.toString() : err.message);
    throw err;
  }
}

async function migrate() {
  console.log("Starting migration...");
  
  // 1. Add columns
  const cols = ['approved_at', 'approved_by', 'cancelled_at', 'cancelled_by'];
  for (const col of cols) {
    try {
      runD1(`ALTER TABLE room_bookings ADD COLUMN ${col} TEXT;`);
      console.log(`Added column ${col}`);
    } catch (e) {
      console.log(`Column ${col} might already exist or error:`, e.message);
    }
  }

  // 2. Fetch rows with tags
  console.log("Fetching rows to migrate...");
  const fetchRes = runD1(`SELECT id, notes FROM room_bookings WHERE notes LIKE '%[%_BY_%]%'`);
  const rows = fetchRes[0]?.results || [];
  
  if (rows.length === 0) {
    console.log("No records to migrate.");
    return;
  }

  console.log(`Found ${rows.length} records. Updating...`);

  // 3. Process each row
  for (const row of rows) {
    const originalNotes = row.notes;
    let approvedAt = null;
    let cancelledAt = null;
    
    // Parse tags
    const approvedMatch = originalNotes.match(/\[APPROVED_BY_RECEPTIONIST(?:_AT_([0-9:]+))?\]/);
    if (approvedMatch) {
      if (approvedMatch[1]) {
        approvedAt = approvedMatch[1];
      } else {
        approvedAt = "UNKNOWN_TIME";
      }
    }

    const cancelledMatch = originalNotes.match(/\[CANCELLED_BY_RECEPTIONIST(?:_AT_([0-9:]+))?\]/);
    if (cancelledMatch) {
      if (cancelledMatch[1]) {
        cancelledAt = cancelledMatch[1];
      } else {
        cancelledAt = "UNKNOWN_TIME";
      }
    }

    // Clean notes
    const newNotes = originalNotes.replace(/\s*\[[A-Z_]+(?:_BY_[A-Z_]+)?(?:_AT_\d{1,2}:\d{2}(?::\d{2})?)?\]\s*/g, ' ').replace(/\s+/g, ' ').trim();

    // Prepare update query
    let updates = [];
    if (originalNotes !== newNotes) {
      updates.push(`notes = '${newNotes.replace(/'/g, "''")}'`);
    }
    if (approvedAt) {
      updates.push(`approved_by = 'Lễ Tân', approved_at = '${approvedAt}'`);
    }
    if (cancelledAt) {
      updates.push(`cancelled_by = 'Lễ Tân', cancelled_at = '${cancelledAt}'`);
    }

    if (updates.length > 0) {
      const sql = `UPDATE room_bookings SET ${updates.join(', ')} WHERE id = '${row.id}'`;
      console.log(`Updating ${row.id}...`);
      try {
        runD1(sql);
      } catch(e) {
        console.error(`Failed to update ${row.id}:`, e.message);
      }
    }
  }

  console.log("Migration complete!");
}

migrate().catch(console.error);
