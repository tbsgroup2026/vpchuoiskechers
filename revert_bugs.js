const fs = require('fs');
let code = fs.readFileSync('web/src/lib/hrLogic.ts', 'utf8');
code = code.replace('daysRequested = 1;', 'daysRequested = 0.5;');
code = code.replace("let shiftDate = checkOut ? checkOut.toISOString().split('T')[0] : checkIn.toISOString().split('T')[0];", "let shiftDate = checkIn.toISOString().split('T')[0];");
fs.writeFileSync('web/src/lib/hrLogic.ts', code);
