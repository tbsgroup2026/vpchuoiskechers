import os
import re

file_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

state_addition = """
  // Logistics Update Modal
  const [activeLogisticsUpdate, setActiveLogisticsUpdate] = useState<any>(null);
  
  const handleSaveLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLogisticsUpdate) return;
    
    try {
      setIsLoading(true);
      const res = await fetch("/api/business-trips/logistics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeLogisticsUpdate.id,
          logisticsData: activeLogisticsUpdate.logistics
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Đã lưu thông tin hậu cần thành công!");
        setActiveLogisticsUpdate(null);
        setSelectedModalRecord(null);
        fetchLogisticsRecords();
      } else {
        showToast("Lỗi: " + data.error);
      }
    } catch (err) {
      showToast("Lỗi mạng khi lưu thông tin");
    } finally {
      setIsLoading(false);
    }
  };
"""

if "const [activeLogisticsUpdate," not in content:
    content = content.replace(
        "  const [activeInvoiceTrip, setActiveInvoiceTrip] = useState<BusinessTripRecord | null>(null);",
        "  const [activeInvoiceTrip, setActiveInvoiceTrip] = useState<BusinessTripRecord | null>(null);\n" + state_addition
    )

old_btn = "onClick={() => alert('Vui lòng vào màn hình Cập nhật hậu cần chi tiết (Đang phát triển)')}"
new_btn = "onClick={() => setActiveLogisticsUpdate(selectedModalRecord)}"
content = content.replace(old_btn, new_btn)

modal_ui = """
      {/* ════════════════════════════════════════════════════════════════
          MODAL: CẬP NHẬT HẬU CẦN (LỄ TÂN)
         ════════════════════════════════════════════════════════════════ */}
      {activeLogisticsUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-blue-50/50">
              <h3 className="text-lg font-black text-blue-900">Cập nhật chi tiết Hậu cần</h3>
              <button 
                onClick={() => setActiveLogisticsUpdate(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveLogistics} className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
               <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">1. Thông tin Xe Công Ty / Tài Xế</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tên tài xế</label>
                      <input 
                        type="text" 
                        value={activeLogisticsUpdate.logistics?.companyVehicle?.driverName || ''} 
                        onChange={(e) => setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...(activeLogisticsUpdate.logistics||{}), companyVehicle: {...(activeLogisticsUpdate.logistics?.companyVehicle||{}), driverName: e.target.value}}})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        placeholder="VD: Anh Hải"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">SĐT Tài xế</label>
                      <input 
                        type="text" 
                        value={activeLogisticsUpdate.logistics?.companyVehicle?.driverPhone || ''} 
                        onChange={(e) => setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...(activeLogisticsUpdate.logistics||{}), companyVehicle: {...(activeLogisticsUpdate.logistics?.companyVehicle||{}), driverPhone: e.target.value}}})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        placeholder="VD: 0912345678"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Biển số xe</label>
                      <input 
                        type="text" 
                        value={activeLogisticsUpdate.logistics?.companyVehicle?.licensePlate || ''} 
                        onChange={(e) => setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...(activeLogisticsUpdate.logistics||{}), companyVehicle: {...(activeLogisticsUpdate.logistics?.companyVehicle||{}), licensePlate: e.target.value}}})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        placeholder="VD: 51H-123.45"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Giờ & Điểm đón</label>
                      <input 
                        type="text" 
                        value={activeLogisticsUpdate.logistics?.companyVehicle?.pickupTime || ''} 
                        onChange={(e) => setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...(activeLogisticsUpdate.logistics||{}), companyVehicle: {...(activeLogisticsUpdate.logistics?.companyVehicle||{}), pickupTime: e.target.value}}})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        placeholder="VD: 07:00 tại Cổng CT"
                      />
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-bold text-slate-800">2. Đặt Khách sạn / KTX</h4>
                    <button type="button" onClick={() => {
                        const acc = [...(activeLogisticsUpdate.logistics?.accommodations || []), {type: 'HOTEL'}];
                        setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...(activeLogisticsUpdate.logistics||{}), accommodations: acc}});
                    }} className="text-xs text-blue-600 font-bold hover:underline">+ Thêm phòng</button>
                  </div>
                  {(activeLogisticsUpdate.logistics?.accommodations || []).map((acc: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                       <button type="button" onClick={() => {
                          const arr = [...activeLogisticsUpdate.logistics.accommodations];
                          arr.splice(idx, 1);
                          setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...activeLogisticsUpdate.logistics, accommodations: arr}});
                       }} className="absolute top-2 right-2 text-rose-500 hover:text-rose-700"><IconX size={14}/></button>
                       <div className="sm:col-span-2">
                         <label className="block text-xs font-bold text-slate-700 mb-1">Khách sạn / Nhà nghỉ</label>
                         <input type="text" value={acc.provider||''} onChange={(e) => {
                             const arr = [...activeLogisticsUpdate.logistics.accommodations];
                             arr[idx].provider = e.target.value;
                             setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...activeLogisticsUpdate.logistics, accommodations: arr}});
                         }} className="w-full px-2 py-1.5 border rounded text-xs" placeholder="Tên KS..." />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 mb-1">Mã Booking</label>
                         <input type="text" value={acc.bookingRef||''} onChange={(e) => {
                             const arr = [...activeLogisticsUpdate.logistics.accommodations];
                             arr[idx].bookingRef = e.target.value;
                             setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...activeLogisticsUpdate.logistics, accommodations: arr}});
                         }} className="w-full px-2 py-1.5 border rounded text-xs" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 mb-1">Chi phí (VND)</label>
                         <input type="number" value={acc.cost||''} onChange={(e) => {
                             const arr = [...activeLogisticsUpdate.logistics.accommodations];
                             arr[idx].cost = e.target.value;
                             setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...activeLogisticsUpdate.logistics, accommodations: arr}});
                         }} className="w-full px-2 py-1.5 border rounded text-xs" />
                       </div>
                    </div>
                  ))}
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-bold text-slate-800">3. Đặt Vé (Máy bay / Tàu / Xe)</h4>
                    <button type="button" onClick={() => {
                        const tk = [...(activeLogisticsUpdate.logistics?.tickets || []), {}];
                        setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...(activeLogisticsUpdate.logistics||{}), tickets: tk}});
                    }} className="text-xs text-blue-600 font-bold hover:underline">+ Thêm vé</button>
                  </div>
                  {(activeLogisticsUpdate.logistics?.tickets || []).map((t: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                       <button type="button" onClick={() => {
                          const arr = [...activeLogisticsUpdate.logistics.tickets];
                          arr.splice(idx, 1);
                          setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...activeLogisticsUpdate.logistics, tickets: arr}});
                       }} className="absolute top-2 right-2 text-rose-500 hover:text-rose-700"><IconX size={14}/></button>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 mb-1">Hãng bay / Nhà xe</label>
                         <input type="text" value={t.provider||''} onChange={(e) => {
                             const arr = [...activeLogisticsUpdate.logistics.tickets];
                             arr[idx].provider = e.target.value;
                             setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...activeLogisticsUpdate.logistics, tickets: arr}});
                         }} className="w-full px-2 py-1.5 border rounded text-xs" placeholder="Vietnam Airlines..." />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 mb-1">Số hiệu chuyến / Giờ đi</label>
                         <input type="text" value={t.flightNo||''} onChange={(e) => {
                             const arr = [...activeLogisticsUpdate.logistics.tickets];
                             arr[idx].flightNo = e.target.value;
                             setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...activeLogisticsUpdate.logistics, tickets: arr}});
                         }} className="w-full px-2 py-1.5 border rounded text-xs" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 mb-1">Mã Vé / PNR</label>
                         <input type="text" value={t.bookingRef||''} onChange={(e) => {
                             const arr = [...activeLogisticsUpdate.logistics.tickets];
                             arr[idx].bookingRef = e.target.value;
                             setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...activeLogisticsUpdate.logistics, tickets: arr}});
                         }} className="w-full px-2 py-1.5 border rounded text-xs" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 mb-1">Chi phí (VND)</label>
                         <input type="number" value={t.cost||''} onChange={(e) => {
                             const arr = [...activeLogisticsUpdate.logistics.tickets];
                             arr[idx].cost = e.target.value;
                             setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...activeLogisticsUpdate.logistics, tickets: arr}});
                         }} className="w-full px-2 py-1.5 border rounded text-xs" />
                       </div>
                    </div>
                  ))}
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 border-b pb-2">4. Ghi chú gửi người đi công tác</label>
                  <textarea 
                    value={activeLogisticsUpdate.logistics?.notes || ''}
                    onChange={(e) => setActiveLogisticsUpdate({...activeLogisticsUpdate, logistics: {...(activeLogisticsUpdate.logistics||{}), notes: e.target.value}})}
                    rows={3} 
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-1" 
                    placeholder="VD: Vui lòng có mặt trước 15p..."
                  ></textarea>
               </div>
               
               <div className="pt-4 border-t flex justify-end gap-3">
                  <button type="button" onClick={() => setActiveLogisticsUpdate(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200">
                     Hủy
                  </button>
                  <button type="submit" disabled={isLoading} className="px-5 py-2.5 rounded-xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                     {isLoading ? "Đang lưu..." : "Lưu & Xác nhận Hậu cần"}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
"""

if "MODAL: CẬP NHẬT HẬU CẦN" not in content:
    content = content.replace("      {/* FOOTER */}", modal_ui + "\n      {/* FOOTER */}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Logistics Update UI!")
