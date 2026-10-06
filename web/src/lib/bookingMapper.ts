export interface NormalizedBooking {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  bookerName: string;
  department: string;
  bookingDate: string; // Formatted DD/MM/YYYY
  timeSlot: string;    // HH:mm - HH:mm
  attendeesCount: number;
  notes: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'APPROVING';
  meetingType: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  createdAt: string;
  proposedTimeSlot?: string;
  proposedRoomId?: string;
  proposedRoomName?: string;
  proposalNote?: string;
}

/**
 * Remove obsolete receptionist status tags from notes
 */
export function cleanNotes(notes?: string | null): string {
  if (!notes) return '';
  return notes
    .replace(/\[APPROVED_BY_RECEPTIONIST[^\]]*\]/gi, '')
    .replace(/\[STATUS_[^\]]*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format date consistently to DD/MM/YYYY (Asia/Ho_Chi_Minh timezone aware)
 */
export function formatBookingDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  // Handle ISO format YYYY-MM-DD or YYYY-MM-DDT...
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split('T')[0].split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  // Handle DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, yyyy] = trimmed.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${yyyy}`;
  }
  return trimmed;
}

/**
 * Resolve room name by roomId from known rooms list or fallback
 */
export function resolveRoomName(roomId?: string | null, roomName?: string | null, roomsList?: Array<{ id: string; name: string }>): string {
  if (!roomId || !roomId.trim()) {
    return 'Chưa xếp phòng';
  }
  if (roomsList && roomsList.length > 0) {
    const matched = roomsList.find((r) => r.id === roomId);
    if (matched) return matched.name;
    console.warn(`[resolveRoomName] Warning: Room ID '${roomId}' not found in available rooms list.`);
    return roomName || 'Phòng không tồn tại';
  }
  return roomName || 'Phòng không tồn tại';
}

/**
 * Core canonical mapper function to normalize any booking object from D1 DB or API payload
 */
export function normalizeRoomBooking(raw: any, roomsList?: Array<{ id: string; name: string }>): NormalizedBooking {
  if (!raw) {
    return {
      id: '',
      roomId: '',
      roomName: 'Chưa xếp phòng',
      title: 'Cuộc họp',
      bookerName: 'Cán bộ',
      department: 'Văn phòng',
      bookingDate: '',
      timeSlot: '',
      attendeesCount: 5,
      notes: '',
      status: 'PENDING',
      meetingType: 'OFFLINE',
      createdAt: '',
    };
  }

  const roomId = String(raw.roomId || raw.room_id || '').trim();
  const rawRoomName = String(raw.roomName || raw.room_name || '').trim();
  const roomName = resolveRoomName(roomId, rawRoomName, roomsList);

  const rawNotes = String(raw.notes || raw.purpose || '');
  let status = String(raw.status || 'PENDING').toUpperCase();

  // If notes contain obsolete approved tag and status is still PENDING, infer CONFIRMED
  if (rawNotes.includes('APPROVED_BY_RECEPTIONIST') && status === 'PENDING') {
    status = 'CONFIRMED';
  }

  const cleanedNotes = cleanNotes(rawNotes);
  const bookingDate = formatBookingDate(raw.bookingDate || raw.booking_date || raw.meeting_date || raw.meetingDate);
  
  let timeSlot = String(raw.timeSlot || raw.time_slot || '').trim();
  if (!timeSlot && (raw.startTime || raw.start_time)) {
    const start = raw.startTime || raw.start_time;
    const end = raw.endTime || raw.end_time || '';
    timeSlot = end ? `${start} - ${end}` : start;
  }

  return {
    id: String(raw.id || ''),
    roomId,
    roomName,
    title: String(raw.title || raw.purpose || 'Cuộc họp'),
    bookerName: String(raw.bookerName || raw.booker_name || raw.user_name || raw.userName || 'Cán bộ'),
    department: String(raw.department || 'Văn phòng'),
    bookingDate,
    timeSlot,
    attendeesCount: Number(raw.attendeesCount || raw.attendees_count || raw.participants_count || 5),
    notes: cleanedNotes,
    status: status as any,
    meetingType: (raw.meetingType || raw.meeting_type || 'OFFLINE').toUpperCase() as any,
    createdAt: String(raw.createdAt || raw.created_at || ''),
    proposedTimeSlot: raw.proposedTimeSlot || raw.proposed_time_slot,
    proposedRoomId: raw.proposedRoomId || raw.proposed_room_id,
    proposedRoomName: raw.proposedRoomName || raw.proposed_room_name,
    proposalNote: raw.proposalNote || raw.proposal_note,
  };
}

/**
 * Build Zalo Notification text from normalized booking object
 */
export function buildZaloBookingMessage(
  eventType: 'CREATED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'ROOM_CHANGED',
  booking: NormalizedBooking,
  extraReason?: string
): { isValid: boolean; messageText?: string; errorDetail?: string } {
  if (!booking.bookingDate || !booking.timeSlot) {
    return {
      isValid: false,
      errorDetail: `[ZaloNotification] Không thể gửi tin: Bản ghi họp (ID: ${booking.id}) thiếu Ngày (${booking.bookingDate || 'Rỗng'}) hoặc Khung giờ (${booking.timeSlot || 'Rỗng'})`,
    };
  }

  let text = '';
  if (eventType === 'CREATED') {
    text = `🏢 CÓ ĐƠN ĐĂNG KÝ PHÒNG HỌP MỚI (CHỜ LỄ TÂN DUYỆT)\nCuộc họp: "${booking.title}"\nPhòng đề xuất: ${booking.roomName}\nNgày: ${booking.bookingDate}\nKhung giờ: ${booking.timeSlot}\nĐăng ký bởi: ${booking.bookerName} (${booking.department})\n👥 Tham dự: ${booking.attendeesCount} người\n🔗 Lễ Tân mở ứng dụng để duyệt: https://vpchuoiskechers.tbsgroup2026.workers.dev/rooms`;
  } else if (eventType === 'CONFIRMED') {
    text = `🎉 LỊCH HỌP ĐÃ ĐƯỢC PHÊ DUYỆT & XẾP PHÒNG CHÍNH THỨC\nCuộc họp: "${booking.title}"\nPhòng họp: ${booking.roomName}\nNgày: ${booking.bookingDate}\nKhung giờ: ${booking.timeSlot}\nĐăng ký bởi: ${booking.bookerName} (${booking.department})`;
  } else if (eventType === 'REJECTED') {
    text = `⚠️ THÔNG BÁO TỪ CHỐI ĐẶT PHÒNG HỌP\nCuộc họp: "${booking.title}"\nNgày: ${booking.bookingDate}\nKhung giờ: ${booking.timeSlot}\nLý do từ chối: ${extraReason || booking.notes || 'Thay đổi kế hoạch'}`;
  } else if (eventType === 'CANCELLED') {
    text = `⚠️ THÔNG BÁO HỦY LỊCH HỌP\nCuộc họp: "${booking.title}"\nNgày: ${booking.bookingDate}\nKhung giờ: ${booking.timeSlot}\nPhòng họp: ${booking.roomName}\nĐăng ký bởi: ${booking.bookerName} (${booking.department})`;
  } else if (eventType === 'ROOM_CHANGED') {
    text = `🔄 THÔNG BÁO ĐỔI PHÒNG HỌP\nCuộc họp: "${booking.title}"\nPhòng họp mới: ${booking.roomName}\nNgày: ${booking.bookingDate}\nKhung giờ: ${booking.timeSlot}\nĐăng ký bởi: ${booking.bookerName}`;
  }

  return { isValid: true, messageText: text };
}
