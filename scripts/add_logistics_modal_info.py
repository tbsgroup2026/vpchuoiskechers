import re
import os

file_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

logistics_ui = """
                {/* ════════════════════════════════════════════════════════════════
                    THÔNG TIN HẬU CẦN (LỄ TÂN XẾP XE / PHÒNG / VÉ)
                   ════════════════════════════════════════════════════════════════ */}
                {activeTab === "LOGISTICS" && (
                  <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 border border-blue-200 mt-4">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                       <span className="font-black text-blue-900 uppercase text-xs">🚗 Xử lý điều phối hậu cần</span>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-100">
                          <h5 className="text-[11px] font-black uppercase text-blue-800">1. Lưu trú & Khách sạn</h5>
                          {selectedModalRecord.logistics?.accommodations && selectedModalRecord.logistics.accommodations.length > 0 ? (
                            <div className="space-y-2">
                              {selectedModalRecord.logistics.accommodations.map((acc: any, i: number) => (
                                <div key={i} className="flex flex-col p-2 bg-slate-50 rounded border border-slate-200 text-xs gap-1">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-slate-800">{acc.type === 'COMPANY_DORM' ? 'Ký túc xá CT' : 'Khách sạn / Nhà nghỉ'}</span>
                                    <span className="font-bold text-blue-700">{acc.cost ? Number(acc.cost).toLocaleString('vi-VN') + ' VND' : ''}</span>
                                  </div>
                                  <span className="text-slate-600">Tên/Phòng: {acc.provider} {acc.roomNo ? `(P. ${acc.roomNo})` : ''}</span>
                                  {acc.bookingRef && <span className="text-slate-600">Mã Booking: {acc.bookingRef}</span>}
                                  {acc.notes && <span className="text-slate-500 italic">{acc.notes}</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic">Chưa bố trí lưu trú.</div>
                          )}
                       </div>

                       <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-100">
                          <h5 className="text-[11px] font-black uppercase text-blue-800">2. Phương tiện (Vé máy bay/Tàu/Xe)</h5>
                          {selectedModalRecord.logistics?.tickets && selectedModalRecord.logistics.tickets.length > 0 ? (
                            <div className="space-y-2">
                              {selectedModalRecord.logistics.tickets.map((t: any, i: number) => (
                                <div key={i} className="flex flex-col p-2 bg-slate-50 rounded border border-slate-200 text-xs gap-1">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-slate-800">{t.provider} {t.flightNo ? `(${t.flightNo})` : ''}</span>
                                    <span className="font-bold text-blue-700">{t.cost ? Number(t.cost).toLocaleString('vi-VN') + ' VND' : ''}</span>
                                  </div>
                                  <span className="text-slate-600">Thời gian đi: {t.departureTime}</span>
                                  {t.bookingRef && <span className="text-slate-600">Mã vé/PNR: {t.bookingRef}</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic">Chưa đặt vé.</div>
                          )}
                       </div>

                       {selectedModalRecord.logistics?.notes && (
                         <div className="space-y-1 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs">
                           <span className="font-black text-amber-800 uppercase text-[10px]">Ghi chú cho người đi:</span>
                           <p className="text-amber-900 font-medium">{selectedModalRecord.logistics.notes}</p>
                         </div>
                       )}
                       
                       <div className="pt-2">
                          <button 
                             onClick={() => alert('Vui lòng vào màn hình Cập nhật hậu cần chi tiết (Đang phát triển)')}
                             className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-colors"
                          >
                             CẬP NHẬT MÃ BOOKING / CHI PHÍ
                          </button>
                       </div>
                    </div>
                  </div>
                )}
"""

target = """                <div className="flex items-center justify-between pt-2 border-t border-slate-100">"""

if "THÔNG TIN HẬU CẦN (LỄ TÂN" not in content:
    content = content.replace(target, logistics_ui + "\n" + target)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added Logistics info to modal!")
else:
    print("Logistics info already in modal!")
