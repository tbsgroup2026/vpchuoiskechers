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
