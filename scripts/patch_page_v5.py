import re
import os

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Logistics accommodations form rendering
old_logistics = """                                        {d.accommodationType === "COMPANY_DORM" && (
                                          <input type="text" value={formDest.dorm_room_no || ""} onChange={e => updateDest('dorm_room_no', e.target.value)} className="w-full px-2 py-1 rounded text-xs border border-slate-300" placeholder="Số phòng KTX (VD: P.205)" />
                                        )}
                                        {d.accommodationType === "EXTERNAL_HOTEL" && (
                                          <div className="w-full space-y-1">
                                            <input type="text" value={formDest.hotel_name || ""} onChange={e => updateDest('hotel_name', e.target.value)} className="w-full px-2 py-1 rounded text-xs border border-slate-300" placeholder="Tên khách sạn" />
                                            <input type="number" value={formDest.cost || ""} onChange={e => updateDest('cost', e.target.value)} className="w-full px-2 py-1 rounded text-xs border border-slate-300" placeholder="Giá tiền/đêm" />
                                          </div>
                                        )}"""

new_logistics = """                                        {d.accommodationType === "COMPANY_DORM" && (
                                          <input type="text" value={formDest.dorm_room_no || ""} onChange={e => updateDest('dorm_room_no', e.target.value)} className="w-full px-2 py-1 rounded text-xs border border-slate-300" placeholder="Số phòng KTX (VD: P.205)" />
                                        )}
                                        {d.accommodationType === "EXTERNAL_HOTEL" && (
                                          <div className="w-full space-y-1">
                                            <input type="text" value={formDest.hotel_name || ""} onChange={e => updateDest('hotel_name', e.target.value)} className="w-full px-2 py-1 rounded text-xs border border-slate-300" placeholder="Tên khách sạn" />
                                            <input type="text" value={formDest.bookingRef || ""} onChange={e => updateDest('bookingRef', e.target.value)} className="w-full px-2 py-1 rounded text-xs border border-slate-300" placeholder="Mã Booking" />
                                            <input type="number" value={formDest.cost || ""} onChange={e => updateDest('cost', e.target.value)} className="w-full px-2 py-1 rounded text-xs border border-slate-300" placeholder="Tổng tiền phòng" />
                                          </div>
                                        )}"""

content = content.replace(old_logistics, new_logistics)

# Add Tickets and Notes to the Logistics form
ticket_html = """                          {/* Flight / Tickets Section */}
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-slate-600 uppercase">Vé máy bay / Tàu xe</label>
                              <button type="button" onClick={() => setLogisticsForm({...logisticsForm, tickets: [...(logisticsForm.tickets||[]), {}]})} className="text-blue-600 text-[10px] font-bold hover:underline">
                                + Thêm vé
                              </button>
                            </div>
                            {(logisticsForm.tickets||[]).map((t: any, idx: number) => (
                              <div key={idx} className="p-2 rounded border border-blue-100 bg-white flex flex-col gap-2 relative">
                                <button type="button" onClick={() => setLogisticsForm({...logisticsForm, tickets: logisticsForm.tickets.filter((_:any, i:number) => i !== idx)})} className="absolute top-2 right-2 text-rose-500 hover:text-rose-700">
                                  <IconX size={14} />
                                </button>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <input type="text" placeholder="Hãng/Nhà xe" value={t.provider||""} onChange={(e) => {
                                    const arr = [...logisticsForm.tickets]; arr[idx].provider = e.target.value; setLogisticsForm({...logisticsForm, tickets: arr});
                                  }} className="px-2 py-1 border border-slate-300 rounded" />
                                  <input type="text" placeholder="Số hiệu/Chuyến" value={t.flightNo||""} onChange={(e) => {
                                    const arr = [...logisticsForm.tickets]; arr[idx].flightNo = e.target.value; setLogisticsForm({...logisticsForm, tickets: arr});
                                  }} className="px-2 py-1 border border-slate-300 rounded" />
                                  <input type="text" placeholder="Giờ khởi hành" value={t.departureTime||""} onChange={(e) => {
                                    const arr = [...logisticsForm.tickets]; arr[idx].departureTime = e.target.value; setLogisticsForm({...logisticsForm, tickets: arr});
                                  }} className="px-2 py-1 border border-slate-300 rounded" />
                                  <input type="text" placeholder="Mã đặt chỗ (PNR)" value={t.bookingRef||""} onChange={(e) => {
                                    const arr = [...logisticsForm.tickets]; arr[idx].bookingRef = e.target.value; setLogisticsForm({...logisticsForm, tickets: arr});
                                  }} className="px-2 py-1 border border-slate-300 rounded" />
                                  <input type="number" placeholder="Giá vé" value={t.cost||""} onChange={(e) => {
                                    const arr = [...logisticsForm.tickets]; arr[idx].cost = e.target.value; setLogisticsForm({...logisticsForm, tickets: arr});
                                  }} className="px-2 py-1 border border-slate-300 rounded col-span-2" />
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Notes */}
                          <div className="mt-4 space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Ghi chú hậu cần</label>
                            <textarea value={logisticsForm.notes||""} onChange={(e) => setLogisticsForm({...logisticsForm, notes: e.target.value})} className="w-full px-2 py-2 border border-slate-300 rounded text-xs" rows={2} placeholder="Ghi chú thêm cho người đi..."></textarea>
                          </div>"""

# Insert it before the End of the form, where it says "</div>" before "Lưu thông tin hậu cần" button
insert_point = """                          {selectedModalRecord.destinations && selectedModalRecord.destinations.length > 0 && (
                            <div className="mt-3 space-y-2">"""
# Wait, I can inject it after the accommodations section
content = content.replace(
    '                          {selectedModalRecord.destinations && selectedModalRecord.destinations.length > 0 && (',
    ticket_html + '\n                          {selectedModalRecord.destinations && selectedModalRecord.destinations.length > 0 && ('
)


# Add read-only view in the details (for Employee / Manager)
readonly_old = """                           <div className="col-span-2 sm:col-span-4 mt-1 pt-2 border-t border-slate-100">
                             <span className="text-slate-500 block mb-1">Lưu trú / Khách sạn:</span>
                             {logisticsForm.accommodations && logisticsForm.accommodations.length > 0 ? (
                                <ul className="mt-1 space-y-1 font-medium">
                                  {logisticsForm.accommodations.map((acc: any, i: number) => (
                                     <li key={i} className="flex items-start gap-1">
                                        <span className="text-blue-500">▪</span> 
                                        {acc.dorm_room_no ? `KTX Phòng ${acc.dorm_room_no}` : acc.hotel_name ? `${acc.hotel_name} (${Number(acc.cost||0).toLocaleString('vi-VN')}đ)` : "Không"}
                                     </li>
                                  ))}
                                </ul>
                             ) : <span className="font-bold text-slate-800">Không có hoặc chưa xếp</span>}
                           </div>"""

readonly_new = """                           <div className="col-span-2 sm:col-span-4 mt-1 pt-2 border-t border-slate-100">
                             <span className="text-slate-500 block mb-1">Lưu trú / Khách sạn:</span>
                             {logisticsForm.accommodations && logisticsForm.accommodations.length > 0 ? (
                                <ul className="mt-1 space-y-1 font-medium">
                                  {logisticsForm.accommodations.map((acc: any, i: number) => (
                                     <li key={i} className="flex flex-col items-start gap-0.5 border-b border-dashed border-slate-200 pb-1 last:border-0">
                                        {acc.dorm_room_no ? <span className="text-emerald-700">KTX Phòng {acc.dorm_room_no}</span> : acc.hotel_name ? 
                                          <div className="text-slate-700">
                                            <div className="font-bold">{acc.hotel_name}</div>
                                            <div className="text-xs">Mã Booking: <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">{acc.bookingRef||'N/A'}</span></div>
                                            <div className="text-xs text-rose-600">{Number(acc.cost||0).toLocaleString('vi-VN')} VND</div>
                                          </div> 
                                        : "Chưa xếp"}
                                     </li>
                                  ))}
                                </ul>
                             ) : <span className="font-bold text-slate-800 text-xs">Không</span>}
                           </div>
                           
                           <div className="col-span-2 sm:col-span-4 mt-1 pt-2 border-t border-slate-100">
                             <span className="text-slate-500 block mb-1">Vé di chuyển (Máy bay/Tàu/Xe):</span>
                             {logisticsForm.tickets && logisticsForm.tickets.length > 0 ? (
                                <ul className="mt-1 space-y-2 font-medium">
                                  {logisticsForm.tickets.map((t: any, i: number) => (
                                     <li key={i} className="flex flex-col bg-slate-50 p-2 rounded border border-slate-200">
                                        <div className="font-bold text-slate-800">{t.provider} - Chuyến {t.flightNo}</div>
                                        <div className="text-xs mt-1">Khởi hành: <span className="font-bold">{t.departureTime}</span></div>
                                        <div className="text-xs">Mã đặt chỗ (PNR): <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1 rounded">{t.bookingRef}</span></div>
                                        <div className="text-xs text-emerald-600 font-bold mt-0.5">{Number(t.cost||0).toLocaleString('vi-VN')} VND</div>
                                     </li>
                                  ))}
                                </ul>
                             ) : <span className="font-bold text-slate-800 text-xs">Không</span>}
                           </div>

                           {logisticsForm.notes && (
                             <div className="col-span-2 sm:col-span-4 mt-1 pt-2 border-t border-slate-100">
                               <span className="text-slate-500 block mb-1">Ghi chú hậu cần:</span>
                               <span className="font-medium text-slate-700 text-xs">{logisticsForm.notes}</span>
                             </div>
                           )}"""

content = content.replace(readonly_old, readonly_new)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched UI phase 2 (Logistics)")
