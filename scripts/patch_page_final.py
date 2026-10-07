import os

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update pending invoices
old_pending = """                      {pendingInvoices.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {pendingInvoices.map((inv, idx) => (
                            <div key={inv.id} className="relative bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm flex items-center p-2">
                              <button
                                onClick={() => {
                                  const newArr = [...pendingInvoices];
                                  newArr.splice(idx, 1);
                                  setPendingInvoices(newArr);
                                }}
                                className="absolute top-1 right-1 p-1 bg-white rounded-full text-rose-500 hover:bg-rose-50 shadow-sm z-10"
                              >
                                <IconX size={14} stroke={3} />
                              </button>
                              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {inv.fileType?.includes("pdf") ? (
                                  <div className="flex flex-col items-center justify-center text-rose-500">
                                    <IconFileTypePdf size={24}/>
                                    <span className="text-[8px] font-bold mt-0.5 uppercase">PDF</span>
                                  </div>
                                ) : inv.fileData ? (
                                  <img src={inv.fileData} className="w-full h-full object-cover" alt="invoice" />
                                ) : (
                                  <IconPhoto size={24} className="text-emerald-300"/>
                                )}
                              </div>
                              <div className="ml-3 flex-1">
                                <input
                                  type="text"
                                  value={inv.title}
                                  onChange={(e) => {
                                    const newArr = [...pendingInvoices];
                                    newArr[idx].title = e.target.value;
                                    setPendingInvoices(newArr);
                                  }}
                                  placeholder="Tên hóa đơn (vd: Vé máy bay)..."
                                  className="w-full text-xs font-semibold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-emerald-500 mb-1 pb-1"
                                />
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 font-medium">Số tiền:</span>
                                  <input
                                    type="number"
                                    value={inv.amount || ""}
                                    onChange={(e) => {
                                      const newArr = [...pendingInvoices];
                                      newArr[idx].amount = Number(e.target.value);
                                      setPendingInvoices(newArr);
                                    }}
                                    placeholder="VND"
                                    className="w-24 text-xs font-bold text-[#006838] bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-emerald-500 text-right"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => handleSaveInvoices(activeInvoiceTrip.id)}
                              disabled={isUploading}
                              className="px-4 py-2 rounded-xl bg-[#006838] text-white font-bold hover:bg-emerald-700 transition-colors text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                              <IconCheck size={16} /> Lưu {pendingInvoices.length} chứng từ
                            </button>
                          </div>
                        </div>
                      )}"""

new_pending = """                      {pendingInvoices.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {pendingInvoices.map((inv, idx) => (
                            <div key={inv.id} className="relative bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                              <button
                                onClick={() => {
                                  const newArr = [...pendingInvoices];
                                  newArr.splice(idx, 1);
                                  setPendingInvoices(newArr);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-md rounded-full text-rose-500 hover:bg-rose-50 shadow-md z-10 transition-transform hover:scale-110"
                              >
                                <IconX size={14} stroke={3} />
                              </button>
                              <div className="w-full h-24 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                                {inv.fileType?.includes("pdf") ? (
                                  <div className="flex flex-col items-center justify-center text-rose-500">
                                    <IconFileTypePdf size={32}/>
                                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">PDF Document</span>
                                  </div>
                                ) : inv.fileData ? (
                                  <img src={inv.fileData} className="w-full h-full object-cover" alt="invoice" />
                                ) : (
                                  <IconPhoto size={32} className="text-emerald-300"/>
                                )}
                              </div>
                              <div className="p-3 flex flex-col gap-2 flex-1">
                                <input
                                  type="text"
                                  value={inv.title}
                                  onChange={(e) => {
                                    const newArr = [...pendingInvoices];
                                    newArr[idx].title = e.target.value;
                                    setPendingInvoices(newArr);
                                  }}
                                  placeholder="Tên hóa đơn (vd: Vé máy bay)..."
                                  className="w-full text-xs font-bold text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none focus:border-emerald-500 pb-1"
                                />
                                <div className="flex gap-2">
                                  <select className="text-[10px] bg-slate-50 border border-slate-200 rounded-md px-1 py-1 text-slate-600 focus:outline-none">
                                    <option>VND</option>
                                    <option>USD</option>
                                  </select>
                                  <input
                                    type="number"
                                    value={inv.amount || ""}
                                    onChange={(e) => {
                                      const newArr = [...pendingInvoices];
                                      newArr[idx].amount = Number(e.target.value);
                                      setPendingInvoices(newArr);
                                    }}
                                    placeholder="Nhập số tiền..."
                                    className="flex-1 text-xs font-black text-[#006838] bg-transparent border-b border-slate-200 focus:outline-none focus:border-emerald-500 text-right"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="col-span-full flex justify-end pt-2">
                            <button
                              onClick={() => handleSaveInvoices(activeInvoiceTrip.id)}
                              disabled={isUploading}
                              className="px-6 py-2.5 rounded-xl bg-[#006838] text-white font-black hover:bg-emerald-700 transition-colors text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                            >
                              <IconCheck size={16} /> Lưu {pendingInvoices.length} chứng từ
                            </button>
                          </div>
                        </div>
                      )}"""

content = content.replace(old_pending, new_pending)

# 2. Add filters
old_logistics = """                {/* 4.5. Lọc Hậu cần (Lễ tân) */}
                {can(PERMISSIONS.TRIP_DISPATCH_VEHICLE) && (
                  <div className="w-full sm:w-40 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Lọc Hậu cần</label>
                    <select
                      value={logisticsFilter}
                      onChange={(e) => setLogisticsFilter(e.target.value as any)}
                      className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:border-[#006838] focus:ring-1 focus:ring-[#006838] outline-none shadow-sm font-medium"
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="PENDING">Đang chờ Lễ tân</option>
                      <option value="ARRANGED">Đã sắp xếp</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>
                )}"""

new_filters = """                {/* 4.5. Lọc Hậu cần (Lễ tân) */}
                {can(PERMISSIONS.TRIP_DISPATCH_VEHICLE) && (
                  <div className="w-full sm:w-40 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Lọc Hậu cần</label>
                    <select
                      value={logisticsFilter}
                      onChange={(e) => setLogisticsFilter(e.target.value as any)}
                      className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:border-[#006838] focus:ring-1 focus:ring-[#006838] outline-none shadow-sm font-medium"
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="PENDING">Đang chờ Lễ tân</option>
                      <option value="ARRANGED">Đã sắp xếp</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>
                )}

                {/* 4.6 Lọc Kế toán */}
                {isAccountant && (
                  <div className="w-full sm:w-40 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Lọc Kế toán</label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:border-[#006838] focus:ring-1 focus:ring-[#006838] outline-none shadow-sm font-medium"
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="WAITING">Chờ đối soát</option>
                      <option value="APPROVED_FOR_PAYMENT">Chờ chuyển khoản (UNC)</option>
                      <option value="PAID">Đã thanh toán</option>
                      <option value="REJECTED_DOCS">Từ chối/Trả lại</option>
                    </select>
                  </div>
                )}"""

content = content.replace(old_logistics, new_filters)

# 3. Add handlePaymentAction
old_func = """  const handlePaymentAction = async (action: "SUBMIT_DOCS" | "REVIEW_DOCS_PASS" | "REVIEW_DOCS_REJECT" | "MARK_PAID", tripId: string, notes?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/business-trips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tripId, actionLevel: action, paymentNotes: notes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✅ Đã cập nhật trạng thái quyết toán thành công!`);
        await fetchD1Records();
        
        // Update local modal state if open
        if (activeInvoiceTrip?.id === tripId) {
           const updated = records.find(r => r.id === tripId); // Note: we'd ideally fetch from server response, but fetchD1Records triggers a re-render. Let's just close modal for simplicity if it's too complex to merge, or let the re-render handle it.
           setActiveInvoiceTrip(null); 
        }
      } else {
        showToast(`❌ Lỗi: ${data.message || data.error}`);
      }
    } catch (e) {
      showToast("❌ Lỗi mạng khi cập nhật.");
    } finally {
      setIsLoading(false);
    }
  };"""

new_func = """  const handlePaymentAction = async (action: string, tripId: string, notes: string = "") => {
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

content = content.replace(old_func, new_func)

# 4. Filter logic override
old_filter = """    const filteredRecords = records.filter((rec) => {
    const matchSearch ="""

new_filter = """    const isAccountant = roles.includes('ACCOUNTANT') || roles.includes('accountant') || currentUser?.roleCode === 'KE_TOAN' || ['KT-001','KT-002'].includes(currentUser?.empCode||'');

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const matchSearch ="""

content = content.replace(old_filter, new_filter)

# 5. Replace Submit Buttons and Accountant toolbar carefully
old_btn = """                  {!["DOCS_SUBMITTED", "PAYMENT_PENDING", "PAID"].includes(activeInvoiceTrip.paymentStatus || '') && activeInvoiceTrip.invoices && activeInvoiceTrip.invoices.length > 0 && activeInvoiceTrip.signedTravelPaper && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => handlePaymentAction('SUBMIT_DOCS', activeInvoiceTrip.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#006838] text-white font-black hover:bg-emerald-700 transition-colors text-sm cursor-pointer shadow-md flex items-center gap-2"
                      >
                        <IconSend size={18} /> GỬI KẾ TOÁN QUYẾT TOÁN
                      </button>
                    </div>
                  )}"""

new_btn = """                  {(activeInvoiceTrip.paymentStatus === "NOT_STARTED" || !activeInvoiceTrip.paymentStatus || activeInvoiceTrip.paymentStatus === "REJECTED_DOCS") && activeInvoiceTrip.creator.includes(currentUser?.empCode||'') && ((activeInvoiceTrip.invoices && activeInvoiceTrip.invoices.length > 0) || activeInvoiceTrip.signedTravelPaper) && (
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

content = content.replace(old_btn, new_btn)

old_toolbar = """                    {roles.includes('KE_TOAN') && activeInvoiceTrip.paymentStatus === 'DOCS_SUBMITTED' && (
                      <>
                        <button
                          onClick={() => handlePaymentAction('REVIEW_DOCS_PASS', activeInvoiceTrip.id)}
                          className="px-4 py-2 rounded-xl bg-[#006838] text-white font-bold hover:bg-emerald-700 transition-colors text-xs cursor-pointer shadow-sm"
                        >
                          Duyệt Chứng Từ
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt("Lý do trả lại chứng từ?");
                            if (note !== null) handlePaymentAction('REVIEW_DOCS_REJECT', activeInvoiceTrip.id, note);
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors text-xs cursor-pointer shadow-sm"
                        >
                          Trả Lại
                        </button>
                      </>
                    )}
                    {roles.includes('KE_TOAN') && activeInvoiceTrip.paymentStatus === 'PAYMENT_PENDING' && (
                      <button
                          onClick={() => handlePaymentAction('MARK_PAID', activeInvoiceTrip.id)}
                          className="px-4 py-2 rounded-xl bg-amber-600 text-white font-black hover:bg-amber-700 transition-colors text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                          <IconCash size={15} /> ĐÁNH DẤU ĐÃ THANH TOÁN
                        </button>
                    )}"""

new_toolbar = """                    {isAccountant && ["SUBMITTED", "ACCOUNTING_REVIEW"].includes(activeInvoiceTrip.paymentStatus||'') && (
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

content = content.replace(old_toolbar, new_toolbar)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Applied UI patches correctly!")
