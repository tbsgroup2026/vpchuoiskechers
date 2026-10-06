"use client";

import React, { useState, useEffect } from "react";

export default function PublicBookingPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    roomId: '',
    roomName: '',
    timeSlot: '',
    userName: '',
    empCode: '',
    department: '',
    zaloPhone: '',
    title: '',
    notes: '',
    participantsCount: 5,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [bookingId, setBookingId] = useState("");

  const timeSlots = [
    "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
    "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00",
  ];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/public/rooms");
      const data = await res.json();
      if (data.success) {
        setRooms(data.data.rooms || []);
        setBusySlots(data.data.busySlots || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const isSlotBusy = (roomId: string, date: string, slot: string) => {
    return busySlots.some(b => b.roomId === roomId && b.date === date && b.timeSlot === slot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!formData.roomId || !formData.timeSlot) {
      setErrorMsg("Vui lòng chọn phòng và khung giờ.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/rooms/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setBookingId(data.bookingId);
      } else {
        setErrorMsg(data.error || "Có lỗi xảy ra khi gửi đơn.");
      }
    } catch (err: any) {
      setErrorMsg("Lỗi mạng, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p>Đang tải dữ liệu phòng...</p></div>;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
          <h2 className="text-2xl font-black text-slate-800">Gửi đơn thành công!</h2>
          <p className="text-slate-600 text-sm">
            Mã đơn của bạn: <strong className="text-slate-800">{bookingId}</strong>
          </p>
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium mt-4">
            Đơn của bạn đang chờ Hành chính/Lễ tân duyệt. Kết quả sẽ được gửi qua Zalo theo số điện thoại bạn cung cấp.
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors"
          >
            Đặt thêm phòng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="bg-blue-600 text-white p-4 pb-12 rounded-b-[2rem] shadow-md">
        <h1 className="text-xl font-black text-center mt-2">Đặt Phòng Họp</h1>
        <p className="text-center text-blue-100 text-sm mt-1">Dành cho Cán bộ & Khách nội bộ</p>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-5 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b pb-2">1. Thông tin người đặt</h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 outline-none" placeholder="VD: Nguyễn Văn A" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">SĐT (Zalo) <span className="text-red-500">*</span></label>
                <input required type="tel" value={formData.zaloPhone} onChange={e => setFormData({...formData, zaloPhone: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 outline-none" placeholder="Nhận thông báo" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bộ phận / Đơn vị</label>
                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 outline-none" placeholder="Tùy chọn" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b pb-2">2. Thông tin cuộc họp</h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nội dung họp <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 outline-none" placeholder="VD: Họp dự án..." />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Ngày đặt <span className="text-red-500">*</span></label>
              <input required type="date" min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value, roomId: '', timeSlot: ''})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Phòng & Khung giờ <span className="text-red-500">*</span></label>
              <div className="space-y-3">
                {rooms.map(room => (
                  <div key={room.id} className={`border rounded-2xl p-3 transition-colors ${formData.roomId === room.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-slate-800">{room.name}</div>
                      <div className="text-xs text-slate-500">{room.capacity} chỗ</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map(slot => {
                        const busy = isSlotBusy(room.id, formData.date, slot);
                        const selected = formData.roomId === room.id && formData.timeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={busy}
                            onClick={() => setFormData({...formData, roomId: room.id, roomName: room.name, timeSlot: slot})}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              busy ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through' :
                              selected ? 'bg-blue-600 text-white shadow-md' :
                              'bg-white border border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && <p className="text-sm text-slate-500 italic">Không có phòng trống.</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Ghi chú thêm</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 outline-none" placeholder="VD: Cần máy chiếu, nước uống..." />
            </div>
          </div>

          {/* Cloudflare Turnstile Placeholder */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-center text-xs text-slate-400">
            [Cloudflare Turnstile Widget (Chờ cấu hình Site Key)]
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang gửi..." : "GỬI YÊU CẦU ĐẶT PHÒNG"}
          </button>
        </form>
      </div>
    </div>
  );
}
