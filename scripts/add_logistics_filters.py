import re

file_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states for logistics filters
filter_states = """  const [logisticsFilterStatus, setLogisticsFilterStatus] = useState<string>("PENDING");
  const [logisticsFilterTransport, setLogisticsFilterTransport] = useState<string>("ALL");
  const [logisticsFilterAccom, setLogisticsFilterAccom] = useState<string>("ALL");

  const filteredLogisticsRecords = logisticsRecords.filter(r => {
    // Status filter
    if (logisticsFilterStatus !== "ALL") {
       if (logisticsFilterStatus === "PENDING" && r.logisticsStatus !== "PENDING" && r.logisticsStatus !== "NOT_STARTED") return false;
       if (logisticsFilterStatus !== "PENDING" && r.logisticsStatus !== logisticsFilterStatus) return false;
    }
    // Transport filter
    if (logisticsFilterTransport !== "ALL") {
       if (logisticsFilterTransport === "COMPANY" && r.transport !== "Xe Công Ty") return false;
       if (logisticsFilterTransport === "SELF" && r.transport !== "Tự Túc") return false;
       if (logisticsFilterTransport === "OTHER" && r.transport === "Xe Công Ty" && r.transport === "Tự Túc") return false;
    }
    return true;
  });
"""

content = content.replace('const [logisticsRecords, setLogisticsRecords] = useState<BusinessTripRecord[]>([]);', 'const [logisticsRecords, setLogisticsRecords] = useState<BusinessTripRecord[]>([]);\n' + filter_states)

# 2. Add Filter UI and use filteredLogisticsRecords
old_ui = """              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-blue-100 shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-blue-900 tracking-tight">🚗 ĐIỀU PHỐI HẬU CẦN (LỄ TÂN)</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Sắp xếp xe công ty và phòng nghỉ nội bộ cho CBNV đi công tác.</p>
                </div>
                <button onClick={fetchLogisticsRecords} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                  <IconRefresh size={16} /> Làm mới
                </button>
              </div>"""

new_ui = """              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-blue-100 shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-blue-900 tracking-tight">🚗 ĐIỀU PHỐI HẬU CẦN (LỄ TÂN)</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Sắp xếp xe công ty và phòng nghỉ nội bộ cho CBNV đi công tác.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                  <select 
                    value={logisticsFilterStatus} 
                    onChange={e => setLogisticsFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 min-w-[120px]"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ sắp xếp</option>
                    <option value="ARRANGED">Đã sắp xếp</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>

                  <select 
                    value={logisticsFilterTransport} 
                    onChange={e => setLogisticsFilterTransport(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 min-w-[120px]"
                  >
                    <option value="ALL">Mọi phương tiện</option>
                    <option value="COMPANY">Xe Công Ty</option>
                    <option value="SELF">Tự Túc</option>
                  </select>

                  <button onClick={fetchLogisticsRecords} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors flex items-center gap-2 cursor-pointer shadow-sm whitespace-nowrap">
                    <IconRefresh size={16} /> Làm mới
                  </button>
                </div>
              </div>"""

content = content.replace(old_ui, new_ui)

content = content.replace('logisticsRecords.filter(r => r.logisticsStatus === \'PENDING\' || r.logisticsStatus === \'NOT_STARTED\').length === 0', 'filteredLogisticsRecords.length === 0')
content = content.replace('logisticsRecords.filter(r => r.logisticsStatus === \'PENDING\' || r.logisticsStatus === \'NOT_STARTED\').map(trip => (', 'filteredLogisticsRecords.map(trip => (')

# Also fix the notification link string literal issue if present
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Logistics Filters")
