import re
import os

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the OLD handlePaymentAction
old_handle_payment_action = re.search(r'const handlePaymentAction = async \(action: "SUBMIT_DOCS".*?showToast\(`❌ Lỗi: \$\{data\.message \|\| data\.error\}`\);\s*\}\s*catch[^\}]+\}\s*finally[^\}]+\}\s*\};', content, re.DOTALL)
if old_handle_payment_action:
    new_payment_action = """  const handlePaymentAction = async (action: string, tripId: string, notes: string = "") => {
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
    content = content.replace(old_handle_payment_action.group(0), new_payment_action)
else:
    print("WARNING: Could not find old handlePaymentAction")

# Replace the old buttons in activeInvoiceTrip
old_buttons_block = re.search(r'\{!\["DOCS_SUBMITTED", "PAYMENT_PENDING", "PAID"\].includes\(activeInvoiceTrip\.paymentStatus.*?</button>\s*</div>\s*\)\}', content, re.DOTALL)
if old_buttons_block:
    new_buttons_block = """                  {(activeInvoiceTrip.paymentStatus === "NOT_STARTED" || !activeInvoiceTrip.paymentStatus || activeInvoiceTrip.paymentStatus === "REJECTED_DOCS") && activeInvoiceTrip.creator.includes(currentUser.empCode) && (activeInvoiceTrip.invoices?.length > 0 || activeInvoiceTrip.signedTravelPaper) && (
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
    content = content.replace(old_buttons_block.group(0), new_buttons_block)
else:
    print("WARNING: Could not find old send button block")

# Replace Accountant toolbar
old_accountant_toolbar = re.search(r'\{roles\.includes\(\'KE_TOAN\'\).*?ĐÁNH DẤU ĐÃ THANH TOÁN\s*</button>\s*\)\}', content, re.DOTALL)
if old_accountant_toolbar:
    new_accountant_toolbar = """                    {isAccountant && ["SUBMITTED", "ACCOUNTING_REVIEW"].includes(activeInvoiceTrip.paymentStatus||'') && (
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
    content = content.replace(old_accountant_toolbar.group(0), new_accountant_toolbar)
else:
    print("WARNING: Could not find old accountant toolbar")

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Aggressive patch applied!")
