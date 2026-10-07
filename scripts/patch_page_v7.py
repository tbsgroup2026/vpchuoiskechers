import os

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update pending invoices list rendering
old_pending_invoices = """                      {pendingInvoices.length > 0 && (
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
                              <div className="col-span-4">
                                <input 
                                  type="number" 
                                  value={inv.amount || ""} 
                                  onChange={(e) => handleUpdatePendingInvoice(idx, 'amount', parseInt(e.target.value))} 
                                  placeholder="Số tiền" 
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
                      )}"""

new_pending_invoices = """                      {pendingInvoices.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {pendingInvoices.map((inv, idx) => (
                            <div key={inv.id} className="relative bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                               <button onClick={() => setPendingInvoices(pendingInvoices.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-white/80 backdrop-blur rounded-full p-1 text-rose-500 hover:bg-rose-100 transition-colors z-10 cursor-pointer shadow-sm">
                                 <IconX size={14} stroke={3} />
                               </button>
                               <div className="h-24 bg-slate-100 flex items-center justify-center relative overflow-hidden group">
                                 {inv.fileType?.includes("pdf") ? (
                                   <div className="flex flex-col items-center text-rose-500"><IconFileTypePdf size={32}/><span className="text-[10px] font-bold mt-1">PDF Document</span></div>
                                 ) : inv.fileData ? (
                                   <img src={inv.fileData} className="w-full h-full object-cover" alt="invoice" />
                                 ) : (
                                   <IconPhoto size={32} className="text-emerald-300"/>
                                 )}
                               </div>
                               <div className="p-3 flex flex-col gap-2 flex-1">
                                 <input type="text" value={inv.title} onChange={(e) => handleUpdatePendingInvoice(idx, 'title', e.target.value)} placeholder="Tên chứng từ (tùy chọn)" className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-700 focus:bg-white" />
                                 <div className="flex gap-2">
                                    <select value={inv.category} onChange={(e) => handleUpdatePendingInvoice(idx, 'category', e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-700">
                                      <option value="Vé máy bay / Tàu xe">✈️ Vé máy bay / Tàu xe</option>
                                      <option value="Khách sạn / Lưu trú">🏨 Khách sạn / Lưu trú</option>
                                      <option value="Ăn uống / Tiếp khách">🍜 Ăn uống / Tiếp khách</option>
                                      <option value="Xăng xe / Cầu đường">⛽ Xăng xe / Cầu đường</option>
                                      <option value="Chi phí khác">📝 Chi phí khác</option>
                                    </select>
                                    <input type="number" value={inv.amount || ""} onChange={(e) => handleUpdatePendingInvoice(idx, 'amount', parseInt(e.target.value))} placeholder="Số tiền (VND)" className="w-2/3 px-2 py-1.5 bg-emerald-50/50 border border-emerald-300 rounded text-xs font-black text-[#006838] focus:bg-white placeholder-emerald-300 text-right" />
                                 </div>
                               </div>
                            </div>
                          ))}
                          <div className="col-span-full flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => handleSaveAllPendingInvoices(activeInvoiceTrip.id)}
                              className="px-6 py-2.5 rounded-xl bg-[#006838] hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-200 transition-colors cursor-pointer flex gap-2 items-center"
                            >
                              <IconCheck size={16} /> Lưu {pendingInvoices.length} chứng từ
                            </button>
                          </div>
                        </div>
                      )}"""

content = content.replace(old_pending_invoices, new_pending_invoices)

# 2. Accountant Payment Filter Default
accountant_default_logic = """
    // Search/Filter logic for records
    const isAccountant = roles.includes('ACCOUNTANT') || roles.includes('accountant') || currentUser?.roleCode === 'KE_TOAN' || ['KT-001','KT-002'].includes(currentUser?.empCode||'');

    const filteredRecords = records.filter(r => {
      // Name / Code Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.code.toLowerCase().includes(q) && 
            !r.title.toLowerCase().includes(q) && 
            !r.creator.toLowerCase().includes(q)) return false;
      }
      
      // Region
      if (regionFilter !== "ALL" && r.region !== regionFilter) return false;
      // Location
      if (locationFilter !== "ALL" && r.location !== locationFilter) return false;
      // Status
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      // Logistics Status
      if (logisticsFilter !== "ALL" && r.logisticsStatus !== logisticsFilter) return false;
      // Payment Status
      if (paymentFilter !== "ALL") {
         const pStatus = r.paymentStatus || 'NOT_STARTED';
         if (pStatus !== paymentFilter) return false;
      }

      // Date Range Filter (simplified to start date matching YYYY-MM)
      if (startDateFilter && !r.startDate.startsWith(startDateFilter)) return false;

      return true;
    });"""

old_filter_logic = """    const filteredRecords = records.filter(r => {
      // Name / Code Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.code.toLowerCase().includes(q) && 
            !r.title.toLowerCase().includes(q) && 
            !r.creator.toLowerCase().includes(q)) return false;
      }
      
      // Region
      if (regionFilter !== "ALL" && r.region !== regionFilter) return false;
      // Location
      if (locationFilter !== "ALL" && r.location !== locationFilter) return false;
      // Status
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      // Logistics Status
      if (logisticsFilter !== "ALL" && r.logisticsStatus !== logisticsFilter) return false;
      // Payment Status
      if (paymentFilter !== "ALL" && r.paymentStatus !== paymentFilter) return false;

      // Date Range Filter (simplified to start date matching YYYY-MM)
      if (startDateFilter && !r.startDate.startsWith(startDateFilter)) return false;

      return true;
    });"""

content = content.replace(old_filter_logic, accountant_default_logic)

# Change the initial state of paymentFilter conditionally in a useEffect if accountant
payment_effect = """  useEffect(() => {
    const isAcc = roles.includes('ACCOUNTANT') || roles.includes('accountant') || currentUser?.roleCode === 'KE_TOAN' || ['KT-001','KT-002'].includes(currentUser?.empCode||'');
    if (isAcc && paymentFilter === "ALL") {
       setPaymentFilter("SUBMITTED");
    }
  }, [roles, currentUser]);"""

# Insert right after: const [paymentFilter, setPaymentFilter] = useState("ALL");
content = content.replace(
    '  const [paymentFilter, setPaymentFilter] = useState("ALL");',
    '  const [paymentFilter, setPaymentFilter] = useState("ALL");\n' + payment_effect
)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched UI phase 3 (Invoice Mobile Grid + Filters)")
