const fs = require('fs');

let content = fs.readFileSync('tests/better_dispatcher.test.js', 'utf8');

// Replace table schema
content = content.replace(
  `is_checked_in INTEGER DEFAULT 0, start_time DATETIME, end_time DATETIME, rejection_reason TEXT`,
  `is_checked_in INTEGER DEFAULT 0, booking_date TEXT, time_slot TEXT, rejection_reason TEXT`
);

// Helper function to format date and timeslot
const timeSlotHelper = `
      function getTestTimeStrings(offsetMins) {
         // Create a fake VN date/time by adding 7 hours to UTC
         const utcDate = new Date(Date.now() + offsetMins * 60000 + 7 * 3600000);
         const bd = utcDate.toISOString().split('T')[0];
         const hh = String(utcDate.getUTCHours()).padStart(2, '0');
         const mm = String(utcDate.getUTCMinutes()).padStart(2, '0');
         const endHh = String(utcDate.getUTCHours() + 1).padStart(2, '0');
         const ts = \`\${hh}:\${mm} - \${endHh}:\${mm}\`;
         return [bd, ts];
      }
`;

content = content.replace(
  `const realNow = Date.now();`,
  timeSlotHelper + `\n      const realNow = Date.now();`
);

// Replace null/invalid date insertions
content = content.replace(
  `await env.DB.prepare("INSERT INTO room_bookings (id, status, is_checked_in, start_time, end_time) VALUES ('r_null', 'APPROVED', 0, NULL, datetime('now', '+1 hour'))").run();`,
  `await env.DB.prepare("INSERT INTO room_bookings (id, status, is_checked_in, booking_date, time_slot) VALUES ('r_null', 'APPROVED', 0, NULL, '09:00 - 10:00')").run();`
);
content = content.replace(
  `await env.DB.prepare("INSERT INTO room_bookings (id, status, is_checked_in, start_time, end_time) VALUES ('r_invalid', 'APPROVED', 0, 'invalid-date', datetime('now', '+1 hour'))").run();`,
  `await env.DB.prepare("INSERT INTO room_bookings (id, status, is_checked_in, booking_date, time_slot) VALUES ('r_invalid', 'APPROVED', 0, 'invalid-date', '09:00 - 10:00')").run();`
);

// Replace r_warn insertions and updates
content = content.replace(
  `const stWarn = new Date(realNow - 10 * 60000).toISOString(); // 10 minutes ago
      await env.DB.prepare("INSERT INTO room_bookings (id, title, booked_by, status, is_checked_in, start_time, end_time) VALUES ('r_warn', 'Room 1', 'u1', 'APPROVED', 0, ?, datetime('now', '+1 hour'))").bind(stWarn).run();`,
  `const [bdWarn, tsWarn] = getTestTimeStrings(-10); // 10 minutes ago in VN time
      await env.DB.prepare("INSERT INTO room_bookings (id, title, booked_by, status, is_checked_in, booking_date, time_slot) VALUES ('r_warn', 'Room 1', 'u1', 'APPROVED', 0, ?, ?)").bind(bdWarn, tsWarn).run();`
);

content = content.replace(
  `const stCancel = new Date(realNow - 15 * 60000).toISOString(); // 15 minutes ago
      await env.DB.prepare("UPDATE room_bookings SET start_time = ? WHERE id = 'r_warn'").bind(stCancel).run();`,
  `const [bdCancel, tsCancel] = getTestTimeStrings(-15); // 15 minutes ago in VN time
      await env.DB.prepare("UPDATE room_bookings SET booking_date = ?, time_slot = ? WHERE id = 'r_warn'").bind(bdCancel, tsCancel).run();`
);

fs.writeFileSync('tests/better_dispatcher.test.js', content, 'utf8');
console.log('Updated tests for booking_date and time_slot.');
