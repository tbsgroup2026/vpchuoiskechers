const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/app/rooms/page.tsx');
const code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');

const startIndex = 3742;
const endIndex = 3753; // exclusive for slice

const replacement = `              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold">
                  ✓ Đã đồng bộ D1 Database
                </span>
                <div className="flex gap-2">
                  {currentUser?.roleCode === 'LE_TAN' && (
                     <button
                       onClick={() => handleCancelScheduledBooking(selectedEventModal.id)}
                       className="px-4 py-1.5 rounded-xl bg-red-100 text-red-600 font-bold text-xs cursor-pointer hover:bg-red-200"
                     >
                       Xóa lịch
                     </button>
                  )}
                  <button
                    onClick={() => setSelectedEventModal(null)}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>`;

const newLines = [
  ...lines.slice(0, startIndex),
  ...replacement.split('\n'),
  ...lines.slice(endIndex)
];

fs.writeFileSync(filePath, newLines.join('\n'));
console.log("Successfully replaced button area in page.tsx");
