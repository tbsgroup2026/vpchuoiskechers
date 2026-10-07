import os
import re

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Inject Fleet Warning State and Logic
fleet_state_hook = """  // File Upload State for Form Proposal
  const [fleetWarning, setFleetWarning] = useState<string | null>(null);

  useEffect(() => {
    const checkFleet = async () => {
      if (proposalForm.transport === "Xe công ty" && proposalForm.startDate && proposalForm.endDate) {
         try {
           const res = await fetch(`/api/business-trips/fleet-availability?startDate=${proposalForm.startDate}&endDate=${proposalForm.endDate}`);
           const data = await res.json();
           if (data.success && !data.isAvailable) {
              setFleetWarning(data.message);
           } else {
              setFleetWarning(null);
           }
         } catch(e) { setFleetWarning(null); }
      } else {
         setFleetWarning(null);
      }
    };
    checkFleet();
  }, [proposalForm.transport, proposalForm.startDate, proposalForm.endDate]);"""

content = content.replace(
    '  // File Upload State for Form Proposal',
    fleet_state_hook
)

# Render fleet warning below transport select
transport_html = """                        <select
                          className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium appearance-none"
                          value={proposalForm.transport}
                          onChange={(e) => setProposalForm({ ...proposalForm, transport: e.target.value })}
                        >
                          <option>Xe công ty</option>
                          <option>Xe ngoài</option>
                          <option>Tự túc</option>
                          <option>Máy bay</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <IconChevronDown size={18} />
                        </div>
                      </div>"""

fleet_warning_html = """                        <select
                          className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium appearance-none"
                          value={proposalForm.transport}
                          onChange={(e) => setProposalForm({ ...proposalForm, transport: e.target.value })}
                        >
                          <option>Xe công ty</option>
                          <option>Xe ngoài</option>
                          <option>Tự túc</option>
                          <option>Máy bay</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <IconChevronDown size={18} />
                        </div>
                      </div>
                      {fleetWarning && (
                         <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg flex items-center gap-2">
                           ⚠️ <span>{fleetWarning}</span>
                         </div>
                      )}"""

content = content.replace(transport_html, fleet_warning_html)

# 2. Add Invoice Payment API logic
invoice_api_logic = """
  const handlePaymentAction = async (action: string, notes: string = "") => {
    if (!selectedModalRecord) return;
    try {
      setIsLoading(true);
      const res = await fetch("/api/business-trips/payment-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: selectedModalRecord.id, action, notes })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setSelectedModalRecord({ ...selectedModalRecord, paymentStatus: data.newStatus, paymentNotes: notes || selectedModalRecord.paymentNotes });
        await fetchD1Records();
      } else {
        showToast(data.error);
      }
    } catch(e) {
      showToast("Lỗi mạng");
    } finally {
      setIsLoading(false);
    }
  };
"""

content = content.replace(
    '  const handleSaveInvoice = async (invoiceId: string) => {',
    invoice_api_logic + '\n  const handleSaveInvoice = async (invoiceId: string) => {'
)

# 3. Add Invoice Quyết toán UI
# Replace the header of the Invoice tab
old_invoice_header = """                          <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div>
                              <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                <IconReceipt size={18} /> Chứng từ hoàn ứng & thanh toán
                              </h4>
                              <p className="text-xs text-blue-700 mt-1">Cập nhật hóa đơn, vé, và chi phí thực tế.</p>
                            </div>
                            <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5">
                              <IconPlus size={16} /> Thêm hóa đơn
                              <input
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={handleAddInvoices}
                              />
                            </label>
                          </div>"""

new_invoice_header = """                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100 gap-3">
                            <div>
                              <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                <IconReceipt size={18} /> Chứng từ hoàn ứng & thanh toán
                              </h4>
                              <p className="text-xs text-blue-700 mt-1">Cập nhật hóa đơn, vé, và chi phí thực tế.</p>
                              {selectedModalRecord.paymentStatus === "REJECTED_DOCS" && (
                                <p className="text-xs text-rose-600 mt-1 font-bold">⚠️ Kế toán từ chối: {selectedModalRecord.paymentNotes}</p>
                              )}
                              {selectedModalRecord.paymentStatus === "SUBMITTED" && (
                                <p className="text-xs text-emerald-600 mt-1 font-bold">⏳ Đang chờ Kế toán kiểm tra</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Only creator can upload if not submitted/paid */}
                              {(selectedModalRecord.paymentStatus === "NOT_STARTED" || !selectedModalRecord.paymentStatus || selectedModalRecord.paymentStatus === "REJECTED_DOCS") && selectedModalRecord.creator.includes(currentUser.empCode) && (
                                <>
                                  <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5">
                                    <IconPlus size={16} /> Thêm ảnh
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/*,.pdf"
                                      className="hidden"
                                      onChange={handleAddInvoices}
                                    />
                                  </label>
                                  <button onClick={() => {
                                      if(confirm("Xác nhận gửi chứng từ cho Kế toán Quyết toán? Bạn sẽ không thể sửa file sau khi gửi.")) {
                                        handlePaymentAction("SUBMIT");
                                      }
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm">
                                    Gửi Kế Toán Quyết Toán
                                  </button>
                                </>
                              )}
                              {/* Accountant Actions */}
                              {roles.includes('ACCOUNTANT') && ["SUBMITTED", "ACCOUNTING_REVIEW"].includes(selectedModalRecord.paymentStatus||'') && (
                                <>
                                  <button onClick={() => {
                                      const reason = prompt("Lý do từ chối hồ sơ?");
                                      if(reason) handlePaymentAction("REJECT", reason);
                                    }}
                                    className="bg-rose-500 text-white px-3 py-2 rounded-xl text-xs font-bold">
                                    Từ chối
                                  </button>
                                  <button onClick={() => handlePaymentAction("APPROVE")}
                                    className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold">
                                    Chốt hồ sơ (Chờ chi tiền)
                                  </button>
                                </>
                              )}
                              {roles.includes('ACCOUNTANT') && selectedModalRecord.paymentStatus === "APPROVED_FOR_PAYMENT" && (
                                <button onClick={() => {
                                    const note = prompt("Ghi chú chuyển khoản (UNC, ngày...):");
                                    if(note !== null) handlePaymentAction("PAY", note);
                                  }}
                                  className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
                                  Đã chuyển khoản (PAID)
                                </button>
                              )}
                            </div>
                          </div>"""

content = content.replace(old_invoice_header, new_invoice_header)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched UI phase 1")
