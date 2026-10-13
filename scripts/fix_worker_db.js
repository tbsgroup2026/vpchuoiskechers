const fs = require('fs');
const path = require('path');

const workerFile = path.join(__dirname, '../web/worker/index.js');
let code = fs.readFileSync(workerFile, 'utf8');

// 1. Add columns to CREATE TABLE IF NOT EXISTS room_bookings
const createTableOld = `CREATE TABLE IF NOT EXISTS room_bookings (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                room_name TEXT NOT NULL,
                title TEXT NOT NULL,
                booker_name TEXT NOT NULL,
                department TEXT NOT NULL,
                booking_date TEXT NOT NULL,
                time_slot TEXT NOT NULL,
                attendees_count INTEGER DEFAULT 5,
                notes TEXT,
                status TEXT DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`;
const createTableNew = `CREATE TABLE IF NOT EXISTS room_bookings (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                room_name TEXT NOT NULL,
                title TEXT NOT NULL,
                booker_name TEXT NOT NULL,
                department TEXT NOT NULL,
                booking_date TEXT NOT NULL,
                time_slot TEXT NOT NULL,
                attendees_count INTEGER DEFAULT 5,
                notes TEXT,
                status TEXT DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved_at TEXT,
                approved_by TEXT,
                cancelled_at TEXT,
                cancelled_by TEXT
            )`;
if (code.includes(createTableOld)) {
  code = code.replace(createTableOld, createTableNew);
  console.log("Patched CREATE TABLE in worker.");
} else {
  // Try regex in case spacing is different
  const tableRegex = /CREATE TABLE IF NOT EXISTS room_bookings \([^;]*?CURRENT_TIMESTAMP\s*\)/;
  code = code.replace(tableRegex, `CREATE TABLE IF NOT EXISTS room_bookings (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                room_name TEXT NOT NULL,
                title TEXT NOT NULL,
                booker_name TEXT NOT NULL,
                department TEXT NOT NULL,
                booking_date TEXT NOT NULL,
                time_slot TEXT NOT NULL,
                attendees_count INTEGER DEFAULT 5,
                notes TEXT,
                status TEXT DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved_at TEXT,
                approved_by TEXT,
                cancelled_at TEXT,
                cancelled_by TEXT
            )`);
}

// 2. Add columns to PUT /api/rooms/booking update fields
const updateBodyOld = `const { id, status, roomId, roomName, notes } = body;`;
const updateBodyNew = `const { id, status, roomId, roomName, notes, approvedAt, approvedBy, cancelledAt, cancelledBy } = body;`;
if (code.includes(updateBodyOld)) {
  code = code.replace(updateBodyOld, updateBodyNew);
  
  const updateNotesBlock = `if (notes !== undefined) {
            updateFields.push("notes = ?");
            bindParams.push(notes);
          }`;
  const updateExtraBlock = `if (notes !== undefined) {
            updateFields.push("notes = ?");
            bindParams.push(notes);
          }
          if (approvedAt !== undefined) {
            updateFields.push("approved_at = ?");
            bindParams.push(approvedAt);
          }
          if (approvedBy !== undefined) {
            updateFields.push("approved_by = ?");
            bindParams.push(approvedBy);
          }
          if (cancelledAt !== undefined) {
            updateFields.push("cancelled_at = ?");
            bindParams.push(cancelledAt);
          }
          if (cancelledBy !== undefined) {
            updateFields.push("cancelled_by = ?");
            bindParams.push(cancelledBy);
          }`;
  code = code.replace(updateNotesBlock, updateExtraBlock);
  console.log("Patched PUT /api/rooms/booking update logic.");
}

fs.writeFileSync(workerFile, code);
