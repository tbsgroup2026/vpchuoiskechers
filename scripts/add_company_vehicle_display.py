import os

file_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

company_vehicle_display = """
                       {selectedModalRecord.logistics?.companyVehicle && (
                         <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-100 mb-4">
                            <h5 className="text-[11px] font-black uppercase text-blue-800">Thông tin Xe Công Ty</h5>
                            <div className="flex flex-col p-2 bg-slate-50 rounded border border-slate-200 text-xs gap-1">
                               <div className="flex justify-between">
                                 <span className="font-bold text-slate-800">Tài xế: {selectedModalRecord.logistics.companyVehicle.driverName || 'Chưa có'}</span>
                                 <span className="font-bold text-blue-700">{selectedModalRecord.logistics.companyVehicle.licensePlate || ''}</span>
                               </div>
                               <span className="text-slate-600">SĐT: {selectedModalRecord.logistics.companyVehicle.driverPhone || 'Chưa có'}</span>
                               <span className="text-slate-600">Điểm & Giờ đón: {selectedModalRecord.logistics.companyVehicle.pickupTime || 'Chưa có'}</span>
                            </div>
                         </div>
                       )}
"""

if "Thông tin Xe Công Ty" not in content:
    content = content.replace(
        '<div className="space-y-4">\n                       <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-100">',
        '<div className="space-y-4">\n' + company_vehicle_display + '                       <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-100">'
    )
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added Company Vehicle display to modal!")
else:
    print("Company Vehicle already in modal display")
