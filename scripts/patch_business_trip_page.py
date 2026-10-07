import re

file_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import PERMISSIONS if not present
if "import { PERMISSIONS } from" not in content:
    content = content.replace('import { usePermission } from "@/hooks/usePermission";', 
                              'import { usePermission } from "@/hooks/usePermission";\nimport { PERMISSIONS } from "@/lib/permissions";')

# 2. Add LOGISTICS to activeTab type
content = content.replace('useState<"FORM" | "LIST">("FORM");', 'useState<"FORM" | "LIST" | "LOGISTICS">("FORM");')

# 3. Add logisticsRecords state and fetch function
state_addition = """  const [logisticsRecords, setLogisticsRecords] = useState<BusinessTripRecord[]>([]);

  // Fetch Logistics Records securely
  const fetchLogisticsRecords = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/business-trips/logistics");
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        const d1Records: BusinessTripRecord[] = result.data.map((item: any) => {
          let parsedAttachments: any[] = [];
          if (item.attachments_json) { try { parsedAttachments = JSON.parse(item.attachments_json); } catch(e) {} }
          let parsedInvoices: any[] = [];
          if (item.invoices_json) { try { parsedInvoices = JSON.parse(item.invoices_json); } catch(e) {} }
          let parsedParticipants: any[] = [];
          if (item.participants_json) { try { parsedParticipants = JSON.parse(item.participants_json); } catch(e) {} }

          return {
            id: item.id,
            code: item.code,
            title: item.title,
            region: item.region,
            factory: item.factory || "",
            creator: item.creator,
            department: item.department,
            departmentId: item.departmentId,
            location: item.location,
            startDate: item.startDate,
            endDate: item.endDate,
            daysCount: item.daysCount,
            transport: item.transport,
            participantsCount: item.participantsCount,
            purpose: item.purpose,
            address: item.address,
            proposalText: item.proposalText,
            status: item.status,
            logisticsStatus: item.logisticsStatus,
            logistics: item.logistics_json ? JSON.parse(item.logistics_json) : null,
            estimatedCost: item.estimatedCost,
            version: item.version,
            approvedLevel: item.approvedLevel,
            rejectedLevel: item.rejectedLevel,
            rejectionReason: item.rejectionReason,
            budgetStatus: item.budgetStatus,
            budgetAmount: item.budgetAmount,
            paymentStatus: item.paymentStatus,
            paymentNotes: item.paymentNotes,
            createdAt: item.createdAt,
            attachments: parsedAttachments,
            invoices: parsedInvoices,
            participantsJson: item.participants_json, // Need string for modal rendering
            attachmentsJson: item.attachments_json,
          };
        });
        setLogisticsRecords(d1Records);
      }
    } catch (err) {
      console.error("Failed to fetch logistics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "LOGISTICS") {
      fetchLogisticsRecords();
    }
  }, [activeTab]);

  // Handle URL params for notifications
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      const tripId = urlParams.get('id');
      
      if (tab === 'LOGISTICS' && can(PERMISSIONS.TRIP_DISPATCH_VEHICLE)) {
        setActiveTab("LOGISTICS");
        if (tripId) {
          // Attempt to open the specific trip
          const checkAndOpen = async () => {
             const res = await fetch("/api/business-trips/logistics");
             const result = await res.json();
             if (result.success && result.data) {
                const target = result.data.find((t: any) => t.id === tripId);
                if (target) {
                   setSelectedModalRecord({...target, logistics: target.logistics_json ? JSON.parse(target.logistics_json) : null});
                }
             }
          };
          checkAndOpen();
        }
      }
    }
  }, []);
"""
content = content.replace('  const [logisticsForm, setLogisticsForm] = useState<any>({});', '  const [logisticsForm, setLogisticsForm] = useState<any>({});\n' + state_addition)

# 4. Replace roles.includes("LE_TAN")
content = content.replace('roles.includes("LE_TAN")', 'can(PERMISSIONS.TRIP_DISPATCH_VEHICLE)')

# 5. Add Tab UI
tab_buttons_regex = r'<div className="flex bg-slate-200\/60 p-1 rounded-2xl w-fit">.*?</div>'
# We'll just find the exact tab buttons block and replace it.
# Wait, it's easier to find activeTab === "FORM" and insert the button before it.
tab_button_html = """
            <button
              onClick={() => setActiveTab("FORM")}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activeTab === "FORM"
                  ? "bg-white text-[#006838] shadow-md shadow-slate-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <IconPlus size={18} className={activeTab === "FORM" ? "opacity-100" : "opacity-50"} />
              <span className="hidden sm:inline">Nhập liệu</span>
            </button>
            <button
              onClick={() => setActiveTab("LIST")}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activeTab === "LIST"
                  ? "bg-white text-[#006838] shadow-md shadow-slate-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <IconList size={18} className={activeTab === "LIST" ? "opacity-100" : "opacity-50"} />
              <span className="hidden sm:inline">Xem dữ liệu</span>
              
              {/* Badge for PENDING trips */}
              {records.filter(r => r.status === "PENDING" || r.status === "PENDING_L2").length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {records.filter(r => r.status === "PENDING" || r.status === "PENDING_L2").length}
                </span>
              )}
            </button>

            {/* XỬ LÝ HẬU CẦN (LỄ TÂN) */}
            {can(PERMISSIONS.TRIP_DISPATCH_VEHICLE) && (
              <button
                onClick={() => setActiveTab("LOGISTICS")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === "LOGISTICS"
                    ? "bg-white text-blue-700 shadow-md shadow-slate-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <IconCar size={18} className={activeTab === "LOGISTICS" ? "opacity-100" : "opacity-50"} />
                <span className="hidden sm:inline">🚗 Xử lý hậu cần</span>
                {logisticsRecords.filter(r => r.logisticsStatus === "PENDING" || r.logisticsStatus === "NOT_STARTED").length > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {logisticsRecords.filter(r => r.logisticsStatus === "PENDING" || r.logisticsStatus === "NOT_STARTED").length}
                  </span>
                )}
              </button>
            )}
"""
content = re.sub(
    r'<button\s*onClick=\{\(\) => setActiveTab\("FORM"\)\}.*?</button>\s*<button\s*onClick=\{\(\) => setActiveTab\("LIST"\)\}.*?</button>', 
    tab_button_html, 
    content, 
    flags=re.DOTALL
)

# 6. Add Logistics Tab View right after the LIST view
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
                      onClick={() => setSelectedModalRecord(trip)}
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

content = content.replace('{/* ════════════════════════════════════════════════════════════════\n          NEW FORM VIEW (TAB 1: FORM)', logistics_tab_ui + '\n        {/* ════════════════════════════════════════════════════════════════\n          NEW FORM VIEW (TAB 1: FORM)')

# 7. Add IconRefresh import if missing
if "IconRefresh" not in content:
    content = content.replace('IconChevronRight,', 'IconChevronRight,\n  IconRefresh,')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched page.tsx successfully!")
