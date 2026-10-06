"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function PrintQRPage() {
  const [url, setUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    // Generate the URL dynamically based on the current origin
    const fullUrl = `${window.location.origin}/book-room`;
    setUrl(fullUrl);
    
    QRCode.toDataURL(fullUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: "#006838",
        light: "#FFFFFF"
      }
    }).then(setQrDataUrl).catch(console.error);
  }, []);

  if (!url || !qrDataUrl) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 print:p-0 print:bg-white">
      {/* A4 Container */}
      <div className="bg-white w-[210mm] h-[297mm] shadow-2xl print:shadow-none flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Background Design */}
        <div className="absolute top-0 left-0 w-full h-40 bg-[#006838] skew-y-3 origin-top-left -mt-10" />
        <div className="absolute bottom-0 right-0 w-full h-40 bg-[#006838] -skew-y-3 origin-bottom-right -mb-10" />
        
        {/* Header */}
        <div className="z-10 text-center mb-12 mt-16">
          <h2 className="text-[#006838] font-black text-4xl mb-4 tracking-tight uppercase">Văn Phòng Chuỗi SKECHERS</h2>
          <div className="w-24 h-1.5 bg-[#006838] mx-auto rounded-full mb-4" />
          <h1 className="text-6xl font-black text-slate-900 uppercase">Đặt Phòng Họp</h1>
          <p className="text-xl font-bold text-slate-500 mt-4">Dành Cho Khách & Cán Bộ Nội Bộ</p>
        </div>

        {/* QR Code Container */}
        <div className="z-10 bg-white p-8 rounded-3xl shadow-xl border-4 border-[#006838] mb-12 relative">
          <div className="absolute -top-4 -left-4 w-8 h-8 border-t-8 border-l-8 border-[#006838]" />
          <div className="absolute -top-4 -right-4 w-8 h-8 border-t-8 border-r-8 border-[#006838]" />
          <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-8 border-l-8 border-[#006838]" />
          <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-8 border-r-8 border-[#006838]" />
          
          <img src={qrDataUrl} alt="QR Code" width={300} height={300} />
        </div>

        {/* Footer Instructions */}
        <div className="z-10 text-center max-w-lg">
          <h3 className="text-2xl font-black text-slate-800 mb-6">Hướng Dẫn Nhanh</h3>
          <div className="space-y-4 text-left font-bold text-slate-600 text-lg">
            <p className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#006838] text-white flex items-center justify-center flex-shrink-0">1</span>
              Mở Camera (Zalo, iPhone, v.v) quét mã QR.
            </p>
            <p className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#006838] text-white flex items-center justify-center flex-shrink-0">2</span>
              Chọn phòng trống và khung giờ muốn đặt.
            </p>
            <p className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#006838] text-white flex items-center justify-center flex-shrink-0">3</span>
              Lễ Tân sẽ duyệt và gửi kết quả về Zalo cho bạn.
            </p>
          </div>
        </div>
        
      </div>

      {/* Print Button (Hidden in print) */}
      <button 
        onClick={() => window.print()}
        className="fixed bottom-10 right-10 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl print:hidden flex items-center justify-center group"
        title="In Trang Này"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      </button>
    </div>
  );
}
