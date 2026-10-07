import re

file_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states
states_injection = """
  // Logistics Fleet Management States
  const [logisticsSubTab, setLogisticsSubTab] = useState<"TRIPS" | "FLEET">("TRIPS");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleModal, setVehicleModal] = useState<any>(null);

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/company-vehicles");
      const data = await res.json();
      if (data.success) setVehicles(data.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === "LOGISTICS" && logisticsSubTab === "FLEET") fetchVehicles();
  }, [activeTab, logisticsSubTab]);

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await fetch("/api/company-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...vehicleModal, action: "UPSERT" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Đã lưu thông tin xe");
        setVehicleModal(null);
        fetchVehicles();
      } else {
        showToast(`Lỗi: ${data.error}`);
      }
    } catch (e) {
      showToast("Lỗi mạng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCarArrived = async (vehicle: any) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/company-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vehicle.id, plateNumber: vehicle.plateNumber, driverName: vehicle.driverName, action: "ARRIVED" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Đã báo xe tới và gửi Zalo!");
        fetchVehicles();
      } else {
        showToast(`Lỗi: ${data.error}`);
      }
    } catch (e) {
      showToast("Lỗi mạng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Xóa xe này?")) return;
    try {
      const res = await fetch("/api/company-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "DELETE" }),
      });
      if (res.ok) {
         showToast("Đã xóa");
         fetchVehicles();
      }
    } catch (e) {}
  };
"""
content = content.replace('const [logisticsFilterAccom, setLogisticsFilterAccom] = useState<string>("ALL");', 'const [logisticsFilterAccom, setLogisticsFilterAccom] = useState<string>("ALL");\n' + states_injection)


# 2. Modify Logistics UI to support sub-tabs
old_header = """              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-blue-100 shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-blue-900 tracking-tight">🚗 ĐIỀU PHỐI HẬU CẦN (LỄ TÂN)</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Sắp xếp xe công ty và phòng nghỉ nội bộ cho CBNV đi công tác.</p>
                </div>"""

new_header = """              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-blue-100 shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-blue-900 tracking-tight flex items-center gap-2">
                    🚗 HẬU CẦN
                    <div className="flex bg-slate-100 p-1 rounded-xl ml-2">
                      <button 
                        onClick={() => setLogisticsSubTab("TRIPS")} 
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${logisticsSubTab === "TRIPS" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        ĐIỀU PHỐI ĐƠN
                      </button>
                      <button 
                        onClick={() => setLogisticsSubTab("FLEET")} 
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${logisticsSubTab === "FLEET" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        QUẢN LÝ ĐỘI XE
                      </button>
                    </div>
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Quản lý xe công ty và sắp xếp phòng nghỉ.</p>
                </div>"""
content = content.replace(old_header, new_header)


# 3. Separate the TRIPS view and add FLEET view
old_body = """                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                  <select 
                    value={logisticsFilterStatus}"""

new_body = """                {logisticsSubTab === "TRIPS" ? (
                  <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <select 
                      value={logisticsFilterStatus}"""
content = content.replace(old_body, new_body)

# Close TRIPS view and add FLEET view
old_tail = """                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
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
        )}"""

new_tail = """                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                         <button className="text-blue-600 font-bold text-xs flex items-center gap-1 group-hover:underline">
                           Xếp xe & Phòng <IconChevronRight size={14} />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* QUẢN LÝ ĐỘI XE */}
              {logisticsSubTab === "FLEET" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button onClick={() => setVehicleModal({})} className="px-4 py-2 bg-[#006838] text-white rounded-xl font-bold text-sm shadow flex items-center gap-2">
                      <IconPlus size={16} /> Thêm Xe
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((v) => (
                      <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono font-black text-lg text-slate-800">{v.plateNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : 
                            v.status === "ON_TRIP" ? "bg-blue-100 text-blue-700" : 
                            v.status === "MAINTENANCE" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                          }`}>
                            {v.status === "AVAILABLE" ? "Rảnh" : v.status === "ON_TRIP" ? "Đi Công Tác" : v.status === "MAINTENANCE" ? "Bảo Dưỡng" : "Nghỉ Phép"}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-700 mb-1">Tài xế: {v.driverName}</div>
                        <div className="text-xs text-slate-500 mb-1">SĐT: {v.driverPhone} | Chỗ: {v.seatCount}</div>
                        <div className="text-xs text-slate-500 mb-3 truncate">Ghi chú: {v.notes || "---"}</div>
                        
                        <div className="mt-auto pt-3 border-t border-slate-100 flex gap-2 justify-between">
                          <button onClick={() => handleCarArrived(v)} className="flex-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                            <IconBell size={14} /> Báo Xe Tới (Zalo)
                          </button>
                          <button onClick={() => setVehicleModal(v)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition">
                            <IconEdit size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* MODAL THÊM/SỬA XE */}
        {vehicleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setVehicleModal(null)}></div>
            <div className="bg-white rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-black text-slate-800">{vehicleModal.id ? "Sửa Xe" : "Thêm Xe Mới"}</h3>
                <button onClick={() => setVehicleModal(null)} className="text-slate-400 hover:text-slate-600"><IconX size={24} /></button>
              </div>
              <form onSubmit={handleSaveVehicle} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Biển số</label>
                  <input required type="text" value={vehicleModal.plateNumber || ""} onChange={e => setVehicleModal({...vehicleModal, plateNumber: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tài xế</label>
                  <input required type="text" value={vehicleModal.driverName || ""} onChange={e => setVehicleModal({...vehicleModal, driverName: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">SĐT</label>
                    <input type="text" value={vehicleModal.driverPhone || ""} onChange={e => setVehicleModal({...vehicleModal, driverPhone: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Số chỗ</label>
                    <input type="number" value={vehicleModal.seatCount || 4} onChange={e => setVehicleModal({...vehicleModal, seatCount: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Trạng thái</label>
                  <select value={vehicleModal.status || "AVAILABLE"} onChange={e => setVehicleModal({...vehicleModal, status: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-300">
                    <option value="AVAILABLE">Đang rảnh</option>
                    <option value="ON_TRIP">Đi công tác</option>
                    <option value="MAINTENANCE">Bảo dưỡng</option>
                    <option value="LEAVE">Nghỉ phép</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Ghi chú (Đi xa mấy ngày...)</label>
                  <input type="text" value={vehicleModal.notes || ""} onChange={e => setVehicleModal({...vehicleModal, notes: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div className="flex gap-3 pt-3">
                  {vehicleModal.id && (
                    <button type="button" onClick={() => handleDeleteVehicle(vehicleModal.id)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold flex-1">Xóa</button>
                  )}
                  <button type="submit" className="px-4 py-2 bg-[#006838] text-white rounded-xl font-bold flex-[2]">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        )}"""

content = content.replace(old_tail, new_tail)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Quản lý đội xe UI")
