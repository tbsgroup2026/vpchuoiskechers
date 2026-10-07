import os

file_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

company_vehicle_display = """
                       {selectedModalRecord.logistics?.companyVehicle && (
                         <div className="space-y-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
                            <h5 className="text-[11px] font-black uppercase text-emerald-800">Thông tin Xe Công Ty (Đã xếp)</h5>
                            <div className="flex flex-col p-2 bg-white rounded border border-emerald-200 text-xs gap-1">
                               <div className="flex justify-between">
                                 <span className="font-bold text-slate-800">Tài xế: {selectedModalRecord.logistics.companyVehicle.driverName || 'Chưa có'}</span>
                                 <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">{selectedModalRecord.logistics.companyVehicle.licensePlate || ''}</span>
                               </div>
                               <span className="text-slate-600">SĐT: <a href={`tel:${selectedModalRecord.logistics.companyVehicle.driverPhone}`} className="text-blue-600 font-bold hover:underline">{selectedModalRecord.logistics.companyVehicle.driverPhone || 'Chưa có'}</a></span>
                               <span className="text-slate-600 font-medium text-emerald-800">Đón lúc: {selectedModalRecord.logistics.companyVehicle.pickupTime || 'Chưa có'}</span>
                            </div>
                         </div>
                       )}
"""

if "Thông tin Xe Công Ty (Đã xếp)" not in content:
    content = content.replace(
        '<div className="space-y-4">\n                       <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-100">',
        '<div className="space-y-4">\n' + company_vehicle_display + '                       <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-100">'
    )
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added Company Vehicle display to modal!")
else:
    print("Company Vehicle already in modal display")
