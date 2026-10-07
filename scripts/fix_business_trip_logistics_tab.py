import os
import re

file_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Logistics Tab View right before </main>
logistics_tab_ui = """
        {/* ════════════════════════════════════════════════════════════════
            TAB 3: DANH SÁCH HẬU CẦN CHỜ XỬ LÝ (LỄ TÂN)
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "LOGISTICS" && (
          <div className="flex-1 overflow-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-blue-100 shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-blue-900 tracking-tight">🚗 ĐIỀU PHỐI HẬU CẦN (LỄ TÂN)</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Sắp xếp xe công ty và phòng nghỉ nội bộ cho CBNV đi công tác.</p>
                </div>
                <button onClick={fetchLogisticsRecords} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                  <IconRefresh size={16} /> Làm mới
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : logisticsRecords.filter(r => r.logisticsStatus === 'PENDING' || r.logisticsStatus === 'NOT_STARTED').length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
                   <div className="w-16 h-16 bg-blue-50 text-blue-400 flex items-center justify-center rounded-full mb-4">
                     <IconCheck size={32} />
                   </div>
                   <h3 className="text-lg font-black text-slate-700">Tuyệt vời! Không có đơn nào đang chờ.</h3>
                   <p className="text-sm text-slate-500 mt-2">Toàn bộ chuyến công tác đã được sắp xếp xong.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {logisticsRecords.filter(r => r.logisticsStatus === 'PENDING' || r.logisticsStatus === 'NOT_STARTED').map(trip => (
                    <div 
                      key={trip.id} 
                      onClick={() => setSelectedModalRecord({...trip, logistics: trip.logistics_json ? JSON.parse(trip.logistics_json) : null})}
                      className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col group"
                    >
                      <div className="flex justify-between items-start mb-3">
                         <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">{trip.code}</span>
                         <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-black uppercase">Chờ xử lý</span>
                      </div>
                      
                      <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-700 transition-colors">{trip.title}</h4>
                      
                      <div className="space-y-2 mt-auto">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                           <IconUser size={14} className="text-blue-500" />
                           <span className="font-semibold">{trip.creator} <span className="text-slate-400">({trip.department})</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                           <IconMapPin size={14} className="text-rose-500" />
                           <span className="font-semibold truncate">{trip.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                           <IconCalendar size={14} className="text-emerald-500" />
                           <span className="font-semibold">{trip.startDate} ➔ {trip.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                           <IconCar size={14} className="text-amber-500" />
                           <span className="font-semibold truncate">{trip.transport}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                         <button className="text-blue-600 font-bold text-xs flex items-center gap-1 group-hover:underline">
                           Xếp xe & Phòng <IconChevronRight size={14} />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
"""

if '{activeTab === "LOGISTICS" && (' not in content:
    content = content.replace("      </main>", logistics_tab_ui + "\n      </main>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Logistics Tab rendering!")
