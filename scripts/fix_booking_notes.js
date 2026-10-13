const fs = require('fs');
const path = require('path');

// 1. Update web/src/app/rooms/page.tsx
const pageFile = path.join(__dirname, '../web/src/app/rooms/page.tsx');
if (fs.existsSync(pageFile)) {
  let code = fs.readFileSync(pageFile, 'utf8');
  
  // Remove [APPROVED_BY_RECEPTIONIST_AT_${approvalTime}]
  code = code.replace(
    /(const updatedNotes =\s*\([^)]*\)\s*\+)\s*` \[APPROVED_BY_RECEPTIONIST_AT_\$\{approvalTime\}\]`;/g,
    "const updatedNotes = targetBooking.notes || \"\";"
  );
  
  // Remove [CANCELLED_BY_RECEPTIONIST_AT_...]
  code = code.replace(
    /notes:\s*\(targetBooking\?\.notes\s*\|\|\s*""\)\s*\+\s*` \[CANCELLED_BY_RECEPTIONIST_AT_\$\{new Date\(\)\.toLocaleTimeString\(\)\}\]`/g,
    "notes: targetBooking?.notes || \"\", cancelledAt: new Date().toISOString(), cancelledBy: \"Lễ Tân\""
  );
  
  // Remove [APPROVED_BY_RECEPTIONIST]
  code = code.replace(
    /const updatedNotes\s*=\s*\(reassignModalBooking\.notes\s*\|\|\s*""\)\s*\+\s*" \[APPROVED_BY_RECEPTIONIST\]";/g,
    "const updatedNotes = reassignModalBooking.notes || \"\";"
  );
  
  fs.writeFileSync(pageFile, code);
  console.log("Patched page.tsx");
} else {
  console.log("Not found:", pageFile);
}

// 2. Update web/src/lib/bookingMapper.ts
const mapperFile = path.join(__dirname, '../web/src/lib/bookingMapper.ts');
if (fs.existsSync(mapperFile)) {
  let code = fs.readFileSync(mapperFile, 'utf8');
  
  code = code.replace(
    /export function cleanNotes\(notes\?: string \| null\): string \{[\s\S]*?trim\(\);\n\}/,
    `export function sanitizeNotes(notes?: string | null): string {
  if (!notes) return '';
  return notes
    .replace(/\\s*\\[[A-Z_]+(?:_BY_[A-Z_]+)?(?:_AT_\\d{1,2}:\\d{2})?\\]\\s*/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}`
  );
  
  code = code.replace(/cleanNotes\(/g, "sanitizeNotes(");
  
  fs.writeFileSync(mapperFile, code);
  console.log("Patched bookingMapper.ts");
}

// 3. Update web/worker/index.js
const workerFile = path.join(__dirname, '../web/worker/index.js');
if (fs.existsSync(workerFile)) {
  let code = fs.readFileSync(workerFile, 'utf8');
  
  // Add sanitizeNotes function to worker if not exists
  if (!code.includes("function sanitizeNotesWorker")) {
    const sanitizeFunc = `
function sanitizeNotesWorker(notes) {
  if (!notes) return '';
  return notes.replace(/\\s*\\[[A-Z_]+(?:_BY_[A-Z_]+)?(?:_AT_\\d{1,2}:\\d{2})?\\]\\s*/g, ' ').replace(/\\s+/g, ' ').trim();
}
`;
    // Insert after import { signHrToken } ...
    code = code.replace(/(import \{ signHrToken \} from '\.\.\/hr-api\/token';)/, "$1\n" + sanitizeFunc);
  }

  const zaloMsgBlockOld1 = "📝 Ghi chú: ${notes || booking.notes || 'Không có'}";
  const zaloMsgBlockNew1 = `\${(sanitizeNotesWorker(notes || booking.notes)) ? '\\n📝 Ghi chú: ' + sanitizeNotesWorker(notes || booking.notes) : ''}`;
  
  if (code.includes(zaloMsgBlockOld1)) {
    code = code.split(zaloMsgBlockOld1).join(zaloMsgBlockNew1);
  }

  const zaloMsgBlockOld2 = "📝 Lý do: ${notes || 'Hủy bởi người quản trị'}";
  const zaloMsgBlockNew2 = `\${(sanitizeNotesWorker(notes || booking.notes)) ? '\\n📝 Lý do: ' + sanitizeNotesWorker(notes || booking.notes) : '\\n📝 Lý do: Hủy bởi hệ thống'}`;

  if (code.includes(zaloMsgBlockOld2)) {
    code = code.split(zaloMsgBlockOld2).join(zaloMsgBlockNew2);
  }

  fs.writeFileSync(workerFile, code);
  console.log("Patched worker/index.js for Zalo notifications");
}
