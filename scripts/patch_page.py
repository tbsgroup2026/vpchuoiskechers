import re

path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add pendingInvoices state
state_code = """
  // Invoice Management Modal State (Tab 2: LIST)
  const [activeInvoiceTrip, setActiveInvoiceTrip] = useState<BusinessTripRecord | null>(null);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
"""
content = re.sub(r'// Invoice Management Modal State \(Tab 2: LIST\)\s*const \[activeInvoiceTrip, setActiveInvoiceTrip\] = useState<BusinessTripRecord \| null>\(null\);', state_code, content)

# 2. Replace handleInvoiceFileUpload and handleSaveInvoice with multi-upload logic
# First find the existing functions and replace them
# We'll just replace handleInvoiceFileUpload up to the end of handleSaveInvoice
def replace_handlers(match):
    return """  const handleMultiInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setPendingInvoices((prev) => [
          ...prev,
          {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            title: file.name.split('.')[0] || "Hóa đơn mới",
            category: "Vé máy bay / Tàu xe",
            amount: 0,
            invoiceDate: new Date().toISOString().split("T")[0],
            invoiceNumber: "",
            notes: "",
            fileName: file.name,
            fileType: file.type,
            fileUrl: dataUrl,
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = "";
  };

  const handleUpdatePendingInvoice = (idx: number, field: string, value: any) => {
    const updated = [...pendingInvoices];
    updated[idx][field] = value;
    setPendingInvoices(updated);
  };

  const handleSaveAllPendingInvoices = async (tripId: string) => {
    if (pendingInvoices.length === 0) return;
    
    // Validate
    for (const inv of pendingInvoices) {
      if (!inv.title.trim() || inv.amount <= 0) {
        alert(`Vui lòng nhập đầy đủ Tên và Số tiền (lớn hơn 0) cho chứng từ: ${inv.fileName}`);
        return;
      }
    }

    try {
      setIsLoading(true);
      const currentTrip = records.find(r => r.id === tripId);
      if (!currentTrip) return;
      
      const newInvoicesList = [...(currentTrip.invoices || []), ...pendingInvoices.map(inv => ({
        ...inv,
        createdAt: new Date().toISOString(),
      }))];

      const res = await fetch("/api/business-trips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tripId,
          invoices_json: JSON.stringify(newInvoicesList),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Đã lưu chứng từ thành công!");
        setPendingInvoices([]);
        await fetchD1Records();
        
        // Update local modal state
        if (activeInvoiceTrip?.id === tripId) {
          const updatedTrip = [...records, { invoices: newInvoicesList }].find(r => r.id === tripId);
          setActiveInvoiceTrip((prev) => prev ? { ...prev, invoices: newInvoicesList } : null);
        }
      } else {
        showToast(`❌ Lỗi: ${data.message || data.error}`);
      }
    } catch (e) {
      showToast("❌ Lỗi mạng, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };
"""

content = re.sub(r'const handleInvoiceFileUpload =.*?handleSaveInvoice.*?\n  };\n', replace_handlers, content, flags=re.DOTALL)

# 3. Replace activeInvoiceTrip Modal JSX
modal_regex = r'\{\/\* ════════════════════════════════════════════════════════════════\s*MODAL 1: QUẢN LÝ & IMPORT HÓA ĐƠN CHỨNG TỪ.*?MODAL 2: IMPORT HÓA ĐƠN TOÀN CỤC'

new_modal = """{/* ════════════════════════════════════════════════════════════════
            MODAL 1: QUẢN LÝ & IMPORT HÓA ĐƠN CHỨNG TỪ (INVOICES MODAL)
           ════════════════════════════════════════════════════════════════ */}
        {activeInvoiceTrip && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-[#006838] to-slate-900 text-white flex items-center justify-between flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded text-emerald-100 font-bold">
                      {activeInvoiceTrip.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-200">
                      {activeInvoiceTrip.location} ({activeInvoiceTrip.startDate} - {activeInvoiceTrip.endDate})
                    </span>
                  </div>
                  <h3 className="text-base font-black tracking-tight mt-1">
                    🧾 QUYẾT TOÁN CÔNG TÁC &amp; CHỨNG TỪ
                  </h3>
                </div>
                <button
                  onClick={() => { setActiveInvoiceTrip(null); setPendingInvoices([]); }}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                {/* Total Summary */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-slate-600 font-semibold block">Dự toán ban đầu:</span>
                    <span className="text-sm font-black text-slate-700">
                      {(activeInvoiceTrip.estimatedCost || 0).toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-600 font-semibold block">Tổng thực tế (các chứng từ đã duyệt):</span>
                    <span className={`text-xl font-black ${(activeInvoiceTrip.invoices || []).reduce((sum, inv) => sum + (inv.amount || 0), 0) > (activeInvoiceTrip.estimatedCost || 0) ? 'text-rose-600' : 'text-[#006838]'}`}>
                      {(activeInvoiceTrip.invoices || [])
                        .reduce((sum, inv) => sum + (inv.amount || 0), 0)
                        .toLocaleString("vi-VN")}{" "}
                      VND
                    </span>
                  </div>
                </div>

                {/* Status Alert */}
                {activeInvoiceTrip.paymentStatus === 'AWAITING_DOCS' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-semibold flex items-center gap-2">
                    <IconBell size={18} className="text-amber-500" />
                    Chuyến công tác đã kết thúc. Vui lòng nộp chứng từ và Giấy đi đường để Kế toán hoàn ứng!
                  </div>
                )}
                {activeInvoiceTrip.paymentStatus === 'REJECTED_DOCS' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold flex items-center gap-2">
                    <IconX size={18} className="text-rose-500" />
                    Chứng từ bị Kế toán trả lại. Lý do: {activeInvoiceTrip.paymentNotes}
                  </div>
                )}
                {activeInvoiceTrip.paymentStatus === 'DOCS_SUBMITTED' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl font-semibold flex items-center gap-2">
                    <IconCheck size={18} className="text-blue-500" />
                    Đã nộp chứng từ. Chờ Kế toán đối soát.
                  </div>
                )}
                {activeInvoiceTrip.paymentStatus === 'PAID' && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl font-semibold flex items-center gap-2">
                    <IconCash size={18} className="text-emerald-600" />
                    Đã hoàn tất thanh toán / hoàn ứng! ({activeInvoiceTrip.paymentNotes})
                  </div>
                )}

                {/* Existing Invoices List */}
                <div className="space-y-2.5">
                  <h4 className="font-black text-slate-800 uppercase tracking-tight text-xs flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Danh sách chứng từ hiện có</span>
                  </h4>

                  {!activeInvoiceTrip.invoices || activeInvoiceTrip.invoices.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400">
                      Chưa có chứng từ nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {activeInvoiceTrip.invoices.map((inv, iIndex) => (
                        <div
                          key={inv.id}
                          className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#006838] flex items-center justify-center flex-shrink-0">
                              {inv.fileType?.includes("pdf") ? <IconFileTypePdf size={16} /> : <IconReceipt size={16} />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-slate-900 truncate" title={inv.title}>{inv.title}</div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {inv.category} • {inv.invoiceDate}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="font-black text-slate-900 text-xs">
                              {inv.amount.toLocaleString("vi-VN")}
                            </div>
                            <div className="flex items-center gap-1">
                              {inv.fileUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewModal({ url: inv.fileUrl || "", title: inv.title, type: inv.fileType || "image/png" })}
                                  className="p-1 rounded-md bg-slate-100 hover:bg-[#006838] hover:text-white transition-colors"
                                >
                                  <IconEye size={13} />
                                </button>
                              )}
                              {!["DOCS_SUBMITTED", "PAYMENT_PENDING", "PAID"].includes(activeInvoiceTrip.paymentStatus || '') && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInvoice(activeInvoiceTrip.id, inv.id)}
                                  className="p-1 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                                >
                                  <IconTrash size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Multi-upload Section (Only show if not locked by Accountant) */}
                {!["DOCS_SUBMITTED", "PAYMENT_PENDING", "PAID"].includes(activeInvoiceTrip.paymentStatus || '') && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-800 uppercase tracking-tight text-xs flex items-center gap-1.5">
                        <span>➕</span>
                        <span>Tải lên chứng từ mới (Hỗ trợ chọn nhiều file)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => invoiceFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <IconUpload size={14} /> Chọn File (Tối đa 15)
                      </button>
                      <input
                        ref={invoiceFileInputRef}
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleMultiInvoiceUpload}
                        className="hidden"
                      />
                    </div>

                    {pendingInvoices.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {pendingInvoices.map((inv, idx) => (
                          <div key={inv.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-emerald-200">
                            <div className="col-span-1 flex justify-center">
                              {inv.fileType?.includes("pdf") ? <IconFileTypePdf size={18} className="text-rose-500"/> : <IconPhoto size={18} className="text-emerald-500"/>}
                            </div>
                            <div className="col-span-3">
                              <input 
                                type="text" 
                                value={inv.title} 
                                onChange={(e) => handleUpdatePendingInvoice(idx, 'title', e.target.value)} 
                                placeholder="Tên chứng từ" 
                                className="w-full px-2 py-1 border border-slate-200 rounded text-[11px]" 
                              />
                            </div>
                            <div className="col-span-3">
                              <select 
                                value={inv.category} 
                                onChange={(e) => handleUpdatePendingInvoice(idx, 'category', e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded text-[11px]"
                              >
                                <option value="Vé máy bay / Tàu xe">Vé máy bay / Tàu xe</option>
                                <option value="Khách sạn / Lưu trú">Khách sạn / Lưu trú</option>
                                <option value="Ăn uống / Tiếp khách">Ăn uống / Tiếp khách</option>
                                <option value="Xăng xe / Cầu đường">Xăng xe / Cầu đường</option>
                                <option value="Chi phí khác">Chi phí khác</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <input 
                                type="number" 
                                value={inv.amount} 
                                onChange={(e) => handleUpdatePendingInvoice(idx, 'amount', Number(e.target.value))} 
                                placeholder="Số tiền" 
                                className="w-full px-2 py-1 border border-slate-200 rounded text-[11px]" 
                              />
                            </div>
                            <div className="col-span-2">
                              <input 
                                type="date" 
                                value={inv.invoiceDate} 
                                onChange={(e) => handleUpdatePendingInvoice(idx, 'invoiceDate', e.target.value)} 
                                className="w-full px-2 py-1 border border-slate-200 rounded text-[11px]" 
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              <button onClick={() => setPendingInvoices(pendingInvoices.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700">
                                <IconTrash size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => handleSaveAllPendingInvoices(activeInvoiceTrip.id)}
                            className="px-4 py-1.5 rounded-lg bg-[#006838] text-white text-xs font-bold shadow-md cursor-pointer"
                          >
                            Lưu {pendingInvoices.length} chứng từ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Giấy đi đường signed (Employee upload) */}
                <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">📄 Giấy đi đường (đã ký & đóng dấu)</h4>
                    <p className="text-[10px] text-slate-500">Bản scan Giấy đi đường đã được nơi đến xác nhận</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeInvoiceTrip.signedTravelPaper?.dataUrl ? (
                      <button
                        onClick={() => setPreviewModal({ url: activeInvoiceTrip.signedTravelPaper!.dataUrl, title: "Giấy đi đường", type: activeInvoiceTrip.signedTravelPaper!.type })}
                        className="px-3 py-1.5 rounded bg-emerald-100 text-[#006838] text-xs font-bold cursor-pointer"
                      >
                         Xem file
                      </button>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-semibold border border-rose-200 bg-rose-50 px-2 py-1 rounded">Chưa có</span>
                    )}
                    
                    {!["DOCS_SUBMITTED", "PAYMENT_PENDING", "PAID"].includes(activeInvoiceTrip.paymentStatus || '') && (
                      <button 
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = 'image/*,application/pdf';
                          fileInput.onchange = (e: any) => handleUploadSignedPaper(e, activeInvoiceTrip.id);
                          fileInput.click();
                        }}
                        className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
                      >
                        Tải lên
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit to Accounting Button (For Employee) */}
                {!["DOCS_SUBMITTED", "PAYMENT_PENDING", "PAID"].includes(activeInvoiceTrip.paymentStatus || '') && activeInvoiceTrip.invoices && activeInvoiceTrip.invoices.length > 0 && activeInvoiceTrip.signedTravelPaper && (
                   <div className="mt-6 flex justify-center">
                     <button
                        onClick={() => handlePaymentAction('SUBMIT_DOCS', activeInvoiceTrip.id)}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg flex items-center gap-2 cursor-pointer"
                     >
                       <IconSend size={18} /> GỬI KẾ TOÁN QUYẾT TOÁN
                     </button>
                   </div>
                )}
              </div>

              {/* Modal Footer (Accountant Toolbar + Close) */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadZIP(activeInvoiceTrip)}
                    className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold hover:bg-amber-100 transition-colors text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <IconDownload size={15} /> Tải ZIP Chứng Từ
                  </button>
                  
                  {roles.includes('KE_TOAN') && activeInvoiceTrip.paymentStatus === 'DOCS_SUBMITTED' && (
                    <>
                      <button
                        onClick={() => handlePaymentAction('REVIEW_DOCS_PASS', activeInvoiceTrip.id)}
                        className="px-4 py-2 rounded-xl bg-[#006838] text-white font-bold hover:bg-emerald-700 transition-colors text-xs cursor-pointer shadow-sm"
                      >
                        Duyệt Chứng Từ
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt("Lý do trả lại chứng từ?");
                          if (reason) handlePaymentAction('REVIEW_DOCS_REJECT', activeInvoiceTrip.id, reason);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors text-xs cursor-pointer shadow-sm"
                      >
                        Trả Lại
                      </button>
                    </>
                  )}
                  {roles.includes('KE_TOAN') && activeInvoiceTrip.paymentStatus === 'PAYMENT_PENDING' && (
                    <button
                        onClick={() => handlePaymentAction('MARK_PAID', activeInvoiceTrip.id, "Đã chuyển khoản")}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-colors text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <IconCash size={15} /> ĐÁNH DẤU ĐÃ THANH TOÁN
                      </button>
                  )}
                </div>
                <button
                  onClick={() => { setActiveInvoiceTrip(null); setPendingInvoices([]); }}
                  className="px-5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            MODAL 2: IMPORT HÓA ĐƠN TOÀN CỤC"""

content = re.sub(modal_regex, new_modal, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched page.tsx successfully!")
