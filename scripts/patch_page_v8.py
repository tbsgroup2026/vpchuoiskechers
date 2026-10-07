import os

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

old_logistics_filter = """                {/* 4.5. Lọc Hậu cần (Lễ tân) */}
                {can(PERMISSIONS.TRIP_DISPATCH_VEHICLE) && (
                  <div className="w-full sm:w-40 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Lọc Hậu cần</label>
                    <select
                      value={logisticsFilter}
                      onChange={(e) => setLogisticsFilter(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-blue-600 bg-white cursor-pointer text-blue-800"
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="PENDING">Đang chờ Lễ tân</option>
                      <option value="ARRANGED">Đã sắp xếp</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>
                )}"""

new_filters = """                {/* 4.5. Lọc Hậu cần (Lễ tân) */}
                {can(PERMISSIONS.TRIP_DISPATCH_VEHICLE) && (
                  <div className="w-full sm:w-40 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Lọc Hậu cần</label>
                    <select
                      value={logisticsFilter}
                      onChange={(e) => setLogisticsFilter(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-blue-600 bg-white cursor-pointer text-blue-800"
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="PENDING">Đang chờ Lễ tân</option>
                      <option value="ARRANGED">Đã sắp xếp</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>
                )}

                {/* 4.6 Lọc Kế toán */}
                {isAccountant && (
                  <div className="w-full sm:w-40 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Lọc Kế toán</label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 font-bold outline-none focus:border-emerald-600 bg-emerald-50 cursor-pointer text-emerald-800 shadow-sm"
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="NOT_STARTED">Chưa nộp</option>
                      <option value="SUBMITTED">Chờ duyệt chi</option>
                      <option value="ACCOUNTING_REVIEW">Đang kiểm tra</option>
                      <option value="APPROVED_FOR_PAYMENT">Đã chốt (Chờ UNC)</option>
                      <option value="REJECTED_DOCS">Từ chối (Trả lại)</option>
                      <option value="PAID">Đã thanh toán</option>
                    </select>
                  </div>
                )}"""

content = content.replace(old_logistics_filter, new_filters)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched payment filter UI")
