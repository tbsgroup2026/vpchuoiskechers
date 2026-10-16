/**
 * Helper utilities for Room Booking Date & Time handling
 * Supports Asia/Ho_Chi_Minh (UTC+7) timezone, 12h (SA/CH, AM/PM) and 24h formats.
 */

/**
 * Parses a time string (e.g. "13:30", "01:30 CH", "1:30 PM", "12:00 SA")
 * into total minutes from start of day (0 .. 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleanStr = timeStr.trim().toUpperCase();

  const isCH = cleanStr.includes("CH") || cleanStr.includes("PM");
  const isSA = cleanStr.includes("SA") || cleanStr.includes("AM");

  // Strip AM/PM/SA/CH text
  const timeOnly = cleanStr.replace(/(CH|SA|PM|AM)/g, "").trim();
  const parts = timeOnly.split(":");
  if (parts.length < 2) return 0;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours)) hours = 0;
  if (isNaN(minutes)) return 0;

  if (isCH || isSA) {
    if (isCH && hours < 12) {
      hours += 12;
    } else if (isSA && hours === 12) {
      hours = 0;
    }
  }

  return Math.min(1439, Math.max(0, hours * 60 + minutes));
}

/**
 * Formats minutes from start of day (0..1439) into 24-hour HH:mm string.
 */
export function formatMinutesTo24h(totalMinutes: number): string {
  const safeMins = Math.min(1439, Math.max(0, totalMinutes));
  const h = Math.floor(safeMins / 60);
  const m = safeMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Parses a time slot string e.g. "13:30 - 14:00" or "01:30 CH - 02:00 CH"
 */
export function parseTimeSlot(timeSlot: string): {
  startMinutes: number;
  endMinutes: number;
  startTime24: string;
  endTime24: string;
} {
  if (!timeSlot) {
    return { startMinutes: 0, endMinutes: 60, startTime24: "00:00", endTime24: "01:00" };
  }

  const parts = timeSlot.split("-").map((s) => s.trim());
  const startStr = parts[0] || "08:00";
  const endStr = parts[1] || "09:00";

  const startMinutes = parseTimeToMinutes(startStr);
  let endMinutes = parseTimeToMinutes(endStr);

  if (endMinutes <= startMinutes && parts.length > 1) {
    // If end is less than or equal to start, default to 30 mins after start
    endMinutes = Math.min(1439, startMinutes + 30);
  }

  return {
    startMinutes,
    endMinutes,
    startTime24: formatMinutesTo24h(startMinutes),
    endTime24: formatMinutesTo24h(endMinutes),
  };
}

/**
 * Parses a date string in YYYY-MM-DD or DD/MM/YYYY format into year, month (1-12), day (1-31).
 */
export function parseDateParts(dateStr: string): { year: number; month: number; day: number; isoDate: string; vnDisplayDate: string } {
  if (!dateStr) {
    const now = getVietnamNowParts();
    return {
      year: now.year,
      month: now.month,
      day: now.day,
      isoDate: now.isoDate,
      vnDisplayDate: now.vnDisplayDate,
    };
  }

  const cleanDate = dateStr.trim();
  let y = 2026, m = 1, d = 1;

  if (cleanDate.includes("-")) {
    // YYYY-MM-DD
    const p = cleanDate.split("-");
    y = parseInt(p[0], 10);
    m = parseInt(p[1], 10);
    d = parseInt(p[2], 10);
  } else if (cleanDate.includes("/")) {
    // DD/MM/YYYY
    const p = cleanDate.split("/");
    d = parseInt(p[0], 10);
    m = parseInt(p[1], 10);
    y = parseInt(p[2], 10);
  }

  if (isNaN(y) || y < 2000) y = 2026;
  if (isNaN(m) || m < 1 || m > 12) m = 1;
  if (isNaN(d) || d < 1 || d > 31) d = 1;

  const isoDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const vnDisplayDate = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;

  return { year: y, month: m, day: d, isoDate, vnDisplayDate };
}

/**
 * Returns current date and time parts in Asia/Ho_Chi_Minh (UTC+7) timezone.
 */
export function getVietnamNowParts(referenceDate?: Date): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  isoDate: string; // YYYY-MM-DD
  vnDisplayDate: string; // DD/MM/YYYY
  time24: string; // HH:mm
  totalMinutes: number;
} {
  const target = referenceDate || new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(target);
  const getPart = (type: string) => {
    const found = parts.find((p) => p.type === type);
    return found ? parseInt(found.value, 10) : 0;
  };

  const year = getPart("year") || 2026;
  const month = getPart("month") || 1;
  const day = getPart("day") || 1;
  let hours = getPart("hour");
  if (hours === 24) hours = 0;
  const minutes = getPart("minute") || 0;

  const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const vnDisplayDate = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  const time24 = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return {
    year,
    month,
    day,
    hours,
    minutes,
    isoDate,
    vnDisplayDate,
    time24,
    totalMinutes: hours * 60 + minutes,
  };
}

/**
 * Checks if a meeting booking time has passed in Asia/Ho_Chi_Minh timezone.
 * @param bookingDateStr YYYY-MM-DD or DD/MM/YYYY
 * @param timeSlotStr e.g. "13:30 - 14:00" or "01:30 CH - 02:00 CH"
 * @param gracePeriodMinutes default 5 minutes grace tolerance
 * @param referenceNow optional custom Date object for testing
 */
export function isMeetingTimePassed(
  bookingDateStr: string,
  timeSlotStr: string,
  gracePeriodMinutes = 5,
  referenceNow?: Date
): {
  isPassed: boolean;
  reason?: string;
  meetingStartTimeStr: string;
  nowTimeStr: string;
} {
  const now = getVietnamNowParts(referenceNow);
  const bookingDate = parseDateParts(bookingDateStr);
  const slot = parseTimeSlot(timeSlotStr);

  const meetingStartTimeStr = `${slot.startTime24} ngày ${bookingDate.vnDisplayDate}`;
  const nowTimeStr = `${now.time24} ngày ${now.vnDisplayDate}`;

  // 1. Compare Date: If booking date is in past year/month/day
  if (bookingDate.isoDate < now.isoDate) {
    return {
      isPassed: true,
      reason: `Ngày họp ${bookingDate.vnDisplayDate} đã ở trong quá khứ. Bây giờ là ${nowTimeStr}.`,
      meetingStartTimeStr,
      nowTimeStr,
    };
  }

  // 2. If booking date is in future, it is NOT passed
  if (bookingDate.isoDate > now.isoDate) {
    return {
      isPassed: false,
      meetingStartTimeStr,
      nowTimeStr,
    };
  }

  // 3. Same day: compare start minutes with now + grace tolerance
  // Allowed if meeting start time is >= (current minutes - gracePeriodMinutes)
  if (slot.startMinutes < now.totalMinutes - gracePeriodMinutes) {
    return {
      isPassed: true,
      reason: `Giờ bắt đầu ${slot.startTime24} ngày ${bookingDate.vnDisplayDate} đã qua. Bây giờ là ${now.time24} ngày ${now.vnDisplayDate}.`,
      meetingStartTimeStr,
      nowTimeStr,
    };
  }

  return {
    isPassed: false,
    meetingStartTimeStr,
    nowTimeStr,
  };
}

/**
 * Checks if two time intervals overlap (in minutes from 0..1439).
 * Condition: newStart < existingEnd && newEnd > existingStart
 * Consecutive intervals (e.g. 14:00-15:00 and 15:00-16:00) do NOT overlap.
 */
export function isTimeIntervalOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Checks if two time slot strings overlap.
 * Example: "13:45 - 14:00" and "14:00 - 17:00" -> false
 * Example: "14:30 - 15:00" and "14:00 - 17:00" -> true
 */
export function isSlotOverlapping(slotA: string, slotB: string): boolean {
  const parsedA = parseTimeSlot(slotA);
  const parsedB = parseTimeSlot(slotB);
  return isTimeIntervalOverlapping(
    parsedA.startMinutes,
    parsedA.endMinutes,
    parsedB.startMinutes,
    parsedB.endMinutes
  );
}

export type MeetingRealtimeStatusType = 'UPCOMING' | 'IN_PROGRESS' | 'ENDED' | 'PENDING' | 'CANCELLED';

export interface MeetingStatusResult {
  status: MeetingRealtimeStatusType;
  label: string; // 'Sắp họp' | 'Đang họp' | 'Đã kết thúc' | 'Chờ duyệt' | 'Đã hủy'
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  isOccupyingRoom: boolean; // true if currently IN_PROGRESS
}

/**
 * Determines the real-time meeting status based on Asia/Ho_Chi_Minh current time.
 * - now < start: "Sắp họp"
 * - start <= now < end: "Đang họp"
 * - now >= end: "Đã kết thúc" (no longer occupying room)
 */
export function getMeetingRealtimeStatus(
  meeting: {
    bookingDate?: string;
    date?: string;
    timeSlot?: string;
    status?: string;
  },
  referenceNow?: Date
): MeetingStatusResult {
  const rawStatus = (meeting.status || 'CONFIRMED').toUpperCase();

  if (rawStatus === 'CANCELLED' || rawStatus === 'REJECTED') {
    return {
      status: 'CANCELLED',
      label: 'Đã hủy',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      isOccupyingRoom: false,
    };
  }

  if (rawStatus === 'PENDING' || rawStatus === 'APPROVING') {
    return {
      status: 'PENDING',
      label: 'Chờ duyệt',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      isOccupyingRoom: false,
    };
  }

  if (rawStatus === 'COMPLETED') {
    return {
      status: 'ENDED',
      label: 'Đã trả phòng',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-600',
      badgeBorder: 'border-slate-200',
      isOccupyingRoom: false,
    };
  }

  // Meeting is CONFIRMED: evaluate real-time vs now
  const now = getVietnamNowParts(referenceNow);
  const dateStr = meeting.bookingDate || meeting.date || now.isoDate;
  const bookingDate = parseDateParts(dateStr);
  const slot = parseTimeSlot(meeting.timeSlot || '08:00 - 09:00');

  // Compare dates
  if (bookingDate.isoDate < now.isoDate) {
    return {
      status: 'ENDED',
      label: 'Đã kết thúc',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-600',
      badgeBorder: 'border-slate-200',
      isOccupyingRoom: false,
    };
  }

  if (bookingDate.isoDate > now.isoDate) {
    return {
      status: 'UPCOMING',
      label: 'Sắp họp',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      isOccupyingRoom: false,
    };
  }

  // Same day: compare now.totalMinutes with slot.startMinutes and slot.endMinutes
  if (now.totalMinutes < slot.startMinutes) {
    return {
      status: 'UPCOMING',
      label: 'Sắp họp',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      isOccupyingRoom: false,
    };
  }

  if (now.totalMinutes >= slot.startMinutes && now.totalMinutes < slot.endMinutes) {
    return {
      status: 'IN_PROGRESS',
      label: 'Đang họp',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-[#006838]',
      badgeBorder: 'border-emerald-200',
      isOccupyingRoom: true,
    };
  }

  // now >= endMinutes
  return {
    status: 'ENDED',
    label: 'Đã kết thúc',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
    isOccupyingRoom: false,
  };
}

export interface RoomRealtimeStatusResult {
  isLocked: boolean;
  isOccupiedNow: boolean;
  currentMeeting: any | null;
  nextMeeting: any | null;
  freeUntil: string | null; // e.g. "14:00"
  badgeText: string;
  badgeSubText: string;
  statusKind: 'LOCKED' | 'OCCUPIED' | 'AVAILABLE';
}

/**
 * Returns the real-time status of a room, looking at confirmed bookings for today.
 */
export function getRoomRealtimeStatus(
  room: { id: string; name: string; isLocked?: boolean; status?: string },
  bookings: any[],
  referenceNow?: Date
): RoomRealtimeStatusResult {
  if (room.isLocked || room.status === 'MAINTENANCE') {
    return {
      isLocked: true,
      isOccupiedNow: false,
      currentMeeting: null,
      nextMeeting: null,
      freeUntil: null,
      badgeText: '🔒 Khóa bảo trì',
      badgeSubText: 'Tạm ngưng phục vụ',
      statusKind: 'LOCKED',
    };
  }

  const now = getVietnamNowParts(referenceNow);

  // Filter confirmed bookings for this room today
  const roomBookingsToday = (bookings || []).filter((b) => {
    if (b.status !== 'CONFIRMED') return false;
    const matchId = b.roomId === room.id;
    const matchName =
      b.roomName &&
      (b.roomName.toLowerCase() === room.name.toLowerCase() ||
        room.name.toLowerCase().includes(b.roomName.toLowerCase()) ||
        b.roomName.toLowerCase().includes(room.name.toLowerCase()));
    if (!matchId && !matchName) return false;

    const bDate = parseDateParts(b.bookingDate || b.date);
    return bDate.isoDate === now.isoDate;
  });

  // Find meeting currently IN_PROGRESS
  let currentMeeting: any | null = null;
  const upcomingMeetings: Array<{ booking: any; startMinutes: number; startTime24: string }> = [];

  for (const b of roomBookingsToday) {
    const statusRes = getMeetingRealtimeStatus(b, referenceNow);
    if (statusRes.status === 'IN_PROGRESS') {
      currentMeeting = b;
    } else if (statusRes.status === 'UPCOMING') {
      const slot = parseTimeSlot(b.timeSlot);
      upcomingMeetings.push({
        booking: b,
        startMinutes: slot.startMinutes,
        startTime24: slot.startTime24,
      });
    }
  }

  // Sort upcoming meetings by start time
  upcomingMeetings.sort((a, b) => a.startMinutes - b.startMinutes);
  const nextMeetingObj = upcomingMeetings[0] || null;
  const nextMeeting = nextMeetingObj ? nextMeetingObj.booking : null;
  const freeUntil = nextMeetingObj ? nextMeetingObj.startTime24 : null;

  if (currentMeeting) {
    const slot = parseTimeSlot(currentMeeting.timeSlot);
    return {
      isLocked: false,
      isOccupiedNow: true,
      currentMeeting,
      nextMeeting,
      freeUntil: null,
      badgeText: '⏳ Đang họp',
      badgeSubText: `Đến ${slot.endTime24}`,
      statusKind: 'OCCUPIED',
    };
  }

  return {
    isLocked: false,
    isOccupiedNow: false,
    currentMeeting: null,
    nextMeeting,
    freeUntil,
    badgeText: '✓ Phòng trống',
    badgeSubText: freeUntil ? `Trống đến ${freeUntil}` : 'Trống cả ngày',
    statusKind: 'AVAILABLE',
  };
}

/**
 * Checks if a room is available for a requested slot on a target date.
 * Blocks if requested slot overlaps with an existing CONFIRMED booking for that room on that date:
 * Overlap condition: newStart < existingEnd && newEnd > existingStart.
 */
export function isRoomAvailableForSlot(
  roomId: string,
  targetDateStr: string,
  targetSlotStr: string,
  bookings: any[],
  excludeBookingId?: string
): { isAvailable: boolean; conflictBooking?: any; reason?: string } {
  const targetDate = parseDateParts(targetDateStr);
  const targetSlot = parseTimeSlot(targetSlotStr);

  for (const b of bookings || []) {
    if (excludeBookingId && b.id === excludeBookingId) continue;
    if (b.status === 'CANCELLED' || b.status === 'COMPLETED') continue;
    if (b.status !== 'CONFIRMED') continue;

    // Room match check
    if (b.roomId && b.roomId !== roomId) continue;

    const bDate = parseDateParts(b.bookingDate || b.date);
    if (bDate.isoDate !== targetDate.isoDate) continue;

    const bSlot = parseTimeSlot(b.timeSlot);
    const overlaps = isTimeIntervalOverlapping(
      targetSlot.startMinutes,
      targetSlot.endMinutes,
      bSlot.startMinutes,
      bSlot.endMinutes
    );

    if (overlaps) {
      return {
        isAvailable: false,
        conflictBooking: b,
        reason: `Trùng với cuộc họp "${b.title || b.purpose || 'Đã có lịch'}" (${bSlot.startTime24} - ${bSlot.endTime24}) của ${b.bookerName || b.userName || 'người khác'}.`,
      };
    }
  }

  return { isAvailable: true };
}

/**
 * Returns all confirmed busy slots for a given room and date.
 */
export function getOccupiedSlotsForRoom(
  roomId: string,
  targetDateStr: string,
  bookings: any[]
): Array<{
  id: string;
  timeSlot: string;
  startTime24: string;
  endTime24: string;
  startMinutes: number;
  endMinutes: number;
  title: string;
  bookerName: string;
}> {
  const targetDate = parseDateParts(targetDateStr);
  const result: Array<{
    id: string;
    timeSlot: string;
    startTime24: string;
    endTime24: string;
    startMinutes: number;
    endMinutes: number;
    title: string;
    bookerName: string;
  }> = [];

  for (const b of bookings || []) {
    if (b.status !== 'CONFIRMED') continue;
    if (b.roomId && b.roomId !== roomId) continue;

    const bDate = parseDateParts(b.bookingDate || b.date);
    if (bDate.isoDate !== targetDate.isoDate) continue;

    const slot = parseTimeSlot(b.timeSlot);
    result.push({
      id: b.id,
      timeSlot: `${slot.startTime24} - ${slot.endTime24}`,
      startTime24: slot.startTime24,
      endTime24: slot.endTime24,
      startMinutes: slot.startMinutes,
      endMinutes: slot.endMinutes,
      title: b.title || b.purpose || 'Cuộc họp',
      bookerName: b.bookerName || b.userName || '',
    });
  }

  result.sort((a, b) => a.startMinutes - b.startMinutes);
  return result;
}

