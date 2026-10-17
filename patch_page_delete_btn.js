const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/app/rooms/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const anchor1 = `  const handleConfirmReassignRoom = async () => {`;
const inject1 = `  const handleCancelScheduledBooking = async (bookingId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa (hủy) lịch họp này không?")) return;
    const targetBooking = bookings.find((b) => b.id === bookingId);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
    );
    try {
      await fetch("/api/rooms/booking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, status: "CANCELLED", notes: (targetBooking?.notes || "") + \` [CANCELLED_BY_RECEPTIONIST_AT_\${new Date().toLocaleTimeString()}]\` }),
      });
    } catch (e) {}
    showToast("❌ Lễ Tân đã xóa (hủy) lịch họp thành công.");

    if (targetBooking) {
      broadcastNotification({
        title: "❌ Lịch Họp Đã Bị Hủy",
        message: \`Lịch họp "\${targetBooking.title}" của \${targetBooking.bookerName} đã bị Lễ Tân hủy bỏ khỏi hệ thống.\`,
        type: "WARNING",
        targetUser: targetBooking.bookerName,
        link: "/rooms",
      });
    }
    setSelectedEventModal(null);
  };

  const handleConfirmReassignRoom = async () => {`;

if (code.includes(anchor1) && !code.includes('handleCancelScheduledBooking')) {
    code = code.replace(anchor1, inject1);
}

const anchor2 = `              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold">
                  ✓ Đã đồng bộ D1 Database
                </span>
                <button
                  onClick={() => setSelectedEventModal(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>`;

const inject2 = `              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
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

if (code.includes(anchor2) && !code.includes('handleCancelScheduledBooking(selectedEventModal.id)')) {
    code = code.replace(anchor2, inject2);
}

fs.writeFileSync(filePath, code);
console.log("Successfully patched page.tsx");
