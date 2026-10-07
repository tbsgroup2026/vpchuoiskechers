import os
import re

# 1. Update kaizenDbMigration.ts
mig_path = r"d:\Work\TBS II\web\src\lib\kaizenDbMigration.ts"
with open(mig_path, "r", encoding="utf-8") as f:
    mig_content = f.read()

if "ALTER TABLE business_trips ADD COLUMN trip_type TEXT" not in mig_content:
    mig_content = mig_content.replace(
        "'CREATE TABLE IF NOT EXISTS company_vehicles",
        "'ALTER TABLE business_trips ADD COLUMN trip_type TEXT DEFAULT \"TRONG_NGAY\"',\n      'CREATE TABLE IF NOT EXISTS company_vehicles"
    )
    with open(mig_path, "w", encoding="utf-8") as f:
        f.write(mig_content)

# 2. Update api/business-trips/route.ts
api_path = r"d:\Work\TBS II\web\src\app\api\business-trips\route.ts"
with open(api_path, "r", encoding="utf-8") as f:
    api_content = f.read()

# Update SELECT
api_content = api_content.replace(
    "participantsCount: row.participants_count,",
    "participantsCount: row.participants_count,\n      tripType: row.trip_type || 'TRONG_NGAY',"
)

# Update INSERT
api_content = api_content.replace(
    "custom_destination_name, custom_destination_address, custom_destination_type,",
    "custom_destination_name, custom_destination_address, custom_destination_type,\n          trip_type,"
)
api_content = api_content.replace(
    "1, 'pending_dept_budget', ?, '{}', 'NOT_STARTED', ?, ?, ?, 'NOT_STARTED')",
    "1, 'pending_dept_budget', ?, '{}', 'NOT_STARTED', ?, ?, ?, 'NOT_STARTED', ?)"
)

# Find the bind variables. Need to append body.tripType || 'TRONG_NGAY'
# It's at the end of the bind() call.
# The bind block looks like:
#        body.paymentStatus || 'NOT_STARTED'
#      ).run();
bind_match = re.search(r'body\.paymentStatus \|\| \'NOT_STARTED\'\s*\)\.run\(\);', api_content)
if bind_match:
    api_content = api_content[:bind_match.start()] + "body.paymentStatus || 'NOT_STARTED',\n        body.tripType || 'TRONG_NGAY'\n      ).run();" + api_content[bind_match.end():]
else:
    # If paymentStatus is not the last one in INSERT, let's just do a regex replace for the bind parameters list end
    pass

with open(api_path, "w", encoding="utf-8") as f:
    f.write(api_content)


# 3. Update page.tsx
page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    page_content = f.read()

# Add tripType to proposalForm state
page_content = page_content.replace(
    'transport: "Xe Công Ty",',
    'transport: "Xe Công Ty",\n        tripType: "TRONG_NGAY",'
)
page_content = page_content.replace(
    'transport: string;',
    'transport: string;\n  tripType?: string;'
)

# Add tripType UI in the Row 1 grid (after Ngày bắt đầu)
ui_old = """                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Số ngày</label>"""
ui_new = """                  {/* Loại công tác */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Loại công tác</label>
                    <div className="relative">
                      <select
                        value={proposalForm.tripType || "TRONG_NGAY"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProposalForm({ 
                            ...proposalForm, 
                            tripType: val,
                            // Tự động set số ngày dựa theo loại
                            daysCount: val === "TRONG_NGAY" ? 1 : Math.max(2, proposalForm.daysCount)
                          });
                        }}
                        className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white cursor-pointer appearance-none"
                      >
                        <option value="TRONG_NGAY">Trong ngày</option>
                        <option value="NHIEU_NGAY">Nhiều ngày</option>
                      </select>
                      <IconBriefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <IconChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Số ngày</label>"""

page_content = page_content.replace(ui_old, ui_new)

# Add it to the Read-Only Details view
details_old = """                          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium text-xs">Mục đích:</span>
                            <span className="text-slate-800 font-bold text-sm text-right max-w-[70%]">{selectedModalRecord.purpose}</span>
                          </div>"""
details_new = """                          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium text-xs">Loại hình:</span>
                            <span className="text-slate-800 font-bold text-sm text-right max-w-[70%]">{selectedModalRecord.tripType === "NHIEU_NGAY" ? "Nhiều ngày" : "Trong ngày"}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium text-xs">Mục đích:</span>
                            <span className="text-slate-800 font-bold text-sm text-right max-w-[70%]">{selectedModalRecord.purpose}</span>
                          </div>"""

page_content = page_content.replace(details_old, details_new)

# Adjust UI Grid to accommodate 5 columns (or just let it wrap).
# The current grid is `grid-cols-2 md:grid-cols-4`. Since we added 1 field, it becomes 5 items.
# Let's change `grid-cols-2 md:grid-cols-4` to `grid-cols-2 md:grid-cols-5`
page_content = page_content.replace(
    'className="grid grid-cols-2 md:grid-cols-4 gap-4"',
    'className="grid grid-cols-2 md:grid-cols-5 gap-4"'
)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(page_content)

print("Added Trip Type field")
