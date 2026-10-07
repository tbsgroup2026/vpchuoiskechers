import os
import re

page_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Payment status badges
old_badge = """                              {trip.paymentStatus === 'NOT_STARTED' && <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">Chưa Quyết Toán</span>}
                              {trip.paymentStatus === 'PROCESSING' && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border border-amber-200 flex items-center gap-1"><IconLoader size={12} className="animate-spin" /> Đang Xử Lý</span>}
                              {trip.paymentStatus === 'PAID' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-1"><IconCheck size={12} /> Đã Thanh Toán</span>}"""

new_badge = """                              {(!trip.paymentStatus || trip.paymentStatus === 'NOT_STARTED') && <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">Chưa Quyết Toán</span>}
                              {trip.paymentStatus === 'SUBMITTED' && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">Kế toán đang duyệt</span>}
                              {trip.paymentStatus === 'ACCOUNTING_REVIEW' && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200">Kế toán đang duyệt</span>}
                              {trip.paymentStatus === 'APPROVED_FOR_PAYMENT' && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border border-amber-200">Chờ Chi Tiền (UNC)</span>}
                              {trip.paymentStatus === 'PAID' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-1"><IconCheck size={12} /> Đã Thanh Toán</span>}
                              {trip.paymentStatus === 'REJECTED_DOCS' && <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200">Từ Chối Quyết Toán</span>}"""
content = content.replace(old_badge, new_badge)

# 2. Add Status Filter for Accountants
old_tabs = """            <div className="flex items-center gap-4 text-sm font-semibold text-slate-500 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`pb-2 whitespace-nowrap transition-colors ${statusFilter === "ALL" ? "text-emerald-700 border-b-2 border-emerald-600" : "hover:text-slate-700"}`}
              >
                Tất Cả
              </button>"""

new_tabs = """            <div className="flex items-center gap-4 text-sm font-semibold text-slate-500 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`pb-2 whitespace-nowrap transition-colors ${statusFilter === "ALL" ? "text-emerald-700 border-b-2 border-emerald-600" : "hover:text-slate-700"}`}
              >
                Tất Cả
              </button>
              {isAccountant && (
                <>
                  <button
                    onClick={() => setStatusFilter("SUBMITTED")}
                    className={`pb-2 whitespace-nowrap transition-colors ${statusFilter === "SUBMITTED" ? "text-emerald-700 border-b-2 border-emerald-600" : "hover:text-slate-700"}`}
                  >
                    Chờ Kế Toán Duyệt
                  </button>
                  <button
                    onClick={() => setStatusFilter("APPROVED_FOR_PAYMENT")}
                    className={`pb-2 whitespace-nowrap transition-colors ${statusFilter === "APPROVED_FOR_PAYMENT" ? "text-emerald-700 border-b-2 border-emerald-600" : "hover:text-slate-700"}`}
                  >
                    Chờ Chi Tiền
                  </button>
                </>
              )}"""
content = content.replace(old_tabs, new_tabs)

# 3. Handle Payment Action override
# Replace entirely using regex to catch the block from handlePaymentAction up to its closing brace
handle_payment_regex = r"const handlePaymentAction = async \(action: string, tripId: string, notes: string = \"\"\) => \{[\s\S]*?\}\n    \}\s*catch\s*\(e\)\s*\{[\s\S]*?\}\s*finally\s*\{[\s\S]*?\}\n  \};"

new_func = """const handlePaymentAction = async (action: string, tripId: string, notes: string = "") => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/business-trips/payment-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, action, notes })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        await fetchD1Records();
        if (activeInvoiceTrip?.id === tripId) {
           setActiveInvoiceTrip(null); 
        }
      } else {
        showToast(data.error || "Có lỗi xảy ra");
      }
    } catch(e) {
      showToast("Lỗi mạng");
    } finally {
      setIsLoading(false);
    }
  };"""

content = re.sub(handle_payment_regex, new_func, content)


# 4. Replace Buttons
old_btn_regex = r"\{\!\[\"DOCS_SUBMITTED\", \"PAYMENT_PENDING\", \"PAID\"\]\.includes\(activeInvoiceTrip\.paymentStatus[\s\S]*?GỬI KẾ TOÁN QUYẾT TOÁN\n\s*</button>\n\s*</div>\n\s*\)\}"
new_btn = """{(activeInvoiceTrip.paymentStatus === "NOT_STARTED" || !activeInvoiceTrip.paymentStatus || activeInvoiceTrip.paymentStatus === "REJECTED_DOCS") && activeInvoiceTrip.creator.includes(currentUser?.empCode||'') && ((activeInvoiceTrip.invoices && activeInvoiceTrip.invoices.length > 0) || activeInvoiceTrip.signedTravelPaper) && (
                     <div className="mt-6 flex justify-center">
                       <button
                         onClick={() => {
                           if(confirm("Xác nhận gửi chứng từ cho Kế toán Quyết toán? Bạn sẽ không thể sửa file sau khi gửi.")) {
                             handlePaymentAction('SUBMIT', activeInvoiceTrip.id);
                           }
                         }}
                          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg flex items-center gap-2 cursor-pointer"
                       >
                         <IconSend size={18} /> GỬI KẾ TOÁN QUYẾT TOÁN
                       </button>
                     </div>
                  )}"""

if re.search(old_btn_regex, content):
    content = re.sub(old_btn_regex, new_btn, content)


old_toolbar_regex = r"\{roles\.includes\('KE_TOAN'\) && activeInvoiceTrip\.paymentStatus === 'DOCS_SUBMITTED' && \([\s\S]*?ĐÁNH DẤU ĐÃ THANH TOÁN\n\s*</button>\n\s*\)\}"
new_toolbar = """{isAccountant && ["SUBMITTED", "ACCOUNTING_REVIEW"].includes(activeInvoiceTrip.paymentStatus||'') && (
                      <>
                        <button
                          onClick={() => handlePaymentAction('APPROVE', activeInvoiceTrip.id)}
                          className="px-4 py-2 rounded-xl bg-[#006838] text-white font-bold hover:bg-emerald-700 transition-colors text-xs cursor-pointer shadow-sm"
                        >
                          Chốt hồ sơ (Chờ UNC)
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Lý do từ chối hồ sơ?");
                            if (reason) handlePaymentAction('REJECT', activeInvoiceTrip.id, reason);
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors text-xs cursor-pointer shadow-sm"
                        >
                          Trả Lại
                        </button>
                      </>
                    )}
                    {isAccountant && activeInvoiceTrip.paymentStatus === 'APPROVED_FOR_PAYMENT' && (
                      <button
                          onClick={() => {
                            const note = prompt("Ghi chú chuyển khoản (UNC, ngày...):");
                            if(note !== null) handlePaymentAction('PAY', activeInvoiceTrip.id, note);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-600 text-white font-black hover:bg-amber-700 transition-colors text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                          <IconCash size={15} /> ĐÁNH DẤU ĐÃ THANH TOÁN
                        </button>
                    )}"""

if re.search(old_toolbar_regex, content):
    content = re.sub(old_toolbar_regex, new_toolbar, content)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Applied UI patches correctly!")
