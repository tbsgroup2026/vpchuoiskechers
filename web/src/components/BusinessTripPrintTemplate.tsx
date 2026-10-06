"use client";

import React from "react";
import { IconPrinter, IconX, IconCheck, IconQrCode } from "@tabler/icons-react";

interface BusinessTripPrintTemplateProps {
  record: any;
  onClose: () => void;
}

export default function BusinessTripPrintTemplate({ record, onClose }: BusinessTripPrintTemplateProps) {
  if (!record) return null;

  const handlePrint = () => {
    // Set document title to format GiayDiDuong_MaDon_TenNV.pdf when saving as PDF
    const safeCreator = (record.creator || "NhanVien").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    const safeCode = (record.code || "CT-2026").replace(/[\s/]/g, "_");
    const originalTitle = document.title;
    document.title = `GiayDiDuong_${safeCode}_${safeCreator}`;

    window.print();

    // Restore title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const participants = record.participants || [];
  const destinations = record.destinations && record.destinations.length > 0
    ? record.destinations
    : [
        {
          id: "dest_1",
          location: record.customDestinationName || record.location || "Điểm công tác",
          address: record.customDestinationAddress || record.address || "",
          accommodationType: "NONE",
        },
      ];

  const logistics = record.logistics || {};

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* CSS Styles for Print Dialog & Layout */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-travel-paper, #printable-travel-paper * {
            visibility: visible !important;
          }
          #printable-travel-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
          }
          .page-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Main Print Container Card */}
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (Screen only) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs">A4</span>
            <div>
              <h3 className="text-sm font-extrabold">Xem trước &amp; In Giấy Đi Đường</h3>
              <p className="text-[11px] text-slate-300">Mẫu A4 chuẩn ISO TBS Group | Tải PDF / In trực tiếp</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#006838] text-white font-extrabold text-xs hover:bg-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <IconPrinter size={16} />
              <span>🖨️ In / Tải PDF (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT AREA */}
        <div className="p-6 sm:p-10 overflow-y-auto font-['Be_Vietnam_Pro',sans-serif] text-slate-900 text-xs bg-white" id="printable-travel-paper">
          {/* Header Block */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-700">TẬP ĐOÀN TBS GROUP</div>
              <div className="text-sm font-black text-slate-900 uppercase">CÔNG TY CỔ PHẦN ĐẦU TƯ THÁI BÌNH</div>
              <div className="text-[10px] text-slate-600">VP Chuỗi Skechers - Hệ Thống Quản Lý Đi Đường ISO-2026</div>
            </div>

            <div className="text-center space-y-1">
              <div className="text-lg font-black tracking-tight text-slate-900 uppercase">GIẤY ĐI ĐƯỜNG</div>
              <div className="text-[11px] font-bold text-slate-600 italic">ROAD TRAVEL ORDER</div>
              <div className="text-xs font-mono font-extrabold text-[#006838]">Mã đơn: {record.code}</div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-300 bg-slate-50 min-w-[80px] text-center">
              <IconQrCode size={40} className="text-slate-800" />
              <span className="text-[9px] font-mono font-bold text-slate-600 mt-1">{record.code}</span>
            </div>
          </div>

          {/* Section 1: Cán bộ công tác */}
          <div className="space-y-2 mb-4">
            <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase text-[11px] border-l-4 border-[#006838] text-slate-900">
              I. THÔNG TIN CÁN BỘ ĐI CÔNG TÁC / PERSONNEL DETAILS
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-2 py-1">
              <div>
                <span className="font-semibold text-slate-600">Họ và tên cán bộ đề xuất:</span>{" "}
                <span className="font-extrabold text-slate-900">{record.creator}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Bộ phận / Phòng ban:</span>{" "}
                <span className="font-bold text-slate-900">{record.department || "Văn phòng"}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Chức vụ:</span>{" "}
                <span className="font-medium text-slate-900">Cán bộ công tác</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Mã số nhân viên:</span>{" "}
                <span className="font-mono font-bold text-slate-900">{record.departmentId || "TBS-EMP"}</span>
              </div>
            </div>

            {/* Danh sách người đi cùng */}
            {participants.length > 0 && (
              <div className="mt-2 space-y-1.5 px-2">
                <span className="font-bold text-[11px] text-slate-800 block">
                  Danh sách Cán bộ đi cùng ({participants.length} người):
                </span>
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold text-left">
                      <th className="border border-slate-300 p-1.5 text-center w-8">STT</th>
                      <th className="border border-slate-300 p-1.5">Họ và tên</th>
                      <th className="border border-slate-300 p-1.5">Chức vụ</th>
                      <th className="border border-slate-300 p-1.5">MSNV</th>
                      <th className="border border-slate-300 p-1.5">Bộ phận</th>
                      <th className="border border-slate-300 p-1.5">SĐT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p: any, idx: number) => (
                      <tr key={p.id || idx}>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 font-extrabold">{p.fullName}</td>
                        <td className="border border-slate-300 p-1.5">{p.position || "N/A"}</td>
                        <td className="border border-slate-300 p-1.5 font-mono">{p.employeeId || "N/A"}</td>
                        <td className="border border-slate-300 p-1.5">{p.department || "N/A"}</td>
                        <td className="border border-slate-300 p-1.5 font-mono">{p.phone || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Mục đích & Hậu cần di chuyển */}
          <div className="space-y-2 mb-4">
            <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase text-[11px] border-l-4 border-[#006838] text-slate-900">
              II. LỊCH TRÌNH &amp; HẬU CẦN DI CHUYỂN / TRIP PURPOSE &amp; LOGISTICS
            </div>

            <div className="space-y-1.5 px-2">
              <div>
                <span className="font-bold text-slate-700">🎯 Mục đích công tác:</span>{" "}
                <span className="font-medium text-slate-900">{record.purpose || "Công tác theo kế hoạch"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-slate-700">Thời gian công tác:</span>{" "}
                  <span className="font-extrabold text-slate-900">{record.startDate} - {record.endDate} ({record.daysCount} ngày)</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Hình thức di chuyển:</span>{" "}
                  <span className="font-bold text-slate-900">{record.transport || "Xe công ty"}</span>
                </div>
              </div>

              {/* Thông tin xe do Lễ tân xếp (nếu có) */}
              {(logistics.driver_name || logistics.license_plate) && (
                <div className="p-2.5 rounded-lg border border-slate-300 bg-emerald-50/40 text-[11px] space-y-1 mt-1">
                  <span className="font-bold text-[#006838] block uppercase text-[10px]">🚗 Thông tin phương tiện &amp; Tài xế do Lễ tân điều phối:</span>
                  <div className="grid grid-cols-4 gap-2 font-medium">
                    <div>Tài xế: <strong>{logistics.driver_name || "N/A"}</strong></div>
                    <div>SĐT: <strong>{logistics.driver_phone || "N/A"}</strong></div>
                    <div>Biển số xe: <strong>{logistics.license_plate || "N/A"}</strong></div>
                    <div>Giờ đón: <strong>{logistics.pickup_time || "N/A"}</strong></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Xác nhận của các đơn vị tiếp đón (Mỗi điểm đến 1 khung) */}
          <div className="space-y-3 mb-6">
            <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase text-[11px] border-l-4 border-[#006838] text-slate-900">
              III. XÁC NHẬN CỦA ĐƠN VỊ TIẾP ĐÓN TẠI ĐIỂM ĐẾN / DESTINATION CONFIRMATION
            </div>

            {destinations.map((dest: any, index: number) => {
              const destName = dest.location || record.customDestinationName || record.location || `Điểm công tác ${index + 1}`;
              const destAddr = dest.address || record.customDestinationAddress || record.address || "";
              
              return (
                <div key={dest.id || index} className="border border-slate-400 rounded-xl p-3 space-y-2 page-break-inside-avoid">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div>
                      <span className="font-black text-slate-900 text-xs">
                        {index + 1}. ĐIỂM ĐẾN: {destName}
                      </span>
                      {destAddr && <span className="text-[10px] text-slate-600 block">Địa chỉ: {destAddr}</span>}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 bg-slate-50">
                      {record.region === "Khác" ? "Địa điểm ngoài" : "Nhà máy nội bộ"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px] pt-1">
                    <div className="space-y-1">
                      <div>Ngày đến: ..... / ..... / 2026</div>
                      <div>Giờ đến: ..... : .....</div>
                      <div className="pt-2 text-[10px] text-slate-500 italic">Xác nhận ngày đến của Đơn vị tiếp đón:</div>
                      <div className="h-14 border border-dashed border-slate-300 rounded p-1 text-[9px] text-slate-400 flex items-center justify-center">
                        (Chữ ký &amp; Họ tên người tiếp nhận)
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div>Ngày đi: ..... / ..... / 2026</div>
                      <div>Giờ đi: ..... : .....</div>
                      <div className="pt-2 text-[10px] text-slate-500 italic">Đơn vị tiếp đón Ký tên &amp; Đóng dấu xác nhận:</div>
                      <div className="h-14 border border-dashed border-slate-300 rounded p-1 text-[9px] text-slate-400 flex items-center justify-center">
                        (Chữ ký, Đóng dấu tròn/vuông)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section 4: Chữ ký & Phê duyệt điện tử */}
          <div className="page-break-inside-avoid pt-2 border-t border-slate-300">
            <div className="grid grid-cols-3 gap-4 text-center">
              {/* Người đề xuất */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 uppercase text-[11px]">NGƯỜI ĐỀ XUẤT</div>
                <div className="text-[10px] text-slate-500 italic">(Ký, ghi rõ họ tên)</div>
                <div className="h-16 flex flex-col items-center justify-end pb-1 font-bold text-slate-900">
                  <div className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5">
                    <IconCheck size={12} /> Đã gửi điện tử
                  </div>
                  <div>{record.creator}</div>
                </div>
              </div>

              {/* Trưởng phòng duyệt Cấp 1 */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 uppercase text-[11px]">TRƯỞNG PHÒNG (CẤP 1)</div>
                <div className="text-[10px] text-slate-500 italic">(Duyệt lịch trình &amp; công tác)</div>
                <div className="h-16 flex flex-col items-center justify-end pb-1 font-bold text-slate-900">
                  {record.status === "APPROVED" || record.approvedLevel === "L1" || record.status === "PENDING_L2" ? (
                    <>
                      <div className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5">
                        <IconCheck size={12} /> Đã phê duyệt điện tử
                      </div>
                      <div className="text-[10px] text-slate-600">Trưởng phòng phụ trách</div>
                    </>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">Chưa duyệt</div>
                  )}
                </div>
              </div>

              {/* Ban Giám Đốc duyệt Cấp 2 (nếu có) */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 uppercase text-[11px]">BAN GIÁM ĐỐC (CẤP 2)</div>
                <div className="text-[10px] text-slate-500 italic">(Áp dụng đơn &ge; 5.000.000 VNĐ)</div>
                <div className="h-16 flex flex-col items-center justify-end pb-1 font-bold text-slate-900">
                  {record.status === "APPROVED" ? (
                    <>
                      <div className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5">
                        <IconCheck size={12} /> Đã phê duyệt BGĐ
                      </div>
                      <div className="text-[10px] text-slate-600">Ban Giám Đốc TBS</div>
                    </>
                  ) : (record.estimatedCost || 0) < 5000000 ? (
                    <div className="text-[10px] text-slate-500 italic">Tự qua Cấp 1 (&lt; 5 triệu)</div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">Chờ duyệt BGĐ</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-[9px] text-slate-500 flex items-center justify-between">
              <span>* Giấy đi đường được phát hành điện tử từ Hệ thống Quản lý Công tác TBS Group.</span>
              <span>Ngày in: {new Date().toLocaleDateString("vi-VN")} {new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
